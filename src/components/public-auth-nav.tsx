import Link from "next/link";

/**
 * Navigasi auth untuk halaman publik.
 *
 * Sengaja tidak membaca sesi Supabase: area publik selalu menampilkan
 * "Masuk / Daftar" agar header tidak berubah-ubah saat tab kembali fokus
 * (Supabase memancarkan SIGNED_IN lagi ketika sesi dipulihkan dari cookie).
 * Status login dan tombol keluar tersedia di area dashboard.
 */
export default function PublicAuthNav() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm text-on-surface-variant hover:text-primary transition-colors"
      >
        Masuk
      </Link>
      <Link
        href="/register"
        className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm hover:bg-primary-container transition-colors"
      >
        Daftar
      </Link>
    </div>
  );
}
