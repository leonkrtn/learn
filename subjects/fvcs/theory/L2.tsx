'use client';

import { Frac } from '@/components/Frac';
import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L2() {
  return (
    <div className="theory">
      <p>Add one imperfection to the MM world: interest is tax deductible, dividends are not. Now the capital structure changes how much of the operating cash flow leaves the firm as taxes, and that difference is the whole value of debt in this lecture.</p>

      <h2 id="its">The argument in five steps</h2>
      <ol className="steps">
        <li><div>With interest expense, taxable income is EBIT − interest. Taxes fall by τ<sub>c</sub> × interest each year. That saving is the <b>interest tax shield</b>.</div></li>
        <li><div>Total cash to all investors rises by exactly the tax shield: V<sub>L</sub> = V<sub>U</sub> + PV(interest tax shield).</div></li>
        <li><div>The present value depends on the debt policy. Fixed, risk-free payments: discount each year’s τ<sub>c</sub>·interest at r<sub>f</sub> (annuity formula). Permanent debt: τ<sub>c</sub>·r<sub>f</sub>·D / r<sub>f</sub> = τ<sub>c</sub>D.</div></li>
        <li><div>With a target D/E the debt grows with the firm, so the tax shield is as risky as the firm. Discount the FCF at the after-tax WACC instead, and PV(ITS) = V<sub>L</sub> − V<sub>U</sub>.</div></li>
        <li><div>Personal taxes cut into the benefit when interest income is taxed more heavily than equity income. The effective advantage τ* replaces τ<sub>c</sub>.</div></li>
      </ol>

      <h2 id="wacc">Formulas</h2>
      <div className="eqline">r<sub>wacc</sub> = <Frac n="E" d="E + D" /> r<sub>E</sub> + <Frac n="D" d="E + D" /> r<sub>D</sub>(1 − τ<sub>c</sub>) = r<sub>U</sub> − <Frac n="D" d="E + D" /> τ<sub>c</sub> r<sub>D</sub></div>
      <div className="eqline">τ* = 1 − <Frac n={<>(1 − τ<sub>c</sub>)(1 − τ<sub>e</sub>)</>} d={<>1 − τ<sub>i</sub></>} /></div>
      <p>The second form of the WACC holds with a target leverage ratio; it shows the WACC falls linearly with D/V. With τ<sub>i</sub> = τ<sub>e</sub> the personal taxes cancel and τ* = τ<sub>c</sub>.</p>

      <Lab title="Taxes and the WACC" hint="Corporate tax lowers the WACC; personal taxes give part of it back"
        controls={[
          { key: 'tc', label: 'Corporate tax τc', min: 0, max: 0.4, step: 0.01, value: 0.25, fmt: v => pct(v, 0) },
          { key: 'ti', label: 'Tax on interest income τi', min: 0, max: 0.5, step: 0.01, value: 0.3, fmt: v => pct(v, 0) },
          { key: 'te', label: 'Tax on equity income τe', min: 0, max: 0.5, step: 0.01, value: 0.2, fmt: v => pct(v, 0) },
          { key: 'ru', label: 'Unlevered cost of capital', min: 0.06, max: 0.14, step: 0.0025, value: 0.1, fmt: v => pct(v, 2) },
          { key: 'rd', label: 'Cost of debt', min: 0.02, max: 0.07, step: 0.0025, value: 0.05, fmt: v => pct(v, 2) },
        ]}
        caption="Solid: after-tax WACC with the corporate tax only. Dashed: the same using τ* instead of τc. The pretax WACC (gray) stays at the unlevered cost of capital.">
        {v => {
          const ts = 1 - (1 - v.tc) * (1 - v.te) / (1 - v.ti);
          const xs = range(0, 0.8);
          return {
            plot: <LinePlot x={[0, 0.8]} y={[0.05, 0.15]} xLabel="Debt-to-value D/(D+E)" yLabel="WACC" fmtY={t => pct(t, 0)} fmtX={t => pct(t, 0)}
              series={[
                { label: 'pretax', pts: xs.map(d => [d, v.ru]), style: 'soft' },
                { label: 'with τc', pts: xs.map(d => [d, v.ru - d * v.tc * v.rd]), style: 'strong' },
                { label: 'with τ*', pts: xs.map(d => [d, v.ru - d * ts * v.rd]), style: 'dash' },
              ]} />,
            readout: [['τ*', pct(ts, 1)], ['PV(ITS) of €100 permanent debt', '€' + fx(100 * v.tc)], ['… with τ*', '€' + fx(100 * ts)], ['WACC at 50% debt', pct(v.ru - 0.5 * v.tc * v.rd, 2)]],
          };
        }}
      </Lab>

      <h2>Worked example: recap with taxes</h2>
      <p>20 million shares at €15 (V<sub>U</sub> = €300m), τ<sub>c</sub> = 25%. The firm announces it will borrow €100m permanently and buy back shares.</p>
      <ol className="steps">
        <li><div>PV(ITS) = 0.25 × 100 = €25m, so V<sub>L</sub> = €325m.</div></li>
        <li><div>The price jumps at the announcement, before any shares are bought: 325 / 20 = €16.25.</div></li>
        <li><div>Shares repurchased at that price: 100 / 16.25 = 6.15 million. Equity after: 325 − 100 = €225m (13.85m shares × €16.25).</div></li>
      </ol>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Pretax r_D in the WACC</b>FCF ignores the tax shield, so the WACC must carry it: use r<sub>D</sub>(1 − τ<sub>c</sub>).</div>
      <div className="pitfall"><b>Repurchase price</b>Shares are bought back at the post-announcement price, not the old one. Selling shareholders get their part of the tax shield too.</div>
      <div className="pitfall"><b>Principal</b>Repaying principal is not deductible. Only interest enters the tax shield.</div>
      <div className="pitfall"><b>Interest limits</b>Interest above the deductible cap (e.g. 30% of EBIT) creates no shield in that year.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="2" />
    </div>
  );
}
