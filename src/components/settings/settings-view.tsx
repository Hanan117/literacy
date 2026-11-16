"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BIO_MAX_LENGTH,
  initials,
  type PrivacyPreferences,
} from "@/lib/settings";
import SecurityPanel from "./security-panel";

export type SettingsProfile = {
  name: string;
  email: string;
  role: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  emailVerified: boolean;
  memberSince: string;
  updatedAtLabel: string;
};

export type SettingsStats = {
  collections: number;
  readingHours: string;
  annotations: number;
};

export type FavoriteBook = {
  id: string;
  slug: string;
  title: string;
  author: string;
  series: string | null;
  cover: string | null;
};

type TabKey = "profile" | "security" | "preferences";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "profile", label: "Profil & Identitas", icon: "badge" },
  { key: "security", label: "Keamanan & Kata Sandi", icon: "lock_reset" },
  { key: "preferences", label: "Preferensi & Privasi", icon: "tune" },
];

function Cover({
  book,
  className = "",
}: {
  book: Pick<FavoriteBook, "title" | "author" | "cover">;
  className?: string;
}) {
  if (book.cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={book.cover}
        alt={`Sampul ${book.title}`}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary to-primary-container p-2 text-center text-on-primary ${className}`}
    >
      <span className="text-[7px] uppercase tracking-[0.22em] opacity-70">
        Literacy
      </span>
      <span className="mt-1 line-clamp-3 font-serif text-[11px] leading-tight">
        {book.title}
      </span>
      <span className="mt-auto pt-1 text-[7px] opacity-75">{book.author}</span>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-surface-container-highest"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-[999px] bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsView({
  profile,
  stats,
  favorites,
  privacy,
}: {
  profile: SettingsProfile;
  stats: SettingsStats;
  favorites: FavoriteBook[];
  privacy: PrivacyPreferences;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [toast, setToast] = useState<string | null>(null);

  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [prefs, setPrefs] = useState(privacy);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const isCurator = profile.role === "ADMIN";
  const avatarText = initials(profile.name, profile.email);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [avatarPending, setAvatarPending] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement | null>(null);

  const uploadAvatar = async (file: File) => {
    if (avatarPending) return;

    setAvatarPending(true);
    setAvatarError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json().catch(() => null)) as
        | { avatarUrl?: string; error?: string }
        | null;

      if (!response.ok) {
        setAvatarError(payload?.error ?? "Gagal mengunggah foto profil.");
        return;
      }

      setAvatarUrl(payload?.avatarUrl ?? "");
      showToast("Foto profil diperbarui.");
      router.refresh();
    } catch {
      setAvatarError("Tidak dapat menghubungi server.");
    } finally {
      setAvatarPending(false);
    }
  };

  const removeAvatar = async () => {
    if (avatarPending) return;

    setAvatarPending(true);
    setAvatarError(null);

    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });

      if (!response.ok) {
        setAvatarError("Gagal menghapus foto profil.");
        return;
      }

      setAvatarUrl("");
      showToast("Foto profil dihapus.");
      router.refresh();
    } catch {
      setAvatarError("Tidak dapat menghubungi server.");
    } finally {
      setAvatarPending(false);
    }
  };

  const resetProfile = () => {
    setName(profile.name);
    setHandle(profile.handle);
    setBio(profile.bio);
    setProfileError(null);
  };

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (savingProfile) return;

    setSavingProfile(true);
    setProfileError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, handle, bio }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setProfileError(payload?.error ?? "Gagal menyimpan profil. Coba lagi.");
        return;
      }

      showToast("Perubahan profil berhasil disimpan.");
      router.refresh();
    } catch {
      setProfileError("Tidak dapat menghubungi server. Coba lagi.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePreferences = async () => {
    if (savingPrefs) return;
    setSavingPrefs(true);
    setPrefsError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { privacy: prefs } });

    if (error) {
      setPrefsError("Gagal menyimpan preferensi. Coba lagi.");
      setSavingPrefs(false);
      return;
    }

    showToast("Preferensi tersimpan dengan aman.");
    setSavingPrefs(false);
    router.refresh();
  };

  const privacyRows: {
    key: keyof PrivacyPreferences;
    title: string;
    description: string;
  }[] = [
    {
      key: "publishMargins",
      title: "Publikasikan Catatan Margin Otomatis",
      description:
        "Setiap anotasi yang Anda buat saat Mode Baca langsung muncul di radar kuratorial pembaca lain.",
    },
    {
      key: "spoilerBlur",
      title: "Peringatan Spoiler Komunitas",
      description:
        "Secara default pasang efek buram (blur spoiler) pada ulasan bab kritis dan klimaks plot.",
    },
    {
      key: "discussionEmail",
      title: "Pemberitahuan Diskusi & Tanggapan Esai",
      description:
        "Kirimkan rangkuman mingguan via email apabila kurator lain membalas catatan Anda.",
    },
  ];

  return (
    <div className="relative w-full overflow-hidden px-5 py-8 md:px-8 md:py-10 xl:px-10">
      <div className="pointer-events-none absolute -top-40 right-10 h-96 w-96 rounded-[999px] bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-1/2 h-80 w-80 rounded-[999px] bg-secondary-container/10 blur-3xl" />

      <header className="mx-auto mb-[1.5rem] flex max-w-5xl flex-col justify-between gap-[1rem] md:flex-row md:items-end">
        <div className="max-w-xl">
          <h1 className="font-headline-lg text-headline-lg-mobile tracking-tight text-on-surface md:text-headline-lg">
            Pengaturan &amp; Kredensial
          </h1>
          <p className="mt-1 font-ui-body-md text-ui-body-md text-on-surface-variant">
            Kelola representasi publik kurator, perlindungan akses akun, dan
            proteksi sandi arsip.
          </p>
        </div>

      </header>

      <div className="mx-auto mb-[1.5rem] max-w-5xl">
        <nav
          role="tablist"
          aria-label="Bagian pengaturan"
          className="flex items-center gap-2 overflow-x-auto rounded-xl bg-surface-container-low p-1.5 shadow-sm"
        >
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-[0.75rem] whitespace-nowrap rounded-lg px-[1.5rem] py-2.5 font-label-md text-label-md transition-all duration-200 ${
                  active
                    ? "bg-surface-container-lowest text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    active ? "text-primary" : ""
                  }`}
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.key === "security" && (
                  <span className="h-1.5 w-1.5 rounded-[999px] bg-primary-container" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "profile" && (
        <div className="mx-auto flex max-w-5xl flex-col gap-[1.5rem]">
          <section className="rounded-xl bg-surface-container-low p-[1.5rem] shadow-sm">
            <div className="flex flex-col items-start justify-between gap-[1.5rem] md:flex-row md:items-center">
              <div className="flex items-center gap-[1.5rem]">
                <div className="group relative">
                  <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-[999px] bg-primary font-headline-md text-headline-md text-on-primary shadow-md ring-2 ring-surface-container-highest">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={`Foto profil ${profile.name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      avatarText
                    )}
                  </div>
                  <input
                    ref={avatarInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void uploadAvatar(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInput.current?.click()}
                    disabled={avatarPending}
                    title="Ganti foto profil"
                    aria-label="Ganti foto profil"
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-[999px] bg-surface-container-highest text-on-surface-variant shadow-md transition-colors hover:bg-surface-container hover:text-primary disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {avatarPending ? "progress_activity" : "photo_camera"}
                    </span>
                  </button>
                </div>

                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-center gap-[0.75rem]">
                    <h2 className="font-headline-md text-headline-md text-on-surface">
                      {profile.name}
                    </h2>
                    {isCurator && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-2.5 py-0.5 font-label-sm text-label-sm font-semibold tracking-wide text-on-tertiary-fixed">
                        <span
                          className="material-symbols-outlined text-[13px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                        Kurator Terverifikasi
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-[1rem] font-label-sm text-label-sm text-on-surface-variant">
                    <span className="flex items-center gap-1 font-medium text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        menu_book
                      </span>
                      {stats.collections} Koleksi Tersimpan
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        timer
                      </span>
                      {stats.readingHours} Baca
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-tertiary">
                        rate_review
                      </span>
                      {stats.annotations} Anotasi Terbuka
                    </span>
                  </div>

                  {avatarError && (
                    <p className="mt-2 font-label-sm text-label-sm text-error">
                      {avatarError}
                    </p>
                  )}

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      disabled={avatarPending}
                      className="mt-2 self-start font-label-sm text-label-sm font-semibold text-on-surface-variant transition-colors hover:text-error disabled:opacity-60"
                    >
                      Hapus foto
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled
                title="Tampilan publik segera hadir"
                className="cursor-not-allowed self-stretch rounded-lg bg-surface-container-high px-[1rem] py-2 font-label-md text-label-md text-on-surface-variant md:self-auto"
              >
                Lihat Tampilan Publik
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-[1.5rem] md:grid-cols-12">
            <div className="flex flex-col gap-[1.5rem] rounded-xl bg-surface-container-lowest p-[2.5rem] shadow-sm md:col-span-7">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Identitas Redaksi
                </h3>
                <p className="mt-0.5 font-ui-body-md text-ui-body-md text-on-surface-variant">
                  Informasi ini dicantumkan dalam esai, catatan margin kurator,
                  dan katalog umum.
                </p>
              </div>

              <form onSubmit={submitProfile} className="flex flex-col gap-[1rem]">
                <div className="grid grid-cols-1 gap-[1rem] sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="profile-name"
                      className="font-label-md text-label-md text-on-surface"
                    >
                      Nama Lengkap
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="rounded-lg bg-surface-container-low px-[1rem] py-2.5 font-ui-body-md text-ui-body-md text-on-surface outline-none transition-all focus:bg-surface-container"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="profile-handle"
                      className="font-label-md text-label-md text-on-surface"
                    >
                      Nama Pengguna (Handle)
                    </label>
                    <div className="flex items-center rounded-lg bg-surface-container-low px-[1rem] py-2.5 focus-within:bg-surface-container">
                      <span className="mr-1 font-ui-body-md text-on-surface-variant">
                        @
                      </span>
                      <input
                        id="profile-handle"
                        type="text"
                        value={handle}
                        onChange={(event) => setHandle(event.target.value)}
                        className="w-full bg-transparent font-ui-body-md text-ui-body-md text-on-surface outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface">
                    Surel Korespondensi Publik
                  </label>
                  <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-[1rem] py-2.5">
                    <input
                      type="email"
                      value={profile.email}
                      readOnly
                      className="w-full cursor-default bg-transparent font-ui-body-md text-ui-body-md text-on-surface outline-none"
                    />
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 font-label-sm text-label-sm font-semibold ${
                        profile.emailVerified ? "text-tertiary" : "text-secondary"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[15px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {profile.emailVerified ? "check_circle" : "info"}
                      </span>
                      {profile.emailVerified ? "Terverifikasi" : "Belum"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="profile-bio"
                      className="font-label-md text-label-md text-on-surface"
                    >
                      Biografi Kurator Ringkas
                    </label>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {bio.length}/{BIO_MAX_LENGTH} Karakter
                    </span>
                  </div>
                  <textarea
                    id="profile-bio"
                    rows={3}
                    maxLength={BIO_MAX_LENGTH}
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    className="resize-none rounded-lg bg-surface-container-low px-[1rem] py-2.5 font-reader-body-md text-ui-body-md text-on-surface outline-none transition-all focus:bg-surface-container"
                  />
                </div>

                {profileError && (
                  <p className="rounded-lg bg-error-container px-3 py-2 text-label-md text-on-error-container">
                    {profileError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-[0.75rem] pt-[0.75rem]">
                  <button
                    type="button"
                    onClick={resetProfile}
                    className="px-[1rem] py-2 font-label-md text-label-md text-on-surface-variant hover:text-on-surface"
                  >
                    Batalkan
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-[1.5rem] py-2 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      done
                    </span>
                    {savingProfile ? "Menyimpan…" : "Simpan Profil"}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex flex-col gap-[1.5rem] md:col-span-5">
              <div className="flex flex-col gap-[1rem] rounded-xl bg-surface-container-low p-[1.5rem] shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface">
                      Koleksi Terpasang
                    </h4>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      
                    </p>
                  </div>
                  <Link
                    href="/koleksi"
                    className="flex items-center gap-0.5 font-label-sm text-label-sm font-semibold text-primary hover:text-primary-container"
                  >
                    Kelola
                    <span className="material-symbols-outlined text-[14px]">
                      arrow_forward
                    </span>
                  </Link>
                </div>

                {favorites.length === 0 ? (
                  <p className="rounded-lg bg-surface-container px-3 py-4 text-center font-label-sm text-label-sm text-on-surface-variant">
                    Rak koleksi masih kosong. Simpan buku lewat ikon bookmark di
                    Katalog atau halaman detail.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-[0.75rem]">
                    {favorites.slice(0, 3).map((book, index) => (
                      <Link
                        key={book.id}
                        href={`/books/${book.slug}`}
                        className="group flex flex-col gap-1.5"
                      >
                        <div
                          className={`relative aspect-[2/3] w-full overflow-hidden rounded border-l-2 bg-surface-container-highest shadow-sm transition-shadow group-hover:shadow-md ${
                            index === 0
                              ? "border-primary/40"
                              : index === 1
                                ? "border-secondary/40"
                                : "border-tertiary/40"
                          }`}
                        >
                          <Cover book={book} />
                          <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-[999px] bg-surface-container-lowest/90 text-[11px] font-bold text-primary backdrop-blur-sm">
                            {index + 1}
                          </span>
                        </div>
                        <span className="truncate font-label-sm text-label-sm font-semibold text-on-surface">
                          {book.title}
                        </span>
                        <span className="truncate text-[10px] text-on-surface-variant">
                          {book.author}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "security" && (
        <SecurityPanel profile={profile} onToast={showToast} />
      )}

      {activeTab === "preferences" && (
        <div className="mx-auto flex max-w-5xl flex-col gap-[1.5rem]">
          <div className="flex flex-col gap-[1.5rem] rounded-xl bg-surface-container-lowest p-[2.5rem] shadow-sm">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Hak Privasi &amp; Penyiaran Catatan
              </h3>
              <p className="mt-0.5 font-ui-body-md text-ui-body-md text-on-surface-variant">
                Tentukan bagaimana catatan pinggir dan aktivitas membaca Anda
                terlihat oleh komunitas.
              </p>
            </div>

            <div className="flex flex-col divide-y divide-surface-container">
              {privacyRows.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-[1rem] py-[1rem] first:pt-0"
                >
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface">
                      {row.title}
                    </span>
                    <span className="font-ui-body-md text-[13px] text-on-surface-variant">
                      {row.description}
                    </span>
                  </div>
                  <Toggle
                    checked={prefs[row.key]}
                    label={row.title}
                    onChange={(value) =>
                      setPrefs((current) => ({ ...current, [row.key]: value }))
                    }
                  />
                </div>
              ))}
            </div>

            {prefsError && (
              <p className="rounded-lg bg-error-container px-3 py-2 text-label-md text-on-error-container">
                {prefsError}
              </p>
            )}

            <div className="flex justify-end border-t border-surface-container pt-[1rem]">
              <button
                type="button"
                onClick={savePreferences}
                disabled={savingPrefs}
                className="rounded-lg bg-primary px-[1.5rem] py-2.5 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:opacity-60"
              >
                {savingPrefs ? "Menyimpan…" : "Perbarui Preferensi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        }`}
      >
        <div className="flex items-center gap-[0.75rem] rounded-xl bg-inverse-surface px-[1rem] py-3 text-inverse-on-surface shadow-xl">
          <span
            className="material-symbols-outlined text-[20px] text-inverse-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <span className="font-ui-body-md text-ui-body-md">
            {toast ?? "Perubahan berhasil diperbarui."}
          </span>
        </div>
      </div>
    </div>
  );
}
