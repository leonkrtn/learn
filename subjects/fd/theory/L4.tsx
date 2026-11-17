'use client';

import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';
import { Phi, bs } from '../generators';

export default function L4() {
  return (
    <div className="theory">
      <p>Let the binomial steps shrink to zero and the share price follows geometric Brownian motion, dS = μS dt + σS dz. Log returns are then normally distributed, the share price is lognormal, and option values have a closed form: the Black-Scholes-Merton formula. As in the tree, the expected return μ drops out of the price.</p>

      <h2 id="lognormal">The lognormal model</h2>
      <ol className="steps">
        <li><div>ln S<sub>T</sub> ~ N(ln S<sub>0</sub> + (μ − σ²/2)T, σ²T). The mean of S<sub>T</sub> is S<sub>0</sub>e<sup>μT</sup>; the median is lower, S<sub>0</sub>e<sup>(μ − σ²/2)T</sup>.</div></li>
        <li><div>Probabilities: P(S<sub>T</sub> &gt; X) = N(d2) with d2 = [ln(S<sub>0</sub>/X) + (μ − σ²/2)T]/(σ√T). With r instead of μ this is the risk-neutral probability.</div></li>
        <li><div>From weekly data: mean m and standard deviation s of ln(P<sub>t+1</sub>/P<sub>t</sub>) give ln P<sub>T</sub> ~ N(ln P<sub>0</sub> + nm, ns²) over n weeks, and σ = s√52 a year.</div></li>
        <li><div>Risk-neutral drift: r for a share without income, r − q with a yield q, r + u − y for a commodity with storage cost u and convenience yield y.</div></li>
      </ol>

      <h2 id="bs">Black-Scholes</h2>
      <div className="eqline">c = S N(d1) − Xe<sup>−rT</sup> N(d2), &nbsp; p = Xe<sup>−rT</sup> N(−d2) − S N(−d1)<br />d1 = [ln(S/X) + (r + σ²/2)T]/(σ√T), &nbsp; d2 = d1 − σ√T</div>
      <p>N(d1) is the call’s delta, the number of shares that hedges one call; N(d2) is the risk-neutral probability of exercise. Known dividends: use S − PV(D). A continuous yield q: replace S by Se<sup>−qT</sup> (and r by r − q in d1). The <b>implied volatility</b> is the σ that reproduces the market price; it is found by trial and error because the call value rises with σ.</p>
      <p>Worked example (problem set 1, exercise 6): dS = 0.2S dt + 0.4S dz, S = 11, X = 12, T = 3 weeks, r = 10%. σ√T = 0.4√(3/52) = 0.0961. Real world: d2 = [ln(11/12) + (0.2 − 0.08) × 0.0577]/0.0961 = −0.833, P = 20.2%. Risk-neutral: d2 = [ln(11/12) + (0.1 − 0.08) × 0.0577]/0.0961 = −0.893, P = 18.6%. The call is worth 11 × N(−0.797) − 12e<sup>−0.0058</sup> × N(−0.893) = 0.122, a little below the market price of 0.13: the implied volatility is slightly above 40%.</p>

      <Lab title="Real-world and risk-neutral distribution of S_T" hint="Density of the share price at maturity"
        controls={[
          { key: 'S', label: 'Share price today', min: 50, max: 150, step: 1, value: 100, fmt: v => fx(v, 0) },
          { key: 'X', label: 'Strike', min: 50, max: 160, step: 1, value: 110, fmt: v => fx(v, 0) },
          { key: 'mu', label: 'Expected return μ', min: 0, max: 0.3, step: 0.01, value: 0.15, fmt: v => pct(v, 0) },
          { key: 'r', label: 'Risk-free rate', min: 0, max: 0.1, step: 0.005, value: 0.04, fmt: v => pct(v, 1) },
          { key: 's', label: 'Volatility', min: 0.05, max: 0.8, step: 0.05, value: 0.3, fmt: v => pct(v, 0) },
          { key: 'T', label: 'Years', min: 0.1, max: 3, step: 0.1, value: 1, fmt: v => fx(v, 1) },
        ]}
        caption="Pricing uses the grey (risk-neutral) density: the call value is the discounted expected payoff under it. The blue density only tells you how likely exercise really is; changing μ moves it but leaves the call value unchanged.">
        {v => {
          const dens = (m: number) => (x: number) => { const mu = Math.log(v.S) + (m - v.s * v.s / 2) * v.T, sd = v.s * Math.sqrt(v.T); return Math.exp(-((Math.log(x) - mu) ** 2) / (2 * sd * sd)) / (x * sd * Math.sqrt(2 * Math.PI)); };
          const xs = range(v.S * 0.2, v.S * 3, 200), fr = dens(v.mu), fq = dens(v.r), ys = xs.map(fr).concat(xs.map(fq));
          const b = bs(v.S, v.X, v.T, v.r, v.s), d2mu = (Math.log(v.S / v.X) + (v.mu - v.s * v.s / 2) * v.T) / (v.s * Math.sqrt(v.T));
          return {
            plot: <LinePlot x={[v.S * 0.2, v.S * 3]} y={[0, Math.max(...ys) * 1.1]} xLabel="Share price at maturity" yLabel="Density" fmtX={t => fx(t, 0)} fmtY={t => fx(t, 3)} vline={{ x: v.X, label: 'X' }}
              series={[{ label: 'real world', pts: xs.map(x => [x, fr(x)] as [number, number]), style: 'strong' }, { label: 'risk-neutral', pts: xs.map(x => [x, fq(x)] as [number, number]), style: 'soft' }]} />,
            readout: [['Real-world P(exercise)', pct(Phi(d2mu), 1)], ['Risk-neutral P = N(d2)', pct(b.Nd2, 1)], ['Call value', fx(b.c, 2)], ['Delta N(d1)', fx(b.Nd1, 3)]],
          };
        }}
      </Lab>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>μ or r</b>Use μ for real-world probabilities and forecasts, r for prices and risk-neutral probabilities.</div>
      <div className="pitfall"><b>The σ²/2 term</b>The mean of ln S<sub>T</sub> is ln S<sub>0</sub> + (μ − σ²/2)T, not ln S<sub>0</sub> + μT.</div>
      <div className="pitfall"><b>Time units</b>σ and r are annual; weeks/52, months/12, days/365 (trading days 252 for volatility estimates).</div>
      <div className="pitfall"><b>Deep in-the-money European put</b>It can be worth less than X − S; that is not an arbitrage because it cannot be exercised early.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="4" />
    </div>
  );
}
