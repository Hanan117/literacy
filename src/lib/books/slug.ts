import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Slug unik dari judul. Jika sudah dipakai, tambahkan akhiran acak.
 */
export async function createUniqueSlug(title: string) {
  const base = slugify(title) || "buku";
  const existing = await prisma.book.findUnique({ where: { slug: base } });

  if (!existing) return base;

  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}
