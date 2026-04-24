import { getSiteContent, toPageMetadata } from "@/lib/site-content";
import About from "./render";

export async function generateMetadata() {
  const { about } = await getSiteContent();
  return toPageMetadata(about.metadata);
}

export default async function AboutPage() {
  const { about } = await getSiteContent();
  return <About content={about} />;
}
