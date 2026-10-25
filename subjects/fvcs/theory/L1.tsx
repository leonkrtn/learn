'use client';

import { Frac } from '@/components/Frac';
import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L1() {
  return (
    <div className="theory">
      <p>Modigliani and Miller ask one question: if markets are perfect, can the way a firm splits its cash flows between lenders and shareholders change what the firm is worth? The answer is no, and almost every exam question in this lecture is a consequence of that answer combined with one bookkeeping identity.</p>

      <h2 id="mm1">The argument in five steps</h2>
      <ol className="steps">
        <li><div>The firm’s assets produce a stream of free cash flows. Debt and equity are claims on that same stream; the capital structure only decides who gets which slice.</div></li>
        <li><div>In a perfect market (no taxes, no distress costs, no information or agency problems, equal borrowing rates) investors can rebuild any slicing themselves. Borrowing personally to buy unlevered equity copies levered equity; buying debt and equity in proportion to their values copies the unlevered firm. This is <b>homemade leverage</b>.</div></li>
        <li><div>Because investors can copy any structure at zero cost, no structure can trade at a premium. <b>MM I:</b> V<sub>L</sub> = E + D = V<sub>U</sub>.</div></li>
        <li><div>Debt has a fixed claim, so leverage concentrates all the asset risk on fewer euros of equity. The return on the whole firm is a weighted average of its parts; solve that for r<sub>E</sub> and you get <b>MM II</b>.</div></li>
        <li><div>The WACC is that weighted average, so it equals r<sub>U</sub> no matter how much debt the firm has. Cheaper debt is offset exactly by more expensive equity.</div></li>
      </ol>

      <h2 id="mm2">Formulas</h2>
      <div className="eqline">r<sub>U</sub> = <Frac n="E" d="E + D" /> r<sub>E</sub> + <Frac n="D" d="E + D" /> r<sub>D</sub> <span className="up">⇔</span> r<sub>E</sub> = r<sub>U</sub> + <Frac n="D" d="E" />(r<sub>U</sub> − r<sub>D</sub>)</div>
      <div className="eqline">β<sub>U</sub> = <Frac n="E" d="E + D" /> β<sub>E</sub> + <Frac n="D" d="E + D" /> β<sub>D</sub> <span className="up">⇔</span> β<sub>E</sub> = β<sub>U</sub> + <Frac n="D" d="E" />(β<sub>U</sub> − β<sub>D</sub>)</div>
      <p>The beta version has exactly the same shape because CAPM is linear in beta. Use the left form to unlever (find the asset risk), the right form to relever at a new D/E.</p>

      <Lab title="MM II: what leverage does to the cost of capital" hint="Move D/E and watch which line moves"
        controls={[
          { key: 'de', label: 'Debt-equity ratio D/E', min: 0, max: 3, step: 0.05, value: 1, fmt: v => fx(v) },
          { key: 'ru', label: 'Unlevered cost of capital', min: 0.06, max: 0.14, step: 0.0025, value: 0.1, fmt: v => pct(v, 2) },
          { key: 'rd', label: 'Cost of debt at low leverage', min: 0.02, max: 0.06, step: 0.0025, value: 0.04, fmt: v => pct(v, 2) },
          { key: 'risky', label: 'Debt becomes risky above D/E', min: 0.5, max: 3, step: 0.25, value: 1.5, fmt: v => fx(v) },
        ]}
        caption="Above the chosen D/E the debt starts carrying risk and its cost rises; the cost of equity then rises more slowly, but the WACC stays flat. That is MM II with risky debt.">
        {v => {
          // Risky debt: r_D rises at a decreasing rate, which keeps r_E increasing in D/E.
          const rdc = (de: number) => v.rd + 0.3 * (v.ru - v.rd) * (1 - Math.exp(-Math.max(0, de - v.risky)));
          const re = (de: number) => v.ru + de * (v.ru - rdc(de));
          const xs = range(0, 3);
          return {
            plot: <LinePlot x={[0, 3]} y={[0, 0.4]} xLabel="Debt-equity ratio" yLabel="Cost of capital" fmtY={t => pct(t, 0)} fmtX={t => fx(t, 1)}
              series={[
                { label: 'cost of equity', pts: xs.map(x => [x, re(x)]), style: 'strong' },
                { label: 'WACC', pts: xs.map(x => [x, v.ru]), style: 'dash' },
                { label: 'cost of debt', pts: xs.map(x => [x, rdc(x)]), style: 'soft' },
              ]}
              marker={[{ x: v.de, y: re(v.de), label: pct(re(v.de)) }]} />,
            readout: [['Cost of equity', pct(re(v.de), 2)], ['Cost of debt', pct(rdc(v.de), 2)], ['WACC', pct(v.ru, 2)], ['D/(D+E)', pct(v.de / (1 + v.de))]],
          };
        }}
      </Lab>

      <h2>Worked example: leveraged recap</h2>
      <p>An all-equity firm has 50 million shares at €20 (V = €1,000m), r<sub>U</sub> = 10%. It borrows €400m at 4% and buys back shares.</p>
      <ol className="steps">
        <li><div>Price stays at €20 (MM I: firm value unchanged, and the buyback is at a fair price). Shares repurchased: 400 / 20 = 20 million.</div></li>
        <li><div>Equity after: 1,000 − 400 = €600m, so D/E = 400 / 600 = 0.667.</div></li>
        <li><div>r<sub>E</sub> = 10% + 0.667 × (10% − 4%) = 14%. WACC = 0.6 × 14% + 0.4 × 4% = 10%.</div></li>
      </ol>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>WACC falls</b>Substituting cheap debt for equity does not lower the WACC in a perfect market. If your WACC moved, you forgot to raise r<sub>E</sub>.</div>
      <div className="pitfall"><b>EPS and price</b>Expected EPS can rise after a recap while the price stays put: EPS got riskier, so the required return rose by the same amount.</div>
      <div className="pitfall"><b>Book values</b>Every ratio in MM II is in market values. D/E from the balance sheet is the wrong input.</div>
      <div className="pitfall"><b>Risky debt</b>MM I holds with risky debt too. Risky debt only changes r<sub>D</sub> (and β<sub>D</sub>) inside MM II.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="1" />
    </div>
  );
}
