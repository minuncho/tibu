import type { Metadata, Viewport } from "next";
import { Jua, M_PLUS_Rounded_1c } from "next/font/google";
import { InAppBrowser } from "@/components/InAppBrowser";
import "./globals.css";

// Rounded gothic in the spirit of Gulim; Jua covers Hangul in pet names.
const round = M_PLUS_Rounded_1c({
  weight: ["500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-round",
});
const korean = Jua({ weight: "400", subsets: ["latin"], variable: "--font-kr" });

// Absolute base for the link-preview image. On Vercel this is the production domain.
const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";
const DESCRIPTION = "Turn your pet into a sticker and collect pets from around the world.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Tibu",
  description: DESCRIPTION,
  openGraph: { title: "Tibu", description: DESCRIPTION, siteName: "Tibu", type: "website" },
  twitter: { card: "summary_large_image", title: "Tibu", description: DESCRIPTION },
  other: { google: "notranslate" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#bfe3ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // translate="no": the app is English only, and browser auto-translation (Papago in the
    // Naver app, Chrome) mangles the short button labels ("Home" became "집입니다").
    <html lang="en" translate="no" className={`notranslate ${round.variable} ${korean.variable}`}>
      <body>
        <InAppBrowser />
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
