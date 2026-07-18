const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 2_400_000;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface PreparedPhotoEvidence {
  dataUrl: string;
  mimeType: "image/jpeg";
  originalName: string;
}

export async function preparePhotoEvidence(
  file: File,
): Promise<PreparedPhotoEvidence> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("unsupported_photo_type");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("photo_too_large");
  }

  const bitmap = await createImageBitmap(file);
  try {
    let dataUrl = await renderJpeg(bitmap, 1_280, 0.78);
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      dataUrl = await renderJpeg(bitmap, 960, 0.68);
    }
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      throw new Error("compressed_photo_too_large");
    }
    return { dataUrl, mimeType: "image/jpeg", originalName: file.name };
  } finally {
    bitmap.close();
  }
}

async function renderJpeg(
  bitmap: ImageBitmap,
  maxDimension: number,
  quality: number,
): Promise<string> {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("photo_canvas_unavailable");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("photo_encode_failed"))),
      "image/jpeg",
      quality,
    );
  });
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("photo_read_failed"));
    reader.onerror = () => reject(new Error("photo_read_failed"));
    reader.readAsDataURL(blob);
  });
}
