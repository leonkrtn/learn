'use client';

import { Lab, LinePlot, fx } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';
import { addr } from '../generators';

export default function L1() {
  return (
    <div className="theory">
      <p>VBA lives inside Excel: View › Project Explorer, right-click › Insert Module, type a Sub, press Run. Everything in this course is built from three tools: variables that store values, references that read and write cells, and loops that repeat. Save the workbook as <b>.xlsm</b>, or the code is lost.</p>

      <h2 id="vars">Variables</h2>
      <ol className="steps">
        <li><div><b>Declare</b> with Dim: <code>Dim shares As Long</code>. Without a type the variable is a <b>Variant</b>.</div></li>
        <li><div><b>Assign</b> with =, read right to left: <code>shares = 10</code> stores 10 in shares.</div></li>
        <li><div><b>Choose the type:</b> Long for counts (shares, clients), Double for amounts (prices, rates, returns), String for labels ("AAPL"). A decimal assigned to a Long is rounded to a whole number.</div></li>
        <li><div><b>Join text</b> with &amp;: <code>"Stock: " &amp; ticker</code>. A single quote starts a comment.</div></li>
      </ol>

      <h2 id="cells">References: copy-paste with code</h2>
      <p><code>Cells(row, col)</code> takes the row first: Cells(3, 2) is B3, Cells(5, 3) is C5. The full address <code>Worksheets("Sheet1").Cells(3, 2)</code> always targets Sheet1; Cells(3, 2) alone uses whichever sheet is active. .Value is the default property, so it can be left out.</p>
      <pre className="vba"><code>{`Sub Read_Price()
    Dim price As Double
    price = Worksheets("Sheet1").Cells(3, 2)      ' read B3
    Worksheets("Sheet1").Cells(3, 4) = price      ' write to D3
End Sub`}</code></pre>

      <h2 id="loops">For loops</h2>
      <p><code>For i = 1 To 5 … Next</code> runs the body with i = 1, 2, …, 5; Next adds 1 each time, so after the loop i = 6. Using i inside Cells makes the counter do double duty: it counts the passes and selects the row.</p>
      <p>Worked example: B1:B3 hold 100, 150 and 200. <code>For i = 1 To 3: Worksheets("Sheet1").Cells(i, 4) = Worksheets("Sheet1").Cells(i, 2) * 2: Next</code> writes 200, 300 and 400 to D1:D3; i ends at 4.</p>

      <Lab title="Trace an accumulator loop" hint="x = x0, then For i = a To b: x = x + k × i"
        controls={[
          { key: 'x0', label: 'Start value x0', min: 0, max: 50, step: 1, value: 10 },
          { key: 'a', label: 'First value a', min: 1, max: 5, step: 1, value: 1 },
          { key: 'n', label: 'Number of passes', min: 1, max: 12, step: 1, value: 5 },
          { key: 'k', label: 'k', min: 1, max: 10, step: 1, value: 3 },
        ]}
        caption="Each point is x at the end of one pass (a breakpoint on Next would show the same). The loop variable ends one step past b.">
        {v => {
          const b = v.a + v.n - 1;
          const pts: [number, number][] = [[v.a - 1, v.x0]];
          let x = v.x0;
          for (let i = v.a; i <= b; i++) { x += v.k * i; pts.push([i, x]); }
          return {
            plot: <LinePlot x={[v.a - 1, b]} y={[0, Math.max(10, x * 1.05)]} xLabel="i" yLabel="x" fmtX={t => fx(t, 0)} fmtY={t => fx(t, 0)}
              series={[{ label: 'x', pts, style: 'strong' }]} marker={[{ x: b, y: x, label: fx(x, 0) }]} />,
            readout: [['Loop header', `For i = ${v.a} To ${b}`], ['Passes', String(v.n)], ['Final x', fx(x, 0)], ['i after the loop', String(b + 1)], ['Cells(i, 2) in the last pass', addr(b, 2)]],
          };
        }}
      </Lab>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Row and column</b>Cells(3, 2) is B3, not C2: the row comes first.</div>
      <div className="pitfall"><b>The counter after the loop</b>After For i = 1 To 5, i is 6, not 5.</div>
      <div className="pitfall"><b>Sheet names</b>Renaming Sheet1 breaks Worksheets("Sheet1"): “Subscript out of range”.</div>
      <div className="pitfall"><b>Types</b>Text into a Double gives “Type mismatch”; 7.6 into a Long becomes 8.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="1" />
    </div>
  );
}
