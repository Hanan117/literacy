"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  bookId: string;
  bookTitle: string;
  initialSaved: boolean;
  isAuthenticated: boolean;
  returnTo: string;
  variant?: "icon" | "labeled";
  className?: string;
};

const ICON_BUTTON =
  "grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary disabled:opacity-50";

const LABELED_BUTTON =
  "flex items-center gap-2 rounded-lg bg-surface-container px-4 py-3 text-sm text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60";

/**
 * Ikon bookmark = simpan buku ke Rak Koleksi (bukan penanda halaman Reader).
 * Tamu diarahkan ke login dengan returnTo halaman saat ini.
 */
export default function SaveBookButton({
  bookId,
  bookTitle,
  initialSaved,
  isAuthenticated,
  returnTo,
  variant = "icon",
  className = "",
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;
    const loginTitle = "Masuk untuk menyimpan buku ke rak koleksi";

    if (variant === "labeled") {
      return (
        <Link
          href={loginHref}
          title={loginTitle}
          className={`${LABELED_BUTTON} ${className}`}
        >
          <span className="material-symbols-outlined text-[20px] text-primary">
            bookmark_add
          </span>
          Simpan ke Rak
        </Link>
      );
    }

    return (
      <Link
        href={loginHref}
        title={loginTitle}
        aria-label={loginTitle}
        className={`${ICON_BUTTON} ${className}`}
      >
        <span className="material-symbols-outlined text-[18px]">
          bookmark_border
        </span>
      </Link>
    );
  }

  const toggle = async () => {
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/books/${bookId}/collection`, {
        method: saved ? "DELETE" : "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "Gagal memperbarui rak koleksi.");
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { saved?: boolean }
        | null;
      setSaved(Boolean(payload?.saved));
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setPending(false);
    }
  };

  const title = error
    ? error
    : saved
      ? `Hapus ${bookTitle} dari rak koleksi`
      : `Simpan ${bookTitle} ke rak koleksi`;

  if (variant === "labeled") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        title={title}
        className={`${LABELED_BUTTON} ${className}`}
      >
        <span
          className={`material-symbols-outlined text-[20px] ${
            saved ? "text-primary" : "text-on-surface-variant"
          }`}
          style={{ fontVariationSettings: `'FILL' ${saved ? 1 : 0}` }}
        >
          {saved ? "bookmark_added" : "bookmark_add"}
        </span>
        {pending ? "Menyimpan…" : saved ? "Tersimpan di Rak" : "Simpan ke Rak"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={title}
      title={title}
      className={`${ICON_BUTTON} ${className}`}
    >
      <span
        className={`material-symbols-outlined text-[18px] ${
          saved ? "text-primary" : ""
        }`}
        style={{ fontVariationSettings: `'FILL' ${saved ? 1 : 0}` }}
      >
        {saved ? "bookmark_added" : "bookmark_border"}
      </span>
    </button>
  );
}
