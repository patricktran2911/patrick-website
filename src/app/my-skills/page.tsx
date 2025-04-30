import { Metadata } from "next";
import Skills from "../my-skills/render";

export const metadata: Metadata = {
  title: "Skills | Patrick Tran",
  description:
    "Explore Patrick Tran's technical skills across full-stack development, mobile engineering, and AI-powered systems.",
};

export default function Page() {
  return <Skills />;
}
