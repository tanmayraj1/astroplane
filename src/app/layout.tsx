import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
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
    <html
      lang="en"
      className={`${fraunces.variable} ${jakarta.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        {children}
      </body>
    </html>
  );
}
