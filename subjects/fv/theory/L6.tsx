'use client';

import { Frac } from '@/components/Frac';
import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L6() {
  return (
    <div className="theory">
      <p>A DCF of operating cash flows values the operating assets. Equity value needs more: nonoperating assets the firm owns, claims others hold on the firm, and options granted to managers. The lecture closes with what-if analysis and the recommendation an analyst draws from the value.</p>

      <h2 id="bridge">From operating assets to value per share</h2>
      <div className="eqline">E = V<sub>op</sub> + Cash + Minority holdings + Unutilised assets − Minority interests − Debt − Options</div>
      <ol className="steps">
        <li><div><b>Cash:</b> operating cash belongs to the business; excess cash is added. The cleanest route values operating assets without cash (cash flows before interest income, betas of operating assets) and adds cash back.</div></li>
        <li><div><b>Minority holdings</b> (passive or equity method) are not in consolidated cash flows: add their market value, or book value × sector P/B, or share of earnings × sector P/E.</div></li>
        <li><div><b>Majority holdings</b> are consolidated 100%: subtract the minority interests at market value, (1 − ownership) × value of the subsidiary or book minority interests × sector P/B.</div></li>
        <li><div><b>Other assets:</b> add vacant land and other unutilised assets at market value; do not add assets that produce operating cash flows, and do not double-count intangibles already in the forecasts. Goodwill is a plug (price − fair value of net assets), not an asset to add.</div></li>
        <li><div><b>Options:</b> subtract their value from equity (option pricing), then divide by shares outstanding.</div></li>
      </ol>

      <h2 id="cash">How the market values cash</h2>
      <p>If you net cash against debt, the cost of the remaining debt rises: k<sub>net</sub> = (k<sub>d</sub> × D − r<sub>f</sub> × Cash) / (D − Cash). Example: 7% on $400m of debt with $200m cash at 5% gives 9%. Baumol (1952) and Miller–Orr (1966) explain cash needs from transaction costs, interest rates and cash-flow uncertainty. A dollar of cash is worth a dollar when the firm earns its cost of capital (neutral), less when it earns less (wasting asset), possibly more when it earns more (value creator). Discount cash only if managers are likely to waste it.</p>

      <h2 id="options">Management options</h2>
      <div className="eqline">Diluted: <Frac n="E" d="N + n" /><span className="up">,</span>&nbsp;&nbsp; Treasury stock: <Frac n="E + n·K" d="N + n" /><span className="up">,</span>&nbsp;&nbsp; Option value: <Frac n="E − n·OV" d="N" /></div>
      <p>The diluted count ignores the exercise cash and overstates dilution; the treasury stock approach ignores time value; option pricing is best. Future grants are an operating expense: estimate them as a share of revenue that falls as the firm grows, net of their tax benefit. Multiple share classes are valued separately according to their voting and dividend rights.</p>

      <Lab title="Three ways to count options" hint="Equity $1,800m, 120m shares, options struck at $16 and worth $4 each"
        controls={[
          { key: 'n', label: 'Options outstanding (m)', min: 0, max: 60, step: 1, value: 15, fmt: v => fx(v, 0) },
          { key: 'k', label: 'Exercise price ($)', min: 5, max: 25, step: 0.5, value: 16, fmt: v => fx(v, 1) },
          { key: 'ov', label: 'Value per option ($)', min: 0, max: 10, step: 0.25, value: 4, fmt: v => fx(v, 2) },
        ]}
        caption="Value per share as the number of options grows. The fully diluted count (dashed) falls fastest because it ignores the exercise proceeds; the treasury stock approach (gray) ignores time value; subtracting the option value (blue) is the lecture’s preferred method.">
        {v => {
          const E = 1800, N = 120, xs = range(0, 60, 60);
          const dil = (n: number) => E / (N + n), ts = (n: number) => (E + n * v.k) / (N + n), ov = (n: number) => (E - n * v.ov) / N;
          return {
            plot: <LinePlot x={[0, 60]} y={[0, 22]} xLabel="Options (millions)" yLabel="Value per share ($)" fmtX={x => fx(x, 0)} fmtY={y => fx(y, 0)}
              series={[{ label: 'Option value', pts: xs.map(n => [n, ov(n)]), style: 'strong' }, { label: 'Treasury stock', pts: xs.map(n => [n, ts(n)]), style: 'soft' }, { label: 'Diluted', pts: xs.map(n => [n, dil(n)]), style: 'dash' }]} />,
            readout: [['No options', '$' + fx(E / N, 2)], ['Diluted', '$' + fx(dil(v.n), 2)], ['Treasury stock', '$' + fx(ts(v.n), 2)], ['Option value', '$' + fx(ov(v.n), 2)]],
          };
        }}
      </Lab>

      <h2 id="commit">Commitments as debt (Netflix)</h2>
      <p>Netflix’s multi-year content commitments behave like debt. Discounted at its pre-tax cost of debt of 6%, they are worth about $8.97bn (lecture figure). Treating them as debt raises debt from $2.4bn to $11.4bn, operating income from $348m to $2,541m and invested capital from $1.6bn to $10.6bn; the value of operating assets rises from $48.4bn to $53.5bn. How commitments are treated, and how efficiently content spending turns into revenue, drive the valuation.</p>

      <h2 id="whatif">What-if analysis and recommendations</h2>
      <p><b>Sensitivity analysis</b> changes one input at a time (WACC, growth, margin) and tabulates the value; <b>scenario analysis</b> values a few internally consistent cases (best, base, worst) and weights them by probability; <b>Monte Carlo simulation</b> draws inputs from distributions thousands of times and reports the distribution of values. The recommendation compares value and price: Strong Buy, Buy, Hold (in line with the market), Sell, Strong Sell.</p>

      <Lab title="Sensitivity of a DCF value" hint="FCFF of 100 next year growing forever"
        controls={[
          { key: 'w', label: 'WACC', min: 0.05, max: 0.14, step: 0.0025, value: 0.09, fmt: v => pct(v, 2) },
          { key: 'g', label: 'Perpetual growth', min: 0, max: 0.04, step: 0.0025, value: 0.02, fmt: v => pct(v, 2) },
        ]}
        caption="The value 100 / (WACC − g) as the WACC changes, for the chosen growth (blue) and for growth one point lower (gray). Small changes near g produce large swings, which is why a single point estimate needs a sensitivity table next to it.">
        {v => {
          const lo = Math.max(v.g + 0.01, 0.05), xs = range(lo, 0.14, 80);
          const val = (w: number, g: number) => 100 / (w - g);
          return {
            plot: <LinePlot x={[lo, 0.14]} y={[0, Math.min(5000, val(lo, v.g) * 1.05)]} xLabel="WACC" yLabel="Firm value" fmtX={x => pct(x, 0)} fmtY={y => fx(y, 0)}
              series={[{ label: 'g', pts: xs.map(w => [w, val(w, v.g)]), style: 'strong' }, { label: 'g − 1%', pts: xs.map(w => [w, val(w, Math.max(0, v.g - 0.01))]), style: 'soft' }]}
              marker={v.w > v.g ? [{ x: v.w, y: val(v.w, v.g), label: fx(val(v.w, v.g), 0) }] : []} />,
            readout: v.w > v.g
              ? [['Value', fx(val(v.w, v.g), 0)], ['WACC + 1 point', fx(val(v.w + 0.01, v.g), 0)], ['WACC − 1 point', v.w - 0.01 > v.g ? fx(val(v.w - 0.01, v.g), 0) : '—']]
              : [['Value', 'undefined (g ≥ WACC)']],
          };
        }}
      </Lab>

      <h2>Worked example: holdings and minority interests (extra question 1)</h2>
      <p>Enterprise value €9,228.71m, cash €1,500m, debt €3,000m; 25% of ForEverHome (market value €960m) and 90% of MadHouse (market value €1,680m, consolidated).</p>
      <ol className="steps">
        <li><div>Add the holding: 0.25 × 960 = 240. Subtract minority interests: 0.10 × 1,680 = 168.</div></li>
        <li><div>Equity = 9,228.71 + 1,500 − 3,000 + 240 − 168 = €7,800.71m.</div></li>
      </ol>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Consolidated means already in</b>A majority-owned subsidiary is in the cash flows; only the outsiders’ share comes off.</div>
      <div className="pitfall"><b>Market, not book</b>Convert holdings and minority interests to market values (sector P/B or P/E) where you can.</div>
      <div className="pitfall"><b>Options are claims</b>Subtract their value before dividing by the shares outstanding; don’t also add them to the share count.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="6" />
    </div>
  );
}
