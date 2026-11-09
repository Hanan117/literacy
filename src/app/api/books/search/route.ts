import { NextRequest, NextResponse } from "next/server";

type Volume = {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    categories?: string[];
    infoLink?: string;
  };
};

function normalizeHttps(url?: string) {
  if (!url) return undefined;
  return url.replace(/^http:\/\//i, "https://");
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const startIndex = Math.max(0, Number(request.nextUrl.searchParams.get("startIndex") ?? "0") || 0);
  const maxResults = Math.min(20, Math.max(1, Number(request.nextUrl.searchParams.get("maxResults") ?? "12") || 12));

  if (q.length < 2) {
    return NextResponse.json({ items: [], total: 0, query: q });
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { items: [], total: 0, query: q, error: "Pencarian belum dikonfigurasi (GOOGLE_BOOKS_API_KEY)." },
      { status: 500 }
    );
  }

  try {
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.set("q", q);
    url.searchParams.set("startIndex", String(startIndex));
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("printType", "books");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { items: [], total: 0, query: q, error: "Gagal mengambil data buku." },
        { status: res.status }
      );
    }

    const data = (await res.json()) as { totalItems?: number; items?: Volume[] };
    const items = (data.items ?? []).map((v) => {
      const info = v.volumeInfo ?? {};
      const thumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
      return {
        id: v.id,
        title: info.title ?? "Tanpa judul",
        authors: info.authors ?? [],
        publishedDate: info.publishedDate,
        thumbnail: normalizeHttps(thumb),
        categories: info.categories ?? [],
        infoLink: info.infoLink,
      };
    });

    return NextResponse.json({
      items,
      total: typeof data.totalItems === "number" ? data.totalItems : items.length,
      query: q,
    });
  } catch {
    return NextResponse.json(
      { items: [], total: 0, query: q, error: "Terjadi kesalahan saat mencari buku." },
      { status: 500 }
    );
  }
}
