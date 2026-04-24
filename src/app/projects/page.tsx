import { getSiteContent, toPageMetadata } from "@/lib/site-content";
import Projects from "./render";

export async function generateMetadata() {
  const { projects } = await getSiteContent();
  return toPageMetadata(projects.metadata);
}

export default async function ProjectsPage() {
  const { projects } = await getSiteContent();
  return <Projects content={projects} />;
}
