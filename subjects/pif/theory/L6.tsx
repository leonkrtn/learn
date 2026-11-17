'use client';

import { Lab, LinePlot, fx, pct } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L6() {
  return (
    <div className="theory">
      <p>With the returns on the sheet, Range objects pass whole blocks of cells to Excel’s statistical functions: a summary table per asset, then the covariance matrix of all pairs.</p>

      <h2 id="range">Range objects</h2>
      <ol className="steps">
        <li><div><b>Set</b> is required for every object variable: Worksheet, Range, Workbook.</div></li>
        <li><div><code>Set col = ws.Range(ws.Cells(1, 1), ws.Cells(20, 1))</code> is A1:A20: top-left to bottom-right. A Range can be one cell, a column, a row or a block; both corners must be on the same sheet (else error 1004).</div></li>
        <li><div><code>WorksheetFunction.Average(col)</code> and <code>StDev_S(col)</code> take the Range directly; StDev_S is the sample standard deviation (n − 1).</div></li>
        <li><div>In a loop over j, <code>Set col = ws.Range(ws.Cells(1, j), ws.Cells(20, j))</code> slides one column to the right each pass: one line for all five assets.</div></li>
      </ol>

      <h2 id="cov">Covariance and the matrix</h2>
      <p><code>Covariance_S(col1, col2)</code> is the sample covariance: positive if the assets rise and fall together, negative if they move oppositely, near zero if unrelated. With the same column twice it is the variance, so Covariance_S(col1, col1) = StDev_S(col1)^2. Independently simulated assets show covariances near, but not exactly, zero: 20 observations are a small sample.</p>
      <pre className="vba"><code>{`For i = 1 To 5
    Set col_i = ws.Range(ws.Cells(1, i), ws.Cells(20, i))
    For j = 1 To 5
        Set col_j = ws.Range(ws.Cells(1, j), ws.Cells(20, j))
        ws.Cells(30 + i, j) = Application.WorksheetFunction.Covariance_S(col_i, col_j)
    Next j
Next i`}</code></pre>
      <p>The 5 × 5 matrix fills rows 31 to 35: variances on the diagonal, symmetric Cov(i, j) = Cov(j, i). The correlation divides each entry by the two standard deviations, ρ<sub>ij</sub> = Cov(i, j) / (σ<sub>i</sub>σ<sub>j</sub>). Worked example: returns 0.10, −0.05, 0.20 and 0.05, 0.00, 0.10 have means 0.0833 and 0.05, standard deviations 0.1258 and 0.05, covariance 0.00625, correlation 0.9934.</p>

      <Lab title="Covariance, correlation and a two-asset portfolio" hint="σ of a portfolio with weight w in asset 1"
        controls={[
          { key: 's1', label: 'σ asset 1', min: 0.05, max: 0.3, step: 0.01, value: 0.1, fmt: v => pct(v, 0) },
          { key: 's2', label: 'σ asset 2', min: 0.05, max: 0.3, step: 0.01, value: 0.2, fmt: v => pct(v, 0) },
          { key: 'r', label: 'Correlation ρ', min: -1, max: 1, step: 0.05, value: 0.3, fmt: v => fx(v, 2) },
        ]}
        caption="Cov = ρσ1σ2 sits off the diagonal of the matrix; the lower the correlation, the more the portfolio risk bends below the straight line between the two assets.">
        {v => {
          const cov = v.r * v.s1 * v.s2, ws = Array.from({ length: 51 }, (_, i) => i / 50);
          const sp = (w: number) => Math.sqrt(w * w * v.s1 ** 2 + (1 - w) ** 2 * v.s2 ** 2 + 2 * w * (1 - w) * cov);
          return {
            plot: <LinePlot x={[0, 1]} y={[0, 0.32]} xLabel="Weight in asset 1" yLabel="Portfolio σ" fmtX={t => pct(t, 0)} fmtY={t => pct(t, 0)}
              series={[{ label: 'portfolio σ', pts: ws.map(w => [w, sp(w)] as [number, number]), style: 'strong' }, { label: 'no diversification', pts: ws.map(w => [w, w * v.s1 + (1 - w) * v.s2] as [number, number]), style: 'soft' }]} />,
            readout: [['Var 1 (diagonal)', fx(v.s1 ** 2, 4)], ['Var 2 (diagonal)', fx(v.s2 ** 2, 4)], ['Cov(1, 2) = Cov(2, 1)', fx(cov, 4)], ['σ at 50/50', pct(sp(0.5), 2)]],
          };
        }}
      </Lab>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>n − 1</b>StDev_S and Covariance_S divide by n − 1, not n.</div>
      <div className="pitfall"><b>Variance versus standard deviation</b>The diagonal holds variances; take the square root before computing correlations.</div>
      <div className="pitfall"><b>Matrix cells</b>ws.Cells(30 + i, j) puts Cov(i, j) in row 30 + i: Cov(1, 1) is A31, not A30.</div>
      <div className="pitfall"><b>Range across sheets</b>ws.Range(ws.Cells(…), Cells(…)) without the second ws. can mix sheets: error 1004.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="6" />
    </div>
  );
}
