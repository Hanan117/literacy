import { redirect } from "next/navigation";
import SettingsView, {
  type FavoriteBook,
  type SettingsStats,
} from "@/components/settings/settings-view";
import { getAppUser } from "@/lib/auth/get-app-user";
import { resolveCoverUrl } from "@/lib/books/cover-url";
import { prisma } from "@/lib/prisma";
import {
  estimateReadingMinutes,
  formatReadingHours,
  readPrivacyMetadata,
  readProfileMetadata,
} from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export default async function PengaturanPage() {
  const user = await getAppUser();

  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent("/pengaturan")}`);
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const metadata = authUser?.user_metadata;
  const storedProfile = readProfileMetadata(metadata);
  const privacy = readPrivacyMetadata(metadata);
  const emailVerified = Boolean(authUser?.email_confirmed_at);

  const [account, progressRows, annotationCount, starredBookmarks] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { createdAt: true, updatedAt: true },
      }),
      prisma.progress.findMany({
        where: { userId: user.id, book: { deletedAt: null } },
        select: {
          percentage: true,
          book: { select: { estimatedMinutes: true, pdfPageCount: true } },
        },
      }),
      prisma.bookmark.count({
        where: { userId: user.id, note: { not: null } },
      }),
      prisma.bookmark.findMany({
        where: {
          userId: user.id,
          note: { not: null },
          book: { deletedAt: null },
        },
        orderBy: { createdAt: "desc" },
        distinct: ["bookId"],
        select: {
          book: {
            select: {
              id: true,
              slug: true,
              title: true,
              author: true,
              series: true,
              coverUrl: true,
            },
          },
        },
      }),
    ]);

  const readingMinutes = estimateReadingMinutes(
    progressRows.map((row) => ({
      percentage: Number(row.percentage),
      estimatedMinutes: row.book.estimatedMinutes,
      pageCount: row.book.pdfPageCount,
    }))
  );

  const favorites: FavoriteBook[] = starredBookmarks.map(({ book }) => ({
    id: book.id,
    slug: book.slug,
    title: book.title,
    author: book.author,
    series: book.series,
    cover: resolveCoverUrl(book.coverUrl),
  }));

  const stats: SettingsStats = {
    collections: progressRows.length,
    readingHours: formatReadingHours(readingMinutes),
    annotations: annotationCount,
    favorites: favorites.length,
  };

  const emailPrefix = user.email.split("@")[0] || "pembaca";

  return (
    <SettingsView
      profile={{
        name: user.name?.trim() || emailPrefix,
        email: user.email,
        role: user.role,
        handle: storedProfile.handle || emailPrefix,
        bio: storedProfile.bio,
        emailVerified,
        memberSince: formatDate(account?.createdAt ?? new Date()),
        updatedAtLabel: formatDate(
          authUser?.updated_at
            ? new Date(authUser.updated_at)
            : (account?.updatedAt ?? new Date())
        ),
      }}
      stats={stats}
      favorites={favorites}
      privacy={privacy}
    />
  );
}
