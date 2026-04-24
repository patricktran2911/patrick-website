import HomeRender from "@/app/home-render";
import { getSiteContent, toPageMetadata } from "@/lib/site-content";

export async function generateMetadata() {
  const { home } = await getSiteContent();
  return toPageMetadata(home.metadata);
}

export default async function HomePage() {
  const { home } = await getSiteContent();
  return <HomeRender content={home} />;
}
