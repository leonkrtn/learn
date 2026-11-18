import { ex, type ExplainMap } from '@/lib/explain';

export const L6: ExplainMap = {
  'L6.options': ex`
@task
The value of equity (given, or from a free-cash-flow perpetuity), the number of shares, and management options with an exercise price and an option value. You are asked for the value per share ignoring the options, on a fully diluted basis, with the treasury stock approach and with the option-value approach.

@idea
Options are a claim on equity. Three ways to account for them, from crudest to best:

- **Fully diluted:** divide equity by shares + options. Overstates dilution: it ignores the cash paid on exercise.
- **Treasury stock:** add the exercise proceeds to equity and divide by shares + options. Ignores the options' time value.
- **Option value:** subtract the options' value (e.g. Black-Scholes) from equity, divide by the shares outstanding.

@steps
1. Equity value: firm value (e.g. $FCF_1/(r - g)$) − debt + cash.
2. Ignoring options: equity / shares.
3. Diluted: equity / (shares + options).
4. Treasury stock: (equity + options × strike) / (shares + options).
5. Option value: (equity − options × option value) / shares.

@example
FCF of \$150m next year growing 4% forever at a 9% cost of capital; debt \$1,200m; 120m shares; 15m options with a strike of \$16, each worth \$4.

@solution
1. Firm $150/0.05 = 3{,}000$; equity $1{,}800$; per share $1{,}800/120 = 15.00$.
2. Diluted: $1{,}800 / 135 = 13.33$.
3. Treasury stock: $(1{,}800 + 15 \times 16)/135 = 2{,}040/135 = 15.11$.
4. Option value: $(1{,}800 - 15 \times 4)/120 = 14.50$.

@answer
\$15.00 ignoring options, \$13.33 diluted, \$15.11 treasury stock, \$14.50 with the option value.

@pitfalls
- Dividing by shares + options in the option-value approach (the options are already paid for in equity).
- Forgetting the exercise proceeds in the treasury stock approach.
- Ignoring out-of-the-money options entirely: they still have time value.
`,

  'L6.holdings': ex`
@task
The value of a firm's operating assets from consolidated cash flows, its cash and debt, a minority holding in another firm and a majority-owned subsidiary. You are asked for the value of the holding, the minority interests, equity and the value per share.

@idea
Consolidation decides what the DCF already contains:

- A **minority holding** (passive or equity method) is not in the consolidated cash flows, so add its market value: share × market value, book value × sector P/B, or share of earnings × sector P/E.
- A **majority-owned subsidiary** is consolidated 100%, but part of it belongs to outsiders, so subtract the **minority interests** at market value: (1 − ownership) × market value of the subsidiary, or book minority interests × sector P/B.

$$E = V_{op} + \text{Cash} + \text{Minority holdings} - \text{Minority interests} - \text{Debt}.$$

@steps
1. Value the minority holding with the information given.
2. Value the minority interests in the subsidiary at market value.
3. Equity = operating assets + cash + holding − minority interests − debt.
4. Per share: equity / shares.

@example
Operating assets €5,000m, cash €400m, debt €1,500m, 200m shares. The firm owns 25% of A (market value €960m) and 90% of B (consolidated; market value €1,680m).

@solution
1. Holding in A: $0.25 \times 960 = 240$.
2. Minority interests in B: $0.10 \times 1{,}680 = 168$.
3. Equity: $5{,}000 + 400 + 240 - 168 - 1{,}500 = 3{,}972$.
4. Per share: $3{,}972 / 200 = 19.86$ (€).

@answer
Equity of €3,972m, €19.86 per share.

@pitfalls
- Adding the subsidiary's value although it is already in the consolidated cash flows.
- Subtracting minority interests at book value when a market value can be estimated.
- Adding 100% of the holding's value instead of the share owned.
`,

  'L6.cash': ex`
@task
Gross debt, its cost, cash earning the risk-free rate, and a firm's return on capital against its cost of capital. You are asked for net debt, the cost of net debt and how the market is likely to value the firm's cash.

@idea
If you net cash against debt, the remaining (net) debt carries all the interest while the cash only earned the risk-free rate, so its cost is higher than the cost of gross debt:

$$k_{net} = \frac{k_d \times D - r_f \times \text{Cash}}{D - \text{Cash}}.$$

Not adjusting the rate overstates value. How much a dollar of cash is worth depends on what management does with it: return on capital equal to the cost of capital → **neutral** (worth face value); below → **wasting asset**; above → **potential value creator**.

@steps
1. Net debt: $D - \text{Cash}$.
2. Cost of net debt with the formula.
3. Compare ROC with the cost of capital to classify the cash.

@example
Gross debt \$400m at 7%, cash \$200m earning the risk-free rate of 5%. The firm earns 5% on capital against a 10% cost of capital.

@solution
1. Net debt $400 - 200 = 200$.
2. $k_{net} = (0.07 \times 400 - 0.05 \times 200)/200 = (28 - 10)/200 = 9\%$.
3. ROC 5% < 10%: cash is likely a wasting asset.

@answer
Cost of net debt 9%; the cash is likely valued below face value.

@pitfalls
- Using the gross cost of debt with net debt.
- Discounting cash just because it earns a low return: only misuse by management justifies a discount.
- Swapping $k_d$ and $r_f$ in the formula.
`,

  'L6.commit': ex`
@task
A schedule of multi-year contractual commitments (licences, leases), a pre-tax cost of debt, the firm's conventional debt and its equity value. You are asked for the present value of the commitments, the adjusted debt and the debt ratio before and after.

@idea
Long-term commitments the firm cannot walk away from behave like debt. Discount them at the pre-tax cost of debt and add their present value to debt. The firm then looks more levered; its operating income and invested capital rise too, because the commitment payments are partly financing costs.

@steps
1. Discount each year's commitment at the pre-tax cost of debt (the amount after year 5 as one payment in year 6).
2. Adjusted debt: conventional debt + PV of commitments.
3. Debt ratios $D/(D + E)$ before and after.

@example
Commitments (\$ million): 3,968.04, 2,382.34, 2,382.34, 585.48, 585.48 in years 1–5 and 44.30 after year 5 (year 6); pre-tax cost of debt 6%; debt \$2,400m; equity \$30,000m.

@solution
1. PVs: 3,743.43 + 2,120.27 + 2,000.26 + 463.75 + 437.50 + 31.23 = 8,796.46.
2. Adjusted debt: $2{,}400 + 8{,}796.46 = 11{,}196.46$.
3. Debt ratio before $2{,}400/32{,}400 = 7.41\%$; after $11{,}196.46/41{,}196.46 = 27.18\%$.

@answer
PV of commitments \$8,796.46m; the debt ratio rises from 7.41% to 27.18%.

@pitfalls
- Discounting at the after-tax cost of debt or at the WACC.
- Adding the undiscounted sum of commitments.
- Forgetting that equity value does not change in the ratio, only debt.
`,

  'L6.case': ex`
@task
The valuation case of Part II of the exam: a forecast of free cash flows to the firm, a discount rate built from comparable betas, a terminal value, and the bridge to equity with cash, holdings, minority interests, options and debt. You are asked for intermediate results and the value per share. Formats: growth assumptions with working capital as a share of revenue; projected statements with inventory, receivables and payables; or a perpetuity valued with APV.

@idea
Follow one route and keep flows and rates consistent:

$$FCFF = EBIT(1-t) - \text{Net CapEx} - \Delta OWC \quad(\text{or } + \text{Dep} - \text{CapEx}),$$
$$V_{op} = \sum_{k=1}^{4}\frac{FCFF_k}{(1+WACC)^k} + \frac{TV_4}{(1+WACC)^4}, \qquad TV_4 = \frac{FCFF_5}{WACC - g}.$$

$FCFF_5$ comes from the stated rule: all items grow at $g$, or $EBIT_4(1+g)(1-t)(1-RR)$ with a reinvestment ratio, or the last forecast year's growth. Then
$E = V_{op} + \text{Cash} + \text{Holdings} - \text{Minority interests} - \text{Options} - \text{Debt}$.

@steps
1. Working capital: OWC = (inventory + receivables − payables), as % of revenue or from the accounts; ΔOWC year by year.
2. FCFF for years 1–4.
3. Beta: unlever the comparables (or the regression beta at the old D/E), relever at the target D/E with the stated rule; $k_e = r_f + \beta_L \times MRP$ (with $r_f$ net of a CDS spread if given).
4. WACC with target weights $E/V = 1/(1 + D/E)$ and after-tax $k_d$.
5. Terminal value at the end of year 4, discounted four years.
6. Bridge to equity and divide by shares.

@example
Revenue 3,000, EBIT 250, net CapEx 70 (all grow 5% for 4 years); inventory 2%, receivables 7%, payables 6% of revenue; after year 4 EBIT grows 2.5% with a reinvestment ratio of 15%. Peers: equity beta 1.65 at D/E 0.50; target D/E 0.35; $k_d$ = 2.5%; $\beta_L = \beta_U(1 + D/E)$; tax 20%, $r_f$ 2.5%, MRP 8%. Cash 100, holding: earnings 10 × P/E 9, minority interests 40, options 2m × 6.5, debt 565, 100m shares (\$ million).

@solution
1. OWC is 3% of revenue: ΔOWC = 4.50, 4.72, 4.96, 5.21.
2. FCFF: 132.00, 138.60, 145.53, 152.81.
3. $\beta_U = 1.65/1.5 = 1.10$; $\beta_L = 1.10 \times 1.35 = 1.485$; $k_e = 2.5\% + 1.485 \times 8\% = 14.38\%$.
4. $WACC = 0.7407 \times 14.38\% + 0.2593 \times 2.5\% \times 0.8 = 11.17\%$.
5. PV of years 1–4 = 436.85; $FCFF_5 = 303.88 \times 1.025 \times 0.8 \times 0.85 = 211.80$; $TV_4 = 211.80/(11.17\% - 2.5\%) = 2{,}442.82$; PV 1,599.32; $V_{op} = 2{,}036.17$.
6. Equity $= 2{,}036.17 + 100 + 90 - 40 - 13 - 565 = 1{,}608.17$; per share 16.08.

@answer
Enterprise value \$2,036.17m, equity \$1,608.17m, \$16.08 per share.

@pitfalls
- Using the level of working capital instead of its change.
- Relevering at the peers' D/E, or applying the tax formula when the question prescribes the other one.
- Discounting the terminal value five years instead of four.
- Forgetting to subtract minority interests and options, or adding the holding at book value.
`,

  'L6.concept': ex`
@task
Concept questions on nonoperating assets, claims and recommendations: true or false, the odd statement out of four, or the answer that fits best.

@idea
- **Cash:** operating vs excess cash; value operating assets without cash and add it back; netting cash raises the cost of debt; cash is neutral, wasting or value-creating depending on ROC vs cost of capital.
- **Holdings:** add minority holdings at market value (P/B, P/E or market price); subtract minority interests in consolidated subsidiaries at market value.
- **Other assets:** add unutilised assets; don't double-count operating assets or intangibles already in the cash flows; goodwill is a plug.
- **Options:** diluted (overstates), treasury stock (ignores time value), option value (best); future grants are an operating expense.
- **What-if:** sensitivity (one input), scenarios (consistent cases), simulation (distributions). Recommendations from Strong Buy to Strong Sell.

@steps
1. Classify the item: cash, holding, subsidiary, option, other asset, or analysis method.
2. Ask whether the DCF of consolidated cash flows already contains it.
3. Add what is missing, subtract claims of others, and check the stated method's known weakness.

@example
True or false? "The treasury stock approach captures the time value of options."

@solution
1. Item: management options.
2. The treasury stock approach assumes immediate exercise at the strike.
3. It therefore ignores the time value; only option pricing captures it.

@answer
False: the treasury stock approach ignores the time value of options.

@pitfalls
- Adding consolidated subsidiaries again.
- Adding minority interests instead of subtracting them.
- Treating goodwill as a separate asset.
- Confusing sensitivity analysis with scenario analysis.
`,
};
