import Link from "next/link";
import { notFound } from "next/navigation";
import ReviewsExperience from "@/components/reviews/reviews-experience";
import { getAppUser } from "@/lib/auth/get-app-user";
import { prisma } from "@/lib/prisma";
import {
  buildDistribution,
  displayAuthorName,
  type ReviewFilter,
  type ReviewItem,
  type ReviewSort,
} from "@/lib/reviews";

const PAGE_SIZE = 5;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilter(value: string | undefined): ReviewFilter {
  if (value === "kurator" || value === "kutipan") return value;
  return "semua";
}

function parseSort(value: string | undefined): ReviewSort {
  return value === "tertinggi" ? "tertinggi" : "terbaru";
}

function toItem(
  row: {
    id: string;
    userId: string;
    rating: number;
    title: string;
    body: string;
    quote: string | null;
    createdAt: Date;
    user: { name: string | null; email: string; role: string };
  },
  viewerId: string | null
): ReviewItem {
  return {
    id: row.id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    quote: row.quote,
    createdAt: row.createdAt.toISOString(),
    isOwner: viewerId === row.userId,
    author: {
      name: displayAuthorName(row.user.name, row.user.email),
      isCurator: row.user.role === "ADMIN",
    },
  };
}

export default async function BookReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    filter?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const user = await getAppUser();

  const book = await prisma.book.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      author: true,
      isPublished: true,
    },
  });

  if (!book) notFound();
  if (!book.isPublished && user?.role !== "ADMIN") notFound();

  const filter = parseFilter(first(query.filter));
  const sort = parseSort(first(query.sort));
  const requestedPage = Math.max(
    1,
    Number.parseInt(first(query.page) ?? "1", 10) || 1
  );

  const where = {
    bookId: book.id,
    ...(filter === "kurator" ? { user: { role: "ADMIN" as const } } : {}),
    ...(filter === "kutipan" ? { quote: { not: null } } : {}),
  };

  const [aggregate, grouped, allCount, curatorCount, quoteCount, ownRow] =
    await Promise.all([
      prisma.review.aggregate({
        where: { bookId: book.id },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { bookId: book.id },
        _count: { _all: true },
      }),
      prisma.review.count({ where: { bookId: book.id } }),
      prisma.review.count({
        where: { bookId: book.id, user: { role: "ADMIN" } },
      }),
      prisma.review.count({
        where: { bookId: book.id, quote: { not: null } },
      }),
      user
        ? prisma.review.findUnique({
            where: {
              userId_bookId: { userId: user.id, bookId: book.id },
            },
            include: {
              user: { select: { name: true, email: true, role: true } },
            },
          })
        : Promise.resolve(null),
    ]);

  const filteredCount =
    filter === "kurator"
      ? curatorCount
      : filter === "kutipan"
        ? quoteCount
        : allCount;

  const pageCount = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);

  const rows = await prisma.review.findMany({
    where,
    orderBy:
      sort === "tertinggi"
        ? [{ rating: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      user: { select: { name: true, email: true, role: true } },
    },
  });

  const reviews = rows.map((row) => toItem(row, user?.id ?? null));
  const ownReview = ownRow ? toItem(ownRow, user?.id ?? null) : null;

  const summary = {
    average: aggregate._avg.rating ?? null,
    total: allCount,
    distribution: buildDistribution(
      grouped.map((row) => ({
        rating: row.rating,
        count: row._count._all,
      })),
      allCount
    ),
  };

  return (
    <div className="mx-auto w-full max-w-[1040px] px-5 py-6 pb-10 md:px-8 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <Link
          href={`/books/${book.slug}`}
          className="group inline-flex items-center gap-1.5 text-on-surface-variant transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-0.5">
            arrow_back
          </span>
          Kembali ke Detail Naskah / {book.title}
        </Link>
        {!book.isPublished && (
          <span className="rounded bg-tertiary-fixed/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-tertiary">
            Draft
          </span>
        )}
      </div>

      <ReviewsExperience
        bookId={book.id}
        bookTitle={book.title}
        bookAuthor={book.author}
        isAuthenticated={Boolean(user)}
        returnTo={`/books/${book.slug}/reviews`}
        ownReview={ownReview}
        summary={summary}
        reviews={reviews}
        filter={filter}
        sort={sort}
        page={page}
        pageCount={pageCount}
        counts={{ all: allCount, curator: curatorCount, quote: quoteCount }}
      />
    </div>
  );
}
