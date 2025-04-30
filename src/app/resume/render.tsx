"use client";
import { motion } from "framer-motion";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Resume() {
  return (
    <div className="flex flex-col bg-none text-gray-900 h-full w-full font-sans">
      <header className="bg-transparent text-white pt-2 pb-10 px-8 text-center overflow-hidden">
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

      <main className="flex justify-between space-x-5 bg-gray-300 hover:opacity-100 opacity-90 px-8 py-4 w-fit h-full mx-auto transition-opacity duration-300">
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          transition={{ duration: 0.6 }}
          layout={false}
          className="flex"
        >
          <iframe
            src="./Assets/pdf/Patrick's-Resume-v2.pdf#zoom=FitH"
            className="w-auto lg:w-xl lg:h-auto grow border rounded-lg shadow-lg"
            title="Patrick Tran Resume Preview"
            content="application/pdf"
          ></iframe>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-xl text-right font-bold mb-4">Download</h2>
          <motion.a
            href="https://drive.google.com/uc?export=download&id=1i_hw3HGp1htJ259xTeN7e6mxywjAXfAw"
            className="inline-block px-3 py-3 mt-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition duration-200"
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
