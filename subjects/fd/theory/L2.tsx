'use client';

import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';
import { STRATS, bs, payoff } from '../generators';

export default function L2() {
  return (
    <div className="theory">
      <p>By combining options in a portfolio you can build almost any exposure to the underlying. Every strategy is read the same way: the payoff of each leg at maturity, their sum, and the initial cash flow measured at the maturity date, FV = CF<sub>0</sub>e<sup>rT</sup>. The net payoff is the sum plus FV.</p>

      <h2 id="range">Bets on a direction within a range</h2>
      <ol className="steps">
        <li><div><b>Bear spread with calls:</b> sell a call with strike X<sub>1</sub>, buy one with X<sub>2</sub> &gt; X<sub>1</sub>. Cash inflow c(X<sub>1</sub>) − c(X<sub>2</sub>) &gt; 0; pays −(X<sub>2</sub> − X<sub>1</sub>) at worst. Gains when the share falls.</div></li>
        <li><div><b>Bull spread with puts:</b> buy a put with X<sub>1</sub>, sell one with X<sub>2</sub> &gt; X<sub>1</sub>. Cash inflow p(X<sub>2</sub>) − p(X<sub>1</sub>) &gt; 0. Gains when the share rises.</div></li>
        <li><div>The mirror images, a bull spread with calls and a bear spread with puts, cost money up front. Buying n spreads scales the payoff; using out-of-the-money strikes moves it to other share prices.</div></li>
      </ol>

      <h2 id="vol">Bets on volatility or on stability</h2>
      <ol className="steps">
        <li><div><b>Straddle:</b> buy a call and a put with the same strike (choose X ≈ S<sub>t</sub>). Costs c + p; pays when the share moves far either way.</div></li>
        <li><div><b>Inverted straddle:</b> sell both. Receives c + p; loses without limit on a big move.</div></li>
        <li><div><b>Butterfly spread:</b> buy one option with X<sub>1</sub>, sell two with X<sub>2</sub>, buy one with X<sub>3</sub> (symmetric if X<sub>2</sub> = (X<sub>1</sub> + X<sub>3</sub>)/2). Its initial cash flow, 2c(X<sub>2</sub>) − c(X<sub>1</sub>) − c(X<sub>3</sub>), is negative; a bet on stability with limited risk.</div></li>
        <li><div><b>Inverted strangle:</b> sell a put with X<sub>1</sub> and a call with X<sub>2</sub>: an inflow, flat top between the strikes. <b>Strangle</b>: buy both, cheaper than a straddle.</div></li>
        <li><div><b>Calendar spread:</b> sell a call maturing at T, buy one with the same strike maturing at T* &gt; T. Its value at T peaks near X.</div></li>
        <li><div>To bet on volatility with limited risk use the reverses: reverse butterfly, strangle, reverse calendar spread.</div></li>
      </ol>
      <p>Worked example (problem set 1, exercise 2B): calls with strikes 15, 17.5, 20 ask 4.60 and 0.70, bid 2 at 17.5; puts ask 7 and 8.22, bid 7.25 at 17.5. With calls the butterfly costs 4.60 + 0.70 − 2 × 2 = 1.30, with puts 7 + 8.22 − 2 × 7.25 = 0.72: build it with puts. FV(0.72) = 0.72e<sup>0.08 × 0.25</sup> = 0.735, so the net payoff is −0.735 outside 15–20 and peaks at 2.5 − 0.735 = 1.765 at 17.5.</p>

      <Lab title="Payoff of an option strategy" hint="Net payoff at maturity and value before maturity (Black-Scholes)"
        controls={[
          { key: 'k', label: 'Strategy', min: 0, max: STRATS.length - 1, step: 1, value: 8, fmt: v => STRATS[v].name },
          { key: 'h', label: 'Strike spacing', min: 1, max: 15, step: 0.5, value: 5, fmt: v => fx(v, 1) },
          { key: 'T', label: 'Months to maturity', min: 1, max: 12, step: 1, value: 3, fmt: v => fx(v, 0) },
          { key: 's', label: 'Volatility', min: 0.1, max: 0.6, step: 0.05, value: 0.3, fmt: v => pct(v, 0) },
        ]}
        caption="Strikes are centred on 50 (share at 50, r = 5%). The blue line is the net payoff at maturity including the future value of the initial cash flow; the grey line is the value of the position, net of that cash flow, one month before maturity.">
        {v => {
          const st = STRATS[v.k], S0 = 50, r = 0.05, T = v.T / 12;
          const xs = st.n === 1 ? [S0] : st.n === 2 ? [S0 - v.h, S0 + v.h] : [S0 - v.h, S0, S0 + v.h];
          const legs = st.legs(xs), price = (S: number, t: number) => legs.reduce((a, l) => { const b = bs(S, l.X, Math.max(t, 1e-6), r, v.s); return a + l.q * (l.k === 'c' ? b.c : b.p); }, 0);
          const cf0 = -price(S0, T), fv = cf0 * Math.exp(r * T), grid = range(20, 80, 160);
          const net = (S: number) => payoff(legs, S) + fv, before = (S: number) => price(S, 1 / 12) + cf0 * Math.exp(r * (T - 1 / 12));
          const ys = grid.map(net), lo = Math.min(...ys, -1), hi = Math.max(...ys, 1);
          return {
            plot: <LinePlot x={[20, 80]} y={[Math.max(lo, -25), Math.min(hi, 25)]} xLabel="Share price" yLabel="Net payoff" fmtX={t => fx(t, 0)} fmtY={t => fx(t, 0)}
              series={[{ label: 'at maturity', pts: grid.map(S => [S, net(S)] as [number, number]), style: 'strong' as const }, ...(T > 1 / 12 ? [{ label: '1 month before', pts: grid.map(S => [S, before(S)] as [number, number]), style: 'soft' as const }] : [])]} />,
            readout: [['Initial cash flow', fx(cf0, 2)], ['Future value at maturity', fx(fv, 2)], ['Bets on', st.view]],
          };
        }}
      </Lab>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Sign of the initial cash flow</b>Buying an option is an outflow, selling one an inflow. Write the total before you plot it.</div>
      <div className="pitfall"><b>Future value</b>Payoff diagrams with the initial cash flow shift by CF<sub>0</sub>e<sup>rT</sup>, not by CF<sub>0</sub>.</div>
      <div className="pitfall"><b>Bid and ask</b>Build a strategy at the prices you trade at: buy at the ask, sell at the bid. That decides whether calls or puts are cheaper.</div>
      <div className="pitfall"><b>Payoff tables</b>List one row per interval between strikes and give the formula in S<sub>T</sub> for each; check continuity at the strikes.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="2" />
    </div>
  );
}
