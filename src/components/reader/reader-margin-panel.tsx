"use client";

import { useState } from "react";
import type { ReaderBookmark } from "./reader-view";

type Props = {
  bookmarks: ReaderBookmark[];
  currentPage: number;
  pageCount: number;
  userName: string;
  isAuthenticated: boolean;
  sessionMinutes: number;
  pagesRead: number;
  onAddNote: (note: string) => Promise<boolean>;
  onUpdateNote: (id: string, note: string) => Promise<boolean>;
  onDeleteNote: (id: string) => Promise<boolean>;
  onGoToPage: (page: number) => void;
  onRequestLogin: () => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ReaderMarginPanel({
  bookmarks,
  currentPage,
  pageCount,
  userName,
  isAuthenticated,
  sessionMinutes,
  pagesRead,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onGoToPage,
  onRequestLogin,
}: Props) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [busy, setBusy] = useState(false);

  const notes = bookmarks.filter((bookmark) => bookmark.note?.trim());

  const submitDraft = async () => {
    if (busy) return;
    const text = draft.trim();
    if (!text) return;

    if (!isAuthenticated) {
      onRequestLogin();
      return;
    }

    setBusy(true);
    const ok = await onAddNote(text);
    setBusy(false);
    if (ok) setDraft("");
  };

  const submitEdit = async (id: string) => {
    if (busy) return;
    const text = editingText.trim();
    if (!text) return;

    setBusy(true);
    const ok = await onUpdateNote(id, text);
    setBusy(false);
    if (ok) {
      setEditingId(null);
      setEditingText("");
    }
  };

  const removeNote = async (id: string) => {
    if (busy) return;
    setBusy(true);
    await onDeleteNote(id);
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4 rounded-2xl bg-surface-container-low p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">sticky_note_2</span>
            <h3 className="font-serif text-lg font-semibold text-on-surface">Marjin Catatan</h3>
          </div>
          <span className="rounded-[999px] bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
            {notes.length} Catatan
          </span>
        </div>

        <p className="text-[13px] leading-relaxed text-on-surface-variant">
          Catatan menempel pada halaman yang sedang Anda baca. Halaman {currentPage} dari {pageCount}.
        </p>

        {!isAuthenticated ? (
          <div className="rounded-xl bg-surface-container-lowest p-4 text-center shadow-sm">
            <p className="text-[13px] text-on-surface-variant">
              Masuk untuk menyimpan catatan dan melanjutkan bacaan tanpa batas.
            </p>
            <button
              type="button"
              onClick={onRequestLogin}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              Masuk untuk mencatat
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              placeholder={`Tuliskan refleksi Anda untuk halaman ${currentPage}…`}
              className="w-full resize-none rounded-xl bg-surface-container-lowest p-3 text-[13px] text-on-surface shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider text-outline">
                Halaman {currentPage}
              </span>
              <button
                type="button"
                onClick={submitDraft}
                disabled={busy || draft.trim().length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Simpan ke Marjin
              </button>
            </div>
          </div>
        )}
      </section>

      {notes.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest p-5 text-center shadow-sm">
          <span className="material-symbols-outlined text-[26px] text-outline/50">edit_note</span>
          <p className="mt-2 text-[13px] text-on-surface-variant">
            Belum ada catatan. Mulai dari halaman yang sedang terbuka.
          </p>
        </div>
      ) : (
        notes.map((note) => (
          <article
            key={note.id}
            className="group flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onGoToPage(note.page)}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-secondary transition-colors hover:text-primary"
              >
                <span className="h-2 w-2 rounded-[999px] bg-secondary" />
                Halaman {note.page}
              </button>
              <span className="text-[10px] text-on-surface-variant">{formatDate(note.createdAt)}</span>
            </div>

            {editingId === note.id ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editingText}
                  onChange={(event) => setEditingText(event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl bg-surface-container-low p-3 text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditingText("");
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => submitEdit(note.id)}
                    disabled={busy || editingText.trim().length === 0}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-line text-[13px] italic leading-relaxed text-on-surface">
                “{note.note}”
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] font-medium text-on-surface-variant">{userName}</span>
              <div className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(note.id);
                    setEditingText(note.note ?? "");
                  }}
                  className="grid h-7 w-7 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                  aria-label="Sunting catatan"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeNote(note.id)}
                  disabled={busy}
                  className="grid h-7 w-7 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error disabled:opacity-50"
                  aria-label="Hapus catatan"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          </article>
        ))
      )}

      <section className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Statistik Sesi Membaca
          </span>
          <span className="material-symbols-outlined text-[18px] text-tertiary">hourglass_top</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col rounded-xl bg-surface-container-lowest p-3">
            <span className="text-[10px] text-on-surface-variant">Durasi Sesi</span>
            <span className="font-serif text-lg font-semibold text-primary">
              {sessionMinutes} <span className="text-xs font-normal text-on-surface">menit</span>
            </span>
          </div>
          <div className="flex flex-col rounded-xl bg-surface-container-lowest p-3">
            <span className="text-[10px] text-on-surface-variant">Halaman Sesi</span>
            <span className="font-serif text-lg font-semibold text-tertiary">
              {pagesRead} <span className="text-xs font-normal text-on-surface">hal.</span>
            </span>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-on-surface-variant">
          Durasi dihitung selama tab reader terbuka. Tidak ada penghitung kata karena halaman PDF
          tidak dipecah menjadi teks.
        </p>
      </section>
    </div>
  );
}
