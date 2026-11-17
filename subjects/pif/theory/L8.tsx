'use client';

import { Lab, LinePlot, fx, pct } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L8() {
  return (
    <div className="theory">
      <p>Application: compare N = 15 mutual funds over two years of daily returns. A UDF that takes a Range of returns can be typed into one cell and filled across all funds.</p>

      <h2 id="sharpe">Sharpe ratio</h2>
      <p>The Sharpe ratio compares the excess return with the volatility, SR = (R − r<sub>f</sub>) / σ. With daily data the course converts the annual risk-free rate to a daily one and annualises with √252:</p>
      <pre className="vba"><code>{`Function sharpe_ratio(returns As Range, rf As Double) As Double
    'Compute average return and standard deviation
    avg_return = Application.WorksheetFunction.Average(returns)
    std_return = Application.WorksheetFunction.StDev_S(returns)
    '#Trading days per year
    tdays = 252
    'Compute daily risk-free return
    Dim rf_d As Double
    rf_d = rf / tdays
    'Compute the annualized Sharpe Ratio
    sharpe_ratio = Sqr(tdays) * ((avg_return - rf_d) / std_return)
End Function`}</code></pre>
      <p>Worked example: average daily return 0.0006, daily standard deviation 0.012, r<sub>f</sub> = 2%: rf_d = 0.02 / 252 = 0.0000794; SR = √252 × (0.0006 − 0.0000794) / 0.012 = 0.6887.</p>

      <h2 id="moments">What the standard deviation misses</h2>
      <p>Two portfolios: A has mean 14.14%, std 19.57%, skewness 0.12, kurtosis 0.07; B has 14.00%, 15.99%, −4.52 and 35.33. With r<sub>f</sub> = 2% B’s Sharpe ratio is higher, 0.75 against 0.62, but its strongly negative skewness and huge kurtosis mean rare, large losses. Investors mostly dislike downside volatility, and the standard deviation treats gains and losses alike.</p>

      <h2 id="sortino">Sortino ratio</h2>
      <ol className="steps">
        <li><div>Average return and rf_d = rf / 252, as for the Sharpe ratio.</div></li>
        <li><div>Keep only the <b>negative</b> returns.</div></li>
        <li><div>Their StDev_S is the <b>downside volatility</b> σ<sup>−</sup>.</div></li>
        <li><div>Sortino = √252 × (average − rf_d) / σ<sup>−</sup>.</div></li>
      </ol>

      <Lab title="Sharpe and Sortino from daily figures" hint="Annualised with √252, r_f converted with rf / 252"
        controls={[
          { key: 'm', label: 'Average daily return', min: 0, max: 0.002, step: 0.0001, value: 0.0006, fmt: v => fx(v, 4) },
          { key: 's', label: 'Daily standard deviation', min: 0.004, max: 0.03, step: 0.001, value: 0.012, fmt: v => fx(v, 3) },
          { key: 'd', label: 'Downside σ as a share of σ', min: 0.3, max: 1.2, step: 0.05, value: 0.7, fmt: v => fx(v, 2) },
          { key: 'rf', label: 'Annual risk-free rate', min: 0, max: 0.05, step: 0.005, value: 0.02, fmt: v => pct(v, 1) },
        ]}
        caption="Sharpe ratio (blue) as the daily standard deviation changes, others fixed. A fund whose losses are milder than its gains (downside share below 1) looks better on Sortino than on Sharpe.">
        {v => {
          const ex = v.m - v.rf / 252, sr = (s: number) => Math.sqrt(252) * ex / s;
          const xs = Array.from({ length: 53 }, (_, i) => 0.004 + i * 0.0005);
          return {
            plot: <LinePlot x={[0.004, 0.03]} y={[Math.min(0, sr(0.004)), Math.max(0.5, sr(0.004))]} xLabel="Daily σ" yLabel="Annualised ratio" fmtX={t => fx(t, 3)} fmtY={t => fx(t, 1)}
              series={[{ label: 'Sharpe', pts: xs.map(s => [s, sr(s)] as [number, number]), style: 'strong' }, { label: 'Sortino', pts: xs.map(s => [s, sr(s * v.d)] as [number, number]), style: 'soft' }]}
              marker={[{ x: v.s, y: sr(v.s) }]} />,
            readout: [['rf_d', fx(v.rf / 252, 6)], ['Daily excess return', fx(ex, 6)], ['Sharpe ratio', fx(sr(v.s), 4)], ['Sortino ratio', fx(sr(v.s * v.d), 4)]],
          };
        }}
      </Lab>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Annualising</b>Multiply the daily ratio by √252, not by 252.</div>
      <div className="pitfall"><b>Daily risk-free rate</b>The course uses rf / 252; using the annual rate with daily returns wipes out the numerator.</div>
      <div className="pitfall"><b>Downside volatility</b>StDev_S of the negative returns only, not of all returns.</div>
      <div className="pitfall"><b>Square root</b>VBA’s square root is Sqr, not Sqrt.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="8" />
    </div>
  );
}
