'use client';

import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L3() {
  return (
    <div className="theory">
      <p>If debt only brought tax savings, every firm would borrow until interest equals EBIT. Real firms stop well before that, because default destroys value. This lecture prices that destruction and weighs it against the tax shield.</p>

      <h2 id="distress">The argument in five steps</h2>
      <ol className="steps">
        <li><div>In a perfect market, default just hands the assets to the lenders. Total value to investors is the same either way, so the risk of bankruptcy alone is no cost.</div></li>
        <li><div>In practice default burns value: direct costs (lawyers, courts, about 3–4% of assets) and larger indirect costs (customers, suppliers and staff leave, assets are sold cheaply).</div></li>
        <li><div>Lenders anticipate these losses and pay less for the debt today. The original shareholders therefore bear the present value of distress costs, through a lower share price.</div></li>
        <li><div>Expected cost = probability of default × cost if default, discounted. Volatile cash flows and intangible assets raise both terms.</div></li>
        <li><div><b>Trade-off theory:</b> V<sub>L</sub> = V<sub>U</sub> + PV(ITS) − PV(distress costs). The optimal debt maximizes the net benefit.</div></li>
      </ol>

      <h2 id="pricing">Pricing risky debt in a two-state world</h2>
      <p>Debt with face value F pays F if the firm is worth more than F, otherwise the firm’s value minus the distress costs. Discount the expected payoff at r<sub>f</sub> when the risk is diversifiable. Equity gets max(0, V − F). Value of the levered firm = D + E; the gap to V<sub>U</sub> is the PV of distress costs. The debt’s yield to maturity F/D − 1 exceeds its expected return.</p>

      <Lab title="Trade-off theory: finding the optimal debt" hint="Optimal debt sits where the marginal tax shield equals the marginal distress cost"
        controls={[
          { key: 'tc', label: 'Corporate tax τc', min: 0.1, max: 0.4, step: 0.01, value: 0.25, fmt: v => pct(v, 0) },
          { key: 'd0', label: 'Debt with no distress risk (€m)', min: 0, max: 60, step: 5, value: 20, fmt: v => fx(v, 0) },
          { key: 'k', label: 'Distress cost severity', min: 0.2, max: 2, step: 0.05, value: 0.8, fmt: v => fx(v, 2) },
        ]}
        caption="PV(financial distress costs) is zero up to the safe debt level and rises with the square of the excess. The dot marks the maximum of the net benefit.">
        {v => {
          const fdc = (d: number) => v.k * Math.pow(Math.max(0, d - v.d0), 2) / 100;
          const net = (d: number) => v.tc * d - fdc(d);
          const xs = range(0, 100);
          const best = xs.reduce((b, d) => net(d) > net(b) ? d : b, 0);
          return {
            plot: <LinePlot x={[0, 100]} y={[0, 30]} xLabel="Debt (€ million)" yLabel="Present value (€ million)" fmtX={t => fx(t, 0)} fmtY={t => fx(t, 0)}
              series={[
                { label: 'PV(ITS)', pts: xs.map(d => [d, v.tc * d]), style: 'soft' },
                { label: 'PV(FDC)', pts: xs.map(d => [d, fdc(d)]), style: 'dash' },
                { label: 'net benefit', pts: xs.map(d => [d, Math.max(0, net(d))]), style: 'strong' },
              ]}
              vline={{ x: best, label: 'optimum ' + fx(best, 0) }}
              marker={[{ x: best, y: net(best) }]} />,
            readout: [['Optimal debt', '€' + fx(best, 1) + 'm'], ['PV(ITS) there', '€' + fx(v.tc * best, 1) + 'm'], ['PV(FDC) there', '€' + fx(fdc(best), 1) + 'm'], ['Net benefit', '€' + fx(net(best), 1) + 'm']],
          };
        }}
      </Lab>

      <h2>Worked example</h2>
      <p>A venture is worth €200m (success) or €80m (failure), each with 50%, r<sub>f</sub> = 5%, risk diversifiable. Debt has face value €120m; distress costs are 20% of assets in default.</p>
      <ol className="steps">
        <li><div>V<sub>U</sub> = (0.5 × 200 + 0.5 × 80) / 1.05 = €133.33m.</div></li>
        <li><div>Debt pays 120 or 80 × 0.8 = 64: D = (60 + 32) / 1.05 = €87.62m. Equity pays 80 or 0: E = 40 / 1.05 = €38.10m.</div></li>
        <li><div>V<sub>L</sub> = €125.71m, so PV(distress costs) = 0.5 × 16 / 1.05 = €7.62m, borne by today’s shareholders. YTM = 120 / 87.62 − 1 = 36.95%.</div></li>
      </ol>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Who pays</b>Not the lenders. With fairly priced debt, shareholders pay the expected distress costs up front.</div>
      <div className="pitfall"><b>YTM vs. expected return</b>The promised yield assumes no default. The expected return on zero-beta debt is r<sub>f</sub>.</div>
      <div className="pitfall"><b>Economic distress</b>The fall in asset value on failure happens with or without debt; only the extra loss caused by default counts as a distress cost.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="3" />
    </div>
  );
}
