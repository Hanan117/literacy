import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import { prisma } from "@/lib/prisma";
import { validateReviewInput } from "@/lib/reviews";

function serialize(review: {
  id: string;
  rating: number;
  title: string;
  body: string;
  quote: string | null;
  createdAt: Date;
}) {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    quote: review.quote,
    createdAt: review.createdAt.toISOString(),
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json(
      { error: "Masuk untuk menulis ulasan." },
      { status: 401 }
    );
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const validation = validateReviewInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const book = await prisma.book.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, isPublished: true },
  });

  if (!book) {
    return NextResponse.json({ error: "Buku tidak ditemukan." }, { status: 404 });
  }
  if (!book.isPublished && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Buku ini belum dipublikasikan." },
      { status: 403 }
    );
  }

  try {
    const review = await prisma.review.upsert({
      where: { userId_bookId: { userId: user.id, bookId: book.id } },
      create: {
        userId: user.id,
        bookId: book.id,
        ...validation.value,
      },
      update: validation.value,
    });

    return NextResponse.json({ review: serialize(review) });
  } catch (error) {
    console.error("POST /api/books/[id]/reviews", error);
    return NextResponse.json({ error: "Gagal menyimpan ulasan." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json(
      { error: "Masuk untuk menghapus ulasan." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const deleted = await prisma.review.deleteMany({
    where: { bookId: id, userId: user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Ulasan tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
