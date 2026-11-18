import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const books = await prisma.book.findMany({
    where: { isPublished: true, deletedAt: null },
    select: { id: true, slug: true, title: true, author: true, coverUrl: true },
    orderBy: { title: "asc" },
    take: 50,
  });

  return NextResponse.json({ books });
}
