"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type UploadBook = {
  id: string;
  title: string;
  author: string;
  category: string;
  isPublished: boolean;
  coverUrl: string | null;
  fileSize: number | null;
  pdfPageCount: number;
  createdAt: string;
};

export type UploadCategory = {
  slug: string;
  name: string;
};

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MAX_COVER_BYTES = 2 * 1024 * 1024;

function formatBytes(bytes: number | null) {
  if (!bytes || bytes <= 0) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function UploadManager({
  books,
  categories,
}: {
  books: UploadBook[];
  categories: UploadCategory[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [series, setSeries] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [pdfPageCount, setPdfPageCount] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const discardDraft = async (id: string) => {
    await fetch(`/api/admin/books/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete" }),
    }).catch(() => undefined);
  };

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setSeries("");
    setSynopsis("");
    setCategorySlug("");
    setPdfPageCount("");
    setEstimatedMinutes("");
    if (fileRef.current) fileRef.current.value = "";
    if (coverRef.current) coverRef.current.value = "";
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const pdfFile = fileRef.current?.files?.[0];
    const coverFile = coverRef.current?.files?.[0];

    if (!title.trim() || !author.trim()) {
      setError("Judul dan penulis wajib diisi.");
      return;
    }
    if (!pdfFile) {
      setError("Pilih file PDF terlebih dahulu.");
      return;
    }
    if (pdfFile.type !== "application/pdf" && !pdfFile.name.toLowerCase().endsWith(".pdf")) {
      setError("File harus berformat PDF.");
      return;
    }
    if (pdfFile.size > MAX_PDF_BYTES) {
      setError("Ukuran PDF maksimal 50 MB.");
      return;
    }
    if (coverFile) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(coverFile.type)) {
        setError("Sampul harus JPG, PNG, atau WEBP.");
        return;
      }
      if (coverFile.size > MAX_COVER_BYTES) {
        setError("Ukuran sampul maksimal 2 MB.");
        return;
      }
    }

    setLoading(true);

    let createdId: string | null = null;

    try {
      const coverExtension = coverFile
        ? (coverFile.name.split(".").pop() || "").toLowerCase()
        : undefined;

      const res = await fetch("/api/admin/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          series: series.trim(),
          synopsis: synopsis.trim(),
          categorySlug: categorySlug || undefined,
          pdfPageCount,
          estimatedMinutes,
          coverExtension,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        book?: { id: string };
        pdf?: { path: string; token: string };
        cover?: { path: string; token: string } | null;
      };

      if (!res.ok || !data.book || !data.pdf) {
        setError(data.error || "Gagal menyiapkan unggahan.");
        setLoading(false);
        return;
      }

      createdId = data.book.id;
      const supabase = createClient();

      const { error: pdfError } = await supabase.storage
        .from("books")
        .uploadToSignedUrl(data.pdf.path, data.pdf.token, pdfFile, {
          contentType: "application/pdf",
        });

      if (pdfError) {
        await discardDraft(data.book.id);
        setError(`Gagal mengunggah PDF: ${pdfError.message}`);
        setLoading(false);
        return;
      }

      if (coverFile && data.cover) {
        const { error: coverError } = await supabase.storage
          .from("covers")
          .uploadToSignedUrl(data.cover.path, data.cover.token, coverFile, {
            contentType: coverFile.type,
          });

        if (coverError) {
          await discardDraft(data.book.id);
          setError(`PDF terunggah, tetapi sampul gagal: ${coverError.message}`);
          setLoading(false);
          return;
        }
      }

      const complete = await fetch(`/api/admin/books/${data.book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          fileSize: pdfFile.size,
          coverPath: coverFile && data.cover ? data.cover.path : undefined,
        }),
      });

      const completeData = (await complete.json().catch(() => ({}))) as { error?: string };
      if (!complete.ok) {
        setError(completeData.error || "File terunggah, tetapi gagal menyimpan data buku.");
        setLoading(false);
        return;
      }

      setInfo("Buku berhasil diunggah sebagai draft. Publikasikan agar tampil di katalog.");
      resetForm();
      router.refresh();
    } catch (err) {
      if (createdId) {
        await fetch(`/api/admin/books/${createdId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete" }),
        }).catch(() => undefined);
      }
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function updateBook(id: string, action: "publish" | "unpublish" | "delete") {
    if (pendingId) return;
    if (action === "delete" && !window.confirm("Hapus buku ini beserta filenya?")) return;

    setPendingId(id);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch(`/api/admin/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Gagal memperbarui buku.");
        return;
      }
      setInfo(
        action === "publish"
          ? "Buku dipublikasikan dan sekarang tampil di katalog."
          : action === "unpublish"
            ? "Buku disembunyikan dari katalog."
            : "Buku dihapus."
      );
      router.refresh();
    } catch {
      setError("Gagal memperbarui buku. Coba lagi.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      {/* Form upload */}
      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm md:p-8"
      >
        <h2 className="font-serif text-xl text-on-surface">Buku Baru</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Unggah PDF, lengkapi metadata, lalu publikasikan dari daftar di samping.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-on-surface" htmlFor="title">
              Judul <span className="text-red-600">*</span>
            </label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Judul buku"
              required
              className="w-full rounded bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="author">
              Penulis <span className="text-red-600">*</span>
            </label>
            <input
              id="author"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="Nama penulis"
              required
              className="w-full rounded bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="category">
              Kategori
            </label>
            <select
              id="category"
              value={categorySlug}
              onChange={(event) => setCategorySlug(event.target.value)}
              className="w-full rounded bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Tanpa kategori</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="series">
              Seri / Koleksi
            </label>
            <input
              id="series"
              value={series}
              onChange={(event) => setSeries(event.target.value)}
              placeholder="mis. Edisi Tetralogi Buru"
              className="w-full rounded bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="language">
              Bahasa
            </label>
            <input
              id="language"
              value="id"
              readOnly
              className="w-full rounded bg-surface-container px-3.5 py-2.5 text-sm text-on-surface-variant"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="pages">
              Jumlah halaman
            </label>
            <input
              id="pages"
              type="number"
              min={0}
              value={pdfPageCount}
              onChange={(event) => setPdfPageCount(event.target.value)}
              placeholder="mis. 320"
              className="w-full rounded bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="minutes">
              Estimasi menit baca
            </label>
            <input
              id="minutes"
              type="number"
              min={0}
              value={estimatedMinutes}
              onChange={(event) => setEstimatedMinutes(event.target.value)}
              placeholder="mis. 300"
              className="w-full rounded bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-on-surface" htmlFor="synopsis">
              Sinopsis
            </label>
            <textarea
              id="synopsis"
              value={synopsis}
              onChange={(event) => setSynopsis(event.target.value)}
              rows={3}
              placeholder="Ringkasan singkat buku"
              className="w-full resize-y rounded bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="pdf">
              File PDF <span className="text-red-600">*</span>
            </label>
            <input
              id="pdf"
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              required
              className="w-full rounded bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-on-primary"
            />
            <span className="text-[11px] text-outline">Maksimal 50 MB, format PDF.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="cover">
              Sampul (opsional)
            </label>
            <input
              id="cover"
              ref={coverRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full rounded bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant file:mr-3 file:rounded file:border-0 file:bg-secondary-container file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-on-secondary-container"
            />
            <span className="text-[11px] text-outline">JPG/PNG/WEBP, maksimal 2 MB.</span>
          </div>
        </div>

        {error && <p className="mt-5 text-sm text-red-600">{error}</p>}
        {info && <p className="mt-5 text-sm text-primary">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:opacity-60 sm:w-auto"
        >
          <span className="material-symbols-outlined text-[18px]">upload</span>
          {loading ? "Mengunggah…" : "Unggah Buku"}
        </button>
      </form>

      {/* Daftar buku */}
      <aside className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-on-surface">Daftar Buku</h2>
          <span className="rounded-full bg-surface-container px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            {books.length} buku
          </span>
        </div>

        {books.length === 0 ? (
          <p className="mt-6 rounded-xl bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
            Belum ada buku. Unggah PDF pertama Anda.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {books.map((book) => (
              <li
                key={book.id}
                className="flex gap-3 rounded-xl border border-surface-container-high p-3"
              >
                <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-surface-container-high">
                  {book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.coverUrl}
                      alt={`Sampul ${book.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-container text-[9px] text-on-primary">
                      PDF
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-sm font-semibold text-on-surface">
                        {book.title}
                      </p>
                      <p className="truncate text-[11px] text-outline">{book.author}</p>
                    </div>
                    <span
                      className={
                        book.isPublished
                          ? "shrink-0 rounded bg-tertiary-fixed/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-tertiary"
                          : "shrink-0 rounded bg-surface-container-high px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant"
                      }
                    >
                      {book.isPublished ? "Publish" : "Draft"}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-outline">
                    {book.category} • {book.pdfPageCount || 0} hal • {formatBytes(book.fileSize)}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                    <button
                      type="button"
                      onClick={() => updateBook(book.id, book.isPublished ? "unpublish" : "publish")}
                      disabled={pendingId === book.id}
                      className="rounded bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-50"
                    >
                      {book.isPublished ? "Sembunyikan" : "Publikasikan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBook(book.id, "delete")}
                      disabled={pendingId === book.id}
                      className="rounded px-2.5 py-1 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
