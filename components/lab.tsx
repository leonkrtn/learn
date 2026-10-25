'use client';

import { useState, type ReactNode } from 'react';

export type Control = { key: string; label: string; min: number; max: number; step: number; value: number; fmt?: (x: number) => string };

/** Interactive panel: sliders on the left, live readout below them, plot on the right. */
export function Lab({ title, hint, controls, children, caption }: {
  title: string;
  hint?: string;
  controls: Control[];
  children: (v: Record<string, number>) => { plot: ReactNode; readout: [string, string][] };
  caption?: string;
}) {
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(controls.map(c => [c.key, c.value])));
  const out = children(vals);
  return (
    <div className="lab">
      <div className="labhead"><b>{title}</b>{hint && <span>{hint}</span>}</div>
      <div className="labbody">
        <div className="controls">
          {controls.map(c => (
            <label key={c.key}>
              <div className="lv"><span>{c.label}</span><b>{(c.fmt || String)(vals[c.key])}</b></div>
              <input type="range" min={c.min} max={c.max} step={c.step} value={vals[c.key]}
                onChange={e => setVals(v => ({ ...v, [c.key]: +e.target.value }))} />
            </label>
          ))}
          <dl className="readout">
            {out.readout.map(([k, v]) => <FragmentPair key={k} k={k} v={v} />)}
          </dl>
        </div>
        <div className="plot">{out.plot}</div>
      </div>
      {caption && <div className="caption">{caption}</div>}
    </div>
  );
}

function FragmentPair({ k, v }: { k: string; v: string }) {
  return <><dt>{k}</dt><dd>{v}</dd></>;
}

export type Series = { label: string; pts: [number, number][]; style?: 'strong' | 'soft' | 'dash' };

const STROKE = { strong: '#111111', soft: '#8a8a8a', dash: '#111111' } as const;

/** Line plot for explanations: one ink, one gray, one dashed series at most; ends labelled directly. */
export function LinePlot({ series, x, y: yIn, xLabel, yLabel, marker, vline, fmtX = String, fmtY = String, height = 300 }: {
  series: Series[];
  x: [number, number];
  y: [number, number];
  xLabel: string;
  yLabel: string;
  marker?: { x: number; y: number; label?: string }[];
  vline?: { x: number; label: string };
  fmtX?: (v: number) => string;
  fmtY?: (v: number) => string;
  height?: number;
}) {
  let y = yIn;
  const W = 540, H = height, L = 50, R = 104, T = 16, B = 44;
  const yt = niceTicks(y[0], y[1], 5);
  y = [yt[0], yt[yt.length - 1]];
  const xt = niceTicks(x[0], x[1], 6).filter(t => t >= x[0] - 1e-9 && t <= x[1] + 1e-9);
  // Coordinates are rounded so server and browser render identical markup.
  const sx = (v: number) => Math.round((L + (v - x[0]) / (x[1] - x[0]) * (W - L - R)) * 10) / 10;
  const sy = (v: number) => Math.round((T + (1 - (v - y[0]) / (y[1] - y[0])) * (H - T - B)) * 10) / 10;
  const clampY = (v: number) => Math.min(y[1], Math.max(y[0], v));
  const inY = (v: number) => v >= y[0] - 1e-9 && v <= y[1] + 1e-9;
  const clipId = 'clip' + Math.round(W * H + x[1] * 7 + y[1] * 13);
  // Spread end labels so they never overlap.
  // Labels sit at the last point inside the plot; a curve leaving through the top is labelled where it exits.
  const ends = series.map(s => { const inside = s.pts.filter(p => inY(p[1])); const p = inside[inside.length - 1] || s.pts[s.pts.length - 1]; return { s, y: sy(clampY(p[1])), x: sx(p[0]) }; }).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 16) ends[i].y = ends[i - 1].y + 16;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={yLabel + ' against ' + xLabel}>
      {yt.map(t => (
        <g key={'y' + t}>
          <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="#ececea" />
          <text x={L - 8} y={sy(t) + 4} textAnchor="end" fontSize="12" fill="#5f5f5f">{fmtY(t)}</text>
        </g>
      ))}
      {xt.map(t => (
        <text key={'x' + t} x={sx(t)} y={H - B + 18} textAnchor="middle" fontSize="12" fill="#5f5f5f">{fmtX(t)}</text>
      ))}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="#111" />
      <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" fontSize="12.5" fill="#3a3a3a">{xLabel}</text>
      <text x={14} y={T + (H - T - B) / 2} textAnchor="middle" fontSize="12.5" fill="#3a3a3a" transform={`rotate(-90 14 ${T + (H - T - B) / 2})`}>{yLabel}</text>
      {vline && (
        <g>
          <line x1={sx(vline.x)} x2={sx(vline.x)} y1={T} y2={H - B} stroke="#111" strokeDasharray="2 4" />
          <text x={sx(vline.x) + 6} y={T + 12} fontSize="12" fill="#111">{vline.label}</text>
        </g>
      )}
      <defs><clipPath id={clipId}><rect x={L} y={T - 2} width={W - L - R} height={H - T - B + 4} /></clipPath></defs>
      {series.map(s => (
        <polyline key={s.label} clipPath={`url(#${clipId})`} fill="none" stroke={STROKE[s.style || 'strong']} strokeWidth={2}
          strokeDasharray={s.style === 'dash' ? '6 5' : undefined} strokeLinejoin="round"
          points={s.pts.map(([a, b]) => sx(a).toFixed(1) + ',' + sy(Math.min(y[1] + (y[1] - y[0]), Math.max(y[0] - (y[1] - y[0]), b))).toFixed(1)).join(' ')} />
      ))}
      {ends.map(({ s, y: ly, x: lx }) => (
        <text key={'l' + s.label} x={lx >= W - R - 1 ? W - R + 8 : lx + 8} y={lx >= W - R - 1 ? ly + 4 : ly + 14} fontSize="12.5" fill="#111">{s.label}</text>
      ))}
      {marker?.map((m, i) => (
        <g key={i}>
          <circle cx={sx(m.x)} cy={sy(clampY(m.y))} r={5} fill="#111" stroke="#fff" strokeWidth={2} />
          {m.label && <text x={sx(m.x) + 9} y={sy(clampY(m.y)) - 9} fontSize="12" fill="#111">{m.label}</text>}
        </g>
      ))}
    </svg>
  );
}

/** Round tick values (1, 2, 2.5, 5 × 10^k) covering [a, b]. */
export function niceTicks(a: number, b: number, count: number): number[] {
  const raw = (b - a) / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || 10 * mag;
  const lo = Math.floor(a / step + 1e-9) * step, hi = Math.ceil(b / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v / step) * step);
  return out;
}

export const pct = (x: number, d = 1) => (x * 100).toFixed(d) + '%';
export const fx = (x: number, d = 2) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export const range = (a: number, b: number, n = 120) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
