import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "Masuk untuk menyimpan progres." }, { status: 401 });
  }

  const { id } = await params;

  let body: { page?: number | string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const book = await prisma.book.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, pdfPageCount: true, isPublished: true },
  });

  if (!book) {
    return NextResponse.json({ error: "Buku tidak ditemukan." }, { status: 404 });
  }

  if (!book.isPublished && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Buku ini belum dipublikasikan." }, { status: 403 });
  }

  const totalPages = Math.max(1, book.pdfPageCount);
  const rawPage = Number(body.page);
  const page = Number.isFinite(rawPage)
    ? Math.min(totalPages, Math.max(1, Math.round(rawPage)))
    : 1;

  const percentage = Math.round((page / totalPages) * 10000) / 100;
  const isCompleted = page >= totalPages;

  try {
    const progress = await prisma.progress.upsert({
      where: { userId_bookId: { userId: user.id, bookId: book.id } },
      update: { currentPage: page, percentage, isCompleted, lastReadAt: new Date() },
      create: {
        userId: user.id,
        bookId: book.id,
        currentPage: page,
        percentage,
        isCompleted,
      },
      select: { currentPage: true, percentage: true, isCompleted: true, lastReadAt: true },
    });

    return NextResponse.json({
      progress: {
        currentPage: progress.currentPage,
        percentage: Number(progress.percentage),
        isCompleted: progress.isCompleted,
        lastReadAt: progress.lastReadAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("PUT /api/books/[id]/progress", error);
    return NextResponse.json({ error: "Gagal menyimpan progres." }, { status: 500 });
  }
}
