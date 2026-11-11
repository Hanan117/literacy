const COVER_MARKER = "/storage/v1/object/public/covers/";

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
 */
export function resolveCoverUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  const base = storageBase();
  if (!base) return value;

  const markerIndex = value.indexOf(COVER_MARKER);
  if (markerIndex === -1) return value;

  const path = value.slice(markerIndex + COVER_MARKER.length);
  if (!path) return value;

  return `${base}${COVER_MARKER}${path}`;
}
