import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Riff",
  description: "A private essay-sharing platform for creative minds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
