import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// KaTeX ships every font as woff2 + woff + ttf. Modern browsers only need woff2,
// so drop the fallbacks before the single-file build inlines them.
const katexWoff2Only = {
  name: 'katex-woff2-only',
  enforce: 'pre',
  transform(code, id) {
    if (!/katex(\.min)?\.css/.test(id)) return null;
    return code
      .replace(/,\s*url\([^)]*?\.woff\)\s*format\(["']woff["']\)/g, '')
      .replace(/,\s*url\([^)]*?\.ttf\)\s*format\(["']truetype["']\)/g, '');
  },
};

// `npm run build` emits one self-contained dist/index.html that opens straight
// from disk (double-click), no server or Node needed.
export default defineConfig({
  base: './',
  plugins: [react(), katexWoff2Only, viteSingleFile()],
});
