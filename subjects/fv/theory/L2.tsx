'use client';

import { Frac } from '@/components/Frac';
import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L2() {
  return (
    <div className="theory">
      <p>Every model in this lecture is the same equation, value equals discounted expected cash flows, applied to a different cash flow. Choosing the model means choosing whose cash flow you value and at which rate.</p>

      <h2 id="choice">Which model, when</h2>
      <ol className="steps">
        <li><div><b>Dividend discount model:</b> mature firms with a stable dividend policy. Useless for firms that do not pay dividends.</div></li>
        <li><div><b>FCFF at the WACC:</b> values the whole firm. Fits capital-intensive firms, growth phases and firms whose leverage will change, because debt repayments do not have to be modelled in the discount rate.</div></li>
        <li><div><b>FCFE at the cost of equity:</b> values equity directly. Fits firms with a stable debt-equity ratio, high or low.</div></li>
      </ol>

      <h2 id="ddm">Dividend discount models</h2>
      <div className="eqline">V<sub>0</sub> = <Frac n={<>D<sub>1</sub></>} d={<>k<sub>e</sub> − g</>} /><span className="up">,</span>&nbsp;&nbsp; g = (1 − payout) × ROE</div>
      <p>The Gordon model needs g below k<sub>e</sub> and, for a perpetuity, no higher than long-run economic growth. Growth is not free: it comes from reinvested earnings, so it only adds value when ROE exceeds k<sub>e</sub>. The two-stage model splits the future into n years of high growth and a stable perpetuity; the H-model lets growth fall linearly over 2H years instead of dropping overnight:</p>
      <div className="eqline">V<sub>0</sub> = <Frac n={<>D<sub>0</sub>(1 + g<sub>L</sub>) + D<sub>0</sub> H (g<sub>S</sub> − g<sub>L</sub>)</>} d={<>k<sub>e</sub> − g<sub>L</sub></>} /></div>

      <Lab title="How sensitive is the Gordon value to growth?" hint="The value explodes as g approaches the cost of equity"
        controls={[
          { key: 'd0', label: 'Dividend just paid (€)', min: 0.5, max: 5, step: 0.1, value: 2, fmt: v => fx(v, 2) },
          { key: 'ke', label: 'Cost of equity', min: 0.06, max: 0.14, step: 0.0025, value: 0.1, fmt: v => pct(v, 2) },
          { key: 'g', label: 'Perpetual growth', min: 0, max: 0.05, step: 0.0025, value: 0.03, fmt: v => pct(v, 2) },
          { key: 'gs', label: 'H-model starting growth', min: 0.04, max: 0.2, step: 0.005, value: 0.08, fmt: v => pct(v, 1) },
          { key: 'h', label: 'H (half the transition, years)', min: 1, max: 10, step: 0.5, value: 5, fmt: v => fx(v, 1) },
        ]}
        caption="The line shows the Gordon value for each growth rate with the chosen dividend and cost of equity. The readout adds the H-model with the same stable growth.">
        {v => {
          const top = Math.max(0.005, v.ke - 0.01);
          const xs = range(0, top, 100);
          const gordon = (g: number) => v.d0 * (1 + g) / (v.ke - g);
          const ok = v.g < v.ke - 0.001;
          const h = ok ? (v.d0 * (1 + v.g) + v.d0 * v.h * (v.gs - v.g)) / (v.ke - v.g) : NaN;
          return {
            plot: <LinePlot x={[0, top]} y={[0, Math.min(250, gordon(top) * 1.05)]} xLabel="Perpetual growth g" yLabel="Value per share (€)" fmtX={t => pct(t, 1)} fmtY={t => fx(t, 0)}
              series={[{ label: 'Gordon value', pts: xs.map(g => [g, gordon(g)]), style: 'strong' }]}
              marker={ok && v.g <= top ? [{ x: v.g, y: gordon(v.g), label: '€' + fx(gordon(v.g), 2) }] : []} />,
            readout: ok
              ? [['Gordon value', '€' + fx(gordon(v.g), 2)], ['H-model value', '€' + fx(h, 2)], ['Growth premium', '€' + fx(h - gordon(v.g), 2)]]
              : [['Gordon value', 'undefined (g ≥ kₑ)']],
          };
        }}
      </Lab>

      <h2 id="fcf">Free cash flows</h2>
      <div className="eqline">FCFF = EBIT(1 − t) + D&amp;A − CapEx − ΔNWC<span className="up">,</span>&nbsp;&nbsp; FCFE ≈ FCFF − I(1 − t) + ΔD</div>
      <p>FCFF is the cash available to all capital providers before any financing flows; FCFE is what is left for shareholders after after-tax interest and net borrowing. Forecast 3–10 years explicitly, then close with a terminal value, discount everything, and bridge to equity:</p>
      <div className="eqline">V<sub>0</sub><sup>F</sup> = <span className="up">Σ</span> <Frac n={<>FCFF<sub>t</sub></>} d={<>(1 + WACC)<sup>t</sup></>} /> + <Frac n={<>FCFF<sub>T</sub>(1 + g)</>} d="WACC − g" /><span className="up">·</span><Frac n="1" d={<>(1 + WACC)<sup>T</sup></>} /><span className="up">,</span>&nbsp;&nbsp; E = V<sup>F</sup> − D + Cash</div>

      <Lab title="How much of a DCF is the terminal value?" hint="Five years of FCFF growing at 6%, then perpetual growth"
        controls={[
          { key: 'w', label: 'WACC', min: 0.05, max: 0.12, step: 0.0025, value: 0.08, fmt: v => pct(v, 2) },
          { key: 'g', label: 'Terminal growth', min: 0, max: 0.04, step: 0.0025, value: 0.02, fmt: v => pct(v, 2) },
        ]}
        caption="Firm value per €100 of FCFF in year 1. The terminal value usually carries most of the value, which is why its growth rate and WACC matter more than any single forecast year.">
        {v => {
          const f = Array.from({ length: 5 }, (_, i) => 100 * Math.pow(1.06, i));
          const exp = f.reduce((s, x, i) => s + x / Math.pow(1 + v.w, i + 1), 0);
          const tvAt = (w: number) => f[4] * (1 + v.g) / (w - v.g) / Math.pow(1 + w, 5);
          const ok = v.w - v.g > 0.005;
          const ws = range(v.g + 0.01, 0.12, 100);
          const share = (w: number) => { const e = f.reduce((s, x, i) => s + x / Math.pow(1 + w, i + 1), 0); const t = tvAt(w); return t / (e + t); };
          return {
            plot: <LinePlot x={[v.g + 0.01, 0.12]} y={[0, 1]} xLabel="WACC" yLabel="Share of firm value from the TV" fmtX={t => pct(t, 1)} fmtY={t => pct(t, 0)}
              series={[{ label: 'TV share', pts: ws.map(w => [w, share(w)]), style: 'strong' }]}
              marker={ok && v.w >= v.g + 0.01 ? [{ x: v.w, y: share(v.w), label: pct(share(v.w), 0) }] : []} />,
            readout: ok
              ? [['PV years 1–5', fx(exp, 1)], ['PV terminal value', fx(tvAt(v.w), 1)], ['Firm value', fx(exp + tvAt(v.w), 1)], ['TV share', pct(tvAt(v.w) / (exp + tvAt(v.w)), 1)]]
              : [['Firm value', 'undefined (g ≥ WACC)']],
          };
        }}
      </Lab>

      <h2>Worked example: H-model (class 2, Q2)</h2>
      <p>D<sub>0</sub> = €2, growth falls linearly from 8% to 3% over 10 years (H = 5), k<sub>e</sub> = 10%.</p>
      <ol className="steps">
        <li><div>Stable part: 2 × 1.03 / 0.07 = €29.43.</div></li>
        <li><div>Growth premium: 2 × 5 × 0.05 / 0.07 = €7.14. Value: €36.57.</div></li>
      </ol>

      <h2>Worked example: deferred taxes and preferred stock (class 2, Q3)</h2>
      <p>With an effective tax rate below the marginal rate, the deferred tax liability grows each year by EBIT × (t<sub>marginal</sub> − t<sub>effective</sub>). When it reverses, the firm pays it in cash, so its present value is subtracted from firm value. In Q3: PV of FCFF £450.59m + PV of TV £592.69m − PV of deferred tax payments £111.61m = firm value £931.68m; minus debt £284m and preferred stock 25 / 0.14 = £178.57m gives common equity of £469.11m.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Matching rate and flow</b>FCFF goes with the WACC, FCFE with the cost of equity. Mixing them values the wrong claim.</div>
      <div className="pitfall"><b>D₁, not D₀</b>The Gordon numerator is next year’s dividend. With D<sub>0</sub> given, multiply by (1 + g) first.</div>
      <div className="pitfall"><b>Timing of the TV</b>A terminal value at the end of year T is discounted T years, not T + 1.</div>
      <div className="pitfall"><b>Growth without value</b>Higher retention raises growth but lowers dividends; the price rises only if ROE &gt; k<sub>e</sub>.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="2" />
    </div>
  );
}
