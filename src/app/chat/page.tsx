import { getSiteContent, toPageMetadata } from "@/lib/site-content";
import Chat from "./render";

export async function generateMetadata() {
  const { chat } = await getSiteContent();
  return toPageMetadata(chat.metadata);
}

export default async function ChatPage() {
  const { chat } = await getSiteContent();
  return <Chat content={chat} />;
}
