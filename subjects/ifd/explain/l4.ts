import { ex, type ExplainMap } from '@/lib/explain';

export const L4: ExplainMap = {
  'L4.npv': ex`
@task
A project needs equipment and brings yearly cash flows. A list of further facts includes a completed study, an unused machine, lost sales of an existing product and allocated overhead. You are asked for the incremental cash flows at $t = 0$ and in year 1, the NPV and the decision (or, in multiple choice, which items are relevant).

@idea
Only **incremental** cash flows count: those that differ between taking and not taking the project.

- **Sunk costs** (a study already paid) are irrelevant: they are spent either way.
- **Allocated overhead** that does not change total costs is irrelevant.
- **Opportunity costs** count: using a machine you could sell gives up its sale price at $t = 0$.
- **Externalities** count: lost sales of an existing product reduce the project's cash flows every year.
- **Financing flows** (interest, dividends) are left out; they are in the discount rate.

@steps
1. Cross out sunk costs, unchanged allocations and financing flows.
2. $CF_0 = -$equipment $-$ opportunity cost of assets used.
3. $CF_t =$ project cash flow $-$ lost cash flow of other products.
4. NPV $= \sum CF_t/(1+r)^t$; accept if positive.

@example
Equipment €2,000 today; cash flows €1,200 in each of years 1–3; $r = 10\%$. A study cost €300 last month; the project uses a machine that could be sold for €400; the existing product loses €100 a year; HQ allocates €50 a year of unchanged costs.

@solution
1. Study and HQ allocation are irrelevant.
2. $CF_0 = -2{,}000 - 400 = -€2{,}400$.
3. $CF_{1,2,3} = 1{,}200 - 100 = €1{,}100$.
4. NPV $= -2{,}400 + 1{,}100 \times 2.4869 = €335.54$ → accept.

@answer
$CF_0$ = −€2,400, $CF_1$ = €1,100, NPV = €335.54: undertake the project.

@pitfalls
- Including the sunk study or the allocated overhead.
- Ignoring the machine because the firm already owns it.
- Forgetting the cannibalised sales in every year.
`,

  'L4.fcf': ex`
@task
From two balance sheets and an income statement you are asked for net working capital, its change, the tax rate, the unlevered taxes, and the free cash flow.

@idea
Free cash flow is the cash the operations generate if the firm were **all-equity financed**:

$$FCF = EBITDA - \tau \cdot EBIT - CapEx - \Delta NWC$$

- Taxes are computed on **EBIT** (as if no interest), not on taxable income.
- NWC $=$ cash $+$ inventory $+$ receivables $-$ payables (here cash counts as operating). An increase uses cash.
- CapEx $=$ change in non-current assets $+$ depreciation (if not given).
- Interest and dividends are financing flows and do not enter.

@steps
1. NWC per year; $\Delta NWC = NWC_{2026} - NWC_{2025}$.
2. Tax rate $=$ taxes $/$ taxable income.
3. Unlevered taxes $= \tau \times EBIT$.
4. CapEx $= \Delta$ non-current assets $+$ depreciation (or as given).
5. $FCF = EBITDA - \tau EBIT - CapEx - \Delta NWC$.

@example
EBITDA €60,000, depreciation €10,000, EBIT €50,000, interest €5,000, taxes €11,250 on €45,000. NWC items 2025 / 2026: cash 5,000 / 6,000, inventory 20,000 / 22,000, receivables 15,000 / 16,000, payables 18,000 / 19,000. Non-current assets 40,000 → 45,000.

@solution
1. $NWC_{2025} = 5{,}000 + 20{,}000 + 15{,}000 - 18{,}000 = 22{,}000$; $NWC_{2026} = 25{,}000$; $\Delta NWC = 3{,}000$.
2. $\tau = 11{,}250/45{,}000 = 25\%$.
3. Unlevered taxes $= 0.25 \times 50{,}000 = 12{,}500$.
4. CapEx $= 5{,}000 + 10{,}000 = 15{,}000$.
5. $FCF = 60{,}000 - 12{,}500 - 15{,}000 - 3{,}000 = €29{,}500$.

@answer
FCF = €29,500 (ΔNWC €3,000, tax rate 25%, unlevered taxes €12,500).

@pitfalls
- Using the taxes actually paid (after interest) instead of $\tau \times EBIT$.
- Subtracting interest or dividends.
- Forgetting cash in NWC when told to treat it as operating, or forgetting to subtract payables.
- Taking CapEx as only the change in non-current assets (add back depreciation).
`,

  'L4.terminal': ex`
@task
Either the last year of a project with an asset sale and recovery of working capital (after-tax salvage, final FCF and its PV), or a continuation value as a growing perpetuity at the end of the forecast (and its PV).

@idea
- **Salvage**: only the gain over book value is taxed (a loss gives a tax credit): after-tax salvage $= \text{sale} - \tau(\text{sale} - \text{book})$.
- **NWC recovery**: working capital tied up during the project comes back at the end as a cash inflow.
- Final $FCF = EBIT(1-\tau) + \text{depreciation} + \text{after-tax salvage} + \text{NWC recovered}$.
- **Continuation value**: $TV_T = \frac{FCF_{T+1}}{r - g} = \frac{FCF_T(1+g)}{r-g}$, a value at year $T$, discounted $T$ years.

@steps
1. After-tax salvage $= S - \tau(S - B)$.
2. Final FCF = $EBIT(1-\tau) + D$ + after-tax salvage + NWC.
3. PV $= FCF_T/(1+r)^T$.
4. Continuation value: $TV_T = FCF_T(1+g)/(r - g)$; PV $= TV_T/(1+r)^T$.

@example
(a) Year 5: EBIT €6m, depreciation €2m; equipment with book value €3m sold for €5m; NWC of €4m recovered; $\tau = 25\%$, $r = 10\%$. (b) FCF in year 4 is €10m, growth 2% forever, $r = 9\%$.

@solution
1. (a) Salvage $= 5 - 0.25 \times (5 - 3) = €4.5$m.
2. (a) $FCF_5 = 6 \times 0.75 + 2 + 4.5 + 4 = €15$m.
3. (a) PV $= 15/1.1^5 = €9.31$m.
4. (b) $TV_4 = 10 \times 1.02/0.07 = €145.71$m; PV $= 145.71/1.09^4 = €103.23$m.

@answer
(a) After-tax salvage €4.5m, final FCF €15m, PV €9.31m. (b) Continuation value €145.71m, PV €103.23m.

@pitfalls
- Taxing the full sale price instead of the gain over book value.
- Forgetting the NWC recovery or the depreciation add-back.
- Using $FCF_T$ instead of $FCF_T(1+g)$, or discounting the TV $T+1$ years.
`,

  'L4.apv': ex`
@task
A project with constant free cash flows is financed by a loan repaid in equal instalments. You are asked for the all-equity NPV, the interest tax shield in year 1, the PV of all tax shields and the APV.

@idea
**APV** separates the project from its financing:

$$APV = NPV_{unlevered} + PV(\text{interest tax shields})$$

The unlevered NPV discounts FCF at $r_U$. Each year's shield is $\tau \, r_D \, D_{t-1}$, based on the debt outstanding at the **start** of the year. With a **predetermined** schedule the shields are as safe as the debt, so they are discounted at $r_D$.

@steps
1. $NPV_U = -I + \sum FCF/(1+r_U)^t$ (an annuity if constant).
2. Debt at the start of each year: $D_0$, $D_0 -$ instalment, …
3. Shield$_t = \tau \times r_D \times D_{t-1}$.
4. PV of shields at $r_D$.
5. APV $= NPV_U +$ PV(shields).

@example
FCF €12m a year for 5 years; investment €30m financed by a loan repaid in 3 instalments of €10m. $r_U = 10\%$, $r_D = 5\%$, $\tau = 30\%$.

@solution
1. $NPV_U = -30 + 12 \times 3.7908 = €15.49$m.
2. Debt at the start of years 1–3: 30, 20, 10.
3. Shields: $0.3 \times 0.05 \times 30 = 0.45$, then $0.30$, $0.15$.
4. PV $= 0.45/1.05 + 0.30/1.05^2 + 0.15/1.05^3 = €0.83$m.
5. APV $= 15.49 + 0.83 = €16.32$m.

@answer
Unlevered NPV €15.49m, year-1 shield €0.45m, PV of shields €0.83m, APV €16.32m.

@pitfalls
- Computing the shield on the debt at the end of the year.
- Discounting the shields at $r_U$ when the schedule is fixed.
- Taking the shield as $\tau \times$ instalment (principal is not deductible).
`,

  'L4.wacc': ex`
@task
An all-equity firm levers up to a constant debt-to-value ratio. You are asked for the new cost of equity, the WACC, the levered and unlevered value of a perpetuity of free cash flows, and the PV of the tax shields.

@idea
With a constant leverage ratio, MM II gives the equity cost and the after-tax WACC captures the tax shield:

$$r_E = r_U + \frac{D}{E}(r_U - r_D), \qquad WACC = \frac{E}{V}r_E + \frac{D}{V}r_D(1-\tau) = r_U - \frac{D}{V}\tau r_D$$

$V^L = FCF/(WACC - g)$ and $V^U = FCF/(r_U - g)$; the difference is the PV of the shields (which here carry operating risk, discounted at $r_U$).

@steps
1. $D/E = \frac{D/V}{1 - D/V}$; $r_E = r_U + \frac{D}{E}(r_U - r_D)$.
2. WACC $= \frac{E}{V} r_E + \frac{D}{V} r_D (1 - \tau)$.
3. $V^L = FCF_1/(WACC - g)$; $V^U = FCF_1/(r_U - g)$.
4. PV(shields) $= V^L - V^U$.

@example
$r_U = 10\%$, target D/V 40%, $r_D = 5\%$, $\tau = 25\%$, FCF €20m a year forever.

@solution
1. $D/E = 0.4/0.6 = 0.667$; $r_E = 10\% + 0.667 \times 5\% = 13.33\%$.
2. WACC $= 0.6 \times 13.33\% + 0.4 \times 5\% \times 0.75 = 9.5\%$ ($= 10\% - 0.4 \times 0.25 \times 5\%$).
3. $V^L = 20/0.095 = €210.53$m; $V^U = 20/0.10 = €200$m.
4. PV(shields) $= €10.53$m.

@answer
Cost of equity 13.33%, WACC 9.5%, levered value €210.53m, tax shields €10.53m.

@pitfalls
- Using D/V in MM II instead of D/E.
- Forgetting $(1 - \tau)$ on the cost of debt in the WACC.
- Discounting the FCF at $r_E$.
`,

  'L4.beta': ex`
@task
A firm values a project in a new business using a pure-play twin. You get the twin's equity beta, D/E and debt beta, the project's D/E, $r_f$, MRP and the tax rate. You are asked for the asset beta, the all-equity cost of capital, the project's equity beta and cost of equity, and its WACC.

@idea
A project must be discounted at a rate for **its own** risk, not the firm's. The twin's asset beta measures that business risk:

$$\beta_U = \frac{E}{V}\beta_E + \frac{D}{V}\beta_D = \frac{\beta_E + (D/E)\beta_D}{1 + D/E}$$

Relever at the project's structure, $\beta_E' = \beta_U + \frac{D'}{E'}(\beta_U - \beta_D)$, use the CAPM for each cost, and combine in a WACC with $(1-\tau)$ on debt.

@steps
1. $\beta_U$ from the twin; $r_U = r_f + \beta_U \times MRP$.
2. $\beta_E' = \beta_U + \frac{D'}{E'}(\beta_U - \beta_D)$; $r_E' = r_f + \beta_E' \times MRP$.
3. $r_D = r_f + \beta_D \times MRP$.
4. WACC $= \frac{1}{1 + D'/E'} r_E' + \frac{D'/E'}{1 + D'/E'} r_D (1 - \tau)$.

@example
Twin: equity beta 1.4, D/E 0.5, debt beta 0.1. Project: D/E 0.25, same debt beta. $r_f = 3\%$, MRP 6%, $\tau = 25\%$.

@solution
1. $\beta_U = (1.4 + 0.5 \times 0.1)/1.5 = 0.9667$; $r_U = 3\% + 0.9667 \times 6\% = 8.8\%$.
2. $\beta_E' = 0.9667 + 0.25 \times (0.9667 - 0.1) = 1.1833$; $r_E' = 10.1\%$.
3. $r_D = 3\% + 0.1 \times 6\% = 3.6\%$.
4. WACC $= 0.8 \times 10.1\% + 0.2 \times 3.6\% \times 0.75 = 8.62\%$.

@answer
Asset beta 0.967, unlevered cost 8.8%, project equity beta 1.18, cost of equity 10.1%, WACC 8.62%.

@pitfalls
- Using the firm's own equity beta for a project in a different business.
- Ignoring the debt beta when unlevering.
- Using the twin's D/E when relevering.
`,

  'L4.concept': ex`
@task
Concept questions on capital budgeting: true/false, find the false (or true) statement, or the best short answer.

@idea
- Accept projects with a positive PV of **incremental** cash flows.
- Sunk costs are irrelevant; opportunity costs and cannibalisation count; allocated overhead counts only if total costs change.
- Free cash flow is the all-equity cash flow: taxes on EBIT, no interest, no dividends; depreciation matters only through its tax effect; an **increase** in NWC is an outflow.
- Discount at a rate for the **project's** systematic risk, not the firm's average or its cost of equity; high diversifiable volatility does not mean high beta; higher operating leverage **raises** beta.
- Predetermined debt schedule → shields at $r_D$ (APV is the natural tool); constant leverage ratio → shields at $r_U$ (WACC works).

@steps
1. Classify the item or claim: relevance, FCF construction, discount rate or financing side effects.
2. Check against the rules above.
3. Watch for "always" and reversed directions.
4. Pick the odd one out among four options.

@example
True or false? "A completed market study should be included as a cost when deciding whether to launch the product."

@solution
1. The study is already paid.
2. Its cost is the same whether or not the product is launched.
3. It is a sunk cost.

@answer
False. Sunk costs are irrelevant to the decision.

@pitfalls
- "Overhead allocations are always incremental": false.
- "Interest must be deducted in FCF": false.
- "A decrease in NWC is an outflow": false.
- "WACC is more flexible than APV with a fixed debt schedule": false.
`,

  'PS4.msc': ex`
@task
You compare staying in your job with an MSc: salaries grow until retirement in both cases, the MSc costs tuition and books and delays the new salary. You are asked for the PV of the salaries given up, the PV of salaries after the MSc, the NPV of studying, and whether items such as living costs, taxes, a fairly priced loan or a party affect the calculation.

@idea
Treat each salary stream as a **growing annuity**:

$$PV = \frac{C}{r - g}\left[1 - \left(\frac{1+g}{1+r}\right)^n\right]$$

The first payment $C$ is one year after the stream starts. The MSc salaries start one year after graduation, so value them at the end of the programme and discount $D$ more years. Then

$$NPV = PV_{MSc} - PV_{job} - \text{tuition} - \text{books}$$

Only incremental, after-tax cash flows count: sunk application costs, consumption worth its price (the party) and a zero-NPV loan do not change the NPV; living costs matter only if they differ.

@steps
1. Job: $n_1 = 65 -$ age salaries starting at $S_1$, growing at $g_1$.
2. MSc: $n_2 = n_1 - D$ salaries starting at $S_2$ one year after graduation; PV at year $D$, then divide by $(1+r)^D$.
3. NPV $=$ step 2 $-$ step 1 $-$ costs paid today.
4. For each listed item, ask: does it change the cash flows between the two options?

@example
Age 25, one-year MSc, $r = 7\%$. Job: €30,000 growing 3% for 40 years. After the MSc: €40,000 growing 4% for 39 years. Tuition €20,000, books €2,000, party €2,000.

@solution
1. $PV_{job} = \frac{30{,}000}{0.04}\left[1 - (1.03/1.07)^{40}\right] = €586{,}620$.
2. $PV_{MSc} = \frac{40{,}000}{0.03}\left[1 - (1.04/1.07)^{39}\right] / 1.07 = €835{,}062$.
3. NPV $= 835{,}062 - 586{,}620 - 20{,}000 - 2{,}000 = €226{,}442$ (226.44 in thousands).
4. The party is consumption worth its cost; a risk-free student loan is zero-NPV; application costs are sunk.

@answer
NPV of the MSc ≈ €226.4 thousand.

@pitfalls
- Forgetting to discount the MSc stream back over the study period.
- Using the wrong number of payments ($n_2 = n_1 - D$).
- Subtracting the party or a fairly priced loan as a cost.
- Using pre-tax salaries.
`,
};
