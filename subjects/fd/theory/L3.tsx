'use client';

import { Lab, LinePlot, fx, pct } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';
import { binom, bs } from '../generators';

export default function L3() {
  return (
    <div className="theory">
      <p>The binomial model lets the underlying move up by a factor u or down by d each period. With two outcomes and two securities, the share and a riskless loan, any option can be copied exactly. Its price is the cost of the copy, and the real probability of an up move never enters.</p>

      <h2 id="replicate">Replication in one period</h2>
      <ol className="steps">
        <li><div>Hold m shares and borrow B so that the portfolio pays c<sup>u</sup> after an up move and c<sup>d</sup> after a down move: mS<sup>u</sup> − B(1 + r) = c<sup>u</sup>, mS<sup>d</sup> − B(1 + r) = c<sup>d</sup>.</div></li>
        <li><div>Solve: m = (c<sup>u</sup> − c<sup>d</sup>)/(S<sup>u</sup> − S<sup>d</sup>), the <b>delta</b> or hedge ratio; B = (mS<sup>u</sup> − c<sup>u</sup>)/(1 + r).</div></li>
        <li><div>No arbitrage: c = mS − B. If the market price differs, sell the dear one and buy the cheap one.</div></li>
        <li><div>Substituting gives c = [π c<sup>u</sup> + (1 − π)c<sup>d</sup>]/(1 + r) with π = (1 + r − d)/(u − d): the risk-neutral probability. It requires d &lt; 1 + r &lt; u.</div></li>
      </ol>
      <p>Lecture example: S<sub>0</sub> = 100, u = 1.2712, d = 0.8521, r = 6.18%, call with X = 110. c<sup>u</sup> = 17.12, c<sup>d</sup> = 0; m = 17.12/41.91 = 0.4085, B = (0.4085 × 127.12 − 17.12)/1.0618 = 32.78, c<sub>0</sub> = 40.85 − 32.78 = 8.07. If the call traded at 10 you would sell it and buy the replicating portfolio for a riskless 1.93.</p>

      <h2 id="multi">Several periods, American options and income</h2>
      <ol className="steps">
        <li><div>Work backwards from the payoffs at maturity, node by node. For n periods: c<sub>0</sub> = (1 + r)<sup>−n</sup> Σ C(n, j) π<sup>j</sup>(1 − π)<sup>n−j</sup> max(S<sub>0</sub>u<sup>j</sup>d<sup>n−j</sup> − X, 0).</div></li>
        <li><div>Parameters from volatility: u = e<sup>σ√Δt</sup>, d = 1/u, π = (e<sup>rΔt</sup> − d)/(u − d). With a continuous yield q: π = (e<sup>(r − q)Δt</sup> − d)/(u − d).</div></li>
        <li><div><b>American options:</b> at every node take the larger of the value alive (discounted expectation) and the value dead (exercise now). Lecture example, put with X = 110: at S<sup>d</sup> = 88.57 alive 18.18, dead 21.43, so exercise; P<sub>0</sub> = 11.79.</div></li>
        <li><div><b>Known dividends:</b> the tree for S stops recombining. Build it for S* = S − PV(dividends) and add back the PV of the dividends still to come at each node; an American call is checked just before each dividend.</div></li>
        <li><div><b>Volatility from data:</b> u<sub>t</sub> = ln(S<sub>t</sub>/S<sub>t−1</sub>), σ̂ = sample standard deviation × √252.</div></li>
      </ol>

      <Lab title="The tree converges to Black-Scholes" hint="European option value against the number of steps"
        controls={[
          { key: 'S', label: 'Share price', min: 50, max: 150, step: 1, value: 100, fmt: v => fx(v, 0) },
          { key: 'X', label: 'Strike', min: 50, max: 150, step: 1, value: 110, fmt: v => fx(v, 0) },
          { key: 's', label: 'Volatility', min: 0.05, max: 0.8, step: 0.05, value: 0.3, fmt: v => pct(v, 0) },
          { key: 'r', label: 'Risk-free rate', min: 0, max: 0.12, step: 0.005, value: 0.05, fmt: v => pct(v, 1) },
          { key: 'put', label: 'Call (0) or American put (1)', min: 0, max: 1, step: 1, value: 0, fmt: v => v ? 'American put' : 'call' },
        ]}
        caption="One year to maturity. The binomial value oscillates around the Black-Scholes value and settles as the steps get finer. For the American put the tree converges to a value above the European put: the early-exercise premium.">
        {v => {
          const ns = Array.from({ length: 60 }, (_, i) => i + 1);
          const val = (n: number) => { const dt = 1 / n, u = Math.exp(v.s * Math.sqrt(dt)); return binom({ S: v.S, X: v.X, n, u, d: 1 / u, growth: Math.exp(v.r * dt), disc: Math.exp(-v.r * dt), put: !!v.put, american: !!v.put }).V[0][0]; };
          const b = bs(v.S, v.X, 1, v.r, v.s), ref = v.put ? b.p : b.c, ys = ns.map(val);
          const lo = Math.min(...ys, ref) * 0.9, hi = Math.max(...ys, ref) * 1.1 + 0.01;
          return {
            plot: <LinePlot x={[1, 60]} y={[lo, hi]} xLabel="Number of steps" yLabel="Value" fmtX={t => fx(t, 0)} fmtY={t => fx(t, 2)}
              series={[{ label: 'binomial', pts: ns.map((n, i) => [n, ys[i]] as [number, number]), style: 'strong' }, { label: v.put ? 'European put (BS)' : 'Black-Scholes', pts: [[1, ref], [60, ref]], style: 'dash' }]} />,
            readout: [['2 steps', fx(ys[1], 3)], ['60 steps', fx(ys[59], 3)], [v.put ? 'European put (BS)' : 'Black-Scholes', fx(ref, 3)]],
          };
        }}
      </Lab>

      <h2 id="effects">What moves the value of an option</h2>
      <p>Higher S raises calls and lowers puts; a higher strike does the opposite. More volatility (a wider u − d) raises both. More time raises calls and has an ambiguous effect on European puts. A higher risk-free rate raises calls and lowers puts. The real probability of an up or down move has no effect. In a complete market without arbitrage there is one risk-neutral (equivalent martingale) measure, so assets can be valued as if investors were risk-neutral.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Which rate</b>The lecture examples use a per-period simple rate (1 + r); trees built from σ use e<sup>rΔt</sup> per step. Read which one the question gives.</div>
      <div className="pitfall"><b>Delta of a put</b>m is negative for a put: the replicating portfolio shorts the share and lends.</div>
      <div className="pitfall"><b>American nodes</b>Compare alive and dead at every node, including today, and carry the larger value backwards.</div>
      <div className="pitfall"><b>Dividend in the tree</b>Exercise of an American call is checked with the price just before the dividend (cum), continuation with the price after it.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="3" />
    </div>
  );
}
