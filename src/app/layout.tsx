import type { Metadata } from "next";
import { Manrope, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: { default: "HGC Demandas", template: "%s · HGC Demandas" },
  description: "Acompanhamento de solicitações e entregas da HGC.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  );
}
