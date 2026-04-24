"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import type { NavigationItem } from "@/lib/site-content-schema";

interface NavbarProps {
  brandName: string;
  routes: NavigationItem[];
}

export default function Navbar({ brandName, routes }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="glass-light sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-gray-900 lg:text-2xl"
          >
            {brandName}
          </Link>
        </motion.div>

        <motion.button
          className="text-gray-700 lg:hidden"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label="Toggle menu"
          whileTap={{ scale: 0.9 }}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>

        <ul className="hidden items-center gap-1 lg:flex">
          {routes.map((route) => {
            const isActive = pathname === route.path;
            return (
              <li key={route.path}>
                <Link
                  href={route.path}
                  className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-indigo-600"
                      : "text-gray-600 hover:bg-gray-100/60 hover:text-gray-900"
                  }`}
                >
                  {route.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="-z-10 absolute inset-0 rounded-lg bg-indigo-50"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-gray-200/50 lg:hidden"
          >
            <ul className="flex flex-col gap-1 px-6 py-3">
              {routes.map((route, index) => {
                const isActive = pathname === route.path;
                return (
                  <motion.li
                    key={route.path}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={route.path}
                      className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
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
