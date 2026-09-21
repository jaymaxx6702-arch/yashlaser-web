"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import {
  ADMIN_COOKIE,
  allowedAdmin,
  requireAdmin,
  statuses,
} from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";

export async function login(form: FormData) {
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (!email || email.length > 254 || !password || password.length > 1024)
    redirect("/admin/login?error=1");
  const auth = createClient(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await auth.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user || !data.session || !allowedAdmin(data.user.id))
    redirect("/admin/login?error=1");
  (await cookies()).set(ADMIN_COOKIE, data.session.access_token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.min(data.session.expires_in, 3600),
  });
  redirect("/admin");
}
export async function logout() {
  const store = await cookies();
  // Expire the current root-scoped cookie.
  store.set(ADMIN_COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  // Also expire the legacy /admin-scoped cookie from older deployments.
  store.set(ADMIN_COOKIE, "", {
    path: "/admin",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  redirect("/admin/login");
}
export async function updateEnquiry(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") || "");
  const status = String(form.get("status") || "");
  const notes = String(form.get("internal_notes") || "");
  if (
    !/^[a-f0-9-]{36}$/i.test(id) ||
    !Object.hasOwn(statuses, status) ||
    notes.length > 10000
  )
    throw new Error("Invalid enquiry update.");
  const { data, error } = await getSupabase()
    .from("enquiries")
    .update({ status, internal_notes: notes })
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) redirect(`/admin/enquiries/${id}?error=1`);
  revalidatePath("/admin");
  revalidatePath(`/admin/enquiries/${id}`);
  redirect(`/admin/enquiries/${id}?saved=1`);
}
