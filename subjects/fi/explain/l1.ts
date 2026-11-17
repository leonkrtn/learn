import { ex, type ExplainMap } from '@/lib/explain';

export const L1: ExplainMap = {
  'L1.capm': ex`
@task
CAPM calculations with the security market line (SML): the fair return for a beta, the alpha of a forecast and whether the stock is under- or overpriced, the beta implied by an expected return, the cost of capital for a project, or the new price of a perpetuity after its beta changes.

@idea
In equilibrium only systematic (beta) risk is priced:

$$E[r_i] = r_f + \beta_i\,(E[r_M] - r_f)$$

- **Alpha** $=$ forecast return $-$ CAPM return. Positive alpha: the stock lies above the SML, it is **underpriced** (its price will rise until the return falls to the SML).
- **Implied beta**: $\beta = (E[r] - r_f)/MRP$.
- A **project** is discounted at the beta of its own business (a pure-play firm), not the company's beta.
- For a perpetuity $P = D/E[r]$: if beta changes, the required return changes and the price moves to $D/E[r]_{new}$.

@steps
1. Fair return $= r_f + \beta \times MRP$.
2. Alpha $=$ forecast $-$ fair; positive → underpriced, negative → overpriced.
3. Implied beta $= (E[r] - r_f)/MRP$.
4. Project: use the pure-play beta in step 1.
5. Perpetuity: $D = E[r] \times P_0$; new $E[r]$ from the new beta; $P_1 = D/E[r]_{new}$.

@example
A stock has a beta of 1.2; $r_f = 3\%$, MRP 6%; an analyst forecasts 12%. A second stock has an expected return of 9%. A project's pure-play beta is 0.8.

@solution
1. Fair return $= 3\% + 1.2 \times 6\% = 10.2\%$.
2. Alpha $= 12\% - 10.2\% = 1.8\%$: underpriced.
3. Implied beta of the second stock $= (9\% - 3\%)/6\% = 1.0$.
4. Project cost of capital $= 3\% + 0.8 \times 6\% = 7.8\%$.

@answer
Fair return 10.2%, alpha +1.8% (underpriced), implied beta 1.0, project rate 7.8%.

@pitfalls
- Using the standard deviation; only beta enters the SML.
- Multiplying beta by the market return instead of the market **risk premium**.
- Using the company's beta for a project in another business.
- Positive alpha means underpriced, not overpriced.
`,

  'L1.scenario': ex`
@task
Return forecasts for two stocks and the market in two scenarios, with probabilities and the risk-free rate. You are asked for the betas, expected returns, the slope of the SML, the alphas and whether a stock is under- or overpriced.

@idea
With only two scenarios, beta is the stock's return sensitivity to the market between them:

$$\beta = \frac{r_{i,2} - r_{i,1}}{r_{M,2} - r_{M,1}}$$

Expected returns are probability-weighted averages. The SML slope is the market risk premium $E[r_M] - r_f$, and alpha compares each stock's expected return with $r_f + \beta(E[r_M] - r_f)$.

@steps
1. Betas from the return differences.
2. Expected returns of the market and each stock.
3. SML slope $= E[r_M] - r_f$.
4. Alpha $= E[r_i] - (r_f + \beta_i \times \text{slope})$; positive → underpriced.

@example
Two equally likely scenarios: market −2% or 18%; stock A −6% or 30%; stock B 2% or 10%. $r_f = 4\%$.

@solution
1. $\beta_A = 36/20 = 1.8$; $\beta_B = 8/20 = 0.4$.
2. $E[r_M] = 8\%$, $E[r_A] = 12\%$, $E[r_B] = 6\%$.
3. Slope $= 8\% - 4\% = 4\%$.
4. $\alpha_A = 12\% - (4\% + 1.8 \times 4\%) = 0.8\%$; $\alpha_B = 6\% - (4\% + 0.4 \times 4\%) = 0.4\%$. Both underpriced.

@answer
Betas 1.8 and 0.4; SML slope 4%; alphas +0.8% and +0.4%.

@pitfalls
- Dividing the stock's return by the market's return instead of the differences.
- Using the market's expected return as the slope (subtract $r_f$).
- Ignoring unequal probabilities in the expected returns.
`,

  'L1.sim': ex`
@task
Single-index model questions: the beta from total and residual variance, the share of systematic risk ($R^2$), the residual standard deviation, covariances and correlations between two stocks.

@idea
Each return splits into market and firm-specific parts, $R_i = \alpha_i + \beta_i R_M + e_i$, with uncorrelated residuals:

$$\sigma_i^2 = \beta_i^2\sigma_M^2 + \sigma^2(e_i), \qquad R^2 = \frac{\beta_i^2\sigma_M^2}{\sigma_i^2}, \qquad \text{cov}(R_i, R_j) = \beta_i\beta_j\sigma_M^2$$

Correlation $=$ covariance $/(\sigma_i\sigma_j)$.

@steps
1. Beta: $\beta = \sqrt{\sigma_i^2 - \sigma^2(e)}/\sigma_M$ (positive if it covaries positively).
2. $R^2 =$ systematic variance $/$ total variance.
3. Residual sd: $\sqrt{\sigma_i^2 - \beta^2\sigma_M^2} = \sigma_i\sqrt{1 - R^2}$.
4. Covariance $= \beta_i\beta_j\sigma_M^2$; correlation $=$ cov $/(\sigma_i\sigma_j)$.

@example
A stock has a variance of 0.0801; the market sd is 0.20 and the stock's residual sd 0.15. A second stock has a beta of 0.8.

@solution
1. Systematic variance $= 0.0801 - 0.0225 = 0.0576$; $\beta = \sqrt{0.0576}/0.20 = 1.2$.
2. $R^2 = 0.0576/0.0801 = 71.9\%$.
3. Residual sd $= 0.15$ (given) — check: $0.2830\sqrt{1 - 0.719} = 0.15$.
4. Covariance $= 1.2 \times 0.8 \times 0.04 = 0.0384$.

@answer
Beta 1.2, R² 71.9%, covariance 0.0384.

@pitfalls
- Subtracting standard deviations instead of variances.
- Forgetting to square beta or $\sigma_M$.
- Including residual variance in the covariance of two different stocks.
`,

  'L1.cml': ex`
@task
A CAPM world with $r_f$, the market risk premium and $\sigma_M$. You are asked for the market Sharpe ratio (CML slope), the slope of the CAL of a single asset, the standard deviation of a well-diversified portfolio with a given expected return, the implied risk aversion, or the CML return for a given risk.

@idea
- **CML**: efficient portfolios mix T-bills and the market; slope $= (E[r_M] - r_f)/\sigma_M$.
- A single asset's CAL is flatter: its Sharpe ratio is $\rho_{iM}$ times the market's (only the correlated part of its risk is rewarded).
- A **well-diversified** portfolio has no specific risk: $\sigma = \beta\sigma_M$, with $\beta$ from the SML.
- The average investor holds the market: $A = (E[r_M] - r_f)/\sigma_M^2$.

@steps
1. $SR_M = MRP/\sigma_M$.
2. CAL slope of an asset $= \rho \times SR_M$.
3. Diversified portfolio: $\beta = (E[r] - r_f)/MRP$, $\sigma = \beta\sigma_M$.
4. $A = MRP/\sigma_M^2$.
5. Efficient portfolio: $E[r] = r_f + SR_M \times \sigma$.

@example
$r_f = 3\%$, MRP 6%, $\sigma_M = 20\%$. An asset has $\rho = 0.5$ with the market; a well-diversified portfolio has $E[r] = 12\%$.

@solution
1. $SR_M = 0.06/0.20 = 0.30$.
2. CAL slope $= 0.5 \times 0.30 = 0.15$.
3. $\beta = 9\%/6\% = 1.5$; $\sigma = 1.5 \times 20\% = 30\%$.
4. $A = 0.06/0.04 = 1.5$.
5. Efficient portfolio with $\sigma = 12\%$: $3\% + 0.3 \times 12\% = 6.6\%$.

@answer
CML slope 0.30, asset CAL slope 0.15, diversified portfolio sd 30%, A = 1.5.

@pitfalls
- Using $\sigma_M$ instead of $\sigma_M^2$ for risk aversion.
- Assuming the diversified portfolio has the market's sd.
- Using the asset's own sd for its CAL slope without the correlation.
`,

  'L1.zeroBeta': ex`
@task
Either the zero-beta CAPM (no borrowing allowed): the expected return of a stock from the market and its zero-beta portfolio; or a mimicking portfolio: an ETF's alpha and the market/T-bill mix with the same beta and its expected return.

@idea
- **Zero-beta CAPM** (Black): without a risk-free asset the intercept of the SML is the expected return of the zero-beta portfolio $Z$:
$$E[r_i] = E[r_Z] + \beta_i(E[r_M] - E[r_Z])$$
Since $E[r_Z] > r_f$, this SML is **flatter**.
- **Mimicking portfolio**: put $\beta$ in the market and $1 - \beta$ in T-bills; it has the same systematic risk and earns exactly the CAPM return. The ETF's alpha is its expected return minus the mimicking portfolio's.

@steps
1. Zero-beta: $E[r] = E[r_Z] + \beta(E[r_M] - E[r_Z])$.
2. Mimic: weight $\beta$ in the market, $1 - \beta$ in T-bills.
3. Mimic return $= \beta E[r_M] + (1 - \beta) r_f = r_f + \beta \times MRP$.
4. Alpha $= E[r_{ETF}] -$ mimic return.

@example
(a) $E[r_M] = 10\%$, $E[r_Z] = 5\%$, stock beta 1.4. (b) An ETF expects 11% with beta 1.2; $r_f = 3\%$, MRP 6%.

@solution
1. (a) $5\% + 1.4 \times 5\% = 12\%$.
2. (b) Mimic: 1.2 in the market, −0.2 in T-bills (borrowing).
3. (b) Mimic return $= 1.2 \times 9\% - 0.2 \times 3\% = 10.2\%$.
4. (b) Alpha $= 11\% - 10.2\% = 0.8\%$.

@answer
(a) 12%. (b) Mimic weights 1.2 / −0.2, return 10.2%, alpha 0.8%.

@pitfalls
- Using $r_f$ as the intercept when borrowing is not allowed.
- Putting $1 - \beta$ in the market.
- Forgetting that a beta above 1 means borrowing (negative T-bill weight).
`,

  'L1.equilibrium': ex`
@task
A small table of portfolios (expected return with beta or standard deviation, sometimes with the market and T-bills). You decide whether the situation could occur if the CAPM equilibrium holds, sometimes after computing a Sharpe ratio or alpha.

@idea
The CAPM makes two testable statements:

- **SML**: every asset's expected return is $r_f + \beta \times MRP$. So any asset or portfolio has alpha 0, and a higher beta must mean a higher expected return.
- **CML**: the market is efficient, so no portfolio can have a higher Sharpe ratio than the market. Portfolios **below** the CML (inefficient) are fine.

Expected return and standard deviation alone can be in any order (individual assets carry unpriced specific risk).

@steps
1. Given betas: higher beta must come with higher expected return; check alphas against the SML.
2. Given standard deviations only (no market): any combination is possible.
3. Given the market and a portfolio's $\sigma$: compute both Sharpe ratios; above the market's is impossible.
4. Alpha $\neq 0$ is impossible in equilibrium.

@example
(a) A: E[r] 10%, β 1.2; B: E[r] 12%, β 1.0. (b) $r_f = 4\%$, market 10% with σ 20%; portfolio A has E[r] 9% with σ 15%.

@solution
1. (a) A has the higher beta but the lower return: the SML is violated.
2. (b) $SR_M = 6/20 = 0.30$; $SR_A = 5/15 = 0.33$.
3. (b) A would beat the market's Sharpe ratio, so the market would not be efficient.

@answer
Neither situation is possible in a CAPM equilibrium.

@pitfalls
- Requiring higher σ to mean higher return; only beta is priced.
- Calling a portfolio below the CML impossible; that is just inefficient.
- Forgetting that the market itself has beta 1 and lies on both lines.
`,

  'L1.concept': ex`
@task
Concept questions on the CAPM and portfolio theory: true/false, find the false (or true) statement, or the best short answer.

@idea
- Diversification removes specific risk; only systematic (beta) risk is priced: $E[r_i] = r_f + \beta_i \cdot MRP$.
- All investors hold the market portfolio and T-bills (two-fund separation); the CML is the efficient frontier with a risk-free asset.
- Alpha $\neq 0$ is a mispricing; positive alpha → underpriced.
- Single-index model: $\sigma_i^2 = \beta^2\sigma_M^2 + \sigma^2(e)$; covariance $\beta_i\beta_j\sigma_M^2$.
- Zero-beta CAPM: flatter SML with $E[r_Z]$ as intercept. Liquidity-adjusted CAPM adds an illiquidity premium.
- Every correctly priced asset has the same reward-to-risk ratio $E[R_i]/\text{cov}(R_i, R_M)$.

@steps
1. Is the claim about total risk or beta, CML or SML?
2. Check against the rules above.
3. Watch for "all assets lie on the CML" (only efficient portfolios do).
4. Pick the odd one out among four options.

@example
True or false? "In the CAPM, a stock with a higher standard deviation must have a higher expected return."

@solution
1. The claim links expected return to total risk.
2. The CAPM prices only beta; specific risk is diversifiable and unrewarded.
3. A high-σ stock with low beta can have a low expected return.

@answer
False. Only beta determines expected returns in the CAPM.

@pitfalls
- Confusing CML (efficient portfolios, σ) with SML (all assets, β).
- "Positive alpha means overpriced": false.
- "Individual stocks lie on the CML": false.
`,
};
