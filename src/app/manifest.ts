import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Time Sovereignty — AI Chief of Staff",
    short_name: "Time Sovereignty",
    description:
      "A longitudinal AI Chief of Staff that protects a chosen goal through check-ins, recovery, progress, memory, and adaptation.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#173f35",
    orientation: "portrait-primary",
  };
}
