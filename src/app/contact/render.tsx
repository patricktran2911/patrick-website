"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { sendForm } from "emailjs-com";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendForm(
      "service_nt4r3gp",
      "template_2fa157s",
      e.target as HTMLFormElement,
      "61MNx-0wj6lZewpbw"
    ).finally(() => {
      setSubmitted(true);
      setForm({ name: "", email: "", message: "" });
    });
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="bg-none text-gray-900 font-sans">
      <header className="bg-transparent text-white pt-2 pb-10 px-8 text-center overflow-hidden">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-extrabold mb-4"
        >
          Get in Touch
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl max-w-3xl mx-auto font-light"
        >
          Whether you're looking to collaborate, ask questions, or just say hi —
          I'm always open to meaningful connections.
        </motion.p>
      </header>

      <main className="bg-gray-300 hover:opacity-100 lg:opacity-90 px-8 py-8 max-w-5xl mx-auto space-y-8 transition-opacity duration-300">
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={variants}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-4">Contact Info</h2>
          <ul className="space-y-4">
            <li>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:patricktran291197@gmail.com"
                className="text-blue-600 hover:underline"
              >
                patricktran291197@gmail.com
              </a>
            </li>
            <p className="text-black">
              <strong>Location:</strong>
              {" Sacramento, CA, United States"}
            </p>
            <li>
              <strong>LinkedIn:</strong>{" "}
              <a
                href="https://linkedin.com/in/patrick-tran-99768828a"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                linkedin.com/in/patrick-tran-99768828a
              </a>
            </li>
          </ul>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={variants}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold mb-4">Send a Message</h2>
          {submitted ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-green-600 font-semibold"
            >
              Thanks for your message and appreciate for your time to look at my
              website! I will get back to you as soon as possible.
            </motion.p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {["name", "email", "message"].map((field, idx) => (
                <motion.div
                  key={field}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.2 }}
                >
                  <label className="block mb-2 font-medium capitalize">
                    {field}
                  </label>
                  {field !== "message" ? (
                    <input
                      type={field === "email" ? "email" : "text"}
                      name={field}
                      value={form[field as keyof typeof form]}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  ) : (
                    <textarea
                      name="message"
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg"
                    ></textarea>
                  )}
                </motion.div>
              ))}
              <motion.button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Send Message
              </motion.button>
            </form>
          )}
        </motion.section>
      </main>
    </div>
  );
}
