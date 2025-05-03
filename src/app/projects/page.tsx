import { Metadata } from "next";
import Projects from "./render";

export const metadata: Metadata = {
  title: "Projects | Patrick Tran",
  description:
    "Explore Patrick Tran's projects, showcasing expertise in iOS, full-stack development, and AI systems.",
};

const Page = () => {
  return <Projects />;
};

export default Page;
