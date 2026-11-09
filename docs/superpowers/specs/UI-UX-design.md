# 🎨 UI/UX Product Requirements Document (PRD): Literacy

**Status:** Draft / Final MVP  
**Versi:** 1.0.0  
**Fokus:** Visual Design System, Interaksi, dan User Experience  

---

## 1. Design Philosophy & Principles
**Literacy** bukan sekadar *website*, tapi sebuah *ruang baca digital*. Desainnya harus "mundur ke belakang" dan membiarkan konten (buku) menjadi bintang utamanya.
1.  **Invisible UI:** Alat navigasi (toolbar) hanya muncul saat dibutuhkan dan menghilang saat pengguna fokus membaca.
2.  **Zero-Friction:** Pengguna bisa mencoba membaca sebelum dipaksa untuk mendaftar.
3.  **Premium & Clean:** Menggunakan banyak *whitespace* (ruang kosong), bayangan yang lembut, dan bentuk membulat (rounded). Terinspirasi dari Dovetail, Notion, dan Apple.
4.  **Desktop-First, Mobile-Ready:** Dioptimalkan untuk layar lebar (mouse & keyboard), namun tetap responsif untuk layar kecil.

---

## 2. Design System (The Foundation)

### A. Warna (Color Palette)
Kita menggunakan pendekatan *Monochrome* dengan aksen warna yang sangat minim untuk menghindari distraksi visual.
*   **Light Mode:**
    *   Background Utama: `neutral-50` (Sangat terang, tidak menyilaukan).
    *   Surface/Card: `white` dengan border tipis `neutral-200`.
    *   Teks Utama: `neutral-900` (Hitam pekat).
    *   Teks Sekunder: `neutral-500` (Abu-abu).
*   **Dark Mode (Fokus Utama):**
    *   Background Utama: `#0A0A0A` (Hitam keabu-abuan).
    *   Surface/Card: `#1A1A1A` dengan border `neutral-800`.
    *   Teks Utama: `neutral-50` (Putih tulang).
    *   Teks Sekunder: `neutral-400`.
*   **Accent Color:** `emerald-500` (Untuk indikator sukses seperti Sync berhasil) dan `blue-500` (Untuk status loading/saving).

### B. Tipografi (Typography)
*   **Font Utama:** `Inter` atau `Geist Sans` (Clean, geometris, mudah dibaca di layar).
*   **Skala Font:**
    *   Judul Buku/Hero: `text-2xl` atau `text-3xl` (Bold).
    *   Sub-judul: `text-lg` (Semibold).
    *   Body/Paragraf: `text-sm` atau `text-base` (Regular).
    *   Metadata (Penulis/Badge): `text-xs` (Medium).

### C. Bentuk & Bayangan (Shapes & Shadows)
*   **Border Radius:** Semua elemen interaktif (tombol, kartu, input) menggunakan `rounded-xl` (12px) hingga `rounded-3xl` (24px). Tidak ada sudut tajam.
*   **Shadows:** Gunakan *soft shadow* (misal: `shadow-sm` atau `shadow-lg` dengan opacity rendah) agar elemen terlihat melayang (*floating*).
*   **Glassmorphism:** Gunakan efek kaca pada toolbar (`bg-white/80 backdrop-blur-md` atau `bg-black/80 backdrop-blur-md`).

### D. Ikonografi
*   Menggunakan library **Lucide React**.
*   Ketebalan garis (*stroke width*): `1.5` atau `2`.
*   Selalu gunakan *outline icons*, hindari ikon solid kecuali untuk status aktif (seperti Bookmark).

---

## 3. UX Flow (User Journey)

### Flow 1: Eksplorasi & Membaca (Zero-Friction)
1.  Pengguna masuk ke `/` (Landing Page/Katalog).
2.  Pengguna melihat grid buku. Klik salah satu buku.
3.  Pengguna masuk ke halaman detail. Klik "Baca Sampel".
4.  Pengguna masuk ke **Reader Mode**. Dapat membaca 3 halaman pertama dengan bebas.
5.  Saat mencoba ke halaman 4, muncul *bottom-sheet* elegan: *"Suka dengan buku ini? Daftar sekarang untuk menyimpan progres bacaanmu secara otomatis."*
6.  Pengguna daftar/login. Setelah berhasil autentikasi, sistem mengarahkan kembali ke Reader pada halaman tujuan via parameter `returnTo` (buku + halaman yang ingin dilanjutkan). Parameter `returnTo` hanya boleh berupa path internal untuk mencegah open redirect.

### Flow 2: Sinkronisasi (The "Wow" Moment)
1.  Pengguna membaca di Desktop. Status sync berubah dari `Menyimpan...` menjadi `Tersimpan`.
2.  Pengguna membuka aplikasi di Laptop lain (atau mengecilkan *window*).
3.  Saat kembali ke Dashboard, Hero Card "Lanjutkan Membaca" menampilkan halaman terakhir persis di mana ia berhenti.

---

## 4. UI Components Breakdown

### A. Reader Engine (The Core Experience)
*   **Canvas Area:** PDF dirender di tengah dengan background aplikasi `#0A0A0A`. PDF memiliki *shadow* besar agar terasa seperti kertas fisik.
*   **Gating Batas Baca Gratis:** User belum login dapat membaca maksimal 3 halaman pertama secara gratis (halaman 1–3) melalui fitur "Baca Sampel" **tanpa wajib login**. Gating ini hanya aktif untuk user anonim saat mencoba mengakses halaman > 3, dan akan memunculkan bottom-sheet untuk daftar/login dengan redirect via `returnTo`. Untuk user yang sudah login, batasan ini **dilepaskan** sehingga dapat membaca seluruh halaman buku dan progresnya disinkronkan ke tabel `Progress`. Pelacakan batas gratis untuk user anonim menggunakan `localStorage` dengan key `literacy:guest:{bookId}`. Nilai ini didefinisikan sebagai konstanta `FREE_PAGES = 3` untuk menghindari *magic number* dan menjaga konsistensi di seluruh aplikasi.
*   **Top Bar (Auto-hide):**
    *   Kiri: Tombol `Back` (ArrowLeft), Judul Buku, Nama Penulis.
    *   Kanan: Status Sync (Ikon Cloud/Awan), Tombol Settings (Gear).
    *   *Behavior:* Muncul saat mouse di area atas, menghilang setelah 3 detik idle. Untuk user belum login, indikator sync tidak ditampilkan.
*   **Bottom Bar (Floating Pill):**
    *   Berbentuk kapsul melayang di bawah tengah.
    *   Isi: Tombol Prev/Next (Chevron), Slider Progress, Teks "Hal X dari Y", Tombol Bookmark.
    *   *Behavior:* Melayang, muncul/menghilang bersamaan dengan Top Bar.
*   **Invisible Zones:** Area transparan di 15% sisi kiri dan kanan layar. Jika diklik, pindah halaman. Kursor berubah menjadi `w-resize` / `e-resize`.

### B. Dashboard (The Hub)
*   **Layout:** Sidebar kiri (lebar 256px) + Main Content.
*   **Sidebar:** Logo "Literacy", Menu (Beranda, Eksplorasi, Koleksi), Profil User di bagian bawah.
*   **Hero Section ("Lanjutkan Membaca"):**
    *   Card besar (`rounded-3xl`) berisi: Sampul buku (rasio 2:3), Info Buku, Progress Bar, dan Tombol CTA "Lanjutkan Baca" (Warna solid hitam/putih).
*   **Kategori:** Berbentuk *horizontal scroll pills* (`rounded-full border`).
*   **Grid Buku:** Layout grid responsif. Hover effect pada sampul: `scale-105 transition-transform`.

### C. Admin Panel
*   **Upload Zone:** Area drag-and-drop luas dengan border putus-putus (`border-dashed`).
*   **Auto-Cover Preview:** Begitu PDF di-drop, tampilkan preview halaman 1 sebagai gambar sampul.
*   **Form Metadata:** Input minimalis dengan *floating labels*.

---

## 5. Micro-Interactions & Animation

1.  **Toolbar Slide:** Top bar meluncur ke atas (`translate-y-[-100%]`) dan Bottom bar meluncur ke bawah saat hilang. Gunakan *spring animation* (Framer Motion) agar terasa natural.
2.  **Page Turn:** Saat pindah halaman PDF, berikan efek *fade* (opacity) selama 150ms, jangan langsung "jeglek".
3.  **Hover States:** Semua tombol harus memiliki *hover state* yang jelas (misal: `hover:bg-neutral-800` untuk dark mode).
4.  **Skeleton Loading:** Saat PDF sedang dimuat, tampilkan *skeleton screen* (kotak abu-abu berkedip) alih-alih *spinner* berputar.

---

## 6. Accessibility (A11y)

*   **Keyboard Navigation:** Mutlak diperlukan untuk Desktop.
    *   `Panah Kiri / Kanan`: Ganti halaman.
    *   `Esc`: Keluar dari mode Reader ke Dashboard.
    *   `B`: Toggle Bookmark.
*   **Kontras Warna:** Pastikan teks abu-abu di dark mode (`neutral-400`) memiliki rasio kontras minimal 4.5:1 terhadap background hitam.
*   **Focus Ring:** Pastikan elemen yang bisa di-tab (seperti input search atau tombol) memiliki *focus ring* yang jelas (`focus:ring-2`).

---

## 7. Do's and Don'ts (Penting untuk Developer/Desainer)

| ✅ DO (Lakukan) | ❌ DON'T (Jangan) |
| :--- | :--- |
| Gunakan banyak *whitespace* (padding/margin). | Menjejalkan terlalu banyak informasi di satu layar. |
| Gunakan ikon garis (outline) yang tipis. | Menggunakan ikon 3D atau berwarna-warni yang ramai. |
| Gunakan transisi yang halus (Framer Motion). | Menggunakan animasi yang berlebihan dan mengganggu. |
| Biarkan PDF menjadi fokus utama di Reader. | Menaruh iklan atau banner besar di dekat area baca. |
| Gunakan *glassmorphism* untuk toolbar. | Menggunakan toolbar solid kaku di Reader Mode. |