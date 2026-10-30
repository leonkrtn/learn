'use client';

import { useMemo, useState } from 'react';

export type Day = { day: string; answers: number; correct: number };

const W = 880, H = 260, L = 48, R = 16, T = 14, B = 34;

function fillDays(rows: Day[], span: number): Day[] {
  const map = new Map(rows.map(r => [r.day, r]));
  const out: Day[] = [];
  const end = new Date(); end.setHours(12, 0, 0, 0);
  for (let i = span - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 864e5);
    const key = d.toLocaleDateString('en-CA');
    out.push(map.get(key) || { day: key, answers: 0, correct: 0 });
  }
  return out;
}

const fmtDay = (k: string) => new Date(k + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Accuracy over time (7-day rolling line, daily dots) and answers per day, as two charts on separate axes. */
export default function HistoryChart({ rows }: { rows: Day[] }) {
  const first = rows.length ? rows[0].day : null;
  const span = Math.min(120, Math.max(28, first ? Math.ceil((Date.now() - Date.parse(first + 'T00:00:00')) / 864e5) + 1 : 28));
  const days = useMemo(() => fillDays(rows, span), [rows, span]);
  const rolling = useMemo(() => days.map((_, i) => {
    const w = days.slice(Math.max(0, i - 6), i + 1);
    const a = w.reduce((s, d) => s + d.answers, 0), c = w.reduce((s, d) => s + d.correct, 0);
    return a ? c / a : null;
  }), [days]);
  const [hover, setHover] = useState<number | null>(null);

  const sx = (i: number) => L + (i + 0.5) / days.length * (W - L - R);
  const sy = (v: number) => T + (1 - v) * (H - T - B);
  const maxA = Math.max(10, ...days.map(d => d.answers));
  const niceMax = Math.ceil(maxA / 10) * 10;
  const sb = (v: number) => T + (1 - v / niceMax) * (160 - T - B);
  const step = Math.max(1, Math.round(days.length / 7));
  const bw = Math.max(2, (W - L - R) / days.length - 2);

  let path = '', pen = false;
  rolling.forEach((v, i) => { if (v == null) { pen = false; return; } path += (pen ? 'L' : 'M') + sx(i).toFixed(1) + ' ' + sy(v).toFixed(1); pen = true; });

  const h = hover != null ? days[hover] : null;
  const hit = (i: number) => ({ onMouseEnter: () => setHover(i), onMouseLeave: () => setHover(null) });

  if (!rows.length) return <p className="note">No answers yet. The charts appear after your first practice session.</p>;

  return (
    <div>
      <div className="charttitle">Accuracy</div>
      <p className="chartsub">Line: share of correct answers over the last 7 days. Dots: single days.</p>
      <div className="chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Accuracy by day">
          {[0, 0.25, 0.5, 0.75, 1].map(t => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="#ebeae6" />
              <text x={L - 8} y={sy(t) + 4} textAnchor="end" fontSize="12" fill="#676a75">{t * 100}%</text>
            </g>
          ))}
          <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="#d6d5d0" />
          {days.map((d, i) => i % step === 0 && <text key={'x' + i} x={sx(i)} y={H - B + 18} textAnchor="middle" fontSize="12" fill="#676a75">{fmtDay(d.day)}</text>)}
          {days.map((d, i) => d.answers > 0 && <circle key={'d' + i} cx={sx(i)} cy={sy(d.correct / d.answers)} r={4} fill="#a9bbf3" stroke="#fff" strokeWidth={2} />)}
          <path d={path} fill="none" stroke="#2952e3" strokeWidth={2.5} strokeLinejoin="round" />
          {hover != null && <line x1={sx(hover)} x2={sx(hover)} y1={T} y2={H - B} stroke="#676a75" strokeDasharray="2 3" />}
          {days.map((_, i) => <rect key={'h' + i} x={sx(i) - (W - L - R) / days.length / 2} y={T} width={(W - L - R) / days.length} height={H - T - B} fill="transparent" {...hit(i)} />)}
        </svg>
        {h && hover != null && (
          <div className="tip" style={{ left: (sx(hover) / W * 100) + '%', top: (sy(rolling[hover] ?? (h.answers ? h.correct / h.answers : 0)) / H * 100) + '%' }}>
            {fmtDay(h.day)} · {h.answers ? <><b>{Math.round(100 * h.correct / h.answers)}%</b> of {h.answers}</> : 'no answers'}
            {rolling[hover] != null && <> · 7 days <b>{Math.round(100 * rolling[hover]!)}%</b></>}
          </div>
        )}
      </div>

      <div className="charttitle">Answers per day</div>
      <p className="chartsub">Each sub-question counts as one answer.</p>
      <div className="chart">
        <svg viewBox={`0 0 ${W} 160`} role="img" aria-label="Answers per day">
          {[0, niceMax / 2, niceMax].map(t => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={sb(t)} y2={sb(t)} stroke="#ebeae6" />
              <text x={L - 8} y={sb(t) + 4} textAnchor="end" fontSize="12" fill="#676a75">{t}</text>
            </g>
          ))}
          {days.map((d, i) => d.answers > 0 && (
            <path key={'b' + i} fill={hover === i ? '#1c3aa6' : '#2952e3'}
              d={`M${sx(i) - bw / 2} ${sb(0)} V${sb(d.answers) + 3} q0 -3 3 -3 H${sx(i) + bw / 2 - 3} q3 0 3 3 V${sb(0)} Z`} />
          ))}
          <line x1={L} x2={W - R} y1={sb(0)} y2={sb(0)} stroke="#d6d5d0" />
          {days.map((d, i) => i % step === 0 && <text key={'x' + i} x={sx(i)} y={160 - B + 18} textAnchor="middle" fontSize="12" fill="#676a75">{fmtDay(d.day)}</text>)}
          {days.map((_, i) => <rect key={'h' + i} x={sx(i) - (W - L - R) / days.length / 2} y={T} width={(W - L - R) / days.length} height={160 - T - B} fill="transparent" {...hit(i)} />)}
        </svg>
        {h && hover != null && h.answers > 0 && (
          <div className="tip" style={{ left: (sx(hover) / W * 100) + '%', top: (sb(h.answers) / 160 * 100) + '%' }}>
            {fmtDay(h.day)} · <b>{h.answers}</b> answers, {h.correct} correct
          </div>
        )}
      </div>
    </div>
  );
}
