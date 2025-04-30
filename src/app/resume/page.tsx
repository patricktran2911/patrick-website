import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume | Patrick Tran",
  description:
    "Interactive resume of Patrick Tran, Software Engineer experienced in iOS, full-stack development, and AI systems.",
};

export default function Resume() {
  return (
    <div className="flex-col bg-none text-gray-900 h-full font-sans text-base sm:text-sm md:text-base lg:text-lg xl:text-xl">
      <header className="relative bg-transparent text-white pt-2 pb-10 px-8 text-center overflow-hidden">
        <h1 className="text-5xl font-extrabold mb-4">My Resume</h1>
        <p className="text-xl max-w-3xl mx-auto font-light">
          Preview or download my official resume.
        </p>
      </header>

      <main className="flex-row bg-gray-300 hover:opacity-100 opacity-90 px-8 py-10 max-w-5xl mx-auto space-y-16 transition-opacity duration-300">
        <section>
          <h2 className="text-3xl font-bold mb-4">Resume Preview</h2>
          <iframe
            src="https://drive.google.com/file/d/1i_hw3HGp1htJ259xTeN7e6mxywjAXfAw/preview"
            className="w-full h-[80vh] border rounded-lg shadow-lg"
            title="Patrick Tran Resume Preview"
            contentEditable="false"
            allow="autoplay"
          ></iframe>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-4">Download</h2>
          <a
            href="https://drive.google.com/uc?export=download&id=1i_hw3HGp1htJ259xTeN7e6mxywjAXfAw"
            className="inline-block px-6 py-3 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            download
          >
            Download PDF Resume
          </a>
        </section>
      </main>
    </div>
  );
}
