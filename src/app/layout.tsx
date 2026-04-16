import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SecretTrad — Traducteur & Langage secret",
  description:
    "Traduis du texte dans n'importe quelle langue, ou utilise notre langage secret personnel. Rapide, simple, et disponible partout.",
  openGraph: {
    title: "SecretTrad — Traducteur & Langage secret",
    description:
      "Traduis du texte dans n'importe quelle langue, ou utilise notre langage secret personnel. Rapide, simple, et disponible partout.",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary",
    title: "SecretTrad — Traducteur & Langage secret",
    description:
      "Traduis du texte dans n'importe quelle langue, ou utilise notre langage secret personnel.",
  },
  keywords: ["traducteur", "langage secret", "traduction", "chiffrement", "code secret"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
