# Rating & Ulasan per Buku — Design

**Status:** Approved
**Tanggal:** 2026-11-12

## Tujuan
Menambahkan rating dan ulasan per buku yang tersimpan di database, dapat ditulis/diubah/dihapus user, dengan tampilan ringkas dan konsisten dengan design system Literacy.

## Non-goals
- Diskusi/komentar bertingkat.
- Tombol "Bermanfaat".
- Moderasi admin.
- Halaman ulasan lintas-buku dalam satu daftar.

## Keputusan
- Satu ulasan per user per buku (unique `userId + bookId`); pemilik dapat mengubah dan menghapus.
- Rating 1–5 dan isi wajib; judul wajib; kutipan opsional.
- Badge "Kurator" untuk user dengan role `ADMIN`.
- Pilar persentase pada mock dibuang; diganti distribusi rating 5→1 dari database.
- Tombol "Bermanfaat" dan "Diskusi" dibuang.
- Data contoh opsional lewat seed, tidak otomatis.

## Data model
`Review`: id, userId, bookId, rating (Int), title, body (Text), quote (nullable), createdAt, updatedAt.
Unique `[userId, bookId]`; index `[bookId, createdAt desc]`.

## API
`POST /api/books/[id]/reviews` — wajib login, validasi, upsert.
`DELETE /api/books/[id]/reviews` — wajib login, hapus ulasan sendiri.

## Route
- `/books/[slug]/reviews` — halaman ulasan satu buku, filter `semua|kurator|kutipan`, sort `terbaru|tertinggi`, pagination 5/halaman.
- `/reviews` — redirect ke buku dari `?book=`, lalu progres terakhir, lalu buku published terbaru, lalu `/katalog`.
- Sidebar "Rating & Ulasan" menuju `/reviews`.
- Tautan "Rating & Ulasan" ditambahkan di halaman detail buku.

## UX ringkas
- Header editorial satu blok.
- Satu kartu ringkasan: rata-rata, bintang, jumlah, distribusi.
- Quick rater menyatu di kartu ringkasan.
- Filter berupa tab tenang; kartu ulasan putih bergaris halus tanpa shadow.
- Modal tulis ulasan dengan tiga field utama; Escape/backdrop menutup.
- User anonim diarahkan ke login dengan `returnTo`.

## Verifikasi
- Test helper domain via `bun test`.
- `bun run lint`, `bun run build`, dan checklist manual.
