import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateProfileInput } from "@/lib/settings";

/**
 * Perbarui identitas redaksi.
 * Nama disimpan di Prisma + metadata Supabase (sumber kebenaran sesi),
 * handle & bio disimpan di metadata Supabase agar tidak perlu migrasi schema.
 */
export async function PATCH(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json(
      { error: "Masuk untuk memperbarui profil." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Permintaan tidak valid." },
      { status: 400 }
    );
  }

  const validation = validateProfileInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { name, handle, bio } = validation.value;

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.updateUser({
    data: { name, handle, bio },
  });

  if (authError) {
    return NextResponse.json(
      { error: "Gagal menyimpan profil ke sesi Anda. Coba lagi." },
      { status: 500 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name },
  });

  return NextResponse.json({ user: { name, handle, bio } });
}
