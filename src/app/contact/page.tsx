import { Metadata } from "next";
import Contact from "./render";

export const metadata: Metadata = {
  title: "Contact | Patrick Tran",
  description:
    "Contact page for Patrick Tran, Software Engineer specializing in iOS, full-stack development, and AI-driven systems.",
};

export default function Page() {
  return <Contact />;
}
