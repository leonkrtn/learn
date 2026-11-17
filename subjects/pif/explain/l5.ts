import { ex, type ExplainMap } from '@/lib/explain';

export const L5: ExplainMap = {
  'L5.uniform': ex`
@task
A loop draws returns with \`ret = Rnd() * (b - a) + a\` and writes them to the sheet. You are asked for the value for a given Rnd() draw, the average of many draws, the range of possible values, or the row a draw lands in.

@idea
\`Rnd()\` returns a uniform number in $[0, 1)$. Stretching and shifting turns it into a uniform draw on $[a, b)$:

$$\text{ret} = \text{Rnd()} \times (b - a) + a$$

Its average is the midpoint $(a + b)/2$. The upper end $b$ itself is never reached because Rnd() < 1.

@steps
1. For a given draw $u$: $u(b - a) + a$.
2. Average $= (a + b)/2$.
3. Range: $[a, b)$.
4. Row of draw i: from the \`Cells(i + offset, …)\` in the loop.

@example
$a = -0.02$, $b = 0.04$; the loop writes \`ws.Cells(i + 2, 1) = ret\`. Rnd() returns 0.25 for i = 1.

@solution
1. $0.25 \times 0.06 - 0.02 = -0.005$.
2. Average $= (−0.02 + 0.04)/2 = 0.01$.
3. Values in $[-0.02, 0.04)$.
4. i = 1 goes to row 3.

@answer
ret = −0.005; average 0.01; range [−0.02, 0.04); row 3.

@pitfalls
- Writing \`Rnd() * b + a\` (range too wide).
- Including $b$ in the range.
- Forgetting the row offset.
`,

  'L5.norm': ex`
@task
Normal returns are drawn with \`WorksheetFunction.NormInv(p, mean, std)\`. Given standard normal quantiles, you compute NormInv for given probabilities, the result for p = 0.5, and the share of draws between two quantiles.

@idea
NormInv is the inverse of the normal CDF. For a normal with mean μ and standard deviation σ:

$$\text{NormInv}(p, \mu, \sigma) = \mu + \sigma \cdot z(p)$$

where $z(p)$ = NORM.S.INV(p) is the standard normal quantile. Feeding it \`Rnd()\` (uniform) produces normal draws. p = 0.5 gives the mean; between the $1 - p$ and $p$ quantiles lie $2p - 1$ of all draws.

@steps
1. Look up $z(p)$.
2. Result $= \mu + \sigma z(p)$.
3. Share between symmetric quantiles $= 2p - 1$.

@example
μ = 0.001, σ = 0.02; NORM.S.INV(0.975) = 1.96.

@solution
1. $z(0.975) = 1.96$, $z(0.025) = -1.96$.
2. NormInv(0.975, …) $= 0.001 + 0.02 \times 1.96 = 0.0402$; NormInv(0.025, …) $= -0.0382$.
3. Between them: $2 \times 0.975 - 1 = 95\%$ of the draws; NormInv(0.5, …) = 0.001.

@answer
0.0402 and −0.0382; 95% of draws lie between them; the median draw is 0.001.

@pitfalls
- Using σ² instead of σ.
- Adding $z$ to the mean without multiplying by σ.
- Thinking p is the return itself.
`,

  'L5.array': ex`
@task
A Sub fills a 2D array \`returns(1 To T, 1 To n)\` with random draws and writes it to the sheet in one step through a Range. You are asked where the Range must end and how many draws are written.

@idea
Assigning an array to a Range writes it in one go, but the Range must have **exactly** the array's shape: T rows and n columns. Starting at the top-left cell (row $r_0$, column $c_0$), the bottom-right cell is

$$(r_0 + T - 1,\; c_0 + n - 1)$$

The number of draws is $T \times n$.

@steps
1. Top-left cell from the code.
2. Bottom-right row $= r_0 + T - 1$, column $= c_0 + n - 1$.
3. Convert to an address; draws $= T \times n$.

@example
\`Dim returns(1 To 250, 1 To 3)\`, written to \`ws.Range(ws.Cells(3, 1), ws.Cells(?, ?))\`.

@solution
1. Top-left A3 (row 3, column 1).
2. Bottom-right row $= 3 + 250 - 1 = 252$; column $= 1 + 3 - 1 = 3$.
3. C252; $250 \times 3 = 750$ draws.

@answer
The Range ends at C252; 750 draws are written.

@pitfalls
- Off by one: ending at row 253.
- Swapping T and n.
- Using $T + n$ instead of $T \times n$.
`,

  'L5.errors': ex`
@task
Code that uses objects (Worksheet, Range) and Excel functions. You say what happens: run-time error 91, error 1004, "Sub or Function not defined", Type mismatch, no error, or what a cell contains afterwards.

@idea
- **Objects need Set**: \`Set ws = Worksheets("Sheet1")\`, \`Set col = ws.Range(…)\`. Without \`Set\` → run-time error 91.
- **WorksheetFunction errors**: NormInv with p = 0 or 1 (outside (0, 1)) fails → run-time error 1004.
- Two ways to use Excel functions:
  - **Method 1**: \`ws.Cells(3, 1).Formula = "=NORM.INV(RAND(), …)"\` puts a **formula** in the cell; it recalculates.
  - **Method 2**: \`Application.WorksheetFunction.NormInv(Rnd(), …)\` computes in VBA and writes a **static number**.

@steps
1. Is an object assigned without Set? → error 91.
2. Is a worksheet function called with invalid input? → error 1004.
3. Does the code write a formula string or a value?
4. Otherwise, the code runs.

@example
~~~
Dim ws As Worksheet
Dim col As Range
Set ws = Worksheets("Sheet1")
col = ws.Range(ws.Cells(1, 1), ws.Cells(20, 1))
~~~

@solution
1. \`ws\` is set correctly.
2. \`col\` is a Range object assigned without \`Set\`.

@answer
Run-time error 91 (object variable not set).

@pitfalls
- Using Set for plain numbers or forgetting it for Ranges.
- Expecting Method 2 to leave a formula in the cell.
- Feeding NormInv a probability of exactly 0 or 1.
`,

  'L5.concept': ex`
@task
Concept questions on simulation in VBA: true/false, find the false (or true) statement, or the best answer.

@idea
- \`Rnd()\` gives uniform draws in [0, 1); \`Rnd() * (b - a) + a\` gives uniform on [a, b).
- Normal draws: \`WorksheetFunction.NormInv(Rnd(), μ, σ)\` (inverse-transform method).
- Objects (Worksheet, Range) are assigned with \`Set\`.
- Writing an array to a Range of the same shape is fast (one step instead of cell by cell).
- \`.Formula\` puts a live formula in a cell; WorksheetFunction returns a fixed value.
- \`Randomize\` changes the seed so runs differ.

@steps
1. Identify the feature (Rnd, NormInv, Set, arrays to ranges, formulas vs values).
2. Check the rule.
3. Pick the odd one out among four options.

@example
True or false? "Rnd() * (b − a) + a can return exactly b."

@solution
1. Rnd() < 1 always.
2. So $\text{Rnd()} \times (b - a) + a < b$.

@answer
False. The range is [a, b), b is never reached.

@pitfalls
- Assigning objects without Set.
- Thinking WorksheetFunction writes formulas.
`,
};
