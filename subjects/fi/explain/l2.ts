import { ex, type ExplainMap } from '@/lib/explain';

export const L2: ExplainMap = {
  'L2.surprise': ex`
@task
Two macro factors drive returns. You know their expected values and realisations, the stock's expected return and its factor betas. You are asked for the surprises and the stock's expected return conditional on what happened.

@idea
In a factor model the stock's return moves with the **unexpected** part of each factor, not its level:

$$E[r \mid F] = E[r] + \beta_1(F_1 - E[F_1]) + \beta_2(F_2 - E[F_2])$$

A factor that comes in exactly as expected changes nothing; a negative beta means the stock falls when the factor surprises upwards.

@steps
1. Surprise $=$ realised $-$ expected, for each factor.
2. Multiply each surprise by its beta (keep the signs).
3. Add to the stock's expected return.

@example
Expected GDP growth 3%, realised 4%; expected interest rate 4%, realised 4.5%. The stock expects 10%, with beta 1.5 on GDP and −2 on interest rates.

@solution
1. Surprises: GDP +1%, interest rate +0.5%.
2. Contributions: $1.5 \times 1\% = 1.5\%$; $-2 \times 0.5\% = -1\%$.
3. Conditional return $= 10\% + 1.5\% - 1\% = 10.5\%$.

@answer
The stock's expected return given the realisations is 10.5%.

@pitfalls
- Multiplying the beta by the realised level instead of the surprise.
- Dropping the sign of a negative beta or a negative surprise.
`,

  'L2.twoFactor': ex`
@task
Two well-diversified, correctly priced portfolios with betas on two factors and their expected returns, plus $r_f$. You are asked for both factor risk premiums and the fair return of another well-diversified portfolio.

@idea
The multifactor APT says every well-diversified portfolio satisfies

$$E[r] = r_f + \beta_1\lambda_1 + \beta_2\lambda_2$$

Two portfolios give two equations in the two unknown premiums $\lambda_1, \lambda_2$. Solve the system, then price any portfolio with its betas.

@steps
1. Excess returns: $E[r_A] - r_f$ and $E[r_B] - r_f$.
2. Write $\beta_{A1}\lambda_1 + \beta_{A2}\lambda_2 = E[r_A] - r_f$ and the same for B.
3. Solve (substitution or $\lambda_1 = \frac{y_A\beta_{B2} - y_B\beta_{A2}}{\beta_{A1}\beta_{B2} - \beta_{A2}\beta_{B1}}$, then $\lambda_2$).
4. New portfolio: $r_f + \beta_1\lambda_1 + \beta_2\lambda_2$.

@example
$r_f = 4\%$. A: betas 1.0 and 0.5, $E[r] = 10\%$. B: betas 0.5 and 1.5, $E[r] = 9\%$. Price a portfolio with betas 1 and 1.

@solution
1. Excess returns 6% and 5%.
2. $\lambda_1 + 0.5\lambda_2 = 6\%$; $0.5\lambda_1 + 1.5\lambda_2 = 5\%$.
3. From the first, $\lambda_1 = 6\% - 0.5\lambda_2$; substitute: $3\% + 1.25\lambda_2 = 5\%$, so $\lambda_2 = 1.6\%$ and $\lambda_1 = 5.2\%$.
4. $4\% + 5.2\% + 1.6\% = 10.8\%$.

@answer
Premiums 5.2% (F1) and 1.6% (F2); the new portfolio should return 10.8%.

@pitfalls
- Forgetting to subtract $r_f$ before solving.
- Mixing up which beta belongs to which factor.
- Assuming premiums must be positive; a factor premium can be negative.
`,

  'L2.arbitrage': ex`
@task
A one-factor world with two correctly priced well-diversified portfolios A and B. You are asked for the implied risk-free rate and factor premium, the alpha of a third portfolio J, how to exploit it, and the mimicking portfolio's weight in A.

@idea
All well-diversified portfolios lie on one line, $E[r] = r_f + \beta \cdot RP$. Two points determine it:

$$RP = \frac{E[r_A] - E[r_B]}{\beta_A - \beta_B}, \qquad r_f = E[r_A] - \beta_A RP$$

A portfolio off the line has an alpha. Build a **mimicking portfolio** with the same beta from A and the risk-free asset (weight $\beta_J/\beta_A$ in A). Buying the cheaper and shorting the dearer gives a riskless, zero-investment profit.

@steps
1. $RP$ from the two portfolios, then $r_f$.
2. Fair return for J: $r_f + \beta_J RP$; alpha $= E[r_J] -$ fair.
3. Mimic: $\beta_J/\beta_A$ in A, the rest in the risk-free asset.
4. Positive alpha → buy J, sell the mimic; negative → the reverse.

@example
A: β 1.5, E[r] 13%. B: β 0.5, E[r] 7%. J: β 1.0, E[r] 10.5%.

@solution
1. $RP = 6\%/1.0 = 6\%$; $r_f = 13\% - 1.5 \times 6\% = 4\%$.
2. Fair J $= 4\% + 6\% = 10\%$; alpha $= +0.5\%$.
3. Mimic: $1.0/1.5 = 0.667$ in A, 0.333 in the risk-free asset.
4. Buy J and short the mimic: 0.5% per euro, riskless.

@answer
r_f = 4%, RP = 6%, alpha of J +0.5%: buy J, sell its mimicking portfolio.

@pitfalls
- Using one portfolio's return as the risk-free rate.
- Building the mimic from B when the question asks for A (or forgetting the risk-free part).
- Selling the underpriced side.
`,

  'L2.longShort': ex`
@task
All stocks have beta 1 and the same residual risk; you go long in $n$ stocks with positive alpha and short in $n$ stocks with negative alpha with the same amount on each side. You are asked for the expected profit and its standard deviation, also with more stocks.

@idea
Beta exposure cancels (long and short both have beta 1), so the profit is alpha plus residual noise.

- Expected profit: you earn $+\alpha$ on the long side and $+\alpha$ on the short side (shorting a $-\alpha$ stock): $2\alpha X$.
- Risk: each leg is an equal-weighted average of $n$ independent residuals, variance $\sigma_e^2/n$; two legs add up: $\sigma = \sigma_e\sqrt{2/n}$ per euro, times $X$.

More stocks shrink the risk with $1/\sqrt{n}$, but not the expected profit.

@steps
1. Expected profit $= 2\alpha X$.
2. Sd of the return per euro $= \sigma_e\sqrt{2/n}$.
3. Sd of the profit $=$ step 2 $\times X$.
4. Repeat step 2 with the new $n$.

@example
Residual sd 40%, alpha ±2%, 10 stocks per leg, $1,000,000 on each side.

@solution
1. Expected profit $= 2 \times 0.02 \times 1{,}000{,}000 = 40{,}000$ dollars.
2. $0.40\sqrt{2/10} = 17.89\%$.
3. Sd of the profit = 0.1789 × 1,000,000 = 178,885 dollars.
4. With 100 stocks per leg: $0.40\sqrt{0.02} = 5.66\%$, i.e. $56,569.

@answer
Expected profit $40,000 with an sd of $178,885 (only $56,569 with 100 stocks per leg).

@pitfalls
- Counting alpha only once.
- Using $\sigma_e/\sqrt{n}$ for the long-short position (it has two legs: $\sqrt{2/n}$).
- Including market risk; it cancels.
`,

  'L2.concept': ex`
@task
Concept questions on the APT and market efficiency: true/false, find the false (or true) statement, or the best short answer.

@idea
- **APT**: returns follow a factor model, specific risk diversifies away, arbitrage cannot persist. It applies to well-diversified portfolios, needs only a few arbitrageurs, does **not** require the market to be the tangency portfolio or mean-variance investors, and does not tell which factors are priced.
- A well-diversified portfolio with a non-zero alpha is an arbitrage opportunity.
- In a one-factor world, well-diversified portfolios are perfectly correlated; the APT is a limiting case of Treynor-Black.
- **EMH**: weak (past prices → no technical analysis), semi-strong (public information → no fundamental analysis), strong (all information). The forms are nested.
- Momentum and reversal challenge weak-form efficiency; drift after earnings challenges the semi-strong form; insider profits only the strong form.

@steps
1. Is it about the APT's assumptions or about EMH forms?
2. Check the assumption list or the nesting of information sets.
3. Watch for CAPM assumptions wrongly attributed to the APT.
4. Pick the odd one out among four options.

@example
True or false? "Weak-form efficiency implies that fundamental analysis cannot earn abnormal returns."

@solution
1. Weak form: prices reflect past prices and volume.
2. Fundamental analysis uses public information beyond prices.
3. Ruling it out requires the semi-strong form.

@answer
False. The weak form only rules out technical analysis.

@pitfalls
- "The APT needs the market portfolio to be efficient": false.
- "A positive-alpha diversified portfolio is consistent with the APT": false.
- "Momentum is cheap to exploit": false, it has high turnover.
`,
};
