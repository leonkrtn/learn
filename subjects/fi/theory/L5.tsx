'use client';

import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L5() {
  return (
    <div className="theory">
      <p>Markowitz optimisation is exact for the true means and covariances. We only ever have estimates, and the optimiser treats them as truth. This lecture is about what that does to portfolios and what researchers have done about it.</p>

      <h2 id="problem">The problem</h2>
      <ol className="steps">
        <li><div><b>Jobson and Korkie (1980):</b> taking 20 stocks’ sample moments as the truth and resampling shows estimated optimal weights are extremely noisy. Noise falls with sample size and rises with the number of assets and with their correlation.</div></li>
        <li><div><b>Michaud (1989):</b> optimisers are “error maximisers”: they overweight assets with unusually high estimated returns or low estimated risk, which are the estimates most likely to be wrong. Small input changes cause large weight changes, turnover and costs.</div></li>
        <li><div><b>DeMiguel, Garlappi and Uppal (2009):</b> out of sample, none of 13 optimised strategies beats 1/N systematically.</div></li>
      </ol>

      <Lab title="Error maximisation with two assets" hint="Weight of asset 1 in the tangency portfolio as its estimated return changes"
        controls={[
          { key: 'rho', label: 'Correlation', min: -0.5, max: 0.95, step: 0.05, value: 0.6, fmt: v => fx(v, 2) },
          { key: 'm2', label: 'Expected excess return, asset 2', min: 0.02, max: 0.1, step: 0.005, value: 0.06, fmt: v => pct(v, 1) },
          { key: 's', label: 'SD of both assets', min: 0.1, max: 0.3, step: 0.01, value: 0.2, fmt: v => pct(v, 0) },
          { key: 'm1', label: 'Estimated return, asset 1', min: 0.02, max: 0.1, step: 0.0025, value: 0.065, fmt: v => pct(v, 2) },
        ]}
        caption="A half-point change in one estimated mean moves the weight a lot, and more so the higher the correlation. That is the instability Michaud and Jobson-Korkie describe.">
        {v => {
          const c = v.rho * v.s * v.s;
          const w = (m1: number) => { const den = m1 * v.s * v.s + v.m2 * v.s * v.s - (m1 + v.m2) * c; return (m1 * v.s * v.s - v.m2 * c) / den; };
          const xs = range(0.02, 0.1, 120).filter(m => Math.abs(m * v.s * v.s + v.m2 * v.s * v.s - (m + v.m2) * c) > 1e-6);
          return {
            plot: <LinePlot x={[0.02, 0.1]} y={[-2, 3]} xLabel="Estimated excess return of asset 1" yLabel="Weight of asset 1" fmtX={t => pct(t, 1)} fmtY={t => fx(t, 1)}
              series={[{ label: 'tangency weight', pts: xs.map(m => [m, w(m)]), style: 'strong' }, { label: '1/N', pts: [[0.02, 0.5], [0.1, 0.5]], style: 'dash' }]}
              marker={[{ x: v.m1, y: w(v.m1), label: fx(w(v.m1), 2) }]} />,
            readout: [['Weight of asset 1', fx(w(v.m1), 3)], ['After +0.5 pt', fx(w(v.m1 + 0.005), 3)], ['Change', fx(w(v.m1 + 0.005) - w(v.m1), 3)]],
          };
        }}
      </Lab>

      <h2 id="fixes">Possible solutions</h2>
      <ol className="steps">
        <li><div><b>Shrinkage:</b> pull means towards a common value, the covariance towards a target (Σ̃ = (1 − λ)Σ<sub>sample</sub> + λΣ<sub>target</sub>, Ledoit-Wolf) or the weights towards 1/N, the market or the minimum-variance portfolio. Weight constraints are an equivalent route.</div></li>
        <li><div><b>Out-of-sample testing:</b> estimate only with data available at each date, on rolling or expanding windows, as a real investor would.</div></li>
        <li><div><b>Parametric portfolio policies</b> (Brandt, Santa-Clara and Valkanov, 2009): model weights as w<sub>i,t</sub> = θ′x<sub>i,t</sub>/N<sub>t</sub> on characteristics such as size, value and momentum, and pick θ to maximise utility. No covariance matrix, K parameters instead of n(n − 1)/2 + n, robust and simple. Barroso and Santa-Clara (2015) apply it to currency carry, value and momentum.</div></li>
        <li><div><b>Galton correction</b> (Barroso and Saxena, 2021): historical estimates regress towards the mean out of sample in a systematic way. Use past out-of-sample errors to correct today’s inputs instead of throwing them away. Variances are the most predictable, mean returns of single stocks the least.</div></li>
      </ol>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Direction of Michaud’s argument</b>Optimisers overweight, not underweight, securities likely to have estimation errors.</div>
      <div className="pitfall"><b>PPP and the covariance matrix</b>Parametric policies do not estimate the covariance matrix; that is the point.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="5" />
    </div>
  );
}
