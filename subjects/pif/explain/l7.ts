import { ex, type ExplainMap } from '@/lib/explain';

export const L7: ExplainMap = {
  'L7.trace': ex`
@task
A user-defined function (e.g. compounding, a present-value sum, a signal) is called from a cell or from a Sub. You are asked for the result in a cell, a variable's value afterwards, or the result for special inputs.

@idea
A Function returns a value by **assigning to its own name** (\`grow = v\`). Trace it like a Sub. Two traps:

- Arguments are passed **ByRef** by default: if the function changes a parameter (\`v = v * (1 + r)\`) and the caller passed a variable, the caller's variable changes too.
- If no branch assigns the function's name, it returns the type's default (0 for Double, "" for String).

With a loop \`For i = 1 To n\` and n = 0 the body never runs.

@steps
1. Trace the body with the given arguments.
2. The result is the last value assigned to the function's name.
3. ByRef: check whether the caller's variable was modified.
4. Edge cases: zero iterations, no assignment.

@example
~~~
Function grow(v As Double, r As Double, n As Long) As Double
    Dim i As Long
    For i = 1 To n
        v = v * (1 + r)
    Next i
    grow = v
End Function
~~~
\`=grow(100, 0.05, 3)\` in a cell; and \`=grow(100, 0.05, 0)\`.

@solution
1. 100 → 105 → 110.25 → 115.7625.
2. Result 115.7625.
3. Called from a Sub with a variable x = 100, x would also become 115.7625 (ByRef).
4. n = 0: no iterations, the result is 100.

@answer
=grow(100, 0.05, 3) shows 115.76; with n = 0 it shows 100.

@pitfalls
- Using \`Return\` (not VBA) or forgetting to assign the function's name.
- Ignoring the ByRef side effect.
- Counting one iteration too many.
`,

  'L7.uniform': ex`
@task
\`UniformArray(T, N, a, b)\` returns a T × N array of uniform draws. You are asked about its size, an element for a given Rnd() draw, why it uses \`ReDim\`, and how the result lands on the sheet.

@idea
~~~
Function UniformArray(T As Long, N As Long, a As Single, b As Single) As Variant
    Dim my_array() As Double
    ReDim my_array(1 To T, 1 To N)
    For i = 1 To T
        For j = 1 To N
            my_array(i, j) = Rnd() * (b - a) + a
        Next j
    Next i
    UniformArray = my_array
End Function
~~~
- Bounds in \`Dim\` must be constants; T and N are only known at run time, so declare an empty array and size it with **ReDim**.
- An array result is returned **As Variant**.
- Entered as an array formula over a T × N block, it fills that block (row i, column j = element (i, j)).

@steps
1. Size $= T \times N$.
2. Element for a draw $u$: $u(b - a) + a$.
3. Cell for element (i, j): top-left row $+ i - 1$, column $+ j - 1$.

@example
\`=UniformArray(5, 2, -0.1, 0.1)\` over D2:E6; for element (3, 2) Rnd() returned 0.8.

@solution
1. 5 × 2 = 10 values.
2. $0.8 \times 0.2 - 0.1 = 0.06$.
3. Element (3, 2) is in row $2 + 2 = 4$, column E → E4.

@answer
10 values; E4 shows 0.06.

@pitfalls
- Declaring \`Dim my_array(1 To T, 1 To N)\` (not allowed with variables).
- Returning the array As Double.
`,

  'L7.syntax': ex`
@task
Multiple-choice questions on the syntax of user-defined functions: headers, returning values, arrays, objects and calling a function from a cell.

@idea
| Rule | Correct form |
|---|---|
| Header with typed arguments and return type | \`Function sharpe_ratio(returns As Range, rf As Double) As Double\` |
| Return a value | assign to the function name: \`avg_ret = …\` |
| Array sized by inputs | \`Dim a() As Double\`, then \`ReDim a(1 To T, 1 To N)\` |
| Return an object | \`Set ThisWB = ThisWorkbook\` |
| Use in a cell | \`=regards_function(B1)\` (no Call, no quotes around the reference) |
| Array result type | \`As Variant\` |

A **Sub** cannot return a value; only a **Function** can.

@steps
1. Identify what the line must do (declare, return, size, call).
2. Match it with the rule in the table.
3. Reject options using \`Return\`, \`Sub … As\`, missing \`Set\` or quoted references.

@example
"Inside \`Function avg_ret(r As Range) As Double\`, which line returns the mean of r?"

@solution
1. The function must assign its result to its own name.
2. Use the worksheet function on the Range argument.

@answer
\`avg_ret = Application.WorksheetFunction.Average(r)\`

@pitfalls
- \`Return …\` (that is other languages).
- \`Sub … As Double\` (a Sub has no return type).
- \`=Call f(B1)\` or \`=f("B1")\` in a cell.
`,

  'L7.concept': ex`
@task
Concept questions on user-defined functions: true/false, find the false (or true) statement, or the best answer.

@idea
- A Function returns a value by assigning to its name; it can be used in worksheet cells like built-in functions.
- Functions used in cells should not change other cells; they compute from their inputs.
- Arguments are ByRef by default; \`ByVal\` passes a copy.
- Array results are returned As Variant; sizes known only at run time need \`ReDim\`.
- Object results need \`Set\`.

@steps
1. Identify the rule the statement is about.
2. Check it against the list.
3. Pick the odd one out among four options.

@example
True or false? "A Sub can be used in a worksheet cell like =my_sub(A1)."

@solution
1. Only Functions return values.
2. A Sub has no result to display.

@answer
False. Only a Function can be used in a cell.

@pitfalls
- Using \`Return\` to give back a value.
- Forgetting the ByRef side effect on the caller's variables.
`,
};
