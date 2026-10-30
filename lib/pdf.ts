'use client';

import type { PDFDocumentProxy } from 'pdfjs-dist';

let lib: Promise<typeof import('pdfjs-dist')> | null = null;

/** pdf.js, loaded on demand in the browser; the worker is copied to public/vendor on install. */
function pdfjs() {
  lib ||= import('pdfjs-dist').then(m => { m.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.mjs'; return m; });
  return lib;
}

export async function openPdf(src: string | ArrayBuffer): Promise<PDFDocumentProxy> {
  const m = await pdfjs();
  return m.getDocument(typeof src === 'string' ? { url: src } : { data: new Uint8Array(src) }).promise;
}

export type { PDFDocumentProxy };
