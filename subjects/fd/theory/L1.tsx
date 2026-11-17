'use client';

import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';
import { bs } from '../generators';

export default function L1() {
  return (
    <div className="theory">
      <p>A derivative is a security whose value derives from an underlying variable: usually the price of a traded asset (shares, bonds, currencies, commodities), sometimes something that is not traded at all, such as an interest rate, the weather or a default. Forwards, futures, swaps and options are the building blocks; exotics are the structures that cannot be built from forwards and plain options. All three uses, hedging, speculation and arbitrage, take or remove an exposure to the underlying.</p>

      <h2 id="options">Calls, puts and their payoffs</h2>
      <p>An option gives the right, not the obligation, to buy (call) or sell (put) the underlying at the strike X. A European option can be exercised only at maturity T, an American one at any time before. Notation: c and p for European, C and P for American options, S for the underlying. At maturity a call pays max(S<sub>T</sub> − X, 0) and a put max(X − S<sub>T</sub>, 0). Unlike a forward, the holder pays a premium today for the choice.</p>
      <p><b>Intrinsic value</b> is what exercising now would give, max(S − X, 0) for a call; <b>time value</b> is the price minus the intrinsic value. In the money means a positive intrinsic value, at the money S = X, out of the money the rest.</p>

      <h2 id="bounds">Bounds when the underlying pays no income</h2>
      <ol className="steps">
        <li><div><b>Call, lower bound:</b> c ≥ max(S − PV(X), 0). If not, buy the call, short the share and invest PV(X): cash today, and at maturity max(S<sub>T</sub>, X) − S<sub>T</sub> ≥ 0.</div></li>
        <li><div><b>Call, upper bound:</b> c ≤ S. The call can never pay more than the share.</div></li>
        <li><div><b>Put, upper bound:</b> p ≤ PV(X), since it pays at most X at maturity.</div></li>
        <li><div><b>Put, lower bound:</b> p ≥ max(PV(X) − S, 0): buy the put and the share, borrow PV(X).</div></li>
        <li><div><b>Put-call parity:</b> c = p + S − PV(X). A call equals a put plus the share bought with borrowed PV(X); both pay max(S<sub>T</sub>, X) − X.</div></li>
      </ol>
      <p>Worked example (problem set 1, exercise 2A): calls with strike 15 quoted 4 bid and 4.60 ask, S = 12, r = 8%, T = 3 months. PV(15) = 15e<sup>−0.02</sup> = 14.70. If the put were too cheap you would buy it and sell the synthetic put (sell the call at the bid): p<sup>ask</sup> ≥ 4 − 12 + 14.70 = 6.70. If too expensive: p<sup>bid</sup> ≤ 4.60 − 12 + 14.70 = 7.30.</p>

      <Lab title="Bounds on a European call and put" hint="No income, continuous compounding"
        controls={[
          { key: 'X', label: 'Strike', min: 50, max: 150, step: 1, value: 100, fmt: v => fx(v, 0) },
          { key: 'T', label: 'Years to maturity', min: 0.05, max: 3, step: 0.05, value: 1, fmt: v => fx(v, 2) },
          { key: 'r', label: 'Risk-free rate', min: 0, max: 0.12, step: 0.005, value: 0.05, fmt: v => pct(v, 1) },
          { key: 's', label: 'Volatility', min: 0.05, max: 0.8, step: 0.05, value: 0.3, fmt: v => pct(v, 0) },
          { key: 'put', label: 'Show the put (1) or the call (0)', min: 0, max: 1, step: 1, value: 0, fmt: v => v ? 'put' : 'call' },
        ]}
        caption="The option value (blue) always lies between the bounds. For the call it hugs S − PV(X) deep in the money; the European put falls below its intrinsic value X − S there: negative time value.">
        {v => {
          const pv = v.X * Math.exp(-v.r * v.T), xs = range(1, 2 * v.X, 160);
          const val = (S: number) => { const b = bs(S, v.X, v.T, v.r, v.s); return v.put ? b.p : b.c; };
          const series = v.put
            ? [{ label: 'put value', pts: xs.map(S => [S, val(S)] as [number, number]), style: 'strong' as const }, { label: 'max(PV(X) − S, 0)', pts: xs.map(S => [S, Math.max(pv - S, 0)] as [number, number]), style: 'soft' as const }, { label: 'X − S', pts: xs.map(S => [S, Math.max(v.X - S, 0)] as [number, number]), style: 'dash' as const }]
            : [{ label: 'call value', pts: xs.map(S => [S, val(S)] as [number, number]), style: 'strong' as const }, { label: 'max(S − PV(X), 0)', pts: xs.map(S => [S, Math.max(S - pv, 0)] as [number, number]), style: 'soft' as const }, { label: 'S − X', pts: xs.map(S => [S, Math.max(S - v.X, 0)] as [number, number]), style: 'dash' as const }];
          return {
            plot: <LinePlot x={[0, 2 * v.X]} y={[0, v.X * 1.05]} xLabel="Share price S" yLabel="Value" fmtX={t => fx(t, 0)} fmtY={t => fx(t, 0)} series={series} />,
            readout: [['PV(X)', fx(pv, 2)], ['Value at S = X (all time value)', fx(val(v.X), 2)], ['Upper bound', v.put ? fx(pv, 2) + ' = PV(X)' : 'S']],
          };
        }}
      </Lab>

      <h2 id="american">American options and early exercise</h2>
      <p><b>Calls without income:</b> C ≥ c ≥ S − PV(X) &gt; S − X, so selling the call always beats exercising it. Early exercise is never optimal and C = c.</p>
      <p><b>Puts without income:</b> early exercise can pay. With S = 1, X = 25, T − t = 1 year and r = 5%, exercising and investing gives (25 − 1) × 1.05 = 25.20 at maturity, more than the 25 the put could ever pay. Below some share price A it is optimal to exercise at once, so P &gt; p and the American put lies above the European one. Parity becomes an inequality: S − X ≤ C − P ≤ S − PV(X).</p>

      <h2 id="income">When the underlying pays income</h2>
      <p>With D the present value of income before maturity: c ≥ S − PV(X) − D, p ≥ PV(X) − S + D and c = p + S − PV(X) − D. An American call may now be exercised early, just before the payout: worthwhile only if the dividend d exceeds the time value given up, in particular the interest X(1 − e<sup>−r(T − t)</sup>). An American put is never exercised just before a payout, and the incentive to exercise it early is smaller than without income.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>PV(X), not X</b>The tight lower bound of a call uses S − PV(X); S − X is only the intrinsic value.</div>
      <div className="pitfall"><b>Which side of the spread</b>For arbitrage bounds you buy at the ask and sell at the bid: the put’s ask is bounded by the call’s bid, its bid by the call’s ask.</div>
      <div className="pitfall"><b>American parity is an inequality</b>Do not apply c = p + S − PV(X) to American options; check S − X ≤ C − P ≤ S − PV(X).</div>
      <div className="pitfall"><b>Days and compounding</b>Convert days with /365 and months with /12 and discount with e<sup>−rT</sup> when rates are continuously compounded.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="1" />
    </div>
  );
}
