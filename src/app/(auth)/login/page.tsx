"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("Login sosial belum dikonfigurasi.");
      return;
    }
    setLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (oauthError) {
      setError(oauthError.message || "Gagal memulai login sosial.");
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError(signInError.message || "Email atau kata sandi salah.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-on-surface">
      <div className="relative w-full lg:w-1/2 min-h-[440px] lg:min-h-screen overflow-hidden flex flex-col justify-between p-8 sm:p-12 lg:p-16">
        <Image
          alt="Atmospheric personal library nook with floor-to-ceiling wooden bookshelves, vintage books, a linen armchair, warm daylight, and steaming tea"
          className="absolute inset-0 w-full h-full object-cover object-center"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHAy6w_YbV-MDrTPTS054fba0k5R9w4tRedAx6-_xn9veAeKpTEYtSMNCbbFdKED4OvM7Th9n5EixC3bRN4bACpp3knkMB2ZJhrIeWcopxSyidZ5Mjgm7lJxSKfsnzRRK1lwXB-xoHzQiOfqBMSgLuXLzSSjtv3wEMmY7OkJn99OouKKqsccHx9dvc4s1Gu4vJ9vnsnR1TIkYxTfsz6BHVKfpRonEeHFCSAo0E4xo"
          fill
        />
        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-on-surface/40 to-on-surface/30 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-primary/10 mix-blend-color-burn"></div>

        <div className="relative z-10 max-w-lg mt-auto pt-16">
          <blockquote className="text-2xl md:text-3xl text-surface-bright leading-relaxed mb-6 font-serif italic">
            &ldquo;Membaca adalah jembatan hening antara jiwa dan kedalaman ilmu pengetahuan.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3 text-surface-container-high/80">
            <span className="w-8 h-[1px] bg-secondary-fixed/60"></span>
            <span className="italic text-sm text-surface-container-lowest"> Literacy</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-background">
        <div className="w-full max-w-[460px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-on-primary text-sm shadow-sm">
                L
              </div>
              <span className="text-lg font-semibold text-on-surface tracking-tight">Literacy</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl text-on-surface mb-2 font-serif">Masuk ke Akun</h1>
            <p className="text-sm text-on-surface-variant">
              Lanjutkan perjalanan membaca tanpa distraksi dan temukan progres bacaan Anda.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm disabled:opacity-60"
              type="button"
              disabled={loading}
              onClick={() => handleOAuth("google")}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z" fill="#4285F4"></path>
                <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.4 7.33 24 12 24z" fill="#34A853"></path>
                <path d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.13z" fill="#FBBC05"></path>
                <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.6 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z" fill="#EA4335"></path>
              </svg>
              <span className="text-sm font-medium">Google</span>
            </button>
            <button
              className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm disabled:opacity-60"
              type="button"
              disabled={loading}
              onClick={() => handleOAuth("apple")}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.05-.03.07-.42 1.44-1.38 2.82M15.97 6.43c.63-.78 1.05-1.87.94-2.96-.91.04-2.02.61-2.67 1.38-.58.67-1.08 1.77-.95 2.83 1.02.08 2.05-.47 2.68-1.25z"></path>
              </svg>
              <span className="text-sm font-medium">Apple</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-6">
            <div className="w-full h-[1px] bg-surface-container-highest"></div>
            <span className="absolute px-3 bg-background text-xs text-on-surface-variant uppercase tracking-wider">
              atau dengan
            </span>
          </div>

          <form className="flex flex-col gap-5" onSubmit={onSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-on-surface">Email</label>
              <input
                className="w-full px-3.5 py-2.5 rounded bg-surface-container-lowest text-on-surface placeholder:text-outline/70 text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                name="email"
                placeholder="nama@domain.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-on-surface">Kata Sandi</label>
                <Link href="#" className="text-xs text-primary hover:underline">Lupa kata sandi?</Link>
              </div>
              <input
                className="w-full px-3.5 py-2.5 rounded bg-surface-container-lowest text-on-surface placeholder:text-outline/70 text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                name="password"
                placeholder="••••••••••••"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              className="w-full mt-3 py-3 px-6 rounded bg-primary text-on-primary text-sm font-medium hover:bg-on-primary-fixed-variant active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? "Memproses..." : "Masuk"}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-on-surface-variant">
              Belum memiliki akun Literacy?
              <Link href="/register" className="font-medium text-primary hover:underline underline-offset-2 ml-1">
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
