import { redirect } from "next/navigation";
import { getAppUser } from "@/lib/auth/get-app-user";
import { prisma } from "@/lib/prisma";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Pintu masuk "Rating & Ulasan" dari sidebar.
 * Arahkan ke buku yang dipilih, lalu buku terakhir dibaca, lalu buku terbaru.
 */
export default async function ReviewsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string | string[] }>;
}) {
  const query = await searchParams;
  const requestedSlug = first(query.book)?.trim();
  const user = await getAppUser();

  if (requestedSlug) {
    const requested = await prisma.book.findFirst({
      where: { slug: requestedSlug, deletedAt: null },
      select: { slug: true, isPublished: true },
    });

    if (requested && (requested.isPublished || user?.role === "ADMIN")) {
      redirect(`/books/${requested.slug}/reviews`);
    }
  }

  if (user) {
    const latest = await prisma.progress.findFirst({
      where: {
        userId: user.id,
        book: { isPublished: true, deletedAt: null },
      },
      orderBy: { lastReadAt: "desc" },
      select: { book: { select: { slug: true } } },
    });

    if (latest?.book.slug) {
      redirect(`/books/${latest.book.slug}/reviews`);
    }
  }

  const fallback = await prisma.book.findFirst({
    where: { isPublished: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { slug: true },
  });

  if (fallback) {
    redirect(`/books/${fallback.slug}/reviews`);
  }

  redirect("/katalog");
}
