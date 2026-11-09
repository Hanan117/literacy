import Link from "next/link";

export default function HomePage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-gutter py-space-xl flex flex-col gap-space-xl">
      <section className="flex flex-col gap-space-lg pt-space-md">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md border-b border-surface-container-high pb-space-lg">
          <div className="flex flex-col max-w-2xl">
            <div className="flex items-center gap-2 mb-space-xs text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">Beranda • Literacy</span>
            </div>
            <h1 className="text-3xl md:text-5xl text-on-surface tracking-tight font-serif">
              Ruang baca digital, fokus tanpa distraksi
            </h1>
            <p className="text-base text-on-surface-variant mt-2">
              Literacy adalah platform baca buku non-fiksi terkurasi untuk membantu kamu berpikir lebih jernih—temukan bacaan, baca dengan nyaman, dan lanjutkan progresmu kapan saja.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-end flex-wrap">
            <Link
              href="/register"
              className="px-4 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
            >
              Mulai Membaca
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <Link
              href="/explore"
              className="px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors text-sm font-medium"
            >
              Jelajahi Katalog
            </Link>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-space-md">
        <div>
          <span className="text-xs text-outline tracking-wider uppercase font-semibold">Kenapa Literacy</span>
          <h2 className="text-xl font-semibold text-on-surface mt-1">Fitur untuk pengalaman membaca yang lebih baik</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: "auto_stories",
              title: "Immersive Reader",
              desc: "Mode baca fokus dan nyaman agar kamu bisa menyerap gagasan tanpa distraksi.",
            },
            {
              icon: "travel_explore",
              title: "Katalog Terkurasi",
              desc: "Jelajahi pilihan buku non-fiksi dan temukan bacaan lewat Eksplorasi.",
              href: "/explore",
            },
            {
              icon: "bookmark",
              title: "Lanjutkan Progres",
              desc: "Masuk untuk menyimpan bacaan dan melanjutkan progres dari Beranda.",
              href: "/login",
            },
            {
              icon: "tune",
              title: "Rekomendasi Personal",
              desc: "Atur preferensi bacaan agar rekomendasi yang muncul lebih relevan untukmu.",
              href: "/onboarding",
            },
          ].map((feature) => {
            const content = (
              <>
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{feature.icon}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-on-surface">{feature.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-snug">{feature.desc}</p>
                </div>
              </>
            );
            const className =
              "flex items-start gap-3 p-4 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all";
            return feature.href ? (
              <Link key={feature.title} href={feature.href} className={className}>
                {content}
              </Link>
            ) : (
              <div key={feature.title} className={className}>
                {content}
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-outline tracking-wider uppercase font-semibold">Lanjutkan Membaca</span>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-on-surface">Belum ada bacaan yang berjalan</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Masuk untuk melanjutkan progresmu, atau pilih buku pertama dari katalog.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary-container transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/explore"
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors"
              >
                Cari Buku
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-space-md pt-space-sm">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs text-outline tracking-wider uppercase font-semibold">Kurasi</span>
            <h3 className="text-xl font-semibold text-on-surface mt-1">Rekomendasi Pilihan</h3>
          </div>
          <Link href="/explore" className="text-sm text-primary hover:text-primary-container transition-colors flex items-center gap-1">
            Lihat semua di Eksplorasi <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { slug: "buku-1", title: "Filosofi Teras", author: "Henry Manampiring", category: "Filsafat" },
            { slug: "buku-2", title: "Atomic Habits", author: "James Clear", category: "Pengembangan Diri" },
            { slug: "buku-3", title: "Sapiens", author: "Yuval Noah Harari", category: "Sejarah & Sains" },
            { slug: "buku-4", title: "Berpikir, Cepat dan Lambat", author: "Daniel Kahneman", category: "Psikologi" },
          ].map((book) => (
            <article
              key={book.slug}
              className="group relative flex flex-col bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <Link href={`/books/${book.slug}`} className="flex flex-col flex-1">
                <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden mb-4 shadow bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px] text-outline/40">menu_book</span>
                </div>
                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <span className="text-xs text-primary tracking-wide uppercase font-semibold">{book.category}</span>
                    <h4 className="font-semibold text-on-surface group-hover:text-primary transition-colors mt-0.5 line-clamp-2">
                      {book.title}
                    </h4>
                    <p className="text-sm text-outline mt-0.5">{book.author}</p>
                  </div>
                  <div className="pt-4 flex items-center justify-between text-xs text-outline">
                    <span>Lihat detail</span>
                    <span className="material-symbols-outlined text-[16px] group-hover:text-primary transition-colors">arrow_forward</span>
                  </div>
                </div>
              </Link>
              <button
                type="button"
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors shadow-sm"
                aria-label={`Simpan ${book.title}`}
              >
                <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
