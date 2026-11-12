# Rating & Ulasan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan rating dan ulasan per buku yang tersimpan di database, dapat ditulis/diubah/dihapus user, dengan tampilan ringkas dan konsisten.

**Architecture:** Server component mengambil buku, agregat, dan daftar ulasan. Satu client component menangani modal, quick rating, filter, pagination, serta aksi pemilik melalui route handler lalu `router.refresh()`.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 7/PostgreSQL, Supabase Auth, Tailwind token proyek, `bun test`.

**Spec:** `docs/superpowers/specs/2026-11-12-rating-ulasan-design.md`

## Global Constraints
- Satu ulasan per user per buku.
- Rating 1–5; judul 3–120 karakter; isi 20–4000 karakter; kutipan maks. 280 karakter.
- Semua teks UI berbahasa Indonesia.
- Gunakan token warna/font yang sudah ada; jangan memuat font atau CDN baru.
- Jangan mengubah perilaku bookmark/progress yang sudah ada.

## Review Focus
- Buku tanpa ulasan menampilkan empty state, bukan `NaN` atau bintang rusak.
- User tanpa nama memakai fallback prefix email atau "Pembaca".
- User anonim diarahkan ke login; API menolak dengan 401.
- Submit ganda dicegah upsert dan tombol disabled.
- Teks panjang tetap membungkus rapi dan divalidasi.
- Filter/pagination di luar rentang di-clamp.
- Buku draft/dihapus menghasilkan 404 kecuali admin.

---

### Task 1: Helper domain + test

**Files:**
- Create: `src/lib/reviews.ts`
- Create: `src/lib/reviews.test.ts`

**Interfaces:**
- Produces: `ReviewItem`, `RatingBucket`, `ReviewInput`, `RATING_LABELS`, `starFill(average: number, index: number): number`, `buildDistribution(rows, total): RatingBucket[]`, `formatReviewDate(value): string`, `validateReviewInput(input): { ok: true; value: ReviewInput } | { ok: false; error: string }`, `displayAuthorName(name, email): string`.

- [ ] **Step 1: Tulis test gagal di `src/lib/reviews.test.ts`**

Test mencakup: `RATING_LABELS[5]` bernilai "Mahakarya"; `starFill(4.9, 4)` = 90; `buildDistribution([{rating:5,count:3},{rating:4,count:1}], 4)` menghasilkan 5 bucket dengan persen 75/25/0/0/0; `formatReviewDate` untuk hari ini, kemarin, 3 hari lalu, dan 1 pekan lalu; `validateReviewInput` menolak rating 0/6, judul pendek, isi pendek, dan menerima input valid dengan trim; `displayAuthorName(null, "budi@mail.com")` = "Budi".

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `bun test src/lib/reviews.test.ts`
Expected: FAIL karena modul `src/lib/reviews.ts` belum ada.

- [ ] **Step 3: Implementasikan helper**

Buat `src/lib/reviews.ts` dengan tipe dan fungsi di atas. `formatReviewDate` memakai `Intl.DateTimeFormat("id-ID")`, label relatif "Hari ini", "Kemarin", "N hari yang lalu", "1 pekan yang lalu", "N pekan yang lalu", lalu tanggal singkat.

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `bun test src/lib/reviews.test.ts`
Expected: PASS semua test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reviews.ts src/lib/reviews.test.ts docs/superpowers
git commit -m "feat: add review domain helpers"
```

### Task 2: Schema database

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `prisma.review` dengan unique compound `userId_bookId`.

- [ ] **Step 1: Tambah relasi dan model**

Tambah `reviews Review[]` pada `User` dan `Book`. Tambah model `Review` sesuai spec dengan `@@unique([userId, bookId])`, `@@index([bookId, createdAt(sort: Desc)])`, dan `@@map("reviews")`.

- [ ] **Step 2: Terapkan schema**

Run: `bun run db:push`
Expected: schema tersinkron tanpa error.

- [ ] **Step 3: Generate client**

Run: `bunx prisma generate`
Expected: "Generated Prisma Client" tanpa error.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add review schema"
```

### Task 3: Route handler ulasan

**Files:**
- Create: `src/app/api/books/[id]/reviews/route.ts`

**Interfaces:**
- Consumes: `validateReviewInput` dari Task 1; `prisma.review` dari Task 2.
- Produces: `POST` mengembalikan `{ review }`; `DELETE` mengembalikan `{ ok: true }`.

- [ ] **Step 1: Implementasikan POST**

`POST(req, { params }: { params: Promise<{ id: string }> })`: `getAppUser()`; 401 bila null. Ambil buku `findFirst({ where: { id, deletedAt: null }, select: { id, isPublished } })`; 404 bila tidak ada; 403 bila draft dan bukan admin. Parse JSON, validasi, lalu `prisma.review.upsert({ where: { userId_bookId: { userId, bookId } }, create: {...}, update: {...} })`. Kembalikan `{ review }` dengan field id, rating, title, body, quote, createdAt.

- [ ] **Step 2: Implementasikan DELETE**

`DELETE(req, { params })`: wajib login; `deleteMany({ where: { bookId, userId } })`; 404 bila `count === 0`; selain itu `{ ok: true }`.

- [ ] **Step 3: Verifikasi**

Run: `bun run lint`
Expected: tidak ada error pada file baru.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/books/[id]/reviews/route.ts"
git commit -m "feat: add review API"
```

### Task 4: Halaman ulasan buku + komponen interaktif

**Files:**
- Create: `src/app/(app)/books/[slug]/reviews/page.tsx`
- Create: `src/components/reviews/reviews-experience.tsx`

**Interfaces:**
- Consumes: helper Task 1, `prisma.review` Task 2, API Task 3.
- Produces: route `/books/[slug]/reviews`.

- [ ] **Step 1: Implementasikan server page**

`params` dan `searchParams` bertipe Promise. Ambil user, buku (published atau admin), lalu paralel: `aggregate` rata-rata/jumlah, `groupBy` rating, tiga `count` filter, daftar ulasan halaman aktif (5/halaman, `include user`), dan ulasan milik user. Normalisasi `filter` (`semua|kurator|kutipan`), `sort` (`terbaru|tertinggi`), `page` (clamp minimal 1). Render header editorial dan `<ReviewsExperience ... />`.

- [ ] **Step 2: Implementasikan client component**

Props: `bookId`, `bookTitle`, `isAuthenticated`, `returnTo`, `ownReview`, `summary`, `reviews`, `filter`, `sort`, `page`, `pageCount`, `counts`. Render kartu ringkasan (angka besar, bintang dengan partial fill, distribusi 5→1), quick rater, tab filter + sort sebagai `Link`, kartu ulasan, aksi Edit/Hapus milik sendiri, empty state, pagination, dan modal. Modal memakai rating picker, judul, kutipan, isi; Escape/backdrop menutup; submit `POST` lalu `router.refresh()`. Hapus memakai konfirmasi lalu `DELETE` + refresh. User anonim diarahkan ke `/login?returnTo=...`.

- [ ] **Step 3: Verifikasi build dan lint**

Run: `bun run lint && bun run build`
Expected: keduanya sukses.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/books/[slug]/reviews/page.tsx" src/components/reviews/reviews-experience.tsx
git commit -m "feat: add book reviews page"
```

### Task 5: Pintu masuk dan navigasi

**Files:**
- Create: `src/app/(app)/reviews/page.tsx`
- Modify: `src/components/app-shell.tsx`
- Modify: `src/app/(app)/books/[slug]/page.tsx`

**Interfaces:**
- Produces: `/reviews` redirect dan tautan navigasi.

- [ ] **Step 1: Buat halaman redirect**

`/reviews` membaca `searchParams.book`; redirect ke `/books/{slug}/reviews`. Fallback: buku dari progres terakhir user, buku published terbaru, lalu `/katalog`.

- [ ] **Step 2: Aktifkan sidebar**

Item "Rating & Ulasan" diberi `href="/reviews"`. Active state juga mengenali `pathname.endsWith("/reviews")`.

- [ ] **Step 3: Tambah tautan di detail buku**

Tambahkan tautan sekunder "Rating & Ulasan" dengan ikon `star` di baris aksi halaman detail.

- [ ] **Step 4: Verifikasi**

Run: `bun run lint && bun run build`
Expected: sukses.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/reviews/page.tsx" src/components/app-shell.tsx "src/app/(app)/books/[slug]/page.tsx"
git commit -m "feat: connect reviews navigation"
```

### Task 6: Seed data contoh opsional

**Files:**
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `prisma.review` Task 2.

- [ ] **Step 1: Tambah blok seed**

Jika `SEED_SAMPLE_REVIEWS === "1"`, upsert 3 user demo (email `@contoh.literacy`) dan 3 ulasan idempotent untuk buku `SEED_REVIEW_BOOK_SLUG` (default `filosofi-teras`). Lewati jika buku tidak ditemukan. Jangan mengubah seed default.

- [ ] **Step 2: Verifikasi**

Run: `$env:SEED_SAMPLE_REVIEWS="1"; bun run db:seed`
Expected: pesan seed ulasan selesai dan aman dijalankan dua kali.

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "chore: add optional review seed"
```

### Task 7: Verifikasi akhir

**Files:** tidak ada file baru.

- [ ] **Step 1: Jalankan test helper**

Run: `bun test src/lib/reviews.test.ts`
Expected: PASS.

- [ ] **Step 2: Jalankan lint dan build**

Run: `bun run lint && bun run build`
Expected: sukses.

- [ ] **Step 3: Cek manual**

Buka `/reviews`, tulis ulasan, ubah, hapus, filter kurator/kutipan, sort, pagination, coba anonim, dan cek mobile. Expected: semua sesuai spec.

- [ ] **Step 4: Commit perbaikan bila ada**

```bash
git add -A
git commit -m "fix: polish reviews experience"
```
