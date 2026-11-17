import { ex, type ExplainMap } from '@/lib/explain';

export const L2: ExplainMap = {
  'L2.gordon': ex`
@task
A share whose dividends grow at a constant rate forever. Depending on the variant you get the last dividend $D_0$, the growth rate and the cost of equity (find the value), the payout ratio and ROE (find sustainable growth first), the price (find the implied cost of equity), or the price and cost of equity (find the implied growth rate).

@idea
A dividend that grows at $g$ forever is a growing perpetuity. Its value one period before the first payment is

$$P_0 = \frac{D_1}{k_e - g}, \qquad D_1 = D_0(1+g).$$

The formula only works for $g < k_e$. Rearranged, it says the return investors expect is dividend yield plus growth: $k_e = \frac{D_1}{P_0} + g$. Growth itself comes from reinvestment: a firm that retains a fraction $b = 1 - \text{payout}$ and earns ROE on it grows at $g = b \times ROE$.

@steps
1. If you are given the payout ratio and ROE: $g = (1 - \text{payout}) \times ROE$.
2. Next year's dividend: $D_1 = D_0 (1+g)$, or $D_1 = E_0 \times \text{payout} \times (1+g)$ from earnings.
3. Value: $P_0 = D_1 / (k_e - g)$.
4. Implied cost of equity from a price: $k_e = D_1 / P_0 + g$; the first term is the dividend yield.
5. Implied growth from a price: $g = k_e - D_1 / P_0$; the ROE that sustains it is $g / (1 - \text{payout})$.
6. Forward P/E: $P_0 / E_1$ with $E_1 = E_0(1+g)$.

@example
(a) A firm has just paid €2.00, dividends grow at 3% forever and $k_e = 8\%$. Value the share.
(b) Another firm earned €4.00 per share, pays out 60% and earns ROE of 12% on reinvested earnings; $k_e = 9\%$. Find $g$ and the value.

@solution
1. (a) $D_1 = 2.00 \times 1.03 = 2.06$.
2. (a) $P_0 = 2.06 / (0.08 - 0.03) = €41.20$. Dividend yield $2.06 / 41.20 = 5\%$, and $5\% + 3\% = 8\% = k_e$, as it should be.
3. (b) $g = (1 - 0.6) \times 12\% = 4.8\%$.
4. (b) $D_1 = 4.00 \times 0.6 \times 1.048 = 2.5152$.
5. (b) $P_0 = 2.5152 / (0.09 - 0.048) = €59.89$.

@answer
(a) €41.20. (b) Sustainable growth 4.8%, value €59.89.

@pitfalls
- Putting $D_0$ in the numerator. "Has just paid" is $D_0$; the formula needs $D_1 = D_0(1+g)$.
- Using the payout ratio instead of the retention ratio for growth: $g = b \times ROE$ with $b = 1 - \text{payout}$.
- Forgetting $+g$ when backing out the cost of equity from a price.
- Applying the model with $g \geq k_e$; the value would be negative or infinite.
`,

  'L2.retention': ex`
@task
A firm with a constant-growth share price announces that it will retain more of its earnings. You are asked for the old growth rate, the cost of equity implied by today's price, the new growth rate, the new share price, and whether the price rises, falls or stays the same.

@idea
Retaining more earnings raises growth ($g = b \times ROE$) but cuts today's dividend ($D_1 = E_1(1-b)$). Which effect wins depends only on the return the firm earns on the reinvested money compared with what shareholders require:

- $ROE > k_e$: reinvestment creates value, the price **rises**.
- $ROE = k_e$: reinvestment is zero-NPV, the price **stays the same**.
- $ROE < k_e$: reinvestment destroys value, the price **falls**.

Timing in these questions: next year's earnings $E_1$ still grow with the old policy, $E_1 = E_0(1 + b_{old} \cdot ROE)$; from then on growth is $b_{new} \cdot ROE$.

@steps
1. Old growth: $g_0 = b_0 \times ROE_0$.
2. Implied cost of equity from today's price: $D_1 = E_0(1+g_0)(1-b_0)$, then $k_e = D_1 / P_0 + g_0$.
3. Next year's earnings under the announcement: $E_1 = E_0(1 + b_0 \times ROE_{new})$.
4. New growth: $g_1 = b_1 \times ROE_{new}$; new dividend $D_1' = E_1(1 - b_1)$.
5. New price: $P' = D_1' / (k_e - g_1)$. Compare with $P_0$.

@example
EPS just reported €5.00, ROE 12%, the firm has always retained 40%. The price is €60.46. It will now retain 60%, ROE stays at 12%, $k_e$ unchanged.

@solution
1. $g_0 = 0.4 \times 12\% = 4.8\%$.
2. $D_1 = 5.00 \times 1.048 \times 0.6 = 3.144$; $k_e = 3.144 / 60.46 + 4.8\% = 10.0\%$.
3. $E_1 = 5.00 \times 1.048 = 5.24$ (old policy still drives next year).
4. $g_1 = 0.6 \times 12\% = 7.2\%$; $D_1' = 5.24 \times 0.4 = 2.096$.
5. $P' = 2.096 / (0.10 - 0.072) = €74.86$.

@answer
New growth 7.2%, new price €74.86: the price rises, because ROE (12%) exceeds the cost of equity (10%).

@pitfalls
- Believing more retention always helps because growth rises; it helps only if $ROE > k_e$.
- Using the new retention ratio to grow next year's earnings; next year still reflects the old policy.
- Forgetting that the dividend falls when retention rises: $D_1' = E_1(1 - b_{new})$.
- Re-estimating the cost of equity after the change; it stays the same.
`,

  'L2.twoStage': ex`
@task
Dividends grow fast for $n$ years and then at a lower rate forever. You are asked for individual dividends, the present value of the high-growth dividends, the price at the end of year $n$, and the value today. In one variant the payout ratio jumps when the firm matures, so year $n+1$'s dividend has to be built from earnings.

@idea
Split the future at year $n$. The high-growth dividends are discounted one by one. From year $n+1$ on, dividends grow at the stable rate, so the share at the end of year $n$ is worth a Gordon value:

$$P_n = \frac{D_{n+1}}{k_e - g_L}$$

Today's value is the PV of the high-growth dividends plus the PV of $P_n$. When the firm matures, its payout must fit the lower growth: $\text{payout}_L = 1 - g_L / ROE_L$.

@steps
1. Dividends: $D_t = D_0(1+g_S)^t$ for $t = 1, \dots, n$.
2. PV of these: $\sum_{t=1}^{n} D_t / (1+k_e)^t$.
3. Year $n+1$ dividend: $D_{n+1} = D_n(1+g_L)$. In the payout variant: $E_{n+1} = E_0(1+g_S)^n(1+g_L)$ and $D_{n+1} = E_{n+1} \times (1 - g_L/ROE_L)$.
4. Terminal price: $P_n = D_{n+1} / (k_e - g_L)$.
5. Value today: step 2 $+ P_n / (1+k_e)^n$.

@example
$D_0 = €1.00$, growth 15% for 3 years, then 3% forever, $k_e = 10\%$.

@solution
1. $D_1 = 1.15$, $D_2 = 1.3225$, $D_3 = 1.5209$.
2. PV: $1.15/1.1 + 1.3225/1.1^2 + 1.5209/1.1^3 = 1.0455 + 1.0930 + 1.1427 = 3.2811$.
3. $D_4 = 1.5209 \times 1.03 = 1.5665$.
4. $P_3 = 1.5665 / (0.10 - 0.03) = 22.3786$.
5. Value $= 3.2811 + 22.3786 / 1.1^3 = 3.2811 + 16.8134 = €20.09$.

@answer
The share is worth €20.09 today (end-of-year-3 price €22.38).

@pitfalls
- Using $D_n$ instead of $D_{n+1}$ in the terminal formula.
- Discounting $P_n$ by $n+1$ years; it is a value at the end of year $n$.
- Growing $D_{n+1}$ at the high rate instead of the stable rate.
- In the payout variant, keeping the old payout ratio for the mature phase.
`,

  'L2.hModel': ex`
@task
Dividend growth starts high and falls in a straight line to a stable rate over $T$ years. You are asked for $H$, the value if the stable rate applied from today, the value added by the extra growth, and the H-model value.

@idea
The H-model approximates a gradual decline in growth. Value is a stable Gordon value plus a premium for the years of above-normal growth, which shrinks linearly; on average the excess growth lasts half the transition, $H = T/2$:

$$P_0 = \frac{D_0(1+g_L)}{k_e - g_L} + \frac{D_0 \, H \, (g_S - g_L)}{k_e - g_L}$$

@steps
1. $H = T / 2$, where $T$ is the length of the decline in years.
2. Stable part: $D_0(1+g_L) / (k_e - g_L)$.
3. Extra-growth part: $D_0 \times H \times (g_S - g_L) / (k_e - g_L)$.
4. Add both parts.

@example
$D_0 = €2.00$. Growth is 12% now and falls linearly over 10 years to 3%. $k_e = 9\%$.

@solution
1. $H = 10 / 2 = 5$.
2. Stable part: $2.00 \times 1.03 / (0.09 - 0.03) = €34.33$.
3. Extra growth: $2.00 \times 5 \times (0.12 - 0.03) / 0.06 = €15.00$.
4. Value $= 34.33 + 15.00 = €49.33$.

@answer
H = 5, stable value €34.33, extra growth €15.00, H-model value €49.33.

@pitfalls
- Using $H = T$ instead of $T/2$.
- Writing $D_0(1+g_S)$ or $D_0(1+g_L)$ in the second term; it is $D_0$ only.
- Using $g_S$ alone instead of the gap $g_S - g_L$.
`,

  'L2.fcf': ex`
@task
You get EBIT, interest, depreciation, capital expenditure, the increase in net working capital, net borrowing and the tax rate. You are asked for NOPAT, FCFF, after-tax interest, FCFE or net capital expenditure.

@idea
Free cash flow is the cash a business generates after taxes and after the investment it needs to keep growing.

- **FCFF** (to all capital providers) starts from operating profit taxed as if there were no debt: $NOPAT = EBIT(1-t)$. Depreciation is added back because it is not a cash outflow; capex and the increase in working capital are subtracted because they are.
$$FCFF = EBIT(1-t) + D\&A - CapEx - \Delta NWC$$
- **FCFE** (to shareholders) is what is left after debt holders: subtract after-tax interest (interest saves taxes) and add net new borrowing.
$$FCFE = FCFF - \text{Interest}(1-t) + \text{Net borrowing}$$

@steps
1. $NOPAT = EBIT \times (1-t)$.
2. $FCFF = NOPAT + D\&A - CapEx - \Delta NWC$.
3. After-tax interest $= \text{Interest} \times (1-t)$.
4. $FCFE = FCFF - \text{after-tax interest} + \text{net borrowing}$ (a repayment is negative borrowing).
5. Net capex $= CapEx - D\&A$.

@example
EBIT €500m, interest €40m, D&A €80m, capex €140m, increase in NWC €20m, net new borrowing €50m, tax rate 25%.

@solution
1. $NOPAT = 500 \times 0.75 = 375$.
2. $FCFF = 375 + 80 - 140 - 20 = 295$.
3. After-tax interest $= 40 \times 0.75 = 30$.
4. $FCFE = 295 - 30 + 50 = 315$.
5. Net capex $= 140 - 80 = 60$.

@answer
NOPAT €375m, FCFF €295m, FCFE €315m.

@pitfalls
- Subtracting interest in FCFF; FCFF is before any payment to capital providers.
- Subtracting the full interest in FCFE instead of the after-tax interest.
- Subtracting depreciation (it is added back) or adding the NWC increase (it uses cash).
- Starting FCFF from net income; net income is already after interest.
`,

  'L2.dcf': ex`
@task
FCFF grows at a high rate for $T$ years and at a stable rate afterwards. With the WACC, debt, cash, shares and price you are asked for the firm value, the equity value, the value per share, the terminal-value share and a buy/sell call.

@idea
FCFF belongs to all capital providers, so it is discounted at the WACC and gives the value of the whole firm. The forecast years are discounted one by one; after year $T$ a growing perpetuity gives the terminal value $TV_T = FCFF_{T+1}/(WACC - g)$. Equity is what remains after subtracting debt and adding cash.

@steps
1. Forecast: $FCFF_t = FCFF_0(1+g_1)^t$ for $t = 1, \dots, T$.
2. PV of the forecast at the WACC.
3. $TV_T = FCFF_T(1+g) / (WACC - g)$, then $PV(TV) = TV_T / (1+WACC)^T$.
4. Firm value $=$ step 2 $+$ PV(TV).
5. Equity $=$ firm value $-$ debt $+$ cash; per share $=$ equity $/$ shares.
6. Buy if value per share is above the price, sell if below.

@example
Last year's FCFF €200m, growth 8% for 3 years, then 2.5% forever, WACC 9%. Debt €900m, cash €100m, 50 million shares at €40.00.

@solution
1. $FCFF_1 = 216.00$, $FCFF_2 = 233.28$, $FCFF_3 = 251.94$.
2. PV $= 198.17 + 196.35 + 194.55 = 589.06$.
3. $TV_3 = 251.94 \times 1.025 / (0.09 - 0.025) = 3{,}972.94$; $PV = 3{,}972.94 / 1.09^3 = 3{,}067.84$.
4. Firm value $= 589.06 + 3{,}067.84 = 3{,}656.89$.
5. Equity $= 3{,}656.89 - 900 + 100 = 2{,}856.89$; per share $€57.14$.
6. €57.14 > €40.00: buy. The terminal value is 83.9% of the firm value.

@answer
Firm value €3,656.89m, equity €2,856.89m, €57.14 per share: buy.

@pitfalls
- Using last year's FCFF as year 1; year 1 is $FCFF_0(1+g_1)$.
- Discounting FCFF at the cost of equity; FCFF goes with the WACC.
- Reporting the firm value as the equity value, or subtracting cash.
- Discounting the terminal value by $T+1$ years.
`,

  'L2.fcfe': ex`
@task
A firm with a stable debt-equity ratio expects FCFE next year, a growth rate up to year $T$ and stable growth after that. You are asked for the FCFE in year $T$, the PV of the forecast, the terminal value of equity, the equity value and the value per share.

@idea
FCFE is what shareholders receive, so it is discounted at the **cost of equity** and gives the equity value directly; no bridge from firm to equity is needed. Note the timing: the question gives FCFE for *year 1*, which then grows, so $FCFE_t = FCFE_1(1+g_1)^{t-1}$.

@steps
1. $FCFE_t = FCFE_1(1+g_1)^{t-1}$ for $t = 1, \dots, T$.
2. PV of the forecast at $k_e$.
3. $TV_T = FCFE_T(1+g) / (k_e - g)$ and $PV(TV) = TV_T/(1+k_e)^T$.
4. Equity $=$ step 2 $+$ PV(TV); per share $=$ equity $/$ shares.

@example
FCFE next year €60m, growth 10% until year 3, then 3% forever, $k_e = 11\%$, 20 million shares.

@solution
1. $FCFE_1 = 60.00$, $FCFE_2 = 66.00$, $FCFE_3 = 72.60$.
2. PV $= 54.05 + 53.57 + 53.08 = 160.71$.
3. $TV_3 = 72.60 \times 1.03 / 0.08 = 934.73$; PV $= 934.73 / 1.11^3 = 683.46$.
4. Equity $= 160.71 + 683.46 = 844.17$m; per share $€42.21$.

@answer
Equity value €844.17m, €42.21 per share.

@pitfalls
- Growing the year-1 FCFE once more for year 1 (it is already next year's figure).
- Discounting FCFE at the WACC.
- Subtracting debt from the FCFE value; it already is an equity value.
`,

  'L2.deferred': ex`
@task
An FCFF valuation in which the firm pays a low effective tax rate for $n$ years and its marginal rate afterwards, builds up a deferred tax liability (DTL) that is paid back in instalments, and has debt and preferred stock. You are asked for FCFFs, PVs, the DTL at the end of year $n$, the PV of the deferred tax payments, firm value, the preferred stock and common equity.

@idea
Three pieces make up the firm value:

1. **Explicit FCFF** at the effective tax rate: $FCFF_t = EBIT_t(1-t_e) + D\&A_t - CapEx_t - \Delta NWC_t$, all growing at $g_1$.
2. **Terminal value** from year $n+1$, now taxed at the marginal rate $t_m$ and growing at $g_2$.
3. The taxes saved early are not a gift: they are owed later. The DTL grows each year by $EBIT_t(t_m - t_e)$; at the end of year $n$ it is paid in $k$ equal instalments, a cash outflow worth an annuity that **reduces** firm value.

Preferred stock with a fixed dividend is a perpetuity, $\text{Pref} = \text{Div}/k_p$, and is subtracted together with debt to reach common equity.

@steps
1. Grow EBIT, D&A, capex and NWC at $g_1$ for years 1 to $n$, then at $g_2$.
2. $FCFF_t$ with $t_e$ for $t \leq n$, with $t_m$ for $t = n+1$.
3. PV of $FCFF_1 \dots FCFF_n$ at the WACC; $PV(TV) = \frac{FCFF_{n+1}}{WACC - g_2} / (1+WACC)^n$.
4. $DTL_n = DTL_0 + (t_m - t_e)\sum_{t=1}^{n} EBIT_t$; instalment $= DTL_n / k$.
5. PV of the payments: annuity $\frac{\text{inst}}{WACC}\left(1 - (1+WACC)^{-k}\right)$, discounted $n$ more years.
6. Firm value $=$ step 3 $-$ step 5. Equity $=$ firm value $-$ debt $-$ Div$/k_p$.

@example
Last year: EBIT 200, capex 50, D&A 20, ΔNWC 20 (€m). Growth 10% for 3 years, then 3%. WACC 12%. Tax 20% for 3 years, 30% after. DTL today 150, paid in 5 instalments in years 4–8. Debt 300; preferred dividend 10 with a required return of 10%.

@solution
1. $FCFF_1 = 220 \times 0.8 + 22 - 55 - 22 = 121.00$; $FCFF_2 = 133.10$; $FCFF_3 = 146.41$.
2. Year 4: EBIT $= 266.2 \times 1.03 = 274.19$, $FCFF_4 = 274.19 \times 0.7 + 27.42 - 68.55 - 27.42 = 123.38$.
3. PV of years 1–3 $= 318.35$; $TV_3 = 123.38 / 0.09 = 1{,}370.93$, PV $= 975.80$.
4. $DTL_3 = 150 + 0.10 \times (220 + 242 + 266.2) = 222.82$; instalment $44.56$.
5. Annuity at end of year 3: $44.56/0.12 \times (1 - 1.12^{-5}) = 160.64$; today $160.64 / 1.12^3 = 114.34$.
6. Firm value $= 318.35 + 975.80 - 114.34 = 1{,}179.81$; preferred $= 10/0.10 = 100$; equity $= 1{,}179.81 - 300 - 100 = 779.81$.

@answer
Firm value €1,179.81m, preferred stock €100m, common equity €779.81m.

@pitfalls
- Taxing the terminal year at the effective rate; from year $n+1$ the marginal rate applies.
- Ignoring the deferred taxes or adding them; their repayment is an outflow that lowers value.
- Discounting the instalment annuity only to year $n$ and forgetting the extra $n$ years to today.
- Valuing preferred stock at its dividend instead of dividend divided by the required return.
`,

  'L2.concept': ex`
@task
Concept questions on dividend discount models and free cash flows: a statement to mark true or false, four statements with exactly one false (or one true), or a short question with the best-fitting answer.

@idea
The statements test a handful of rules:

- **Gordon model** needs $g < k_e$ and suits mature firms with a stable dividend policy.
- **Growth from reinvestment**: $g = b \times ROE$. Retaining more raises the price only if $ROE > k_e$; with $ROE = k_e$ the payout does not matter.
- **Two-stage DDM** switches growth abruptly; the **H-model** lets it decline linearly, with $H$ half the transition.
- **FCFF** $= EBIT(1-t) + D\&A - CapEx - \Delta NWC$, before interest, discounted at the **WACC**. **FCFE** $\approx FCFF -$ after-tax interest $+$ net borrowing, discounted at the **cost of equity**.
- FCFF suits firms whose leverage changes; FCFE suits a stable debt-equity ratio.
- Terminal growth should not exceed long-run economic growth (about 2–4%); the terminal value is often over 70% of the value.
- Equity $=$ firm value $-$ debt $+$ cash $-$ preferred $-$ minorities. Deferred tax reversals are cash outflows that reduce value.

@steps
1. Identify the model or cash flow the statement is about.
2. Check the matching rule: which rate discounts which cash flow, which sign each item has, what condition the model needs.
3. Watch for absolute words ("always", "never", "any") — e.g. retention "always" increasing value is false.
4. In "which is false/true" questions, test each option separately and pick the odd one out.

@example
Which statement is FALSE?
a) FCFF is discounted at the WACC; FCFE at the cost of equity.
b) An increase in net working capital increases free cash flow.
c) Sustainable growth equals the retention ratio times ROE.
d) The Gordon model requires growth below the cost of equity.

@solution
1. a) is the matching rule for the discount rates: true.
2. b) An increase in NWC ties up cash, so it is *subtracted* in FCFF: false.
3. c) $g = b \times ROE$: true.
4. d) With $g \geq k_e$ the formula breaks down: true.

@answer
b) is false: an increase in net working capital reduces free cash flow.

@pitfalls
- Pairing FCFE with the WACC or FCFF with the cost of equity.
- Treating depreciation as a cash outflow, or a rise in NWC as a cash inflow.
- Believing higher retention always increases value.
- Thinking deferred tax liabilities never lead to cash payments.
- Calling the two-stage model's transition gradual (that is the H-model).
`,
};
