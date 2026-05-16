import type { Metadata } from "next";
import {
  Playfair_Display,
  DM_Sans,
  DM_Serif_Text,
  Over_the_Rainbow,
} from "next/font/google";
import EnvironmentBadge from "@/components/shared/EnvironmentBadge";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmSerifText = DM_Serif_Text({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-serif-text",
  display: "swap",
});

const overTheRainbow = Over_the_Rainbow({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-over-the-rainbow",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Riff",
  description: "A private essay-sharing platform for creative minds",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased ${playfair.variable} ${dmSans.variable} ${dmSerifText.variable} ${overTheRainbow.variable}`}
      >
        {children}
        <EnvironmentBadge />
      </body>
    </html>
  );
}
