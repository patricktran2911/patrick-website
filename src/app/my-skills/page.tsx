import { Metadata } from "next";
import Skills from "./render";

export const metadata: Metadata = {
  title: "Skills | Patrick Tran",
  description:
    "Technologies and tools Patrick Tran uses to build web, mobile, and AI applications.",
};

export default function Page() {
  return <Skills />;
}
