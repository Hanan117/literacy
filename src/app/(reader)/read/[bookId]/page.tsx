"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Bookmark, Settings, Cloud, ArrowLeft } from "lucide-react";

export default function ReaderPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [showBars, setShowBars] = useState(true);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowBars(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowBars(false), 3000);
    };
    window.addEventListener("mousemove", handleMouseMove);
    timeout = setTimeout(() => setShowBars(false), 3000);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className={`h-screen w-full overflow-hidden relative ${isDark ? "bg-[#0A0A0A]" : "bg-[#f5f5f5]"}`}>
      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 z-50 transition-transform duration-300 ${showBars ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="flex items-center justify-between px-6 py-3 bg-black/80 backdrop-blur-md text-white">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-medium">Filosofi Teras</h2>
              <p className="text-xs text-white/60">Henry Manampiring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
              <Cloud className="w-4 h-4" />
              <span>Tersimpan</span>
            </div>
            <button onClick={() => setIsDark(!isDark)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Canvas Area */}
      <div className="h-full w-full flex items-center justify-center">
        <div className="relative max-h-full max-w-full shadow-2xl">
          <div className={`w-[600px] h-[800px] ${isDark ? "bg-white invert" : "bg-white"} flex items-center justify-center`}>
            <span className="text-black text-sm">Halaman {currentPage}</span>
          </div>
        </div>
      </div>

      {/* Invisible Zones for navigation */}
      <div className="absolute left-0 top-0 w-[15%] h-full cursor-w-resize z-40" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}></div>
      <div className="absolute right-0 top-0 w-[15%] h-full cursor-e-resize z-40" onClick={() => setCurrentPage(currentPage + 1)}></div>

      {/* Bottom Bar */}
      <div className={`absolute bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${showBars ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex justify-center pb-6">
          <div className="flex items-center gap-4 px-6 py-3 bg-black/80 backdrop-blur-md rounded-full text-white shadow-lg">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <input type="range" min="1" max="320" value={currentPage} onChange={(e) => setCurrentPage(Number(e.target.value))} className="w-48" />
              <span className="text-sm whitespace-nowrap">Hal {currentPage} dari 320</span>
            </div>
            <button onClick={() => setCurrentPage(currentPage + 1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
