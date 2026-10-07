import type { Metadata, Viewport } from "next";
import { Jua, M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

// Rounded gothic in the spirit of Gulim; Jua covers Hangul in pet names.
const round = M_PLUS_Rounded_1c({
  weight: ["500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-round",
});
const korean = Jua({ weight: "400", subsets: ["latin"], variable: "--font-kr" });

export const metadata: Metadata = {
  title: "Tibu",
  description: "Turn your pet into a sticker and collect pets from around the world.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#bfe3ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${round.variable} ${korean.variable}`}>
      <body>
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
