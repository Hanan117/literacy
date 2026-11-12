"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FREE_PAGES } from "@/lib/constants/reader";
import PdfCanvas from "./pdf-canvas";
import ReaderMarginPanel from "./reader-margin-panel";

export type ReaderBookmark = {
  id: string;
  page: number;
  label: string | null;
  note: string | null;
  createdAt: string;
};

export type ReaderBook = {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  pageCount: number;
};

type Tone = "paper" | "sepia" | "slate";

const ZOOM_LEVELS = [0.85, 1, 1.15, 1.3];
const TONES: { id: Tone; color: string; label: string }[] = [
  { id: "paper", color: "#FFFFFF", label: "Kertas terang" },
  { id: "sepia", color: "#F5EADB", label: "Kertas sepia" },
  { id: "slate", color: "#262320", label: "Malam senyap" },
];

const SHEET_TONE: Record<Tone, string> = {
  paper: "bg-white text-[#1d1b18]",
  sepia: "bg-[#F5EADB] text-[#2F251E]",
  slate: "bg-[#262320] text-[#EBE3DA]",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data?.error || "Permintaan gagal.");
  return data;
}

export default function ReaderView({
  book,
  initialPage,
  initialBookmarks,
  isAuthenticated,
  userName,
}: {
  book: ReaderBook;
  initialPage: number;
  initialBookmarks: ReaderBookmark[];
  isAuthenticated: boolean;
  userName: string;
}) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileAttempt, setFileAttempt] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  const totalPages = Math.max(1, book.pageCount);
  const [pageCount, setPageCount] = useState(totalPages);
  const maxPage = isAuthenticated ? pageCount : Math.min(FREE_PAGES, pageCount);

  const [currentPage, setCurrentPage] = useState(() =>
    clamp(Math.round(initialPage) || 1, 1, totalPages)
  );
  const [zoomIndex, setZoomIndex] = useState(1);
  const [tone, setTone] = useState<Tone>("paper");
  const [zen, setZen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);

  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>(initialBookmarks);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [pagesRead, setPagesRead] = useState(1);

  const currentPageRef = useRef(currentPage);
  const visitedRef = useRef<Set<number>>(new Set([currentPage]));
  const guestHydratedRef = useRef(false);
  const toggleBookmarkRef = useRef<() => void>(() => undefined);

  const zoom = ZOOM_LEVELS[zoomIndex];
  const percentage = Math.round((currentPage / pageCount) * 100);
  const remainingMinutes = Math.max(0, (pageCount - currentPage) * 2);
  const pageBookmarks = bookmarks.filter((bookmark) => bookmark.page === currentPage);
  const isBookmarked = pageBookmarks.some((bookmark) => !bookmark.note?.trim());

  useEffect(() => {
    currentPageRef.current = currentPage;
    visitedRef.current.add(currentPage);
    setPagesRead(visitedRef.current.size);
    if (!isAuthenticated && guestHydratedRef.current) {
      try {
        localStorage.setItem(`literacy:guest:${book.id}`, String(currentPage));
      } catch {
        // localStorage bisa diblokir; abaikan.
      }
    }
  }, [currentPage, isAuthenticated, book.id]);

  // Sesi membaca: hitung menit nyata selama tab terbuka.
  useEffect(() => {
    const startedAt = Date.now();
    const tick = () => setSessionMinutes(Math.floor((Date.now() - startedAt) / 60000));
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Pulihkan posisi sampel guest.
  useEffect(() => {
    if (isAuthenticated) return;
    try {
      const raw = localStorage.getItem(`literacy:guest:${book.id}`);
      const saved = raw ? Number(raw) : NaN;
      if (Number.isFinite(saved) && saved >= 1 && saved <= maxPage) {
        // Hidrasi posisi guest dari localStorage (sumber eksternal) setelah mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage(saved);
      }
    } catch {
      // localStorage bisa diblokir; abaikan.
    }
    guestHydratedRef.current = true;
  }, [book.id, isAuthenticated, maxPage]);

  // Simpan pilihan tema.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("literacy:reader-tone") as Tone | null;
      // Preferensi tema dibaca dari localStorage setelah mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved && TONES.some((item) => item.id === saved)) setTone(saved);
    } catch {
      // abaikan
    }
  }, []);

  const chooseTone = (next: Tone) => {
    setTone(next);
    try {
      localStorage.setItem("literacy:reader-tone", next);
    } catch {
      // abaikan
    }
  };

  // Minta signed URL berkas PDF.
  useEffect(() => {
    let cancelled = false;
    // Reset status berkas setiap kali percobaan dimulai.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFileError(null);
    setFileUrl(null);

    apiRequest<{ url: string }>(`/api/books/${book.id}/file`)
      .then((data) => {
        if (!cancelled) setFileUrl(data.url);
      })
      .catch((error: Error) => {
        if (!cancelled) setFileError(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [book.id, fileAttempt]);

  // Simpan progres untuk user login (debounce).
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = window.setTimeout(() => {
      apiRequest(`/api/books/${book.id}/progress`, {
        method: "PUT",
        body: JSON.stringify({ page: currentPage }),
      }).catch(() => undefined);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [book.id, currentPage, isAuthenticated]);

  // Simpan progres terakhir saat tab ditutup.
  useEffect(() => {
    if (!isAuthenticated) return;

    const handler = () => {
      try {
        fetch(`/api/books/${book.id}/progress`, {
          method: "PUT",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page: currentPageRef.current }),
        });
      } catch {
        // abaikan
      }
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [book.id, isAuthenticated]);

  const goToPage = useCallback(
    (target: number) => {
      const next = clamp(Math.round(target) || 1, 1, pageCount);
      if (next > maxPage) {
        setLoginPrompt(true);
        return;
      }
      setCurrentPage(next);
    },
    [maxPage, pageCount]
  );

  const goPrev = useCallback(() => goToPage(currentPageRef.current - 1), [goToPage]);
  const goNext = useCallback(() => goToPage(currentPageRef.current + 1), [goToPage]);

  const handlePageCount = useCallback(
    (count: number) => {
      if (!Number.isFinite(count) || count < 1) return;
      setPageCount(count);
      const limit = isAuthenticated ? count : Math.min(FREE_PAGES, count);
      setCurrentPage((page) => clamp(page, 1, limit));
    },
    [isAuthenticated]
  );

  const handlePdfError = useCallback((message: string) => setFileError(message), []);

  // Keyboard shortcuts.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleBookmarkRef.current();
      } else if (event.key === "Escape") {
        setLoginPrompt(false);
        setNotesOpen(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  // Sinkronkan status zen bila pengguna keluar dari fullscreen lewat Esc.
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setZen(false);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleZen = async () => {
    const next = !zen;
    setZen(next);
    try {
      if (next && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (!next && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen bisa ditolak browser; tampilan zen tetap diterapkan.
    }
  };

  const toggleBookmark = async () => {
    if (!isAuthenticated) {
      setLoginPrompt(true);
      return;
    }
    if (bookmarkBusy) return;

    setBookmarkBusy(true);
    try {
      const existing = pageBookmarks.find((bookmark) => !bookmark.note?.trim());
      if (existing) {
        await apiRequest(`/api/books/${book.id}/bookmarks`, {
          method: "DELETE",
          body: JSON.stringify({ id: existing.id }),
        });
        setBookmarks((items) => items.filter((item) => item.id !== existing.id));
      } else {
        const data = await apiRequest<{ bookmark: ReaderBookmark }>(
          `/api/books/${book.id}/bookmarks`,
          {
            method: "POST",
            body: JSON.stringify({ page: currentPage, label: `Halaman ${currentPage}` }),
          }
        );
        setBookmarks((items) =>
          [...items, data.bookmark].sort((a, b) => a.page - b.page)
        );
      }
    } catch {
      // Gagal menandai halaman tidak menghentikan sesi membaca.
    } finally {
      setBookmarkBusy(false);
    }
  };

  // Selalu arahkan shortcut keyboard ke handler terbaru tanpa memasang ulang listener.
  useEffect(() => {
    toggleBookmarkRef.current = () => {
      void toggleBookmark();
    };
  });

  const addNote = async (note: string) => {
    try {
      const data = await apiRequest<{ bookmark: ReaderBookmark }>(
        `/api/books/${book.id}/bookmarks`,
        {
          method: "POST",
          body: JSON.stringify({
            page: currentPage,
            label: `Halaman ${currentPage}`,
            note,
          }),
        }
      );
      setBookmarks((items) => [...items, data.bookmark].sort((a, b) => a.page - b.page));
      return true;
    } catch {
      return false;
    }
  };

  const updateNote = async (id: string, note: string) => {
    try {
      const data = await apiRequest<{ bookmark: ReaderBookmark }>(
        `/api/books/${book.id}/bookmarks`,
        { method: "PATCH", body: JSON.stringify({ id, note }) }
      );
      setBookmarks((items) =>
        items.map((item) => (item.id === id ? data.bookmark : item))
      );
      return true;
    } catch {
      return false;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await apiRequest(`/api/books/${book.id}/bookmarks`, {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      setBookmarks((items) => items.filter((item) => item.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-8 pt-4 md:px-6 md:pt-6">
      {/* HUD */}
      <header className="sticky top-14 z-30 mb-4 rounded-2xl bg-surface/95 px-4 py-3 shadow-sm backdrop-blur-md md:px-6 lg:top-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate font-serif text-lg font-semibold tracking-tight text-on-surface md:text-xl">
              {book.title}
              <span className="font-normal italic text-on-surface-variant"> — {book.author}</span>
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="text-[11px] text-on-surface-variant">
                Halaman {currentPage} dari {pageCount} ({percentage}%)
              </span>
              <div className="h-1 w-24 overflow-hidden rounded-[999px] bg-surface-container-high">
                <div
                  className="h-full rounded-[999px] bg-primary transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-tertiary">
                Sisa ±{remainingMinutes} mnt
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2 shadow-sm">
            <div className="flex items-center gap-1 pr-2">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                format_size
              </span>
              <button
                type="button"
                onClick={() => setZoomIndex((index) => clamp(index - 1, 0, ZOOM_LEVELS.length - 1))}
                disabled={zoomIndex === 0}
                className="grid h-7 w-7 place-items-center rounded text-[11px] font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
                aria-label="Perkecil halaman"
              >
                A-
              </button>
              <span className="px-1 text-[11px] font-semibold text-primary">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoomIndex((index) =>
                    clamp(index + 1, 0, ZOOM_LEVELS.length - 1)
                  )
                }
                disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                className="grid h-7 w-7 place-items-center rounded text-[11px] font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
                aria-label="Perbesar halaman"
              >
                A+
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-surface-container p-1">
              {TONES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseTone(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  aria-pressed={tone === item.id}
                  className={`h-6 w-6 rounded-[999px] ring-2 transition-all ${
                    tone === item.id
                      ? "scale-105 ring-primary"
                      : "ring-transparent hover:ring-outline-variant"
                  }`}
                  style={{ backgroundColor: item.color }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 pl-1">
              <button
                type="button"
                onClick={toggleBookmark}
                disabled={bookmarkBusy}
                className={`flex items-center gap-1 rounded-lg p-2 transition-colors hover:bg-surface-container disabled:opacity-50 ${
                  isBookmarked ? "text-primary" : "text-on-surface-variant"
                }`}
                title={isBookmarked ? "Hapus tanda halaman" : "Tandai halaman ini"}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: `'FILL' ${isBookmarked ? 1 : 0}` }}
                >
                  bookmark
                </span>
                <span className="hidden text-[11px] xl:inline">
                  {isBookmarked ? "Tersimpan" : "Tandai"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setNotesOpen((open) => !open)}
                className="relative rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                title="Buka catatan marjin"
              >
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
                {bookmarks.some((bookmark) => bookmark.note?.trim()) && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-[999px] bg-secondary" />
                )}
              </button>

              <button
                type="button"
                onClick={toggleZen}
                className={`rounded-lg p-2 transition-colors hover:bg-surface-container ${
                  zen
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                title="Mode zen layar penuh"
              >
                <span className="material-symbols-outlined text-[20px]">fullscreen</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hairline progress */}
      <div className="relative mb-6 h-[3px] w-full overflow-hidden rounded-[999px] bg-surface-container-high">
        <div
          className="absolute inset-y-0 left-0 rounded-[999px] bg-primary-container transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className={`grid grid-cols-1 gap-6 ${zen ? "" : "lg:grid-cols-12"}`}>
        <article
          className={`relative rounded-2xl p-4 shadow-sm transition-colors duration-300 sm:p-8 md:p-10 ${
            zen ? "mx-auto w-full max-w-4xl" : "lg:col-span-8"
          } ${SHEET_TONE[tone]}`}
        >
          <div className="pointer-events-none absolute bottom-8 left-0 top-8 w-1 rounded-r bg-gradient-to-b from-primary/10 via-primary/30 to-primary/10" />

          <header className="mb-6 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-secondary">
              {book.title}
            </span>
            <p className="mx-auto mt-2 max-w-lg font-serif text-sm italic text-on-surface-variant">
              Halaman {currentPage} • {book.author}
            </p>
          </header>

          {fileError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-container-low p-8 text-center">
              <span className="material-symbols-outlined text-[30px] text-error">error</span>
              <p className="text-sm text-on-surface-variant">{fileError}</p>
              <button
                type="button"
                onClick={() => setFileAttempt((attempt) => attempt + 1)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container"
              >
                Muat ulang berkas
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <PdfCanvas
                fileUrl={fileUrl}
                page={currentPage}
                zoom={zoom}
                tone={tone}
                onPageCount={handlePageCount}
                onError={handlePdfError}
                onPrev={goPrev}
                onNext={goNext}
              />
            </div>
          )}

          {!isAuthenticated && currentPage >= maxPage && (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-xl bg-secondary-fixed/40 p-5 text-center">
              <span className="material-symbols-outlined text-[26px] text-secondary">lock</span>
              <div>
                <p className="font-serif text-base font-semibold text-on-surface">
                  Sampel gratis berakhir di halaman {maxPage}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Masuk atau buat akun untuk membaca seluruh buku dan menyimpan progres.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href={`/login?returnTo=/read/${book.id}`}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container"
                >
                  Masuk untuk lanjut
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container"
                >
                  Buat akun
                </Link>
              </div>
            </div>
          )}
        </article>

        {!zen && (
          <>
            {notesOpen && (
              <button
                type="button"
                aria-label="Tutup catatan"
                onClick={() => setNotesOpen(false)}
                className="fixed inset-0 z-40 bg-on-surface/30 backdrop-blur-sm lg:hidden"
              />
            )}
            <aside
              className={`${
                notesOpen
                  ? "fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-background p-4 shadow-2xl"
                  : "hidden"
              } lg:static lg:z-auto lg:col-span-4 lg:block lg:w-auto lg:max-w-none lg:overflow-visible lg:bg-transparent lg:p-0 lg:shadow-none`}
            >
              <div className="mb-3 flex items-center justify-between lg:hidden">
                <span className="text-sm font-semibold text-on-surface">Catatan & Sesi</span>
                <button
                  type="button"
                  onClick={() => setNotesOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                  aria-label="Tutup catatan"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <ReaderMarginPanel
                bookmarks={bookmarks}
                currentPage={currentPage}
                pageCount={pageCount}
                userName={userName}
                isAuthenticated={isAuthenticated}
                sessionMinutes={sessionMinutes}
                pagesRead={pagesRead}
                onAddNote={addNote}
                onUpdateNote={updateNote}
                onDeleteNote={deleteNote}
                onGoToPage={(page) => {
                  goToPage(page);
                  setNotesOpen(false);
                }}
                onRequestLogin={() => setLoginPrompt(true)}
              />
            </aside>
          </>
        )}
      </div>

      {/* Bottom navigation */}
      <nav className="sticky bottom-4 z-20 mx-auto mt-8 flex w-full max-w-5xl flex-col items-center justify-between gap-3 rounded-2xl bg-surface/90 p-3 shadow-xl backdrop-blur-xl sm:flex-row sm:p-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentPage <= 1}
          className="group flex w-full items-center gap-3 rounded-xl bg-surface-container-low px-4 py-2.5 text-left text-on-surface transition-all hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          <span className="material-symbols-outlined text-primary transition-transform group-hover:-translate-x-1">
            arrow_back
          </span>
          <span className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Sebelumnya
            </span>
            <span className="text-xs font-medium">Halaman {Math.max(1, currentPage - 1)}</span>
          </span>
        </button>

        <div className="flex w-full items-center justify-center gap-3 sm:w-80">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 10)}
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            title="Mundur 10 halaman"
          >
            <span className="material-symbols-outlined text-[18px]">fast_rewind</span>
          </button>

          <div className="flex flex-1 flex-col items-center">
            <div className="mb-1 flex w-full justify-between text-[10px] text-on-surface-variant">
              <span>Hal. {currentPage}</span>
              <span className="font-semibold text-primary">{percentage}%</span>
              <span>Hal. {pageCount}</span>
            </div>
            <input
              type="range"
              min={1}
              max={maxPage}
              value={Math.min(currentPage, maxPage)}
              onChange={(event) => goToPage(Number(event.target.value))}
              aria-label="Slider halaman"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
            />
          </div>

          <button
            type="button"
            onClick={() => goToPage(currentPage + 10)}
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            title="Maju 10 halaman"
          >
            <span className="material-symbols-outlined text-[18px]">fast_forward</span>
          </button>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={currentPage >= pageCount}
          className="group flex w-full items-center justify-between gap-3 rounded-xl bg-primary px-4 py-2.5 text-on-primary shadow-sm transition-all hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:justify-end"
        >
          <span className="flex flex-col text-left sm:text-right">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-primary-fixed">
              Berikutnya
            </span>
            <span className="text-xs font-medium">
              Halaman {Math.min(pageCount, currentPage + 1)}
            </span>
          </span>
          <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
            arrow_forward
          </span>
        </button>
      </nav>

      {/* Login prompt */}
      {loginPrompt && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-on-surface/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[22px]">auto_stories</span>
                </span>
                <div>
                  <h2 className="font-serif text-lg font-semibold text-on-surface">
                    Baca seluruh buku
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Gratis. Progres dan catatan tersimpan otomatis.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoginPrompt(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
              Anda sudah membaca {maxPage} halaman sampel dari{" "}
              <span className="font-medium text-on-surface">{book.title}</span>. Masuk untuk
              melanjutkan dari halaman terakhir Anda.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/login?returnTo=/read/${book.id}`}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="flex-1 rounded-lg bg-surface-container-low px-4 py-2.5 text-center text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
              >
                Buat akun
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
