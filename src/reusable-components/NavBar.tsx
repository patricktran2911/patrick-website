"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const routes = [
  { path: "/about", label: "About" },
  { path: "/projects", label: "Projects" },
  { path: "/my-skills", label: "Skills" },
  { path: "/resume", label: "Resume" },
  { path: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 glass-light">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Link
            href="/"
            className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight"
          >
            Patrick Tran
          </Link>
        </motion.div>

        {/* Mobile toggle */}
        <motion.button
          className="lg:hidden text-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          whileTap={{ scale: 0.9 }}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-1">
          {routes.map((route) => {
            const isActive = pathname === route.path;
            return (
              <li key={route.path}>
                <Link
                  href={route.path}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-indigo-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
                  }`}
                >
                  {route.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-indigo-50 -z-10"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden border-t border-gray-200/50"
          >
            <ul className="flex flex-col px-6 py-3 gap-1">
              {routes.map((route, i) => {
                const isActive = pathname === route.path;
                return (
                  <motion.li
                    key={route.path}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={route.path}
                      onClick={() => setMenuOpen(false)}
                      className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-gray-600 hover:bg-gray-100/60 hover:text-gray-900"
                      }`}
                    >
                      {route.label}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
