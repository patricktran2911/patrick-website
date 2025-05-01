"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const containerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const sectionsVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="flex z-50 px-8 py-6 justify-between items-center border-b text-black border-gray-200 opacity-80 hover:opacity-100 bg-white backdrop-blur-sm transition-all duration-300 relative">
      <motion.div className="sm:text-lg lg:text-2xl font-bold">
        <Link href="/">Patrick Tran</Link>
      </motion.div>

      <motion.button
        className="lg:hidden"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>

      <ul className="hidden lg:flex space-x-6 sm:text-sm lg:text-lg">
        {["about", "projects", "my-skills", "resume", "contact"].map(
          (route) => (
            <motion.li key={route}>
              <a
                href={`/${route}`}
                className="cursor-pointer hover:text-blue-500 transition-colors"
              >
                {route === "my-skills"
                  ? "Skills"
                  : route.charAt(0).toUpperCase() + route.slice(1)}
              </a>
            </motion.li>
          )
        )}
      </ul>

      <AnimatePresence>
        {menuOpen && (
          <motion.ul
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute top-full left-0 w-full bg-white border-t border-gray-200 flex flex-col items-start px-8 py-4 space-y-4 lg:hidden sm:text-base text-sm z-40 shadow-md rounded-b-xl"
          >
            {["about", "projects", "my-skills", "resume", "contact"].map(
              (route) => (
                <motion.li key={route} variants={sectionsVariants}>
                  <Link
                    href={`/${route}`}
                    className="cursor-pointer hover:text-blue-500 transition-colors block"
                    onClick={() => setMenuOpen(false)}
                  >
                    {route === "my-skills"
                      ? "Skills"
                      : route.charAt(0).toUpperCase() + route.slice(1)}
                  </Link>
                </motion.li>
              )
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </nav>
  );
}
