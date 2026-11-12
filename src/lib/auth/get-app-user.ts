import { createClient } from "@/lib/supabase/server";
import { syncUserToPrisma, type SyncedUser } from "@/lib/auth/sync-user";

/**
 * Ambil user yang sedang login sekaligus menjamin baris Prisma-nya ada.
 * Dipakai layout yang membutuhkan data user untuk `AppShell`.
 */
export async function getAppUser(): Promise<SyncedUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return syncUserToPrisma(user);
}
