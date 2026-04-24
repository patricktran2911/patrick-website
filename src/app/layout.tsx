import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/reusable-components/NavBar";
import FloatingChat from "@/reusable-components/FloatingChat";
import FloatingMusicPlayer from "@/reusable-components/FloatingMusicPlayer";
import { getSiteContent } from "@/lib/site-content";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { global } = await getSiteContent();

  return {
    title: global.siteTitle,
    description: global.siteDescription,
    icons: {
      icon: global.favicon,
      shortcut: global.favicon,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await getSiteContent();
  const { global } = content;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} relative max-h-screen max-w-dvw antialiased`}
      >
        <video
          className="fixed inset-0 -z-10 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster={global.backgroundVideo.poster}
        >
          <source src={global.backgroundVideo.webm} type="video/webm; codecs=vp9" />
          <source src={global.backgroundVideo.mp4} type="video/mp4; codecs=avc1.4D401E" />
        </video>

        <div className="fixed inset-0 -z-1 bg-black/70" />

        <div className="z-20 flex h-screen w-full flex-col">
          <Navbar brandName={global.brandName} routes={global.navigation} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
        <FloatingMusicPlayer content={content.music} />
        <FloatingChat content={content.chat} />
      </body>
    </html>
  );
}
