import Link from "next/link";
import { redirect } from "next/navigation";
import CollectionShelf, {
  type CollectionBook,
} from "@/components/collection/collection-shelf";
import { getAppUser } from "@/lib/auth/get-app-user";
import { resolveCoverUrl } from "@/lib/books/cover-url";
import { prisma } from "@/lib/prisma";

export default async function KoleksiPage() {
  const user = await getAppUser();

  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent("/koleksi")}`);
  }

  const items = await prisma.collectionItem.findMany({
    where: { userId: user.id, book: { deletedAt: null } },
    orderBy: { createdAt: "desc" },
    select: {
      book: {
        select: {
          id: true,
          slug: true,
          title: true,
          author: true,
          series: true,
          coverUrl: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  const books: CollectionBook[] = items.map(({ book }) => ({
    id: book.id,
    slug: book.slug,
    title: book.title,
    author: book.author,
    series: book.series,
    cover: resolveCoverUrl(book.coverUrl),
    category: book.category?.name ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-8 md:px-8 md:py-10 xl:px-10">
      <header className="flex flex-col gap-6 border-b border-surface-container-high pb-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">
              collections_bookmark
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
              Rak Pribadi
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-on-surface md:text-4xl">
            Rak Koleksi
          </h1>
          <p className="mt-3 max-w-lg font-serif text-[15px] leading-relaxed text-on-surface-variant">
            Buku yang Anda simpan untuk dibaca, ditelaah, atau dikunjungi lagi.
            Rak ini privat dan hanya terlihat oleh Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-surface-container-low px-4 py-2 font-label-sm text-label-sm text-on-surface-variant shadow-sm">
            <strong className="text-on-surface">{books.length}</strong> buku
            tersimpan
          </span>
          <Link
            href="/katalog"
            className="rounded-lg bg-surface-container-low px-4 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container"
          >
            Katalog
          </Link>
        </div>
      </header>

      <section className="mt-8">
        <CollectionShelf initialBooks={books} />
      </section>
    </div>
  );
}
