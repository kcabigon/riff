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
  title: {
    default: "Riff",
    template: "%s | Riff",
  },
  description:
    "A private essay-sharing platform for creative communities. Write, share, and read essays with the people you trust.",
  metadataBase: new URL("https://letsriff.app"),
  openGraph: {
    title: "Riff",
    description: "Write with friends.",
    url: "https://letsriff.app",
    siteName: "Riff",
    locale: "en_US",
    type: "website",
    images: [{ url: "/images/Riff_OG_image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Riff",
    description: "Write with friends.",
    images: ["/images/Riff_OG_image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
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
