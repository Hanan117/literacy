"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Book = {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverUrl: string | null;
};

type Props = {
  currentId: string;
  label?: string;
}

/* Pemilih buku untuk pindah ke detail buku lain dari halaman detail/catatan. */
export default function BookPicker({ currentId, label = "Pilih Buku" }: Props) {
  const router = useRouter();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/books")
      .then((res) => res.json())
      .then((data: { books: Book[] }) => {
        if (!cancelled) setBooks(data.books ?? []);
      })
      .catch(() => {
        if (!cancelled) setBooks([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-lg px-2 py-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        title={label}
        aria-expanded={open}
      >
        <span className="material-symbols-outlined text-[18px]">library_books</span>
        <span className="text-[11px] font-medium xl:inline">{label}</span>
      </button>

      {open && books !== null && (
        <div
          className="fixed inset-0 z-[55] bg-on-surface/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute top-20 left-4 right-4 max-w-md mx-auto z-60 rounded-2xl bg-surface-container-lowest border border-surface-container p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 font-serif text-lg font-semibold text-on-surface">{label}</h3>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {books.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    router.push(`/books/${b.slug}`);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-container ${
                    b.id === currentId
                      ? "bg-primary/10 text-primary"
                      : "text-on-surface-variant"
                  }`}
                >
                  {b.id === currentId && (
                    <span className="material-symbols-outlined text-[14px] text-primary">
                      check_circle
                    </span>
                  )}
                  {b.coverUrl ? (
                    <img
                      src={b.coverUrl}
                      alt={`Sampul ${b.title}`}
                      className="h-8 w-8 shrink-0 object-cover rounded"
                    />
                  ) : (
                    <div className="h-8 w-8 shrink-0 rounded bg-surface-container-high flex items-center justify-center">
                      <span className="text-[10px] text-on-surface-variant">{b.title.charAt(0)}</span>
                    </div>
                  )}
                  <span className="font-medium truncate">{b.title}</span>
                  <span className="text-xs text-on-surface-variant truncate ml-auto">
                    {b.author}
                  </span>
                  {b.id === currentId && <span className="text-[10px] text-primary">(sedang ditampilkan)</span>}
                </button>
              ))}
              {books.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center">
                  Tidak ada buku tersedia.
                </p>
              )}
            </div>
            <p className="mt-2 text-[10px] text-on-surface-variant text-center">
              Klik di luar untuk tutup.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
