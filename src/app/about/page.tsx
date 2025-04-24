import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Patrick Tran",
  description:
    "About Patrick Tran, Software Engineer with experience in full-stack development, mobile apps, and AI solutions.",
};

export default function About() {
  return (
    <div className="bg-none text-gray-900 font-sans">
      <header className="bg-transparent text-white pt-2 pb-10 px-8 text-center overflow-hidden">
        <h1 className="text-5xl font-extrabold mb-4">About Me</h1>
        <p className="text-xl max-w-3xl mx-auto font-light">
          I'm Patrick Tran, a Software Engineer driven by curiosity and a love
          for elegant, practical code. My work spans mobile development,
          full-stack applications, and intelligent systems powered by computer
          vision and AI.
        </p>
      </header>

      <main className="bg-gray-300 hover:opacity-100 opacity-90 px-8 py-20 max-w-5xl mx-auto space-y-16 transition-opacity duration-300">
        <section>
          <h2 className="text-3xl font-bold mb-4">My Journey</h2>
          <ul className="space-y-6">
            <li>
              <strong>2025–Present:</strong> Full-Stack Developer @ NeuroSpring
              – Built a camera streaming platform for ambulances using React,
              FastAPI, OpenCV, and MediaPipe.
            </li>
            <li>
              <strong>2023–2024:</strong> iOS Developer @ FANFLY – Designed
              modular iOS components to speed up feature development.
            </li>
            <li>
              <strong>2023:</strong> iOS Intern @ Scoop Inc – Collaborated on
              SwiftUI/UIKit interfaces, and integrated REST APIs.
            </li>
            <li>
              <strong>2022–Present:</strong> CS Student @ California State
              University, Sacramento – Focused on AI, full-stack, and systems
              design.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-4">Tech Stack</h2>
          <p>Here’s what I use daily and love working with:</p>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 list-disc list-inside">
            <li>React / Next.js</li>
            <li>TypeScript / JavaScript</li>
            <li>Swift (SwiftUI, UIKit)</li>
            <li>FastAPI / Node.js</li>
            <li>Python / OpenCV / MediaPipe</li>
            <li>SQL / NoSQL / Supabase</li>
          </ul>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-4">Beyond the Code</h2>
          <p>
            Outside of development, I enjoy building PCs, exploring local
            trails, sipping hot tea while reading, and vibing to US-UK music. I
            believe a balanced life fuels better creativity and solutions.
          </p>
        </section>
      </main>
    </div>
  );
}
