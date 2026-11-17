'use client';

import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';
import { bs } from '../generators';

export default function L5() {
  return (
    <div className="theory">
      <p>Banks and companies sell products whose payoff is a formula in some price: a share, an index, a commodity. However exotic the formula looks, it can usually be written as a sum of zero-coupon bonds, the underlying and plain calls and puts. Value each building block, add them up, and the difference to the selling price is the issuer’s margin.</p>

      <h2 id="method">The method</h2>
      <ol className="steps">
        <li><div><b>Plot the payoff</b> at maturity against S<sub>T</sub> and write it as a table, one row per interval.</div></li>
        <li><div><b>Decompose:</b> a flat part is a bond, a slope of +1 above a kink is a long call, a slope of −1 below a kink is a long put, and so on. Scale by the number of shares the slope represents.</div></li>
        <li><div><b>Value the blocks:</b> bonds at e<sup>−rT</sup>, options by Black-Scholes (or a tree), with the right income adjustment.</div></li>
        <li><div><b>Margin:</b> price × (1 − margin) = value of the blocks. Solve for the free parameter (α, K, the participation rate or the coupon).</div></li>
      </ol>

      <h2 id="examples">Typical products</h2>
      <ol className="steps">
        <li><div><b>Guarantee plus options</b> (problem set 1, exercise 9): G + α max(10 − S<sub>T</sub>, 0). Price 1000, G = 900, margin 5%, S = 5, σ = 60%, r = 4%, two months: PV(900) = 894.02, put = 4.935, α = (950 − 894.02)/4.935 = 11.34.</div></li>
        <li><div><b>Floor on a commodity</b> (exercise 7): max(1000, 1300 − S<sub>T</sub>) = 1000 + max(300 − S<sub>T</sub>, 0), a bond plus a put with strike 300. Lead at 500, r = 5%, storage 6%, convenience yield 2%, σ = 3%√52 = 21.6%, three years: the put (q = y − u = −4%) is worth 0.95, the unit 1000e<sup>−0.15</sup> + 0.95 = 861.66. The battery maker pays more when lead is cheap, which hedges its costs.</div></li>
        <li><div><b>Absolute return</b> (exercise 8): K(1 + |R|) = K + (K/S<sub>0</sub>)[max(S<sub>T</sub> − S<sub>0</sub>, 0) + max(S<sub>0</sub> − S<sub>T</sub>, 0)], a bond plus K/S<sub>0</sub> at-the-money straddles. S = 10, σ = 50%, r = 4%, two months, 5% margin: K = 950/[e<sup>−rT</sup> + (c + p)/S<sub>0</sub>] = 822.16.</div></li>
        <li><div><b>Capital-protected note:</b> N + participation × (N/S<sub>0</sub>) max(S<sub>T</sub> − S<sub>0</sub>, 0): bond plus calls. The participation rate is what the option budget N(1 − margin) − Ne<sup>−rT</sup> buys.</div></li>
        <li><div><b>Reverse convertible:</b> coupon plus min(N, (N/S<sub>0</sub>)S<sub>T</sub>) = N(1 + k) − (N/S<sub>0</sub>) max(S<sub>0</sub> − S<sub>T</sub>, 0): the investor sells puts and is paid through the coupon.</div></li>
      </ol>

      <Lab title="Guarantee plus puts: the α the bank can offer" hint="Price 1000, two months, put strike twice the share price"
        controls={[
          { key: 'G', label: 'Guaranteed amount', min: 800, max: 1000, step: 10, value: 900, fmt: v => fx(v, 0) },
          { key: 'm', label: 'Bank margin', min: 0, max: 0.08, step: 0.005, value: 0.05, fmt: v => pct(v, 1) },
          { key: 's', label: 'Volatility', min: 0.1, max: 1, step: 0.05, value: 0.6, fmt: v => pct(v, 0) },
          { key: 'r', label: 'Risk-free rate', min: 0, max: 0.1, step: 0.005, value: 0.04, fmt: v => pct(v, 1) },
        ]}
        caption="Share at 5, strike 10. A higher guarantee or margin leaves less to spend on puts, so α falls; the payoff line rises from the guarantee as the share collapses.">
        {v => {
          const S = 5, X = 10, T = 2 / 12, p = bs(S, X, T, v.r, v.s).p, pv = v.G * Math.exp(-v.r * T), a = Math.max(0, (1000 * (1 - v.m) - pv) / p);
          const xs = range(0, 15, 150);
          return {
            plot: <LinePlot x={[0, 15]} y={[0, Math.max(1100, v.G + a * X) * 1.05]} xLabel="Share price at maturity" yLabel="Payoff per unit" fmtX={t => fx(t, 0)} fmtY={t => fx(t, 0)}
              series={[{ label: 'payoff', pts: xs.map(s => [s, v.G + a * Math.max(X - s, 0)] as [number, number]), style: 'strong' }, { label: 'price paid', pts: [[0, 1000], [15, 1000]], style: 'dash' }]} />,
            readout: [['PV of the guarantee', fx(pv, 2)], ['Put value', fx(p, 3)], ['α', fx(a, 2)], ['Break-even share price', a > 0 ? fx(Math.max(0, X - (1000 - v.G) / a), 2) : '—']],
          };
        }}
      </Lab>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Number of options</b>A slope of K/S<sub>0</sub> per euro of share price means K/S<sub>0</sub> options, not K or one.</div>
      <div className="pitfall"><b>Margin on the price</b>The issuer’s margin is a share of what the investor pays: value = price × (1 − margin).</div>
      <div className="pitfall"><b>Commodity carry</b>Under the risk-neutral measure a commodity grows at r + u − y, so it is valued like an asset with yield y − u, which can be negative.</div>
      <div className="pitfall"><b>Real versus risk-neutral probabilities</b>The probability of a given payoff uses the historical drift; its value uses the risk-neutral one.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="5" />
    </div>
  );
}
