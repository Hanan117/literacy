import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SyncedUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  avatarUrl: string | null;
};

function resolveRole(user: SupabaseUser): Role {
  return user.app_metadata?.role === "ADMIN" ? Role.ADMIN : Role.READER;
}

function resolveName(user: SupabaseUser): string | null {
  const metadataName = user.user_metadata?.name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }
  if (user.email) return user.email.split("@")[0];
  return null;
}

function resolveAvatarUrl(user: SupabaseUser): string | null {
  const value = user.user_metadata?.avatarUrl;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Menjamin user Supabase punya baris di tabel `users` Prisma.
 * `id` memakai UID Supabase agar relasi Progress/Bookmark konsisten.
 */
export async function syncUserToPrisma(user: SupabaseUser): Promise<SyncedUser> {
  const email = user.email ?? `${user.id}@literacy.local`;
  const name = resolveName(user);
  const role = resolveRole(user);

  const row = await prisma.user.upsert({
    where: { id: user.id },
    update: { email, name, role },
    create: { id: user.id, email, name, role },
    select: { id: true, email: true, name: true, role: true },
  });

  return { ...row, avatarUrl: resolveAvatarUrl(user) };
}
