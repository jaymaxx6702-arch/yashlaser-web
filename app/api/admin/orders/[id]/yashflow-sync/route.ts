import { NextResponse } from "next/server";
import { adminUser } from "@/lib/admin";
import { syncShopOrderToYashFlow } from "@/lib/yashflow";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await adminUser();
  if (!user)
    return NextResponse.json({ error: "Admin session required." }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  try {
    const result = await syncShopOrderToYashFlow(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "YashFlow sync failed." },
      { status: 409 },
    );
  }
}
