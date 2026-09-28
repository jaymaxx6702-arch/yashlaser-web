import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return NextResponse.json({ error: "Invalid project file." }, { status: 400 });

  const db = getSupabase();
  const { data: file, error } = await db
    .from("shop_project_files")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();

  if (error || !file)
    return NextResponse.json({ error: "Project file not found." }, { status: 404 });

  const { data, error: signedError } = await db.storage
    .from("customer-documents")
    .createSignedUrl(file.file_path, 10 * 60);

  if (signedError || !data?.signedUrl)
    return NextResponse.json(
      { error: "Unable to open project file." },
      { status: 500 },
    );

  return NextResponse.redirect(data.signedUrl, 302);
}
