import CatalogView from "@/components/catalog/catalog-view";
import { resolveCoverUrl } from "@/lib/books/cover-url";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  formatReadingDuration,
  type CatalogBook,
  type CatalogCategory,
} from "@/lib/data/catalog";

export default async function KatalogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user?.app_metadata?.role === "ADMIN";

  const [books, categories] = await Promise.all([
    prisma.book.findMany({
      where: {
        deletedAt: null,
        ...(isAdmin ? {} : { isPublished: true }),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const catalogBooks: CatalogBook[] = books.map((book) => ({
    id: book.id,
    slug: book.slug,
    title: book.title,
    author: book.author,
    category: book.category?.name ?? "Tanpa Kategori",
    categorySlug: book.category?.slug ?? null,
    series: book.series,
    duration: formatReadingDuration(book.estimatedMinutes, book.pdfPageCount),
    synopsis: book.synopsis,
    cover: resolveCoverUrl(book.coverUrl),
    isPublished: book.isPublished,
  }));

  const catalogCategories: CatalogCategory[] = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
  }));

  const spotlight =
    catalogBooks.find((book) => book.isPublished) ??
    (isAdmin ? catalogBooks[0] : undefined) ??
    null;

  return (
    <CatalogView
      books={catalogBooks}
      categories={catalogCategories}
      spotlight={spotlight}
      isAdmin={isAdmin}
    />
  );
}
