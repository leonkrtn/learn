'use client';

import { Frac } from '@/components/Frac';
import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L3() {
  return (
    <div className="theory">
      <p>Was the manager skilled or lucky, and was the return worth the risk? This lecture gives four ratios, says when each one is the right one, and then shows why even the right one needs a very long sample.</p>

      <h2 id="returns">Measuring the return</h2>
      <p>Time-weighted returns (arithmetic or geometric averages) treat every period alike and measure the manager. The dollar-weighted return is the IRR of the investor’s cash flows and measures the investor’s experience: if more money arrives before a bad year, it falls below the time-weighted figure. Friesen and Sapp (2007) find a gap of 1.56% a year for mutual fund investors.</p>

      <h2 id="ratios">Four risk-adjusted measures, and when to use them</h2>
      <div className="eqline">SR = <Frac n={<>r̄<sub>P</sub> − r̄<sub>f</sub></>} d={<>σ<sub>P</sub></>} /><span className="up">,</span>&nbsp; T = <Frac n={<>r̄<sub>P</sub> − r̄<sub>f</sub></>} d={<>β<sub>P</sub></>} /><span className="up">,</span>&nbsp; α = r̄<sub>P</sub> − [r̄<sub>f</sub> + β<sub>P</sub>(r̄<sub>M</sub> − r̄<sub>f</sub>)]<span className="up">,</span>&nbsp; IR = <Frac n="α" d={<>σ(e<sub>P</sub>)</>} /></div>
      <ol className="steps">
        <li><div><b>Entire risky portfolio:</b> Sharpe ratio, or M² = r<sub>f</sub> + SR<sub>P</sub>σ<sub>M</sub> − E[r<sub>M</sub>], which levers P to the market’s volatility.</div></li>
        <li><div><b>One of many sub-portfolios:</b> specific risk diversifies away, so use the Treynor ratio.</div></li>
        <li><div><b>Only active portfolio next to an index:</b> information ratio, because SR²<sub>P</sub> = SR²<sub>M</sub> + IR².</div></li>
        <li><div>Residual risk from a regression: σ²(e) = (1 − R²)σ²<sub>P</sub> = σ²<sub>P</sub> − β²σ²<sub>M</sub>.</div></li>
      </ol>

      <Lab title="How long until skill shows up in the data?" hint="t-statistic of a true alpha estimated without error"
        controls={[
          { key: 'a', label: 'Monthly alpha', min: 0.0005, max: 0.01, step: 0.0005, value: 0.002, fmt: v => pct(v, 2) },
          { key: 'se', label: 'Monthly residual SD', min: 0.005, max: 0.06, step: 0.0025, value: 0.02, fmt: v => pct(v, 2) },
        ]}
        caption="t = (α/σ_e)√N. With α = 0.2% and σ_e = 2% per month a manager needs more than 384 months, 32 years, before the alpha clears 1.96.">
        {v => {
          const need = (1.96 * v.se / v.a) ** 2, top = Math.min(1200, Math.max(120, need * 1.3));
          const xs = range(1, top, 120), t = (n: number) => v.a / v.se * Math.sqrt(n);
          return {
            plot: <LinePlot x={[0, top]} y={[0, Math.max(3, t(top))]} xLabel="Months of data" yLabel="t-statistic of alpha" fmtX={x => fx(x, 0)} fmtY={x => fx(x, 1)}
              series={[{ label: 't-stat', pts: xs.map(n => [n, t(n)]), style: 'strong' }, { label: '1.96', pts: [[0, 1.96], [top, 1.96]], style: 'dash' }]}
              vline={need <= top ? { x: need, label: fx(need, 0) + ' months' } : undefined} />,
            readout: [['Information ratio (monthly)', fx(v.a / v.se, 3)], ['Months needed', fx(need, 1)], ['Years needed', fx(need / 12, 1)]],
          };
        }}
      </Lab>

      <h2 id="manipulation">Manipulation, timing and style</h2>
      <p>All measures assume returns are drawn from one distribution. A manager who raises risk after bad results, or simply varies risk at a constant conditional Sharpe ratio, lowers the measured Sharpe ratio for investors (−1, 3, −1, 3, −9, 27, −9, 27 gives 0.37 instead of 0.50). The MRAR is manipulation-proof; the Sharpe ratio is not. Market timing shows up as convexity in Treynor-Mazuy (squared market term) or Henriksson-Merton (up-market dummy). Sharpe’s style analysis regresses fund returns on asset-class indices with non-negative weights that sum to one.</p>

      <h2 id="attribution">Performance attribution</h2>
      <div className="eqline">r<sub>P</sub> − r<sub>B</sub> = <span className="up">Σ</span>(w<sub>Pi</sub> − w<sub>Bi</sub>)r<sub>Bi</sub> + <span className="up">Σ</span> w<sub>Pi</sub>(r<sub>Pi</sub> − r<sub>Bi</sub>)</div>
      <p>The first sum is asset allocation, the second security selection. Sample exam: bogey weights 0.5/0.3/0.2 with index returns −10%/3%/2%, portfolio weights 0.2/0.5/0.3 with returns −8%/2%/2%. Allocation: (−0.3)(−10) + 0.2 × 3 + 0.1 × 2 = 3.8%. Selection: 0.2 × 2 + 0.5 × (−1) + 0 = −0.1%.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Treynor uses beta</b>Treynor divides by beta, not by downside risk or skill. Sharpe divides by total volatility.</div>
      <div className="pitfall"><b>Information ratio denominator</b>Use residual standard deviation, not total.</div>
      <div className="pitfall"><b>Attribution weights</b>Allocation uses benchmark returns with weight differences; selection uses portfolio weights with return differences.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="3" />
    </div>
  );
}
