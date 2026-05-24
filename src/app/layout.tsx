import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const anthropicSans = localFont({
  variable: "--font-anthropic-sans",
  src: [
    {
      path: "./fonts/Anthropic-Sans-Regular-Web.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Anthropic-Sans-Regular-Italic-Web.woff2",
      weight: "400",
      style: "italic",
    },
  ],
});

const anthropicSerif = localFont({
  variable: "--font-anthropic-serif",
  src: [
    {
      path: "./fonts/Anthropic-Serif-Regular-Web.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Anthropic-Seris-Regular-Italic-Web.woff2",
      weight: "400",
      style: "italic",
    },
  ],
});

const anthropicMono = localFont({
  variable: "--font-anthropic-mono",
  src: [
    {
      path: "./fonts/Anthropic-Mono-Variable-Regular.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/Anthropic-Mono-Variable-Regular-Italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
});

export const metadata: Metadata = {
  title: "TheAtlas — Queue",
  description:
    "League of Legends Şamata (ARAM Mayhem) 5v5 özel lobi yönetim paneli. Kick canlı yayın sohbetinden sıraya katılın.",
  keywords: [
    "League of Legends",
    "ARAM",
    "Şamata",
    "Queue",
    "Lobby",
    "Kick",
    "Atlas Ata KAHRAMAN",
    "TheAtlas",
  ],
  authors: [
    { name: "Atlas Ata KAHRAMAN", url: "https://github.com/atlasatakahraman" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${anthropicSans.variable} ${anthropicSerif.variable} ${anthropicMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
