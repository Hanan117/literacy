import { redirect } from "next/navigation";
import { getAppUser } from "@/lib/auth/get-app-user";
import { prisma } from "@/lib/prisma";

/**
 * Pintu masuk "Mode Baca" dari sidebar.
 * Utamakan buku yang terakhir dibaca, lalu buku published terbaru.
 */
export default async function ReadIndexPage() {
  const user = await getAppUser();

  if (user) {
    const latestProgress = await prisma.progress.findFirst({
      where: {
        userId: user.id,
        book: { isPublished: true, deletedAt: null },
      },
      orderBy: { lastReadAt: "desc" },
      select: { bookId: true },
    });

    if (latestProgress) {
      redirect(`/read/${latestProgress.bookId}`);
    }
  }

  const fallback = await prisma.book.findFirst({
    where: { isPublished: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (fallback) {
    redirect(`/read/${fallback.id}`);
  }

  redirect(user ? "/katalog" : "/");
}
