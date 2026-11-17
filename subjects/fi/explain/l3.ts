import { ex, type ExplainMap } from '@/lib/explain';

export const L3: ExplainMap = {
  'L3.ratios': ex`
@task
A managed portfolio's average return, standard deviation and beta, the market's return and standard deviation, and $r_f$. You are asked for the Sharpe ratio, Treynor ratio, Jensen's alpha and M², and whether the fund beats the market as an investor's whole risky portfolio.

@idea
Each measure divides excess return by a different notion of risk:

| Measure | Formula | Risk used |
|---|---|---|
| Sharpe | $(\bar r_P - r_f)/\sigma_P$ | total |
| Treynor | $(\bar r_P - r_f)/\beta_P$ | systematic |
| Jensen's alpha | $\bar r_P - [r_f + \beta_P(\bar r_M - r_f)]$ | systematic |
| M² | $r_f + SR_P\,\sigma_M - \bar r_M$ | total, in % |

M² levers or delevers the fund with T-bills to the market's volatility ($P^*$ with weight $\sigma_M/\sigma_P$ in the fund) and compares its return with the market's.

@steps
1. Sharpe $= (\bar r_P - r_f)/\sigma_P$; compare with $SR_M$.
2. Treynor $= (\bar r_P - r_f)/\beta_P$.
3. Alpha $= \bar r_P - r_f - \beta_P(\bar r_M - r_f)$.
4. M²: weight in fund $w = \sigma_M/\sigma_P$; $r_{P^*} = r_f + w(\bar r_P - r_f)$; M² $= r_{P^*} - \bar r_M$.

@example
Fund: 12%, σ 25%, β 1.2. Market: 10%, σ 20%. $r_f = 3\%$.

@solution
1. Sharpe $= 9/25 = 0.36$ (market $7/20 = 0.35$).
2. Treynor $= 9\%/1.2 = 7.5\%$.
3. Alpha $= 12\% - 3\% - 1.2 \times 7\% = 0.6\%$.
4. $w = 20/25 = 0.8$; $r_{P^*} = 3\% + 0.8 \times 9\% = 10.2\%$; M² $= 0.2\%$.

@answer
Sharpe 0.36, Treynor 7.5%, alpha 0.6%, M² 0.2%: slightly better than the market.

@pitfalls
- Using total return instead of excess return in the numerators.
- Using $\sigma_P$ in Treynor or $\beta$ in Sharpe.
- Computing M² as the difference of Sharpe ratios (it is a return difference).
`,

  'L3.ir': ex`
@task
A regression of a fund's excess returns on the market gives alpha and beta (sometimes R²), with the fund's and market's standard deviations. You are asked for the residual standard deviation, the information ratio, the Treynor-Black weight of the fund next to the index, and the resulting Sharpe ratio.

@idea
- Residual risk: $\sigma^2(e) = \sigma_P^2 - \beta^2\sigma_M^2 = (1 - R^2)\sigma_P^2$.
- **Information ratio** $IR = \alpha/\sigma(e)$: alpha per unit of active (diversifiable) risk.
- Combined optimally with the index (Treynor-Black):
$$w^0 = \frac{\alpha/\sigma^2(e)}{E[R_M]/\sigma_M^2}, \qquad w^* = \frac{w^0}{1 + (1 - \beta)w^0}, \qquad SR_P^2 = SR_M^2 + IR^2$$

@steps
1. $\sigma(e) = \sqrt{\sigma_P^2 - \beta^2\sigma_M^2}$.
2. $IR = \alpha/\sigma(e)$.
3. $w^0$, then $w^*$.
4. $SR_P = \sqrt{SR_M^2 + IR^2}$.

@example
Alpha 2%, beta 1.2, fund sd 30%, market sd 20%, market risk premium 6%.

@solution
1. $\sigma(e) = \sqrt{0.09 - 0.0576} = 18\%$.
2. $IR = 2/18 = 0.111$.
3. $w^0 = (0.02/0.0324)/(0.06/0.04) = 0.4115$; $w^* = 0.4115/(1 - 0.2 \times 0.4115) = 0.448$.
4. $SR_P = \sqrt{0.30^2 + 0.111^2} = 0.320$.

@answer
Residual sd 18%, IR 0.111, weight 0.448 in the fund, Sharpe ratio 0.320.

@pitfalls
- Dividing alpha by the total sd.
- Forgetting to square $\sigma(e)$ and $\sigma_M$ in $w^0$.
- Adding Sharpe ratios instead of their squares.
`,

  'L3.tstat': ex`
@task
A manager has a true monthly alpha and residual standard deviation. You are asked how many months are needed before the alpha is significant at a given level, how many years that is, or the t-statistic after a given period.

@idea
The t-statistic of the estimated alpha grows with the square root of the sample size:

$$t = \frac{\alpha}{\sigma(e)}\sqrt{n} \quad\Rightarrow\quad n = \left(\frac{z\,\sigma(e)}{\alpha}\right)^2$$

with $z$ = 1.96 (5%), 1.645 (10%) or 2.576 (1%), two-tailed. Even good managers need decades of data.

@steps
1. Monthly $\alpha$ and $\sigma(e)$ in the same units.
2. $n = (z\sigma(e)/\alpha)^2$ months; divide by 12 for years.
3. For a given $n$: $t = (\alpha/\sigma(e))\sqrt n$.

@example
Alpha 0.5% per month, residual sd 4% per month, 5% level.

@solution
1. $\alpha/\sigma(e) = 0.125$.
2. $n = (1.96 \times 4/0.5)^2 = 245.9$ months $= 20.5$ years.
3. After 60 months: $t = 0.125\sqrt{60} = 0.97$.

@answer
About 246 months (20.5 years); after 5 years the t-statistic is only 0.97.

@pitfalls
- Forgetting to square: $n$ is the square of $z\sigma/\alpha$.
- Mixing annual alpha with monthly residual risk.
- Using the one-tailed critical value.
`,

  'L3.attribution': ex`
@task
Weights and returns of a portfolio and its benchmark (bogey) across asset classes. You are asked for the bogey return, the total excess return, and its split into asset allocation and security selection.

@idea
Total excess return $= \sum w_{P,i} r_{P,i} - \sum w_{B,i} r_{B,i}$ splits into:

- **Asset allocation**: over- or underweighting classes, valued at the **index** returns: $\sum (w_{P,i} - w_{B,i}) r_{B,i}$.
- **Security selection**: beating the index within each class, at the **portfolio** weights: $\sum w_{P,i}(r_{P,i} - r_{B,i})$.

Both add up to the total.

@steps
1. Bogey return $= \sum w_B r_B$; portfolio return $= \sum w_P r_P$.
2. Excess return $=$ difference.
3. Allocation $= \sum (w_P - w_B) r_B$.
4. Selection $= \sum w_P (r_P - r_B)$; check that 3 + 4 = 2.

@example
Bogey weights equity/bonds/cash 0.6/0.3/0.1 with index returns 10%/4%/2%. Portfolio weights 0.7/0.2/0.1 with returns 12%/3.5%/2%.

@solution
1. Bogey $= 6 + 1.2 + 0.2 = 7.4\%$; portfolio $= 8.4 + 0.7 + 0.2 = 9.3\%$.
2. Excess $= 1.9\%$.
3. Allocation $= 0.1 \times 10\% - 0.1 \times 4\% = 0.6\%$.
4. Selection $= 0.7 \times 2\% + 0.2 \times (-0.5\%) = 1.3\%$.

@answer
Excess return 1.9% = 0.6% asset allocation + 1.3% security selection.

@pitfalls
- Using portfolio returns in the allocation term or benchmark weights in the selection term.
- Forgetting a class whose weight did not change.
`,

  'L3.dwr': ex`
@task
You buy a share, receive dividends, buy another share later and finally sell. You are asked for holding-period returns, the arithmetic and geometric time-weighted averages, and the dollar-weighted return (IRR).

@idea
- **Time-weighted** returns measure the asset's performance per period, independent of how much you invested: $r_t = \frac{P_t - P_{t-1} + D_t}{P_{t-1}}$; average them arithmetically or geometrically ($\sqrt[n]{\prod(1 + r_t)} - 1$).
- **Dollar-weighted** return is the IRR of **your** cash flows: it weights periods by the money invested, so it is lower if you invested more before a weak period.

@steps
1. Holding-period returns per year.
2. Arithmetic mean and geometric mean.
3. Cash flows: purchases negative, dividends and sales positive, at their dates.
4. IRR: solve $\sum CF_t/(1 + r)^t = 0$ (quadratic for two periods).

@example
Buy one share at $50. End of year 1: dividend $2, buy a second share at $55. End of year 2: $2 per share, sell both at $60.

@solution
1. $r_1 = (55 - 50 + 2)/50 = 14\%$; $r_2 = (60 - 55 + 2)/55 = 12.73\%$.
2. Arithmetic $13.36\%$; geometric $\sqrt{1.14 \times 1.1273} - 1 = 13.36\%$.
3. Cash flows: −50, then $2 - 55 = -53$, then $4 + 120 = 124$.
4. $-50 - 53/(1 + r) + 124/(1 + r)^2 = 0 \Rightarrow r = 13.16\%$.

@answer
Time-weighted ≈ 13.36%; dollar-weighted 13.16% (more money was invested in the weaker year).

@pitfalls
- Forgetting the dividend on the second share in year 2.
- Putting the year-1 purchase and dividend in different periods.
- Calling the IRR a time-weighted return.
`,

  'L3.concept': ex`
@task
Concept questions on performance measurement: true/false, find the false (or true) statement, or the best short answer.

@idea
- **Sharpe / M²**: for an investor's entire risky portfolio (total risk). Sharpe can be gamed by varying leverage over time; MRAR cannot.
- **Treynor**: for one of many sub-portfolios (only beta risk matters).
- **Information ratio** $\alpha/\sigma(e)$: for a single active fund next to an index; $SR_P^2 = SR_M^2 + IR^2$.
- **Jensen's alpha**: average return above the CAPM return for the fund's beta.
- Dollar-weighted return $=$ IRR of investor flows; below time-weighted when money arrives before bad periods (investors lose about 1.56% a year through timing).
- Significance of alpha needs many years: $n = (z\sigma(e)/\alpha)^2$.

@steps
1. Identify the situation or measure in the statement.
2. Match it with the rule above.
3. Check definitions (IR uses residual risk, not total risk).
4. Pick the odd one out among four options.

@example
True or false? "If a fund is one of many sub-portfolios, the Sharpe ratio is the right measure."

@solution
1. Situation: one of many sub-portfolios.
2. Their specific risks diversify away in the total portfolio.
3. Only beta risk is relevant → Treynor ratio.

@answer
False. The Treynor ratio is the right measure there.

@pitfalls
- "IR divides alpha by total sd": false.
- "Time-weighted returns weight by capital": false.
- "Three years of data establish skill": false.
`,
};
