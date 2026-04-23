import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

type LogAuditEventParams = {
  action: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  targetId?: string;
  targetType?: string;
  userId?: string;
};

export async function logAuditEvent({
  action,
  ipAddress,
  metadata,
  targetId,
  targetType,
  userId,
}: LogAuditEventParams): Promise<void> {
  try {
    const supabase = createServiceRoleClient();

    const { error } = await supabase.from("audit_logs").insert({
      action,
      ip_address: ipAddress ?? null,
      metadata: (metadata ?? {}) as Json,
      target_id: targetId ?? null,
      target_type: targetType ?? null,
      user_id: userId ?? null,
    });

    if (error) {
      console.error("Failed to write audit log entry", error);
    }
  } catch (error) {
    console.error("Audit logging failed", error);
  }
}
