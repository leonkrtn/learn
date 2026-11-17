import { ex, type ExplainMap } from '@/lib/explain';

export const L1: ExplainMap = {
  'L1.trace': ex`
@task
A short Sub with a For loop that updates a variable. You are asked for the value written to the sheet, the cell that receives it, and the message box text showing the loop counter after the loop.

@idea
Trace the loop by hand: write down the counter and the variable after every pass. Three VBA facts decide the answers:

- \`For i = a To b\` runs $b - a + 1$ times, with i = a, a+1, …, b.
- \`Cells(row, column)\`: the **row comes first**, then the column number (1 = A, 2 = B, …).
- \`Next\` increases i one more time before the test fails, so after the loop **i = b + 1**.

@steps
1. Start value of the variable (the line before the loop).
2. Make a table: i, value after the body line.
3. The last row of the table is the value written.
4. Convert \`Cells(r, c)\` to a cell address: column letter from c, then r.
5. i after the loop $= b + 1$.

@example
~~~
Sub Loop_Test()
    Dim x As Double
    Dim i As Long
    x = 10
    For i = 1 To 4
        x = x + 3 * i
    Next
    Worksheets("Sheet1").Cells(2, 3) = x
    MsgBox ("i = " & i)
End Sub
~~~

@solution
1. x starts at 10.
2. i = 1: 13; i = 2: 19; i = 3: 28; i = 4: 40.
3. x = 40 is written.
4. \`Cells(2, 3)\` = row 2, column 3 = C2.
5. After the loop i = 5, so the MsgBox shows "i = 5".

@answer
C2 receives 40; the message is "i = 5".

@pitfalls
- Reading \`Cells(2, 3)\` as column 2, row 3 (B3).
- Stopping the trace one pass early or late.
- Thinking i equals the end value (4) after the loop.
`,

  'L1.cells': ex`
@task
A column of prices and a loop that copies (and maybe scales) them to another column, possibly shifted by some rows. You are asked for the last cell written, the number of cells written and the value in one target cell.

@idea
Each pass reads \`Cells(i, source column)\` and writes \`Cells(i + k, target column)\`. So:

- the loop writes one cell per pass: $b - a + 1$ cells;
- row $i$ in the source maps to row $i + k$ in the target;
- the last write is at row $b + k$ of the target column.

To find the value of a target cell, go back $k$ rows to the source row and apply the formula.

@steps
1. Count passes: $b - a + 1$.
2. Last target row $= b + k$; column letter from the target column number.
3. For a target cell in row $t$: source row $= t - k$; value $=$ source value × factor.

@example
Column A holds prices in A1:A6 (A3 = 48.50).
~~~
For i = 2 To 5
    Worksheets("Sheet1").Cells(i + 1, 3) = Worksheets("Sheet1").Cells(i, 1) * 2
Next
~~~
Last cell written? How many cells? Value in C4?

@solution
1. i = 2 to 5: 4 passes, 4 cells.
2. Last target row $= 5 + 1 = 6$, column 3 = C → C6.
3. C4 comes from row $4 - 1 = 3$: $48.50 \times 2 = 97$.

@answer
Last cell C6; 4 cells written; C4 = 97.

@pitfalls
- Forgetting the row shift $+k$.
- Counting $b - a$ cells instead of $b - a + 1$.
- Swapping row and column numbers when converting to an address.
`,

  'L1.types': ex`
@task
A Sub declares variables with types (String, Long, Double, no type), assigns values and builds a message with \`&\`. You are asked what a Long stores, the value and type of an untyped variable, and the message text.

@idea
- **Long** holds whole numbers: assigning 12.7 stores **13** (VBA rounds; exact halves go to the nearest even number).
- **Double** keeps decimals; **String** holds text.
- A variable declared without a type (\`Dim total\`) is a **Variant**: it takes whatever is assigned.
- \`&\` concatenates text and numbers into one string, exactly as written (no extra spaces).

@steps
1. Apply each type to the assigned value (round for Long).
2. Compute expressions with the stored (rounded) values.
3. Build the message piece by piece with \`&\`.

@example
~~~
Dim ticker As String
Dim shares As Long
Dim price As Double
Dim total
ticker = "SAP"
shares = 12.7
price = 25.5
total = shares * price
MsgBox ("Stock: " & ticker & ", Value: " & total)
~~~

@solution
1. shares = 12.7 → Long stores 13.
2. total = 13 × 25.5 = 331.5; total is a Variant.
3. Message: "Stock: SAP, Value: 331.5".

@answer
shares = 13, total = 331.5 (Variant), message "Stock: SAP, Value: 331.5".

@pitfalls
- Multiplying with 12.7 instead of the stored 13.
- Calling the untyped variable a Double.
- Writing the variable names instead of their values in the message.
`,

  'L1.concept': ex`
@task
Concept questions on VBA basics: variables and types, cell references, loops and the editor. True/false, find the false (or true) statement, or the best answer.

@idea
- Code lives in **modules**; a \`Sub … End Sub\` is a macro you run.
- \`Dim x As Type\` declares a variable; Long = whole numbers, Double = decimals, String = text, no type = Variant.
- \`Cells(row, column)\` uses numbers, row first; \`Range("B3")\` uses an address.
- \`Worksheets("Sheet1").Cells(…)\` reads or writes a specific sheet.
- \`For i = a To b … Next\` repeats $b - a + 1$ times; afterwards i = b + 1.
- \`&\` joins text; \`MsgBox\` shows a message; an apostrophe starts a comment.

@steps
1. Identify the feature the statement is about.
2. Recall its exact rule (order of arguments, rounding, loop count).
3. Pick the odd one out among four options.

@example
True or false? "Cells(2, 5) refers to cell B5."

@solution
1. Feature: \`Cells(row, column)\`.
2. Row 2, column 5 = E.

@answer
False. Cells(2, 5) is E2.

@pitfalls
- Swapping row and column in \`Cells\`.
- Expecting a Long to keep decimals.
- Thinking the loop counter equals the end value after \`Next\`.
`,
};
