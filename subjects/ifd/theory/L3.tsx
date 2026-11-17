'use client';

import { Lab, LinePlot, fx, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L3() {
  return (
    <div className="theory">
      <p>Financing is not only about prices: the security you sell changes what you do afterwards and what investors can infer about you. Debt keeps the upside with the entrepreneur, which strengthens her incentives, and it is the security whose value depends least on what only she knows.</p>

      <h2 id="effort">Effort and the incentivizing power of debt</h2>
      <ol className="steps">
        <li><div><b>Own cash:</b> she keeps the whole gain from effort, so she chooses high effort if κ ≤ E<sub>H</sub>[V] − E<sub>L</sub>[V].</div></li>
        <li><div><b>Outside equity:</b> investors who expect high effort ask for α = I/E<sub>H</sub>[V]. She keeps 1 − α of the gain: κ ≤ (1 − α)(E<sub>H</sub>[V] − E<sub>L</sub>[V]).</div></li>
        <li><div><b>Debt:</b> F solves E<sub>H</sub>[min(F, V)] = I. She keeps everything above F: κ ≤ Σ(p<sub>H</sub> − p<sub>L</sub>) max(V − F, 0).</div></li>
        <li><div>Between the two thresholds only debt sustains high effort; above both, no financing does.</div></li>
      </ol>
      <p>Quiz: $100m investment, worth 125/75 with probability 0.6/0.4 under high effort and 125/75/0 with 0.5/0.4/0.1 under low effort. Own cash: 105 − 92.5 = 12.5. Equity: α = 100/105, κ ≤ (5/105) × 12.5 = 0.6. Debt: 0.6F + 0.4 × 75 = 100 gives F = 116.67, κ ≤ 0.6 × 8.33 − 0.5 × 8.33 = 0.83. Additional material: $70m, worth 200 or 32 with probability 0.75 or 0.25: equity up to κ = 46.79, debt up to 58.67.</p>

      <Lab title="How much outside money kills the incentive" hint="Two outcomes; high effort 75/25, low effort 25/75"
        controls={[
          { key: 'H', label: 'Value if successful', min: 100, max: 300, step: 5, value: 200, fmt: v => fx(v, 0) },
          { key: 'L', label: 'Value if not', min: 0, max: 80, step: 1, value: 32, fmt: v => fx(v, 0) },
        ]}
        caption="Solid: largest effort cost with debt; dashed: with outside equity; soft: with own cash. The more outside money needed, the lower both thresholds, but debt always keeps more of the incentive.">
        {v => {
          const ph = 0.75, pl = 0.25, Eh = ph * v.H + (1 - ph) * v.L, El = pl * v.H + (1 - pl) * v.L;
          const xs = range(1, Eh * 0.99, 150);
          const kE = (I: number) => (1 - I / Eh) * (Eh - El);
          const kD = (I: number) => { const F = I <= v.L ? I : (I - (1 - ph) * v.L) / ph; return (ph - pl) * Math.max(0, v.H - F) + ((1 - ph) - (1 - pl)) * Math.max(0, v.L - F); };
          return {
            plot: <LinePlot x={[0, Eh]} y={[0, (Eh - El) * 1.05]} xLabel="Outside money needed" yLabel="Largest effort cost κ" fmtX={t => fx(t, 0)} fmtY={t => fx(t, 0)}
              series={[{ label: 'own cash', pts: xs.map(I => [I, Eh - El]), style: 'soft' }, { label: 'equity', pts: xs.map(I => [I, kE(I)]), style: 'dash' }, { label: 'debt', pts: xs.map(I => [I, kD(I)]), style: 'strong' }]} />,
            readout: [['At 70: equity', fx(kE(70), 2)], ['At 70: debt', fx(kD(70), 2)]],
          };
        }}
      </Lab>

      <h2 id="info">Asymmetric information</h2>
      <p>Good and bad types need the same money; investors cannot tell them apart and price securities at the pooled value. Additional material: $60m needed, worth 90 or 40, good types succeed with 0.8, bad with 0.4, half each. Equity: α × 70 = 60, α = 6/7; a good type’s equity is underpriced by 6/7 × (80 − 70) = 8.57. Debt: 0.6F + 0.4 × 40 = 60, F = 73.33; underpriced by only 6.67 for a good type. Good types prefer the less information-sensitive security, debt. A bad type who issues equity reveals herself and gets a fair price, so she imitates the good types: everyone issues debt (pooling). With internal cash, good types would avoid mispricing altogether: the pecking order is internal funds, then debt, then equity.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Price on beliefs, incentives on the contract</b>Investors set α or F assuming high effort; then check whether, with that α or F, she still prefers high effort.</div>
      <div className="pitfall"><b>Gain from effort under debt</b>Compare her expected payoff above F under the two effort levels; only states where V &gt; F count.</div>
      <div className="pitfall"><b>Underpricing is the good type’s loss</b>It is the value of the security sold under her true probabilities minus the money received.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="3" />
    </div>
  );
}
