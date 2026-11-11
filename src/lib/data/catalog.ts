export type CatalogBook = {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  categorySlug: string | null;
  series: string | null;
  duration: string;
  synopsis: string | null;
  cover: string | null;
  isPublished: boolean;
};

export type CatalogCategory = {
  slug: string;
  name: string;
};

/**
 * Perkiraan durasi baca. Prioritas: estimasi menit dari admin,
 * lalu fallback dari jumlah halaman (≈2 menit per halaman).
 */
export function formatReadingDuration(
  estimatedMinutes?: number | null,
  pageCount?: number | null
): string {
  const minutes = estimatedMinutes ?? (pageCount ? pageCount * 2 : null);
  if (!minutes || minutes <= 0) return "Durasi belum tersedia";
  if (minutes < 60) return `± ${minutes} menit baca`;
  const hours = Math.round(minutes / 60);
  return `± ${hours} jam baca`;
}
