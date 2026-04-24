import { getSiteContent, toPageMetadata } from "@/lib/site-content";
import Skills from "./render";

export async function generateMetadata() {
  const { skills } = await getSiteContent();
  return toPageMetadata(skills.metadata);
}

export default async function SkillsPage() {
  const { skills } = await getSiteContent();
  return <Skills content={skills} />;
}
