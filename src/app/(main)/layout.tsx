"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PublicAuthNav from "@/components/public-auth-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navLinkClass = (href: string) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return active
      ? "text-sm text-primary font-medium transition-colors"
      : "text-sm text-on-surface-variant hover:text-primary transition-colors";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-surface-container-high bg-surface/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-gutter py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary text-sm">L</div>
            <span className="text-lg font-semibold text-on-surface">Literacy</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className={navLinkClass("/")}>Beranda</Link>
            <Link href="/explore" className={navLinkClass("/explore")}>Eksplorasi</Link>
          </nav>
          <div className="flex items-center gap-3">
            <PublicAuthNav />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="w-full bg-surface-container-low mt-space-xl">
        <div className="max-w-7xl mx-auto px-gutter py-6 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-on-primary text-xs">L</div>
            <span className="text-sm font-semibold text-on-surface">Literacy</span>
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
            <Link href="/explore" className="hover:text-primary transition-colors">Eksplorasi</Link>
            <span className="text-xs text-outline">© {new Date().getFullYear()} Literacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

