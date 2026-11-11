import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { syncUserToPrisma } from "@/lib/auth/sync-user";

type Role = "READER" | "ADMIN";

function safePinMatch(input: string, secret: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Auth belum dikonfigurasi. Periksa NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: Role;
      adminPin?: string;
    };
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const role: Role = body.role === "ADMIN" ? "ADMIN" : "READER";
    const adminPin = body.adminPin || "";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nama, email, dan kata sandi wajib diisi." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Kata sandi minimal 8 karakter." }, { status: 400 });
    }

    let finalRole: Role = "READER";
    if (role === "ADMIN") {
      const secret = process.env.ADMIN_REGISTRATION_PIN || "";
      if (!secret) {
        return NextResponse.json({ error: "Pendaftaran admin belum dikonfigurasi (ADMIN_REGISTRATION_PIN)." }, { status: 400 });
      }
      if (!adminPin) {
        return NextResponse.json({ error: "PIN admin wajib diisi." }, { status: 400 });
      }
      if (!safePinMatch(adminPin, secret)) {
        return NextResponse.json({ error: "PIN admin tidak valid." }, { status: 403 });
      }
      finalRole = "ADMIN";
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: finalRole },
      app_metadata: { role: finalRole },
    });

    if (error) {
      const msg = /already|exists|registered/i.test(error.message)
        ? "Email sudah terdaftar."
        : error.message || "Gagal membuat akun.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Gagal membuat akun." }, { status: 500 });
    }

    try {
      await syncUserToPrisma(data.user);
    } catch {
      return NextResponse.json(
        { error: "Akun dibuat, tetapi gagal menyiapkan profil pengguna." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, userId: data.user.id, role: finalRole });
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }
}
