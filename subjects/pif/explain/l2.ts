import { ex, type ExplainMap } from '@/lib/explain';

export const L2: ExplainMap = {
  'L2.array': ex`
@task
A loop fills an array from the sheet and accumulates a total, an average, a maximum or a count. You are asked for the total or average, a variable's value after the loop, an array element, or the loop counter.

@idea
An **accumulator** is a variable that is updated in every pass:

- total: \`total = total + prices(i)\`
- maximum: \`If prices(i) > max_price Then max_price = prices(i)\`
- count: \`If condition Then cnt = cnt + 1\`

The array keeps every value: \`prices(k)\` is the k-th one read. A plain variable overwritten in the loop holds the **last** value. After \`For i = 1 To n\`, i = n + 1.

@steps
1. List the values the loop reads, in order.
2. Apply the accumulator rule pass by pass.
3. Average $=$ total $/ n$.
4. A variable overwritten in each pass ends with the last value; i ends at n + 1.

@example
~~~
Dim prices(1 To 4) As Double
For i = 1 To 4
    prices(i) = Worksheets("Sheet1").Cells(i + 1, 2)
    total = total + prices(i)
    If prices(i) > max_price Then max_price = prices(i)
Next
~~~
B2:B5 hold 10, 12, 11, 15.

@solution
1. Values read: 10, 12, 11, 15.
2. total: 10, 22, 33, 48; max_price: 10, 12, 12, 15.
3. Average $= 48/4 = 12$.
4. prices(3) = 11; i = 5 after the loop.

@answer
total 48, average 12, max_price 15, prices(3) = 11, i = 5.

@pitfalls
- Forgetting the row offset (\`i + 1\`) when reading the sheet.
- Confusing the array element with the accumulator.
- Assuming i = 4 after the loop.
`,

  'L2.signal': ex`
@task
A Sub reads a return and shows "Strong Buy", "Buy", "Hold" or "Sell" through an If / ElseIf / Else chain. For several values you say which message appears.

@idea
VBA tests the conditions **from the top** and runs only the **first true branch**; the rest is skipped. So:

- Order matters: if \`ret > 0.02\` ("Buy") comes before \`ret > 0.08\` ("Strong Buy"), the Strong Buy branch can never be reached.
- Boundaries matter: \`>\` excludes the threshold itself, \`>=\` includes it.
- \`Else\` catches everything no condition caught.

@steps
1. For each value, test the conditions in the written order.
2. Stop at the first true one; that is the message.
3. If none is true, the Else message.

@example
~~~
If ret > 0.02 Then
    MsgBox ("Buy")
ElseIf ret > 0.08 Then
    MsgBox ("Strong Buy")
ElseIf ret < -0.02 Then
    MsgBox ("Sell")
Else
    MsgBox ("Hold")
End If
~~~
Values: 0.1, 0.02, −0.03.

@solution
1. 0.1: \`0.1 > 0.02\` is true → "Buy" (Strong Buy is never reached).
2. 0.02: \`0.02 > 0.02\` false; \`> 0.08\` false; \`< -0.02\` false → "Hold".
3. −0.03: first two false; \`-0.03 < -0.02\` true → "Sell".

@answer
Buy for 0.1 (the Buy test comes first), Hold for 0.02, Sell for −0.03.

@pitfalls
- Picking the "best fitting" branch instead of the first true one.
- Treating \`>\` as \`>=\` at the boundary.
- Forgetting that −0.02 is not < −0.02.
`,

  'L2.filter': ex`
@task
A loop reads values (e.g. salaries) row by row, an If inside decides which ones count, and a counter (and sometimes a sum) is updated. You are asked for the count shown, the sum, or other values after the loop.

@idea
Combine the loop trace with the If test: in each pass, check the condition for that row's value; only when it is true do the counter and the sum change. Watch the comparison operator (\`>\` vs \`>=\`) and which rows the loop actually reads.

@steps
1. List the values in the rows the loop visits.
2. Mark those that satisfy the condition.
3. Count them; add them up if there is a sum.

@example
~~~
senior_count = 0
For i = 2 To 6
    salary = Worksheets("Sheet1").Cells(i, 2)
    If salary >= 60000 Then
        senior_count = senior_count + 1
        senior_total = senior_total + salary
    End If
Next
MsgBox (senior_count)
~~~
B2:B6: 45,000; 60,000; 72,000; 58,000; 90,000.

@solution
1. Values: 45k, 60k, 72k, 58k, 90k.
2. ≥ 60,000: 60k, 72k, 90k.
3. Count 3; total $= 222{,}000$.

@answer
The MsgBox shows 3; senior_total = 222,000.

@pitfalls
- Excluding a value equal to the threshold when the test is \`>=\`.
- Reading rows the loop does not visit.
- Adding every value to the sum instead of only those inside the If.
`,

  'L2.errors': ex`
@task
A short piece of VBA; you say which error it raises (or that it runs): "Subscript out of range", "Type mismatch", "Expected: End If", "Run-time error 91" or no error.

@idea
Match the code to the typical cause:

| Error | Typical cause |
|---|---|
| Subscript out of range | array index beyond its bounds, or a sheet name that does not exist |
| Type mismatch | text stored in a numeric variable (e.g. "n/a" into a Double) |
| Expected: End If | an If block without \`End If\` (compile error) |
| Run-time error 91 | object variable assigned without \`Set\` (e.g. \`ws = Worksheets(…)\`) |

@steps
1. Check block structure first (If … End If, For … Next).
2. Check array bounds against the loop range.
3. Check sheet names and cell contents against the variable types.
4. Check that objects (Worksheet, Range) are assigned with \`Set\`.
5. If nothing is wrong, the code runs.

@example
~~~
Dim prices(1 To 3) As Double
For i = 1 To 4
    prices(i) = Worksheets("Sheet1").Cells(i, 2)
Next
~~~

@solution
1. Structure is complete.
2. The array has slots 1 to 3, the loop goes to 4.
3. At i = 4, \`prices(4)\` does not exist.

@answer
Subscript out of range.

@pitfalls
- Calling a wrong sheet name a "Type mismatch" (it is "Subscript out of range").
- Missing the absent \`End If\`.
- Forgetting \`Set\` for objects.
`,

  'L2.concept': ex`
@task
Concept questions on arrays, conditionals and debugging: true/false, find the false (or true) statement, or the best answer.

@idea
- \`Dim prices(1 To n) As Double\` declares an array with indexes 1 to n; using another index → "Subscript out of range".
- Accumulators: \`total = total + x\` inside the loop.
- If / ElseIf / Else runs only the first true branch; order and boundaries matter; every If block needs \`End If\`.
- Debugging: F8 steps through code line by line, breakpoints pause it, the Locals window shows variable values.
- Errors: Type mismatch (wrong type), Subscript out of range (bad index or sheet name), Expected: End If (compile), error 91 (missing \`Set\`).

@steps
1. Identify the feature (array, If chain, debugging tool, error).
2. Check the exact rule.
3. Pick the odd one out among four options.

@example
True or false? "In an If / ElseIf chain, VBA executes every branch whose condition is true."

@solution
1. Feature: If / ElseIf.
2. VBA stops at the first true condition and skips the rest.

@answer
False. Only the first true branch runs.

@pitfalls
- Thinking ElseIf branches are all evaluated.
- Confusing compile errors (missing End If) with run-time errors.
`,
};
