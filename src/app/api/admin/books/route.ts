import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { createUniqueSlug } from "@/lib/books/slug";

const COVER_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak. Khusus admin." }, { status: 403 });
  }

  let body: {
    title?: string;
    author?: string;
    synopsis?: string;
    series?: string;
    language?: string;
    categorySlug?: string;
    pdfPageCount?: number | string;
    estimatedMinutes?: number | string;
    coverExtension?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const title = (body.title || "").trim();
  const author = (body.author || "").trim();
  const synopsis = (body.synopsis || "").trim() || null;
  const series = (body.series || "").trim() || null;
  const language = (body.language || "id").trim() || "id";
  const categorySlug = (body.categorySlug || "").trim();
  const pdfPageCount = Math.max(0, Math.floor(Number(body.pdfPageCount) || 0));
  const estimatedMinutesRaw = Math.floor(Number(body.estimatedMinutes) || 0);
  const estimatedMinutes = estimatedMinutesRaw > 0 ? estimatedMinutesRaw : null;
  const coverExtension = (body.coverExtension || "").toLowerCase();

  if (!title || !author) {
    return NextResponse.json({ error: "Judul dan penulis wajib diisi." }, { status: 400 });
  }
  if (coverExtension && !COVER_EXTENSIONS.has(coverExtension)) {
    return NextResponse.json({ error: "Format sampul tidak didukung." }, { status: 400 });
  }

  const category = categorySlug
    ? await prisma.category.findUnique({ where: { slug: categorySlug } })
    : null;

  const bookId = crypto.randomUUID();
  const slug = await createUniqueSlug(title);
  const pdfPath = `${bookId}/${crypto.randomUUID()}.pdf`;
  const coverPath = coverExtension
    ? `${bookId}/${crypto.randomUUID()}.${coverExtension}`
    : null;

  try {
    const book = await prisma.book.create({
      data: {
        id: bookId,
        slug,
        title,
        author,
        synopsis,
        series,
        language,
        categoryId: category?.id ?? null,
        pdfPageCount,
        estimatedMinutes,
        pdfUrl: pdfPath,
        isPublished: false,
      },
      select: { id: true, slug: true, title: true },
    });

    const supabase = createAdminClient();

    const { data: pdfUpload, error: pdfError } = await supabase.storage
      .from("books")
      .createSignedUploadUrl(pdfPath);

    if (pdfError || !pdfUpload) {
      await prisma.book.delete({ where: { id: bookId } }).catch(() => undefined);
      return NextResponse.json(
        { error: "Gagal menyiapkan unggahan PDF. Coba lagi." },
        { status: 500 }
      );
    }

    let coverUpload: { path: string; token: string; signedUrl: string } | null = null;

    if (coverPath) {
      const { data: coverData, error: coverError } = await supabase.storage
        .from("covers")
        .createSignedUploadUrl(coverPath);

      if (!coverError && coverData) {
        coverUpload = coverData;
      }
    }

    return NextResponse.json({
      book,
      pdf: pdfUpload,
      cover: coverUpload,
    });
  } catch (error) {
    console.error("POST /api/admin/books", error);
    return NextResponse.json({ error: "Gagal membuat buku. Coba lagi." }, { status: 500 });
  }
}
