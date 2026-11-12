// Salin worker PDF.js ke /public agar bisa dilayani sebagai aset statis.
// Dijalankan otomatis lewat `postinstall` setelah dependency terpasang.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const target = resolve(root, "public/pdf.worker.min.mjs");

if (!existsSync(source)) {
  console.warn("[pdf-worker] pdfjs-dist belum terpasang, worker dilewati.");
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log("[pdf-worker] public/pdf.worker.min.mjs siap.");
