import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { publicCoverUrl } from "@/lib/books/cover-url";
import { prisma } from "@/lib/prisma";

type Action = "complete" | "publish" | "unpublish" | "delete";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak. Khusus admin." }, { status: 403 });
  }

  const { id } = await params;

  let body: {
    action?: Action;
    fileSize?: number | string;
    coverPath?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book || book.deletedAt) {
    return NextResponse.json({ error: "Buku tidak ditemukan." }, { status: 404 });
  }

  if (body.action === "complete") {
    const fileSize = Number(body.fileSize);
    const coverPath = (body.coverPath || "").trim();

    if (coverPath && !coverPath.startsWith(`${id}/`)) {
      return NextResponse.json({ error: "Path sampul tidak valid." }, { status: 400 });
    }

    const updated = await prisma.book.update({
      where: { id },
      data: {
        fileSize: Number.isFinite(fileSize) && fileSize > 0 ? BigInt(Math.floor(fileSize)) : null,
        coverUrl: coverPath ? publicCoverUrl(coverPath) : book.coverUrl,
      },
      select: { id: true, coverUrl: true, fileSize: true },
    });

    return NextResponse.json({ ok: true, book: { ...updated, fileSize: updated.fileSize?.toString() ?? null } });
  }

  if (body.action === "publish" || body.action === "unpublish") {
    const updated = await prisma.book.update({
      where: { id },
      data: { isPublished: body.action === "publish" },
      select: { id: true, isPublished: true },
    });
    return NextResponse.json({ ok: true, book: updated });
  }

  if (body.action === "delete") {
    await prisma.book.update({
      where: { id },
      data: { isPublished: false, deletedAt: new Date() },
    });

    // Bersihkan file storage; kegagalan di sini tidak membatalkan soft delete.
    try {
      const supabase = createAdminClient();
      for (const bucket of ["books", "covers"] as const) {
        const { data: files } = await supabase.storage.from(bucket).list(id, { limit: 100 });
        const paths = (files ?? []).map((file) => `${id}/${file.name}`);
        if (paths.length > 0) {
          await supabase.storage.from(bucket).remove(paths);
        }
      }
    } catch (error) {
      console.error("Gagal menghapus file storage", error);
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
}
