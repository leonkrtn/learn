'use client';

import { Frac } from '@/components/Frac';
import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L4() {
  return (
    <div className="theory">
      <p>Security analysts produce alphas. Treynor-Black turns them into portfolio weights; Black-Litterman turns broader views into revised expected returns. Both work on paper and both go wrong in practice for the same reason: forecasts are noisy.</p>

      <h2 id="tb">Treynor-Black step by step</h2>
      <ol className="steps">
        <li><div>Each stock gets w<sub>i</sub>⁰ = α<sub>i</sub>/σ²(e<sub>i</sub>); rescale so the weights sum to one. Negative alphas become short positions.</div></li>
        <li><div>The active portfolio has α<sub>A</sub> = Σw<sub>i</sub>α<sub>i</sub>, β<sub>A</sub> = Σw<sub>i</sub>β<sub>i</sub> and σ²(e<sub>A</sub>) = Σw²<sub>i</sub>σ²(e<sub>i</sub>) (uncorrelated residuals).</div></li>
        <li><div>Initial weight: w<sub>A</sub>⁰ = [α<sub>A</sub>/σ²(e<sub>A</sub>)] / [E(R<sub>M</sub>)/σ²<sub>M</sub>]. Beta adjustment: w<sub>A</sub>* = w<sub>A</sub>⁰ / [1 + (1 − β<sub>A</sub>)w<sub>A</sub>⁰]; the rest goes to the index.</div></li>
        <li><div>The optimal risky portfolio has β<sub>P</sub> = 1 − w<sub>A</sub>* + w<sub>A</sub>*β<sub>A</sub>, σ²<sub>P</sub> = β²<sub>P</sub>σ²<sub>M</sub> + w<sub>A</sub>*²σ²(e<sub>A</sub>) and SR²<sub>P</sub> = SR²<sub>M</sub> + IR²<sub>A</sub>.</div></li>
        <li><div>Benchmark risk: σ(T<sub>E</sub>) = w<sub>A</sub>*√[(1 − β<sub>A</sub>)²σ²<sub>M</sub> + σ²(e<sub>A</sub>)].</div></li>
      </ol>

      <Lab title="Treynor-Black: how much to put in the active portfolio" hint="Sharpe ratio of index plus active portfolio, by weight in the active part"
        controls={[
          { key: 'a', label: 'Alpha of active portfolio', min: 0.005, max: 0.08, step: 0.0025, value: 0.04, fmt: v => pct(v, 2) },
          { key: 'se', label: 'Residual SD', min: 0.02, max: 0.3, step: 0.01, value: 0.17, fmt: v => pct(v, 0) },
          { key: 'b', label: 'Beta of active portfolio', min: -1, max: 2, step: 0.05, value: -0.5, fmt: v => fx(v, 2) },
          { key: 'mrp', label: 'Market risk premium', min: 0.03, max: 0.1, step: 0.005, value: 0.06, fmt: v => pct(v, 1) },
          { key: 'sm', label: 'Market SD', min: 0.1, max: 0.25, step: 0.01, value: 0.12, fmt: v => pct(v, 0) },
        ]}
        caption="The curve peaks exactly at the Treynor-Black weight w*. The defaults reproduce sample exam question 20: w* = 22.2% and the Sharpe ratio rises from 0.5 to 0.553.">
        {v => {
          const sr = (w: number) => { const b = 1 - w + w * v.b, er = b * v.mrp + w * v.a, sd = Math.sqrt(b * b * v.sm * v.sm + w * w * v.se * v.se); return er / sd; };
          const w0 = (v.a / (v.se * v.se)) / (v.mrp / (v.sm * v.sm)), ws = w0 / (1 + (1 - v.b) * w0);
          const srM = v.mrp / v.sm, srP = Math.sqrt(srM * srM + (v.a / v.se) ** 2);
          const lo = Math.min(-0.5, ws - 0.6), hi = Math.max(1, ws + 0.6);
          const pts = range(lo, hi, 120).map(w => [w, sr(w)] as [number, number]);
          const yMin = Math.min(0, ...pts.map(p => p[1]));
          return {
            plot: <LinePlot x={[lo, hi]} y={[yMin, Math.max(1, srP * 1.1)]} xLabel="Weight in the active portfolio" yLabel="Sharpe ratio" fmtX={t => fx(t, 1)} fmtY={t => fx(t, 2)}
              series={[{ label: 'Sharpe ratio', pts, style: 'strong' }, { label: 'index only', pts: [[lo, srM], [hi, srM]], style: 'dash' }]}
              marker={[{ x: ws, y: sr(ws), label: 'w* = ' + fx(ws, 3) }]} />,
            readout: [['w₀', fx(w0, 3)], ['w*', fx(ws, 3)], ['SR of index', fx(srM, 3)], ['SR of optimum', fx(srP, 3)], ['Benchmark risk', pct(Math.abs(ws) * Math.sqrt((1 - v.b) ** 2 * v.sm * v.sm + v.se * v.se), 2)]],
          };
        }}
      </Lab>

      <h2 id="fixes">Why the textbook portfolio is unusable, and three fixes</h2>
      <p>With analysts’ target prices as alphas, Treynor-Black produces Sharpe ratios above 2 with extreme long-short positions and mostly specific risk. Fixes: cap the active weight (w<sub>A</sub> ≤ 1), cap benchmark risk, and shrink alphas for forecast precision. Kane, Kim and White regress realised on forecast alphas and find an R² of about 0.001; multiplying alphas by R² scales the active weight down but leaves the relative stock weights unchanged.</p>

      <h2 id="bl">Black-Litterman</h2>
      <ol className="steps">
        <li><div>Estimate Σ from about 60 months of returns.</div></li>
        <li><div>Infer baseline returns from market weights: σ²<sub>M</sub> = w′Σw, E[R<sub>M</sub>] = Āσ²<sub>M</sub>, E<sub>b</sub>[R<sub>i</sub>] = β<sub>i</sub>E[R<sub>M</sub>] with β<sub>i</sub> = cov(R<sub>i</sub>, R<sub>M</sub>)/σ²<sub>M</sub>.</div></li>
        <li><div>State the view Q (e.g. E[R<sub>B</sub>] − E[R<sub>S</sub>]) and its standard deviation σ<sub>ε</sub>; the baseline value of the view is Q<sub>E</sub> = P′R<sub>E</sub> with variance P′Σ<sub>F</sub>P, Σ<sub>F</sub> = τΣ, τ = 0.01.</div></li>
        <li><div>Posterior: R* = R<sub>E</sub> + (D/σ²<sub>D</sub>)Σ<sub>F</sub>P with D = Q − Q<sub>E</sub> and σ²<sub>D</sub> = σ²<sub>ε</sub> + P′Σ<sub>F</sub>P.</div></li>
        <li><div>Optimise with the revised returns. High confidence plus a wrong view is the worst case.</div></li>
      </ol>

      <h2 id="fee">What is active management worth?</h2>
      <div className="eqline">f = <Frac n="1" d="2A" /> <span className="up">Σ</span> IR²<sub>i</sub></div>
      <p>The fee grows with the number of stocks covered, so even tiny information ratios matter for large universes. PS 4, Q6: 100 stocks, α = 1% with R² = 5%, σ<sub>e</sub> = 6%, A = 3, $50m: f = 100 × (0.0005/0.06)²/6 × 50m = $57,870.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Residual, not total variance</b>Stock weights in the active portfolio use α/σ²(e), never α/σ².</div>
      <div className="pitfall"><b>Covariance in Black-Litterman</b>The covariance of returns comes from history, not from the market-implied forecasts.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="4" />
    </div>
  );
}
