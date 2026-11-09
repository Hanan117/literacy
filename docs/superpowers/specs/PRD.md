# 📄 Product Requirements Document (PRD): Literacy

**Status:** Draft / Final MVP  
**Versi:** 1.0.0  
**Tanggal:** 2024  
**Platform:** Web Application (Responsive, Desktop-first)  

---

## 1. Executive Summary
**Literacy** adalah platform web baca buku digital yang berfokus pada buku non-fiksi (self-improvement, bisnis, sains, dll). Produk ini dirancang untuk memberikan pengalaman membaca yang bersih, modern, bebas distraksi, dan terasa premium. 

Berbeda dari platform lain, Literacy mengutamakan fitur **"Progress Sync"** sebagai nilai jual utama (Hero Feature), memastikan pembaca tidak pernah kehilangan jejak bacaan di perangkat mana pun.

*   **Target Pengguna:** Profesional, self-learner, dan pembaca buku non-fiksi.
*   **Model Bisnis:** 100% Gratis (Fase 1).
*   **Sumber Konten:** Kurasi internal (Admin mengunggah file PDF).
*   **Vibe Desain:** Minimalis, *Invisible UI*, terinspirasi dari Dovetail/Notion.

---

## 2. Arsitektur & Tech Stack
*   **Package Manager:** Bun
*   **Frontend & Backend (BFF):** Next.js 16 (App Router) - Deploy di Vercel.
*   **Styling:** Tailwind CSS, Lucide React (Icons), Framer Motion (Animasi transisi).
*   **Database:** PostgreSQL (via Docker untuk lokal, Railway/Supabase untuk production).
*   **ORM:** Prisma.
*   **Storage:** Supabase Storage / S3 (untuk file PDF & Sampul).
*   **PDF Engine:** PDF.js (Client-side rendering via Canvas).

---

## 3. UI/UX Principles
1.  **Invisible UI:** Toolbar dan navigasi di Reader Engine akan menghilang secara otomatis saat user *idle* (diam) selama 3 detik, memberikan 100% ruang layar untuk teks PDF.
2.  **Floating Elements:** Menggunakan *pill-shaped* bottom bar dan *glassmorphism* (backdrop blur) untuk navigasi.
3.  **Zero-Friction:** Pembaca bisa membaca sampel 3 halaman pertama tanpa perlu login. Login hanya diminta saat ingin menyimpan progres.
4.  **Hitbox Navigation:** Area klik transparan di 15% sisi kiri dan kanan layar untuk navigasi halaman cepat.

---

## 4. Fitur MVP (Fase 1)

### A. Autentikasi
*   Register, Login, Logout menggunakan Email & Password (with OAuth).
*   Sesi persisten (user tidak perlu login ulang tiap buka web).
*   Login/Registrasi **tidak diwajibkan** untuk membaca sampel (halaman 1–3). Autentikasi hanya diminta saat ingin melanjutkan membaca di luar batas sampel atau menyimpan progres.
*   Mendukung redirect ke halaman asal setelah login/register melalui parameter `returnTo` (hanya path internal, hindari open redirect).
*   *Tech note:* Menggunakan Supabase Auth.

### B. Katalog & Pencarian
*   Grid buku dengan sampul, judul, penulis, dan badge bahasa (ID/EN).
*   Filter berdasarkan 6 kategori: *Pengembangan Diri, Bisnis & Karier, Sains & Teknologi, Sejarah & Biografi, Filsafat & Pemikiran, Kesehatan & Gaya Hidup*.
*   Pencarian fuzzy (toleran typo) berdasarkan judul, penulis, atau kategori.

### C. Reader Engine (PDF.js)
*   Render file PDF (zoom in/out, fullscreen).
*   Mode Gelap (CSS invert filter pada canvas PDF).
*   Floating Bottom Bar untuk navigasi halaman, slider progres, dan tombol Bookmark.
*   Keyboard Shortcuts (Panah Kiri/Kanan, `B` untuk bookmark, `Esc` untuk keluar).

### D. Progress Sync (Hero Feature) ⭐
*   Menyimpan halaman terakhir secara otomatis (debounce 15 detik).
*   Sinkronisasi ke database (Upsert). Indikator awan (Cloud) di Top Bar Reader sebagai status (Tersimpan/Menyimpan).
*   Fallback ke `localStorage` jika koneksi terputus (Offline-first).
*   **Batas baca gratis:** User anonim hanya dapat mengakses halaman 1–3 ("Baca Sampel") **tanpa login**. Gating ini **hanya berlaku untuk user anonim** saat mencoba mengakses halaman > 3. For user terautentikasi, batasan ini dilepaskan dan dapat membaca seluruh halaman buku.
*   **Konstanta batas baca gratis:** Batas baca gratis didefinisikan sebagai konstanta `FREE_PAGES = 3` (disarankan diletakkan di `lib/constants/reader.ts`) agar konsisten digunakan di logika gating, validasi, dan teks UI.
*   **Pemisahan Guest vs Logged-in:** Batas baca gratis dilacak di `localStorage` dengan key `literacy:guest:{bookId}` hanya untuk tujuan gating. Sinkronisasi ke tabel `Progress` **hanya** berlaku untuk user terautentikasi. Setiap kali progres disinkronkan (upsert), `lastReadAt` wajib diperbarui bersamaan dengan `currentPage` dan `percentage`. Nilai `lastReadAt` digunakan untuk mengurutkan daftar "Lanjutkan Membaca" di Dashboard. Saat offline, user terautentikasi dapat menggunakan fallback `localStorage` untuk menjaga posisi bacaan sebelum disinkronkan kembali.

### E. Dashboard Pembaca
*   Hero Card **"Lanjutkan Membaca"** (menampilkan buku terakhir & persentase).
*   Eksplorasi Kategori (berbentuk horizontal scroll *Pills*).
*   Rekomendasi Buku (berdasarkan kategori buku yang sedang dibaca).

### F. Admin Panel
*   **Akses Terproteksi:** Hanya user dengan `role = ADMIN` yang dapat mengakses `/admin/*`. Proteksi wajib via middleware/route guard.
*   Form Upload PDF (maks. 50MB) ke Supabase Storage.
*   Auto-generate sampul: Render halaman 1 PDF menggunakan PDF.js dan simpan sebagai Thumbnail.
*   Form Metadata: Judul, Penulis, Sinopsis, Kategori, Bahasa.
*   Tabel Manajemen Buku (Edit, Publish/Unpublish, Soft Delete).

---

## 5. Database Schema (Prisma)
*(File: `prisma/schema.prisma`)*

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  READER
  ADMIN
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  role      Role     @default(READER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  progress  Progress[]
  bookmarks Bookmark[]
  @@map("users")
}

model Category {
  id        String   @id @default(uuid())
  slug      String   @unique
  name      String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  books     Book[]
  @@map("categories")
}

model Book {
  id           String    @id @default(uuid())
  slug         String    @unique
  title        String
  author       String
  synopsis     String?   @db.Text
  language     String    // ISO code: 'id', 'en'
  pdfUrl       String
  pdfPageCount Int
  coverUrl     String?
  fileSize     BigInt?
  isPublished  Boolean   @default(false)
  deletedAt    DateTime? // Soft Delete
  categoryId   String?
  category     Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  progress     Progress[]
  bookmarks    Bookmark[]
  @@index([categoryId])
  @@index([isPublished, deletedAt])
  @@map("books")
}

model Progress {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  bookId      String
  book        Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  currentPage Int      @default(1)
  percentage  Decimal  @default(0) @db.Decimal(5, 2)
  isCompleted Boolean  @default(false)
  lastReadAt  DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@unique([userId, bookId])
  @@index([userId, lastReadAt(sort: Desc)])
  @@map("progress")
}

model Bookmark {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  bookId    String
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  page      Int
  label     String?
  note      String?  @db.Text
  createdAt DateTime @default(now())
  @@index([userId, bookId, page])
  @@map("bookmarks")
}