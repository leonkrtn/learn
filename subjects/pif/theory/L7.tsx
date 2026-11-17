'use client';

import { Lab, LinePlot, fx } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

/** Deterministic pseudo-random draws, so server and client render the same lab. */
function lcg(seed: number) { let s = seed; return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }

export default function L7() {
  return (
    <div className="theory">
      <p>A Sub performs actions; a <b>Function</b> returns a value. User-defined functions (UDFs) package a calculation once and use it from other code or straight from a worksheet cell, like SUM or AVERAGE.</p>

      <h2 id="structure">The structure of a UDF</h2>
      <pre className="vba"><code>{`Function regards_function(name As String) As String
    'A function with your name as the argument
    welcome_msg = "Hello, " & name & "! I hope you enjoy the course :D !"
    regards_function = welcome_msg        ' the output line
End Function`}</code></pre>
      <ol className="steps">
        <li><div>Open with <b>Function</b>, close with <b>End Function</b>. The arguments go in parentheses (none, one or several), the result type after them.</div></li>
        <li><div>The result is handed back by <b>assigning it to the function’s name</b>; if that never happens, the function returns the default of its type (0, empty text).</div></li>
        <li><div><b>Use it</b> from a Sub, <code>first_part = regards_function("Students!")</code>, or from a cell, <code>=regards_function(B1)</code>. A function with arguments cannot be started with the Run button.</div></li>
        <li><div>Arguments are passed <b>ByRef</b> by default: if the function overwrites its argument, the caller’s variable changes too. An undeclared (Variant) variable passed to a String argument gives “ByRef argument type mismatch”.</div></li>
        <li><div>A function can return an <b>object</b>: <code>Function ThisWB() As Workbook</code> with <code>Set ThisWB = ThisWorkbook</code>.</div></li>
      </ol>

      <h2 id="arrays">Returning arrays: UniformArray</h2>
      <p>Simulating T days of N assets needs an array whose size is only known at run time. <code>Dim my_array(1 To T, 1 To N)</code> does not compile, because fixed bounds must be constants. Declare a dynamic array and size it with ReDim; return it As Variant.</p>
      <pre className="vba"><code>{`Function UniformArray(T As Long, N As Long, a As Single, b As Single) As Variant
    Dim my_array() As Double
    ReDim my_array(1 To T, 1 To N)
    Dim i As Integer, j As Integer
    For i = 1 To T                  ' rows: days
        For j = 1 To N              ' columns: assets
            my_array(i, j) = Rnd() * (b - a) + a
        Next j
    Next i
    UniformArray = my_array
End Function`}</code></pre>
      <p>Entered over a block of 40 rows × 5 columns, =UniformArray(40, 5, -0.02, 0.02) fills it with 200 draws.</p>

      <Lab title="UniformArray(T, N, a, b)" hint="One fixed sample, sorted, against the uniform quantiles"
        controls={[
          { key: 'T', label: 'T (days)', min: 5, max: 250, step: 5, value: 40 },
          { key: 'N', label: 'N (assets)', min: 1, max: 10, step: 1, value: 5 },
          { key: 'a', label: 'a', min: -0.05, max: 0, step: 0.005, value: -0.02, fmt: v => fx(v, 3) },
          { key: 'b', label: 'b', min: 0.005, max: 0.05, step: 0.005, value: 0.02, fmt: v => fx(v, 3) },
        ]}
        caption="Sorted draws (blue) follow the straight uniform quantile line (gray); more draws, closer fit. Mean (a + b)/2, standard deviation (b − a)/√12.">
        {v => {
          const rnd = lcg(7), n = v.T * v.N;
          const d = Array.from({ length: n }, () => rnd() * (v.b - v.a) + v.a).sort((x, y) => x - y);
          const avg = d.reduce((s, x) => s + x, 0) / n;
          return {
            plot: <LinePlot x={[0, 1]} y={[v.a, v.b]} xLabel="Share of draws below" yLabel="Draw" fmtX={t => fx(t, 1)} fmtY={t => fx(t, 3)}
              series={[{ label: 'sample', pts: d.map((x, i) => [(i + 0.5) / n, x] as [number, number]), style: 'strong' }, { label: 'uniform', pts: [[0, v.a], [1, v.b]], style: 'soft' }]} />,
            readout: [['Draws returned', `${v.T} × ${v.N} = ${n}`], ['Sample mean', fx(avg, 5)], ['Expected mean', fx((v.a + v.b) / 2, 5)], ['Expected std', fx((v.b - v.a) / Math.sqrt(12), 5)]],
          };
        }}
      </Lab>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>No Return</b>VBA has no Return statement for values: assign the result to the function’s name.</div>
      <div className="pitfall"><b>Unassigned paths</b>If an If has no Else that sets the name, some inputs return 0 or an empty text.</div>
      <div className="pitfall"><b>Fixed bounds</b>Dim a(1 To T) with a variable T fails; use Dim a() and ReDim.</div>
      <div className="pitfall"><b>ByRef</b>A function that changes its parameter changes the caller’s variable too.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="7" />
    </div>
  );
}
