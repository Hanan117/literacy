"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  label: string;
  icon: string;
  href?: string;
  admin?: boolean;
};

export type AppUser = {
  name: string | null;
  email: string;
  role: string;
};

const navItems: NavItem[] = [
  { label: "Katalog Koleksi", icon: "local_library", href: "/katalog" },
  { label: "Mode Baca", icon: "auto_stories", href: "/read" },
  { label: "Detail & Catatan", icon: "sticky_note_2" },
  { label: "Rating & Ulasan", icon: "star" },
  { label: "Upload PDF", icon: "upload_file", href: "/upload", admin: true },
  { label: "Pengaturan", icon: "settings" },
];

function Brand() {
  return (
    <Link href="/katalog" className="flex items-start gap-3">
      <span className="w-9 h-9 shrink-0 rounded-lg bg-primary text-on-primary grid place-items-center font-serif text-lg font-bold">
        L
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-xl font-semibold text-on-surface tracking-tight">
          Literacy
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-outline">
          Ruang Baca
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ pathname, isAdmin }: { pathname: string; isAdmin: boolean }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Navigasi utama">
      {navItems.map((item) => {
        if (item.admin && !isAdmin) return null;

        const active = item.href
          ? pathname === item.href || pathname.startsWith(`${item.href}/`)
          : false;

        const inner = (
          <>
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="flex-1 text-sm">{item.label}</span>
            {item.admin && isAdmin && (
              <span className="px-1.5 py-0.5 rounded-[0.25rem] bg-secondary-container text-on-secondary-container text-[9px] font-bold tracking-widest uppercase">
                Admin
              </span>
            )}
            {!item.href && (
              <span className="text-[9px] font-medium uppercase tracking-wider text-outline/70">
                Segera
              </span>
            )}
          </>
        );

        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              className={
                active
                  ? "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 text-primary font-semibold transition-colors"
                  : "flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              }
            >
              {inner}
            </Link>
          );
        }

        return (
          <div
            key={item.label}
            aria-disabled="true"
            title="Segera hadir"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant/55 cursor-not-allowed select-none"
          >
            {inner}
          </div>
        );
      })}
    </nav>
  );
}

function UserCard({ user }: { user?: AppUser | null }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const name = user?.name?.trim() || user?.email?.split("@")[0] || "Pembaca";
  const roleLabel = user?.role === "ADMIN" ? "Administrator" : "Pembaca";
  const initial = name.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm">
      <span className="w-9 h-9 shrink-0 rounded-[999px] bg-primary text-on-primary grid place-items-center text-sm font-semibold">
        {initial}
      </span>
      <span className="flex flex-col leading-tight min-w-0">
        <span className="text-sm font-semibold text-on-surface truncate">{name}</span>
        <span className="text-[11px] text-outline">{roleLabel}</span>
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="ml-auto w-8 h-8 grid place-items-center rounded-lg text-outline hover:bg-surface-container hover:text-primary transition-colors disabled:opacity-50"
        aria-label={signingOut ? "Keluar…" : "Keluar"}
        title="Keluar"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
      </button>
    </div>
  );
}

export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: AppUser | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-on-surface/30 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-surface-container-high bg-surface-container-low transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-7 pb-8">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="lg:hidden w-8 h-8 grid place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
            aria-label="Tutup menu"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-outline/80">
            Perpustakaan
          </p>
          <NavLinks pathname={pathname} isAdmin={isAdmin} />
        </div>

        <div className="p-3">
          <UserCard user={user} />
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-[264px]">
        {/* Bar tipis khusus mobile untuk membuka sidebar. */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-surface-container-high/70 bg-background/85 px-5 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-9 h-9 grid place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
            aria-label="Buka menu"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
