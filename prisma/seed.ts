import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL belum dikonfigurasi.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const categories = [
  { slug: "filsafat", name: "Filsafat & Esai", sortOrder: 1 },
  { slug: "sastra", name: "Sastra Klasik", sortOrder: 2 },
  { slug: "sains", name: "Sains & Pemikiran", sortOrder: 3 },
  { slug: "memoir", name: "Memoir & Sejarah", sortOrder: 4 },
  { slug: "self-improvement", name: "Self Improvement", sortOrder: 5 },
];

const sampleBooks = [
  {
    slug: "bumi-manusia",
    title: "Bumi Manusia",
    author: "Pramoedya Ananta Toer",
    synopsis:
      "Kisah Minke di tanah kolonial: cinta, pendidikan, dan benturan antara dunia lama dan dunia baru.",
    language: "id",
    series: "Edisi Tetralogi Buru",
    estimatedMinutes: 720,
    pdfUrl: "samples/bumi-manusia.pdf",
    pdfPageCount: 520,
    categorySlug: "sastra",
    isPublished: true,
  },
  {
    slug: "filosofi-teras",
    title: "Filosofi Teras",
    author: "Henry Manampiring",
    synopsis:
      "Pengantar stoikisme untuk kehidupan sehari-hari: mengelola emosi, menerima hal di luar kendali, dan hidup lebih tenang.",
    language: "id",
    series: "Kajian Stoikisme Mental",
    estimatedMinutes: 300,
    pdfUrl: "samples/filosofi-teras.pdf",
    pdfPageCount: 320,
    categorySlug: "filsafat",
    isPublished: true,
  },
  {
    slug: "madilog",
    title: "Madilog",
    author: "Tan Malaka",
    synopsis:
      "Materialisme, dialektika, dan logika sebagai kerangka berpikir kritis dalam konteks Indonesia.",
    language: "id",
    series: "Manuskrip Pergerakan",
    estimatedMinutes: 900,
    pdfUrl: "samples/madilog.pdf",
    pdfPageCount: 540,
    categorySlug: "sains",
    isPublished: false,
  },
];

const sampleReviews = [
  {
    userId: "demo-reviewer-saraswati",
    email: "saraswati@contoh.literacy",
    name: "Dr. Saraswati",
    role: Role.ADMIN,
    rating: 5,
    title: "Stoikisme yang Membumi untuk Pembaca Modern",
    quote:
      "Kita tidak dapat mengendalikan peristiwa, tetapi kita dapat mengendalikan penilaian kita atasnya.",
    body: "Pendekatan penulis dalam menerjemahkan gagasan Stoa ke bahasa sehari-hari membuat filsafat ini terasa dekat, bukan kaku. Setiap bab memberi ruang untuk merenung tanpa menggurui. Edisi ini berhasil menjaga kedalaman konsep sekaligus tetap ringan untuk dibaca sambil menikmati secangkir teh.",
  },
  {
    userId: "demo-reviewer-reza",
    email: "reza@contoh.literacy",
    name: "Reza Pratama",
    role: Role.READER,
    rating: 5,
    title: "Panduan Tenang Menghadapi Hari yang Riuh",
    quote: null,
    body: "Saya membaca satu bagian setiap pagi sebelum membuka surel. Perlahan, kebiasaan kecil ini mengubah cara saya merespons hal-hal yang di luar kendali. Buku yang sederhana, tetapi dampaknya terasa nyata dalam rutinitas harian.",
  },
  {
    userId: "demo-reviewer-maya",
    email: "maya@contoh.literacy",
    name: "Maya Wulandari",
    role: Role.READER,
    rating: 4,
    title: "Peta Awal yang Jernih untuk Memahami Stoa",
    quote: "Fokus pada hal yang berada dalam kendali kita.",
    body: "Sebagai pembaca yang baru mengenal stoikisme, saya menghargai susunan bab yang runtut dan catatan istilah yang jelas. Beberapa bagian terasa sedikit berulang, namun secara keseluruhan buku ini berhasil menjadi pintu masuk yang ramah tanpa kehilangan nuansa.",
  },
];

async function main() {
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: category.sortOrder },
      create: category,
    });
    categoryIds.set(row.slug, row.id);
  }

  console.log(`Seed kategori selesai (${categories.length} kategori).`);

  if (process.env.SEED_SAMPLE_BOOKS === "1") {
    for (const book of sampleBooks) {
      const { categorySlug, ...data } = book;
      await prisma.book.upsert({
        where: { slug: data.slug },
        update: { ...data, categoryId: categoryIds.get(categorySlug) ?? null },
        create: { ...data, categoryId: categoryIds.get(categorySlug) ?? null },
      });
    }
    console.log(`Seed buku contoh selesai (${sampleBooks.length} buku).`);
  }

  if (process.env.SEED_SAMPLE_REVIEWS === "1") {
    const bookSlug = process.env.SEED_REVIEW_BOOK_SLUG?.trim() || "filosofi-teras";
    const book = await prisma.book.findFirst({
      where: { slug: bookSlug, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      console.log(`Seed ulasan dilewati: buku "${bookSlug}" tidak ditemukan.`);
      return;
    }

    for (const sample of sampleReviews) {
      const { userId, email, name, role, rating, title, quote, body } = sample;
      let reviewer = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!reviewer) {
        reviewer = await prisma.user
          .create({
            data: { id: userId, email, name, role },
            select: { id: true },
          })
          .catch(() => null);

        if (!reviewer) {
          console.log(
            `Seed ulasan dilewati untuk ${email}: email sudah dipakai user lain.`
          );
          continue;
        }
      }

      await prisma.review.upsert({
        where: {
          userId_bookId: { userId: reviewer.id, bookId: book.id },
        },
        update: { rating, title, quote, body },
        create: {
          userId: reviewer.id,
          bookId: book.id,
          rating,
          title,
          quote,
          body,
        },
      });
    }

    console.log(`Seed ulasan contoh selesai (${sampleReviews.length} ulasan).`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
