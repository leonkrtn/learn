'use client';

import { Lab, fx, pct } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

/** Ownership before and after the round: one stacked bar per row, holders labelled directly. */
function OwnershipBars({ rows }: { rows: { title: string; parts: [string, number][] }[] }) {
  const W = 520, rowH = 116, gap = 2;
  const fills: Record<string, string> = { Founder: '#111111', Angels: '#8a8a8a', VC: '#cfcfca' };
  return (
    <svg viewBox={`0 0 ${W} ${rows.length * rowH + 8}`} role="img" aria-label="Ownership before and after the round">
      {rows.map((r, k) => {
        const total = r.parts.reduce((s, p) => s + p[1], 0);
        let x = 0;
        const y0 = k * rowH + 18;
        return (
          <g key={r.title}>
            <text x={0} y={y0 - 4} fontSize="14" fontWeight={600} fill="#111">{r.title}</text>
            {r.parts.map(([label, v]) => {
              const w = Math.round(Math.max(0, v / total * W - gap) * 10) / 10;
              const g = (
                <g key={label}>
                  <rect x={x} y={y0 + 6} width={w} height={40} fill={fills[label] || '#111'} />
                  {w > 44 && <text x={x} y={y0 + 66} fontSize="13" fill="#111">{label}</text>}
                  {w > 44 && <text x={x} y={y0 + 84} fontSize="13" fill="#5f5f5f">{pct(v / total, 1)}</text>}
                </g>
              );
              x += w + gap;
              return g;
            })}
          </g>
        );
      })}
    </svg>
  );
}

export default function L6() {
  return (
    <div className="theory">
      <p>Young firms raise equity in rounds, each at a new price. Almost every number the exam asks for follows from one rule: a round sells new shares at a single price per share, and that price values the old shares too.</p>

      <h2 id="rounds">The argument in four steps</h2>
      <ol className="steps">
        <li><div>Price per share = amount invested / new shares issued.</div></li>
        <li><div>Pre-money valuation = old shares × price. Post-money = (old + new shares) × price = pre-money + investment.</div></li>
        <li><div>If the investor must own a fraction s after the round: total shares = old / (1 − s), new shares = total − old.</div></li>
        <li><div>Every later round dilutes earlier holders in percentage terms, but the value of their stake rises whenever the round price is higher.</div></li>
      </ol>

      <Lab title="A venture capital round" hint="Change the terms and read the dilution"
        controls={[
          { key: 'f', label: 'Founder shares (million)', min: 1, max: 10, step: 0.5, value: 4, fmt: v => fx(v, 1) },
          { key: 'a', label: 'Angel shares (million)', min: 0, max: 5, step: 0.25, value: 1, fmt: v => fx(v, 2) },
          { key: 'inv', label: 'VC investment (€m)', min: 0.5, max: 20, step: 0.5, value: 5, fmt: v => fx(v, 1) },
          { key: 'pre', label: 'Pre-money valuation (€m)', min: 1, max: 60, step: 0.5, value: 15, fmt: v => fx(v, 1) },
        ]}
        caption="Shares outstanding before and after the round. The shading only separates holders; each segment carries its own label.">
        {v => {
          const old = v.f + v.a, price = v.pre / old, nv = v.inv / price;
          const before: [string, number][] = [['Founder', v.f], ...(v.a > 0 ? [['Angels', v.a] as [string, number]] : [])];
          return {
            plot: <OwnershipBars rows={[{ title: 'Before the round', parts: before }, { title: 'After the round', parts: [...before, ['VC', nv]] }]} />,
            readout: [['Founder shares', fx(v.f, 2) + 'm'], ['Price per share', '€' + fx(price, 3)], ['New shares', fx(nv, 3) + 'm'], ['Post-money', '€' + fx(v.pre + v.inv, 1) + 'm'], ['VC stake', pct(v.inv / (v.pre + v.inv), 1)], ['Founder stake value', '€' + fx(v.f * price, 2) + 'm']],
          };
        }}
      </Lab>

      <h2 id="spac">SPAC mergers</h2>
      <ol className="steps">
        <li><div>The SPAC sells units at €10 (one share plus a fraction of a warrant, strike €11.50). The sponsor gets a promote of 20% of SPAC ownership, i.e. a quarter of the public shares, if a deal closes.</div></li>
        <li><div>Before the merger, holders may redeem for €10 and keep their warrants. PIPE investors add cash at a fixed price.</div></li>
        <li><div>Cash at close = €10 × remaining public shares + PIPE − fees. Cashless warrant exercise adds W × (P − K)/P shares.</div></li>
        <li><div>Effective IPO price = gross cash raised / all shares issued to non-target holders (public, sponsor, PIPE, warrant shares). The promote and warrants are why it lands well below €10.</div></li>
      </ol>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Pre vs. post</b>Pre-money never includes the new shares. Post-money = pre-money + new cash.</div>
      <div className="pitfall"><b>Promote base</b>20% of the SPAC after the promote, so the sponsor gets public shares / 4, not 20% of them.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="6" />
    </div>
  );
}
