import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const user = await getAppUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Masuk untuk menyimpan catatan." },
        { status: 401 }
      ),
    };
  }
  return { user, response: null };
}

function serialize(bookmark: {
  id: string;
  page: number;
  label: string | null;
  note: string | null;
  createdAt: Date;
}) {
  return {
    id: bookmark.id,
    page: bookmark.page,
    label: bookmark.label,
    note: bookmark.note,
    createdAt: bookmark.createdAt.toISOString(),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await params;

  const bookmarks = await prisma.bookmark.findMany({
    where: { bookId: id, userId: user.id },
    orderBy: [{ page: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ bookmarks: bookmarks.map(serialize) });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await params;

  let body: { page?: number | string; label?: string | null; note?: string | null };
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

  const rawPage = Number(body.page);
  if (!Number.isFinite(rawPage)) {
    return NextResponse.json({ error: "Halaman tidak valid." }, { status: 400 });
  }
  const page = Math.min(Math.max(1, book.pdfPageCount), Math.max(1, Math.round(rawPage)));

  try {
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.id,
        bookId: book.id,
        page,
        label: body.label?.trim() || `Halaman ${page}`,
        note: body.note?.trim() || null,
      },
    });

    return NextResponse.json({ bookmark: serialize(bookmark) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/books/[id]/bookmarks", error);
    return NextResponse.json({ error: "Gagal menyimpan catatan." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await params;

  let body: { id?: string; label?: string | null; note?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Catatan tidak ditemukan." }, { status: 400 });
  }

  const existing = await prisma.bookmark.findFirst({
    where: { id: body.id, bookId: id, userId: user.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Catatan tidak ditemukan." }, { status: 404 });
  }

  try {
    const bookmark = await prisma.bookmark.update({
      where: { id: existing.id },
      data: {
        ...(typeof body.label === "string" ? { label: body.label.trim() || null } : {}),
        ...(typeof body.note === "string" ? { note: body.note.trim() || null } : {}),
      },
    });

    return NextResponse.json({ bookmark: serialize(bookmark) });
  } catch (error) {
    console.error("PATCH /api/books/[id]/bookmarks", error);
    return NextResponse.json({ error: "Gagal memperbarui catatan." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await params;

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Catatan tidak ditemukan." }, { status: 400 });
  }

  const deleted = await prisma.bookmark.deleteMany({
    where: { id: body.id, bookId: id, userId: user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Catatan tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
