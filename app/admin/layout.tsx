import type { Metadata } from "next";
import { AdminNav } from "@/components/AdminNav";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="admin-shell">
      <AdminNav />
      {children}
    </main>
  );
}
