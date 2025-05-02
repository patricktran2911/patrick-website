import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
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
    apple: "/apple-touch-icon.png",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative max-h-dvh max-w-dvw`}
      >
        {/* Background video */}
        <video
          className="absolute -z-10 w-full h-full object-cover bg-amber-50"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fG1vYmlsZXxlbnwwfHx8fDE2OTI3NzQ5NTg&ixlib=rb-4.0.3&q=80&w=1080"
        >
          <source src={"/Assets/videos/bg-video1.mp4"} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Main layout */}
        <div className="flex flex-col h-screen w-full sm:space-y-3 lg:space-y-4 ">
          <Navbar />

          {/* Main content */}
          <main className="flex-grow">{children}</main>

          {/* Sticky footer */}
          <footer className="w-full text-center text-white bg-gradient-to-l from-black to-transparent text-sm md:text-lg lg:text-xl p-4">
            © {new Date().getFullYear()} Patrick Tran. Built with NextJS,
            TypeScript, TailwindCSS.
          </footer>
        </div>
      </body>
    </html>
  );
}
