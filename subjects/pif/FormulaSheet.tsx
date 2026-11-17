import { Frac } from '@/components/Frac';

/** Syntax and formulas of the course. The exam is open book (printed notes), so this is a study summary, not an official sheet. */
export default function FormulaSheet() {
  return (
    <div className="fs">
      <p className="note">There is no official formula sheet: the exam (120 minutes, Moodle in Safe Exam Browser mode) is open book with printed notes. This page collects the syntax and formulas of the course; the suggested cheatsheet under My cheatsheet arranges them for printing.</p>
      <h3>Variables, cells and loops</h3>
      <pre className="vba"><code>{`Dim shares As Long        ' Long, Double, String; no type = Variant
shares = 10               ' read right to left
Worksheets("Sheet1").Cells(row, col) = x    ' Cells(3, 2) = B3
For i = 1 To n ... Next   ' i = n + 1 afterwards
"Stock: " & ticker        ' & joins strings`}</code></pre>
      <h3>Arrays, conditions, exits</h3>
      <pre className="vba"><code>{`Dim prices(1 To 5) As Double
If x > a Then ... ElseIf x < b Then ... Else ... End If   ' first true branch only
<>  >=  <=     Exit For (leave loop)   Exit Sub (leave Sub)`}</code></pre>
      <h3>Subs, Call and functions</h3>
      <pre className="vba"><code>{`Sub Tax_One(income As Double, out_row As Long, out_col As Long)
Call Tax_One(25000, 15, 3)               ' arguments by position -> C15
Function f(x As Double) As Double ... f = result ... End Function
Dim a() As Double: ReDim a(1 To T, 1 To N)   ' sizes known at run time`}</code></pre>
      <h3>Objects and Excel functions</h3>
      <pre className="vba"><code>{`Dim ws As Worksheet: Set ws = Worksheets("Sheet1")    ' Set, or error 91
Dim col As Range:    Set col = ws.Range(ws.Cells(1, 1), ws.Cells(20, 1))
Application.WorksheetFunction.Average(col) / StDev_S(col) / Covariance_S(c1, c2)
Application.WorksheetFunction.NormInv(Rnd(), mu, sigma)
ret_range.Value = returns     ' 2D array, same size as the Range`}</code></pre>
      <h3>Simulation</h3>
      <div className="eq">Rnd() ∈ [0, 1)<span className="up">,</span>&nbsp; uniform on [a, b): Rnd() × (b − a) + a<span className="up">,</span>&nbsp; mean <Frac n="a + b" d="2" /></div>
      <div className="eq">NormInv(p, μ, σ) = μ + σz<sub>p</sub><span className="up">,</span>&nbsp; z<sub>0.975</sub> = 1.96, z<sub>0.95</sub> = 1.645, z<sub>0.9</sub> = 1.2816, z<sub>0.5</sub> = 0</div>
      <h3>Income tax (Case 1)</h3>
      <div className="eq">D = B − A<span className="up">,</span>&nbsp; E = D × C / 100<span className="up">,</span>&nbsp; F = F<sub>above</sub> + E<span className="up">,</span>&nbsp; tax(Y) = F<sub>k−1</sub> + (Y − A<sub>k</sub>) × C<sub>k</sub> / 100</div>
      <h3>Statistics and performance</h3>
      <div className="eq">s = √<Frac n="Σ(x − x̄)²" d="n − 1" /><span className="up">,</span>&nbsp; Cov<sub>S</sub> = <Frac n="Σ(x − x̄)(y − ȳ)" d="n − 1" /><span className="up">,</span>&nbsp; ρ = <Frac n="Cov(i, j)" d={<>σ<sub>i</sub>σ<sub>j</sub></>} /></div>
      <div className="eq">Sharpe = √252 × <Frac n={<>R̄<sub>d</sub> − r<sub>f</sub>/252</>} d={<>σ<sub>d</sub></>} /><span className="up">,</span>&nbsp; Sortino = √252 × <Frac n={<>R̄<sub>d</sub> − r<sub>f</sub>/252</>} d={<>σ<sub>d</sub><sup>−</sup></>} /><span className="up">,</span>&nbsp; σ<sub>d</sub><sup>−</sup> = StDev_S of the negative returns</div>
    </div>
  );
}
