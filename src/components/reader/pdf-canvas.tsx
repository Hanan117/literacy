"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";

type Tone = "paper" | "sepia" | "slate";

type Props = {
  fileUrl: string | null;
  page: number;
  zoom: number;
  tone: Tone;
  onPageCount: (count: number) => void;
  onError: (message: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function PdfCanvas({
  fileUrl,
  page,
  zoom,
  tone,
  onPageCount,
  onError,
  onPrev,
  onNext,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const renderRef = useRef<RenderTask | null>(null);

  const [docReady, setDocReady] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Muat dokumen setiap signed URL berganti.
  useEffect(() => {
    if (!fileUrl) {
      // Reset saat URL dicabut (mis. sebelum percobaan ulang).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDocReady(false);
      return;
    }

    let cancelled = false;
    loadingTaskRef.current?.destroy().catch(() => undefined);
    loadingTaskRef.current = null;
    docRef.current = null;
    setDocReady(false);

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjs.getDocument({
          url: fileUrl,
          withCredentials: false,
        });
        loadingTaskRef.current = loadingTask;
        const doc = await loadingTask.promise;

        if (cancelled) {
          loadingTask.destroy().catch(() => undefined);
          return;
        }

        docRef.current = doc;
        onPageCount(doc.numPages);
        setDocReady(true);
      } catch (error) {
        if (cancelled) return;
        console.error("Gagal memuat PDF", error);
        onError("Berkas PDF gagal dimuat. Coba muat ulang halaman.");
      }
    })();

    return () => {
      cancelled = true;
    };
    // onPageCount/onError sengaja tidak masuk dependency agar dokumen tidak dimuat ulang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  // Pantau lebar area baca agar halaman selalu pas dengan lebar kertas.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(Math.floor(width));
    });
    observer.observe(el);
    setContainerWidth(Math.floor(el.clientWidth));

    return () => observer.disconnect();
  }, []);

  // Render halaman aktif.
  useEffect(() => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!docReady || !doc || !canvas || containerWidth <= 0) return;

    let cancelled = false;
    renderRef.current?.cancel();

    (async () => {
      try {
        setRendering(true);
        const pdfPage = await doc.getPage(page);
        if (cancelled) return;

        const base = pdfPage.getViewport({ scale: 1 });
        // Padding horizontal kertas (px-4 di mobile, lebih besar di desktop).
        const available = Math.max(220, containerWidth);
        const scale = (available / base.width) * zoom;
        const viewport = pdfPage.getViewport({ scale });

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const context = canvas.getContext("2d");
        if (!context) return;

        const task = pdfPage.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0],
        });
        renderRef.current = task;
        await task.promise;
        if (!cancelled) setRendering(false);
      } catch (error) {
        const name = (error as { name?: string })?.name;
        if (name === "RenderingCancelledException") return;
        if (cancelled) return;
        console.error("Gagal merender halaman", error);
        setRendering(false);
        onError("Halaman ini gagal ditampilkan. Coba pindah halaman.");
      }
    })();

    return () => {
      cancelled = true;
      setRendering(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docReady, page, zoom, containerWidth]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex min-h-[320px] w-full justify-center">
        <canvas
          ref={canvasRef}
          aria-label={`Halaman ${page} buku`}
          className={`mx-auto block max-w-none rounded-[2px] bg-white shadow-sm transition-[filter] duration-300 ${
            tone === "slate" ? "filter invert-[0.9] hue-rotate-180" : ""
          } ${tone === "sepia" ? "sepia-[0.22]" : ""} ${
            rendering ? "opacity-70" : "opacity-100"
          }`}
        />

        {!docReady && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-2 text-on-surface-variant">
              <span className="h-8 w-8 animate-spin rounded-[999px] border-2 border-primary/30 border-t-primary" />
              <span className="text-xs">Memuat halaman…</span>
            </div>
          </div>
        )}

        {/* Zona klik kiri/kanan untuk berpindah halaman. */}
        <button
          type="button"
          onClick={onPrev}
          aria-label="Halaman sebelumnya"
          className="absolute inset-y-0 left-0 hidden w-12 cursor-w-resize bg-gradient-to-r from-on-surface/5 to-transparent opacity-0 transition-opacity hover:opacity-100 md:block"
        />
        <button
          type="button"
          onClick={onNext}
          aria-label="Halaman berikutnya"
          className="absolute inset-y-0 right-0 hidden w-12 cursor-e-resize bg-gradient-to-l from-on-surface/5 to-transparent opacity-0 transition-opacity hover:opacity-100 md:block"
        />
      </div>
    </div>
  );
}
