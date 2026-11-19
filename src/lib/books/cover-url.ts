const COVER_MARKER = "/storage/v1/object/public/covers/";

/** Placeholder sampul buku (inline SVG, tidak butuh asset eksternal). */
const BOOK_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300" fill="none">
  <rect width="200" height="300" fill="#e7e5e4" rx="8"/>
  <path d="M60 90h80v150H60z" fill="#d4d0cb"/>
  <rect x="65" y="110" width="30" height="4" fill="#b3aea9" rx="2"/>
  <rect x="65" y="122" width="45" height="4" fill="#b3aea9" rx="2"/>
  <rect x="105" y="110" width="30" height="4" fill="#b3aea9" rx="2"/>
</svg>`;

/** Data URL placeholder yang selalu tampil saat sampul asli tidak tersedia. */
export const BOOK_PLACEHOLDER_URL = `data:image/svg+xml;utf8,${encodeURIComponent(BOOK_PLACEHOLDER_SVG)}`;

function storageBase() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || null;
}

/** URL publik untuk path objek di bucket `covers`. */
export function publicCoverUrl(path: string): string | null {
  const base = storageBase();
  if (!base) return null;
  return `${base}${COVER_MARKER}${path.replace(/^\//, "")}`;
}

/**
 * Samakan URL sampul dengan environment Supabase yang sedang aktif.
 * Data lama bisa menyimpan host/port saat unggahan dibuat, sehingga URL
 * absolut seperti `http://127.0.0.1:54321/...` akan rusak setelah port berubah.
 * URL yang tidak dikenali (misalnya dari storage eksternal) dikembalikan apa adanya.
 * Jika nilai kosong/null atau tidak dapat diselesaikan, kembalikan placeholder
 * agar visual sampul tetap tampil.
 */
export function resolveCoverUrl(value: string | null | undefined): string {
  if (!value) return BOOK_PLACEHOLDER_URL;

  const base = storageBase();
  if (!base) return value;

  const markerIndex = value.indexOf(COVER_MARKER);
  if (markerIndex === -1) return value;

  const path = value.slice(markerIndex + COVER_MARKER.length);
  if (!path) return value;

  return `${base}${COVER_MARKER}${path}`;
}
