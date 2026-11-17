import { ex, type ExplainMap } from '@/lib/explain';

export const L8: ExplainMap = {
  'L8.sharpe': ex`
@task
The \`sharpe_ratio(returns, rf)\` function from class, applied to daily statistics or a small column of daily returns. You compute the average, the standard deviation, and the annualised Sharpe ratio, or compare two funds.

@idea
The function works with **daily** data and annualises at the end:

~~~
avg_return = Application.WorksheetFunction.Average(returns)
std_return = Application.WorksheetFunction.StDev_S(returns)
tdays = 252
rf_d = rf / tdays
sharpe_ratio = Sqr(tdays) * (avg_return - rf_d) / std_return
~~~

$$SR = \sqrt{252}\,\frac{\bar r_d - r_f/252}{s_d}$$

The daily excess return scales with 252, the volatility with $\sqrt{252}$, so their ratio scales with $\sqrt{252}$.

@steps
1. Average daily return.
2. StDev_S of daily returns ($n - 1$).
3. Daily risk-free rate $= r_f/252$.
4. $SR = \sqrt{252}(\bar r - r_f/252)/s$.

@example
Average daily return 0.0008, StDev_S 0.012, annual $r_f$ 2%.

@solution
1. $\bar r = 0.0008$.
2. $s = 0.012$.
3. $r_{f,d} = 0.02/252 = 0.0000794$.
4. $SR = 15.875 \times (0.0008 - 0.0000794)/0.012 = 0.953$.

@answer
Annualised Sharpe ratio ≈ 0.95.

@pitfalls
- Subtracting the annual $r_f$ from a daily return.
- Multiplying by 252 instead of $\sqrt{252}$.
- Using StDev_P.
`,

  'L8.sortino': ex`
@task
A column of daily returns. You compute the average, the downside volatility (StDev_S of the negative returns only), the Sortino ratio, and the Sharpe ratio for comparison.

@idea
The Sortino ratio penalises only **bad** volatility: it replaces the standard deviation of all returns by that of the **negative** returns.

$$\text{Sortino} = \sqrt{252}\,\frac{\bar r - r_f/252}{s_{neg}}$$

The numerator still uses the average of **all** returns. Because $s_{neg}$ is usually smaller than $s$, Sortino is usually larger than Sharpe.

@steps
1. Average of all returns.
2. Keep only the negative returns; StDev_S of those ($n_{neg} - 1$).
3. Sortino $= \sqrt{252}(\bar r - r_f/252)/s_{neg}$.
4. Sharpe with StDev_S of all returns for comparison.

@example
Daily returns: 0.012, −0.008, 0.005, −0.015, 0.020, 0.003, −0.004, 0.009; $r_f$ 2%.

@solution
1. Average $= 0.022/8 = 0.00275$.
2. Negatives −0.008, −0.015, −0.004 → StDev_S $= 0.00557$.
3. Sortino $= 15.875 \times (0.00275 - 0.0000794)/0.00557 = 7.61$.
4. StDev_S of all $= 0.01136$ → Sharpe $= 3.73$.

@answer
Downside volatility 0.00557; Sortino ≈ 7.61 (Sharpe ≈ 3.73).

@pitfalls
- Averaging only the negative returns in the numerator.
- Including zero or positive returns in the downside volatility.
- Dividing by $n$ instead of $n - 1$.
`,

  'L8.compare': ex`
@task
Two portfolios with annual mean, standard deviation, skewness and kurtosis. You compute both Sharpe ratios and identify the portfolio with the fatter left tail.

@idea
$SR = (\text{mean} - r_f)/\text{std}$ uses only the first two moments. A strategy with **negative skewness** and **high kurtosis** (rare large losses, e.g. selling options) can show a low standard deviation and therefore a flattering Sharpe ratio. Skewness and kurtosis reveal the tail risk the Sharpe ratio misses; the Sortino ratio is one remedy.

@steps
1. Sharpe ratios of both.
2. Compare skewness (more negative = longer left tail) and kurtosis (higher = fatter tails).
3. Name the portfolio with the dangerous tail.

@example
$r_f$ 2%. A: mean 12%, std 20%, skew 0.1, kurtosis 0.2. B: mean 11.5%, std 16%, skew −3.5, kurtosis 25.

@solution
1. $SR_A = 10/20 = 0.50$; $SR_B = 9.5/16 = 0.59$.
2. B: strongly negative skew and very high kurtosis.
3. B's higher Sharpe ratio hides rare large losses.

@answer
SR_A = 0.50, SR_B = 0.59; B has the fatter left tail.

@pitfalls
- Concluding B is better just because its Sharpe ratio is higher.
- Reading high positive skewness as left-tail risk.
`,

  'L8.concept': ex`
@task
Concept questions on UDFs for performance ratios: true/false, find the false (or true) statement, or the best answer.

@idea
- \`sharpe_ratio\` uses daily average and StDev_S, a daily risk-free rate $r_f/252$ and annualises with $\sqrt{252}$.
- Sortino uses the StDev_S of negative returns only (downside volatility).
- Sharpe ignores skewness and kurtosis; negatively skewed, fat-tailed strategies can look good.
- UDFs take Ranges as inputs and use \`WorksheetFunction\` inside.

@steps
1. Identify which ratio or step the statement is about.
2. Check the definition and the annualisation.
3. Pick the odd one out among four options.

@example
True or false? "The Sortino ratio divides the excess return by the standard deviation of all returns."

@solution
1. That is the Sharpe ratio.
2. Sortino uses only the negative returns in the denominator.

@answer
False: that is the Sharpe ratio; Sortino uses the downside volatility.

@pitfalls
- Annualising with 252 instead of $\sqrt{252}$.
- Using the annual risk-free rate with daily returns.
`,
};
