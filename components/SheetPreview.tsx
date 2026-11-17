'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Rich from './Rich';

export type SheetItem = { id: string; title: string; body: string };
export type SheetGroup = { key: string; name: string; items: SheetItem[] };

// A4 with 9 mm margins and three 5 mm-spaced columns, as in the print stylesheet.
const MM = 96 / 25.4, PAGE_W = 210, MARGIN = 9, GAP = 5;
const COL = (PAGE_W - 2 * MARGIN - 2 * GAP) / 3, PITCH = COL + GAP;
/** Pages of one sheet: front and back. */
export const SHEET_PAGES = 2;

/** The printed content: title, then one block per lecture with its entries. Shared by the preview and the print layout. */
export function SheetFlow({ title, groups }: { title: string; groups: SheetGroup[] }) {
  return (
    <>
      <div className="cph">{title}</div>
      {groups.map(g => g.items.length ? (
        <section key={g.key}>
          <h3>{g.name}</h3>
          {g.items.map(e => (
            <div key={e.id} className="cpe">
              {e.title && <b>{e.title}</b>}
              {e.body && <Rich text={e.body} />}
            </div>
          ))}
        </section>
      ) : null)}
    </>
  );
}

/** Pages filled by a column flow: index of the column holding the last entry plus how far down it reaches. */
function measure(flow: HTMLElement): number {
  const entries = flow.querySelectorAll('.cpe');
  const last = entries[entries.length - 1] as HTMLElement | undefined;
  if (!last) return 0;
  const fr = flow.getBoundingClientRect(), rects = last.getClientRects(), lr = rects[rects.length - 1];
  if (!lr || !fr.width || !flow.offsetWidth) return 0;
  const scale = fr.width / flow.offsetWidth, pitch = PITCH * MM * scale;
  const col = Math.max(0, Math.floor((lr.left - fr.left + 1) / pitch));
  const fill = Math.min(1, Math.max(0, (lr.bottom - fr.top) / fr.height));
  return (col + fill) / 3;
}

export function fillText(pages: number | null): string {
  if (pages == null) return 'Measuring…';
  if (pages <= SHEET_PAGES + 0.005) return `Fills ${pages.toFixed(1)} of ${SHEET_PAGES} pages`;
  return `Too long: ${pages.toFixed(1)} pages, ${(pages - SHEET_PAGES).toFixed(1)} over`;
}

/** Bar and text: how much of the two-sided sheet the content fills. */
export function FillMeter({ pages }: { pages: number | null }) {
  const over = pages != null && pages > SHEET_PAGES + 0.005;
  return (
    <span className={'fillmeter' + (over ? ' over' : '')} title="One A4 sheet, front and back, at the print size">
      <span className="bar"><span style={{ width: `${Math.min(100, ((pages ?? 0) / SHEET_PAGES) * 100).toFixed(1)}%` }} /></span>
      {fillText(pages)}
    </span>
  );
}

/** A4 pages (front and back) at reduced scale, laid out exactly like the print; reports how many pages the content fills.
 *  `offscreen` keeps it measurable but invisible. */
export default function SheetPreview({ title, groups, onMeasure, offscreen }: {
  title: string; groups: SheetGroup[]; onMeasure?: (pages: number) => void; offscreen?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [pages, setPages] = useState<number | null>(null);
  const report = useRef(onMeasure);
  useEffect(() => { report.current = onMeasure; });

  const run = useCallback(() => {
    const f = flowRef.current; if (!f) return;
    const p = measure(f);
    setPages(p); report.current?.(p);
  }, []);

  useEffect(() => {
    const frame = frameRef.current, flow = flowRef.current;
    if (!frame || !flow) return;
    const fit = () => setScale(frame.clientWidth / (PAGE_W * MM));
    fit();
    const ro = new ResizeObserver(() => { fit(); run(); });
    ro.observe(frame); ro.observe(flow);
    let alive = true;
    document.fonts?.ready.then(() => { if (alive) run(); });
    run();
    return () => { alive = false; ro.disconnect(); };
  }, [run]);

  useEffect(() => { run(); }, [groups, title, run]);

  const shown = offscreen ? 1 : Math.max(SHEET_PAGES, Math.ceil((pages ?? 0) - 0.005));
  return (
    <div className={'a4spread' + (offscreen ? ' a4off' : '')} aria-hidden={offscreen || undefined}>
      {Array.from({ length: shown }, (_, i) => (
        <figure key={i} className={'a4frame' + (i >= SHEET_PAGES ? ' over' : '')}>
          <div className="a4box" ref={i === 0 ? frameRef : undefined}>
            <div className="a4page" style={{ transform: `scale(${scale})` }}>
              <div className="a4clip">
                <div className="a4flow" ref={i === 0 ? flowRef : undefined} style={i ? { transform: `translateX(${-(i * 3 * PITCH).toFixed(3)}mm)` } : undefined}>
                  <SheetFlow title={title} groups={groups} />
                </div>
              </div>
            </div>
          </div>
          <figcaption>{i === 0 ? 'Front' : i === 1 ? 'Back' : `Page ${i + 1}: does not fit`}</figcaption>
        </figure>
      ))}
    </div>
  );
}
