import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function checkSuperadminExists(): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("id")
    .eq("role", "superadmin")
    .limit(1);

  if (error) {
    return false;
  }

  return (data?.length ?? 0) > 0;
}
