import "server-only";

import { getSupabase } from "@/lib/supabase";

type AdminAuditInput = {
  adminUserId: string | null | undefined;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
};

function text(value: string, max: number) {
  const clean = value.trim().slice(0, max);
  if (!clean) throw new Error("Invalid admin audit event.");
  return clean;
}

export async function recordAdminAudit(input: AdminAuditInput) {
  const db = getSupabase();
  const { error } = await db.from("shop_admin_audit_events").insert({
    admin_user_id: input.adminUserId || null,
    action: text(input.action, 120),
    entity_type: text(input.entityType, 80),
    entity_id: input.entityId?.trim().slice(0, 200) || null,
    payload: input.payload || {},
  });

  if (error) throw new Error("Unable to record admin audit event.");
}
