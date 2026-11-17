import { ex, type ExplainMap } from '@/lib/explain';

export const L6: ExplainMap = {
  'L6.portable': ex`
@task
A portfolio with alpha and beta relative to the S&P 500 is hedged with index futures. You are asked for the unhedged value at $t+1$ as a constant plus coefficients on the market return (and residual), the number of contracts, the futures position's constant, the hedged portfolio's constant and its expected return.

@idea
Write everything as value at $t+1$ in \$ million, with $V$ the portfolio value:

- Unhedged: $V(1 + r_f + \alpha + \beta(r_M - r_f) + e) = \underbrace{V(1 + \alpha + r_f(1 - \beta))}_{a} + V\beta\,r_M + V e$.
- Short futures on $V\beta$ of index exposure: contracts $= \frac{V\beta}{250 \times S_0}$. With $F_0 = S_0(1 + r_f)$ the futures gain is $-V\beta(r_M - r_f) = V\beta r_f - V\beta r_M$.
- Hedged: the $r_M$ terms cancel, leaving $V(1 + \alpha + r_f) + Ve$: **portable alpha**, expected return $\alpha + r_f$.

@steps
1. Constant $a = V(1 + \alpha + r_f(1 - \beta))$; coefficient on $r_M$: $V\beta$; on $e$: $V$.
2. Contracts $= V\beta/(250 S_0)$.
3. Futures constant $= V\beta r_f$; coefficient $-V\beta$.
4. Hedged constant $= a + V\beta r_f = V(1 + \alpha + r_f)$.
5. Expected return $= \alpha + r_f$.

@example
\$20m portfolio, α 4%, β 1.25, $r_f$ 2%, S&P at 4,000, multiplier 250.

@solution
1. $a = 20 \times (1 + 0.04 + 0.02 \times (-0.25)) = 20.70$; coefficient on $r_M$: 25.
2. Contracts $= 20{,}000{,}000 \times 1.25/(250 \times 4{,}000) = 25$.
3. Futures constant $= 25 \times 0.02 = 0.50$; coefficient −25.
4. Hedged constant $= 20.70 + 0.50 = 21.20$.
5. Expected return $= 4\% + 2\% = 6\%$ ($21.2/20 - 1$).

@answer
Sell 25 contracts; hedged value 21.20 + 20e (\$ million), expected return 6%.

@pitfalls
- Forgetting $r_f(1 - \beta)$ in the unhedged constant.
- Hedging $V$ instead of $V\beta$ of index exposure.
- Leaving out the interest earned through the futures ($V\beta r_f$).
`,

  'L6.fees': ex`
@task
An investor in two hedge funds (or a fund of funds in three) pays management and incentive fees with a hurdle. You are asked for the incentive fees, the gross return and the return after fees.

@idea
Fees are charged **fund by fund**:

- Management fee: a percentage of assets in every fund.
- Incentive fee: a percentage of each fund's return **above the hurdle**, and only if positive: $\text{inc} \times \max(r_i - h, 0) \times A_i$.

Losers do not refund the winners' incentive fees, so the investor can pay incentive fees even when the total gross return is low or negative — the fund-of-funds problem.

@steps
1. Gross gain $= \sum A_i r_i$; gross return $=$ gain $/ \sum A_i$.
2. Management fees $= m \times \sum A_i$.
3. Incentive fees $= \sum \text{inc} \times A_i \max(r_i - h, 0)$.
4. Net return $= (\text{gain} - \text{fees})/\sum A_i$.

@example
\$2m in fund A (+20%) and \$3m in fund B (−10%); 2% management fee, 20% incentive fee, no hurdle.

@solution
1. Gain $= 0.4 - 0.3 = 0.1$ → gross 2%.
2. Management $= 0.02 \times 5 = 0.1$.
3. Incentive: A $0.2 \times 2 \times 0.20 = 0.08$; B none → 0.08.
4. Net $= (0.1 - 0.1 - 0.08)/5 = -1.6\%$.

@answer
Incentive fees \$0.08m; gross +2%, net −1.6%.

@pitfalls
- Charging the incentive fee on the aggregate return.
- Charging an incentive fee on a loss or below the hurdle.
- Forgetting management fees on the losing fund.
`,

  'L6.hwm': ex`
@task
An investment in a hedge fund with an incentive fee and a high-water mark over three years. You are asked for the fee in a given year, the value after fees, or the return needed to earn fees again.

@idea
With a **high-water mark** the incentive fee is paid only on value **above the highest previous value after fees**. After a loss, the fund must first recover to the old peak before it can charge again:

$$\text{fee}_t = \text{inc} \times \max(V_t^{gross} - HWM, 0), \qquad HWM = \max(\text{previous values after fees})$$

@steps
1. Start: value 100, HWM 100.
2. Each year: gross value $= V \times (1 + r)$.
3. Fee $= \text{inc} \times \max(\text{gross} - HWM, 0)$; value after fees $=$ gross $-$ fee.
4. Update HWM $= \max(HWM, V)$.
5. Return needed to reach the HWM: $HWM/V - 1$.

@example
\$100, 20% incentive fee with HWM; gross returns +20%, −20%, +30%.

@solution
1. Year 1: gross 120, fee $0.2 \times 20 = 4$, value 116, HWM 116.
2. Year 2: gross 92.80, no fee, value 92.80, HWM stays 116.
3. Year 3: gross $92.80 \times 1.3 = 120.64$, fee $0.2 \times (120.64 - 116) = 0.93$.
4. Value after fees 119.71.

@answer
Fees: \$4 in year 1, none in year 2, \$0.93 in year 3.

@pitfalls
- Charging the fee on the whole year-3 gain instead of the part above the HWM.
- Setting the HWM at the gross value instead of the value after fees.
- Resetting the HWM after a loss.
`,

  'L6.lagBeta': ex`
@task
A fund holds illiquid assets. A regression on the contemporaneous market gives a beta and alpha; adding lagged market returns gives further coefficients. You are asked for the Scholes-Williams beta, by how much the simple regression understates exposure, and the corrected alpha.

@idea
Stale prices react to market moves with a delay, so part of the market exposure shows up in **lagged** coefficients. The true beta is the sum:

$$\beta_{SW} = \beta_0 + \beta_1 + \beta_2$$

A too-low beta makes the fund look as if it had alpha. Correct the alpha with the full beta: $\alpha_{adj} = \bar r - \beta_{SW}\bar r_M$, where the mean excess return is $\bar r = \alpha_{simple} + \beta_0\bar r_M$.

@steps
1. $\beta_{SW} = \beta_0 + \beta_1 + \beta_2$.
2. Understatement factor $= \beta_{SW}/\beta_0$.
3. Mean excess return $= \alpha_{simple} + \beta_0\bar r_M$.
4. $\alpha_{adj}$ = mean − $\beta_{SW}\bar r_M$.

@example
$\beta_0 = 0.3$, lags 0.2 and 0.1; simple alpha 0.4% per month; mean market excess return 0.6% per month.

@solution
1. $\beta_{SW} = 0.6$.
2. Factor $= 0.6/0.3 = 2$.
3. Mean $= 0.4\% + 0.3 \times 0.6\% = 0.58\%$.
4. $\alpha_{adj} = 0.58\% - 0.6 \times 0.6\% = 0.22\%$.

@answer
Corrected beta 0.6 (twice the naive one); monthly alpha falls from 0.40% to 0.22%.

@pitfalls
- Averaging the coefficients instead of adding them.
- Subtracting only the lagged betas from alpha.
- Thinking stale prices understate alpha; they overstate it.
`,

  'L6.concept': ex`
@task
Concept questions on hedge funds: true/false, find the false (or true) statement, or the best short answer.

@idea
- Hedge funds: lightly regulated, flexible, often illiquid; usually **higher** fees than mutual funds (1–2% plus about 20% incentive); no public disclosure of holdings.
- The incentive fee is like a **call option**: it rewards risk taking.
- **Fund of funds**: fees are charged fund by fund, so investors can pay incentive fees while the aggregate loses.
- **High-water mark**: fees only above the previous peak; deep losses give managers an incentive to close the fund.
- Databases suffer from **survivorship and backfill bias**.
- Stale prices make simple CAPM regressions **overestimate** alpha (lagged betas, Scholes-Williams). Possible alpha sources include an illiquidity premium.

@steps
1. Identify the feature (fees, HWM, biases, measurement).
2. Check the direction (over- vs underestimate, higher vs lower fees).
3. Pick the odd one out among four options.

@example
True or false? "Simple CAPM regressions tend to underestimate the alphas of hedge funds because they ignore exposure to lagged market returns."

@solution
1. Ignoring lagged returns understates beta.
2. A too-low beta leaves part of the market premium in alpha.

@answer
False. They overestimate alpha.

@pitfalls
- "Mutual funds charge higher fees": false.
- "Diversifying across hedge funds always helps because fees are on the aggregate": false.
- "Hedge fund databases have smaller survivorship bias": false.
`,
};
