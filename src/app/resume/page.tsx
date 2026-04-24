import { getSiteContent, toPageMetadata } from "@/lib/site-content";
import Resume from "./render";

export async function generateMetadata() {
  const { resume } = await getSiteContent();
  return toPageMetadata(resume.metadata);
}

export default async function ResumePage() {
  const { resume } = await getSiteContent();
  return <Resume content={resume} />;
}
