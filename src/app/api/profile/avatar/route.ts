import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const BUCKET = "avatars";
const MAX_BYTES = 2 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function requireUser() {
  const user = await getAppUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Masuk untuk mengubah foto profil." },
        { status: 401 }
      ),
    };
  }
  return { user, response: null };
}

/** Hapus semua foto lama milik user agar folder tidak menumpuk. */
async function clearFolder(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { data: files } = await supabase.storage.from(BUCKET).list(userId);
  if (files && files.length > 0) {
    await supabase.storage
      .from(BUCKET)
      .remove(files.map((file) => `${userId}/${file.name}`));
  }
}

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Unggahan tidak valid." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Pilih file gambar." }, { status: 400 });
  }

  const ext = EXTENSIONS[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Format harus JPG, PNG, atau WebP." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Ukuran foto maksimal 2MB." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  try {
    await clearFolder(supabase, user.id);

    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, await file.arrayBuffer(), { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const avatarUrl = data.publicUrl;

    // updateUser menggabungkan data, jadi name/handle/bio tetap utuh.
    const auth = await createClient();
    const { error: authError } = await auth.auth.updateUser({
      data: { avatarUrl },
    });

    if (authError) throw authError;

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("POST /api/profile/avatar", error);
    return NextResponse.json(
      { error: "Gagal mengunggah foto profil. Coba lagi." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const { user, response } = await requireUser();
  if (!user) return response;

  try {
    await clearFolder(createAdminClient(), user.id);

    // null, bukan delete key: updateUser hanya menggabungkan, tidak menghapus.
    const auth = await createClient();
    const { error: authError } = await auth.auth.updateUser({
      data: { avatarUrl: null },
    });

    if (authError) throw authError;

    return NextResponse.json({ avatarUrl: null });
  } catch (error) {
    console.error("DELETE /api/profile/avatar", error);
    return NextResponse.json(
      { error: "Gagal menghapus foto profil. Coba lagi." },
      { status: 500 }
    );
  }
}
