"use client";
import { motion } from "framer-motion";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Resume() {
  return (
    <div className="flex-col bg-none text-gray-900 h-full font-sans text-base sm:text-sm md:text-base lg:text-lg xl:text-xl">
      <header className="relative bg-transparent text-white pt-2 pb-10 px-8 text-center overflow-hidden">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-extrabold mb-4"
        >
          My Resume
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl max-w-3xl mx-auto font-light"
        >
          Preview or download my official resume.
        </motion.p>
      </header>

      <main className="flex-row bg-gray-300 hover:opacity-100 opacity-90 px-8 py-10 max-w-5xl mx-auto space-y-16 transition-opacity duration-300">
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          transition={{ duration: 0.6 }}
          layout={false}
        >
          <h2 className="text-3xl font-bold mb-4">Resume Preview</h2>

          <iframe
            src="https://drive.google.com/file/d/1i_hw3HGp1htJ259xTeN7e6mxywjAXfAw/preview"
            className="w-full h-[40vh] md:h-[50vh] lg:h-[60vh] border rounded-lg shadow-lg"
            title="Patrick Tran Resume Preview"
            allow="autoplay"
          ></iframe>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold mb-4">Download</h2>
          <motion.a
            href="https://drive.google.com/uc?export=download&id=1i_hw3HGp1htJ259xTeN7e6mxywjAXfAw"
            className="inline-block px-6 py-3 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            download
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Download PDF Resume
          </motion.a>
        </motion.section>
      </main>
    </div>
  );
}
