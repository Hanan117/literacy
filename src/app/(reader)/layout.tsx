import AppShell from "@/components/app-shell";
import { getAppUser } from "@/lib/auth/get-app-user";

export default async function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAppUser();

  return (
    <AppShell
      user={
        user
          ? {
              name: user.name,
              email: user.email,
              role: user.role,
              avatarUrl: user.avatarUrl,
            }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
