import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { syncUserToPrisma } from "@/lib/auth/sync-user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const syncedUser = user ? await syncUserToPrisma(user) : null;

  return (
    <AppShell
      user={
        syncedUser
          ? {
              name: syncedUser.name,
              email: syncedUser.email,
              role: syncedUser.role,
            }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
