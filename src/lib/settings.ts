export const BIO_MAX_LENGTH = 160;
export const PASSWORD_MIN_LENGTH = 12;

export type PrivacyPreferences = {
  publishMargins: boolean;
  spoilerBlur: boolean;
  discussionEmail: boolean;
};

export const DEFAULT_PRIVACY: PrivacyPreferences = {
  publishMargins: true,
  spoilerBlur: true,
  discussionEmail: false,
};

export type ProfileMetadata = {
  handle: string;
  bio: string;
  avatarUrl: string;
};

export type ReadingProgressInput = {
  percentage: number;
  estimatedMinutes: number | null;
  pageCount: number;
};

export type ProfileInput = {
  name: string;
  handle: string;
  bio: string;
};

export type ProfileValidation =
  | { ok: true; value: ProfileInput }
  | { ok: false; error: string };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

/** Inisial 1–2 huruf untuk avatar tanpa unggahan foto. */
export function initials(name?: string | null, email?: string | null): string {
  const source = (name ?? "").trim() || (email ?? "").trim().split("@")[0] || "";
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length === 0) return "L";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();

  return (
    words[0].charAt(0) + words[words.length - 1].charAt(0)
  ).toUpperCase();
}

/** Perkiraan menit baca dari progres buku (estimasi admin, fallback 2 menit/halaman). */
export function estimateReadingMinutes(items: ReadingProgressInput[]): number {
  return Math.round(
    items.reduce((total, item) => {
      const percentage = Math.min(100, Math.max(0, item.percentage));
      const minutes =
        item.estimatedMinutes ??
        (item.pageCount > 0 ? item.pageCount * 2 : 0);
      return total + (minutes * percentage) / 100;
    }, 0)
  );
}

export function formatReadingHours(minutes: number): string {
  if (minutes < 60) return `${Math.max(0, Math.round(minutes))} menit`;
  return `${Math.round(minutes / 60)} jam`;
}

export type StrengthResult = {
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
};

/** Skor kekuatan sandi 0–4 untuk meter empat bar. */
export function strengthScore(value: string): StrengthResult {
  if (!value) return { level: 0, label: "Belum diisi" };
  if (value.length < 8) return { level: 1, label: "Lemah" };
  if (value.length < PASSWORD_MIN_LENGTH) return { level: 2, label: "Cukup Baik" };

  const classes = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;

  if (value.length >= PASSWORD_MIN_LENGTH && classes >= 3) {
    return { level: 4, label: "Sangat Kuat" };
  }

  return { level: 3, label: "Kuat" };
}

export function validateProfileInput(input: unknown): ProfileValidation {
  const raw = asRecord(input);
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const handle =
    typeof raw.handle === "string" ? raw.handle.trim().toLowerCase() : "";
  const bio = typeof raw.bio === "string" ? raw.bio.trim() : "";

  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "Nama lengkap harus 2–80 karakter." };
  }

  if (!/^[a-z0-9._]{3,30}$/.test(handle)) {
    return {
      ok: false,
      error:
        "Nama pengguna harus 3–30 karakter: huruf kecil, angka, titik, atau garis bawah.",
    };
  }

  if (bio.length > BIO_MAX_LENGTH) {
    return {
      ok: false,
      error: `Biografi maksimal ${BIO_MAX_LENGTH} karakter.`,
    };
  }

  return { ok: true, value: { name, handle, bio } };
}

export function readProfileMetadata(metadata: unknown): ProfileMetadata {
  const raw = asRecord(metadata);
  return {
    handle: typeof raw.handle === "string" ? raw.handle.trim() : "",
    bio: typeof raw.bio === "string" ? raw.bio.trim() : "",
    avatarUrl: typeof raw.avatarUrl === "string" ? raw.avatarUrl.trim() : "",
  };
}

export function readPrivacyMetadata(metadata: unknown): PrivacyPreferences {
  const raw = asRecord(metadata);
  const stored = asRecord(raw.privacy);

  return {
    publishMargins:
      typeof stored.publishMargins === "boolean"
        ? stored.publishMargins
        : DEFAULT_PRIVACY.publishMargins,
    spoilerBlur:
      typeof stored.spoilerBlur === "boolean"
        ? stored.spoilerBlur
        : DEFAULT_PRIVACY.spoilerBlur,
    discussionEmail:
      typeof stored.discussionEmail === "boolean"
        ? stored.discussionEmail
        : DEFAULT_PRIVACY.discussionEmail,
  };
}

export function describeUserAgent(userAgent: string): string {
  const ua = userAgent || "";

  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Firefox\//.test(ua)
      ? "Firefox"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : "";

  const platform = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Macintosh|Mac OS X/.test(ua)
            ? "macOS"
            : /Linux/.test(ua)
              ? "Linux"
              : "";

  if (!browser || !platform) return "Peramban ini";
  return `${browser} di ${platform}`;
}
