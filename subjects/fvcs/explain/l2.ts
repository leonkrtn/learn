import { ex, type ExplainMap } from '@/lib/explain';

export const L2: ExplainMap = {
  'L2.itsFinite': ex`
@task
A firm pays risk-free interest for a number of years (sometimes in two phases, or shown in a pro-forma income statement). You are asked for the annual interest tax shield, the present value of the tax shields, the PV if the debt were permanent, or net income.

@idea
Interest is tax deductible, so every euro of interest saves $\tau_c$ euros of tax: the **interest tax shield** is $\tau_c \times \text{Interest}$. The principal repayment is not deductible and gives no shield. Because the debt is risk-free, the shields are discounted at $r_f$:

- Constant shield for $N$ years: an annuity, $PV = \frac{\tau_c I}{r_f}\left(1 - \frac{1}{(1+r_f)^N}\right)$.
- Permanent debt: a perpetuity, $PV = \tau_c I / r_f$ (which equals $\tau_c D$ if $I = r_f D$).
- Uneven interest: discount each year's $\tau_c I_t$ separately; a second phase is an annuity discounted back by the length of the first phase.

@steps
1. Interest per year $I$ = coupon rate $\times$ face value (or as given).
2. Annual shield $= \tau_c \times I$.
3. PV over $N$ years: annuity formula at $r_f$.
4. Permanent: $\tau_c I / r_f$.
5. Two phases: $PV_1$ = annuity over $n_1$ years; $PV_2$ = annuity over $n_2$ years $\div (1+r_f)^{n_1}$.
6. Table variant: total shields $= \tau_c \sum I_t$ (no discounting); PV $= \sum \tau_c I_t/(1+r_f)^t$. Net income $= (EBIT - I)(1 - \tau_c)$.

@example
Bonds with face value €500m and a 6% coupon, repaid in 10 years. Tax rate 25%, $r_f = 5\%$.

@solution
1. $I = 0.06 \times 500 = €30$m.
2. Shield $= 0.25 \times 30 = €7.5$m per year.
3. $PV = \frac{7.5}{0.05}\left(1 - 1.05^{-10}\right) = €57.91$m.
4. If the debt were permanent: $7.5 / 0.05 = €150$m.

@answer
€7.5m per year, PV €57.91m (€150m if permanent).

@pitfalls
- Including the principal repayment in the tax shield.
- Discounting at the coupon rate or the WACC instead of $r_f$ when payments are risk-free.
- Using the perpetuity formula for debt that is repaid after $N$ years.
- Forgetting to discount the second phase back over the first phase.
`,

  'L2.income': ex`
@task
You get EBIT, interest and the tax rate (sometimes with a cap on deductible interest as a percentage of EBIT). You are asked for net income with and without leverage, the total paid to all investors, the tax savings, the allowed deduction or taxes.

@idea
Debt holders are paid before tax, equity holders after tax. With leverage the government takes less, so **the total paid to all investors rises by the tax shield** $\tau_c \times$ deductible interest:

$$\text{To all investors} = \text{Interest} + (EBIT - \text{Interest})(1 - \tau_c) = EBIT(1-\tau_c) + \tau_c \cdot \text{Interest}$$

With an interest limit, only interest up to the cap (e.g. 30% of EBIT) is deductible this year: deduction $= \min(\text{Interest}, \text{cap})$.

@steps
1. Without leverage: $NI = EBIT(1 - \tau_c)$.
2. With leverage (fully deductible): $NI = (EBIT - \text{Int})(1 - \tau_c)$.
3. To all investors $= NI + \text{Int}$; the gain over no debt is $\tau_c \times \text{Int}$.
4. With a cap: deduction $= \min(\text{Int}, \text{limit} \times EBIT)$; taxes $= (EBIT - \text{deduction})\tau_c$; $NI = EBIT - \text{Int} - \text{taxes}$; savings $= \tau_c \times$ deduction.

@example
(a) EBIT €1,000m, interest €200m, tax 30%. (b) Same EBIT, interest €400m, deduction capped at 30% of EBIT.

@solution
1. (a) $NI = (1{,}000 - 200)\times 0.7 = 560$; without debt $700$.
2. (a) To all investors $= 560 + 200 = 760$; gain $= 0.3 \times 200 = 60$.
3. (b) Cap $= 0.3 \times 1{,}000 = 300$; deduction $= \min(400, 300) = 300$.
4. (b) Taxes $= (1{,}000 - 300) \times 0.3 = 210$; $NI = 1{,}000 - 400 - 210 = 390$; savings $= 0.3 \times 300 = 90$.

@answer
(a) Net income €560m, €760m to all investors, tax shield €60m. (b) Deduction €300m, taxes €210m, net income €390m, savings €90m.

@pitfalls
- Reporting net income as the total to investors; add the interest paid to debt holders.
- Deducting the full interest when a cap applies.
- In the cap case, subtracting only the deductible interest when computing net income; all interest is paid.
`,

  'L2.recapTax': ex`
@task
An all-equity firm announces it will borrow permanently and buy back shares, with corporate taxes as the only imperfection. You are asked for the PV of the tax shield, firm and equity value, the share price, the shares repurchased, and in extensions the shield with personal taxes, distress costs implied by a lower price, or the tax rate implied by the price reaction.

@idea
With permanent debt the tax shield is worth $\tau_c D$, so $V_L = V_U + \tau_c D$. When the recap is **announced**, the price rises immediately so that all existing shareholders share the gain; the buyback then happens at the new price:

$$P_1 = \frac{V_U + \tau_c D}{N}, \qquad \text{shares repurchased} = D / P_1, \qquad E = V_L - D$$

With personal taxes the shield is $\tau^* D$ with $\tau^* = 1 - \frac{(1-\tau_c)(1-\tau_e)}{1-\tau_i}$. If the price rises less than predicted, the gap times the shares is the PV of distress costs the market expects.

@steps
1. $V_U = N \times P_0$; PV(shield) $= \tau_c D$.
2. $V_L = V_U + \tau_c D$; $P_1 = V_L / N$.
3. Shares bought back $= D / P_1$; equity after $= V_L - D$.
4. Implied tax rate from a price jump: $\tau_c = N(P_1 - P_0)/D$.
5. Personal taxes: shield $= \tau^* D$. Distress costs: $(P_1 - P_{actual}) \times N$.

@example
20 million shares at €50, no debt, tax rate 25%. The firm borrows €200m permanently to buy back shares.

@solution
1. $V_U = 1{,}000$; shield $= 0.25 \times 200 = 50$.
2. $V_L = 1{,}050$; $P_1 = 1{,}050/20 = €52.50$.
3. Repurchase $200 / 52.50 = 3.81$ million shares; equity $= 1{,}050 - 200 = €850$m.
4. With $\tau_i = 30\%$, $\tau_e = 20\%$: $\tau^* = 1 - \frac{0.75 \times 0.8}{0.7} = 14.29\%$, shield $= €28.57$m.
5. If the price only rose to €51.50: distress costs $= (52.50 - 51.50) \times 20 = €20$m.

@answer
Share price €52.50, 3.81 million shares repurchased, equity €850m, firm value €1,050m.

@pitfalls
- Buying back shares at the old price; the price adjusts on announcement.
- Dividing the gain over the remaining shares only; all original shareholders share it.
- Using $\tau_c$ instead of $\tau^*$ once personal taxes are introduced.
`,

  'L2.target': ex`
@task
Free cash flow grows at a constant rate forever and the firm keeps a constant D/E. You know $r_E$, $r_D$ and $\tau_c$. You are asked for the pretax and after-tax WACC, unlevered and levered value, the tax shield and the debt.

@idea
When a firm keeps a target leverage ratio, the tax shield is captured by discounting free cash flow at the **after-tax WACC**:

$$r_{wacc} = \frac{E}{V} r_E + \frac{D}{V} r_D (1 - \tau_c), \qquad V_L = \frac{FCF_1}{r_{wacc} - g}$$

The unlevered value uses the **pretax WACC** ($= r_U$ for a constant ratio), $\frac{E}{V} r_E + \frac{D}{V} r_D$. The difference is the value of the tax shield.

@steps
1. Weights from D/E: $D/V = \frac{D/E}{1 + D/E}$, $E/V = \frac{1}{1 + D/E}$.
2. Pretax WACC $= \frac{E}{V}r_E + \frac{D}{V}r_D$; $V_U = FCF_1/(\text{pretax} - g)$.
3. After-tax WACC $= \frac{E}{V}r_E + \frac{D}{V}r_D(1-\tau_c)$; $V_L = FCF_1/(\text{WACC} - g)$.
4. PV(tax shield) $= V_L - V_U$; debt $= V_L \times D/V$.

@example
FCF next year €10m, growth 2%, $r_E = 10\%$, $r_D = 5\%$, $\tau_c = 25\%$, D/E = 1.

@solution
1. $D/V = E/V = 0.5$.
2. Pretax WACC $= 0.5 \times 10\% + 0.5 \times 5\% = 7.5\%$; $V_U = 10 / 0.055 = 181.82$.
3. WACC $= 0.5 \times 10\% + 0.5 \times 5\% \times 0.75 = 6.875\%$; $V_L = 10 / 0.04875 = 205.13$.
4. Shield $= 205.13 - 181.82 = 23.31$; debt $= 0.5 \times 205.13 = 102.56$.

@answer
Tax shield €23.31m (levered value €205.13m, unlevered €181.82m).

@pitfalls
- Using D/E as the debt weight; the weight is D/V.
- Using the before-tax cost of debt in the after-tax WACC (that gives $V_U$).
- Using $\tau_c D$ for the shield; that is for permanent fixed debt, not a constant ratio.
`,

  'L2.personal': ex`
@task
You get the corporate tax rate and personal tax rates on interest and equity income (sometimes split into dividends and capital gains with a payout ratio). You are asked what investors keep from €1 of EBIT, the effective tax advantage of debt $\tau^*$, the levered value, or the interest tax rate at which debt has no advantage.

@idea
Compare what reaches investors from €1 of EBIT:

- Paid as **interest**: no corporate tax, then personal tax on interest: $1 - \tau_i$.
- Paid to **equity**: corporate tax, then personal tax on equity income: $(1 - \tau_c)(1 - \tau_e)$.

The effective tax advantage of debt is the relative gain:

$$\tau^* = 1 - \frac{(1-\tau_c)(1-\tau_e)}{1-\tau_i}, \qquad V_L = V_U + \tau^* D$$

If equity income is taxed as a mix, $\tau_e = \text{payout}\times\tau_d + (1 - \text{payout})\times\tau_g$. Debt has no advantage when $1 - \tau_i = (1-\tau_c)(1-\tau_e)$.

@steps
1. If needed, $\tau_e$ = payout-weighted average of dividend and capital gains tax.
2. To debt holders: $1 - \tau_i$; to equity holders: $(1-\tau_c)(1-\tau_e)$.
3. $\tau^* = 1 - \frac{(1-\tau_c)(1-\tau_e)}{1-\tau_i}$.
4. $V_L = V_U + \tau^* D$ for permanent debt.
5. Break-even: $\tau_i = 1 - (1-\tau_c)(1-\tau_e)$.

@example
$\tau_c = 25\%$, $\tau_i = 35\%$, $\tau_e = 20\%$. $V_U = €1{,}000$m, the firm adds €300m of permanent debt.

@solution
1. To debt holders: $1 - 0.35 = €0.65$.
2. To equity holders: $0.75 \times 0.80 = €0.60$.
3. $\tau^* = 1 - 0.60/0.65 = 7.69\%$.
4. $V_L = 1{,}000 + 0.0769 \times 300 = €1{,}023.08$m.
5. Break-even $\tau_i = 1 - 0.60 = 40\%$.

@answer
$\tau^* = 7.69\%$; levered value €1,023.08m; debt loses its advantage at a 40% tax on interest.

@pitfalls
- Using $\tau_c$ as the advantage when personal tax rates differ.
- Putting $\tau_i$ in the numerator or forgetting the corporate tax on equity income.
- If $\tau_e = \tau_i$, $\tau^* = \tau_c$; if equity is taxed less than interest, $\tau^* < \tau_c$, not greater.
`,

  'L2.hamada': ex`
@task
A private firm values a division using a listed comparable. You get the comparable's equity beta and D/E, the division's target leverage, the tax rate, $r_f$, the market premium and the borrowing rate. You are asked for the unlevered beta, the division's levered beta, its equity cost and its WACC.

@idea
Unlever the comparable to get the business risk, then relever at the division's own leverage. With corporate taxes and risk-free (zero-beta) debt the formula sheet gives

$$\beta_L = \beta_U \left(1 + (1-\tau_c)\frac{D}{E}\right)$$

The WACC then uses the after-tax cost of debt: $r_{wacc} = \frac{E}{V}r_E + \frac{D}{V}r_D(1-\tau_c)$.

@steps
1. $\beta_U = \beta_{L,comp} / \left(1 + (1-\tau_c) (D/E)_{comp}\right)$.
2. Convert the target to D/E if it is given as D/V: $D/E = \frac{D/V}{1 - D/V}$.
3. $\beta_L = \beta_U (1 + (1-\tau_c)(D/E)_{target})$.
4. $r_E = r_f + \beta_L \times MRP$.
5. WACC $= \frac{r_E + (D/E) r_D (1-\tau_c)}{1 + D/E}$.

@example
Comparable: equity beta 1.2, D/E 0.5. Division: D/E 0.8. Tax 25%, $r_f = 3\%$, MRP 6%, borrowing rate 4.5%.

@solution
1. $\beta_U = 1.2 / (1 + 0.75 \times 0.5) = 0.8727$.
2. Target already given as D/E = 0.8.
3. $\beta_L = 0.8727 \times (1 + 0.75 \times 0.8) = 1.3964$.
4. $r_E = 3\% + 1.3964 \times 6\% = 11.38\%$.
5. WACC $= (11.38\% + 0.8 \times 4.5\% \times 0.75)/1.8 = 7.82\%$.

@answer
Unlevered beta 0.873, levered beta 1.396, equity cost 11.38%, WACC 7.82%.

@pitfalls
- Relevering with the comparable's D/E instead of the division's.
- Forgetting $(1-\tau_c)$ in the beta formula or in the WACC.
- Plugging D/V into the formula as if it were D/E.
`,

  'L2.concept': ex`
@task
Concept questions on debt and taxes: true/false, find the false (or true) statement, or the best answer to a short question.

@idea
- Interest tax shield $= \tau_c \times$ interest; principal repayments give none.
- Permanent risk-free debt: PV(shield) $= \tau_c D$, independent of the interest rate.
- With a target D/E, the shield enters through the **after-tax WACC** (cost of debt times $1-\tau_c$).
- In a recap, the price rises on announcement and **all original shareholders** capture the shield, including those who sell.
- Personal taxes: $\tau^* = 1 - \frac{(1-\tau_c)(1-\tau_e)}{1-\tau_i}$. Equal personal rates give $\tau^* = \tau_c$; lower taxes on equity make $\tau^* < \tau_c$.
- The shield needs taxable earnings: optimal from a tax view is interest $=$ EBIT; excess interest (or interest above a deduction cap) gives no immediate shield.

@steps
1. Identify the claim: size of the shield, who gets it, which discount rate, the effect of personal taxes.
2. Check it against the rules above.
3. Pay attention to direction words ("exceeds", "increases with", "only").
4. For four options, mark each and pick the odd one out.

@example
True or false? "With corporate taxes as the only imperfection, a leveraged recapitalization leaves the share price unchanged."

@solution
1. The claim is about the share price in a recap with taxes.
2. The firm gains a tax shield $\tau_c D$, which raises equity value.
3. The price rises on the announcement by $\tau_c D / N$.

@answer
False. The share price rises because shareholders capture the value of the interest tax shield.

@pitfalls
- "WACC with the before-tax cost of debt captures the tax shield": false.
- "Only shareholders who keep their shares benefit": false; all original shareholders benefit.
- "Lower equity taxes make debt's advantage larger than $\tau_c$": false, it becomes smaller.
- "PV of the shield on permanent debt grows with the interest rate": false, it is $\tau_c D$.
`,
};
