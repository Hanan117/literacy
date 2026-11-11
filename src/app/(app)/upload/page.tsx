export default function UploadPage() {
  return (
    <div className="mx-auto w-full max-w-[860px] px-5 py-8 md:px-8 md:py-10 xl:px-10">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-[999px] bg-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
          Area Kurator
        </span>
      </div>

      <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-on-surface md:text-4xl">
        Upload PDF
      </h1>
      <p className="mt-3 max-w-xl font-serif text-[15px] leading-relaxed text-on-surface-variant">
        Tambahkan koleksi PDF baru ke arsip. Buku yang sudah diunggah dan
        dipublikasikan akan tampil di katalog pembaca.
      </p>

      <div className="mt-8 rounded-2xl border border-dashed border-surface-container-highest bg-surface-container-lowest p-10 text-center shadow-sm">
        <span className="material-symbols-outlined text-[40px] text-primary/60">upload_file</span>
        <h2 className="mt-3 font-serif text-xl text-on-surface">Form unggah segera hadir</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
          Halaman ini sudah dilindungi khusus admin. Form metadata, unggah PDF,
          dan tombol publikasi akan ditambahkan pada tahap berikutnya.
        </p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-tertiary-fixed/60 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          Tahap berikutnya
        </span>
      </div>
    </div>
  );
}
