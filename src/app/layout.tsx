import type { Metadata } from "next";
import {
  Playfair_Display,
  DM_Sans,
  DM_Serif_Text,
  Over_the_Rainbow,
  Roboto_Slab,
  Montserrat,
  Inter,
  Source_Code_Pro,
} from "next/font/google";
import EnvironmentBadge from "@/components/shared/EnvironmentBadge";
import NowPlayingWrapper from "@/components/NowPlayingWrapper";
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

// Editor-selectable fonts (font picker in the write toolbar). Only used inside
// the editor, so preload: false keeps them off the critical path on other routes —
// they load on demand when the editor renders text in them.
const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto-slab",
  display: "swap",
  preload: false,
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-source-code-pro",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://letsriff.app"),
  title: {
    default: "Riff",
    template: "%s | Riff",
  },
  description: "Write clubs for friends",
  icons: {
    icon: [
      {
        url: "/favicon-32x32-light.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-16x16-light.png",
        sizes: "16x16",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Riff",
    description: "Write clubs for friends",
    url: "https://letsriff.app",
    siteName: "Riff",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Riff",
    description: "Write clubs for friends",
    images: ["/og-image.png"],
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
        className={`antialiased ${playfair.variable} ${dmSans.variable} ${dmSerifText.variable} ${overTheRainbow.variable} ${robotoSlab.variable} ${montserrat.variable} ${inter.variable} ${sourceCodePro.variable}`}
      >
        <NowPlayingWrapper>
          {children}
          <EnvironmentBadge />
        </NowPlayingWrapper>
      </body>
    </html>
  );
}
