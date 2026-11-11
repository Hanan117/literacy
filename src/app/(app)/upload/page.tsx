import { redirect } from "next/navigation";
import UploadManager, {
  type UploadBook,
  type UploadCategory,
} from "@/components/upload/upload-manager";
import { getAdminUser } from "@/lib/auth/require-admin";
import { resolveCoverUrl } from "@/lib/books/cover-url";
import { prisma } from "@/lib/prisma";

export default async function UploadPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/katalog");

  const [books, categories] = await Promise.all([
    prisma.book.findMany({
      where: { deletedAt: null },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);

  const uploadBooks: UploadBook[] = books.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    category: book.category?.name ?? "Tanpa Kategori",
    isPublished: book.isPublished,
    coverUrl: resolveCoverUrl(book.coverUrl),
    fileSize: book.fileSize === null ? null : Number(book.fileSize),
    pdfPageCount: book.pdfPageCount,
    createdAt: book.createdAt.toISOString(),
  }));

  const uploadCategories: UploadCategory[] = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
  }));

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-8 md:px-8 md:py-10 xl:px-10">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-[999px] bg-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
          Area Kurator
        </span>
      </div>

      <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-on-surface md:text-4xl">
        Upload PDF
      </h1>
      <p className="mt-3 max-w-2xl font-serif text-[15px] leading-relaxed text-on-surface-variant">
        Unggah buku baru, atur metadata, lalu publikasikan. Buku draft tidak akan tampil
        di katalog pembaca sampai Anda menekan Publikasikan.
      </p>

      <UploadManager books={uploadBooks} categories={uploadCategories} />
    </div>
  );
}
