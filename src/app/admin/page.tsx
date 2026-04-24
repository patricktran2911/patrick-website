import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSiteContent } from "@/lib/site-content";
import AdminRender from "./render";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin | Patrick Tran",
  description: "Internal content dashboard for Patrick Tran's portfolio.",
};

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();
  const initialContent = authenticated ? await getSiteContent() : null;

  return (
    <AdminRender
      initialAuthenticated={authenticated}
      initialContent={initialContent}
    />
  );
}
