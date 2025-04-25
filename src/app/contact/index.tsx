"use client";
import { useState } from "react";

export default function Page() {
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
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
        setForm({ name: "", email: "", message: "" });
      }
    } catch (error) {
      console.error("Message failed", error);
    }
  };

  return (
    <div className="bg-none text-gray-900 font-sans">
      <header className="bg-transparent text-white pt-2 pb-10 px-8 text-center overflow-hidden">
        <h1 className="text-5xl font-extrabold mb-4">{`Get in Touch`}</h1>
        <p className="text-xl max-w-3xl mx-auto font-light">
          {`Whether you're looking to collaborate, ask questions, or just say hi —
          I'm always open to meaningful connections.`}
        </p>
      </header>

      <main className="bg-gray-300 hover:opacity-100 opacity-90 px-8 py-20 max-w-5xl mx-auto space-y-16 transition-opacity duration-300">
        <section>
          <h2 className="text-3xl font-bold mb-4">{`Contact Info`}</h2>
          <ul className="space-y-4">
            <li>
              <strong>{`Email:`}</strong>{" "}
              <a
                href="mailto:patricktran291197@gmail.com"
                className="text-blue-600 hover:underline"
              >
                {`patricktran291197@gmail.com`}
              </a>
            </li>
            <li>
              <strong>{`Phone:`}</strong>{" "}
              <a
                href="tel:+19162608485"
                className="text-blue-600 hover:underline"
              >
                {`(916) 260-8485`}
              </a>
            </li>
            <li>
              <strong>{`LinkedIn:`}</strong>{" "}
              <a
                href="https://linkedin.com/in/patrick-tran-99768828a"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {`linkedin.com/in/patrick-tran-99768828a`}
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-4">{`Send a Message`}</h2>
          {submitted ? (
            <p className="text-green-600 font-semibold">
              {`Thanks for your message! I'll get back to you soon.`}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-medium">{`Name`}</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">{`Email`}</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Message</label>
                <textarea
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Send Message
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
