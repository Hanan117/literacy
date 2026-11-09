import Link from "next/link";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  return (
    <div className="max-w-6xl mx-auto px-gutter py-space-xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="aspect-[2/3] w-full rounded-lg overflow-hidden shadow-lg bg-surface-container-high"></div>
        </div>
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div>
            <span className="text-xs text-primary uppercase tracking-wider font-semibold">Filsafat & Stoikisme</span>
            <h1 className="text-3xl md:text-4xl text-on-surface mt-2 font-serif">Filosofi Teras</h1>
            <p className="text-lg text-on-surface-variant mt-1">Henry Manampiring</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-on-surface-variant">
            <span>320 Halaman</span>
            <span>Bahasa Indonesia</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-on-surface mb-2">Sinopsis</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Filosofi Teras adalah pengantar praktis untuk filsafat Stoikisme yang relevan dengan kehidupan modern...
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/read/1" className="px-6 py-3 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary-container transition-colors flex items-center gap-2">
              <span>Baca Sampel (Halaman 1-3)</span>
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
            </Link>
            <button className="px-6 py-3 bg-surface-container text-on-surface rounded-lg text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
              <span>Simpan ke Koleksi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
