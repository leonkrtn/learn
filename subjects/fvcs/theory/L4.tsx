'use client';

import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L4() {
  return (
    <div className="theory">
      <p>Managers decide on behalf of shareholders, and shareholders hold an option-like claim on the firm once debt is large. That makes them want things that lower total firm value. This lecture works through the three ways that happens, and the ways debt also disciplines managers.</p>

      <h2 id="costs">Agency costs of debt</h2>
      <ol className="steps">
        <li><div><b>Asset substitution.</b> Near default, equity keeps the upside of a gamble while debt holders absorb the downside. Shareholders can gain from a risky project even if its NPV is negative; firm value falls.</div></li>
        <li><div><b>Debt overhang.</b> A safe positive-NPV project that shareholders must fund mostly raises the value of the debt. If their gain is below the money they put in, they refuse, and value is lost.</div></li>
        <li><div><b>Cashing out.</b> Selling assets below value and paying the cash as a dividend helps equity at the lenders’ expense.</div></li>
        <li><div>Lenders anticipate all three and charge for them, so the shareholders bear the agency costs through the price of the debt.</div></li>
        <li><div>Remedies: short maturities, covenants (at the cost of flexibility), and keeping leverage away from the distress zone.</div></li>
      </ol>

      <h2 id="overhang">Debt overhang in numbers</h2>
      <p>Equity funds investment I today. Without it, assets are worth A in a year; with it, B. Debt face value F is due in a year. Equity’s gain from investing:</p>
      <div className="eqline">gain = <span className="up">max</span>(0, B − F)/(1 + r) − I − <span className="up">max</span>(0, A − F)/(1 + r)</div>
      <p>When F ≤ A the gain equals the project NPV. Once F &gt; A, part of the increase goes to repaying lenders who would otherwise have taken a loss.</p>

      <Lab title="Debt overhang: when shareholders stop funding a good project" hint="Raise the debt and watch the shareholders’ gain fall below zero"
        controls={[
          { key: 'A', label: 'Asset value without investment (€m)', min: 20, max: 100, step: 5, value: 50, fmt: v => fx(v, 0) },
          { key: 'I', label: 'Investment today (€m)', min: 5, max: 40, step: 1, value: 20, fmt: v => fx(v, 0) },
          { key: 'up', label: 'Value added in one year (€m)', min: 10, max: 60, step: 1, value: 30, fmt: v => fx(v, 0) },
          { key: 'r', label: 'Risk-free rate', min: 0, max: 0.1, step: 0.005, value: 0.05, fmt: v => pct(v, 1) },
        ]}
        caption="Dashed: NPV of the project, the same for every debt level. Solid: what shareholders gain by funding it. Where the solid line crosses zero is the largest debt at which they still invest.">
        {v => {
          const d = 1 + v.r, B = v.A + v.up;
          const npv = -v.I + v.up / d;
          const gain = (F: number) => Math.max(0, B - F) / d - v.I - Math.max(0, v.A - F) / d;
          const maxF = 2 * v.A + 20;
          const xs = range(0, maxF, 200);
          const crossing = gain(0) > 0 ? Math.max(v.A, B - v.I * d) : 0;
          return {
            plot: <LinePlot x={[0, maxF]} y={[-v.I - 2, Math.max(npv, 5) + 5]} xLabel="Face value of debt due in one year (€ million)" yLabel="€ million today" fmtX={t => fx(t, 0)} fmtY={t => fx(t, 0)}
              series={[
                { label: 'project NPV', pts: xs.map(F => [F, npv]), style: 'dash' },
                { label: 'gain to equity', pts: xs.map(F => [F, gain(F)]), style: 'strong' },
                { label: 'zero', pts: xs.map(F => [F, 0]), style: 'soft' },
              ]}
              vline={npv > 0 && gain(0) > 0 ? { x: crossing, label: 'equity stops investing' } : undefined} />,
            readout: [['Project NPV', '€' + fx(npv, 2) + 'm'], ['Funded up to debt of', npv > 0 ? '€' + fx(crossing, 1) + 'm' : 'never (NPV < 0)']],
          };
        }}
      </Lab>

      <h2 id="benefits">Agency benefits of debt</h2>
      <p>The other side of leverage: debt lets founders raise money without giving up ownership, commits managers to pay out cash they might otherwise waste (the free cash flow hypothesis), gives lenders reason to monitor, and makes underperforming managers easier to remove. With waste rate w of net income, each €1 of interest costs shareholders only (1 − τ<sub>c</sub>)(1 − w), so total payouts rise by 1 − (1 − τ<sub>c</sub>)(1 − w).</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Which imperfection</b>Agency costs of debt: managers maximize equity value, not firm value. Agency benefits: managers act in their own interest. Two different answers.</div>
      <div className="pitfall"><b>Including the remaining assets</b>In asset substitution questions, add the asset that stays with the firm to every state before splitting between debt and equity.</div>
      <div className="pitfall"><b>Ratchet</b>A firm with too much debt will not deleverage on its own: debt holders capture more than the gain in firm value.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="4" />
    </div>
  );
}
