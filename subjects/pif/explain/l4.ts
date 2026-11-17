import { ex, type ExplainMap } from '@/lib/explain';

export const L4: ExplainMap = {
  'L4.call': ex`
@task
A Sub \`Classify(income, out_row)\` writes "High" or "Low" to a cell; a loop calls it for several rows. You are asked how many cells get "High", which cell a call writes to, or what one cell contains.

@idea
\`Call Classify(x, i)\` runs the Sub with **income = x** and **out_row = i**: arguments are matched **by position**. Each call writes exactly one cell, in row out_row of the output column. So the loop produces one label per row, and you only need to compare each income with the threshold.

@steps
1. List the incomes the loop passes in.
2. Compare each with the threshold (watch \`>\` vs \`>=\`).
3. Each call writes Cells(out_row, output column).
4. Count the "High" labels.

@example
~~~
Sub Classify(income As Double, out_row As Long)
    If income > 50000 Then
        Worksheets("Sheet1").Cells(out_row, 3) = "High"
    Else
        Worksheets("Sheet1").Cells(out_row, 3) = "Low"
    End If
End Sub

For i = 2 To 5
    Call Classify(Worksheets("Sheet1").Cells(i, 1), i)
Next
~~~
A2:A5: 30,000; 55,000; 80,000; 50,000.

@solution
1. Incomes 30k, 55k, 80k, 50k.
2. > 50,000: 55k and 80k (50,000 itself is not).
3. Labels go to C2:C5.
4. Two "High" (C3, C4).

@answer
2 cells receive "High": C3 and C4.

@pitfalls
- Counting 50,000 as High with a strict \`>\`.
- Mixing up which argument is the row.
`,

  'L4.batch': ex`
@task
\`Tax_Batch\` loops over clients and calls \`Tax_One\` for each. You are asked for the last row read, how often Tax_One runs, or what a call writes.

@idea
The outer Sub owns the **data layout**: how many clients, where they are, where results go. The inner Sub owns the **logic** (tax table). With \`For i = 1 To n_clients\` reading \`Cells(i + off, 1)\`:

- Tax_One runs n_clients times;
- the rows read are 1 + off to n_clients + off.

@steps
1. Number of runs $=$ number of loop passes.
2. First and last row read: $1 + \text{off}$ and $n + \text{off}$.
3. Each call writes the tax for that row's income.

@example
n_clients = 20; the loop reads \`Cells(i + 1, 1)\` and calls \`Tax_One(client_income, i + 1, 2)\`.

@solution
1. Tax_One runs 20 times.
2. Rows read: 2 to 21; the last is row 21.
3. Each tax goes to column B of the same row.

@answer
Last row read 21; Tax_One runs 20 times.

@pitfalls
- Forgetting the row offset (answering 20 instead of 21).
- Counting the header row as a client.
`,

  'L4.args': ex`
@task
Calls with literal arguments, \`Call Tax_One(income, out_row, out_col)\`, and design questions about which Sub must change when requirements change.

@idea
- Arguments are matched by **position**: the first value is the income, the second the row, the third the column. So \`Call Tax_One(30000, 5, 3)\` writes the tax on 30,000 to \`Cells(5, 3)\` = C5.
- Separation of concerns: **Tax_Batch** (outer) knows the data — number of clients, where they are, where results go. **Tax_One** (inner) knows the tax logic — the table and brackets. A rate stored in the worksheet changes **no** code.

@steps
1. Map each argument by position.
2. Convert (row, column) to an address.
3. Compute the tax for the income with the table.
4. For a design change, ask: is it about data layout (Tax_Batch), tax logic (Tax_One) or worksheet data (neither)?

@example
\`Call Tax_One(30000, 5, 3)\`. Then: "The client list moves to another worksheet." Which Sub changes?

@solution
1. income = 30,000, out_row = 5, out_col = 3.
2. Cell C5.
3. Tax on €30,000 with the Case 1 table = €7,800.81.
4. Where clients are is data layout → Tax_Batch.

@answer
C5 receives €7,800.81; the move changes Tax_Batch.

@pitfalls
- Reading (5, 3) as E3.
- Changing Tax_One for a layout change, or code for a rate change stored in the sheet.
`,

  'L4.concept': ex`
@task
Concept questions on parameterised Subs, Call and batch processing: true/false, find the false (or true) statement, or the best answer.

@idea
- A Sub with parameters, \`Sub Tax_One(income As Double, out_row As Long, out_col As Long)\`, is reusable: the caller supplies the values.
- \`Call Name(a, b, c)\` passes arguments by position; types must fit.
- Batch processing: an outer loop calls the inner Sub once per item.
- Split responsibilities: data layout in the outer Sub, logic in the inner one, parameters such as rates in the worksheet.
- Testing the inner Sub with literal arguments (\`Call Tax_One(30000, 5, 3)\`) before running the batch.

@steps
1. Identify the concept (parameters, Call, separation of concerns).
2. Check the rule.
3. Pick the odd one out among four options.

@example
True or false? "Arguments in a Call are matched to parameters by their names."

@solution
1. Concept: argument passing.
2. In the course's calls they are matched by position.

@answer
False. They are matched by position.

@pitfalls
- Putting data layout into the inner Sub.
- Hard-coding rates in code when they live in the worksheet.
`,
};
