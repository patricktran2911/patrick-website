import { Metadata } from "next";
import About from "./render";

export const metadata: Metadata = {
  title: "About | Patrick Tran",
  description:
    "About Patrick Tran, Software Engineer with experience in full-stack development, mobile apps, and AI solutions.",
};

export default function Page() {
  return <About />;
}
