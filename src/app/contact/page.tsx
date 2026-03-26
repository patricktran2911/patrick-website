import { Metadata } from "next";
import Contact from "./render";

export const metadata: Metadata = {
  title: "Contact | Patrick Tran",
  description: "Get in touch with Patrick Tran for collaboration or questions.",
};

export default function Page() {
  return <Contact />;
}
