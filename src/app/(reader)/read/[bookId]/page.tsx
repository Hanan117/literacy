import { notFound } from "next/navigation";
import ReaderView, {
  type ReaderBookmark,
} from "@/components/reader/reader-view";
import { getAppUser } from "@/lib/auth/get-app-user";
import { prisma } from "@/lib/prisma";

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const user = await getAppUser();
  const isAdmin = user?.role === "ADMIN";

  const book = await prisma.book.findFirst({
    where: { id: bookId, deletedAt: null },
    include: { category: true },
  });

  if (!book) notFound();
  if (!book.isPublished && !isAdmin) notFound();

  let progress = null;
  let bookmarks: ReaderBookmark[] = [];

  if (user) {
    const [savedProgress, savedBookmarks] = await Promise.all([
      prisma.progress.findUnique({
        where: { userId_bookId: { userId: user.id, bookId: book.id } },
        select: { currentPage: true },
      }),
      prisma.bookmark.findMany({
        where: { userId: user.id, bookId: book.id },
        orderBy: [{ page: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          page: true,
          label: true,
          note: true,
          createdAt: true,
        },
      }),
    ]);

    progress = savedProgress;
    bookmarks = savedBookmarks.map((bookmark) => ({
      ...bookmark,
      createdAt: bookmark.createdAt.toISOString(),
    }));
  }

  return (
    <ReaderView
      book={{
        id: book.id,
        slug: book.slug,
        title: book.title,
        author: book.author,
        category: book.category?.name ?? "Tanpa Kategori",
        pageCount: book.pdfPageCount,
      }}
      initialPage={progress?.currentPage ?? 1}
      initialBookmarks={bookmarks}
      isAuthenticated={Boolean(user)}
      userName={user?.name?.trim() || user?.email?.split("@")[0] || "Pembaca"}
    />
  );
}
