import { Metadata } from "next";
import {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiNextdotjs,
  SiSwift,
  SiPython,
  SiCplusplus,
  SiNodedotjs,
  SiFastapi,
  SiSupabase,
  SiPostgresql,
  SiMongodb,
  SiGithub,
  SiFigma,
  SiXcode,
  SiJira,
  SiAmazon,
} from "react-icons/si";

export const metadata: Metadata = {
  title: "Skills | Patrick Tran",
  description:
    "Explore Patrick Tran's technical skills across full-stack development, mobile engineering, and AI-powered systems.",
};

export default function Skills() {
  return (
    <div className="bg-none text-gray-900 h-full font-sans">
      <header className="bg-transparent text-white py-24 px-8 text-center overflow-hidden">
        <h1 className="text-5xl font-extrabold mb-4">My Skills</h1>
        <p className="text-xl max-w-3xl mx-auto font-light">
          A collection of tools, languages, and technologies I’ve mastered to
          build responsive web apps, intelligent systems, and seamless mobile
          experiences.
        </p>
      </header>

      <main className="flex-col bg-gray-300 hover:opacity-100 opacity-90 px-8 py-20 mx-44 space-y-20 transition-opacity duration-300">
        <section>
          <h2 className="md:text-sm lg:text-xl 2xl:text-3xl font-bold mb-6">
            Languages & Frameworks
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-lg">
            <div className="flex items-center gap-2">
              <SiJavascript /> JavaScript
            </div>
            <div className="flex items-center gap-2">
              <SiTypescript /> TypeScript
            </div>
            <div className="flex items-center gap-2">
              <SiReact /> React
            </div>
            <div className="flex items-center gap-2">
              <SiNextdotjs /> Next.js
            </div>
            <div className="flex items-center gap-2">
              <SiSwift /> Swift (SwiftUI/UIKit)
            </div>
            <div className="flex items-center gap-2">
              <SiPython /> Python
            </div>
            <div className="flex items-center gap-2">
              <SiCplusplus /> C++
            </div>
            <div className="flex items-center gap-2">
              <SiJavascript /> Java
            </div>
            <div className="flex items-center gap-2">
              <SiNodedotjs /> Node.js
            </div>
            <div className="flex items-center gap-2">
              <SiFastapi /> FastAPI
            </div>
          </div>
        </section>

        <section>
          <h2 className="md:text-sm lg:text-xl 2xl:text-3xl font-bold mb-6">
            Databases & Cloud
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-lg">
            <div className="flex items-center gap-2">
              <SiPostgresql /> SQL
            </div>
            <div className="flex items-center gap-2">
              <SiMongodb /> NoSQL
            </div>
            <div className="flex items-center gap-2">
              <SiSupabase /> Supabase
            </div>
            <div className="flex items-center gap-2">
              <SiAmazon /> AWS (S3, Amplify)
            </div>
          </div>
        </section>

        <section>
          <h2 className="md:text-sm lg:text-xl 2xl:text-3xl font-bold mb-6">
            Tools & Design
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-lg">
            <div className="flex items-center gap-2">
              <SiGithub /> Git / GitHub
            </div>
            <div className="flex items-center gap-2">
              <SiFigma /> Figma
            </div>
            <div className="flex items-center gap-2">
              <SiXcode /> Xcode
            </div>
            <div className="flex items-center gap-2">VSCode</div>
            <div className="flex items-center gap-2">
              <SiJira /> Jira
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
