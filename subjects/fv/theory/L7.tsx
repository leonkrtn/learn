'use client';

import { Frac } from '@/components/Frac';
import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L7() {
  return (
    <div className="theory">
      <p>Relative valuation prices an asset from what the market pays for similar assets. It is fast, needs fewer assumptions than a DCF and reflects current sentiment, which is both its strength and its weakness: if a whole sector is mispriced, so is the comparison.</p>

      <h2 id="steps">Four steps</h2>
      <ol className="steps">
        <li><div><b>Define the multiple</b> consistently: equity value over equity measures (P/E, P/BV, P/FCFE) or enterprise value over firm measures (EV/EBITDA, EV/EBIT, EV/Sales, EV/FCFF). Price/EBITDA mixes the two and is not valid. Choose current, trailing, forward or normalised earnings with the cycle in mind.</div></li>
        <li><div><b>Describe the distribution</b> across peers: multiples are skewed with extreme outliers (mean P/E far above the median), and negative earnings make P/E meaningless.</div></li>
        <li><div><b>Analyse the drivers:</b> growth raises multiples, risk lowers them, profitability (ROE, margins) supports them.</div></li>
        <li><div><b>Apply</b> the median or mean of comparable firms to the target, adjust for differences, and cross-check with a DCF.</div></li>
      </ol>

      <h2 id="fundamentals">Multiples from fundamentals</h2>
      <div className="eqline">P/E = payout × <Frac n="1 + g" d="r − g" /><span className="up">,</span>&nbsp;&nbsp; P/BV = ROE × payout × <Frac n="1 + g" d="r − g" /><span className="up">,</span>&nbsp;&nbsp; PEG = <Frac n="P/E" d="expected growth" /></div>
      <p>The same firm can therefore have a low P/E and a high P/B: a high ROE with a high cost of equity or low growth. A PEG around 1 is often read as fair, but the PEG still depends on risk and payout. From a two-stage DCF, PEG = payout(1 + g)[1 − (1 + g)<sup>n</sup>/(1 + r)<sup>n</sup>] / [g(r − g)].</p>
      <div className="eqline">EV = E + D (− cash)<span className="up">,</span>&nbsp;&nbsp; <Frac n="EV" d="EBITDA" /> is less affected by leverage than P/E; EV = <Frac n={<>FCFF<sub>1</sub></>} d="WACC − g" /></div>

      <Lab title="Which P/E do the fundamentals justify?" hint="Stable growth funded by retention at a given ROE"
        controls={[
          { key: 'r', label: 'Cost of equity', min: 0.06, max: 0.14, step: 0.0025, value: 0.1, fmt: v => pct(v, 2) },
          { key: 'roe', label: 'Return on equity', min: 0.06, max: 0.3, step: 0.005, value: 0.12, fmt: v => pct(v, 1) },
          { key: 'g', label: 'Growth', min: 0, max: 0.08, step: 0.0025, value: 0.048, fmt: v => pct(v, 2) },
        ]}
        caption="Payout = 1 − g / ROE: faster growth needs more retention. With ROE above the cost of equity, more growth raises the justified P/E; with ROE below it, growth destroys value and the P/E falls.">
        {v => {
          const top = Math.min(v.r - 0.005, v.roe * 0.95, 0.09), xs = range(0, top, 80);
          const pe = (g: number) => (1 - g / v.roe) * (1 + g) / (v.r - g);
          const ok = v.g < v.r - 0.001 && v.g < v.roe;
          return {
            plot: <LinePlot x={[0, top]} y={[0, Math.min(60, Math.max(...xs.map(pe)) * 1.1)]} xLabel="Growth" yLabel="Justified trailing P/E" fmtX={x => pct(x, 1)} fmtY={y => fx(y, 0)}
              series={[{ label: 'P/E', pts: xs.map(g => [g, pe(g)]), style: 'strong' }]}
              marker={ok && v.g <= top ? [{ x: v.g, y: pe(v.g), label: fx(pe(v.g), 1) }] : []} />,
            readout: ok
              ? [['Payout', pct(1 - v.g / v.roe, 1)], ['Trailing P/E', fx(pe(v.g), 2)], ['PEG', v.g > 0 ? fx(pe(v.g) / (v.g * 100), 2) : '—'], ['P/BV', fx(v.roe * pe(v.g), 2)]]
              : [['P/E', 'undefined (g too high)']],
          };
        }}
      </Lab>

      <h2 id="young">Young and loss-making firms</h2>
      <p>With negative earnings, value the firm at a future date when it looks like healthy peers: project revenues and margins, apply an exit multiple, discount back, add cash and subtract debt, and weight by the chance of survival. A regression of multiples on fundamentals across the sector (EV/EBITDA = a + b·growth − c·cost of capital − d·tax rate) controls for differences better than a handful of peers.</p>

      <h2>Worked example: peer multiples (extra question 1)</h2>
      <p>EPS $1.65, EBITDA $55.6m, cash $100m, debt $3m, 21m shares; peer averages P/E 15.01 and EV/EBITDA 8.49.</p>
      <ol className="steps">
        <li><div>P/E: 15.01 × 1.65 = $24.77 (range $14.29–$37.32 from P/Es of 8.66 to 22.62).</div></li>
        <li><div>EV = 8.49 × 55.6 = $472.04m; price = (472.04 − 3 + 100) / 21 = $27.10.</div></li>
      </ol>

      <h2>Worked example: exit multiple (extra slides)</h2>
      <p>Revenues $1bn growing 6% for 5 years, EBITDA margin 8% in year 5, EV/EBITDA 6, cost of capital 12%, cash $50m, debt $200m, 12m shares: EBITDA<sub>5</sub> = 107.06, EV<sub>5</sub> = 642.35, today 364.49, equity 214.49, $17.87 per share.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Mismatched multiples</b>Equity value goes with equity measures, enterprise value with firm measures.</div>
      <div className="pitfall"><b>From EV to price</b>Subtract debt, add cash, then divide by shares.</div>
      <div className="pitfall"><b>Cheap is not undervalued</b>A low multiple may reflect high risk or low growth; check the fundamentals.</div>
      <div className="pitfall"><b>Outliers</b>A forward P/E of 5,000 means earnings near zero; leave it out of averages.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="7" />
    </div>
  );
}
