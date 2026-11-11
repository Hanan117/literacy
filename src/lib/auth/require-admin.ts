import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Ambil user yang sedang login dan pastikan role-nya ADMIN.
 * Dipakai di Route Handler agar otorisasi tidak bergantung pada UI.
 */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "ADMIN") return null;
  return user;
}
