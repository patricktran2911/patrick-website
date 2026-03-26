import { Metadata } from "next";
import About from "./render";

export const metadata: Metadata = {
  title: "About | Patrick Tran",
  description:
    "Learn about Patrick Tran's journey as a Software Engineer in web, mobile, and AI.",
};

export default function Page() {
  return <About />;
}
