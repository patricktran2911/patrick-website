import { getSiteContent, toPageMetadata } from "@/lib/site-content";
import Contact from "./render";

export async function generateMetadata() {
  const { contact } = await getSiteContent();
  return toPageMetadata(contact.metadata);
}

export default async function ContactPage() {
  const { contact } = await getSiteContent();
  return <Contact content={contact} />;
}
