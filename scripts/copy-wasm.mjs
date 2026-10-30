// Copies browser builds into public/vendor: sql.js for the Anki importer, the pdf.js worker for the slide viewer.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

mkdirSync('public/vendor', { recursive: true });
const dir = 'node_modules/sql.js/dist/';
if (existsSync(dir + 'sql-wasm.wasm')) {
  for (const f of ['sql-wasm.wasm', 'sql-wasm.js']) copyFileSync(dir + f, 'public/vendor/' + f);
}
const pdf = 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs';
if (existsSync(pdf)) copyFileSync(pdf, 'public/vendor/pdf.worker.min.mjs');
