import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppUser } from "@/lib/auth/get-app-user";
import { resolveCoverUrl } from "@/lib/books/cover-url";
import { formatReadingDuration } from "@/lib/data/catalog";
import { FREE_PAGES } from "@/lib/constants/reader";
import { prisma } from "@/lib/prisma";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getAppUser();
  const isAdmin = user?.role === "ADMIN";

  const book = await prisma.book.findFirst({
    where: { slug, deletedAt: null },
    include: { category: true },
  });

  if (!book) notFound();
  if (!book.isPublished && !isAdmin) notFound();

  const progress = user
    ? await prisma.progress.findUnique({
        where: { userId_bookId: { userId: user.id, bookId: book.id } },
        select: { currentPage: true, percentage: true, isCompleted: true },
      })
    : null;

  const cover = resolveCoverUrl(book.coverUrl);
  const duration = formatReadingDuration(book.estimatedMinutes, book.pdfPageCount);
  const percentage = progress?.currentPage
    ? Math.min(100, Math.round((progress.currentPage / Math.max(1, book.pdfPageCount)) * 100))
    : 0;

  const ctaLabel = !user
    ? `Baca Sampel (Halaman 1-${FREE_PAGES})`
    : progress && progress.currentPage > 1
      ? progress.isCompleted
        ? "Baca Ulang"
        : `Lanjutkan — Halaman ${progress.currentPage}`
      : "Mulai Membaca";

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 md:px-8 md:py-14">
      <Link
        href={user ? "/katalog" : "/"}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:text-primary"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        {user ? "Kembali ke katalog" : "Kembali ke beranda"}
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <div className="relative overflow-hidden rounded-xl shadow-2xl">
            <div className="absolute inset-y-0 left-0 z-10 w-2 bg-gradient-to-r from-black/35 via-black/15 to-transparent" />
            <div className="aspect-[2/3] w-full">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={`Sampul ${book.title}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary to-primary-container p-6 text-center text-on-primary">
                  <span className="text-[9px] uppercase tracking-[0.22em] opacity-70">
                    Literacy
                  </span>
                  <span className="mt-3 font-serif text-xl leading-tight">{book.title}</span>
                  <span className="mt-auto pt-3 text-[10px] opacity-75">{book.author}</span>
                </div>
              )}
            </div>
          </div>

          {user && progress && progress.currentPage > 1 && (
            <div className="mt-4 rounded-xl bg-surface-container-low p-4 shadow-sm">
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>Progres terakhir</span>
                <span className="font-semibold text-primary">{percentage}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-[999px] bg-surface-container-high">
                <div
                  className="h-full rounded-[999px] bg-primary transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-on-surface-variant">
                Halaman {progress.currentPage} dari {book.pdfPageCount}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
            {book.category?.name ?? "Tanpa Kategori"}
          </span>
          <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-on-surface md:text-4xl">
            {book.title}
          </h1>
          <p className="mt-1 text-lg text-on-surface-variant">{book.author}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">description</span>
              {book.pdfPageCount} halaman
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">translate</span>
              {book.language}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              {duration}
            </span>
            {!book.isPublished && (
              <span className="rounded bg-tertiary-fixed/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-tertiary">
                Draft — hanya admin
              </span>
            )}
          </div>

          {book.series && (
            <p className="mt-3 text-xs text-outline">Seri: {book.series}</p>
          )}

          <div className="mt-6 rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
            <h2 className="font-serif text-lg font-semibold text-on-surface">Sinopsis</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
              {book.synopsis?.trim() || "Sinopsis belum tersedia untuk buku ini."}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/read/${book.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container"
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              {ctaLabel}
            </Link>

            {!user && (
              <Link
                href={`/login?returnTo=/books/${book.slug}`}
                className="inline-flex items-center gap-2 rounded-lg bg-surface-container px-5 py-3 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Masuk untuk baca penuh
              </Link>
            )}
          </div>

          <p className="mt-4 max-w-xl text-[11px] leading-relaxed text-outline">
            {user
              ? "Progres halaman tersimpan otomatis saat Anda membaca."
              : `Tanpa akun Anda dapat membaca ${FREE_PAGES} halaman pertama. Masuk untuk membuka seluruh isi buku.`}
          </p>
        </div>
      </div>
    </div>
  );
}
