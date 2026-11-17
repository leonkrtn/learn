import { ex, type ExplainMap } from '@/lib/explain';

export const L3: ExplainMap = {
  'L3.tax': ex`
@task
An income and the Case 1 progressive tax table (From, To, Rate). You are asked for the total tax, which cell the code overwrites with the income, the average tax rate and the marginal tax rate.

@idea
In a **progressive** system each rate applies only to the part of the income **inside** its bracket. The worksheet computes, per row, the bracket width $D = B - A$, the bracket tax $E = D \times C/100$ and the cumulative tax $F$. The macro writes the income into the **To** cell (column B) of the bracket that contains it, so that row's width becomes "income − From", and then reads the cumulative tax in column F of that row.

- Average rate $=$ tax $/$ income. Marginal rate $=$ rate of the income's bracket.

@steps
1. Find the bracket: the first row whose To is at least the income.
2. Tax $=$ cumulative tax of all full brackets below $+$ (income $-$ From) × rate.
3. Cell overwritten: column B of that row.
4. Average rate $=$ tax $/$ income; marginal $=$ that row's rate.

@example
Income €30,000. Rows 3–8 of the table: 0–7,479 @ 14.5%, 7,479–11,284 @ 21%, 11,284–15,992 @ 26.5%, 15,992–20,700 @ 28.5%, 20,700–26,355 @ 35%, 26,355–38,632 @ 37%.

@solution
1. 30,000 ≤ 38,632 → row 8 (26,355–38,632 @ 37%).
2. Cumulative tax up to 26,355 $= 1{,}084.45 + 799.05 + 1{,}247.62 + 1{,}341.78 + 1{,}979.25 = 6{,}452.16$; plus $(30{,}000 - 26{,}355) \times 37\% = 1{,}348.65$ → €7,800.81.
3. The code overwrites B8 with 30,000.
4. Average $= 7{,}800.81/30{,}000 = 26.0\%$; marginal 37%.

@answer
Tax €7,800.81; cell B8; average rate 26.0%, marginal rate 37%.

@pitfalls
- Applying 37% to the whole income (that is a flat tax).
- Using the next row's rate (the bracket is the first To ≥ income).
- Confusing average and marginal rate.
`,

  'L3.table': ex`
@task
A new progressive tax table with From, To and Rate. You are asked for a bracket's tax (column E), the cumulative tax in column F, the tax for an income and its average rate.

@idea
Build the table column by column:

- $D$ (bracket width) $= \text{To} - \text{From}$
- $E$ (tax of a full bracket) $= D \times \text{rate}/100$
- $F$ (cumulative) $=$ sum of $E$ up to this row $=$ tax on an income exactly at this row's To.

The tax for any income $= F$ of the row below its bracket $+ (\text{income} - \text{From}) \times \text{rate}$.

@steps
1. Widths and bracket taxes for each row.
2. Cumulative sums.
3. Locate the income's bracket; add the partial bracket tax to the previous cumulative.
4. Average rate $=$ tax $/$ income.

@example
Brackets: 0–10,000 @ 10%; 10,000–25,000 @ 20%; 25,000–50,000 @ 30%; above @ 40%. Income €35,000.

@solution
1. E: 1,000; 3,000; 7,500.
2. F: 1,000; 4,000; 11,500.
3. 35,000 is in the third bracket: $4{,}000 + (35{,}000 - 25{,}000) \times 30\% = 7{,}000$.
4. Average $= 7{,}000/35{,}000 = 20\%$.

@answer
Tax €7,000; average rate 20%.

@pitfalls
- Adding the full tax of the income's own bracket.
- Using the cumulative tax of the income's row instead of the row below.
`,

  'L3.code': ex`
@task
The core loop of the tax macro: it searches the bracket with an If inside a For loop and leaves with \`Exit For\`. You are asked for i when Exit For runs, the cell overwritten, the cell the tax is read from, the tax, and the effect of \`<\` versus \`<=\`.

@idea
~~~
For i = 1 To 9
    If income <= upper(i) Then
        Worksheets("Sheet2").Cells(i + 2, 2) = income
        tax = Worksheets("Sheet2").Cells(i + 2, 6)
        Exit For
    End If
Next
~~~
The loop stops at the **first** bracket whose upper limit the income does not exceed. Table rows start at row 3, so bracket i sits in row **i + 2**: the income goes into column B of that row and the tax is read from column F. With \`<\` instead of \`<=\`, an income exactly equal to an upper limit skips to the next bracket (a different row, but the same tax, because that bracket's width becomes 0).

@steps
1. Find the first i with income $\leq$ upper(i) (or $<$).
2. Row $= i + 2$; overwritten cell: B(i + 2); tax cell: F(i + 2).
3. Tax $=$ cumulative tax below $+$ (income $-$ From) × rate.

@example
Income 11,284, which equals the upper limit of bracket 2 (row 4). Compare \`<=\` and \`<\`.

@solution
1. With \`<=\`: i = 2 (11,284 ≤ 11,284). With \`<\`: i = 3.
2. \`<=\`: B4 overwritten, tax read from F4. \`<\`: B5 and F5.
3. Both give €1,883.50 (with \`<\`, row 5's width is 11,284 − 11,284 = 0).

@answer
<= exits at i = 2 (B4/F4), < at i = 3 (B5/F5); the tax is €1,883.50 either way.

@pitfalls
- Forgetting the +2 row offset.
- Reading the tax from column E (one bracket) instead of F (cumulative).
- Thinking the loop continues after Exit For.
`,

  'L3.concept': ex`
@task
Concept questions on Case 1 (progressive income tax): true/false, find the false (or true) statement, or the best answer.

@idea
- Progressive tax: each rate applies only to the part of income in its bracket; the marginal rate is the top bracket's rate, the average rate is lower.
- Table columns: width $D$, bracket tax $E$, cumulative $F$.
- The macro loops over brackets, writes the income into the bracket's To cell, reads the cumulative tax and leaves with \`Exit For\`.
- Plan before coding: inputs (income, table), process (find bracket, compute), output (tax cell).
- Keeping the table on the worksheet means rate changes need no code changes.

@steps
1. Identify whether the statement is about the tax logic or the code.
2. Check against the rules above.
3. Pick the odd one out among four options.

@example
True or false? "In a progressive system, the marginal tax rate is the total tax divided by income."

@solution
1. Tax divided by income is the average rate.
2. The marginal rate is the rate on the last euro earned.

@answer
False. That is the average tax rate.

@pitfalls
- Applying the top rate to the whole income.
- Confusing \`Exit For\` with \`Exit Sub\`.
`,
};
