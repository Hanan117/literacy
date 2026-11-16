import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const user = await getAppUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Masuk untuk menyimpan buku ke rak koleksi." },
        { status: 401 }
      ),
    };
  }
  return { user, response: null };
}

async function findBook(id: string) {
  return prisma.book.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, isPublished: true },
  });
}

/**
 * Simpan buku ke "Rak Koleksi". Idempotent: memanggil dua kali tidak
 * menghasilkan duplikat.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await params;
  const book = await findBook(id);

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
    await prisma.collectionItem.upsert({
      where: { userId_bookId: { userId: user.id, bookId: book.id } },
      update: {},
      create: { userId: user.id, bookId: book.id },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("POST /api/books/[id]/collection", error);
    return NextResponse.json(
      { error: "Gagal menyimpan buku ke rak koleksi." },
      { status: 500 }
    );
  }
}

/** Lepas buku dari "Rak Koleksi". Idempotent. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await params;

  try {
    await prisma.collectionItem.deleteMany({
      where: { userId: user.id, bookId: id },
    });

    return NextResponse.json({ saved: false });
  } catch (error) {
    console.error("DELETE /api/books/[id]/collection", error);
    return NextResponse.json(
      { error: "Gagal melepas buku dari rak koleksi." },
      { status: 500 }
    );
  }
}
