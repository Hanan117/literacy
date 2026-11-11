"use client";

import { useMemo, useState } from "react";
import {
  catalogBooks,
  catalogFilters,
  catalogTotal,
  spotlightBook,
  type CatalogBook,
  type CatalogFilter,
} from "@/lib/data/catalog";

function Cover({
  book,
  className = "",
}: {
  book: { title: string; author: string; cover?: string };
  className?: string;
}) {
  if (book.cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={book.cover} alt={`Sampul ${book.title}`} className={`h-full w-full object-cover ${className}`} />
    );
  }

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary to-primary-container p-3 text-center text-on-primary ${className}`}
    >
      <span className="text-[8px] uppercase tracking-[0.22em] opacity-70">Literacy</span>
      <span className="mt-2 font-serif text-sm leading-tight">{book.title}</span>
      <span className="mt-auto pt-2 text-[8px] opacity-75">{book.author}</span>
    </div>
  );
}

export default function KatalogPage() {
  const [activeFilter, setActiveFilter] = useState<CatalogFilter>("semua");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogBooks.filter((book) => {
      const byCategory = activeFilter === "semua" || book.filter === activeFilter;
      const byQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.category.toLowerCase().includes(q);
      return byCategory && byQuery;
    });
  }, [activeFilter, query]);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-8 md:px-8 md:py-10 xl:px-10">
      {/* Editorial header */}
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-[999px] bg-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
              Arsip Kurasi Litera • Edisi Musim Semi
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-on-surface md:text-4xl lg:text-[2.6rem]">
            Katalog &amp; Arsip Bacaan
          </h1>
          <p className="mt-3 max-w-lg font-serif text-[15px] leading-relaxed text-on-surface-variant">
            Koleksi karya terpilih untuk mengasah daya renung, kejernihan pikiran, dan ketenangan budi.
          </p>
        </div>

        <div className="w-full md:w-80">
          <div className="group relative flex items-center">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 text-[20px] text-outline group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari judul, penulis, tema…"
              aria-label="Cari judul, penulis, atau tema"
              className="w-full rounded-[0.6rem] bg-surface-container-low py-3 pl-12 pr-14 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
            <kbd className="pointer-events-none absolute right-4 text-[10px] tracking-wider text-outline">⌘K</kbd>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-1">
        {catalogFilters.map((filter) => {
          const active = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              aria-pressed={active}
              className={
                active
                  ? "whitespace-nowrap rounded-[999px] bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-sm transition-colors"
                  : "whitespace-nowrap rounded-[999px] bg-surface-container-low px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              }
            >
              {filter.label}
              {filter.id === "semua" && ` (${catalogTotal})`}
            </button>
          );
        })}
      </div>

      {/* Curator spotlight */}
      <section className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-surface-container-low via-secondary-fixed/25 to-secondary-fixed/50 shadow-sm">
        <div className="flex flex-col items-center gap-6 p-6 md:flex-row md:items-center md:p-8">
          <div className="relative w-[132px] shrink-0 overflow-hidden rounded-md shadow-2xl md:w-[160px]">
            <div className="absolute inset-y-0 left-0 z-10 w-2 bg-gradient-to-r from-black/35 via-black/15 to-transparent" />
            <div className="aspect-[2/3] w-full">
              <Cover book={spotlightBook} />
            </div>
          </div>

          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-[0.25rem] bg-secondary-container px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-on-secondary-container">
                {spotlightBook.eyebrow}
              </span>
              <span className="text-[11px] text-outline">{spotlightBook.collection}</span>
            </div>

            <h2 className="mt-2.5 font-serif text-2xl font-medium text-on-surface md:text-[1.7rem]">
              {spotlightBook.title}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {spotlightBook.author} <span className="text-outline">•</span> {spotlightBook.role}
            </p>

            <blockquote className="mt-3 max-w-2xl font-serif text-[15px] italic leading-relaxed text-on-surface-variant">
              “{spotlightBook.quote}”
            </blockquote>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-[0.4rem] bg-primary px-4 py-2.5 text-sm font-medium text-on-primary shadow-sm transition-colors hover:bg-primary-container"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                Buka Arsip Buku
              </button>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">offline_pin</span>
                Tersedia Offline • {spotlightBook.duration}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Selected collection */}
      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h3 className="font-serif text-xl font-semibold text-on-surface">Koleksi Terpilih</h3>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-outline">
            Menampilkan {filtered.length} dari {catalogTotal} karya
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl bg-surface-container-lowest p-10 text-center shadow-sm">
            <span className="material-symbols-outlined text-[30px] text-outline/50">search_off</span>
            <p className="mt-2 text-sm text-on-surface-variant">Tidak ada karya yang cocok. Coba kata kunci lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((book: CatalogBook) => (
              <article
                key={book.id}
                className="group flex flex-col rounded-xl bg-surface-container-lowest p-4 shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <div className="flex gap-4">
                  <div className="relative w-[104px] shrink-0 overflow-hidden rounded-md bg-surface-container-high shadow-sm">
                    <div className="absolute inset-y-0 left-0 z-10 w-1.5 bg-gradient-to-r from-black/25 to-transparent" />
                    <div className="aspect-[2/3] w-full">
                      <Cover book={book} />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col py-1">
                    <span className="text-[9px] font-bold uppercase leading-tight tracking-[0.14em] text-secondary">
                      {book.category}
                    </span>
                    <h4 className="mt-1 line-clamp-1 font-serif text-lg leading-tight text-on-surface transition-colors group-hover:text-primary">
                      {book.title}
                    </h4>
                    <p className="mt-0.5 line-clamp-1 text-sm text-outline">{book.author}</p>
                    <span className="mt-auto flex items-center gap-1 pt-3 text-[11px] text-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {book.duration}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-surface-container pt-3">
                  <span className="min-w-0 truncate text-[11px] text-outline">{book.series}</span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`Simpan ${book.title}`}
                      className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container"
                    >
                      Baca
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Footer quote & pagination */}
      <div className="mt-14 flex flex-col items-center justify-between gap-6 md:flex-row">
        <p className="max-w-md text-center font-serif text-[15px] italic leading-relaxed text-on-surface-variant md:text-left">
          Membaca bukan demi menambah tumpukan hafalan, melainkan membersihkan ruang batin agar tetap jernih.
        </p>

        <nav aria-label="Navigasi halaman katalog" className="flex items-center gap-1.5">
          <button
            type="button"
            disabled
            className="grid h-9 w-9 place-items-center rounded-lg text-outline opacity-40"
            aria-label="Halaman sebelumnya"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            type="button"
            aria-current="page"
            className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-on-primary shadow-sm"
          >
            1
          </button>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
          >
            2
          </button>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
          >
            3
          </button>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
            aria-label="Halaman berikutnya"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
