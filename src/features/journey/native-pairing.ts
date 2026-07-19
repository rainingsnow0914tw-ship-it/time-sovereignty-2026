const NATIVE_PAIRING_SCHEME = "timesovereignty-private:";

export function buildNativePairingUri(ticket: string): string {
  const normalized = ticket.trim();
  if (normalized.length < 32 || normalized.length > 500) {
    throw new Error("Native pairing ticket is invalid.");
  }
  const uri = new URL(`${NATIVE_PAIRING_SCHEME}//pair`);
  uri.searchParams.set("ticket", normalized);
  return uri.toString();
}
