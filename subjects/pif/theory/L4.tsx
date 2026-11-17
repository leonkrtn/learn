'use client';

import { Lab, LinePlot, fx } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';
import { addr, taxOf } from '../generators';

export default function L4() {
  return (
    <div className="theory">
      <p>The Class 3 program works for one person whose income sits in a fixed cell. To tax 20 or 1 000 clients, split the work: an inner Sub that computes one tax from inputs it receives, and an outer Sub that loops over the clients and calls it.</p>

      <h2 id="params">Parameters and Call</h2>
      <ol className="steps">
        <li><div><b>Parameters</b> are declared on the Sub line: <code>Sub Classify(income As Double, out_row As Long)</code>. The logic stays the same, only the inputs now come from outside.</div></li>
        <li><div><b>Call</b> runs it and passes values by position: <code>Call Classify(income, 2)</code>. A Sub with parameters cannot be started with Run.</div></li>
        <li><div><b>Refactor</b> Income_Tax into <code>Tax_One(income, out_row, out_col)</code>: drop step 1 (the income arrives as a parameter) and replace the fixed output cell of step 5 by Cells(out_row, out_col). Steps 2 to 4 stay as they are.</div></li>
      </ol>
      <pre className="vba"><code>{`Sub Tax_Batch()
    Dim n_clients As Long
    n_clients = 20
    Dim i As Long
    Dim client_income As Double
    For i = 1 To n_clients
        client_income = Worksheets("Sheet1").Cells(i + 1, 1)   ' rows 2 to 21
        Call Tax_One(client_income, i + 1, 2)                  ' tax to column B
    Next
End Sub`}</code></pre>
      <p>Worked example: <code>Call Tax_One(25000, 15, 3)</code> writes the tax for 25 000, €5 977.91, to row 15, column 3: C15. A second line <code>Call Tax_One(60000, 16, 3)</code> fills C16: two calls, two clients, one program.</p>

      <h2 id="concerns">Who owns which change</h2>
      <p>The outer Sub knows nothing about brackets; the inner Sub knows nothing about the client list. More clients, a list on another sheet or another output column change Tax_Batch. A new bracket or a moved tax table changes Tax_One. This hierarchy is called abstraction.</p>

      <Lab title="Batch processing" hint="Tax_Batch with incomes spread evenly between the two limits"
        controls={[
          { key: 'n', label: 'n_clients', min: 2, max: 40, step: 1, value: 20 },
          { key: 'off', label: 'First data row', min: 2, max: 6, step: 1, value: 2 },
          { key: 'lo', label: 'Lowest income (k€)', min: 5, max: 40, step: 1, value: 8 },
          { key: 'hi', label: 'Highest income (k€)', min: 41, max: 100, step: 1, value: 72 },
        ]}
        caption="Each dot would be one Call of Tax_One; the outer loop only decides which row to read and where to write.">
        {v => {
          const inc = Array.from({ length: v.n }, (_, i) => (v.lo + (v.hi - v.lo) * i / (v.n - 1)) * 1000);
          const pts = inc.map((x, i) => [i + 1, taxOf(x)] as [number, number]);
          return {
            plot: <LinePlot x={[1, v.n]} y={[0, 35000]} xLabel="Client i" yLabel="Tax (€)" fmtX={t => fx(t, 0)} fmtY={t => fx(t / 1000, 0) + 'k'}
              series={[{ label: 'tax', pts, style: 'strong' }]} />,
            readout: [['Rows read', `A${v.off} to A${v.n + v.off - 1}`], ['Calls of Tax_One', String(v.n)], ['Client i goes to', `Cells(i + ${v.off - 1}, 2)`], ['Last cell written', addr(v.n + v.off - 1, 2)], ['Total tax', '€' + fx(pts.reduce((s, p) => s + p[1], 0), 0)]],
          };
        }}
      </Lab>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Argument order</b>Call Tax_One(25000, 15, 3) writes to C15: row 15, column 3, matched by position.</div>
      <div className="pitfall"><b>Offsets</b>With data from row 2, client i sits in row i + 1; the last of 20 clients is row 21.</div>
      <div className="pitfall"><b>Wrong Sub edited</b>Data layout belongs to the outer Sub, tax logic to the inner Sub.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="4" />
    </div>
  );
}
