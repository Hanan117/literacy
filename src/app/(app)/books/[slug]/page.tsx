import Link from "next/link";
import { notFound } from "next/navigation";
import BookNotes, { type BookNote } from "@/components/books/book-notes";
import { getAppUser } from "@/lib/auth/get-app-user";
import { resolveCoverUrl } from "@/lib/books/cover-url";
import { FREE_PAGES } from "@/lib/constants/reader";
import { formatReadingDuration } from "@/lib/data/catalog";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

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

  const [progress, notes] = await Promise.all([
    user
      ? prisma.progress.findUnique({
          where: { userId_bookId: { userId: user.id, bookId: book.id } },
          select: { currentPage: true, isCompleted: true, lastReadAt: true },
        })
      : Promise.resolve(null),
    user
      ? prisma.bookmark.findMany({
          where: {
            userId: user.id,
            bookId: book.id,
            note: { not: null },
          },
          orderBy: [{ page: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            page: true,
            label: true,
            note: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const cover = resolveCoverUrl(book.coverUrl);
  const duration = formatReadingDuration(book.estimatedMinutes, book.pdfPageCount);
  const percentage = progress
    ? Math.min(
        100,
        Math.round((progress.currentPage / Math.max(1, book.pdfPageCount)) * 100)
      )
    : 0;

  const bookNotes: BookNote[] = notes
    .filter((note) => note.note?.trim())
    .map((note) => ({
      id: note.id,
      page: note.page,
      label: note.label,
      note: note.note ?? "",
      createdAt: note.createdAt.toISOString(),
    }));

  const ctaLabel = !user
    ? `Baca Sampel (Halaman 1-${FREE_PAGES})`
    : progress && progress.currentPage > 1
      ? progress.isCompleted
        ? "Baca Ulang"
        : `Lanjutkan — Halaman ${progress.currentPage}`
      : "Mulai Membaca";

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-6 md:px-8 md:py-10">
      {/* Breadcrumb & archival context */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <div className="flex flex-wrap items-center gap-2 text-on-surface-variant">
          <Link
            href="/katalog"
            className="flex items-center gap-1 transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Katalog Koleksi
          </Link>
          <span className="select-none text-outline-variant">/</span>
          <span className="font-medium uppercase tracking-wider text-secondary">
            {book.category?.name ?? "Tanpa Kategori"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-[999px] bg-tertiary" />
          <span>Diperbarui {formatDate(book.updatedAt)}</span>
          {!book.isPublished && (
            <span className="rounded bg-tertiary-fixed/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-tertiary">
              Draft
            </span>
          )}
        </div>
      </div>

      {/* Book hero */}
      <section className="mt-8 grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="flex justify-center lg:col-span-4 lg:justify-start">
          <div className="relative">
            <div className="absolute -inset-2 rounded-xl bg-on-background/10 opacity-60 blur-xl" />
            <div className="relative flex aspect-[1/1.48] w-60 select-none flex-col justify-between overflow-hidden rounded-lg bg-surface-container p-7 shadow-xl sm:w-64">
              <div className="pointer-events-none absolute bottom-0 left-0 top-0 w-3.5 bg-gradient-to-r from-on-background/25 via-on-background/10 to-transparent" />
              <div className="pointer-events-none absolute bottom-0 left-3.5 top-0 w-px bg-white/30" />

              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={`Sampul ${book.title}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <>
                  <div className="relative z-10 flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                      {book.series ?? "Koleksi Literacy"}
                    </span>
                    <div className="mt-2 h-[2px] w-8 bg-primary" />
                  </div>

                  <div className="relative z-10 my-auto py-6">
                    <h2 className="font-serif text-2xl font-medium leading-tight text-on-surface">
                      {book.title}
                    </h2>
                    <p className="mt-2 font-serif text-sm italic text-on-surface-variant">
                      {book.category?.name ?? "Ruang Baca"}
                    </p>
                    <span className="mt-4 inline-block text-[11px] font-semibold uppercase tracking-wider text-primary">
                      {book.author}
                    </span>
                  </div>

                  <div className="relative z-10 flex items-end justify-between text-on-surface-variant/70">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest">Bahasa</span>
                      <span className="text-sm font-medium text-on-surface">
                        {book.language}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-[24px] text-primary">
                      menu_book
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-8">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-secondary">
              {book.category?.name ?? "Tanpa Kategori"} • {book.language}
            </span>
            <h1 className="mt-2 font-serif text-3xl font-medium leading-tight tracking-tight text-on-surface md:text-[38px]">
              {book.title}
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant md:text-base">
              Karya <span className="font-medium text-on-surface">{book.author}</span>
              {book.series ? ` • ${book.series}` : " • Kurasi Literacy"}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1.5 text-on-surface">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  auto_stories
                </span>
                {book.pdfPageCount} Halaman
              </span>
              <span className="text-outline-variant">•</span>
              <span>{duration}</span>
              <span className="text-outline-variant">•</span>
              <span>{book.language}</span>
            </div>
          </div>

          <div className="flex max-w-lg flex-col gap-2">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-2 text-on-surface-variant">
                <span className="h-2 w-2 rounded-[999px] bg-primary" />
                {progress
                  ? `Terakhir dibaca: Halaman ${progress.currentPage}`
                  : user
                    ? "Belum dimulai"
                    : `Sampel gratis: halaman 1–${FREE_PAGES}`}
              </span>
              <span className="font-semibold text-primary">
                {percentage}% Selesai
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-[999px] bg-surface-container-highest">
              <div
                className="h-full rounded-[999px] bg-primary transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={`/read/${book.id}`}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-on-primary shadow-sm transition-colors hover:bg-primary-container"
            >
              {ctaLabel}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <a
              href="#catatan"
              className="flex items-center gap-2 rounded-lg bg-surface-container px-4 py-3 text-sm text-on-surface transition-colors hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">
                edit_note
              </span>
              Tulis Catatan
            </a>
            <Link
              href={`/books/${book.slug}/reviews`}
              className="flex items-center gap-2 rounded-lg bg-surface-container px-4 py-3 text-sm text-on-surface transition-colors hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">
                star
              </span>
              Rating &amp; Ulasan
            </Link>
          </div>

          {!user && (
            <p className="max-w-xl text-[11px] leading-relaxed text-outline">
              Tanpa akun Anda dapat membaca {FREE_PAGES} halaman pertama. Masuk untuk membuka
              seluruh isi dan menyimpan catatan.
            </p>
          )}
        </div>
      </section>

      {/* Editorial divider */}
      <div className="mx-auto mt-10 flex w-full max-w-[1040px] items-center gap-4 opacity-60">
        <div className="h-px flex-1 bg-surface-container-highest" />
        <span className="material-symbols-outlined text-[18px] text-outline">
          auto_stories
        </span>
        <div className="h-px flex-1 bg-surface-container-highest" />
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-[840px] flex-col gap-10 pb-4">
        {/* Synopsis */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-highest pb-3">
            <h2 className="font-serif text-xl font-semibold text-on-surface md:text-2xl">
              Sinopsis
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
              {book.category?.name ?? "Koleksi Literacy"}
            </span>
          </div>
          <p className="whitespace-pre-line font-serif text-[16px] leading-relaxed text-on-surface/90">
            {book.synopsis?.trim() ||
              "Sinopsis belum tersedia untuk buku ini. Anda tetap dapat membuka Mode Baca untuk menelusuri isi buku."}
          </p>
        </section>

        {/* Personal notes */}
        <BookNotes
          bookId={book.id}
          pageCount={book.pdfPageCount}
          initialNotes={bookNotes}
          defaultPage={progress?.currentPage ?? 1}
          isAuthenticated={Boolean(user)}
          returnTo={`/books/${book.slug}`}
        />

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container-highest py-5 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-tertiary">public</span>
            <span>
              {book.category?.name ?? "Koleksi Literacy"} • {book.language}
            </span>
          </div>
          <Link
            href="/katalog"
            className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary transition-colors hover:text-primary-container"
          >
            Koleksi Terkait
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
