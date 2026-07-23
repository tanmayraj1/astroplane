import type { Metadata, Viewport } from "next";
import {
  Playfair_Display,
  Cormorant_Garamond,
  Hanken_Grotesk,
} from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Astroplane — the daily planner that knows your sky",
    template: "%s · Astroplane",
  },
  description:
    "Wake windows, power hours, tarot and gentle nudges — cast fresh from your birth chart every morning. A daily planner guided by your chart.",
  applicationName: "Astroplane",
  appleWebApp: {
    capable: true,
    title: "Astroplane",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Astroplane — your day, already written in the stars",
    description:
      "The only planner where your calendar, your mood and your cosmos live on one screen.",
    siteName: "Astroplane",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#EAE1CC",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${playfair.variable} ${cormorant.variable} ${hanken.variable} min-h-full antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
