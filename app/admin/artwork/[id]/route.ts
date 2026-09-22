import { adminUser } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const privateHeaders = {
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
  };
  if (!(await adminUser()))
    return new Response("Unauthorised", {
      status: 401,
      headers: privateHeaders,
    });
  const { id } = await params;
  const kind = new URL(request.url).searchParams.get("kind");
  if (
    !/^[a-f0-9-]{36}$/i.test(id) ||
    !["artwork", "source", "preview"].includes(kind || "")
  )
    return new Response("Invalid request", {
      status: 400,
      headers: privateHeaders,
    });
  const db = getSupabase();
  const { data, error } = await db
    .from("enquiry_items")
    .select("artwork_path,source_artwork_path,preview_path")
    .eq("id", id)
    .maybeSingle();
  if (error)
    return new Response("Storage unavailable", {
      status: 503,
      headers: privateHeaders,
    });
  const path =
    kind === "artwork"
      ? data?.artwork_path
      : kind === "source"
        ? data?.source_artwork_path
        : data?.preview_path;
  if (!path)
    return new Response("Not found", { status: 404, headers: privateHeaders });
  const signed = await db.storage
    .from("customer-artwork")
    .createSignedUrl(path, 60);
  if (signed.error)
    return new Response("Storage unavailable", {
      status: 503,
      headers: privateHeaders,
    });
  return new Response(null, {
    status: 302,
    headers: { ...privateHeaders, Location: signed.data.signedUrl },
  });
}
