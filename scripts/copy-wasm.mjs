// Copies the sql.js browser build into public/vendor so the Anki importer can load it at runtime.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const dir = 'node_modules/sql.js/dist/';
if (existsSync(dir + 'sql-wasm.wasm')) {
  mkdirSync('public/vendor', { recursive: true });
  for (const f of ['sql-wasm.wasm', 'sql-wasm.js']) copyFileSync(dir + f, 'public/vendor/' + f);
}
