'use client';

import { Frac } from '@/components/Frac';
import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L4() {
  return (
    <div className="theory">
      <p>The discount rate has to carry exactly the risk of the cash flows it discounts. That gives four building blocks: a risk-free rate, a price of risk (the equity premium), a measure of the asset’s risk (beta), and the cost of debt, combined in the WACC.</p>

      <h2 id="consistency">Consistency first</h2>
      <ol className="steps">
        <li><div><b>Risk:</b> only systematic (non-diversifiable) risk is rewarded, because the marginal investor is diversified.</div></li>
        <li><div><b>Claim:</b> equity cash flows at the cost of equity, firm cash flows at the WACC.</div></li>
        <li><div><b>Currency and inflation:</b> the rate is in the currency of the cash flows; nominal with nominal, real with real.</div></li>
      </ol>

      <h2 id="rf">Risk-free rate and default spreads</h2>
      <p>Use a long-term default-free government bond in the cash flows’ currency; match the horizon of the valuation. Yield curves are usually upward sloping (inflation and interest-rate risk); an inverted curve signals expected easing or a slowdown. Negative rates can still serve as a base, with care in the premiums. Corporate and sovereign yields add a default spread, estimated from ratings, CDS or bond yields; spreads widen in recessions.</p>

      <h2 id="erp">Equity risk premium</h2>
      <p>A <b>historical premium</b> averages past stock returns minus bills or bonds. It depends on the period, the proxy and the averaging (arithmetic above geometric), and has a large standard error. An <b>implied premium</b> backs the expected return out of today’s index level and expected cash flows:</p>
      <div className="eqline">Index = <span className="up">Σ</span> <Frac n={<>CF<sub>t</sub></>} d={<>(1 + r)<sup>t</sup></>} /> + <Frac n={<>CF<sub>5</sub>(1 + g)</>} d={<>(r − g)(1 + r)<sup>5</sup></>} /><span className="up">,</span>&nbsp;&nbsp; ERP = r − r<sub>f</sub></div>
      <p>With constant growth the equation collapses to r = D<sub>1</sub> / P<sub>0</sub> + g. Example from the lecture: index 1,468.36, cash flows 61.98 … 75.34 over five years, then growth 4.02% → r = 8.39%, implied premium 4.37%.</p>

      <h2 id="beta">Betas</h2>
      <p>A regression of the stock’s excess returns on the market’s gives a <b>levered</b> beta at the leverage of the estimation period, with a large standard error. In the course spreadsheet, slope, intercept (Jensen’s alpha) and R² come from such a regression of monthly excess returns; low-beta stocks tend to show positive alphas. A <b>bottom-up beta</b> is more stable: average the unlevered betas of the firm’s businesses and relever at its own leverage.</p>
      <div className="eqline">β<sub>L</sub> = β<sub>U</sub>(1 + D/E)&nbsp;&nbsp;(debt rebalanced to a constant ratio)<span className="up">,</span>&nbsp;&nbsp; β<sub>L</sub> = β<sub>U</sub>[1 + (1 − t)D/E]&nbsp;&nbsp;(fixed amount of debt)</div>
      <p>With risky debt, β<sub>L</sub> = β<sub>U</sub>[1 + (1 − t)D/E] − β<sub>D</sub>(1 − t)D/E. Higher operating leverage and cyclicality raise the unlevered beta. Cost of equity: CAPM k<sub>e</sub> = r<sub>f</sub> + β(E[R<sub>m</sub>] − r<sub>f</sub>); multi-factor and proxy models add factor betas.</p>
      <p><b>Private firms:</b> an owner who holds only this business bears all of its risk. Scale the market beta by the correlation with the market, β<sub>total</sub> = β<sub>U</sub> / ρ, then relever (lecture 8’s extra question). For an IPO, diversified investors price only market risk, so the ordinary beta applies.</p>

      <Lab title="Leverage, beta and the cost of capital" hint="How D/E moves the equity beta, the cost of equity and the WACC"
        controls={[
          { key: 'bu', label: 'Unlevered beta', min: 0.5, max: 1.6, step: 0.05, value: 1, fmt: v => fx(v, 2) },
          { key: 't', label: 'Tax rate', min: 0, max: 0.4, step: 0.01, value: 0.25, fmt: v => pct(v, 0) },
          { key: 'rf', label: 'Risk-free rate', min: 0.01, max: 0.06, step: 0.0025, value: 0.03, fmt: v => pct(v, 2) },
          { key: 'erp', label: 'Market premium', min: 0.03, max: 0.09, step: 0.0025, value: 0.06, fmt: v => pct(v, 2) },
          { key: 'spr', label: 'Default spread', min: 0, max: 0.05, step: 0.0025, value: 0.015, fmt: v => pct(v, 2) },
          { key: 'de', label: 'D/E', min: 0, max: 2, step: 0.05, value: 0.5, fmt: v => fx(v, 2) },
        ]}
        caption="Blue: levered beta with a fixed amount of debt (with taxes). Gray: with a constant D/E ratio. The readout uses the fixed-debt formula and a cost of debt of rf + spread.">
        {v => {
          const xs = range(0, 2, 80);
          const h = (d: number) => v.bu * (1 + (1 - v.t) * d), n = (d: number) => v.bu * (1 + d);
          const ke = v.rf + h(v.de) * v.erp, kd = v.rf + v.spr, wd = v.de / (1 + v.de), w = (1 - wd) * ke + wd * kd * (1 - v.t);
          return {
            plot: <LinePlot x={[0, 2]} y={[0, Math.max(2, n(2) * 1.05)]} xLabel="Debt-to-equity ratio" yLabel="Equity beta" fmtX={x => fx(x, 1)} fmtY={y => fx(y, 1)}
              series={[{ label: 'Fixed debt', pts: xs.map(d => [d, h(d)]), style: 'strong' }, { label: 'Constant D/E', pts: xs.map(d => [d, n(d)]), style: 'soft' }]}
              marker={[{ x: v.de, y: h(v.de), label: fx(h(v.de), 2) }]} />,
            readout: [['Levered beta', fx(h(v.de), 2)], ['Cost of equity', pct(ke, 2)], ['After-tax cost of debt', pct(kd * (1 - v.t), 2)], ['WACC', pct(w, 2)]],
          };
        }}
      </Lab>

      <h2 id="kd">Cost of debt and WACC</h2>
      <p>Use the yield to maturity of long-term traded bonds; otherwise the rating’s default spread; otherwise a <b>synthetic rating</b> from the interest coverage ratio EBIT / interest. Value book debt like a bond at that rate to get its market value. After tax: k<sub>d</sub>(1 − t). Preferred stock costs its dividend yield; convertibles are split into debt and equity.</p>
      <div className="eqline">WACC = <Frac n="E" d="D + E" /> k<sub>e</sub> + <Frac n="D" d="D + E" /> k<sub>d</sub>(1 − t)</div>

      <h2>Worked example: cost of capital (extra question 1)</h2>
      <p>100m shares at $250; book debt $10bn, 6 years, interest $600m; EBIT $2.5bn (coverage 4.17 → BBB, spread 1%); tax 35%; r<sub>f</sub> 6%; peers’ unlevered beta 0.80; market return 11.5%.</p>
      <ol className="steps">
        <li><div>k<sub>d</sub> = 7%; market value of debt = 600 × (1 − 1.07<sup>−6</sup>)/0.07 + 10,000/1.07<sup>6</sup> = $9,523m.</div></li>
        <li><div>D/E = 0.381; β<sub>L</sub> = 0.80 × (1 + 0.65 × 0.381) = 0.998; k<sub>e</sub> = 6% + 0.998 × 5.5% = 11.49%.</div></li>
        <li><div>WACC = 72.4% × 11.49% + 27.6% × 7% × 0.65 = 9.58%.</div></li>
      </ol>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Regression beta is levered</b>Unlever it at the leverage of the estimation period before relevering.</div>
      <div className="pitfall"><b>Which formula</b>Use the relation the question prescribes: constant D/E or fixed debt. Peers are unlevered at their D/E, the target relevered at its own.</div>
      <div className="pitfall"><b>Premium, not market return</b>CAPM multiplies beta by E[R<sub>m</sub>] − r<sub>f</sub>.</div>
      <div className="pitfall"><b>Market weights</b>WACC weights come from market values, with debt valued at the current cost of debt.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="4" />
    </div>
  );
}
