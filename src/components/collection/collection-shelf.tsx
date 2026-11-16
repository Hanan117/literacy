"use client";

import Link from "next/link";
import { useState } from "react";

export type CollectionBook = {
  id: string;
  slug: string;
  title: string;
  author: string;
  series: string | null;
  cover: string | null;
  category: string | null;
};

function Cover({ book }: { book: CollectionBook }) {
  if (book.cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={book.cover}
        alt={`Sampul ${book.title}`}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary to-primary-container p-3 text-center text-on-primary">
      <span className="text-[8px] uppercase tracking-[0.22em] opacity-70">
        Literacy
      </span>
      <span className="mt-2 line-clamp-3 font-serif text-sm leading-tight">
        {book.title}
      </span>
      <span className="mt-auto pt-2 text-[8px] opacity-75">{book.author}</span>
    </div>
  );
}

export default function CollectionShelf({
  initialBooks,
}: {
  initialBooks: CollectionBook[];
}) {
  const [books, setBooks] = useState(initialBooks);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = async (book: CollectionBook) => {
    if (pendingId) return;

    setPendingId(book.id);
    setError(null);

    try {
      const response = await fetch(`/api/books/${book.id}/collection`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError("Gagal melepas buku dari rak. Coba lagi.");
        return;
      }

      setBooks((current) => current.filter((item) => item.id !== book.id));
    } catch {
      setError("Tidak dapat menghubungi server. Coba lagi.");
    } finally {
      setPendingId(null);
    }
  };

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-surface-container-lowest px-6 py-16 text-center shadow-sm">
        <span className="material-symbols-outlined text-[36px] text-outline/60">
          bookmark_border
        </span>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          Rak koleksi masih kosong
        </h2>
        <p className="max-w-md font-ui-body-md text-ui-body-md text-on-surface-variant">
          Tekan ikon bookmark pada kartu buku di Katalog atau halaman detail
          untuk menyimpannya ke rak pribadi Anda.
        </p>
        <Link
          href="/katalog"
          className="mt-2 rounded-lg bg-primary px-5 py-2.5 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary-container"
        >
          Jelajahi Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg bg-error-container px-3 py-2 font-label-md text-label-md text-on-error-container">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {books.map((book) => (
          <article
            key={book.id}
            className="group flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <Link
              href={`/books/${book.slug}`}
              className="relative block aspect-[2/3] w-full overflow-hidden rounded bg-surface-container-high shadow-sm"
              aria-label={`Lihat detail ${book.title}`}
            >
              <Cover book={book} />
              <span className="absolute right-2 top-2 rounded-[999px] bg-surface-container-lowest/90 p-1 text-primary shadow-sm backdrop-blur-sm">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bookmark
                </span>
              </span>
            </Link>

            <div className="flex min-w-0 flex-col">
              <Link
                href={`/books/${book.slug}`}
                className="line-clamp-2 font-serif text-base leading-tight text-on-surface transition-colors group-hover:text-primary"
              >
                {book.title}
              </Link>
              <p className="mt-0.5 truncate text-sm text-outline">{book.author}</p>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-surface-container pt-3">
              <span className="min-w-0 truncate text-[11px] text-outline">
                {book.category ?? book.series ?? "Koleksi Literacy"}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => remove(book)}
                  disabled={pendingId === book.id}
                  title={`Lepas ${book.title} dari rak`}
                  aria-label={`Lepas ${book.title} dari rak`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-error disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    bookmark_remove
                  </span>
                </button>
                <Link
                  href={`/read/${book.id}`}
                  className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container"
                >
                  Baca
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
