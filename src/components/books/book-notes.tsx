"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type BookNote = {
  id: string;
  page: number;
  label: string | null;
  note: string;
  createdAt: string;
};

type Props = {
  bookId: string;
  pageCount: number;
  initialNotes: BookNote[];
  defaultPage: number;
  isAuthenticated: boolean;
  returnTo: string;
};

function formatNoteDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return `Hari ini, ${new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return "Kemarin";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
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

export default function BookNotes({
  bookId,
  pageCount,
  initialNotes,
  defaultPage,
  isAuthenticated,
  returnTo,
}: Props) {
  const [notes, setNotes] = useState<BookNote[]>(initialNotes);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState(String(defaultPage));
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!modalOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalOpen]);

  const openAdd = () => {
    setEditingId(null);
    setPageInput(String(Math.min(pageCount, Math.max(1, defaultPage))));
    setText("");
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (note: BookNote) => {
    setEditingId(note.id);
    setPageInput(String(note.page));
    setText(note.note);
    setError(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (busy) return;

    const content = text.trim();
    const page = Number(pageInput);

    if (!content) {
      setError("Catatan tidak boleh kosong.");
      return;
    }
    if (!Number.isFinite(page) || page < 1 || page > pageCount) {
      setError(`Halaman harus antara 1 dan ${pageCount}.`);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (editingId) {
        const data = await apiRequest<{ bookmark: BookNote }>(
          `/api/books/${bookId}/bookmarks`,
          {
            method: "PATCH",
            body: JSON.stringify({ id: editingId, note: content }),
          }
        );
        setNotes((items) =>
          items.map((item) => (item.id === editingId ? data.bookmark : item))
        );
      } else {
        const rounded = Math.round(page);
        const data = await apiRequest<{ bookmark: BookNote }>(
          `/api/books/${bookId}/bookmarks`,
          {
            method: "POST",
            body: JSON.stringify({
              page: rounded,
              label: `Halaman ${rounded}`,
              note: content,
            }),
          }
        );
        setNotes((items) =>
          [...items, data.bookmark].sort((a, b) => {
            if (a.page !== b.page) return a.page - b.page;
            return a.createdAt.localeCompare(b.createdAt);
          })
        );
      }

      setModalOpen(false);
      setText("");
      setEditingId(null);
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (note: BookNote) => {
    if (busy) return;
    if (!window.confirm(`Hapus catatan di halaman ${note.page}?`)) return;

    setBusy(true);
    try {
      await apiRequest(`/api/books/${bookId}/bookmarks`, {
        method: "DELETE",
        body: JSON.stringify({ id: note.id }),
      });
      setNotes((items) => items.filter((item) => item.id !== note.id));
    } catch (deleteError) {
      setError((deleteError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="catatan" className="scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container-highest pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-xl font-semibold text-on-surface md:text-2xl">
            Catatan Marjin Pribadi
          </h2>
          <span className="text-[11px] text-on-surface-variant">
            {notes.length} Catatan Tersimpan
          </span>
        </div>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tambah Catatan
          </button>
        ) : null}
      </div>

      {!isAuthenticated ? (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-xl bg-surface-container-low p-8 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-[999px] bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[22px]">lock</span>
          </span>
          <div>
            <p className="font-serif text-base font-semibold text-on-surface">
              Catatan marjin tersedia untuk pembaca terdaftar
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-on-surface-variant">
              Masuk untuk menyimpan catatan per halaman, lalu temukan kembali catatan yang sama
              di halaman ini dan di Mode Baca.
            </p>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <Link
              href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container"
            >
              Buat akun
            </Link>
          </div>
        </div>
      ) : notes.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-xl bg-surface-container-low p-8 text-center">
          <span className="material-symbols-outlined text-[28px] text-outline/50">edit_note</span>
          <p className="text-sm font-medium text-on-surface">Belum ada catatan untuk buku ini</p>
          <p className="max-w-md text-xs leading-relaxed text-on-surface-variant">
            Tulis refleksi pertama Anda. Catatan akan tersimpan per halaman dan muncul juga di
            panel marjin Mode Baca.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Tulis Catatan Pertama
          </button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          {notes.map((note) => (
            <article
              key={note.id}
              className="flex flex-col gap-3 rounded-xl bg-surface-container p-5 transition-colors hover:bg-surface-container-high/70"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {note.label?.trim() || `Halaman ${note.page}`}
                </span>
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <button
                    type="button"
                    onClick={() => openEdit(note)}
                    className="grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-surface-container-high hover:text-primary"
                    title="Ubah catatan"
                    aria-label="Ubah catatan"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(note)}
                    disabled={busy}
                    className="grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-surface-container-high hover:text-error disabled:opacity-50"
                    title="Hapus catatan"
                    aria-label="Hapus catatan"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              <p className="whitespace-pre-line font-serif text-[15px] leading-relaxed text-on-surface">
                {note.note}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-on-surface-variant">
                <span>{formatNoteDate(note.createdAt)}</span>
                <Link
                  href={`/read/${bookId}`}
                  className="inline-flex items-center gap-1 font-medium text-tertiary transition-colors hover:text-primary"
                >
                  Buka halaman {note.page}
                  <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {error && !modalOpen && (
        <p className="mt-3 text-xs text-error">{error}</p>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-on-surface/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-on-surface">
                  {editingId ? "Ubah Catatan Marjin" : "Tulis Catatan Marjin"}
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {editingId
                    ? "Perbarui refleksi Anda pada halaman ini."
                    : "Sematkan pemikiran pada halaman yang sedang Anda baca."}
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
                <label
                  htmlFor="note-page"
                  className="mb-1 block text-xs font-medium text-on-surface-variant"
                >
                  Halaman
                </label>
                <input
                  id="note-page"
                  type="number"
                  min={1}
                  max={pageCount}
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value)}
                  disabled={Boolean(editingId)}
                  className="w-full rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                />
                <p className="mt-1 text-[10px] text-outline">
                  1–{pageCount}. PDF tidak menyimpan nama bab, jadi catatan dirujuk per halaman.
                </p>
              </div>

              <div>
                <label
                  htmlFor="note-content"
                  className="mb-1 block text-xs font-medium text-on-surface-variant"
                >
                  Catatan Reflektif
                </label>
                <textarea
                  id="note-content"
                  rows={4}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Tuliskan interpretasi, pertanyaan, atau penerapan praktis dari halaman ini…"
                  className="w-full resize-none rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {error && <p className="text-xs text-error">{error}</p>}
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
                onClick={save}
                disabled={busy || text.trim().length === 0}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Menyimpan…" : "Simpan ke Marjin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
