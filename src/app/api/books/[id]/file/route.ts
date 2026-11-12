import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 10;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const book = await prisma.book.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, pdfUrl: true, isPublished: true },
  });

  if (!book) {
    return NextResponse.json({ error: "Buku tidak ditemukan." }, { status: 404 });
  }

  // Buku draft hanya boleh dibuka admin.
  if (!book.isPublished) {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { error: "Buku ini belum dipublikasikan." },
        { status: 403 }
      );
    }
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("books")
      .createSignedUrl(book.pdfUrl, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      console.error("GET /api/books/[id]/file", error);
      return NextResponse.json(
        { error: "Gagal menyiapkan berkas buku." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
    });
  } catch (error) {
    console.error("GET /api/books/[id]/file", error);
    return NextResponse.json(
      { error: "Gagal menyiapkan berkas buku." },
      { status: 500 }
    );
  }
}
