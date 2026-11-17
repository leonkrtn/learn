import { ex, type ExplainMap } from '@/lib/explain';

export const L6: ExplainMap = {
  'L6.stats': ex`
@task
Two short columns of returns. You compute what \`WorksheetFunction\` would return for Average, StDev_S and Covariance_S, the correlation, and a Sharpe ratio (with $r_f = 0$).

@idea
The \`_S\` functions are **sample** statistics: they divide by $n - 1$.

$$\bar x = \frac{1}{n}\sum x_i, \quad s_x = \sqrt{\frac{\sum (x_i - \bar x)^2}{n - 1}}, \quad \text{cov}_S = \frac{\sum (x_i - \bar x)(y_i - \bar y)}{n - 1}$$

Correlation $= \text{cov}_S/(s_x s_y)$. \`Covariance_S(col1, col1)\` is the variance of col1. Sharpe with $r_f = 0$ is $\bar y/s_y$.

@steps
1. Means of both columns.
2. Deviations from the mean, row by row.
3. $s_x$, $s_y$ with $n - 1$.
4. Covariance from the products of deviations, divided by $n - 1$.
5. Correlation and Sharpe.

@example
col1: 0.01, 0.03, −0.02, 0.02. col2: 0.02, 0.01, −0.01, 0.04.

@solution
1. Means 0.01 and 0.015.
2. Deviations col1: 0, 0.02, −0.03, 0.01; col2: 0.005, −0.005, −0.025, 0.025.
3. $s_1 = \sqrt{0.0014/3} = 0.0216$; $s_2 = \sqrt{0.0013/3} = 0.0208$.
4. Products: 0, −0.0001, 0.00075, 0.00025 → sum 0.0009; cov $= 0.0003$.
5. Correlation $= 0.0003/(0.0216 \times 0.0208) = 0.667$; Sharpe of col2 $= 0.015/0.0208 = 0.72$.

@answer
Average 0.01, StDev_S 0.0216, Covariance_S 0.0003, correlation 0.67.

@pitfalls
- Dividing by $n$ (population formulas, StDev_P).
- Mixing up covariance and correlation.
- Forgetting that Covariance_S of a column with itself is its variance.
`,

  'L6.matrix': ex`
@task
A covariance matrix written by \`Covar_Matrix\` with one entry deleted. You are asked for the missing covariance, a standard deviation, a correlation, or the cell where a given entry is written.

@idea
- The matrix is **symmetric**: $\text{Cov}(i, j) = \text{Cov}(j, i)$, so a missing entry below the diagonal equals its mirror above.
- The **diagonal** holds variances: $\sigma_i = \sqrt{\text{Cov}(i, i)}$.
- Correlation $= \text{Cov}(i, j)/(\sigma_i\sigma_j)$.
- The loop writes entry (i, j) to \`Cells(r0 + i, c0 + j)\`.

@steps
1. Missing (row hi, column lo) → copy (row lo, column hi).
2. Standard deviation from the diagonal.
3. Correlation with both standard deviations.
4. Cell: row $r_0 + i$, column $c_0 + j$.

@example
3 assets: diagonal 0.04, 0.09, 0.0225; Cov(1, 3) = 0.006; entry (3, 1) is missing. The loop writes to \`ws.Cells(30 + i, j)\`.

@solution
1. Cov(3, 1) = Cov(1, 3) = 0.006.
2. $\sigma_1 = 0.2$, $\sigma_3 = 0.15$.
3. $\rho_{13} = 0.006/(0.2 \times 0.15) = 0.2$.
4. Cov(2, 3) goes to row 32, column 3 = C32.

@answer
Missing entry 0.006; σ₁ = 0.2; ρ₁₃ = 0.2; Cov(2, 3) in C32.

@pitfalls
- Treating diagonal entries as standard deviations.
- Forgetting the row offset when locating a cell.
`,

  'L6.range': ex`
@task
\`ws.Range(ws.Cells(r1, c1), ws.Cells(r2, c2))\` builds a block of cells. You are asked for its address, the number of cells, and where a summary loop writes its results.

@idea
A Range between two corner cells covers every row from r1 to r2 and every column from c1 to c2:

- address: (column letter c1)(r1) : (column letter c2)(r2)
- number of cells: $(r_2 - r_1 + 1) \times (c_2 - c_1 + 1)$

A loop \`For j = c1 To c2\` with \`Set col = ws.Range(ws.Cells(r1, j), ws.Cells(r2, j))\` takes one column at a time, e.g. to write its average below it.

@steps
1. Convert both corners to addresses.
2. Count rows and columns, multiply.
3. Follow the loop to see which cell gets each result.

@example
\`Set col = ws.Range(ws.Cells(2, 1), ws.Cells(21, 3))\`; then for each column j, the average goes to \`ws.Cells(23, j)\`.

@solution
1. Corners A2 and C21 → A2:C21.
2. $20 \times 3 = 60$ cells.
3. Averages in A23, B23, C23.

@answer
A2:C21 with 60 cells; results in row 23.

@pitfalls
- Reading \`Cells(2, 1)\` as B1.
- Forgetting the +1 when counting rows or columns.
`,

  'L6.concept': ex`
@task
Concept questions on Range objects and summary statistics: true/false, find the false (or true) statement, or the best answer.

@idea
- A Range is an object: \`Set r = ws.Range(…)\`.
- \`ws.Range(ws.Cells(r1, c1), ws.Cells(r2, c2))\` spans the whole rectangle.
- \`WorksheetFunction.Average\`, \`StDev_S\`, \`Covariance_S\`, \`Correl\` work on Ranges; \`_S\` divides by $n - 1$.
- A covariance matrix is symmetric with variances on the diagonal; nested loops over i and j fill it.
- \`.Address\` returns the address with $ signs; \`.Count\` the number of cells.

@steps
1. Identify the object, method or statistic.
2. Check its exact behaviour.
3. Pick the odd one out among four options.

@example
True or false? "StDev_S divides the sum of squared deviations by n."

@solution
1. StDev_S is the sample standard deviation.
2. It divides by $n - 1$.

@answer
False. It divides by n − 1 (StDev_P divides by n).

@pitfalls
- Forgetting Set for Range variables.
- Assuming the covariance matrix needs every entry computed twice.
`,
};
