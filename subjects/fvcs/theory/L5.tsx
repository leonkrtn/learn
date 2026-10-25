'use client';

import { Lab, LinePlot, fx, pct } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L5() {
  return (
    <div className="theory">
      <p>Managers know more about the firm than outside investors do. Investors know that, so they read every financing decision as a message. This lecture asks which messages are believable and what that does to the cost of each source of funds.</p>

      <h2 id="lemons">The argument in five steps</h2>
      <ol className="steps">
        <li><div><b>Credibility principle:</b> a self-interested claim is believed only if acting on it would be too costly when the claim is false.</div></li>
        <li><div>Leverage can be such an action. Debt above the value in the bad state means default if things go badly; a manager who expects the bad state would not take it on.</div></li>
        <li><div><b>Lemons principle:</b> when a better-informed seller offers to sell, buyers suspect the asset is worth less and lower their price. Sellers of good assets then withdraw, and the price falls further.</div></li>
        <li><div>For equity issues this means the price drops on announcement, rises before issues, and issues cluster right after earnings releases when the information gap is smallest.</div></li>
        <li><div><b>Pecking order:</b> retained earnings first, then debt, then equity as a last resort. Profitable firms end up with low leverage.</div></li>
      </ol>

      <Lab title="Adverse selection: how far the price unravels" hint="Three equally likely values; the CEO sells only if the price beats (1 − d) × true value"
        controls={[
          { key: 'low', label: 'Lowest value per share (€)', min: 20, max: 100, step: 5, value: 60, fmt: v => fx(v, 0) },
          { key: 'step', label: 'Gap between values (€)', min: 5, max: 30, step: 5, value: 20, fmt: v => fx(v, 0) },
          { key: 'd', label: 'Diversification benefit d', min: 0, max: 0.4, step: 0.01, value: 0.1, fmt: v => pct(v, 0) },
        ]}
        caption="Each round investors drop the highest value from the set of possible sellers if the CEO would not sell at the current price. The price settles where every remaining type is willing to sell.">
        {v => {
          let S = [v.low + 2 * v.step, v.low + v.step, v.low];
          const prices: number[] = [];
          for (;;) {
            const p = S.reduce((a, b) => a + b, 0) / S.length;
            prices.push(p);
            if (S.length > 1 && (1 - v.d) * S[0] > p + 1e-9) S = S.slice(1); else break;
          }
          const fin = prices[prices.length - 1];
          return {
            plot: <LinePlot x={[0, Math.max(2, prices.length - 1)]} y={[v.low - 10, v.low + 2 * v.step + 10]} xLabel="Round of investor updating" yLabel="Share price (€)" fmtX={t => Number.isInteger(t) ? 'round ' + t : ''} fmtY={t => fx(t, 0)} height={260}
              series={[
                { label: 'price', pts: prices.map((p, i) => [i, p] as [number, number]), style: 'strong' },
              ]}
              marker={prices.map((p, i) => ({ x: i, y: p, label: '€' + fx(p, 2) }))} />,
            readout: [['Final price', '€' + fx(fin, 2)], ['CEO sells if true value is', S.map(x => '€' + fx(x, 0)).join(', ')]],
          };
        }}
      </Lab>

      <h2>Cost of each source to current shareholders</h2>
      <p>To raise A: retained earnings cost A. Debt at a rate above the fair one costs A × (1 + charged)/(1 + fair). Equity underpriced by u costs A / (1 − u), because the new shares are worth more than the cash received. Compare the three and rank them; the threshold where equity matches debt is u = 1 − A / cost of debt.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Signal size</b>A small amount of debt is cheap to fake. Only debt that would cause distress in the bad state is credible.</div>
      <div className="pitfall"><b>Pecking order and leverage</b>Low leverage under the pecking order points to high profitability, but the prediction is not clean: retained earnings are equity too.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="5" />
    </div>
  );
}
