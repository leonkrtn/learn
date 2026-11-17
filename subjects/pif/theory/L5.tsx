'use client';

import { Lab, LinePlot, fx, pct } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';
import { normSInv } from '../generators';

export default function L5() {
  return (
    <div className="theory">
      <p>Case 2: five assets share the same mean and volatility. Can 40 days of history still make one look like the winner? Simulation generates many possible histories from one set of assumptions, so you can see how much of a result is luck.</p>

      <h2 id="rnd">Uniform draws</h2>
      <ol className="steps">
        <li><div><code>Rnd()</code> returns a uniform number in [0, 1): it can be 0 but never 1, and every call gives a new draw.</div></li>
        <li><div>Scale it to any interval [a, b): <code>Rnd() * (b - a) + a</code>. Rnd() = 0 gives a; as Rnd() approaches 1 the result approaches b. With a = −0.02 and b = 0.02, a draw of 0.75 gives 0.75 × 0.04 − 0.02 = 0.01.</div></li>
        <li><div>Uniform returns do not cluster: +1.99% is as likely as +0.01%.</div></li>
      </ol>

      <h2 id="normal">Normal draws and Excel functions</h2>
      <p><code>NORM.INV(p, mean, std)</code> maps a probability through the inverse Normal CDF: mean + std × z<sub>p</sub>. NormInv(0.5, 0, 0.01) = 0; NormInv(0.975, 0, 0.01) ≈ 0.0196; NormInv(0.025, 0, 0.01) ≈ −0.0196. Feeding it Rnd() turns uniform draws into bell-shaped returns.</p>
      <ol className="steps">
        <li><div><b>Method 1, inject a formula:</b> <code>ws.Cells(3, 1).Formula = "=NORM.INV(RAND(), 0, 0.01)"</code>. The cell keeps a formula that recalculates.</div></li>
        <li><div><b>Method 2, WorksheetFunction:</b> <code>ret = Application.WorksheetFunction.NormInv(Rnd(), 0, 0.01)</code>. The function runs inside VBA and returns a static value; faster, used for the rest of the course. Arguments take commas; newer names use underscores (Norm_Inv, StDev_S).</div></li>
        <li><div><b>Objects need Set:</b> <code>Dim ws As Worksheet</code>, <code>Set ws = Worksheets("Sheet1")</code>. Without Set: run-time error 91.</div></li>
      </ol>
      <pre className="vba"><code>{`Sub Normal_Returns()
    Dim ws As Worksheet
    Dim ret_range As Range
    Dim returns(1 To 40, 1 To 1) As Double
    Dim i As Long
    Set ws = Worksheets("Sheet1")
    Set ret_range = ws.Range(ws.Cells(3, 1), ws.Cells(42, 1))
    For i = 1 To 40
        returns(i, 1) = Application.WorksheetFunction.NormInv(Rnd(), 0, 0.01)
    Next
    ret_range.Value = returns          ' all 40 cells in one step
End Sub`}</code></pre>
      <p>The array has two dimensions because a block of cells always has rows and columns, and its size must match the Range: for 5 assets use returns(1 To 40, 1 To 5) and end the Range at ws.Cells(42, 5).</p>

      <Lab title="From a uniform draw to a return" hint="The same Rnd() value through both transformations"
        controls={[
          { key: 'u', label: 'Rnd() returns', min: 0.01, max: 0.99, step: 0.01, value: 0.75, fmt: v => fx(v, 2) },
          { key: 'w', label: 'Uniform half-width (b = −a)', min: 0.005, max: 0.04, step: 0.005, value: 0.02, fmt: v => pct(v, 1) },
          { key: 's', label: 'Normal std (mean 0)', min: 0.005, max: 0.03, step: 0.005, value: 0.01, fmt: v => pct(v, 1) },
        ]}
        caption="Blue: NormInv(u, 0, σ), steep in the tails and flat in the middle, so most draws land near 0. Gray: the uniform map, a straight line from a to b.">
        {v => {
          const us = Array.from({ length: 99 }, (_, i) => (i + 1) / 100);
          const uni = (u: number) => u * 2 * v.w - v.w, nor = (u: number) => v.s * normSInv(u);
          const lim = Math.max(v.w, v.s * 2.4) * 1.1;
          return {
            plot: <LinePlot x={[0, 1]} y={[-lim, lim]} xLabel="Rnd()" yLabel="Return" fmtX={t => fx(t, 1)} fmtY={t => pct(t, 1)}
              series={[{ label: 'Normal', pts: us.map(u => [u, nor(u)] as [number, number]), style: 'strong' }, { label: 'uniform', pts: us.map(u => [u, uni(u)] as [number, number]), style: 'soft' }]}
              marker={[{ x: v.u, y: nor(v.u) }]} />,
            readout: [['Uniform: Rnd() × (b − a) + a', fx(uni(v.u), 4)], ['Normal: NormInv(u, 0, σ)', fx(nor(v.u), 4)], ['z for this u', fx(normSInv(v.u), 4)], ['Share within ±2σ (Normal)', '95.4%']],
          };
        }}
      </Lab>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Interval ends</b>Rnd() is in [0, 1), so Rnd() × (b − a) + a can equal a but never b.</div>
      <div className="pitfall"><b>Set</b>Worksheet and Range variables need Set; forgetting it gives run-time error 91.</div>
      <div className="pitfall"><b>Array size</b>The array written to a Range must be 2D and match the block exactly.</div>
      <div className="pitfall"><b>Luck</b>With identical assets, the best sample mean after 40 days says nothing about expected returns: run it again and the winner changes.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="5" />
    </div>
  );
}
