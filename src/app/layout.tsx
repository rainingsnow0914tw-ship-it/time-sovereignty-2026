import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Time Sovereignty — AI Chief of Staff",
  description:
    "Turn one meaningful goal into a protected plan, a clear next action, and support that adapts to real life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
