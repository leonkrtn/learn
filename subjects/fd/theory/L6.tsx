'use client';

import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L6() {
  return (
    <div className="theory">
      <p>A forward is an obligation to buy or sell the underlying at a fixed price on a future date; a future is the same contract traded on an exchange and settled every day. Both are priced by the cost of carrying the asset until delivery. A swap exchanges one stream of payments for another and is valued as a portfolio of bonds or forwards.</p>

      <h2 id="forward">Forward prices by cost of carry</h2>
      <ol className="steps">
        <li><div><b>No income:</b> F<sub>0</sub> = S<sub>0</sub>e<sup>rT</sup>. If F is higher, borrow, buy the asset and sell forward (cash and carry); if lower, short the asset, invest and buy forward.</div></li>
        <li><div><b>Known income</b> with present value I: F<sub>0</sub> = (S<sub>0</sub> − I)e<sup>rT</sup>. <b>Yield q</b>: F<sub>0</sub> = S<sub>0</sub>e<sup>(r − q)T</sup>. <b>Currency</b>: F<sub>0</sub> = S<sub>0</sub>e<sup>(r − r<sub>f</sub>)T</sup>.</div></li>
        <li><div><b>Commodities:</b> F<sub>0</sub> = S<sub>0</sub>e<sup>(r + u − y)T</sup> with storage cost u and convenience yield y; for consumption goods only the cash-and-carry bound is enforceable.</div></li>
        <li><div><b>Value</b> of a long forward with delivery price K: f = (F<sub>0</sub> − K)e<sup>−rT</sup> = S<sub>0</sub>e<sup>−qT</sup> − Ke<sup>−rT</sup>; zero when it is written.</div></li>
      </ol>

      <h2 id="futures">Futures: margins and hedging</h2>
      <ol className="steps">
        <li><div>Each day gains and losses go through the margin account. Below the maintenance margin the investor gets a margin call and must restore the initial margin.</div></li>
        <li><div><b>Minimum-variance hedge:</b> h* = ρ σ<sub>S</sub>/σ<sub>F</sub>, contracts N* = h* Q<sub>A</sub>/Q<sub>F</sub>. Short futures hedge a future sale, long futures a future purchase.</div></li>
        <li><div><b>Index futures</b> change a portfolio’s beta: N = (β* − β)V/(F × multiplier); β* = 0 hedges completely.</div></li>
      </ol>

      <h2 id="swaps">Interest rate swaps</h2>
      <p>The receiver of fixed holds a fixed-rate bond and is short a floating-rate bond: V = B<sub>fix</sub> − B<sub>fl</sub>. Right after a reset the floating bond is worth its notional. With discount factors DF<sub>t</sub>, the par swap rate is s = (1 − DF<sub>n</sub>)/Σ DF<sub>t</sub>, and an existing swap with fixed rate K is worth (K − s) × notional × Σ DF<sub>t</sub> to the receiver of fixed.</p>

      <Lab title="Forward price and the cost of carry" hint="Forward price for delivery dates up to three years"
        controls={[
          { key: 'S', label: 'Spot price', min: 50, max: 150, step: 1, value: 100, fmt: v => fx(v, 0) },
          { key: 'r', label: 'Risk-free rate', min: 0, max: 0.1, step: 0.005, value: 0.04, fmt: v => pct(v, 1) },
          { key: 'q', label: 'Income yield or convenience yield', min: 0, max: 0.1, step: 0.005, value: 0.02, fmt: v => pct(v, 1) },
          { key: 'u', label: 'Storage cost', min: 0, max: 0.08, step: 0.005, value: 0, fmt: v => pct(v, 1) },
          { key: 'K', label: 'Delivery price of an old contract', min: 50, max: 150, step: 1, value: 100, fmt: v => fx(v, 0) },
        ]}
        caption="When the carry r + u − y is positive the forward curve slopes up (contango); when the yield exceeds the financing and storage cost it slopes down (backwardation). The old contract is worth (F − K)e^(−rT).">
        {v => {
          const ts = range(0, 3, 60), F = (t: number) => v.S * Math.exp((v.r + v.u - v.q) * t), f1 = (F(1) - v.K) * Math.exp(-v.r);
          const ys = ts.map(F);
          return {
            plot: <LinePlot x={[0, 3]} y={[Math.min(...ys, v.K) * 0.95, Math.max(...ys, v.K) * 1.05]} xLabel="Years to delivery" yLabel="Forward price" fmtX={t => fx(t, 1)} fmtY={t => fx(t, 0)}
              series={[{ label: 'forward price', pts: ts.map((t, i) => [t, ys[i]] as [number, number]), style: 'strong' }, { label: 'K', pts: [[0, v.K], [3, v.K]], style: 'dash' }]} />,
            readout: [['1-year forward', fx(F(1), 2)], ['Value of the long contract (1 year)', fx(f1, 2)], ['Carry r + u − y', pct(v.r + v.u - v.q, 1)]],
          };
        }}
      </Lab>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Forward price versus value</b>The forward price is the K that gives a new contract zero value; an existing contract is worth (F<sub>0</sub> − K)e<sup>−rT</sup>.</div>
      <div className="pitfall"><b>Margin calls</b>A call tops the account up to the initial margin, not to the maintenance level.</div>
      <div className="pitfall"><b>Sign of the hedge</b>Owning (or going to sell) the asset is hedged with short futures; a negative N means sell contracts.</div>
      <div className="pitfall"><b>Swap side</b>State whose value you report: receiving fixed is worth B<sub>fix</sub> − B<sub>fl</sub>, paying fixed the opposite.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="6" />
    </div>
  );
}
