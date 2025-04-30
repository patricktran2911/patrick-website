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

interface Section {
  title: string;
  icons: [Icon: IconType, name: string][];
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const sections: Section[] = [
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
      [SiJavascript, "Java"],
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
      [SiJavascript, "VSCode"],
      [SiJira, "Jira"],
    ],
  },
];

export default function Skills() {
  return (
    <div className="flex flex-col space-y-8 w-full h-full text-gray-900 font-sans">
      <header className="flex flex-col space-y-8 bg-transparent text-white text-center overflow-hidden py-8">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-extrabold mb-4"
        >
          My Skills
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text:lg lg:text-xl max-w-3xl mx-auto font-light"
        >
          A collection of tools, languages, and technologies I’ve mastered to
          build responsive web apps, intelligent systems, and seamless mobile
          experiences.
        </motion.p>
      </header>

      <main className="bg-gray-300 hover:opacity-100 opacity-90 px-8 py-4 w-full md:w-3/4 lg:w-1/2 min-w-64 mx-auto space-y-8 transition-opacity duration-300">
        {sections.map(({ title, icons }) => (
          <motion.section
            key={title}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold py-6">
              {title}
            </h2>
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-2 text-sm md:text-base lg:text-lg"
            >
              {icons.map(([Icon, name]) => (
                <motion.div
                  key={name}
                  variants={itemVariants}
                  className="flex items-center gap-2"
                >
                  <Icon /> {name}
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        ))}
      </main>
    </div>
  );
}
