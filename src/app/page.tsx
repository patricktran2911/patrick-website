export default function Home() {
  return (
    <div className="flex-col bg-transparent text-gray-900 min-h-[680px] min-w-64 overflow-hidden font-sans">
      <header className="py-20 px-8 text-center bg-transparent">
        <h1 className="text-5xl font-extrabold mb-4 text-white">
          Hi, I'm Patrick Tran
        </h1>
        <p className="text-xl font-light text-white">
          Detail-oriented Software Engineer experienced in full-stack web and
          mobile applications, specializing in TypeScript, React, Swift, Python,
          and AI-integrated solutions.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <button className="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-400 hover:shadow-2xl transition-shadow duration-200">
            View Projects
          </button>
          <button className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-200 hover:shadow-2xl transition-shadow duration-200">
            Get in Touch
          </button>
        </div>
      </header>

      <section className="flex py-3 sm:px-2 lg:py-16 lg:px-8 border-gray-200 opacity-80 hover:opacity-100 bg-white backdrop-blur-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className=" p-3 lg:p-6 bg-white border-[2px] rounded-lg shadow hover:shadow-xl transition-shadow duration-300">
            <h3 className="sm:text-lg lg:text-2xl font-semibold">
              Full-Stack Development
            </h3>
            <p className="lg:text-lg text-sm mt-4">
              Developing scalable web solutions with React, NextJS, Node.js, and
              FastAPI.
            </p>
          </div>
          <div className="p-3 lg:p-6 bg-white border-[2px] rounded-lg shadow hover:shadow-xl transition-shadow duration-300">
            <h3 className="sm:text-lg lg:text-2xl font-semibold">
              Mobile App Development
            </h3>
            <p className="lg:text-lg text-sm mt-4">
              Crafting modular iOS applications using SwiftUI and UIKit.
            </p>
          </div>
          <div className="p-3 lg:p-6 bg-white border-[2px] rounded-lg shadow hover:shadow-xl transition-shadow duration-300">
            <h3 className="sm:text-lg lg:text-2xl font-semibold">
              AI & Computer Vision
            </h3>
            <p className="lg:text-lg text-sm mt-4">
              Integrating real-time AI solutions using Python, OpenCV, and
              MediaPipe.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
