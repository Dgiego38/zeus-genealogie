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
  title: "Zeus Généalogie",
  description: "Explorez vos racines avec Zeus, l'assistant IA spécialisé dans l'analyse de fichiers GEDCOM et la recherche généalogique avancée.",
  keywords: ["généalogie", "IA", "GEDCOM", "recherche ancêtres", "Zeus Généalogie", "archives"],
  authors: [{ name: "Diego Grenados" }],
  openGraph: {
    title: "Zeus Généalogie",
    description: "L'assistant IA pour vos recherches généalogiques.",
    type: "website",
  },
  verification: {
    google: '5MVt-6tV7IW6Vj161F6AIV45iArc_9TkftLW_Mh5xdw',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr" // Changé en 'fr' pour le référencement local
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">
        {children}
      </body>
    </html>
  );
}