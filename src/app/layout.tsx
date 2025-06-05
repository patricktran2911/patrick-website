import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import bg_thumbnail from "images/background-thumbnail.png";
import Navbar from "@/reusable-components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Patrick Tran - Software Engineer",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  description: "Portfolio and blog of Patrick Tran, Software Engineer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative max-h-screen max-w-dvw`}
      >
        {/* Background video */}
        <video
          className="absolute -z-10 w-full h-full object-cover bg-amber-50"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster={bg_thumbnail.src}
        >
          <source src={"/assets/videos/bg-video1.webm"} type="video/webm" />
          <source src={"/assets/videos/bg-video1.mp4"} type="video/mp4" />
        </video>

        <div className="absolute inset-0 -z-1 bg-black/70" />

        {/* Main layout */}
        <div className="flex flex-col h-screen w-full z-20 ">
          <Navbar />

          {/* Main content */}
          <main className="flex-1 overflow-auto">{children}</main>

          {/* Sticky footer */}
        </div>
        <footer className="absolute bottom-0 w-full text-center text-white bg-gradient-to-l from-black to-transparent text-sm md:text-lg lg:text-xl p-4">
          © {new Date().getFullYear()} Patrick Tran. Built with NextJS,
          TypeScript, TailwindCSS.
        </footer>
      </body>
    </html>
  );
}
