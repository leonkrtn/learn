import { ex, type ExplainMap } from '@/lib/explain';

export const L7: ExplainMap = {
  'L7.multiples': ex`
@task
A table of peers with their P/E and EV/EBITDA, and the target's EPS, EBITDA, cash, debt, shares and share price. You are asked for the average multiples, the share prices they imply, the range from the lowest and highest P/E, and how far the market price is from the P/E-based value.

@idea
Similar assets should trade at similar multiples. Apply the peers' multiple to the target's own scaling variable, and respect what the multiple values:

- **P/E** values equity directly: price = P/E × EPS.
- **EV/EBITDA** values the operating business: EV = multiple × EBITDA, then equity = EV − debt + cash, divided by shares.

Over- or undervaluation: $\frac{\text{Price} - \text{Value}}{\text{Value}}$.

@steps
1. Average P/E and average EV/EBITDA of the peers.
2. Price from P/E: average P/E × EPS; range from the lowest and highest P/E.
3. EV from EV/EBITDA; price = (EV − debt + cash) / shares.
4. Gap: (market price − value) / value.

@example
EPS \$1.65, EBITDA \$55.6m, excess cash \$100m, debt \$3m, 21m shares. Peer average P/E 15.01 (range 8.66–22.62) and EV/EBITDA 8.49.

@solution
1. Price from P/E: $15.01 \times 1.65 = 24.77$; range $8.66 \times 1.65 = 14.29$ to $22.62 \times 1.65 = 37.32$.
2. EV: $8.49 \times 55.6 = 472.04$.
3. Price from EV/EBITDA: $(472.04 - 3 + 100)/21 = 27.10$.

@answer
\$24.77 from P/E (range \$14.29–\$37.32) and \$27.10 from EV/EBITDA.

@pitfalls
- Dividing EV by shares without subtracting debt and adding cash.
- Applying an enterprise multiple to net income or an equity multiple to EBITDA.
- Using the mean when the peer distribution has large outliers; check the median too.
`,

  'L7.compare': ex`
@task
Market and accounting data for two firms: price, shares, debt, cash, EBIT, interest, tax expense, D&A, payout and ROE. You are asked for each firm's P/E and EV/EBITDA, which one is cheaper, and the growth their fundamentals imply.

@idea
Compute each multiple consistently:

$$P/E = \frac{\text{Price} \times \text{Shares}}{EBIT - \text{Interest} - \text{Tax}}, \qquad EV/EBITDA = \frac{\text{Price} \times \text{Shares} + \text{Debt} - \text{Cash}}{EBIT + D\&A}.$$

A lower multiple is not automatically a bargain: multiples rise with growth and fall with risk. Fundamental growth $g = ROE \times (1 - \text{payout})$ and leverage help explain the gap.

@steps
1. Market capitalisation and net income; P/E.
2. Enterprise value and EBITDA; EV/EBITDA.
3. Compare; then check growth ($ROE \times$ retention) and leverage before recommending.

@example
AAA: price 65, 10 shares, debt 80, cash 20, EBIT 60, interest 5, tax 15, D&A 8, payout 60%, ROE 12%. BBB: price 100, 40 shares, debt 800, cash 650, EBIT 375, interest 70, tax 75, D&A 40, payout 45%, ROE 14%.

@solution
1. AAA P/E $650/40 = 16.25$; BBB $4{,}000/230 = 17.39$.
2. AAA EV/EBITDA $(650 + 80 - 20)/68 = 10.44$; BBB $(4{,}000 + 800 - 650)/415 = 10.00$.
3. Growth: AAA $12\% \times 0.4 = 4.8\%$; BBB $14\% \times 0.55 = 7.7\%$.

@answer
BBB is cheaper on EV/EBITDA and grows faster, so it looks relatively undervalued, although it is more levered.

@pitfalls
- Using operating income instead of net income in the P/E.
- Forgetting to subtract cash from enterprise value.
- Recommending on one multiple without checking growth, risk and leverage.
`,

  'L7.fundPE': ex`
@task
A stable firm's ROE, payout ratio, cost of equity and current EPS. You are asked for the growth rate, the justified trailing and forward P/E, the PEG ratio, the justified price-to-book ratio and the value per share.

@idea
From the Gordon model, $P_0 = \frac{EPS_0 \times \text{payout} \times (1+g)}{r - g}$. Dividing by earnings or book value gives the multiples a firm's fundamentals justify:

$$\frac{P}{E} = \text{payout}\frac{1+g}{r-g}, \qquad \text{forward } \frac{P}{E_1} = \frac{\text{payout}}{r-g}, \qquad \frac{P}{BV} = ROE \times \text{payout}\frac{1+g}{r-g}.$$

Growth comes from retention: $g = ROE(1 - \text{payout})$. $PEG = (P/E)/(g \times 100)$.

@steps
1. $g = ROE \times (1 - \text{payout})$.
2. Trailing P/E and forward P/E.
3. PEG: trailing P/E divided by growth in percent.
4. P/B: ROE × trailing P/E.
5. Value: trailing P/E × current EPS.

@example
ROE 12%, payout 60%, cost of equity 10%, current EPS €3.

@solution
1. $g = 12\% \times 0.4 = 4.8\%$.
2. Trailing P/E $= 0.6 \times 1.048/0.052 = 12.09$; forward $0.6/0.052 = 11.54$.
3. PEG $= 12.09/4.8 = 2.52$.
4. P/B $= 0.12 \times 12.09 = 1.45$.
5. Value $= 12.09 \times 3 = 36.28$ (€).

@answer
P/E 12.09 (forward 11.54), PEG 2.52, P/B 1.45, value €36.28.

@pitfalls
- Forgetting the $(1 + g)$ in the trailing P/E.
- Using the payout instead of the retention ratio for growth.
- Dividing the P/E by growth as a decimal (0.048) instead of in percent.
`,

  'L7.exit': ex`
@task
A young or loss-making firm valued through a future exit: revenues grow to year $n$, a margin or a sales multiple gives the value then, which is discounted to today. Variants: an EV/EBITDA exit with cash and debt, or a sale multiple of revenues with a probability of failure.

@idea
When current earnings are negative, apply a multiple of healthy peers at a future date when the firm should look like them, and bring that value back to today:

$$EV_0 = \frac{\text{Multiple} \times \text{Metric}_n}{(1 + r)^n}, \qquad E_0 = EV_0 + \text{Cash} - \text{Debt}.$$

If the firm may fail before the exit and be worth nothing, multiply by the probability of survival.

@steps
1. Revenue in year $n$: $R_0(1 + g)^n$.
2. Metric in year $n$ (EBITDA = revenue × margin, or revenue itself).
3. Exit value: multiple × metric.
4. Discount $n$ years at the cost of capital.
5. Add cash, subtract debt, divide by shares; or multiply by $(1 - p_{fail})$.

@example
(a) Revenues \$1,000m growing 6% for 5 years, EBITDA margin 8% in year 5, industry EV/EBITDA 6, cost of capital 12%, cash \$50m, debt \$200m, 12m shares. (b) Revenues of \$600m in year 3, sale at 3× revenues, cost of capital 15%, 20% chance of failure.

@solution
1. (a) Revenue $1{,}000 \times 1.06^5 = 1{,}338.23$; EBITDA $107.06$; exit EV $642.35$.
2. (a) Today $642.35/1.12^5 = 364.49$; equity $364.49 + 50 - 200 = 214.49$; per share 17.87.
3. (b) Sale $3 \times 600 = 1{,}800$; today $1{,}800/1.15^3 = 1{,}183.53$; with failure $\times 0.8 = 946.82$.

@answer
(a) \$17.87 per share. (b) \$946.82m.

@pitfalls
- Forgetting to discount the exit value.
- Applying the multiple to today's (negative) EBITDA.
- Subtracting the failure probability from the discount rate instead of weighting the value.
`,

  'L7.regression': ex`
@task
A sector regression of EV/EBITDA on growth, cost of capital and tax rate, and a firm's data. You are asked for its actual multiple, the predicted multiple, the implied value and whether it looks over- or undervalued; or, assuming fair pricing, for the input the regression implies (e.g. the tax rate).

@idea
A regression controls for differences in fundamentals across the whole sector instead of a few hand-picked peers:

$$\frac{EV}{EBITDA} = a + b_g \cdot g - b_r \cdot r - b_t \cdot t.$$

Plug the firm's fundamentals in to get the multiple it deserves; compare it with the actual multiple. If the firm is fairly priced, set the two equal and solve for an unknown.

@steps
1. Actual multiple: EV / EBITDA.
2. Predicted multiple from the regression.
3. Implied EV: predicted multiple × EBITDA; gap = actual/predicted − 1.
4. Or: set actual = predicted and solve for the missing input.

@example
$EV/EBITDA = 5 + 80g - 20r - 12t$. A firm has EBITDA \$100m, EV \$480m, revenue growth 6%, cost of capital 10%. It is fairly priced. What is its tax rate?

@solution
1. Actual multiple $480/100 = 4.8$.
2. $4.8 = 5 + 80 \times 0.06 - 20 \times 0.10 - 12t = 7.8 - 12t$.
3. $t = (7.8 - 4.8)/12 = 25\%$.

@answer
An effective tax rate of 25%.

@pitfalls
- Entering rates in percent (6 instead of 0.06) in the regression.
- Forgetting the signs of the cost of capital and tax terms.
- Reading a multiple below the prediction as overvaluation.
`,

  'L7.concept': ex`
@task
Concept questions on relative valuation: true or false, the odd statement out of four, or the answer that fits best. They cover consistent multiples, the fundamentals behind multiples, peer selection and the limits of the approach.

@idea
- A multiple is consistent if numerator and denominator belong to the same claim: equity value / equity measure (P/E, P/BV, P/FCFE) or enterprise value / firm measure (EV/EBITDA, EV/EBIT, EV/FCFF, EV/Sales). Price/EBITDA is not.
- P/E rises with growth and payout and falls with risk; P/BV also rises with ROE: high ROE + high risk → low P/E, high P/B.
- PEG = P/E / growth, still dependent on risk and payout.
- Peer distributions are skewed: look at the median and outliers; negative earnings make P/E meaningless (forward P/E of 5,000 = earnings near zero).
- Multiples carry market sentiment; intrinsic and relative values can differ in either direction. Use several methods.

@steps
1. Identify the multiple or claim in the statement.
2. Check consistency (equity vs firm) and the fundamental drivers (growth, risk, payout, ROE).
3. Watch absolute words: "always", "never", "highest value".

@example
Which of these is not a valid multiple: Price to Equity Book Value, Price to EBITDA, Price to FCFE, EV to EBIT, EV to FCFF?

@solution
1. Check each pair: P/BV (equity/equity), P/FCFE (equity/equity), EV/EBIT and EV/FCFF (firm/firm).
2. Price to EBITDA puts equity value over a pre-interest, firm-level measure.

@answer
Price to EBITDA is not a valid (consistent) multiple.

@pitfalls
- Treating a low multiple as proof of undervaluation.
- Averaging P/Es that include firms with near-zero or negative earnings.
- Picking the multiple that gives the highest (or lowest) value.
`,
};
