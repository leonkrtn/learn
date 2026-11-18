import { ex, type ExplainMap } from '@/lib/explain';

/** Adjusted present value (lecture 2) and the problem-set types with their own task. */
export const APV: ExplainMap = {
  'L2.apv': ex`
@task
A firm's expected EBIT, reinvestment, growth and unlevered beta, plus a debt policy: a constant amount of debt forever, or a loan repaid after $n$ years. You are asked for the unlevered cost of capital, the unlevered value, the tax shields, the levered value (APV) and the value per share.

@idea
APV values the firm as if it had no debt, then adds the value of financing separately:

$$V_L = V_U + PV(\text{interest tax shields}), \qquad V_U = \frac{FCFF_1}{\rho - g}, \quad \rho = r_f + \beta_U \times MRP.$$

The annual tax shield is $t \times k_d \times D$. Discounted at $k_d$, a permanent constant debt gives $PV = t \times D$; a loan for $n$ years gives an annuity. APV is easiest when the **amount** of debt is known; with a constant D/E ratio the WACC is easier.

@steps
1. $\rho = r_f + \beta_U \times MRP$.
2. $FCFF_1 = EBIT_1(1 - t)(1 - RR)$; $V_U = FCFF_1/(\rho - g)$.
3. Tax shield per year: $t \times k_d \times D$.
4. PV of tax shields: $t \times D$ (permanent) or the annuity over $n$ years at $k_d$.
5. $V_L = V_U + PV(TS)$; equity = $V_L$ + cash − debt; per share.

@example
EBIT next year \$400m, reinvestment 30%, growth 2%, $\beta_U$ = 1.0, $r_f$ = 3%, MRP 6%, tax 25%. Constant debt of \$500m at 4% forever; cash \$50m; 100m shares.

@solution
1. $\rho = 3\% + 6\% = 9\%$.
2. $FCFF_1 = 400 \times 0.75 \times 0.7 = 210$; $V_U = 210/(9\% - 2\%) = 3{,}000$.
3. Tax shield per year $0.25 \times 0.04 \times 500 = 5$.
4. $PV(TS) = 0.25 \times 500 = 125$.
5. $V_L = 3{,}125$; equity $3{,}125 + 50 - 500 = 2{,}675$; per share 26.75.

@answer
APV \$3,125m, \$26.75 per share.

@pitfalls
- Discounting the unlevered cash flows at the WACC.
- Adding $t \times D$ for a loan that is repaid after a few years.
- Forgetting to subtract the debt when moving from firm value to equity.
`,

  'X4.q1': ex`
@task
A firm without a rating: shares and price, book debt with interest and maturity, operating income, a coverage band with its rating and spread, the tax rate, the Treasury rate, peers' unlevered beta and the expected market return. You are asked for the market value of debt and the cost of capital.

@idea
Two lecture-4 tools in sequence. First the cost of debt from a synthetic rating ($r_f$ + spread for the coverage band), which also values the book debt as a bond. Then the WACC with market weights and a beta relevered with taxes, $\beta_L = \beta_U[1 + (1-t)D/E]$.

@steps
1. Coverage $EBIT/I$ → rating and spread; $k_d = r_f + \text{spread}$.
2. Market value of debt: $I \times \frac{1 - (1+k_d)^{-n}}{k_d} + \frac{F}{(1+k_d)^n}$.
3. $E$ = shares × price; $D/E$; $\beta_L$; $k_e = r_f + \beta_L(E[R_m] - r_f)$.
4. $WACC = \frac{E}{V}k_e + \frac{D}{V}k_d(1-t)$.

@example
100m shares at \$250; book debt \$10,000m, maturity 6 years, interest \$600m; operating income \$2,500m (coverage 3.5–4.5 is BBB, spread 1%); tax 35%; $r_f$ 6%; unlevered beta 0.80; market return 11.5%.

@solution
1. Coverage $4.17$ → BBB; $k_d = 7\%$.
2. $D = 600 \times (1 - 1.07^{-6})/0.07 + 10{,}000/1.07^6 = 9{,}523.35$.
3. $D/E = 0.3809$; $\beta_L = 0.80 \times (1 + 0.65 \times 0.3809) = 0.9981$; $k_e = 11.49\%$.
4. $WACC = 0.7241 \times 11.49\% + 0.2759 \times 7\% \times 0.65 = 9.58\%$.

@answer
Market value of debt \$9,523.35m; cost of capital 9.58%.

@pitfalls
- Using the book value of debt in the weights.
- Discounting the debt at the coupon rate (6%) instead of $k_d$.
- Using the market return instead of the premium in CAPM.
`,

  'X4.q3': ex`
@task
A newly listed firm: expected FCFE and its growth, peers' D/E, equity beta and debt beta, the firm's own D/E (risk-free debt), tax rate, risk-free rate and market return. You are asked for the unlevered beta, the firm's beta, its cost of equity, its WACC and its share price.

@idea
When the peers' debt is risky, part of their risk sits with the lenders, so unlever with the debt beta:

$$\beta_L = \beta_U\left[1 + (1-t)\tfrac{D}{E}\right] - \beta_D(1-t)\tfrac{D}{E}.$$

Relever for the firm's risk-free debt ($\beta_D = 0$). The share price uses FCFE, so discount at the cost of equity, not the WACC.

@steps
1. Solve the formula for $\beta_U$ with the peers' data.
2. Relever: $\beta_U[1 + (1-t)D/E]$.
3. $k_e = r_f + \beta_L(E[R_m] - r_f)$.
4. WACC with $k_d = r_f$ (risk-free debt) after tax.
5. Price $= \frac{FCFE_1}{k_e - g} / \text{shares}$.

@example
Peers: D/E 1.2, equity beta 1.55, debt beta 0.56. Firm: D/E 0.40, risk-free debt, FCFE £30m next year growing 5%, 10m shares. Tax 35%, $r_f$ 3%, market return 12%.

@solution
1. $1.55 = 1.78\beta_U - 0.4368$, so $\beta_U = 1.1162$.
2. $\beta_L = 1.1162 \times 1.26 = 1.4064$.
3. $k_e = 3\% + 1.4064 \times 9\% = 15.66\%$.
4. $WACC = (1/1.4) \times 15.66\% + (0.4/1.4) \times 3\% \times 0.65 = 11.74\%$.
5. Price $= 30/(15.66\% - 5\%)/10 = 28.15$ (£).

@answer
WACC 11.74%, share price £28.15.

@pitfalls
- Ignoring the debt beta when unlevering.
- Discounting FCFE at the WACC.
- Forgetting to divide by the number of shares.
`,

  'X8.q1': ex`
@task
A private company sold to an undiversified buyer: EBIT and revenues, an owner salary never charged, working capital, CapEx and depreciation, five years of high growth then stable growth, comparable betas, their D/E and correlation with the market, the target debt ratio and cost of debt. You are asked for the first FCFF, the total betas, the cost of capital, the firm value and the equity value.

@idea
Private firms need three adjustments:

- **Normalise earnings:** deduct a market salary for the owners.
- **Total beta:** the buyer holds no diversified portfolio, so divide the market beta by the correlation: $\beta_{total} = \frac{\beta_U}{\rho}$, then relever.
- **High growth as a growing annuity:** $PV = FCFF_1\frac{1 - \left(\frac{1+g}{1+WACC}\right)^5}{WACC - g}$, plus a terminal value at year 5.

@steps
1. $FCFF_1 = (EBIT - \text{salary})(1+g)(1-t) - (\text{CapEx} - \text{Dep})(1+g) - OWC\% \times \text{Revenue} \times g$.
2. $\beta_U = \frac{\beta}{1 + D/E_{peers}}$; total $= \beta_U/\rho$; relever with $D/E = \frac{D/V}{1 - D/V}$.
3. $k_e$, then WACC with the target $D/V$.
4. PV of the five high-growth years (growing annuity) and of the terminal value $\frac{FCFF_1(1+g)^4(1+g_s)}{WACC - g_s}$ discounted five years.
5. Equity = firm value × (1 − D/V).

@example
EBIT \$10.5m, revenue \$50m, unpaid salary \$1m, tax 36%, OWC 10% of revenue, CapEx \$4.5m, depreciation \$1m; growth 30% for 5 years then 6%. Peers: beta 1.3567, D/E 13.65%, correlation 0.5. Target D/V 12%, $k_d$ 8.75%, $r_f$ 6%, MRP 5.5%.

@solution
1. $FCFF_1 = 9.5 \times 1.3 \times 0.64 - 3.5 \times 1.3 - 0.1 \times 50 \times 0.3 = 1.854$.
2. $\beta_U = 1.3567/1.1365 = 1.1938$; total $2.3875$; $D/E = 0.1364$; levered $2.7131$.
3. $k_e = 6\% + 2.7131 \times 5.5\% = 20.92\%$; $WACC = 0.88 \times 20.92\% + 0.12 \times 8.75\% \times 0.64 = 19.08\%$.
4. High growth 9.35; terminal value (FCFF₆ = 5.61) discounted 17.92; firm value 27.26.
5. Equity $27.26 \times 0.88 = 23.99$ (\$ million).

@answer
Firm value \$27.26m, equity \$23.99m.

@pitfalls
- Forgetting the owners' salary.
- Using the market beta for an undiversified buyer.
- Discounting the terminal value four instead of five years.
`,

  'X8.q2': ex`
@task
The same private company, now valued for an IPO. You are asked for the beta, the cost of capital and the firm value an IPO investor would use, and why the value changes.

@idea
IPO investors hold diversified portfolios, so only market risk matters: use the market beta (unlevered, relevered) without dividing by the correlation. The discount rate falls and the value rises compared with a sale to an undiversified private buyer.

@steps
1. $\beta_U = \beta_{peers}/(1 + D/E_{peers})$; relever at the target D/E (no correlation adjustment).
2. $k_e$ and the WACC with the same weights and cost of debt.
3. Same FCFF; value the high-growth years and the terminal value at the new WACC.

@example
Same data as the private valuation: peers' beta 1.3567 at D/E 13.65%, target D/V 12%, $k_d$ 8.75%, tax 36%, $r_f$ 6%, MRP 5.5%, $FCFF_1$ = 1.854, growth 30% for 5 years then 6%.

@solution
1. $\beta_U = 1.1938$; $\beta_L = 1.1938 \times 1.1364 = 1.3565$.
2. $k_e = 6\% + 1.3565 \times 5.5\% = 13.46\%$; $WACC = 0.88 \times 13.46\% + 0.12 \times 8.75\% \times 0.64 = 12.52\%$.
3. High growth 11.23 + terminal value 47.75 = firm value 58.98 (\$ million).

@answer
Firm value \$58.98m instead of \$27.26m: the IPO value is higher because diversified investors do not price firm-specific risk.

@pitfalls
- Keeping the total beta for public investors.
- Changing the cash flows: only the discount rate changes.
`,

  'E21.q3': ex`
@task
Exam Part I: three statements A–C plus "All of the above" and "None of the above". You choose the one correct option.

@idea
Judge each statement on its own against the lecture facts, then map the pattern to the answer: exactly one true → that letter; all three true → D; none true → E. Typical traps:

- A regression gives the **levered** beta, not the unlevered one.
- Higher operating leverage and cyclicality mean **higher** betas.
- DDM and DCF/FCFE values coincide only under special payout assumptions; they are not equivalent in general.
- APV is easier when the **amount** of debt is fixed; WACC when D/E is constant.
- With ROE above $k_e$, paying out more (retaining less) lowers the price.
- Use a **long-term** government bond for the risk-free rate.

@steps
1. Mark A, B and C true or false.
2. Count the true ones.
3. One → its letter; three → D; zero → E.

@example
A. Increasing debt will always result in increased firm value. B. The APV is easier to apply than the WACC when the company keeps a constant D/E ratio. C. When ROE is higher than the cost of equity, increasing the payout ratio will result in a drop in share price.

@solution
1. A is false: distress costs and other effects can outweigh the tax shield.
2. B is false: with a constant D/E the WACC is easier; APV suits a known amount of debt.
3. C is true: reinvesting at ROE > $k_e$ creates value, so paying it out instead lowers the price.

@answer
C: only statement C is true, so the answer is its letter.

@pitfalls
- Choosing D when only some statements are true.
- Reading "regression beta" as unlevered.
- Reversing the direction of operating leverage.
`,

  'E21.IIa': ex`
@task
Exam 2021, Part II (a): a construction firm keeps a fixed amount of debt for four years and then moves to a target D/E ratio. You are asked for working capital, FCFF, the PV of FCFF at the unlevered rate, the PV of tax shields, the WACC from year 5, the PV of the terminal value, the value of the firm and of equity.

@idea
Two debt policies call for two methods. While the **amount** of debt is fixed (years 1–4), use APV: FCFF at the unlevered cost of capital $\rho$, tax shields $t \times k_d \times D$ at $k_d$. From year 5 the **ratio** is fixed, so the terminal value uses the WACC of the target structure. Holdings and minority interests are valued with the industry P/B.

@steps
1. OWC last year = revenue × (inventory + receivables − payables) %; $\Delta OWC_1 = g \times OWC_0$, then it grows with $g$.
2. $FCFF_t = EBIT_t(1-t) - \text{Net CapEx}_t - \Delta OWC_t$.
3. $\rho = r_f + \beta_U \times MRP$; discount years 1–4 at $\rho$.
4. Tax shields at $k_d = r_f + \text{spread}$ for four years.
5. Target structure: $\beta_L = \beta_U(1 + D/E)$, $k_e$, WACC; $TV_4 = FCFF_5/(WACC - g)$ discounted with the WACC.
6. Firm = PVs + cash + holding × P/B − minority interests × P/B; equity = firm − debt.

@example
Revenue €15,000m, EBIT €1,520m, net CapEx €260m; inventory 8.5%, receivables 19.5%, payables 20%; growth 7% for 4 years, then 2%. Debt €3,000m fixed for 4 years, then D/E 33%; spread 1.5%; all-equity beta 1.10; $r_f$ 2%, MRP 10%, tax 25%. Cash €1,500m; holding book value €100m, minority interests €70m, P/B 2.4.

@solution
1. OWC₀ = 1,200; ΔOWC₁ = 84.
2. FCFF: 857.60, 917.63, 981.87, 1,050.60.
3. $\rho = 13\%$; PV = 2,802.41.
4. $k_d = 3.5\%$; shield $3{,}000 \times 3.5\% \times 0.25 = 26.25$ a year; PV 96.42.
5. $\beta_L = 1.463$, $k_e = 16.63\%$, WACC 13.16%; $FCFF_5 = 1{,}071.61$; PV of TV 5,859.60.
6. Firm $= 2{,}802.41 + 96.42 + 5{,}859.60 + 1{,}500 + 240 - 168 = 10{,}330.43$; equity 7,330.43.

@answer
Firm value €10,330.43m, equity €7,330.43m.

@pitfalls
- Discounting years 1–4 at the WACC although debt is fixed in amount.
- Using the OWC level instead of its change.
- Adding the minority interests instead of subtracting them.
`,

  'E21.IIb': ex`
@task
Exam 2021, Part II (b): value the equity with the industry's forward P/E. You are asked for next year's EBIT, next year's earnings and the equity value.

@idea
A forward P/E multiplies **next year's net income**. Net income = (EBIT − interest)(1 − t), with interest = cost of debt × debt.

@steps
1. $EBIT_1 = EBIT_0(1 + g)$.
2. Interest $= k_d \times D$.
3. $NI_1 = (EBIT_1 - \text{Interest})(1 - t)$.
4. Equity $= P/E \times NI_1$.

@example
EBIT €1,520m growing 7%; debt €3,000m at 3.5%; tax 25%; forward P/E 9.

@solution
1. $EBIT_1 = 1{,}626.40$.
2. Interest $= 105$.
3. $NI_1 = (1{,}626.40 - 105) \times 0.75 = 1{,}141.05$.
4. Equity $= 9 \times 1{,}141.05 = 10{,}269.45$.

@answer
Equity of €10,269.45m.

@pitfalls
- Applying the P/E to EBIT or to this year's earnings.
- Forgetting interest before tax.
`,

  'E21.III': ex`
@task
Exam Part III is an essay. Here it is practised as "which answer fits best": a short question from the essay topics (growth factors, emerging-market adjustments, low multiples, young or private firms) with one answer that covers the key points.

@idea
The model answers in the exam solutions share a pattern: name the driver, then say how it shows up in the valuation inputs (cash flows, growth, discount rate, terminal value). The best option is the one that is complete and consistent with valuation theory; wrong options pick a single number or reverse a direction (lower risk → lower multiple).

@steps
1. Identify the topic: growth, country risk, market sentiment or young firms.
2. Recall the inputs it affects: revenue growth and margins, reinvestment and return on capital, risk-free rate and premiums, beta, terminal growth.
3. Choose the option that links the topic to those inputs consistently.

@example
European oil stocks trade at five times forward earnings instead of ten a decade ago, with similar oil prices. How does this show up in valuation inputs?

@solution
1. Topic: market expectations about the energy transition.
2. Inputs: shorter cash-flow life, lower long-run returns, higher required returns.
3. Consistent option: low reinvestment, high cash, higher payouts, less debt, higher discount rates, low long-run ROE, possibly negative terminal growth.

@answer
The option that lists lower reinvestment and long-run returns together with higher discount rates and low (possibly negative) terminal growth.

@pitfalls
- Picking an answer that names only one input.
- Reversing directions (more risk → higher multiple).
- Using P/E or dividend models for firms with near-zero earnings or no dividends.
`,

  'E22.q5': ex`
@task
Exam Part I: five multiples; you pick the one that is not valid (or not consistent).

@idea
A multiple is consistent if numerator and denominator belong to the same claimholders. **Equity value** (price, market cap) goes with equity measures: net income, book equity, FCFE. **Enterprise value** goes with firm measures: EBITDA, EBIT, sales, FCFF, invested capital.

@steps
1. Classify the numerator: equity value or enterprise value.
2. Classify the denominator: before or after debt holders are paid.
3. The mismatched pair is the invalid multiple.

@example
A. Price to Equity Book Value. B. Price to EBITDA. C. Price to FCFE. D. Enterprise Value to EBIT. E. Enterprise Value to FCFF.

@solution
1. A, C: equity over equity, valid.
2. D, E: firm over firm, valid.
3. B: equity value over EBITDA, which belongs to all capital providers.

@answer
B, Price to EBITDA, is not a valid multiple.

@pitfalls
- Thinking "price" multiples are always fine.
- Calling EV/FCFE valid: FCFE is after debt payments, EV includes debt.
`,

  'E23.IIb': ex`
@task
Exam 2023, Part II (b): re-value the same firm with APV, given interest expenses for years 1–4 (the year-4 figure includes the value of all later interest). You are asked for the unlevered cost of capital, the unlevered value, the PV of the tax shields, the APV and the value per share.

@idea
$APV = V_U + PV(TS)$. Discount the same FCFF and terminal value at the unlevered cost of capital $\rho = r_f + \beta_U \times MRP$. The tax shields are $t \times$ interest; with a constant D/E ratio they are as risky as the assets, so they are discounted at $\rho$ too. With consistent inputs, APV equals the WACC value.

@steps
1. $\rho = r_f + \beta_U \times MRP$.
2. $V_U$: PV of FCFF years 1–4 and of $TV_4 = FCFF_5/(\rho - g)$ at $\rho$.
3. Tax shields: $t \times I_t$ for each year (the year-4 figure already contains the later years).
4. PV of the shields at $\rho$; APV = $V_U$ + PV(TS).
5. Bridge to equity as in part (a).

@example
FCFF 132, 138.60, 145.53, 152.81; $FCFF_5$ = 211.80; $g$ 2.5%; $\beta_U$ 1.10; $r_f$ 2.5%; MRP 8%; tax 20%; interest 16.09, 18.41, 21.06, 178.03 (\$ million).

@solution
1. $\rho = 2.5\% + 1.10 \times 8\% = 11.3\%$.
2. PV of years 1–4 = 435.61; $TV_4 = 211.80/8.8\% = 2{,}406.84$, PV 1,568.44; $V_U = 2{,}004.05$.
3. Shields: 3.22, 3.68, 4.21, 35.61.
4. PV(TS) = 32.12; APV = 2,036.17.
5. Equity $= 2{,}036.17 + 100 + 90 - 40 - 13 - 565 = 1{,}608.17$; per share 16.08.

@answer
APV \$2,036.17m, \$16.08 per share, the same as with the WACC.

@pitfalls
- Discounting the unlevered cash flows at the WACC.
- Using the interest itself instead of $t \times$ interest.
- Adding a separate terminal value for the shields: the year-4 figure already contains it.
`,

  'E24.q2': ex`
@task
Exam Part I: statements about what a higher D/E ratio does to firm value when there are no distress costs, with or without taxes.

@idea
Modigliani–Miller: without taxes, leverage only splits the same cash flows, so value does not change (and the equity beta **rises**). With corporate taxes, interest is deductible: value rises by the PV of the tax shields. Leverage never lowers the equity beta.

@steps
1. Check whether there are corporate taxes.
2. With taxes: value rises through the PV of tax shields. Without: no effect.
3. Reject any statement that says leverage lowers the beta of equity.

@example
There are corporate taxes. A. More debt raises value by reducing the beta of equity. B. More debt raises value through the PV of the tax shield. C. More debt does not affect value. D. A and B. E. All of the above.

@solution
1. Taxes exist.
2. B is true; C is false with taxes.
3. A is false: leverage raises the equity beta.

@answer
B: with taxes, debt adds the PV of the interest tax shields.

@pitfalls
- Choosing D because "value rises" in A as well: the mechanism in A is wrong.
- Choosing C even though taxes are present.
`,
};
