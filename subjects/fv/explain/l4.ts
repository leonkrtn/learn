import { ex, type ExplainMap } from '@/lib/explain';

export const L4: ExplainMap = {
  'L4.implied': ex`
@task
An equity index level, last year's dividends (or dividends and buybacks) as a yield or an amount, their expected growth and the risk-free rate. You are asked for next year's dividend, the expected return implied by the index, the implied equity risk premium, and sometimes a cost of equity from CAPM.

@idea
Instead of averaging past premiums, back out the premium the market is pricing today. Treat the index like a stock and solve its valuation for the discount rate:

$$P_0 = \frac{D_1}{r - g} \;\Rightarrow\; r = \frac{D_1}{P_0} + g, \qquad ERP = r - r_f.$$

With a high-growth phase first (five years at $g_H$, then $g_L$ forever) there is no closed form; find $r$ by trial and error so that the PV of the cash flows equals the index.

@steps
1. Last year's cash flow: index × yield (or the amount given).
2. Next year's: $D_1 = D_0(1 + g)$.
3. Expected return: $r = D_1 / P_0 + g$ (or solve the two-stage equation for $r$).
4. Implied premium: $r - r_f$.
5. Cost of equity of a stock: $r_f + \beta \times ERP$.

@example
The index stands at 1,400; last year's dividends were 5% of the index (70 points). Dividends grow 3% forever; the risk-free rate is 1.9%.

@solution
1. $D_1 = 70 \times 1.03 = 72.10$.
2. $r = 72.10 / 1{,}400 + 3\% = 5.15\% + 3\% = 8.15\%$.
3. $ERP = 8.15\% - 1.90\% = 6.25\%$.

@answer
Implied equity risk premium of 6.25%.

@pitfalls
- Using $D_0$ instead of $D_1$ in the yield.
- Forgetting to add $g$ (the yield alone is not the expected return).
- Reporting the expected return instead of the premium: subtract $r_f$.
- In the two-stage version, letting the terminal value start after year 6 instead of year 5.
`,

  'L4.beta': ex`
@task
Betas of comparable firms and their leverage, the leverage of the firm you value and a rule for relevering. You are asked for the unlevered beta, the levered beta and the cost of equity. Variants: a private firm whose owner is not diversified (total beta), and comparables whose debt is risky (debt beta).

@idea
Leverage concentrates business risk on the equity. Strip the comparables' leverage out (unlever), then put the target's leverage back (relever). The question tells you which relation to use:

- Debt rebalanced to a constant D/E (no taxes in the relation): $\beta_L = \beta_U(1 + D/E)$.
- Fixed amount of debt with taxes: $\beta_L = \beta_U[1 + (1 - t)D/E]$.
- Risky debt: $\beta_L = \beta_U[1 + (1-t)D/E] - \beta_D(1-t)D/E$.

A private owner holding only this firm bears all its risk, not just market risk. The **total beta** divides the market beta by the correlation with the market: $\beta_{total} = \beta_U / \rho$, then relever. For a private firm, use the market value of equity (book equity × the peers' market-to-book).

@steps
1. Unlever the comparables with their own D/E.
2. For a private, undiversified owner: divide by the correlation $\rho$.
3. Relever with the target's D/E (market values).
4. Cost of equity: $r_f + \beta_L \times MRP$.

@example
(a) Peers: equity beta 1.20 at D/E 0.50; the firm keeps D/E 0.25 constant; $r_f$ = 2%, MRP 7%. (b) A private firm: debt \$3m, book equity \$6m, peers' unlevered beta 1.10, market-to-book 3x, correlation 0.6, no taxes.

@solution
1. (a) $\beta_U = 1.20 / 1.50 = 0.80$; $\beta_L = 0.80 \times 1.25 = 1.00$; $k_e = 2\% + 1.00 \times 7\% = 9\%$.
2. (b) Market equity $6 \times 3 = 18$, $D/E = 3/18 = 0.1667$.
3. (b) Total unlevered beta $1.10 / 0.6 = 1.8333$; levered $1.8333 \times 1.1667 = 2.14$.

@answer
(a) Levered beta 1.00, cost of equity 9%. (b) Total beta 2.14.

@pitfalls
- Relevering with the comparables' D/E or unlevering with the target's.
- Using book equity for a private firm instead of book × market-to-book.
- Multiplying instead of dividing by the correlation.
- Applying the tax version when the question says D/E is held constant (or the other way round).
`,

  'L4.bottomUp': ex`
@task
A firm with several businesses (revenues or values and unlevered betas per business), or a merger of two firms. You are asked for the firm's unlevered beta, its levered beta and its cost of equity; for a merger, the beta after an all-equity deal and after a debt-financed deal.

@idea
A **bottom-up beta** averages the unlevered betas of the businesses the firm is in, weighted by value (or revenue when values are unknown), and relevers at the firm's own D/E. It is more precise than one regression because averaging across many firms reduces the standard error.

In a merger of two unlevered firms the asset beta is the value-weighted average. If the buyer borrows to pay, the assets keep that beta but the equity carries the debt: $\beta_E = \beta_U(1 + D/E)$ (debt beta zero, no taxes).

@steps
1. Weights: each business's revenue (or value) over the total.
2. Unlevered beta: $\sum w_i \beta_{U,i}$.
3. Relever with the firm's D/E and the stated rule.
4. Cost of equity: $r_f + \beta_L \times MRP$.
5. Merger: value-weight the two betas; with debt financing, $D/E$ = debt raised / buyer's equity.

@example
Four business groups (revenue in \$ billion, unlevered beta): Retail 2 (1.25), Software 2 (1.50), Entertainment 1 (2.00), Food 3 (1.00). D/E 0.25, use $\beta_L = \beta_U(1 + D/E)$.

@solution
1. Weights: 2/8, 2/8, 1/8, 3/8.
2. $\beta_U = 0.25 \times 1.25 + 0.25 \times 1.50 + 0.125 \times 2.00 + 0.375 \times 1.00 = 1.3125$.
3. $\beta_L = 1.3125 \times 1.25 = 1.64$.

@answer
Levered beta of 1.64.

@pitfalls
- Averaging the betas without weights.
- Averaging levered betas, or forgetting to relever at the end.
- In a debt-financed merger, using the combined value as the denominator of D/E instead of the buyer's equity.
`,

  'L4.debt': ex`
@task
An unrated firm: face value of debt, annual interest, maturity, EBIT, the risk-free rate, the tax rate and a table mapping interest coverage to ratings and default spreads. You are asked for the coverage ratio, the synthetic rating, the pre-tax and after-tax cost of debt and the market value of the debt.

@idea
Without traded bonds or a rating, estimate a **synthetic rating** from the interest coverage ratio $EBIT / \text{Interest}$. The rating's default spread over the risk-free rate gives the pre-tax cost of debt. The book debt is then valued like a bond: the interest is a coupon annuity, the face value is repaid at maturity, both discounted at the cost of debt.

$$MV_D = I \times \frac{1 - (1 + k_d)^{-n}}{k_d} + \frac{F}{(1 + k_d)^n}.$$

@steps
1. Coverage: $EBIT / I$.
2. Find the row of the table; read rating and spread.
3. $k_d = r_f + \text{spread}$; after tax $k_d(1 - t)$.
4. Market value of debt with the bond formula above.

@example
Face value \$10,000m, interest \$600m a year, maturity 6 years, EBIT \$2,500m, $r_f$ = 6%, tax 35%. In the table, coverage of 3.5–4.5 is BBB with a spread of 1.60%.

@solution
1. Coverage $2{,}500 / 600 = 4.17$ → BBB, spread 1.60%.
2. $k_d = 6\% + 1.6\% = 7.6\%$; after tax $7.6\% \times 0.65 = 4.94\%$.
3. Coupons: $600 \times (1 - 1.076^{-6})/0.076 = 2{,}807.71$.
4. Face: $10{,}000 / 1.076^6 = 6{,}443.57$; market value $9{,}251.28$ (\$ million).

@answer
Rating BBB, pre-tax cost of debt 7.6% (4.94% after tax), market value of debt \$9,251.28m.

@pitfalls
- Dividing EBIT by total debt instead of the interest expense.
- Discounting at the coupon rate instead of the current cost of debt.
- Forgetting the face value at maturity.
- Using the after-tax cost of debt to value the debt; the market discounts at the pre-tax rate.
`,

  'L4.wacc': ex`
@task
Shares outstanding and price, the market value of debt, the cost of debt, the tax rate, an unlevered beta and the market data. You are asked for the market value of equity, the weights, the levered beta, the cost of equity and the WACC.

@idea
The WACC is the cost of the firm's capital as a whole, each source weighted by its market value:

$$WACC = \frac{E}{D+E}k_e + \frac{D}{D+E}k_d(1 - t).$$

The cost of equity uses a beta relevered at the market D/E, here with $\beta_L = \beta_U[1 + (1-t)D/E]$.

@steps
1. $E$ = shares × price.
2. $D/E$ and $D/(D + E)$ with market values.
3. $\beta_L = \beta_U[1 + (1 - t)D/E]$.
4. $k_e = r_f + \beta_L(E[R_m] - r_f)$.
5. WACC with after-tax $k_d$.

@example
100m shares at \$250, debt worth \$9,523.35m, $k_d$ = 7%, tax 35%, unlevered beta 0.80, $r_f$ = 6%, expected market return 11.5%.

@solution
1. $E = 25{,}000$; $D/E = 0.3809$; $D/(D+E) = 0.2759$.
2. $\beta_L = 0.80 \times (1 + 0.65 \times 0.3809) = 0.9981$.
3. $k_e = 6\% + 0.9981 \times 5.5\% = 11.49\%$.
4. $WACC = 0.7241 \times 11.49\% + 0.2759 \times 7\% \times 0.65 = 9.58\%$.

@answer
The WACC is 9.58%, with a cost of equity of 11.49%.

@pitfalls
- Using book values of debt or equity as weights.
- Using the market return instead of the premium $E[R_m] - r_f$ in CAPM.
- Forgetting the tax shield on debt, $(1 - t)$.
- Mixing $D/E$ (for the beta) and $D/V$ (for the weights).
`,

  'L4.concept': ex`
@task
Concept questions on discount rates: true or false, one false (or true) statement out of four, or the answer that fits best. They cover risk, the risk-free rate, equity premiums, betas, the cost of debt and the WACC.

@idea
- Only **systematic risk** is priced, because the marginal investor is diversified.
- Match the rate to the cash flow (equity → $k_e$, firm → WACC), the currency and nominal/real.
- **Risk-free rate:** a long-term default-free government bond in the cash flows' currency.
- **Premiums:** historical (depends on period, proxy and averaging) vs implied (forward-looking).
- **Betas:** a regression gives the *levered* beta; high operating leverage and cyclicality raise the unlevered beta; leverage raises the equity beta; bottom-up betas are more precise.
- **Cost of debt:** bond yields, ratings or synthetic ratings; after tax $k_d(1 - t)$. WACC with market weights.
- With taxes and no distress costs, more debt raises value through the tax shield, not through a lower beta.

@steps
1. Locate the input the statement is about (risk, $r_f$, premium, beta, $k_d$, weights).
2. Recall the rule above.
3. Check direction words (higher/lower, levered/unlevered, short/long term, book/market).
4. Pick the statement that breaks (or matches) the rule.

@example
True or false? "The higher the operating leverage, the lower the unlevered beta of a company."

@solution
1. Input: unlevered beta and operating leverage.
2. Rule: high fixed costs make operating income more sensitive to revenue, so business risk rises.
3. The statement reverses the direction.

@answer
False. Higher operating leverage means a higher unlevered beta.

@pitfalls
- Believing a regression yields the unlevered beta.
- Using a short-term bill yield for a long-term valuation.
- Thinking more debt lowers the equity beta.
- Using book-value weights in the WACC.
`,
};
