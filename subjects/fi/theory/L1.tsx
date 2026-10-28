'use client';

import { Frac } from '@/components/Frac';
import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L1() {
  return (
    <div className="theory">
      <p>If everybody optimises à la Markowitz with the same inputs, everybody holds the same risky portfolio. Supply has to meet demand, so that portfolio is the market. Everything else in the CAPM follows from asking what return each asset must offer for investors to be happy holding exactly its market weight.</p>

      <h2 id="logic">From Markowitz to the SML in five steps</h2>
      <ol className="steps">
        <li><div>Same inputs, same risk-free rate, no frictions: all investors agree on the tangency portfolio and differ only in how much they borrow or lend.</div></li>
        <li><div>Aggregate borrowing is zero, so the tangency portfolio must be the market. For the representative investor E[r<sub>M</sub>] − r<sub>f</sub> = Ā σ²<sub>M</sub>.</div></li>
        <li><div>Adding a little of asset x changes portfolio variance by about 2δ cov(r<sub>x</sub>, r<sub>M</sub>). In equilibrium the extra return per unit of extra variance must be the same for every asset, otherwise everyone would buy more of the better one.</div></li>
        <li><div>Setting asset x’s ratio equal to the market’s gives the SML: E[r<sub>x</sub>] = r<sub>f</sub> + β<sub>x</sub>(E[r<sub>M</sub>] − r<sub>f</sub>). Only covariance with the market is priced; volatility, ROE or bankruptcy risk are not.</div></li>
        <li><div>Alpha is the vertical distance to the SML. Positive alpha means the expected return is too high for its risk: the price is too low, the stock is underpriced.</div></li>
      </ol>

      <Lab title="SML: where does a stock sit, and what is its alpha?" hint="Move the forecast and watch the alpha"
        controls={[
          { key: 'rf', label: 'Risk-free rate', min: 0, max: 0.06, step: 0.0025, value: 0.03, fmt: v => pct(v, 2) },
          { key: 'mrp', label: 'Market risk premium', min: 0.02, max: 0.1, step: 0.0025, value: 0.06, fmt: v => pct(v, 2) },
          { key: 'b', label: 'Stock beta', min: -0.5, max: 2.5, step: 0.05, value: 1.3, fmt: v => fx(v, 2) },
          { key: 'er', label: 'Forecast return', min: -0.02, max: 0.25, step: 0.0025, value: 0.13, fmt: v => pct(v, 2) },
        ]}
        caption="The line is the SML; the dot is the stock at its beta and forecast return. Above the line: positive alpha, underpriced. A negative beta asset should earn less than the risk-free rate.">
        {v => {
          const xs = range(-0.5, 2.5, 60), fair = v.rf + v.b * v.mrp, a = v.er - fair;
          return {
            plot: <LinePlot x={[-0.5, 2.5]} y={[-0.05, 0.3]} xLabel="Beta" yLabel="Expected return" fmtX={t => fx(t, 1)} fmtY={t => pct(t, 0)}
              series={[{ label: 'SML', pts: xs.map(b => [b, v.rf + b * v.mrp]), style: 'strong' }]}
              marker={[{ x: v.b, y: v.er, label: 'α = ' + pct(a, 2) }, { x: 1, y: v.rf + v.mrp, label: 'M' }]} />,
            readout: [['Fair return', pct(fair, 2)], ['Alpha', pct(a, 2)], ['Verdict', a > 0.0001 ? 'underpriced' : a < -0.0001 ? 'overpriced' : 'fairly priced']],
          };
        }}
      </Lab>

      <h2 id="cml">CML, CAL and the single-index model</h2>
      <div className="eqline">CAL(P): E[r<sub>C</sub>] = r<sub>f</sub> + ρ<sub>PM</sub><Frac n={<>E[r<sub>M</sub>] − r<sub>f</sub></>} d={<>σ<sub>M</sub></>} />σ<sub>C</sub></div>
      <p>The CML is the CAL of the market (ρ = 1) and holds only efficient portfolios. The SML holds every correctly priced asset. Two portfolios with the same beta sit on the same SML point but can lie far apart in mean–standard deviation space, because only systematic risk is priced. A well-diversified portfolio has no specific risk, so σ<sub>P</sub> = β<sub>P</sub>σ<sub>M</sub>.</p>
      <p>The single-index model, R<sub>i</sub> = α<sub>i</sub> + β<sub>i</sub>R<sub>M</sub> + e<sub>i</sub> with uncorrelated residuals, is a statistical shortcut: σ²<sub>i</sub> = β²<sub>i</sub>σ²<sub>M</sub> + σ²(e<sub>i</sub>) and cov(R<sub>i</sub>, R<sub>j</sub>) = β<sub>i</sub>β<sub>j</sub>σ²<sub>M</sub>. Unlike the CAPM it allows non-zero alphas; unlike the SIM, the CAPM does not need uncorrelated residuals.</p>

      <h2>Worked example: price when correlation doubles (PS 1, Q1)</h2>
      <ol className="steps">
        <li><div>Price $75, expected return 12%, perpetual dividend: D = 0.12 × 75 = $9.</div></li>
        <li><div>β = (12% − 5%)/6% = 1.167. Beta is linear in correlation, so it doubles to 2.333 and E[r] = 5% + 2.333 × 6% = 19%.</div></li>
        <li><div>New price: 9 / 0.19 = $47.37.</div></li>
      </ol>

      <h2>Extensions</h2>
      <p>Zero-beta CAPM (Black, 1972): without borrowing, the zero-beta portfolio replaces r<sub>f</sub> and the SML is flatter. Roll (1977): the true market is unobservable. Consumption CAPM: risk is covariance with marginal utility of consumption. ICAPM (Merton, 1973): hedging portfolios for changes in the opportunity set. Liquidity: E[r<sub>i</sub>] = r<sub>f</sub> + β<sub>i</sub>E[R<sub>M</sub>] + IL<sub>i</sub>.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Volatility is not beta</b>A stock with higher volatility can have a lower expected return. Only a higher beta requires a higher return.</div>
      <div className="pitfall"><b>CAL needs the market Sharpe ratio</b>The CAL of a stock uses ρ × SR<sub>M</sub>; with only the risk premium given and no σ<sub>M</sub>, it cannot be determined.</div>
      <div className="pitfall"><b>Project risk</b>Discount a project at its own beta, not at the company’s.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="1" />
    </div>
  );
}
