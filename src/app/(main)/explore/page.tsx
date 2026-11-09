"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BookResult = {
  id: string;
  title: string;
  authors: string[];
  publishedDate?: string;
  thumbnail?: string;
  categories: string[];
  infoLink?: string;
};

type SearchResponse = {
  items: BookResult[];
  total: number;
  query: string;
  error?: string;
};

function yearOf(publishedDate?: string) {
  if (!publishedDate) return undefined;
  const m = publishedDate.match(/\d{4}/);
  return m ? m[0] : undefined;
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("Semua");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 450);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      setTotal(0);
      setError(null);
      setLoading(false);
      setActiveFilter("Semua");
      return;
    }

    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(debounced)}&maxResults=16`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as SearchResponse;
        if (!res.ok || data.error) {
          setResults([]);
          setTotal(0);
          setError(data.error || "Gagal mencari buku.");
          return;
        }
        setResults(data.items ?? []);
        setTotal(data.total ?? 0);
        setActiveFilter("Semua");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setResults([]);
        setTotal(0);
        setError("Terjadi kesalahan saat mencari buku.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [debounced]);

  const filters = useMemo(() => {
    const cats = Array.from(new Set(results.flatMap((r) => r.categories).filter(Boolean)));
    return ["Semua", ...cats.slice(0, 8)];
  }, [results]);

  const filtered = useMemo(() => {
    if (activeFilter === "Semua") return results;
    return results.filter((r) => r.categories.includes(activeFilter));
  }, [results, activeFilter]);

  const hasQuery = debounced.length >= 2;

  return (
    <div className="w-full max-w-6xl mx-auto px-gutter py-space-xl flex flex-col gap-space-xl">
      <section className="flex flex-col gap-space-lg pt-space-md">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md border-b border-surface-container-high pb-space-lg">
          <div className="flex flex-col max-w-2xl">
            <div className="flex items-center gap-2 mb-space-xs text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">Katalog • Pencarian Langsung</span>
            </div>
            <h1 className="text-3xl md:text-5xl text-on-surface tracking-tight font-serif">
              Eksplorasi
            </h1>
            <p className="text-base text-on-surface-variant mt-2">
              Cari buku (judul atau penulis) — hasil dimuat saat kamu mencari agar tetap hemat dan up-to-date. Buku yang bisa dibaca di sini hanya yang memiliki PDF.
            </p>
          </div>
          <div className="flex items-center gap-space-sm self-start md:self-end text-outline">
            <span className="text-xs tracking-widest uppercase">Koleksi Terverifikasi</span>
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
        </div>

        <div className="flex flex-col gap-space-md">
          <div className="relative flex-1 max-w-xl group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm pl-12 pr-4 py-3 rounded-lg shadow-sm focus:outline-none focus:shadow-md transition-all"
              placeholder="Cari judul atau penulis (mis. Atomic Habits)..."
              type="search"
              aria-label="Cari buku"
            />
          </div>
          {hasQuery && results.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter kategori hasil">
              {filters.map((filter) => {
                const active = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    aria-pressed={active}
                    className={
                      active
                        ? "px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap bg-primary text-on-primary shadow-sm"
                        : "px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                    }
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-space-md pt-space-sm">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs text-outline tracking-wider uppercase font-semibold">Hasil Pencarian</span>
            <h2 className="text-xl font-semibold text-on-surface mt-1">
              {hasQuery ? (loading ? "Mencari…" : `${filtered.length} ditampilkan`) : "Mulai mencari"}
            </h2>
          </div>
          {hasQuery && !loading && !error && (
            <div className="text-sm text-on-surface-variant">
              <span className="font-medium text-on-surface">{total}</span> hasil total
            </div>
          )}
        </div>

        {!hasQuery && (
          <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-sm">
            <span className="material-symbols-outlined text-[28px] text-outline/60">search</span>
            <p className="text-sm text-on-surface-variant mt-2">
              Ketik judul atau penulis untuk melihat hasil buku yang up-to-date. Kami tidak memuat seluruh katalog agar tetap ringan.
            </p>
          </div>
        )}

        {hasQuery && loading && (
          <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-sm">
            <p className="text-sm text-on-surface-variant">Mencari buku…</p>
          </div>
        )}

        {hasQuery && !loading && error && (
          <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-sm">
            <p className="text-sm text-on-surface-variant">{error}</p>
            <p className="text-xs text-outline mt-2">Pastikan <code>GOOGLE_BOOKS_API_KEY</code> sudah di <code>.env.local</code> dan dev server di-restart.</p>
          </div>
        )}

        {hasQuery && !loading && !error && filtered.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-sm">
            <span className="material-symbols-outlined text-[28px] text-outline/60">search_off</span>
            <p className="text-sm text-on-surface-variant mt-2">Tidak ada buku yang cocok. Coba kata kunci lain.</p>
          </div>
        )}

        {hasQuery && !loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((book) => {
              const authorText = book.authors.length ? book.authors.join(", ") : "Penulis tidak diketahui";
              const year = yearOf(book.publishedDate);
              const detailHref = `/books/${encodeURIComponent(book.id)}`;
              return (
                <article
                  key={book.id}
                  className="group relative flex flex-col bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <Link href={detailHref} className="flex flex-col flex-1">
                    <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden mb-4 shadow bg-surface-container-high flex items-center justify-center">
                      {book.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={book.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="material-symbols-outlined text-[32px] text-outline/40">menu_book</span>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 justify-between">
                      <div>
                        <span className="text-xs text-primary tracking-wide uppercase font-semibold">
                          {book.categories[0] || "Buku"}
                        </span>
                        <h3 className="font-semibold text-on-surface group-hover:text-primary transition-colors mt-0.5 line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-sm text-outline mt-0.5 line-clamp-1">{authorText}</p>
                      </div>
                      <div className="pt-4 flex items-center justify-between text-xs text-outline">
                        <span>{year ? `Terbit ${year}` : "Lihat detail"}</span>
                        <span className="material-symbols-outlined text-[16px] group-hover:text-primary transition-colors">arrow_forward</span>
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="absolute top-6 right-6 w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors shadow-sm"
                    aria-label={`Simpan ${book.title}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
