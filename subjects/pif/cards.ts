// Official PIF flashcards: VBA syntax, the course cases and the finance formulas, from ProgFin 1–6 and the UDF slides.
// Seeded into Supabase by `npm run seed:sql`. Fronts and backs may contain simple HTML.

export type SeedCard = { key: string; front: string; back: string };

export const DECK_NAME = 'PIF core concepts';

export const CARDS: SeedCard[] = [
  // Class 1
  { key: 'c1-dim', front: 'Declaring and assigning a variable', back: '<code>Dim shares As Long</code> creates the box, <code>shares = 10</code> fills it (read right to left). Without a type the variable is a Variant.' },
  { key: 'c1-types', front: 'Long, Double, String, Variant', back: 'Long: whole numbers (counts). Double: decimals (prices, rates, returns). String: text in quotes. Variant: anything, the default when no type is given. A decimal stored in a Long is rounded to a whole number.' },
  { key: 'c1-concat', front: '& and the comment quote', back: '<code>&amp;</code> glues strings: <code>"Year " &amp; 3</code> → "Year 3". A single quote <code>\'</code> starts a comment.' },
  { key: 'c1-cells', front: 'Cells(row, col)', back: 'Row first, column second: <code>Cells(3, 2)</code> = B3, <code>Cells(5, 3)</code> = C5. <code>Worksheets("Sheet1").Cells(3, 2)</code> always targets Sheet1; <code>Cells(3, 2)</code> alone uses the active sheet. .Value is the default property.' },
  { key: 'c1-readwrite', front: 'Writing to and reading from a cell', back: 'Write: <code>Worksheets("Sheet1").Cells(3, 2) = 150.75</code>. Read: <code>price = Worksheets("Sheet1").Cells(3, 2)</code>. Like copy-paste, but with code.' },
  { key: 'c1-for', front: 'For / Next loop', back: '<code>For i = 1 To 5 … Next</code>: Next adds 1 to i until i passes 5, so i = 6 after the loop. Using i in <code>Cells(i, 2)</code> reads a different row each time.' },
  { key: 'c1-xlsm', front: 'Saving a workbook with macros', back: 'Save as .xlsm (Excel Macro-Enabled Workbook); .xlsx drops the code.' },
  { key: 'c1-errors', front: 'Subscript out of range / Type mismatch', back: 'Subscript out of range: a sheet name or array slot that does not exist. Type mismatch: text in a number variable (or the reverse).' },
  // Class 2
  { key: 'c2-array', front: 'Array', back: '<code>Dim prices(1 To 3) As Double</code>: one name, three slots prices(1) … prices(3). Unlike a single variable inside a loop, it keeps every value.' },
  { key: 'c2-acc', front: 'Accumulator and counter', back: '<code>total = total + prices(i)</code> builds a running sum; <code>cnt = cnt + 1</code> inside an If counts matching rows. Start them at 0.' },
  { key: 'c2-max', front: 'Maximum of an array', back: '<code>max_price = prices(1)</code>, then loop from 2: <code>If prices(i) &gt; max_price Then max_price = prices(i)</code>.' },
  { key: 'c2-if', front: 'If / ElseIf / Else', back: 'Conditions are checked top-down; only the first true branch runs, then VBA jumps to End If. ElseIf needs a condition, Else is the catch-all. Put the strictest test (e.g. Strong Buy above 0.10) first.' },
  { key: 'c2-ops', front: 'Comparison operators', back: '= , &gt; , &lt; , <code>&lt;&gt;</code> (not equal), <code>&gt;=</code>, <code>&lt;=</code>.' },
  { key: 'c2-debug', front: 'Breakpoint, Step Into, Locals Window', back: 'A breakpoint (red dot in the margin) pauses before the line. Step Into runs one line at a time. The Locals Window shows every variable’s name, type and value. In a loop, break on Next.' },
  { key: 'c2-endif', front: 'Expected: End If', back: 'Compile error: an If block is not closed. Write End If right after If, then fill in the middle.' },
  // Class 3
  { key: 'c3-prog', front: 'Progressive income tax', back: 'Each rate applies only to the part of income inside its bracket. Tax = Σ (bracket width × rate) up to the income. Worksheet: D = B − A, E = D × C / 100, F = cumulative E.' },
  { key: 'c3-trick', front: 'Using the tax table as a compute engine', back: 'Find the first upper threshold ≥ income, overwrite it with the income, read the cumulative tax F in that row, restore the threshold. 20 000 → overwrite B6, read F6 = 4 273.41; 30 000 → B8, F8 = 7 800.81.' },
  { key: 'c3-steps', front: 'The five steps of income_tax_main', back: '1 read and validate income (negative → MsgBox, Exit Sub); 2 save upper thresholds in upper(1 To 9); 3 find row, overwrite, read tax, Exit For; 4 restore thresholds; 5 write the tax.' },
  { key: 'c3-rounds', front: 'Building in tested rounds', back: 'Round 1: steps 1 + 5 (input and output). Round 2: steps 2 + 4 (save and restore). Round 3: step 3 (core). Safe outer structure first, core last: non-linear construction.' },
  { key: 'c3-map', front: 'upper(i) = Cells(i + 2, 2)', back: 'Maps array slots 1 to 9 to worksheet rows 3 to 11 (column B).' },
  { key: 'c3-exit', front: 'Exit For and <=', back: '<code>If income &lt;= upper(i)</code> keeps an income equal to a threshold in its row. Exit For stops at the first match; without it later rows are overwritten too and the tax is wrong. Exit Sub ends the whole Sub.' },
  // Class 4
  { key: 'c4-param', front: 'Parameterised Sub', back: '<code>Sub Tax_One(income As Double, out_row As Long, out_col As Long)</code>: inputs come from outside. It cannot be started with Run; another Sub must call it.' },
  { key: 'c4-call', front: 'Call', back: '<code>Call Tax_One(25000, 15, 3)</code> runs Tax_One with income 25 000 and writes to row 15, column 3 = C15. Arguments match parameters by position.' },
  { key: 'c4-batch', front: 'Sub within a Sub (batch processing)', back: 'Outer Sub Tax_Batch loops over clients and calls the inner Sub Tax_One for each. More clients or a moved list → change the outer Sub; a new bracket → change the inner Sub. This hierarchy is abstraction.' },
  // Class 5
  { key: 'c5-rnd', front: 'Rnd()', back: 'Uniform random number in [0, 1): can be 0, never 1; a new draw each call. <code>Rnd() * (b - a) + a</code> scales it to [a, b).' },
  { key: 'c5-norminv', front: 'Normal draws', back: '<code>Application.WorksheetFunction.NormInv(Rnd(), mean, std)</code> = mean + std × z(p). NormInv(0.5, …) = mean; with std 1%, 0.975 → +0.0196, 0.025 → −0.0196.' },
  { key: 'c5-methods', front: 'Two ways to call Excel functions', back: 'Method 1: <code>ws.Cells(3, 1).Formula = "=NORM.INV(RAND(), 0, 0.01)"</code> leaves a formula that recalculates. Method 2: <code>Application.WorksheetFunction.NormInv(…)</code> returns a static value, faster. Commas separate arguments; newer names use underscores (Norm_Inv, StDev_S).' },
  { key: 'c5-set', front: 'Set for objects', back: '<code>Dim ws As Worksheet</code>, <code>Set ws = Worksheets("Sheet1")</code>. Worksheets, Ranges and Workbooks are objects and need Set; without it: run-time error 91.' },
  { key: 'c5-array-range', front: 'Writing an array to a Range in one step', back: '<code>Dim returns(1 To 40, 1 To 1) As Double</code>, <code>Set ret_range = ws.Range(ws.Cells(3, 1), ws.Cells(42, 1))</code>, fill the array, then <code>ret_range.Value = returns</code>. Two dimensions, same size as the Range.' },
  { key: 'c5-errors', front: 'Errors in Class 5', back: 'Sub or Function not defined: misspelled function name after WorksheetFunction. 1004: NormInv got a probability of exactly 0. 91: object assigned without Set.' },
  // Class 6
  { key: 'c6-range', front: 'Range object', back: '<code>Set col = ws.Range(ws.Cells(1, 1), ws.Cells(20, 1))</code> = A1:A20, from top-left to bottom-right. Both Cells must be on the same sheet (else error 1004).' },
  { key: 'c6-stats', front: 'Statistics of a Range', back: '<code>WorksheetFunction.Average(col)</code>, <code>StDev_S(col)</code> (sample, n − 1), <code>Covariance_S(col1, col2)</code> (sample).' },
  { key: 'c6-cov', front: 'Covariance facts', back: 'Positive when assets move together, negative when opposite, near zero when unrelated. Cov(i, i) = variance = StDev_S^2. The matrix is symmetric with variances on the diagonal.' },
  { key: 'c6-corr', front: 'Correlation', back: 'ρ<sub>ij</sub> = Cov(i, j) / (σ<sub>i</sub> × σ<sub>j</sub>).' },
  { key: 'c6-matrix', front: 'Covar_Matrix', back: 'Outer loop i fixes col_i, inner loop j builds col_j; <code>ws.Cells(30 + i, j) = Covariance_S(col_i, col_j)</code> fills rows 31–35, columns A–E.' },
  // Class 7
  { key: 'c7-udf', front: 'Structure of a user-defined function', back: '<code>Function name(arg As Type) As Type</code> … <code>name = result</code> … <code>End Function</code>. Zero, one or several arguments; the result is assigned to the function’s name.' },
  { key: 'c7-use', front: 'Using a function', back: 'From a Sub: <code>x = regards_function("Students")</code>. From a cell: <code>=regards_function(B1)</code>. A function with arguments cannot be run with the Run button.' },
  { key: 'c7-redim', front: 'Dynamic arrays', back: '<code>Dim my_array(1 To T, 1 To N)</code> fails for variables T, N. Use <code>Dim my_array() As Double</code> then <code>ReDim my_array(1 To T, 1 To N)</code>. Return arrays As Variant.' },
  { key: 'c7-byref', front: 'ByRef by default', back: 'A variable passed to a function can be changed by it when the function overwrites its parameter. An undeclared (Variant) variable passed to a String parameter: “ByRef argument type mismatch”.' },
  { key: 'c7-object', front: 'Functions returning objects', back: '<code>Function ThisWB() As Workbook</code> with <code>Set ThisWB = ThisWorkbook</code>; <code>ThisWB().Name</code> gives the workbook name.' },
  // Class 8
  { key: 'c8-sharpe', front: 'sharpe_ratio from daily returns', back: 'avg = Average(returns), std = StDev_S(returns), tdays = 252, rf_d = rf / tdays; Sharpe = Sqr(tdays) × (avg − rf_d) / std.' },
  { key: 'c8-sortino', front: 'Sortino ratio', back: 'Same numerator; denominator = downside volatility, the StDev_S of the negative returns only. Annualise with Sqr(252).' },
  { key: 'c8-moments', front: 'Skewness and kurtosis problem', back: 'Std ignores the shape of the distribution. B: mean 14.00%, std 15.99%, skew −4.52, kurtosis 35.33, Sharpe 0.75 beats A (14.14%, 19.57%, 0.12, 0.07, Sharpe 0.62) but hides a fat left tail.' },
];
