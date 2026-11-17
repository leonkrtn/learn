// Suggested exam notes for Programming in Finance (open book, printed notes): one A4 sheet, front and back.
// Markdown with $…$ formulas; "∗" stands for the VBA multiplication sign so the Markdown subset does not read it as italics.
import { keyFacts } from '@/lib/sheet';
import type { SheetBlock } from '@/lib/subject';
import { BANK, LECTURES } from './concepts';

const B = (topic: string | null, title: string, body: string): SheetBlock => ({ topic, title, body });
/** Raw template with ¦ standing for a backtick (inline code), since a backtick cannot be escaped in String.raw. */
const r = (s: TemplateStringsArray, ...v: unknown[]) => String.raw(s, ...v).replace(/¦/g, '`');

const BLOCKS: SheetBlock[] = [
  B(null, 'Reading code in the exam', r`1. Write down every variable with its start value. 2. Count loop passes: ¦For i = a To b¦ runs $b-a+1$ times, $i=b+1$ afterwards. 3. In If/ElseIf only the first true branch runs. 4. Translate ¦Cells(r, c)¦ to a letter address (row first). 5. Objects (Worksheet, Range) need ¦Set¦.`),
  B(null, 'Errors at a glance', r`- Subscript out of range: missing sheet name or array slot beyond bounds
- Type mismatch: text into a number variable, number where a Range is expected
- Expected: End If: unclosed If
- 91 Object variable not set: Worksheet/Range without ¦Set¦
- 1004: NormInv probability 0, Range across two sheets
- Sub or Function not defined: misspelled name after WorksheetFunction
- ByRef argument type mismatch: undeclared variable passed to a typed parameter`),

  B('1', 'Variables, cells, loops', r`¦Dim x As Long¦ (counts), ¦Double¦ (prices, returns), ¦String¦ ("AAPL"), no type = Variant. A decimal in a Long is rounded. ¦&¦ joins text, ¦'¦ starts a comment.
¦Worksheets("Sheet1").Cells(3, 2)¦ = B3 of Sheet1; ¦Cells(3, 2)¦ alone = active sheet. Save as .xlsm.`),
  B('2', 'Arrays, If, debugging', r`¦Dim prices(1 To 5) As Double¦; sum: ¦total = total + prices(i)¦; max: start at prices(1), loop from 2.
¦If … Then / ElseIf … Then / Else / End If¦; operators ¦<>¦, ¦>=¦, ¦<=¦. Put the strictest test first (Strong Buy > 0.10 before Buy > 0.02).
Breakpoint pauses before the line; Step Into; Locals Window; break on ¦Next¦.`),
  B('3', 'Income tax table (Sheet2, rows 3–11)', r`$$\begin{array}{r|r|r|r}\text{row}&\text{From}&\text{To}&\%\\\hline 3&0&7\,479&14.5\\4&7\,479&11\,284&21\\5&11\,284&15\,992&26.5\\6&15\,992&20\,700&28.5\\7&20\,700&26\,355&35\\8&26\,355&38\,632&37\\9&38\,632&50\,483&43.5\\10&50\,483&78\,834&45\\11&78\,834&-&48\end{array}$$
Tax(20 000) = 4 273.405 (row 6); Tax(30 000) = 7 800.805 (row 8).`),
  B('3', 'income_tax_main', r`1 read income, ¦If income < 0¦ → MsgBox, ¦Exit Sub¦; 2 ¦upper(i) = Cells(i + 2, 2)¦, i = 1…9; 3 ¦If income <= upper(i)¦: write income to ¦Cells(i + 2, 2)¦, read ¦Cells(i + 2, 6)¦, ¦Exit For¦; 4 restore; 5 write tax.
Rounds: 1 + 5, then 2 + 4, then 3. With ¦<¦ an income equal to a threshold goes to the next row: width 0, same tax.`),
  B('4', 'Call and batch processing', r`¦Sub Tax_One(income As Double, out_row As Long, out_col As Long)¦; ¦Call Tax_One(25000, 15, 3)¦ → C15. Arguments by position.
¦Tax_Batch¦: ¦For i = 1 To n_clients¦, read ¦Cells(i + 1, 1)¦, ¦Call Tax_One(client_income, i + 1, 2)¦. More clients / list moved / output column → outer Sub; new bracket / table moved → inner Sub.`),
  B('5', 'Simulation', r`¦Rnd()¦ ∈ [0, 1); ¦Rnd() ∗ (b - a) + a¦ ∈ [a, b), mean $\frac{a+b}{2}$.
¦Application.WorksheetFunction.NormInv(Rnd(), mu, sigma)¦ = $\mu+\sigma z_p$; $z_{0.975}=1.96$, $z_{0.95}=1.645$, $z_{0.9}=1.2816$, $z_{0.8}=0.8416$.
Method 1 ¦.Formula = "=NORM.INV(RAND(), 0, 0.01)"¦ → formula, recalculates. Method 2 WorksheetFunction → static value.
¦Dim returns(1 To 40, 1 To 5)¦ + ¦Set ret_range = ws.Range(ws.Cells(3, 1), ws.Cells(42, 5))¦ + ¦ret_range.Value = returns¦.`),
  B('6', 'Range objects and statistics', r`¦Set col = ws.Range(ws.Cells(r1, c1), ws.Cells(r2, c2))¦: $(r_2-r_1+1)(c_2-c_1+1)$ cells.
¦Average(col)¦, ¦StDev_S(col)¦ ($n-1$), ¦Covariance_S(col1, col2)¦ ($n-1$); ¦Covariance_S(col1, col1)¦ = ¦StDev_S(col1) ^ 2¦.
Matrix: ¦ws.Cells(30 + i, j)¦ → rows 31–35; symmetric, variances on the diagonal; $\rho_{ij}=\frac{Cov_{ij}}{\sigma_i\sigma_j}$.`),
  B('7', 'User-defined functions', r`¦Function name(x As Double) As Double¦ … ¦name = result¦ … ¦End Function¦. No result assigned → default (0, "").
Use: ¦y = name(3)¦ in a Sub, ¦=name(B1)¦ in a cell. Objects: ¦Set ThisWB = ThisWorkbook¦.
Arrays: ¦Dim a() As Double¦, ¦ReDim a(1 To T, 1 To N)¦, return ¦As Variant¦. Arguments are ByRef: the function can change the caller's variable.`),
  B('8', 'Sharpe and Sortino from daily data', r`$$SR=\sqrt{252}\,\frac{\bar R_d-r_f/252}{\sigma_d},\qquad SoR=\sqrt{252}\,\frac{\bar R_d-r_f/252}{\sigma_d^-}$$
¦rf_d = rf / tdays¦, ¦Sqr(tdays)¦; $\sigma_d^-$ = ¦StDev_S¦ of the negative returns only. Std ignores skewness and kurtosis: B (skew −4.52, kurt 35.33) has Sharpe 0.75 > A 0.62 with rf = 2%.`),
];

/** Hand-written entries per class, followed by the class's key facts from the concept bank. */
export const CHEATSHEET: SheetBlock[] = [
  ...BLOCKS.filter(b => b.topic === null),
  ...Object.keys(LECTURES).flatMap(t => [...BLOCKS.filter(b => b.topic === t), keyFacts(BANK, t, 5)]),
];
