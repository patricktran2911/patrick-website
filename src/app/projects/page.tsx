import { Metadata } from "next";
import Projects from "./render";

export const metadata: Metadata = {
  title: "Projects | Patrick Tran",
  description:
    "Real-world projects by Patrick Tran across web, mobile, and AI domains.",
};

export default function Page() {
  return <Projects />;
}
