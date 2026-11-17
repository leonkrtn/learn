import { ex, type ExplainMap } from '@/lib/explain';

/** Problem-set types with a calculation or concept of their own. */
export const PS: ExplainMap = {
  'PS1.corrPrice': ex`
@task
A stock pays a constant perpetual dividend and is priced by the CAPM. Its correlation with the market changes (doubles, halves, …) while its volatility stays the same. You are asked for the new share price.

@idea
Beta is $\beta = \rho\,\sigma_i/\sigma_M$, so with unchanged volatilities beta scales exactly with the correlation. A higher beta raises the required return on the SML, and a perpetuity's price is dividend over required return:

$$D = E[r_0] \times P_0, \qquad E[r_1] = r_f + k\beta_0 \cdot MRP, \qquad P_1 = D/E[r_1]$$

@steps
1. $D = E[r] \times P_0$.
2. $\beta_0 = (E[r] - r_f)/MRP$.
3. New beta $= k \times \beta_0$ ($k$ = change factor of the correlation).
4. New required return from the SML; $P_1 = D/E[r_1]$.

@example
Price \$50, expected return 10%, $r_f$ 4%, MRP 6%. The correlation with the market doubles.

@solution
1. $D = 0.10 \times 50 = 5$.
2. $\beta_0 = 6\%/6\% = 1$.
3. $\beta_1 = 2$.
4. $E[r_1] = 4\% + 2 \times 6\% = 16\%$; $P_1 = 5/0.16 = 31.25$.

@answer
The price falls to \$31.25.

@pitfalls
- Doubling the expected return instead of the beta.
- Keeping the old price and changing only the dividend.
- Thinking a higher correlation raises the price; it raises the required return.
`,

  'PS1.liquidity': ex`
@task
A thinly traded stock with a given beta; investors require an illiquidity premium on top. You are asked for its required return.

@idea
The liquidity-adjusted CAPM adds compensation for trading costs and illiquidity to the SML:

$$E[r] = r_f + \beta \cdot MRP + \text{illiquidity premium}$$

The premium is added once, not multiplied by beta.

@steps
1. CAPM part: $r_f + \beta \times MRP$.
2. Add the illiquidity premium.

@example
Beta 1.1, illiquidity premium 1.5%, $r_f$ 3%, MRP 6%.

@solution
1. $3\% + 1.1 \times 6\% = 9.6\%$.
2. $9.6\% + 1.5\% = 11.1\%$.

@answer
Required return 11.1%.

@pitfalls
- Multiplying the premium by beta.
- Subtracting the premium (illiquid assets must offer more, not less).
`,

  'PS1.smlInfer': ex`
@task
Two correctly priced stocks with their betas and expected returns. You are asked for the risk-free rate, the market's expected return, or the fair return of another beta.

@idea
Both stocks lie on the SML, $E[r] = r_f + \beta \cdot MRP$. Two points determine the line: the slope is the market risk premium and the intercept is $r_f$. The market has beta 1, so $E[r_M] = r_f + MRP$.

@steps
1. Slope $MRP = (E[r_2] - E[r_1])/(\beta_2 - \beta_1)$.
2. $r_f = E[r_1] - \beta_1 \times MRP$.
3. $E[r_M] = r_f + MRP$; any beta: $r_f + \beta \times MRP$.

@example
A: β 0.8, E[r] 8.8%. B: β 1.5, E[r] 13%. Find $r_f$, $E[r_M]$ and the return for β 1.2.

@solution
1. $MRP = 4.2\%/0.7 = 6\%$.
2. $r_f = 8.8\% - 0.8 \times 6\% = 4\%$.
3. $E[r_M] = 10\%$; β 1.2: $4\% + 7.2\% = 11.2\%$.

@answer
r_f = 4%, E[r_M] = 10%, 11.2% for β = 1.2.

@pitfalls
- Dividing returns by betas instead of using differences.
- Forgetting that the market's beta is 1.
`,

  'PS1.portfolioBeta': ex`
@task
A portfolio of three stocks with weights and betas. You are asked for the portfolio beta and its CAPM return, and how to reach a target beta using one stock and T-bills.

@idea
Beta is linear in the weights: $\beta_P = \sum w_i\beta_i$. T-bills have beta 0, so a weight $y$ in a stock with beta $\beta$ gives $\beta_P = y\beta$, and $y = \beta^*/\beta$. The rest, $1 - y$, goes into T-bills (negative means borrowing).

@steps
1. $\beta_P = \sum w_i\beta_i$; $E[r_P] = r_f + \beta_P \cdot MRP$.
2. Target: $y = \beta^*/\beta_{stock}$.
3. Amount in T-bills $= (1 - y) \times$ investment.

@example
Weights 0.5/0.3/0.2, betas 0.8/1.2/1.8; $r_f$ 3%, MRP 6%. Target beta 0.9 using the third stock and T-bills with \$200,000.

@solution
1. $\beta_P = 0.4 + 0.36 + 0.36 = 1.12$; $E[r_P] = 3\% + 6.72\% = 9.72\%$.
2. $y = 0.9/1.8 = 0.5$.
3. T-bills: $0.5 \times 200{,}000 = 100{,}000$ dollars.

@answer
Portfolio beta 1.12, expected return 9.72%; 50% in the stock and \$100,000 in T-bills.

@pitfalls
- Averaging betas without weights.
- Giving T-bills a beta of 1 or the market's return.
`,

  'PS1.rewardRisk': ex`
@task
The market's expected excess return and standard deviation. You are asked for the reward-to-risk ratio every correctly priced asset must have, the expected excess return of an asset with a given covariance, or the share of market variance an asset contributes.

@idea
In equilibrium every asset offers the same reward per unit of covariance with the market as the market itself:

$$\frac{E[R_i]}{\text{cov}(R_i, R_M)} = \frac{E[R_M]}{\sigma_M^2}$$

This is the SML in covariance form ($\beta = \text{cov}/\sigma_M^2$). An asset with weight $w_i$ contributes $w_i\,\text{cov}(R_i, R_M)$ to $\sigma_M^2$.

@steps
1. Ratio $= E[R_M]/\sigma_M^2$.
2. $E[R_i] =$ ratio $\times\,\text{cov}(R_i, R_M)$.
3. Contribution $= w_i\,\text{cov}/\sigma_M^2$ of the market variance.

@example
Market excess return 6%, $\sigma_M$ 20%. An asset has covariance 0.05 with the market and a weight of 10%.

@solution
1. Ratio $= 0.06/0.04 = 1.5$.
2. $E[R_i] = 1.5 \times 0.05 = 7.5\%$ (β = 1.25).
3. Share $= 0.10 \times 0.05/0.04 = 12.5\%$.

@answer
Reward-to-risk ratio 1.5; expected excess return 7.5%; 12.5% of market variance.

@pitfalls
- Dividing by $\sigma_M$ instead of $\sigma_M^2$.
- Using the asset's own variance instead of its covariance with the market.
`,

  'PS2.diversify': ex`
@task
An equally weighted portfolio of $n$ stocks with uncorrelated residuals. You are asked for its residual standard deviation, or its total standard deviation when all stocks have the same beta.

@idea
Residuals are independent, so their variances add with squared weights $1/n^2$:

$$\sigma(e_P) = \frac{\sigma(e)}{\sqrt n}, \qquad \sigma_P = \sqrt{\beta^2\sigma_M^2 + \sigma^2(e)/n}$$

Specific risk shrinks with $\sqrt n$; market risk does not diversify.

@steps
1. $\sigma(e_P) = \sigma(e)/\sqrt n$.
2. Total: add $\beta^2\sigma_M^2$ and $\sigma^2(e)/n$, take the square root.

@example
25 stocks, residual sd 40%, beta 1.2, $\sigma_M$ 20%.

@solution
1. $\sigma(e_P) = 40\%/5 = 8\%$.
2. $\sigma_P = \sqrt{0.0576 + 0.0064} = 25.3\%$.

@answer
Residual sd 8%; total sd 25.3%.

@pitfalls
- Dividing by $n$ instead of $\sqrt n$.
- Adding standard deviations instead of variances.
`,

  'PS2.emh': ex`
@task
A piece of robust evidence (a return pattern or trading result). You decide which forms of the efficient market hypothesis it contradicts.

@idea
The three forms use nested information sets:

- **Weak**: past prices and volume.
- **Semi-strong**: all public information (includes past prices).
- **Strong**: all information, including private.

Evidence that **past prices** predict returns contradicts the weak form and therefore all three. Evidence based on other **public** data contradicts semi-strong and strong. Profits from **private** information contradict only the strong form. Fast, complete reactions to news, or funds failing to beat the market, are consistent with efficiency.

@steps
1. Which information does the strategy or pattern use?
2. Find the smallest information set that contains it.
3. That form and all stronger ones are contradicted.

@example
"Prices keep drifting in the direction of an earnings surprise for weeks after the announcement."

@solution
1. The information is the earnings announcement.
2. It is public but not part of past prices.
3. Semi-strong and strong forms are contradicted; the weak form is not.

@answer
It contradicts the semi-strong and the strong form, but not the weak form.

@pitfalls
- Saying momentum contradicts only the weak form; via nesting it contradicts all three.
- Treating insider profits as evidence against the semi-strong form.
`,

  'PS2.tracking': ex`
@task
Either a well-diversified portfolio with an estimated alpha and beta, tracked by the index and T-bills (weights and the riskless profit), or two well-diversified portfolios A and C, where a mix D of A and T-bills matches C's beta (weights, D's return and the arbitrage).

@idea
A **tracking portfolio** has the same beta from the index (or A) plus T-bills, so it has the same factor risk but no alpha. Long one, short the other: the factor risk cancels and, for well-diversified portfolios, residual risk is negligible — a riskless profit of the alpha (or the return gap).

- Index tracking: weight $\beta$ in the index, $1 - \beta$ in T-bills; profit $|\alpha| \times$ amount.
- Matching C with A: weight $\beta_C/\beta_A$ in A; $E[r_D] = w E[r_A] + (1 - w) r_f$; buy the higher-return one.

@steps
1. Weight in the risky portfolio $= \beta_{target}/\beta_{source}$; the rest in T-bills.
2. Expected return of the tracking portfolio.
3. Compare: buy the one with the higher expected return, short the other.
4. Profit $=$ return gap × amount.

@example
A: E[r] 12%, β 1.2; C: E[r] 7%, β 0.6; $r_f$ 4%; \$100,000 per side.

@solution
1. $w = 0.6/1.2 = 0.5$ in A, 0.5 in T-bills.
2. $E[r_D] = 0.5 \times 12\% + 0.5 \times 4\% = 8\%$.
3. D beats C with the same beta: buy D, short C.
4. Profit $= 1\% \times 100{,}000 = 1{,}000$ dollars, riskless.

@answer
Buy D (50% A, 50% T-bills) and short C: \$1,000 riskless profit.

@pitfalls
- Matching expected returns instead of betas.
- Calling it risky because of residuals; well-diversified portfolios have none.
- Reversing the trade.
`,

  'PS2.zeroBetaArb': ex`
@task
A well-diversified portfolio P with $R_P = \alpha + \beta R_M$ is combined with the market index into a zero-beta portfolio Z (weights sum to one). You are asked for the weights and Z's riskless excess return.

@idea
Choose weights so the market exposure cancels: $w_P\beta + (1 - w_P) \times 1 = 0$:

$$w_P = \frac{1}{1 - \beta}, \qquad w_M = -\frac{\beta}{1 - \beta}, \qquad R_Z = \frac{\alpha}{1 - \beta}$$

Z has no risk, so in equilibrium its excess return should be zero; a non-zero $R_Z$ is an arbitrage.

@steps
1. $w_P = 1/(1 - \beta)$.
2. $w_M = 1 - w_P$.
3. $R_Z = w_P\alpha$.

@example
$R_P = 1\% + 0.6R_M$.

@solution
1. $w_P = 1/0.4 = 2.5$.
2. $w_M = -1.5$.
3. $R_Z = 2.5 \times 1\% = 2.5\%$, riskless.

@answer
Z holds 2.5 in P and −1.5 in the market and earns 2.5% riskless.

@pitfalls
- Using $\beta$ itself as the weight.
- Forgetting the weights must sum to one.
- With $\beta > 1$, $w_P$ is negative: the sign of the profit flips.
`,

  'PS2.residualGroups': ex`
@task
A portfolio of $n$ stocks in $G$ groups of four with fixed relative weights inside each group; all stocks have the same residual sd and uncorrelated residuals. You are asked for the portfolio's residual sd.

@idea
With uncorrelated residuals, $\sigma^2(e_P) = \sum w_i^2\sigma^2(e)$. Each stock's weight is its relative weight divided by $G$, so

$$\sigma^2(e_P) = G \cdot \frac{\sum r_k^2}{G^2}\,\sigma^2(e) = \frac{\sum r_k^2}{G}\,\sigma^2(e)$$

Unequal weights diversify less than equal weights ($\sigma(e)/\sqrt n$).

@steps
1. $\sum r_k^2$ over the four relative weights.
2. $\sigma^2(e_P) = \sum r_k^2 \times \sigma^2(e)/G$.
3. Take the square root; compare with $\sigma(e)/\sqrt n$.

@example
Relative weights 0.4, 0.3, 0.2, 0.1; 10 groups (40 stocks); residual sd 50%.

@solution
1. $0.16 + 0.09 + 0.04 + 0.01 = 0.30$.
2. $0.30 \times 0.25/10 = 0.0075$.
3. $\sigma(e_P) = 8.66\%$ (equal weights: $50\%/\sqrt{40} = 7.91\%$).

@answer
Residual sd of the portfolio: 8.66% (more than the 7.91% with equal weights).

@pitfalls
- Using $\sigma(e)/\sqrt n$ as if weights were equal.
- Forgetting to square the weights.
`,

  'PS2.ff3': ex`
@task
The Fama-French three-factor model with average factor premiums and a fund's loadings. You are asked for the fund's fair expected return, or its three-factor alpha given its average return.

@idea
Like the CAPM, but with three priced factors (all excess returns):

$$E[r] = r_f + \beta_{MKT}\,MKT + \beta_{SMB}\,SMB + \beta_{HML}\,HML$$

Alpha $=$ average return $-$ that fair return. A CAPM alpha can shrink once size and value exposures are priced.

@steps
1. Multiply each loading by its premium (keep signs).
2. Add $r_f$ → fair return.
3. Alpha $=$ average return $-$ fair return.

@example
$r_f$ 2%; premiums MKT 6%, SMB 2%, HML 3%; loadings 1.1, 0.4, −0.3. The fund averaged 10%.

@solution
1. $6.6\% + 0.8\% - 0.9\% = 6.5\%$.
2. Fair return $= 8.5\%$.
3. Alpha $= 10\% - 8.5\% = 1.5\%$ (CAPM alpha would be $10\% - 2\% - 6.6\% = 1.4\%$).

@answer
Fair return 8.5%; three-factor alpha 1.5%.

@pitfalls
- Adding $r_f$ to SMB and HML (they are zero-cost portfolios).
- Ignoring a negative loading's sign.
`,

  'PS2.tbApt': ex`
@task
An active portfolio with alpha, residual sd and beta, and the market's expected excess return and sd. You are asked for the Treynor-Black weight, the maximum Sharpe ratio when combined with the market, or the Sharpe ratio of a beta-hedged (APT) long-short position.

@idea
- Treynor-Black: $w^0 = \frac{\alpha/\sigma^2(e)}{E[R_M]/\sigma_M^2}$, $w^* = \frac{w^0}{1 + (1-\beta)w^0}$, and $SR_P = \sqrt{SR_M^2 + IR^2}$.
- APT-style arbitrage hedges out beta and keeps only alpha and residual risk: Sharpe ratio $= IR = \alpha/\sigma(e)$.

TB does at least as well because it also keeps the market's Sharpe ratio; the APT is the limiting case when residual risk vanishes.

@steps
1. $w^0$, then $w^*$.
2. $SR_M = E[R_M]/\sigma_M$; $IR = \alpha/\sigma(e)$.
3. $SR_P = \sqrt{SR_M^2 + IR^2}$; hedged position: $IR$.

@example
$E[R_M] = 6\%$, $\sigma_M = 20\%$; α 2%, σ(e) 5%, β 0.8.

@solution
1. $w^0 = (0.02/0.0025)/(0.06/0.04) = 5.33$; $w^* = 5.33/(1 + 0.2 \times 5.33) = 2.58$.
2. $SR_M = 0.30$; $IR = 0.40$.
3. $SR_P = \sqrt{0.09 + 0.16} = 0.50$; hedged: 0.40.

@answer
w* = 2.58; combined Sharpe ratio 0.50; hedged long-short 0.40.

@pitfalls
- Adding Sharpe ratios ($0.3 + 0.4$) instead of squares.
- Using total sd for the IR.
`,

  'PS3.whichMeasure': ex`
@task
A situation describing how a fund will be used. You pick the most appropriate performance measure.

@idea
Choose the measure whose risk matches the risk the investor actually bears:

| Situation | Measure |
|---|---|
| Fund is the entire risky portfolio | Sharpe ratio (or M² as a return difference) |
| One of many sub-portfolios | Treynor ratio (only beta matters) |
| Single active fund added to an index | Information ratio ($SR_P^2 = SR_M^2 + IR^2$) |
| Return above the CAPM for its beta | Jensen's alpha |
| Must not be gameable by changing risk over time | MRAR |

@steps
1. How much of the investor's risky wealth is the fund?
2. Which risk survives in the total portfolio: total, beta or residual?
3. Pick the matching measure.

@example
"The fund will be the only actively managed portfolio, combined with a passive index fund."

@solution
1. The fund is added to a passive index.
2. Its market risk overlaps with the index; its residual risk is what it adds.
3. The improvement in Sharpe ratio depends on alpha per unit of residual risk.

@answer
The information ratio.

@pitfalls
- Choosing Sharpe for a sub-portfolio.
- Choosing Treynor for an investor's entire portfolio.
`,

  'PS3.inverse': ex`
@task
A performance measure is given and you work backwards: the average return from a Sharpe ratio, the beta from Sharpe and Treynor ratios, the average return from Jensen's alpha, or the alpha from an information ratio.

@idea
Rearrange each definition:

- Sharpe: $\bar r = r_f + SR \cdot \sigma$.
- Sharpe and Treynor share the numerator: $SR\cdot\sigma = T\cdot\beta \Rightarrow \beta = SR\,\sigma/T$.
- Jensen: $\bar r = \alpha + r_f + \beta(\bar r_M - r_f)$.
- IR: $\alpha = IR \cdot \sigma(e)$.

@steps
1. Write the definition of the given measure.
2. Solve it for the unknown.
3. Insert numbers (consistent units).

@example
(a) SR 0.4, σ 20%, $r_f$ 3%. (b) SR 0.4, Treynor 6.4%, σ 20%. (c) β 1.2, α 1%, market 9%, $r_f$ 3%. (d) IR 0.5, σ(e) 4%.

@solution
1. (a) $\bar r = 3\% + 0.4 \times 20\% = 11\%$.
2. (b) Excess return $= 8\%$; $\beta = 8\%/6.4\% = 1.25$.
3. (c) $\bar r = 1\% + 3\% + 1.2 \times 6\% = 11.2\%$.
4. (d) $\alpha = 0.5 \times 4\% = 2\%$.

@answer
11%; β = 1.25; 11.2%; α = 2%.

@pitfalls
- Forgetting $r_f$ when going from an excess return to a return.
- Using the market return instead of the premium in Jensen's formula.
`,

  'PS3.rank': ex`
@task
Several funds and the market with average return, σ and β. You pick the best portfolio by a given measure: Sharpe ratio, Treynor ratio or Jensen's alpha.

@idea
Compute the requested measure for every row, including the market:

- Sharpe $= (\bar r - r_f)/\sigma$ — penalises total risk.
- Treynor $= (\bar r - r_f)/\beta$ — penalises only beta.
- Alpha $= \bar r - r_f - \beta(\bar r_M - r_f)$.

A fund with a lot of specific risk can rank high on Treynor and alpha but low on Sharpe.

@steps
1. Excess return of each row.
2. Divide by σ (Sharpe) or β (Treynor), or subtract $\beta \times MRP$ (alpha).
3. Pick the largest.

@example
$r_f$ 3%. Fund A: 15%, σ 30%, β 1.0. Fund B: 11%, σ 16%, β 1.2. Market: 10%, σ 20%.

@solution
1. Excess: A 12%, B 8%, M 7%.
2. Sharpe: A 0.40, B 0.50, M 0.35 → B. Treynor: A 12%, B 6.7%, M 7% → A. Alpha: A 5%, B −0.4%, M 0 → A.

@answer
Best by Sharpe: Fund B; by Treynor and by alpha: Fund A.

@pitfalls
- Forgetting the market as a candidate.
- Using raw returns instead of excess returns.
`,

  'PS3.timing': ex`
@task
Market timing: the average return of a perfect timer, the up-market beta in a Henriksson-Merton regression, or the meaning of the quadratic term in a Treynor-Mazuy regression.

@idea
- A **perfect timer** holds the market when it beats T-bills and T-bills otherwise: each year earns $\max(r_M, r_f)$, like holding a call option on the market.
- **Henriksson-Merton**: $r_P - r_f = a + b(r_M - r_f) + c(r_M - r_f)D + e$ with $D = 1$ in up markets. Beta is $b$ in down markets and $b + c$ in up markets; $c > 0$ shows timing skill.
- **Treynor-Mazuy**: a squared term; $c > 0$ means a convex characteristic line (beta rises when markets do well), $c < 0$ concave.

@steps
1. Perfect timer: take $\max(r_M, r_f)$ each year and average.
2. HM: up-market beta $= b + c$.
3. TM: sign of $c$ → convex (good timing) or concave (poor timing).

@example
(a) Market returns 20%, −10%, 15%, −5%; T-bills 3%. (b) HM: b = 0.8, c = 0.4.

@solution
1. (a) Timer: 20%, 3%, 15%, 3% → average 10.25% (market 5%).
2. (b) Up-market beta $= 0.8 + 0.4 = 1.2$; down-market beta 0.8.

@answer
Perfect timer 10.25%; up-market beta 1.2.

@pitfalls
- Giving the timer 0% instead of $r_f$ in bad years.
- Reading $c$ alone as the up-market beta.
`,

  'PS3.mrar': ex`
@task
A fund's monthly returns and the monthly risk-free rate. You compute the annualised Morningstar risk-adjusted return with γ = 2.

@idea
MRAR averages gross excess returns raised to the power $-\gamma$, which penalises volatility (a bad month weighs more than a good month helps), then annualises:

$$MRAR(\gamma) = \left[\frac{1}{T}\sum_t\left(\frac{1 + r_t}{1 + r_{f,t}}\right)^{-\gamma}\right]^{-12/\gamma} - 1$$

It cannot be raised by changing risk over time without skill, unlike the Sharpe ratio.

@steps
1. Gross excess return of each month: $(1 + r_t)/(1 + r_f)$.
2. Raise each to $-\gamma = -2$.
3. Average them.
4. Raise the average to $-12/\gamma = -6$ and subtract 1.

@example
Returns 2%, −3%, 4%; monthly $r_f$ 0.2%.

@solution
1. 1.01796, 0.96806, 1.03792.
2. 0.96502, 1.06707, 0.92826.
3. Average 0.98678.
4. $0.98678^{-6} - 1 = 8.31\%$.

@answer
MRAR ≈ 8.31% a year, below the plain annualised excess return because volatility is penalised.

@pitfalls
- Using $+\gamma$ instead of $-\gamma$.
- Annualising with 12 instead of $12/\gamma$ in the exponent.
- Forgetting to divide by $1 + r_f$.
`,

  'PS4.simCov': ex`
@task
Questions on the single-index model's assumptions: the covariance between two stocks and which assumption makes it depend only on betas and market variance.

@idea
With $R_i = \alpha_i + \beta_iR_M + e_i$, the covariance of two stocks is

$$\text{cov}(R_i, R_j) = \beta_i\beta_j\sigma_M^2 + \beta_i\text{cov}(R_M, e_j) + \beta_j\text{cov}(R_M, e_i) + \text{cov}(e_i, e_j)$$

The model assumes residuals are uncorrelated with the market and **with each other**, so only $\beta_i\beta_j\sigma_M^2$ remains. That cuts the inputs from $n(n-1)/2$ covariances to $n$ betas.

@steps
1. Expand the covariance of the two return equations.
2. Drop terms with $\text{cov}(R_M, e)$ and $\text{cov}(e_i, e_j)$ (assumed zero).
3. Result: $\beta_i\beta_j\sigma_M^2$.

@example
Betas 1.2 and 0.8, $\sigma_M = 20\%$.

@solution
1. Covariance $= \beta_i\beta_j\sigma_M^2 + 0 + 0 + 0$.
2. $= 1.2 \times 0.8 \times 0.04 = 0.0384$.

@answer
cov = 0.0384; the key assumption is that residuals are uncorrelated across stocks.

@pitfalls
- Adding residual variances to a covariance between two different stocks.
- Forgetting to square $\sigma_M$.
`,

  'PS4.kkw': ex`
@task
An analyst's alpha forecast with a measured accuracy (R² of realised on forecast alphas). You compute the Treynor-Black weight using the adjusted alpha.

@idea
Kane, Kim and White: forecasts are noisy, so use $\tilde\alpha = R^2 \times \alpha$ before applying Treynor-Black. Low accuracy shrinks the position sharply:

$$w^0 = \frac{\tilde\alpha/\sigma^2(e)}{E[R_M]/\sigma_M^2}, \qquad w^* = \frac{w^0}{1 + (1-\beta)w^0}$$

@steps
1. $\tilde\alpha = R^2\alpha$.
2. $w^0$ with $\tilde\alpha$.
3. $w^*$ with the beta adjustment.

@example
Forecast alpha 5%, R² 0.2, β 1.0, σ(e) 20%, $E[R_M]$ 6%, $\sigma_M$ 20%.

@solution
1. $\tilde\alpha = 1\%$.
2. $w^0 = (0.01/0.04)/(0.06/0.04) = 0.167$.
3. β = 1, so $w^* = 0.167$ (with the raw 5% it would be 0.833).

@answer
Weight 0.167 in the active portfolio.

@pitfalls
- Using $\sqrt{R^2}$ or not adjusting at all.
- Applying the adjustment to the residual sd instead of the alpha.
`,

  'PS5.params': ex`
@task
Counting the parameters different portfolio methods need: full Markowitz, the number of covariances, the single-index model's input list, or a parametric portfolio policy.

@idea
- **Markowitz** with $n$ assets: $n$ means $+ n$ variances $+ n(n-1)/2$ covariances.
- **Single-index model** (slide list): $n$ means, $n$ residual variances, $n$ betas, $n$ alphas, plus $r_f$, $E(r_M)$, $\sigma_M^2$: $4n + 3$.
- **Parametric policy** $w_i = \theta'x_i/N$: only the $K$ elements of θ, whatever $n$.

@steps
1. Identify the method.
2. Apply its count.
3. For a difference, subtract the two counts.

@example
$n = 100$ assets; a policy with 3 characteristics.

@solution
1. Markowitz: $100 + 100 + 4{,}950 = 5{,}150$.
2. Covariances alone: 4,950.
3. Single-index: $403$; saving $5{,}150 - 403 = 4{,}747$.
4. Parametric policy: 3.

@answer
5,150 (Markowitz), 403 (single index), 3 (parametric policy).

@pitfalls
- Counting $n^2$ covariances (the matrix is symmetric).
- Counting $K \times n$ parameters for a parametric policy.
`,

  'PS5.ppp': ex`
@task
A parametric portfolio policy $w_i = \theta'x_i/N$ with standardised characteristics on top of a risk-free investment. You compute an asset's weight or the policy's return next month.

@idea
Each asset's weight is a linear function of its characteristics, the same θ for all assets. Because the characteristics are standardised cross-sectionally (mean zero), the weights sum to zero: a long-short overlay on the risk-free asset. The portfolio return is $r_p = r_f + \sum w_i r_i$.

@steps
1. For each asset: $\theta_1x_{1i} + \theta_2x_{2i}$, divide by $N$.
2. Check the weights sum to zero.
3. $r_p = r_f + \sum w_i r_i$.

@example
θ = (1.0, 0.5); four assets with $x_1$ = 1.0, −0.5, 0.2, −0.7 and $x_2$ = 0.4, 0.6, −1.2, 0.2; returns 3%, 1%, −2%, 2%; $r_f$ 0.2%.

@solution
1. Weights: $1.2/4 = 0.30$, $-0.2/4 = -0.05$, $-0.4/4 = -0.10$, $-0.6/4 = -0.15$.
2. Sum $= 0$.
3. $r_p = 0.2\% + 0.9\% - 0.05\% + 0.2\% - 0.3\% = 0.95\%$.

@answer
Asset 1 weight 0.30; policy return 0.95%.

@pitfalls
- Forgetting to divide by $N$.
- Forgetting the risk-free part of the return.
`,

  'PS5.galton': ex`
@task
Regressions of out-of-sample realised inputs (covariances, correlations, variances, means) on their historical estimates give an intercept and slope. You compute the Galton-corrected forecast for a stock.

@idea
History is a biased forecast: extreme estimates tend to **regress to the mean**. The regression line gives the best linear forecast:

$$\text{forecast} = a + b \times \text{historical estimate}$$

A slope of 1 (and intercept 0) would mean history is unbiased. Variances are the most persistent (highest slope); means the least (slope near zero or negative).

@steps
1. Pick the intercept and slope of the right input.
2. Forecast $= a + b \times$ estimate.

@example
Covariance: intercept 0.001, slope 0.35. A stock pair's historical covariance is 0.008.

@solution
1. $a = 0.001$, $b = 0.35$.
2. $0.001 + 0.35 \times 0.008 = 0.0038$.

@answer
Corrected forecast 0.0038.

@pitfalls
- Using $(1 - b)$ or forgetting the intercept.
- Taking the slope of another input's column.
`,

  'PS5.scenario': ex`
@task
Scenario returns with probabilities for a stock fund and a bond fund. You compute expected returns, standard deviations, covariance, correlation and the return and risk of a mix.

@idea
Use probability-weighted moments:

$$E[r] = \sum p_s r_s, \quad \sigma^2 = \sum p_s (r_s - E[r])^2, \quad \text{cov} = \sum p_s (r_{S,s} - E[r_S])(r_{B,s} - E[r_B])$$

Correlation $=$ cov $/(\sigma_S\sigma_B)$. A mix has $E = wE_S + (1-w)E_B$ and $\sigma^2 = w^2\sigma_S^2 + (1-w)^2\sigma_B^2 + 2w(1-w)\text{cov}$.

@steps
1. Expected returns.
2. Deviations per scenario; variances and covariance.
3. Correlation.
4. Portfolio return and sd.

@example
Probabilities 0.3/0.4/0.3; stock fund −10%, 10%, 30%; bond fund 8%, 4%, −2%. Mix 60/40.

@solution
1. $E_S = 10\%$, $E_B = 3.4\%$.
2. $\sigma_S = 15.49\%$, $\sigma_B = 3.90\%$; cov $= 0.3(-0.2)(0.046) + 0.4(0)(0.006) + 0.3(0.2)(-0.054) = -0.0060$.
3. $\rho = -0.0060/(0.1549 \times 0.0390) = -0.99$.
4. $E = 7.36\%$; $\sigma = 7.75\%$.

@answer
ρ ≈ −0.99; the 60/40 mix returns 7.36% with an sd of 7.75%.

@pitfalls
- Using $1/n$ weights instead of the probabilities.
- Dividing by $n - 1$ (these are population moments).
`,

  'PS5.utility': ex`
@task
Mean-variance utility $U = E[r] - \frac12A\sigma^2$: which investment an investor prefers, the certainty equivalent, the risk aversion at which she is indifferent to T-bills, or the highest acceptable volatility.

@idea
The certainty equivalent is the utility itself: the riskless return that is equally good. An investor is indifferent to T-bills when $U = r_f$:

$$A = \frac{2(E[r] - r_f)}{\sigma^2}, \qquad \sigma_{max} = \sqrt{\frac{2(E[r] - r_f)}{A}}$$

@steps
1. $U = E[r] - 0.5A\sigma^2$ for each choice; pick the highest.
2. Certainty equivalent $= U$.
3. Indifference A or maximum σ from the formulas.

@example
A = 4. Choice 1: 10%, σ 20%. Choice 2: 8%, σ 10%. T-bills 4%.

@solution
1. $U_1 = 0.10 - 2 \times 0.04 = 2\%$; $U_2 = 0.08 - 2 \times 0.01 = 6\%$ → choice 2.
2. Choice 1's certainty equivalent is 2% (below T-bills).
3. Indifference for choice 1: $A = 2 \times 0.06/0.04 = 3$; with A = 4 the maximum σ is $\sqrt{0.12/4} = 17.3\%$.

@answer
She prefers choice 2 (U = 6%); A = 3 is the indifference point for choice 1.

@pitfalls
- Using σ instead of σ² in the utility.
- Forgetting the ½.
`,

  'PS5.cal': ex`
@task
T-bills and an optimal risky portfolio P. You compute the CAL's slope, the optimal fraction $y^*$ for a given risk aversion, and the complete portfolio's return and sd.

@idea
Mixing P with T-bills gives the capital allocation line with slope $SR_P = (E[r_P] - r_f)/\sigma_P$. Maximising $U = E[r_C] - \frac12A\sigma_C^2$ gives

$$y^* = \frac{E[r_P] - r_f}{A\sigma_P^2}$$

Then $E[r_C] = r_f + y^*(E[r_P] - r_f)$ and $\sigma_C = y^*\sigma_P$.

@steps
1. Slope $= (E[r_P] - r_f)/\sigma_P$.
2. $y^*$ from the formula.
3. $E[r_C]$ and $\sigma_C$.

@example
$r_f$ 4%; P: 12%, σ 25%; A = 4.

@solution
1. Slope $= 8\%/25\% = 0.32$.
2. $y^* = 0.08/(4 \times 0.0625) = 0.32$.
3. $E[r_C] = 4\% + 0.32 \times 8\% = 6.56\%$; $\sigma_C = 8\%$.

@answer
Slope 0.32; 32% in P; complete portfolio 6.56% with an sd of 8%.

@pitfalls
- Using total instead of excess return in $y^*$.
- Forgetting to square $\sigma_P$.
`,

  'PS5.twoAsset': ex`
@task
Two risky assets: the sd of a mix, the correlation implied by a given portfolio sd, the weight for a target return, or with perfect negative correlation the zero-risk mix and the risk-free rate that rules out arbitrage.

@idea
$$\sigma_P^2 = w^2\sigma_1^2 + (1-w)^2\sigma_2^2 + 2w(1-w)\rho\sigma_1\sigma_2$$

- Solving for ρ from a given $\sigma_P$ inverts this formula.
- Target return: $w = (E^* - E_2)/(E_1 - E_2)$.
- With ρ = −1 the risks offset completely at $w_1 = \sigma_2/(\sigma_1 + \sigma_2)$; that portfolio is riskless, so its return must equal $r_f$.

@steps
1. Plug into the variance formula (or solve it for ρ).
2. Target-return weight from the linear return equation.
3. ρ = −1: $w_1 = \sigma_2/(\sigma_1 + \sigma_2)$; $r_f = w_1E_1 + (1 - w_1)E_2$.

@example
$\sigma_1 = 20\%$, $\sigma_2 = 30\%$, ρ = 0.3, 60/40 mix. Then ρ = −1 with $E_1 = 8\%$, $E_2 = 14\%$.

@solution
1. $\sigma_P^2 = 0.0144 + 0.0144 + 2 \times 0.24 \times 0.018 = 0.03744$ → 19.35%.
2. ρ = −1: $w_1 = 0.3/0.5 = 0.6$.
3. Riskless return $= 0.6 \times 8\% + 0.4 \times 14\% = 10.4\%$ = required $r_f$.

@answer
Mix sd 19.35%; with ρ = −1 a 60/40 mix is riskless and r_f must be 10.4%.

@pitfalls
- Forgetting the covariance term or its factor 2.
- Using $\sigma_1/(\sigma_1 + \sigma_2)$ for the riskless weight.
`,

  'PS5.errorMax': ex`
@task
Two assets with the same sd and a given correlation; the expected excess return of one is raised by a small amount. You compute the change in its tangency weight.

@idea
**Error maximisation** (Michaud): the optimiser treats small, statistically meaningless differences in expected returns as real and shifts weight aggressively, especially when assets are highly correlated (they are close substitutes). Recompute the tangency weight with the formula before and after:

$$w_1 = \frac{\mu_1\sigma_2^2 - \mu_2\sigma_{12}}{\mu_1\sigma_2^2 + \mu_2\sigma_1^2 - (\mu_1 + \mu_2)\sigma_{12}}$$

@steps
1. $\sigma_{12} = \rho\sigma^2$.
2. Tangency weight with the original means.
3. Tangency weight with the changed mean.
4. Change $=$ after $-$ before.

@example
Both sd 20%, ρ = 0.8, expected excess returns 5% and 5%; asset 1 is revised to 6%.

@solution
1. $\sigma_{12} = 0.032$.
2. Before: symmetric, $w_1 = 0.5$.
3. After: $w_1 = (0.06 \times 0.04 - 0.05 \times 0.032)/(0.0024 + 0.002 - 0.11 \times 0.032) = 0.0008/0.00088 = 0.909$.
4. Change $= +0.409$.

@answer
A 1-point change in one estimate raises the weight by about 41 percentage points.

@pitfalls
- Reporting the new weight instead of the change.
- Forgetting the covariance terms in the formula.
`,

  'PS6.compare': ex`
@task
Statements comparing mutual funds and hedge funds; you pick the one most likely to be true.

@idea
| | Mutual funds | Hedge funds |
|---|---|---|
| Regulation, disclosure | strict, must disclose strategy and holdings | light, little disclosure |
| Investors | public | wealthy and institutional, limited number |
| Strategies | mostly long-only, limited leverage | flexible: shorting, leverage, derivatives |
| Liquidity | daily redemption | lock-ups, redemption notice |
| Fees | lower, no incentive fee | 1–2% plus about 20% incentive fee |

@steps
1. Identify the dimension in each statement (fees, regulation, liquidity, strategy).
2. Compare with the table.
3. Pick the statement consistent with it.

@example
"Hedge funds typically impose lock-up periods, whereas mutual fund investors can redeem daily."

@solution
1. Dimension: liquidity.
2. Hedge funds use lock-ups and notice periods; mutual funds offer daily redemption.

@answer
True: lock-ups and notice periods are typical for hedge funds, daily redemption for mutual funds.

@pitfalls
- "Mutual funds charge higher fees": false.
- "Hedge funds must disclose holdings like mutual funds": false.
`,

  'PS6.grossNeeded': ex`
@task
A hedge fund charges a management fee and an incentive fee above a hurdle. You compute the gross return needed for investors to earn a target net return.

@idea
Net return $=$ gross $-$ management fee $-$ incentive fee on the part above the hurdle:

$$r_{net} = r - m - \text{inc}(r - h) \quad\Rightarrow\quad r = \frac{r_{net} + m - \text{inc}\cdot h}{1 - \text{inc}}$$

@steps
1. Write the net-return equation.
2. Solve for the gross return $r$.
3. Check by recomputing the fees.

@example
Management fee 2%, incentive fee 20%, no hurdle; target net return 10%.

@solution
1. $0.10 = r - 0.02 - 0.2r$.
2. $r = 0.12/0.8 = 15\%$.
3. Fees: $2\% + 0.2 \times 15\% = 5\%$ → net 10% ✓.

@answer
The fund must earn 15% gross.

@pitfalls
- Adding the fees to the net return without dividing by $1 - \text{inc}$.
- Charging the incentive fee on the net instead of the gross return.
`,

  'PS6.parity': ex`
@task
An index without dividends, the one-year risk-free rate and a quoted one-year futures price. You compute the fair futures price, the arbitrage and the riskless profit for a number of contracts.

@idea
Spot-futures parity (no dividends, annual rate): $F_0 = S_0(1 + r_f)$. If the quote is higher, sell futures, borrow and buy the index (cash and carry); if lower, short the index, lend and buy futures. Profit per contract $= |F_{quote} - F_0| \times$ multiplier.

@steps
1. $F_0 = S_0(1 + r_f)$.
2. Compare with the quote and pick the direction.
3. Profit $= |\text{gap}| \times 250 \times$ contracts.

@example
Index 4,000, $r_f$ 3%, futures quoted at 4,150, 2 contracts.

@solution
1. $F_0 = 4{,}000 \times 1.03 = 4{,}120$.
2. Quote too high: borrow, buy the index, sell futures.
3. Profit $= 30 \times 250 \times 2 = 15{,}000$ dollars.

@answer
Fair price 4,120; cash and carry earns \$15,000.

@pitfalls
- Using continuous compounding when the question uses a simple annual rate.
- Forgetting the multiplier.
- Reversing the trade direction.
`,
};
