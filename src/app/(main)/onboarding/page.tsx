import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-gutter py-space-xl w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-surface-container-high/60">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">Langkah 2 dari 3</span>
              <span className="text-outline-variant text-xs">•</span>
              <span className="text-xs text-on-surface-variant">Preferensi Pembaca Literacy</span>
            </div>
            <h1 className="text-3xl md:text-4xl text-on-surface tracking-tight font-display">Temukan Ruang Bacamu</h1>
            <p className="text-sm text-on-surface-variant mt-2 max-w-xl">Tentukan topik favorit dan target harianmu. Biarkan Literacy menyiapkan bacaan terbaik khusus untukmu.</p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto bg-surface-container-low px-4 py-2 rounded-full">
            <span className="text-xs text-on-surface-variant">Genre Terpilih:</span>
            <span className="text-sm text-primary font-semibold">3 dipilih</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 flex flex-col gap-10">
            <div>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-lg font-semibold text-on-surface">Pilih Genre Favorit</h2>
                <span className="text-xs text-on-surface-variant italic">Pilih minimal 2</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button className="text-left p-4 rounded-lg bg-primary-fixed/40 transition-all duration-200 cursor-pointer shadow-sm group">
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-primary">Filsafat & Stoikisme</span>
                    <span className="material-symbols-outlined text-[18px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2">
                    Pencarian kebajikan, refleksi nalar, Marcus Aurelius, Seneca, dan pemikiran eksistensial.
                  </p>
                </button>
                <button className="text-left p-4 rounded-lg bg-primary-fixed/40 transition-all duration-200 cursor-pointer shadow-sm group">
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-primary">Sastra Nusantara</span>
                    <span className="material-symbols-outlined text-[18px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2">
                    Roman sejarah, prosa liris, Pramoedya, Mochtar Lubis, dan suara lintas kepulauan.
                  </p>
                </button>
                <button className="text-left p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-on-surface group-hover:text-primary">Fiksi Klasik Dunia</span>
                    <span className="material-symbols-outlined text-[18px] text-outline opacity-40 group-hover:opacity-100">add_circle</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2">
                    Karya agung abadi dari Tolstoy, Dostoevsky, Virginia Woolf, hingga Gabriel García Márquez.
                  </p>
                </button>
                <button className="text-left p-4 rounded-lg bg-primary-fixed/40 transition-all duration-200 cursor-pointer shadow-sm group">
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-primary">Esai & Kritik Budaya</span>
                    <span className="material-symbols-outlined text-[18px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2">
                    Eksplorasi gagasan kritis, seni, masyarakat, serta pemikiran kontemporer mendalam.
                  </p>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-on-surface">Ritme Membaca Harian</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Waktu tenang yang Anda luangkan tanpa interupsi layar lain.</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors text-center cursor-pointer">
                  <span className="text-xl font-semibold text-on-surface">15 mnt</span>
                  <span className="text-xs text-on-surface-variant mt-1">Selingan Tenang</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-primary-fixed/40 transition-colors text-center cursor-pointer shadow-sm">
                  <span className="text-xl font-semibold text-primary">30 mnt</span>
                  <span className="text-xs text-primary font-medium mt-1">Kontemplasi Ideal</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors text-center cursor-pointer">
                  <span className="text-xl font-semibold text-on-surface">1+ jam</span>
                  <span className="text-xs text-on-surface-variant mt-1">Riset & Tenggelam</span>
                </button>
              </div>
            </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link className="text-sm text-on-surface-variant hover:text-on-surface transition-colors py-2 px-1" href="/">
              Lewati untuk sekarang
            </Link>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Link href="/" className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-container text-on-primary text-sm font-medium rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all duration-200 hover:shadow-md">
                <span>Simpan & Lanjut ke Beranda</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative overflow-hidden rounded-xl shadow-md bg-surface-container-low group">
              <div className="w-full h-80 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.02]" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBzFEX1IGqIA6jZKz8sJw5a1epSjuzyTa4nSYbjpVCL1I4jI9EIq9YpIMC68GK5AamgUd9k87auwa-YtYYka6bhT4BvS-asi7UjRBzyqZ6KGxtIGD-siv7-35xvb5pA9eHB8iuIribXXus7bbANYJnmnGF7-9fSplbCg1SoRAa84odHAZYZYhiLbRnJDMhz3t3e6-zTj4CjwVCVY5-qhWLupOMp764x70PeK0xJquc')"}}>
              </div>
              <div className="absolute bottom-3 left-3 right-3 bg-surface/90 backdrop-blur-sm px-4 py-2.5 rounded-lg flex items-center justify-between">
                <span className="text-xs tracking-wide uppercase font-semibold text-on-surface">Suasana Baca #04</span>
                <span className="text-xs italic text-on-surface-variant">Cahaya Pagi & Hening</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
