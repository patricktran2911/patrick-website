"use client";

import { Metadata } from "next";

const metadata: Metadata = {
  title: "Projects | Patrick Tran",
  description:
    "Explore the projects of Patrick Tran, a Software Engineer with expertise in iOS, full-stack development, and AI systems.",
};

export default function Projects() {
  return (
    <div className="flex-col bg-none text-gray-900 h-full justify-items-center-safe pb-50 font-sans">
      <header className="bg-transparent text-white pt-2 pb-10 px-8 text-center overflow-hidden">
        <h1 className="text-5xl font-extrabold mb-4">My Projects</h1>
        <p className="text-xl max-w-3xl mx-auto font-light">
          A showcase of my work, including web applications, mobile apps, and
          AI-driven systems.
        </p>
      </header>

      <main className="flex-col bg-gray-300 hover:opacity-100 opacity-90 px-8 py-10 w-1/2 transition-opacity duration-300">
        <section>
          <h2
            className="xs:text-xs md:text-sm 2xl:text-lg xxl:text-xl font-bold py-6 animate-bounce"
            style={{
              transform: "translateY(160%)",
              transition: "transform 3s ease-in-out",
            }}
          >
            Coming Soon...
          </h2>
          {/* Add your project cards or details here */}
        </section>
      </main>
    </div>
  );
}
