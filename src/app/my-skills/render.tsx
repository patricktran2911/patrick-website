"use client";

import { motion } from "framer-motion";
import { IconType } from "react-icons";
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
import PageWrapper from "@/reusable-components/PageWrapper";

interface SkillSection {
  title: string;
  icons: [IconType, string][];
}

const sections: SkillSection[] = [
  {
    title: "Languages & Frameworks",
    icons: [
      [SiJavascript, "JavaScript"],
      [SiTypescript, "TypeScript"],
      [SiReact, "React"],
      [SiNextdotjs, "Next.js"],
      [SiSwift, "Swift (SwiftUI/UIKit)"],
      [SiPython, "Python"],
      [SiCplusplus, "C++"],
      [SiNodedotjs, "Node.js"],
      [SiFastapi, "FastAPI"],
    ],
  },
  {
    title: "Databases & Cloud",
    icons: [
      [SiPostgresql, "SQL"],
      [SiMongodb, "NoSQL"],
      [SiSupabase, "Supabase"],
      [SiAmazon, "AWS (S3, Amplify)"],
    ],
  },
  {
    title: "Tools & Design",
    icons: [
      [SiGithub, "Git / GitHub"],
      [SiFigma, "Figma"],
      [SiXcode, "Xcode"],
      [SiJira, "Jira"],
    ],
  },
];

export default function Skills() {
  return (
    <PageWrapper className="min-h-full">
      {/* Header */}
      <header className="text-center px-6 pt-12 pb-8">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="text-4xl sm:text-5xl font-extrabold text-white mb-4"
        >
          My Skills
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-white/70 max-w-2xl mx-auto font-light"
        >
          Tools, languages, and technologies I use to build responsive web apps,
          intelligent systems, and seamless mobile experiences.
        </motion.p>
      </header>

      {/* Skill sections */}
      <div className="max-w-4xl mx-auto px-6 pb-20 space-y-8">
        {sections.map((section, sIdx) => (
          <motion.section
            key={section.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: sIdx * 0.1 }}
            className="glass rounded-2xl p-8"
          >
            <h2 className="text-xl font-bold text-white mb-6">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {section.icons.map(([Icon, label], iIdx) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: iIdx * 0.05 }}
                  whileHover={{ y: -4, scale: 1.05 }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <Icon className="w-8 h-8 text-indigo-400" />
                  <span className="text-xs text-white/70 text-center font-medium">
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </PageWrapper>
  );
}
