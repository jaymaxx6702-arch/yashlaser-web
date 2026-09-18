import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabase } from "./supabase";
export const ADMIN_COOKIE = "yl-admin-session";
export const statuses = {
  new: "New",
  contacted: "Contacted",
  mockup_pending: "Mockup Pending",
  mockup_sent: "Mockup Sent",
  approved: "Approved",
  in_production: "In Production",
  ready: "Ready",
  dispatched: "Dispatched",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;
export function allowedAdmin(id: string) {
  return (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(id);
}
export async function adminUser() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { data, error } = await getSupabase().auth.getUser(token);
    return !error && data.user && allowedAdmin(data.user.id) ? data.user : null;
  } catch {
    return null;
  }
}
export async function requireAdmin() {
  const user = await adminUser();
  if (!user) redirect("/admin/login");
  return user;
}
