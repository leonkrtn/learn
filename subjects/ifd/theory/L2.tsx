'use client';

import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';
import { RATINGS, ratingOf } from '../generators';

export default function L2() {
  return (
    <div className="theory">
      <p>A bond promises a face value but pays only what the firm has. Pricing it means taking the expected payoff, state by state, and discounting it at a rate that fits its systematic risk. The promised yield is then higher than the expected return; the gap to the risk-free rate is the default spread, which maps to a credit rating.</p>

      <h2 id="price">Pricing risky debt</h2>
      <ol className="steps">
        <li><div>In each state the bond pays min(F, V): the face value, or the whole firm in default.</div></li>
        <li><div>If the cash flows are uncorrelated with the market, the debt has a beta of zero and B<sub>0</sub> = E[min(F, V)]/(1 + r<sub>f</sub>).</div></li>
        <li><div>To raise I, solve for F. With two states and default in the low one: F = [I(1 + r<sub>f</sub>) − (1 − p)V<sub>L</sub>]/p.</div></li>
        <li><div>Yield y = F/B<sub>0</sub> − 1, default spread y − r<sub>f</sub>; match it to the rating with the closest typical spread (Lecture 2, slide 22).</div></li>
        <li><div>Equity is worth E[max(V − F, 0)]/(1 + r<sub>f</sub>), which equals project value minus the debt raised.</div></li>
      </ol>
      <p>Meridian Industries (additional material): face value 75, payoff 75 with probability 0.75 and 60 otherwise, r<sub>f</sub> = 3%: B<sub>0</sub> = (0.75 × 75 + 0.25 × 60)/1.03 = 69.175, y = 8.42%, spread 5.42%, closest to B. Arden (quiz): €60m raised, cash flow 100 or 54, r<sub>f</sub> = 5%: F = (63 − 27)/0.5 = €72m, y = 20%, spread 15%, CC; equity 0.5 × 28/1.05 = €13.33m.</p>

      <Lab title="How much you borrow drives the spread" hint="Two equally likely states, zero-beta cash flows"
        controls={[
          { key: 'H', label: 'Cash flow if demand is high', min: 60, max: 200, step: 1, value: 100, fmt: v => fx(v, 0) },
          { key: 'L', label: 'Cash flow if demand is low', min: 10, max: 100, step: 1, value: 54, fmt: v => fx(v, 0) },
          { key: 'rf', label: 'Risk-free rate', min: 0, max: 0.08, step: 0.005, value: 0.05, fmt: v => pct(v, 1) },
          { key: 'I', label: 'Amount raised with debt', min: 5, max: 120, step: 1, value: 60, fmt: v => fx(v, 0) },
        ]}
        caption="Below L/(1 + r_f) the debt is safe and the spread is zero. Above it the low state defaults and the face value, and with it the spread, rises steeply.">
        {v => {
          const maxI = (0.5 * v.H + 0.5 * v.L) / (1 + v.rf) * 0.999;
          const spread = (I: number) => {
            const need = I * (1 + v.rf);
            const F = need <= v.L ? need : (need - 0.5 * v.L) / 0.5;
            return F / I - 1 - v.rf;
          };
          const top = maxI;
          const xs = range(1, top, 160);
          const I = Math.min(v.I, maxI), s = spread(I);
          return {
            plot: <LinePlot x={[0, top]} y={[0, 0.4]} xLabel="Amount raised" yLabel="Default spread" fmtX={t => fx(t, 0)} fmtY={t => pct(t, 0)}
              series={[{ label: 'spread', pts: xs.map(x => [x, Math.min(0.4, spread(x))]), style: 'strong' }]} vline={{ x: I, label: 'chosen amount' }} />,
            readout: [['Default spread', v.I > maxI ? 'cannot raise this much' : pct(s, 2)], ['Closest rating', v.I > maxI ? '—' : RATINGS[ratingOf(s)][0]]],
          };
        }}
      </Lab>

      <h2 id="seniority">Seniority</h2>
      <p>Subordinated (junior) debt is repaid only after senior debt. If a firm funds a new project with junior debt, the extra cash flow in the bad state goes first to the senior bondholders: their bonds become safer, their price rises and their rating improves, while the junior bonds need a high face value. In the Arden quiz the second project (€10m, adding 20 or 8) lifts the senior bonds from CC to B−, the junior face value is €21m and equity falls from €13.33m to €12.86m: part of the project’s value went to the senior bondholders.</p>

      <h2 id="conv">Straight versus convertible debt</h2>
      <p>A convertible with principal K lets bondholders take x new shares instead: payoff max(min(K, V), x/(n + x) × V). They convert in the states where the firm is valuable. Solve E[payoff] = I for x. In a perfect market both securities are fairly priced, so the share price after the announcement is (existing value + NPV)/shares in either case: shareholders are indifferent. Bankruptcy costs change that only where default can occur: a straight bond with F above the bad-state value defaults, a convertible with a lower principal may never default.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Discount the expected payoff, not the face value</b>The face value is promised, not expected. With zero beta, discount the expected payoff at r<sub>f</sub>.</div>
      <div className="pitfall"><b>Yield on the price, not on the face value</b>y = F/B<sub>0</sub> − 1. For new debt B<sub>0</sub> is the amount raised; for existing debt use its new price.</div>
      <div className="pitfall"><b>Junior debt in the bad state</b>Senior debt takes the bad-state cash flow first; the junior bonds often get nothing there.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="2" />
    </div>
  );
}
