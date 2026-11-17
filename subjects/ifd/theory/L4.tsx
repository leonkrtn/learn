'use client';

import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L4() {
  return (
    <div className="theory">
      <p>Capital budgeting asks one question: is the project worth more than it costs? Answering it needs the right cash flows, the incremental free cash flows the project would generate if all-equity financed, and the right discount rate, the return on investments with the same systematic risk. Financing enters only afterwards, through APV or the WACC.</p>

      <h2 id="cf">Which cash flows</h2>
      <ol className="steps">
        <li><div><b>Incremental:</b> cash flow with the project minus without it. Leave out sunk costs (a completed study) and allocations that do not change total costs; include opportunity costs (an unused machine’s resale value) and externalities (cannibalised sales).</div></li>
        <li><div><b>Cash, not profit:</b> FCF = EBITDA − τ·EBIT − CapEx − ΔNWC + other. Taxes are on EBIT, as if all-equity financed; interest and dividends are financing flows.</div></li>
        <li><div><b>Working capital:</b> NWC = operating cash + inventory + receivables − payables. An increase is an outflow; NWC is recovered at the end.</div></li>
        <li><div><b>End of the project:</b> after-tax salvage value of the equipment plus NWC recovered, or a continuation value FCF<sub>T+1</sub>/(r − g).</div></li>
      </ol>
      <p>Zero One (2026 statements): NWC 3,500 + 27,500 + 27,000 − 30,000 = 28,000 in 2025 and 34,500 in 2026, ΔNWC = 6,500. τ = 3,000/12,000 = 25%, so unlevered taxes 0.25 × 12,500 = 3,125. CapEx = (26,000 − 21,500) + 2,000 = 6,500. FCF = 14,500 − 3,125 − 6,500 − 6,500 = −1,625.</p>

      <h2 id="rate">Which discount rate</h2>
      <p>The opportunity cost of capital comes from the CAPM: E[R] = r<sub>f</sub> + β(E[R<sub>M</sub>] − r<sub>f</sub>). The beta must be the project’s, not the firm’s: take twin firms in the project’s business, unlever their equity beta (β<sub>U</sub> = E/V β<sub>E</sub> + D/V β<sub>D</sub>) and relever it at the project’s capital structure. Cyclical businesses and high operating leverage mean high betas; volatile but diversifiable cash flows do not.</p>

      <h2 id="apv">APV and WACC</h2>
      <p>APV: value the project unlevered at r<sub>U</sub>, then add the PV of the tax shields τ r<sub>D</sub> D<sub>t−1</sub> and other financing effects. Discount the shields at r<sub>D</sub> if the debt schedule is fixed, at r<sub>U</sub> if debt keeps a constant leverage ratio. Slide example: FCF 12 a year for 5 years, $40m loan repaid 10 a year, r<sub>D</sub> = 6%, r<sub>U</sub> = 12%, τ = 30%: NPV<sup>U</sup> = 3.26, PV(DTS) = 1.61, APV = 4.86. WACC: with a constant leverage ratio, discount FCF at E/V r<sub>E</sub> + D/V r<sub>D</sub>(1 − τ). Carioca: r<sub>U</sub> = 13%, D/V = 40%, r<sub>D</sub> = 7.5%, τ = 30%: WACC = 12.1% and a perpetuity of 24.2 is worth 200; APV gives 24.2/0.13 = 186.15 plus 13.85 of tax shields.</p>

      <Lab title="WACC and cost of equity as leverage rises" hint="Constant leverage ratio, debt priced at a fixed rate"
        controls={[
          { key: 'rU', label: 'Unlevered cost of capital', min: 0.06, max: 0.16, step: 0.005, value: 0.13, fmt: v => pct(v, 1) },
          { key: 'rD', label: 'Cost of debt', min: 0.02, max: 0.1, step: 0.005, value: 0.075, fmt: v => pct(v, 1) },
          { key: 'tau', label: 'Tax rate', min: 0, max: 0.4, step: 0.01, value: 0.3, fmt: v => pct(v, 0) },
          { key: 'C', label: 'Perpetual FCF', min: 5, max: 50, step: 0.1, value: 24.2, fmt: v => fx(v, 1) },
        ]}
        caption="r_E = r_U + D/E (r_U − r_D) rises with leverage; the WACC falls only through the tax shield, r_U − D/V τ r_D.">
        {v => {
          const xs = range(0, 0.7, 140), rE = (w: number) => v.rU + w / (1 - w) * (v.rU - v.rD), wacc = (w: number) => v.rU - w * v.tau * v.rD;
          return {
            plot: <LinePlot x={[0, 0.7]} y={[0, Math.max(0.3, rE(0.7))]} xLabel="Debt-to-value ratio" yLabel="Rate" fmtX={t => pct(t, 0)} fmtY={t => pct(t, 0)}
              series={[{ label: 'cost of equity', pts: xs.map(w => [w, rE(w)]), style: 'dash' }, { label: 'WACC', pts: xs.map(w => [w, wacc(w)]), style: 'strong' }, { label: 'r_U', pts: xs.map(w => [w, v.rU]), style: 'soft' }]} />,
            readout: [['WACC at 40%', pct(wacc(0.4), 2)], ['Value at 40%', fx(v.C / wacc(0.4), 2)], ['Unlevered value', fx(v.C / v.rU, 2)]],
          };
        }}
      </Lab>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Taxes on EBIT</b>Unlevered taxes are τ × EBIT; the interest tax saving belongs to the financing side (APV or WACC), never to the FCF.</div>
      <div className="pitfall"><b>Sign of ΔNWC</b>Subtract increases, add decreases, and recover the NWC at the end of the project.</div>
      <div className="pitfall"><b>The firm’s beta</b>A project in a new business is discounted with the twin firms’ unlevered beta, relevered at the project’s capital structure.</div>
      <div className="pitfall"><b>Rate for the tax shield</b>r<sub>D</sub> for a fixed schedule, r<sub>U</sub> for a constant leverage ratio.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="4" />
    </div>
  );
}
