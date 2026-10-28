'use client';

import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L2() {
  return (
    <div className="theory">
      <p>The APT reaches an SML without the CAPM’s heavy assumptions. It only needs a factor structure, enough assets to diversify away specific risk, and the absence of free lunches. The EMH half of the lecture asks how close real markets come to that ideal.</p>

      <h2 id="apt">The APT argument</h2>
      <ol className="steps">
        <li><div>Returns follow a factor model: R<sub>i</sub> = E[R<sub>i</sub>] + β<sub>i</sub>F + e<sub>i</sub>, with F a zero-mean surprise. Given realised factors, E[r | F] = E[r] + Σβ<sub>k</sub>(F<sub>k</sub> − E[F<sub>k</sub>]).</div></li>
        <li><div>In a well-diversified portfolio the residual variance Σw²<sub>i</sub>σ²(e<sub>i</sub>) goes to zero, so its return is E[R<sub>P</sub>] + β<sub>P</sub>F. Any two such portfolios are perfectly correlated.</div></li>
        <li><div>Two well-diversified portfolios with the same beta but different expected returns give a riskless profit: buy one, short the other. Only a few large arbitrageurs are needed to close it.</div></li>
        <li><div>No arbitrage forces every well-diversified portfolio onto one line: E[r] = r<sub>f</sub> + Σβ<sub>k</sub>RP<sub>k</sub>. Two portfolios pin down r<sub>f</sub> and RP in a one-factor world; two portfolios and r<sub>f</sub> pin down two premiums.</div></li>
        <li><div>The APT says nothing about which factors are priced. Macro factors (Chen, Roll and Ross) and characteristic factors (Fama-French SMB and HML) are both used.</div></li>
      </ol>

      <Lab title="How much specific risk is left in a long-short portfolio?" hint="Equal-weighted legs, residual risk per stock as given"
        controls={[
          { key: 'se', label: 'Residual SD per stock', min: 0.1, max: 1, step: 0.05, value: 0.4, fmt: v => pct(v, 0) },
          { key: 'n', label: 'Stocks in each leg', min: 1, max: 200, step: 1, value: 5, fmt: v => fx(v, 0) },
          { key: 'a', label: 'Alpha spread (long minus short)', min: 0.01, max: 0.1, step: 0.005, value: 0.06, fmt: v => pct(v, 1) },
        ]}
        caption="Standard deviation of the long-short return σ_e√(2/n). Exploiting mispricing in a handful of stocks is anything but riskless; it takes hundreds of positions before the APT’s “well-diversified” is a good approximation.">
        {v => {
          const xs = range(1, 200, 199), sd = (n: number) => v.se * Math.sqrt(2 / n);
          return {
            plot: <LinePlot x={[1, 200]} y={[0, Math.max(0.2, sd(1))]} xLabel="Stocks in each leg" yLabel="SD of long-short return" fmtX={t => fx(t, 0)} fmtY={t => pct(t, 0)}
              series={[{ label: 'specific risk', pts: xs.map(n => [n, sd(n)]), style: 'strong' }, { label: 'alpha', pts: [[1, v.a], [200, v.a]], style: 'dash' }]}
              marker={[{ x: v.n, y: sd(v.n), label: pct(sd(v.n), 1) }]} />,
            readout: [['SD of return', pct(sd(v.n), 2)], ['Alpha / SD', fx(v.a / sd(v.n), 2)], ['Profit per $1m', '$' + fx(v.a * 1e6, 0)], ['SD per $1m', '$' + fx(sd(v.n) * 1e6, 0)]],
          };
        }}
      </Lab>

      <h2 id="tb">APT versus Treynor-Black</h2>
      <p>With residual risk left, a pure zero-beta arbitrage no longer gives the best Sharpe ratio. Treynor-Black weighs alpha against residual variance and reaches SR²<sub>P</sub> = SR²<sub>M</sub> + IR²<sub>A</sub>. As σ(e<sub>A</sub>) → 0 it takes the huge position the APT predicts, so in a one-factor world the APT is a limiting case of Treynor-Black.</p>

      <h2 id="emh">Market efficiency</h2>
      <ol className="steps">
        <li><div>Prices reflect available information; new information is unpredictable, so price changes are too (random walk). Competition for information keeps prices efficient.</div></li>
        <li><div><b>Weak form:</b> past prices and volume, so technical analysis fails. Momentum (Jegadeesh-Titman) and long-term reversal (De Bondt-Thaler) are apparent violations.</div></li>
        <li><div><b>Semi-strong:</b> all public information. P/E, size, book-to-market, January and post-earnings drift (Ball-Brown) are apparent violations.</div></li>
        <li><div><b>Strong:</b> all information. Insiders do profit, and regulators act accordingly.</div></li>
        <li><div>Interpretation: risk (Fama-French) or mispricing (Lakonishok, Shleifer, Vishny)? The joint hypothesis problem means you cannot tell from alphas alone. Anomalies weaken after publication (McLean-Pontiff), limits to arbitrage keep some alive, and Pedersen’s markets are “efficiently inefficient”.</div></li>
      </ol>

      <h2>Worked example: arbitrage (PS 2, Q3)</h2>
      <p>A: β = 1.2, E[r] = 10.21%; B: β = 0.8, E[r] = 7.89%. Then RP = (10.21 − 7.89)/0.4 = 5.8 and r<sub>f</sub> = 10.21 − 1.2 × 5.8 = 3.25. J with β = 0.5 should earn 3.25 + 2.9 = 6.15% but offers 6.35%: buy J, short 5/12 of A plus 7/12 in the risk-free asset, earn 0.20% risk-free.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Surprises, not levels</b>In the conditional return, multiply betas by realised minus expected factor values.</div>
      <div className="pitfall"><b>Profit on a zero-cost portfolio</b>The excess return is profit divided by the amount in one leg, not by the (zero) net cost.</div>
      <div className="pitfall"><b>Size is not a market-timing predictor</b>Dividend ratios, earnings yields and bond spreads predict aggregate returns; the size premium does not.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="2" />
    </div>
  );
}
