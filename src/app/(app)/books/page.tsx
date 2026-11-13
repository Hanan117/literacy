import { redirect } from "next/navigation";
import { getAppUser } from "@/lib/auth/get-app-user";
import { prisma } from "@/lib/prisma";

/**
 * Pintu masuk "Detail & Catatan" dari sidebar.
 * Utamakan buku yang terakhir dibaca, lalu buku published terbaru.
 */
export default async function BooksIndexPage() {
  const user = await getAppUser();

  if (user) {
    const latestProgress = await prisma.progress.findFirst({
      where: {
        userId: user.id,
        book: { isPublished: true, deletedAt: null },
      },
      orderBy: { lastReadAt: "desc" },
      select: { book: { select: { slug: true } } },
    });

    if (latestProgress?.book.slug) {
      redirect(`/books/${latestProgress.book.slug}`);
    }
  }

  const fallback = await prisma.book.findFirst({
    where: { isPublished: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { slug: true },
  });

  if (fallback) {
    redirect(`/books/${fallback.slug}`);
  }

  redirect(user ? "/katalog" : "/");
}
