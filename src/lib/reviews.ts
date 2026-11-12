export type ReviewItem = {
  id: string;
  rating: number;
  title: string;
  body: string;
  quote: string | null;
  createdAt: string;
  isOwner: boolean;
  author: { name: string; isCurator: boolean };
};

export type RatingBucket = {
  rating: number;
  count: number;
  percent: number;
};

export type ReviewFilter = "semua" | "kurator" | "kutipan";
export type ReviewSort = "terbaru" | "tertinggi";

export type ReviewSummary = {
  average: number | null;
  total: number;
  distribution: RatingBucket[];
};

export type ReviewInput = {
  rating: number;
  title: string;
  body: string;
  quote: string | null;
};

export const RATING_LABELS: Record<number, string> = {
  1: "Kurang",
  2: "Cukup",
  3: "Berbobot",
  4: "Sangat Bagus",
  5: "Mahakarya",
};

const TITLE_MIN = 3;
const TITLE_MAX = 120;
const BODY_MIN = 20;
const BODY_MAX = 4000;
const QUOTE_MAX = 280;

export function starFill(average: number, index: number): number {
  const value = Math.min(1, Math.max(0, average - index));
  return Math.round(value * 100);
}

export function buildDistribution(
  rows: Array<{ rating: number; count: number }>,
  total: number
): RatingBucket[] {
  const counts = new Map(rows.map((row) => [row.rating, row.count]));

  return [5, 4, 3, 2, 1].map((rating) => {
    const count = counts.get(rating) ?? 0;
    return {
      rating,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}

export function formatReviewDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const startOf = (input: Date) =>
    new Date(input.getFullYear(), input.getMonth(), input.getDate()).getTime();

  const dayDiff = Math.round((startOf(new Date()) - startOf(date)) / 86_400_000);

  if (dayDiff <= 0) return "Hari ini";
  if (dayDiff === 1) return "Kemarin";
  if (dayDiff < 7) return `${dayDiff} hari yang lalu`;
  if (dayDiff < 14) return "1 pekan yang lalu";
  if (dayDiff < 30) return `${Math.floor(dayDiff / 7)} pekan yang lalu`;

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function validateReviewInput(
  input: unknown
): { ok: true; value: ReviewInput } | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Data ulasan tidak valid." };
  }

  const raw = input as Record<string, unknown>;
  const rating = Number(raw.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Pilih rating antara 1 dan 5 bintang." };
  }

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (title.length < TITLE_MIN) {
    return { ok: false, error: `Judul minimal ${TITLE_MIN} karakter.` };
  }
  if (title.length > TITLE_MAX) {
    return { ok: false, error: `Judul maksimal ${TITLE_MAX} karakter.` };
  }

  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  if (body.length < BODY_MIN) {
    return { ok: false, error: `Isi ulasan minimal ${BODY_MIN} karakter.` };
  }
  if (body.length > BODY_MAX) {
    return { ok: false, error: `Isi ulasan maksimal ${BODY_MAX} karakter.` };
  }

  const rawQuote = typeof raw.quote === "string" ? raw.quote.trim() : "";
  if (rawQuote.length > QUOTE_MAX) {
    return { ok: false, error: `Kutipan maksimal ${QUOTE_MAX} karakter.` };
  }

  return {
    ok: true,
    value: {
      rating,
      title,
      body,
      quote: rawQuote || null,
    },
  };
}

export function displayAuthorName(name: string | null, email: string): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;

  const prefix = email.split("@")[0]?.trim() || "Pembaca";
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}
