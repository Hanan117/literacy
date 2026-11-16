"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PASSWORD_MIN_LENGTH,
  describeUserAgent,
  strengthScore,
} from "@/lib/settings";
import type { SettingsProfile } from "./settings-view";

type PasswordField = "current" | "next" | "confirm";

const STRENGTH_CLASS: Record<number, string> = {
  0: "bg-surface-container",
  1: "bg-error",
  2: "bg-secondary",
  3: "bg-tertiary",
  4: "bg-tertiary",
};

const STRENGTH_TEXT: Record<number, string> = {
  0: "text-on-surface-variant",
  1: "text-error",
  2: "text-secondary",
  3: "text-tertiary",
  4: "text-tertiary",
};

export default function SecurityPanel({
  profile,
  onToast,
}: {
  profile: SettingsProfile;
  onToast: (message: string) => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState<Record<PasswordField, boolean>>({
    current: false,
    next: false,
    confirm: false,
  });
  const [keepOthers, setKeepOthers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const device = useSyncExternalStore(
    () => () => {},
    () => describeUserAgent(navigator.userAgent),
    () => "Peramban ini"
  );

  const strength = strengthScore(next);

  const toggleVisibility = (field: PasswordField) =>
    setVisible((current) =>
      Object.assign({}, current, { [field]: !current[field] })
    );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setError(null);

    if (!current) {
      setError("Masukkan kata sandi saat ini untuk memverifikasi.");
      return;
    }
    if (next.length < PASSWORD_MIN_LENGTH) {
      setError(`Kata sandi baru harus minimal ${PASSWORD_MIN_LENGTH} karakter.`);
      return;
    }
    if (next !== confirm) {
      setError("Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.");
      return;
    }
    if (next === current) {
      setError("Kata sandi baru harus berbeda dari kata sandi saat ini.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: current,
    });

    if (verifyError) {
      setError("Kata sandi saat ini salah.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: next,
    });

    if (updateError) {
      setError("Gagal memperbarui kata sandi. Coba lagi.");
      setSaving(false);
      return;
    }

    if (keepOthers) {
      await supabase.auth.signOut({ scope: "others" });
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    setVisible({ current: false, next: false, confirm: false });
    setSaving(false);
    onToast("Kata sandi berhasil diperbarui. Sesi Anda tetap aktif.");
  };

  const fields: {
    key: PasswordField;
    label: string;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    hint?: React.ReactNode;
  }[] = [
    {
      key: "current",
      label: "Kata Sandi Saat Ini",
      value: current,
      placeholder: "Masukkan sandi aktif…",
      onChange: setCurrent,
      hint: (
        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          className="font-label-sm text-label-sm text-primary hover:underline"
        >
          Lupa sandi saat ini?
        </a>
      ),
    },
    {
      key: "next",
      label: "Kata Sandi Baru",
      value: next,
      placeholder: `Minimal ${PASSWORD_MIN_LENGTH} karakter aman…`,
      onChange: setNext,
    },
    {
      key: "confirm",
      label: "Konfirmasi Kata Sandi Baru",
      value: confirm,
      placeholder: "Ulangi kata sandi baru…",
      onChange: setConfirm,
    },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-[1.5rem]">
      <div className="flex flex-col items-start justify-between gap-[1rem] rounded-xl bg-surface-container-low p-[1.5rem] shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-[1rem]">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-container text-on-primary-container shadow-sm">
            <span className="material-symbols-outlined text-[26px]">
              shield_person
            </span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Pusat Keamanan &amp; Kata Sandi
            </h2>
            <p className="font-ui-body-md text-[13px] text-on-surface-variant">
              Lindungi akses naskah, esai pratinjau, dan data kuratorial dengan
              enkripsi end-to-end.
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-lg bg-surface-container px-[1rem] py-1.5 font-label-sm text-label-sm font-semibold text-on-surface">
          <span className="material-symbols-outlined text-[16px] text-tertiary">
            history
          </span>
          Diperbarui {profile.updatedAtLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-[1.5rem] lg:grid-cols-12">
        <div className="flex flex-col gap-[1.5rem] rounded-xl bg-surface-container-lowest p-[2.5rem] shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Perbarui Kata Sandi
              </h3>
              <p className="mt-1 font-ui-body-md text-ui-body-md text-on-surface-variant">
                Gunakan kombinasi minimal {PASSWORD_MIN_LENGTH} karakter
                alfanumerik bertanda baca.
              </p>
            </div>
            <span className="material-symbols-outlined text-[24px] text-outline-variant">
              key
            </span>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-[1rem]">
            {fields.map((field, index) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                {index > 0 && (
                  <div className="my-1 h-px w-full bg-surface-container" />
                )}
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={`password-${field.key}`}
                    className="font-label-md text-label-md text-on-surface"
                  >
                    {field.label}
                  </label>
                  {field.hint}
                </div>
                <div className="relative flex items-center">
                  <input
                    id={`password-${field.key}`}
                    type={visible[field.key] ? "text" : "password"}
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    placeholder={field.placeholder}
                    autoComplete={
                      field.key === "current" ? "current-password" : "new-password"
                    }
                    className="w-full rounded-lg bg-surface-container-low py-2.5 pl-[1rem] pr-10 font-ui-body-md text-ui-body-md text-on-surface outline-none transition-all focus:bg-surface-container"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility(field.key)}
                    aria-label={
                      visible[field.key]
                        ? `Sembunyikan ${field.label}`
                        : `Tampilkan ${field.label}`
                    }
                    className="absolute right-3 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {visible[field.key] ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>

                {field.key === "next" && (
                  <div className="mt-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between font-label-sm text-label-sm">
                      <span className="text-on-surface-variant">
                        Kekuatan Sandi:
                      </span>
                      <span className={`font-semibold ${STRENGTH_TEXT[strength.level]}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="grid h-1.5 w-full grid-cols-4 gap-1.5 overflow-hidden rounded-full bg-surface-container">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={`h-full rounded-full ${
                            strength.level >= bar
                              ? STRENGTH_CLASS[strength.level]
                              : "bg-surface-container"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <label className="mt-1 flex cursor-pointer select-none items-center gap-[0.75rem]">
              <input
                type="checkbox"
                checked={keepOthers}
                onChange={(event) => setKeepOthers(event.target.checked)}
                className="h-4 w-4 rounded accent-primary focus:ring-0"
              />
              <span className="font-ui-body-md text-[13px] text-on-surface-variant">
                Keluarkan semua sesi aktif di peramban dan perangkat lain saat
                sandi diperbarui
              </span>
            </label>

            {error && (
              <p className="rounded-lg bg-error-container px-3 py-2 text-label-md text-on-error-container">
                {error}
              </p>
            )}

            <div className="mt-2 flex items-center justify-end gap-[0.75rem] pt-[0.75rem]">
              <button
                type="button"
                onClick={() => {
                  setCurrent("");
                  setNext("");
                  setConfirm("");
                  setError(null);
                }}
                className="px-[1rem] py-2.5 font-label-md text-label-md text-on-surface-variant hover:text-on-surface"
              >
                Atur Ulang Form
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-[2.5rem] py-2.5 font-label-md text-label-md text-on-primary shadow-sm transition-all hover:bg-primary-container disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">
                  lock
                </span>
                {saving ? "Memproses…" : "Perbarui Kata Sandi"}
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-[1.5rem] lg:col-span-5">
          <div className="flex flex-col gap-[1rem] rounded-xl bg-surface-container-low p-[1.5rem] shadow-sm">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  fingerprint
                </span>
                <h4 className="font-headline-sm text-headline-sm text-on-surface">
                  Kunci Akses / Passkey
                </h4>
              </div>
              <p className="mt-1 font-ui-body-md text-[13px] text-on-surface-variant">
                Masuk instan menggunakan Touch ID, Face ID, atau kunci perangkat
                tanpa kata sandi.
              </p>
            </div>

            <div className="flex flex-col items-center gap-1 rounded-lg bg-surface-container-lowest px-4 py-5 text-center shadow-sm">
              <span className="material-symbols-outlined text-[26px] text-outline">
                key_off
              </span>
              <p className="font-label-md text-label-md font-semibold text-on-surface">
                Belum ada passkey
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Dukungan WebAuthn/FIDO2 segera hadir.
              </p>
            </div>

            <button
              type="button"
              disabled
              title="Passkey segera hadir"
              className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-surface-container px-[1rem] py-2.5 font-label-md text-label-md font-semibold text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[18px]">
                add_circle
              </span>
              Tambah Kunci Sandi Baru
            </button>
          </div>

          <div className="flex flex-col gap-[1rem] rounded-xl bg-surface-container-low p-[1.5rem] shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-headline-sm text-headline-sm text-on-surface">
                Sesi Terdaftar
              </h4>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Hanya sesi ini
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-[0.75rem] shadow-sm">
              <div className="flex items-center gap-[0.75rem]">
                <span className="h-2 w-2 rounded-[999px] bg-tertiary" />
                <div>
                  <div className="flex items-center gap-1.5 font-label-md text-label-md font-semibold text-on-surface">
                    {device}
                    <span className="rounded bg-tertiary-fixed px-1.5 py-0.5 text-[10px] font-bold uppercase text-on-tertiary-fixed">
                      Sesi Ini
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    Aktif sekarang
                  </p>
                </div>
              </div>
            </div>

            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Daftar perangkat lain belum tersedia dari penyedia autentikasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
