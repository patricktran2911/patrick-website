import { Metadata } from "next";
import Chat from "./render";

export const metadata: Metadata = {
  title: "AI Chat | Patrick Tran",
  description:
    "Chat with Patrick's personal AI assistant.",
};

export default function Page() {
  return <Chat />;
}
