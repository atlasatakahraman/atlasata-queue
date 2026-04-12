import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const adwaitaSans = localFont({
  variable: "--font-adwaita-sans",
  src: "../../fonts/AdwaitaSans-Regular.woff2"
})

const adwaitaMono = localFont({
  variable: "--font-adwaita-mono",
  src: "../../fonts/AdwaitaMono-Regular.woff2"
})

export const metadata: Metadata = {
  title: "AtlasAta Queue — Şamata 5v5 Lobby Yönetimi",
  description:
    "League of Legends Şamata (ARAM Mayhem) 5v5 özel lobi yönetim paneli. Kick canlı yayın sohbetinden sıraya katılın.",
  keywords: [
    "League of Legends",
    "ARAM",
    "Şamata",
    "Queue",
    "Lobby",
    "Kick",
    "atlasata",
  ],
  authors: [{ name: "atlasata", url: "https://github.com/atlasatakahraman" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${adwaitaSans.variable} ${adwaitaMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
