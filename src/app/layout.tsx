import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen`}
      >
        {/* Background video */}
        <video
          className="absolute -z-10 w-full h-full object-cover bg-amber-50"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fG1vYmlsZXxlbnwwfHx8fDE2OTI3NzQ5NTg&ixlib=rb-4.0.3&q=80&w=1080"
        >
          <source src={"/Assets/videos/bg-video1.mp4"} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Main layout */}
        <div className="flex flex-col h-screen w-full sm:space-y-3 lg:space-y-4 ">
          {/*Navbar*/}
          <nav className="flex z-50 px-8 py-6 justify-between items-center border-b text-black border-gray-200 opacity-80 hover:opacity-100 bg-white backdrop-blur-sm transition-all duration-300">
            <div className="sm:text-lg lg:text-2xl font-bold">
              <Link href="/">Patrick Tran</Link>
            </div>
            <ul className="flex space-x-6 sm:text-sm lg:text-lg">
              <Link
                href="/about"
                className="cursor-pointer hover:text-blue-500 transition-colors"
              >
                About
              </Link>
              <Link
                href="/projects"
                className="cursor-pointer hover:text-blue-500 transition-colors"
              >
                Projects
              </Link>
              <Link
                href="/my-skills"
                className="cursor-pointer hover:text-blue-500 transition-colors"
              >
                Skills
              </Link>
              <Link
                href="/resume"
                className="cursor-pointer hover:text-blue-500 transition-colors"
              >
                Resume
              </Link>
              <Link
                href="/contact"
                className="cursor-pointer hover:text-blue-500 transition-colors"
              >
                Contact
              </Link>
            </ul>
          </nav>

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
