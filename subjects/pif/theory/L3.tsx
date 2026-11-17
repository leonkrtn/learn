'use client';

import { Lab, LinePlot, fx, pct } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';
import { TAX, bracketOf, taxOf } from '../generators';

export default function L3() {
  return (
    <div className="theory">
      <p>Case 1: a consulting firm computes personal income taxes. The Excel table already does the arithmetic; VBA automates the manual workflow around it so that one click works for any income, and later for a thousand clients.</p>

      <h2 id="excel">The pure Excel approach</h2>
      <p>Income tax is progressive: a higher rate applies only to the part of income inside the higher bracket. Sheet2 holds the brackets in rows 3 to 11 (A from, B to, C rate in %) and three helper columns: <b>D = B − A</b> (bracket width), <b>E = D × C / 100</b> (bracket tax), <b>F = cumulative E</b>. For an income exactly on an upper threshold, F in that row is the tax.</p>
      <ol className="steps">
        <li><div>Find the first upper threshold <b>greater than or equal to</b> the income (20 000 → B6 = 20 700).</div></li>
        <li><div>Save the original threshold, overwrite it with the income: the bracket width shrinks to the part actually earned.</div></li>
        <li><div>Read the tax in F of that row: F6 = 4 273.405 for 20 000 (30 000 → B8, F8 = 7 800.805).</div></li>
        <li><div>Restore the threshold.</div></li>
      </ol>

      <h2 id="vba">The VBA program in five steps</h2>
      <pre className="vba"><code>{`Sub income_tax_main()
    'Step 1: read and validate income
    Dim income As Double
    income = Worksheets("Sheet2").Cells(16, 1)
    If income < 0 Then
        MsgBox ("Invalid income.")
        Exit Sub
    End If
    'Step 2: save upper thresholds (rows 3 to 11)
    Dim upper(1 To 9) As Double
    Dim i As Long
    For i = 1 To 9
        upper(i) = Worksheets("Sheet2").Cells(i + 2, 2)
    Next
    'Step 3: find row, overwrite, read tax, exit loop
    Dim tax As Double
    For i = 1 To 9
        If income <= upper(i) Then
            Worksheets("Sheet2").Cells(i + 2, 2) = income
            tax = Worksheets("Sheet2").Cells(i + 2, 6)
            Exit For
        End If
    Next
    'Step 4: restore upper thresholds
    For i = 1 To 9
        Worksheets("Sheet2").Cells(i + 2, 2) = upper(i)
    Next
    'Step 5: output tax
    Worksheets("Sheet2").Cells(16, 2) = tax
End Sub`}</code></pre>
      <p>It is built in three tested rounds, safe outer structure first and core last: round 1 steps 1 + 5 (validate input, write output), round 2 steps 2 + 4 (save and restore, check with a deliberate change to B5), round 3 step 3. Only working code is copied into the Main Sub.</p>

      <Lab title="Progressive tax with the Case 1 table" hint="Tax, average and marginal rate"
        controls={[{ key: 'y', label: 'Income (€)', min: 0, max: 100000, step: 500, value: 20000, fmt: v => fx(v, 0) }]}
        caption="Tax rises piecewise linearly; the slope is the marginal rate. The average rate (tax ÷ income) always stays below the marginal rate above the first bracket.">
        {v => {
          const k = bracketOf(v.y), tax = taxOf(v.y), xs = Array.from({ length: 101 }, (_, i) => i * 1000);
          return {
            plot: <LinePlot x={[0, 100000]} y={[0, 40000]} xLabel="Income (€)" yLabel="Tax (€)" fmtX={t => fx(t / 1000, 0) + 'k'} fmtY={t => fx(t / 1000, 0) + 'k'}
              series={[{ label: 'tax', pts: xs.map(x => [x, taxOf(x)] as [number, number]), style: 'strong' }]} marker={[{ x: v.y, y: tax, label: fx(tax, 0) }]} />,
            readout: [['Row of the bracket', String(k + 3)], ['Overwrite / read', TAX.to[k] == null ? 'top bracket: no threshold' : `B${k + 3} / F${k + 3}`], ['Tax', '€' + fx(tax, 2)], ['Average rate', v.y ? pct(tax / v.y, 2) : '–'], ['Marginal rate', fx(TAX.rate[k], 1) + '%']],
          };
        }}
      </Lab>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Whole income at the top rate</b>Each rate applies only inside its bracket; add the bracket taxes.</div>
      <div className="pitfall"><b>Exit For</b>Without it, income &lt;= upper(i) stays true for every later threshold; more rows are overwritten and the tax read last is wrong.</div>
      <div className="pitfall"><b>&lt; versus &lt;=</b>With &lt; an income equal to a threshold moves to the next row; that bracket’s width becomes 0, so the tax is the same, but the row you overwrite differs.</div>
      <div className="pitfall"><b>Row mapping</b>upper(i) = Cells(i + 2, 2): slot 1 is B3, slot 9 is B11.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="3" />
    </div>
  );
}
