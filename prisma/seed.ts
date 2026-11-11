import "dotenv/config";
import { PrismaClient } from "@prisma/client";
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
