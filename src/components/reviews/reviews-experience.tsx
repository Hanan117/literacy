"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  RATING_LABELS,
  formatReviewDate,
  starFill,
  type RatingBucket,
  type ReviewFilter,
  type ReviewItem,
  type ReviewSort,
  type ReviewSummary,
} from "@/lib/reviews";

type Props = {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  isAuthenticated: boolean;
  returnTo: string;
  ownReview: ReviewItem | null;
  summary: ReviewSummary;
  reviews: ReviewItem[];
  filter: ReviewFilter;
  sort: ReviewSort;
  page: number;
  pageCount: number;
  counts: { all: number; curator: number; quote: number };
};

function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function RatingStars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <div
      aria-label={`${value} dari 5 bintang`}
      className="flex items-center gap-0.5"
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = starFill(value, index);
        return (
          <span key={index} className={`relative inline-block ${size}`}>
            <StarIcon className={`${size} text-outline-variant`} />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill}%` }}
            >
              <StarIcon className={`${size} text-primary`} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function Distribution({ buckets }: { buckets: RatingBucket[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {buckets.map((bucket) => (
        <div
          key={bucket.rating}
          className="flex items-center gap-2 text-[11px] text-on-surface-variant"
          title={`${bucket.count} ulasan ${bucket.rating} bintang`}
        >
          <span className="w-3 text-right tabular-nums">{bucket.rating}</span>
          <StarIcon className="h-3 w-3 text-primary/70" />
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
            <span
              className="block h-full rounded-full bg-primary/70"
              style={{ width: `${bucket.percent}%` }}
            />
          </span>
          <span className="w-6 text-right tabular-nums">{bucket.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReviewsExperience({
  bookId,
  bookTitle,
  bookAuthor,
  isAuthenticated,
  returnTo,
  ownReview,
  summary,
  reviews,
  filter,
  sort,
  page,
  pageCount,
  counts,
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [quote, setQuote] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  const quickRating = hoverRating || ownReview?.rating || 0;

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  const buildHref = (next: {
    filter?: ReviewFilter;
    sort?: ReviewSort;
    page?: number;
  }) => {
    const nextFilter = next.filter ?? filter;
    const nextSort = next.sort ?? sort;
    const nextPage = next.page ?? 1;
    const params = new URLSearchParams();
    if (nextFilter !== "semua") params.set("filter", nextFilter);
    if (nextSort !== "terbaru") params.set("sort", nextSort);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return `${returnTo}${query ? `?${query}` : ""}`;
  };

  const openComposer = (initialRating?: number) => {
    if (!isAuthenticated) {
      router.push(loginHref);
      return;
    }
    setRating(initialRating ?? ownReview?.rating ?? 5);
    setTitle(ownReview?.title ?? "");
    setQuote(ownReview?.quote ?? "");
    setBody(ownReview?.body ?? "");
    setHoverRating(0);
    setError(null);
    setModalOpen(true);
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/books/${bookId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, quote, body }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan ulasan.");
      setModalOpen(false);
      router.refresh();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (deleting) return;
    if (!window.confirm("Hapus ulasan Anda untuk buku ini?")) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/books/${bookId}/reviews`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Gagal menghapus ulasan.");
      router.refresh();
    } catch (deleteError) {
      setError((deleteError as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const filterTabs: Array<{ key: ReviewFilter; label: string; count: number }> = [
    { key: "semua", label: "Semua Ulasan", count: counts.all },
    { key: "kurator", label: "Kurator", count: counts.curator },
    { key: "kutipan", label: "Dengan Kutipan", count: counts.quote },
  ];

  return (
    <>
      <header className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-secondary">
            Konsensus &amp; Telaah Pembaca
          </span>
          <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-on-surface md:text-[38px]">
            Rating &amp; Ulasan
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            Refleksi kritis dan dialog interpretatif para pembaca atas naskah{" "}
            <em className="font-serif">{bookTitle}</em> karya {bookAuthor}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openComposer()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-on-primary shadow-sm transition-colors hover:bg-primary-container"
        >
          <span className="material-symbols-outlined text-[18px]">edit_note</span>
          {ownReview ? "Ubah Ulasan" : "Tulis Ulasan"}
        </button>
      </header>

      <section className="mt-6 rounded-xl border border-surface-container-high bg-surface-container-lowest p-5 md:p-7">
        <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
          <div className="flex items-center gap-5">
            <span className="font-serif text-5xl font-semibold leading-none text-primary">
              {summary.average ? summary.average.toFixed(1) : "—"}
            </span>
            <div>
              <RatingStars value={summary.average ?? 0} size="h-5 w-5" />
              <p className="mt-1.5 text-xs text-on-surface-variant">
                {summary.total > 0
                  ? `${summary.total} ulasan pembaca`
                  : "Belum ada ulasan"}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-widest text-outline">
                Skala 5.0
              </p>
            </div>
          </div>

          <Distribution buckets={summary.distribution} />
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-surface-container-high pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary-fixed/50 text-on-secondary-fixed">
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
            </span>
            <span className="text-sm font-medium text-on-surface">
              Bagaimana penilaian Anda untuk edisi ini?
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => openComposer(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label={`${value} bintang: ${RATING_LABELS[value]}`}
                  title={`${value}: ${RATING_LABELS[value]}`}
                >
                  <StarIcon
                    className={`h-6 w-6 ${
                      value <= quickRating ? "text-primary" : "text-outline-variant"
                    }`}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => openComposer()}
              className="text-xs font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
            >
              {ownReview ? "Ubah ulasan" : "Tulis ulasan"}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Filter ulasan"
          className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-surface-container-high"
        >
          {filterTabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <Link
                key={tab.key}
                href={buildHref({ filter: tab.key, page: 1 })}
                className={`-mb-px border-b-2 px-0.5 pb-2.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab.label}
                <span className="ml-1 text-[10px] font-normal text-outline">
                  ({tab.count})
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
          <span className="text-outline">Urutkan</span>
          <Link
            href={buildHref({ sort: "terbaru", page: 1 })}
            className={
              sort === "terbaru"
                ? "font-semibold text-primary"
                : "transition-colors hover:text-on-surface"
            }
          >
            Terbaru
          </Link>
          <span className="text-outline-variant">·</span>
          <Link
            href={buildHref({ sort: "tertinggi", page: 1 })}
            className={
              sort === "tertinggi"
                ? "font-semibold text-primary"
                : "transition-colors hover:text-on-surface"
            }
          >
            Tertinggi
          </Link>
        </div>
      </section>

      {error && !modalOpen && (
        <p className="mt-4 rounded-lg bg-error-container/60 px-3 py-2 text-xs text-on-error-container">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-4">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-surface-container-high bg-surface-container-lowest p-10 text-center">
            <span className="material-symbols-outlined text-[32px] text-outline/60">
              rate_review
            </span>
            <div>
              <p className="font-serif text-base font-semibold text-on-surface">
                {summary.total === 0
                  ? "Belum ada ulasan untuk buku ini"
                  : "Tidak ada ulasan pada filter ini"}
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-on-surface-variant">
                {summary.total === 0
                  ? "Jadilah pembaca pertama yang membagikan refleksi dan penilaian."
                  : "Coba lihat semua ulasan atau pilih filter lain."}
              </p>
            </div>
            {summary.total === 0 ? (
              <button
                type="button"
                onClick={() => openComposer()}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Tulis Ulasan Pertama
              </button>
            ) : (
              <Link
                href={buildHref({ filter: "semua", page: 1 })}
                className="mt-1 text-xs font-medium text-primary underline decoration-primary/30 underline-offset-4"
              >
                Lihat semua ulasan
              </Link>
            )}
          </div>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-5 md:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-container font-serif text-sm font-semibold text-primary">
                    {review.author.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-sm font-semibold text-on-surface">
                        {review.author.name}
                      </span>
                      {review.author.isCurator && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed/40 px-2 py-0.5 text-[10px] font-medium text-tertiary">
                          <span className="material-symbols-outlined text-[12px]">
                            verified
                          </span>
                          Kurator
                        </span>
                      )}
                      {review.isOwner && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Ulasan Anda
                        </span>
                      )}
                    </div>
                    <span className="mt-0.5 block text-[11px] text-on-surface-variant">
                      {formatReviewDate(review.createdAt)}
                    </span>
                  </div>
                </div>
                <RatingStars value={review.rating} />
              </div>

              <h2 className="mt-4 font-serif text-lg font-semibold leading-snug text-on-surface">
                {review.title}
              </h2>

              {review.quote && (
                <blockquote className="mt-3 flex gap-3 rounded-lg bg-surface-container-low px-4 py-3">
                  <span className="material-symbols-outlined text-[18px] text-primary/70">
                    format_quote
                  </span>
                  <p className="font-serif text-sm italic leading-relaxed text-on-surface">
                    “{review.quote}”
                  </p>
                </blockquote>
              )}

              <p className="mt-3 whitespace-pre-line font-serif text-[15px] leading-relaxed text-on-surface-variant">
                {review.body}
              </p>

              {review.isOwner && (
                <div className="mt-4 flex items-center gap-3 border-t border-surface-container-high pt-3 text-[11px]">
                  <button
                    type="button"
                    onClick={() => openComposer()}
                    className="inline-flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary-container"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={remove}
                    disabled={deleting}
                    className="inline-flex items-center gap-1 font-medium text-on-surface-variant transition-colors hover:text-error disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                    {deleting ? "Menghapus…" : "Hapus"}
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-surface-container-high pt-4 text-[11px] text-on-surface-variant">
          <span>
            Halaman {page} dari {pageCount}
          </span>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={buildHref({ page: page - 1 })}
                className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-3 py-2 font-medium text-on-surface transition-colors hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-[15px]">
                  chevron_left
                </span>
                Sebelumnya
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg bg-surface-container px-3 py-2 font-medium text-on-surface-variant opacity-50">
                <span className="material-symbols-outlined text-[15px]">
                  chevron_left
                </span>
                Sebelumnya
              </span>
            )}
            {page < pageCount ? (
              <Link
                href={buildHref({ page: page + 1 })}
                className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-3 py-2 font-medium text-on-surface transition-colors hover:bg-surface-container-high"
              >
                Berikutnya
                <span className="material-symbols-outlined text-[15px]">
                  chevron_right
                </span>
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg bg-surface-container px-3 py-2 font-medium text-on-surface-variant opacity-50">
                Berikutnya
                <span className="material-symbols-outlined text-[15px]">
                  chevron_right
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-[11px] leading-relaxed text-on-surface-variant">
        Semua ulasan di Litera dimoderasi untuk menjaga diskursus yang beradab,
        berbobot, dan bernas.
      </p>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-on-surface/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl md:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  id="review-dialog-title"
                  className="font-serif text-lg font-semibold text-on-surface"
                >
                  {ownReview ? "Ubah Ulasan" : "Tulis Ulasan"}
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Bagikan perspektif Anda atas naskah {bookTitle}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <div>
                <span className="mb-1.5 block text-xs font-medium text-on-surface-variant">
                  Penilaian Anda
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      aria-label={`${value} bintang: ${RATING_LABELS[value]}`}
                    >
                      <StarIcon
                        className={`h-7 w-7 ${
                          value <= (hoverRating || rating)
                            ? "text-primary"
                            : "text-outline-variant"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-on-surface-variant">
                    {rating}.0 · {RATING_LABELS[rating]}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="review-title"
                  className="mb-1 block text-xs font-medium text-on-surface-variant"
                >
                  Judul Ulasan
                </label>
                <input
                  id="review-title"
                  type="text"
                  maxLength={120}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Contoh: Menemukan kompas batin di tengah riuh"
                  className="w-full rounded-lg bg-surface-container-low px-3 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>

              <div>
                <label
                  htmlFor="review-quote"
                  className="mb-1 block text-xs font-medium text-on-surface-variant"
                >
                  Kutipan Naskah <span className="font-normal">(opsional)</span>
                </label>
                <input
                  id="review-quote"
                  type="text"
                  maxLength={280}
                  value={quote}
                  onChange={(event) => setQuote(event.target.value)}
                  placeholder="“Ingatlah bahwa manusia ada untuk satu sama lain…”"
                  className="w-full rounded-lg bg-surface-container-low px-3 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>

              <div>
                <label
                  htmlFor="review-body"
                  className="mb-1 block text-xs font-medium text-on-surface-variant"
                >
                  Isi Ulasan
                </label>
                <textarea
                  id="review-body"
                  rows={5}
                  maxLength={4000}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Uraikan pemikiran, sanggahan, atau apresiasi Anda terhadap isi naskah…"
                  className="w-full resize-none rounded-lg bg-surface-container-low px-3 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-error-container/60 px-3 py-2 text-xs text-on-error-container">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={
                  busy ||
                  title.trim().length < 3 ||
                  body.trim().length < 20 ||
                  rating < 1
                }
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Menyimpan…" : ownReview ? "Perbarui Ulasan" : "Kirim Ulasan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
