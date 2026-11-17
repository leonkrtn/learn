'use client';

import { Lab, LinePlot, fx, pct } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

const LABELS = ['Sell', 'Hold', 'Buy', 'Strong Buy'];

export default function L2() {
  return (
    <div className="theory">
      <p>A variable is a box; an <b>array</b> is a box with compartments. Conditionals let the program choose, and the debugger lets you watch it do so line by line.</p>

      <h2 id="arrays">Arrays and accumulators</h2>
      <ol className="steps">
        <li><div><b>Declare</b> the slots: <code>Dim prices(1 To 5) As Double</code> gives prices(1) … prices(5).</div></li>
        <li><div><b>Fill</b> them in a loop: <code>prices(i) = Worksheets("Sheet1").Cells(i, 2)</code>. A single variable would be overwritten each pass; the array keeps every value.</div></li>
        <li><div><b>Accumulate:</b> <code>total = total + prices(i)</code> (sum), <code>cnt = cnt + 1</code> inside an If (count). Start both at 0.</div></li>
        <li><div><b>Maximum:</b> <code>max_price = prices(1)</code>, then loop from 2 and replace it whenever prices(i) is larger.</div></li>
      </ol>

      <h2 id="if">If / ElseIf / Else</h2>
      <p>VBA tests the conditions from the top; the first true branch runs and VBA jumps to End If, so only one branch ever runs. ElseIf needs a condition, Else is the catch-all. Operators: =, &gt;, &lt;, <code>&lt;&gt;</code>, <code>&gt;=</code>, <code>&lt;=</code>. Write End If straight after If to avoid “Expected: End If”.</p>
      <pre className="vba"><code>{`If ret > 0.1 Then
    MsgBox ("Strong Buy")
ElseIf ret > 0.02 Then
    MsgBox ("Buy")
ElseIf ret < -0.02 Then
    MsgBox ("Sell")
Else
    MsgBox ("Hold")
End If`}</code></pre>
      <p>Worked example (Salary_Filter): salaries 35 000, 28 000, 42 000, 25 000, 31 000 with <code>If salary &gt; 30000</code> write Senior and count: three seniors (rows 1, 3 and 5).</p>

      <Lab title="Order of conditions in a trading signal" hint="Signal for every return between −20% and 20%"
        controls={[
          { key: 'th', label: 'Buy / Sell threshold', min: 0.005, max: 0.05, step: 0.005, value: 0.02, fmt: v => pct(v, 1) },
          { key: 's', label: 'Strong Buy threshold', min: 0.06, max: 0.15, step: 0.01, value: 0.1, fmt: v => pct(v, 0) },
          { key: 'wrong', label: 'Order of the tests', min: 0, max: 1, step: 1, value: 0, fmt: v => v ? 'Buy first (wrong)' : 'Strong Buy first' },
        ]}
        caption="0 = Sell, 1 = Hold, 2 = Buy, 3 = Strong Buy. With the Buy test first, every return above the Buy threshold stops there and Strong Buy disappears.">
        {v => {
          const sig = (r: number) => v.wrong ? (r > v.th ? 2 : r > v.s ? 3 : r < -v.th ? 0 : 1) : (r > v.s ? 3 : r > v.th ? 2 : r < -v.th ? 0 : 1);
          const xs = Array.from({ length: 401 }, (_, i) => -0.2 + i * 0.001);
          const reach = xs.some(r => sig(r) === 3);
          return {
            plot: <LinePlot x={[-0.2, 0.2]} y={[-0.2, 3.4]} xLabel="Return in B3" yLabel="Signal" fmtX={t => pct(t, 0)} fmtY={t => fx(t, 0)}
              series={[{ label: 'signal', pts: xs.map(r => [r, sig(r)] as [number, number]), style: 'strong' }]} />,
            readout: [['Sell', `below ${pct(-v.th, 1)}`], ['Hold', `${pct(-v.th, 1)} to ${pct(v.th, 1)}`], ['Buy', v.wrong ? `above ${pct(v.th, 1)}` : `${pct(v.th, 1)} to ${pct(v.s, 0)}`], [LABELS[3], reach ? `above ${pct(v.s, 0)}` : 'never reached']],
          };
        }}
      </Lab>

      <h2 id="debug">Debugging</h2>
      <p>Click the margin for a breakpoint (red dot): Run stops before that line. Step Into runs one line at a time; View › Locals Window shows every variable’s name, type and value. In a loop, break on Next to see the state at the end of each pass. After For i = 1 To 3, the Locals Window shows i = 4.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Branch order</b>Test the strictest condition first; later branches never run once an earlier one is true.</div>
      <div className="pitfall"><b>Boundaries</b>&gt; excludes the threshold itself, &gt;= includes it. Check values exactly on a threshold.</div>
      <div className="pitfall"><b>Array bounds</b>prices(1 To 2) with a loop to 3: “Subscript out of range”.</div>
      <div className="pitfall"><b>Maximum from 0</b>Start the maximum at the first element, not at 0, or negative data gives a wrong answer.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="2" />
    </div>
  );
}
