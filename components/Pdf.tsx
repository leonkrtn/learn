'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { openPdf, type PDFDocumentProxy } from '@/lib/pdf';
import { supabaseBrowser } from '@/lib/supabase/client';

/** Opens a slide PDF from the private bucket; ratio is height / width of page 1. */
export function useDeckPdf(path: string) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [ratio, setRatio] = useState(9 / 16);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let alive = true, loaded: PDFDocumentProxy | null = null;
    (async () => {
      const { data, error } = await supabaseBrowser().storage.from('slides').createSignedUrl(path, 3600);
      if (error || !data) throw new Error(error?.message || 'The file could not be opened.');
      loaded = await openPdf(data.signedUrl);
      const vp = (await loaded.getPage(1)).getViewport({ scale: 1 });
      if (!alive) { loaded.destroy(); return; }
      setRatio(vp.height / vp.width); setDoc(loaded);
    })().catch(e => alive && setErr((e as Error).message));
    return () => { alive = false; loaded?.destroy(); };
  }, [path]);
  return { doc, ratio, err };
}

/** One PDF page drawn into a canvas once it scrolls near the viewport, sized to its container. Children are laid over the page. */
export function PdfCanvas({ doc, n, ratio, eager, children }: { doc: PDFDocumentProxy | null; n: number; ratio: number; eager?: boolean; children?: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(!!eager);
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    if (eager) return () => ro.disconnect();
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true); }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, [eager]);

  useEffect(() => {
    if (!doc || !near || !width || !canvas.current) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    doc.getPage(n).then(page => {
      if (cancelled || !canvas.current) return;
      const base = page.getViewport({ scale: 1 });
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const vp = page.getViewport({ scale: (width / base.width) * dpr });
      const c = canvas.current;
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      task = page.render({ canvasContext: c.getContext('2d')!, viewport: vp });
      task.promise.then(() => { if (!cancelled) setReady(true); }, () => {});
    });
    return () => { cancelled = true; task?.cancel(); };
  }, [doc, n, near, width]);

  return (
    <div ref={box} className={'pdfpage' + (ready ? ' ready' : '')} style={{ aspectRatio: String(1 / ratio) }}>
      <canvas ref={canvas} aria-label={`Slide ${n}`} />
      {children}
    </div>
  );
}

/** Sizes its child to the largest box of the given ratio that fits the available space. */
export function Fit({ ratio, children }: { ratio: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(Math.min(e.contentRect.width, e.contentRect.height / ratio))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ratio]);
  return <div ref={box} className="fit"><div style={{ width: w || undefined }}>{children}</div></div>;
}
