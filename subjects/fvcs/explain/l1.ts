import { ex, type ExplainMap } from '@/lib/explain';

export const L1: ExplainMap = {
  'L1.project': ex`
@task
A one-year project pays a low or a high cash flow. You know the probabilities, the project's cost of capital $r_U$ (or the risk premium over $r_f$), the investment and a loan at the risk-free rate. You are asked for the NPV, the value of unlevered equity, the levered equity's payoffs, its value and its expected and realised returns, or the debt that produces a given expected equity return.

@idea
**MM I**: in a perfect market, financing does not change the value of the project. The project is worth its expected cash flow discounted at $r_U$, whoever owns it. With debt, the same cash flows are only split differently: debt holders take a fixed repayment $D(1+r_f)$, equity holders take the rest. So

$$E = V_U - D, \qquad r_E = \frac{\text{expected equity payoff}}{E} - 1 = r_U + \frac{D}{E}(r_U - r_f)$$

The second form (MM II) shows that leverage raises the expected return on equity because equity bears all the risk on a smaller base.

@steps
1. Expected cash flow $= p \cdot H + (1-p) \cdot L$; $V_U = \frac{\text{expected cash flow}}{1 + r_U}$ (with $r_U = r_f +$ premium).
2. NPV $= V_U - I$. The unlevered equity can be sold for $V_U$.
3. Debt repayment $= D(1+r_f)$; equity payoffs are $H - D(1+r_f)$ and $L - D(1+r_f)$.
4. Levered equity value $E = V_U - D$.
5. Expected return $r_E$ from the expected payoff divided by $E$ (or MM II). Realised return in a state $=$ payoff$/E - 1$.
6. Debt for a target $r_E^*$: $\frac{D}{E} = \frac{r_E^* - r_U}{r_U - r_f}$, then $D = V_U \cdot \frac{D/E}{1 + D/E}$.

@example
A project costs €80,000 and pays €90,000 or €150,000 in one year, equally likely. The cost of capital is 15%, the risk-free rate 5%. The firm borrows €60,000 at 5% and raises the rest with equity.

@solution
1. Expected cash flow $= 0.5 \times 90{,}000 + 0.5 \times 150{,}000 = 120{,}000$; $V_U = 120{,}000 / 1.15 = 104{,}347.83$.
2. NPV $= 104{,}347.83 - 80{,}000 = 24{,}347.83$.
3. Repayment $60{,}000 \times 1.05 = 63{,}000$; equity gets 27,000 (low) or 87,000 (high).
4. $E = 104{,}347.83 - 60{,}000 = 44{,}347.83$.
5. $r_E = 57{,}000 / 44{,}347.83 - 1 = 28.53\%$; check: $15\% + \frac{60{,}000}{44{,}347.83}(15\% - 5\%) = 28.53\%$. In the low state: $27{,}000 / 44{,}347.83 - 1 = -39.12\%$.
6. For $r_E = 25\%$: $D/E = (25\% - 15\%) / 10\% = 1$, so $D = 104{,}347.83 / 2 = 52{,}173.91$.

@answer
NPV €24,347.83; levered equity €44,347.83 with an expected return of 28.53% (−39.12% in the low state).

@pitfalls
- Discounting the equity payoffs at $r_U$ to value levered equity; use $E = V_U - D$ and then derive $r_E$.
- Using the investment $I$ instead of $V_U$ as the firm value ($V_U - I$ is the NPV).
- Forgetting interest: debt holders receive $D(1+r_f)$, not $D$.
- Thinking leverage changes the total value of the project in a perfect market.
`,

  'L1.mm2': ex`
@task
A firm with a given debt-equity ratio, debt cost and equity cost changes its leverage (repurchase with debt or repay debt with equity), and the cost of debt changes too. You are asked for the WACC before and after, the new equity cost of capital, or the leverage that gives a target equity cost.

@idea
In a perfect market the WACC equals the unlevered cost of capital $r_U$ and does not depend on leverage (MM I). It is the cost of the firm's assets:

$$r_U = \frac{E}{D+E} r_E + \frac{D}{D+E} r_D = \frac{r_E + (D/E)\, r_D}{1 + D/E}$$

Equity holders bear the leverage risk, so the equity cost moves with the debt-equity ratio (MM II), using the **new** debt cost:

$$r_E = r_U + \frac{D}{E}(r_U - r_D)$$

@steps
1. Compute $r_U$ (= the WACC) from the current $D/E$, $r_E$, $r_D$. If given values $E$ and $D$, use those weights.
2. New $D/E$: from the plan, or $D_1 = D_0 + X$, $E_1 = E_0 - X$ when $X$ of debt buys back shares.
3. New $r_E = r_U + (D/E)_{new} \times (r_U - r_{D,new})$.
4. The WACC after the transaction is still $r_U$.
5. Target leverage for an equity cost $r_E^*$: $D/E = (r_E^* - r_U)/(r_U - r_D)$.

@example
D/E is 0.5, debt cost 5%, equity cost 12%. The firm borrows to buy back shares so that D/E becomes 1.0; the debt cost rises to 5.5%. Perfect markets.

@solution
1. $r_U = (12\% + 0.5 \times 5\%)/1.5 = 9.667\%$. This is the WACC today.
2. New $D/E = 1.0$.
3. $r_E = 9.667\% + 1.0 \times (9.667\% - 5.5\%) = 13.83\%$.
4. WACC after $= 9.667\%$, unchanged.

@answer
WACC 9.67% before and after; new equity cost of capital 13.83%.

@pitfalls
- Letting the WACC fall because "debt is cheaper"; in a perfect market the higher equity cost exactly offsets it.
- Using the old debt cost in MM II after the debt cost has changed.
- Mixing D/E and D/V: if debt is 40% of value, $D/E = 0.4/0.6$.
- Using book values when market values are given.
`,

  'L1.recap': ex`
@task
An all-equity firm borrows and uses the money to repurchase shares. You are asked how many shares are bought back (or how much was borrowed), the share price, equity value and D/E afterwards, the new equity cost of capital and the WACC.

@idea
In a perfect market, borrowing at a fair rate and buying back shares at a fair price is a zero-NPV transaction. The firm's value does not change, so the **share price does not change** either: the firm pays the old price for every share. The debt simply replaces part of the equity:

$$E_{after} = V - D, \qquad \text{shares repurchased} = D / P$$

With more leverage the remaining equity is riskier, so its cost of capital rises by MM II, while the WACC stays at $r_U$.

@steps
1. Firm value $V$ = shares $\times$ price (all equity).
2. Shares repurchased $= D / P$; the price stays $P$.
3. Equity after $= V - D$; $D/E = D/(V-D)$.
4. $r_E = r_U + \frac{D}{E}(r_U - r_D)$; the WACC is still $r_U$.
5. Reverse variant: if the remaining shares are given, borrowing $=$ (shares bought back) $\times P$.

@example
50 million shares at €20, no debt, equity cost 10%. The firm borrows €300m at 5% and buys back shares. Perfect markets.

@solution
1. $V = 50 \times 20 = €1{,}000$m.
2. Shares repurchased $= 300 / 20 = 15$ million at €20.
3. Equity $= 1{,}000 - 300 = €700$m (35 million shares × €20); $D/E = 300/700 = 0.4286$.
4. $r_E = 10\% + 0.4286 \times (10\% - 5\%) = 12.14\%$; WACC $= 10\%$.

@answer
15 million shares bought back at an unchanged €20; equity €700m; equity cost 12.14%; WACC 10%.

@pitfalls
- Raising the share price because EPS or the expected return rises; with perfect markets the price is unchanged.
- Computing D/E with the old equity value ($D/V$ instead of $D/(V-D)$).
- Changing the WACC after the recap.
`,

  'L1.eps': ex`
@task
An all-equity firm with constant EBIT paid out as dividends considers borrowing to buy back shares (no taxes). You are asked for the unlevered cost of capital, EPS with and without leverage, the new equity cost of capital, the share price, and EPS in a bad year.

@idea
Leverage raises expected EPS when the firm earns more on its assets than it pays on debt, but it also makes EPS more volatile. In a perfect market the higher expected EPS is exactly offset by the higher required return, so the **share price does not change**. Indeed, the new EPS divided by the price equals the new equity cost of capital.

With EBIT paid out forever: $r_U = EBIT / (\text{shares} \times P)$.

@steps
1. $r_U = EBIT / (N \times P)$; $EPS_0 = EBIT / N$.
2. Shares bought back $n = D / P$.
3. $EPS_1 = (EBIT - r_D D) / (N - n)$.
4. $r_E = r_U + \frac{D}{E}(r_U - r_D)$ with $E = N P - D$. Check: $EPS_1 / P = r_E$.
5. Share price after $= P$ (unchanged).
6. Bad year: $(EBIT_{low} - r_D D)/(N - n)$.

@example
EBIT €12m forever, 10 million shares at €10, no debt. Borrow €30m at 6% and buy back shares.

@solution
1. $r_U = 12 / 100 = 12\%$; $EPS_0 = 12 / 10 = €1.20$.
2. $n = 30 / 10 = 3$ million shares.
3. $EPS_1 = (12 - 0.06 \times 30)/7 = 10.2/7 = €1.457$.
4. $E = 100 - 30 = 70$; $r_E = 12\% + \frac{30}{70}(12\% - 6\%) = 14.57\%$, and $1.457/10 = 14.57\%$.
5. Price stays €10.
6. If EBIT is only €6m: $(6 - 1.8)/7 = €0.60$.

@answer
EPS rises from €1.20 to €1.46, the equity cost from 12% to 14.57%, the price stays at €10.

@pitfalls
- Concluding that a higher EPS means a higher share price.
- Forgetting to reduce the number of shares after the buyback.
- Subtracting the debt amount instead of the interest $r_D \times D$ from EBIT.
`,

  'L1.beta': ex`
@task
You know the equity beta, the debt beta and the D/E ratio. You are asked for the unlevered (asset) beta, the unlevered cost of capital, and the equity beta, equity cost and WACC after a change in D/E.

@idea
The asset beta is the value-weighted average of the betas of the claims on the assets; in a perfect market it does not depend on leverage:

$$\beta_U = \frac{E}{D+E}\beta_E + \frac{D}{D+E}\beta_D = \frac{\beta_E + (D/E)\beta_D}{1 + D/E}$$

Re-levering inverts this: $\beta_E = \beta_U + \frac{D}{E}(\beta_U - \beta_D)$. Costs of capital follow from the CAPM, $r = r_f + \beta \times MRP$.

@steps
1. $\beta_U = (\beta_E + (D/E)\beta_D)/(1 + D/E)$.
2. $r_U = r_f + \beta_U \times MRP$ (MRP $=$ market return $- r_f$). This is also the WACC, before and after.
3. New $\beta_E = \beta_U + (D/E)_{new}(\beta_U - \beta_D)$.
4. New $r_E = r_f + \beta_E \times MRP$.

@example
Equity beta 1.5, debt beta 0.2, D/E 0.5, $r_f = 3\%$, MRP 6%. The firm moves to D/E 1.0.

@solution
1. $\beta_U = (1.5 + 0.5 \times 0.2)/1.5 = 1.0667$.
2. $r_U = 3\% + 1.0667 \times 6\% = 9.40\%$.
3. $\beta_E = 1.0667 + 1.0 \times (1.0667 - 0.2) = 1.9333$.
4. $r_E = 3\% + 1.9333 \times 6\% = 14.60\%$; WACC stays 9.40%.

@answer
Asset beta 1.07, new equity beta 1.93, equity cost 14.6%, WACC 9.4%.

@pitfalls
- Ignoring the debt beta when it is not zero.
- Using the market return instead of the market risk premium in the CAPM.
- Using the tax-adjusted (Hamada) formula; here markets are perfect.
`,

  'L1.homemade': ex`
@task
A firm's cash flow next year is high or low. An investor wants a position the firm does not offer: levered equity when the firm is unlevered (borrow on their own), or unlevered exposure when the firm is levered (buy debt and equity). You are asked for the amounts to borrow or invest, the investor's own money and the payoffs.

@idea
MM's argument: investors can create any leverage themselves, so they will not pay extra for the firm's choice.

- **Homemade leverage**: to hold a fraction $\alpha$ of the levered equity of a firm with debt $D$, buy $\alpha$ of the unlevered firm and borrow $\alpha D$ personally. Own money $= \alpha(V - D)$; payoff $= \alpha(CF - D(1+r_f))$.
- **Undoing leverage**: to get $\alpha$ of the total cash flow of a levered firm, buy $\alpha$ of its equity ($\alpha E$) **and** $\alpha$ of its debt ($\alpha D$). Payoff $= \alpha \times CF$, cost $= \alpha V$.

@steps
1. Identify which case you are in (unlevered firm → borrow; levered firm → buy debt).
2. Equity of the desired firm: $E = V - D$.
3. Borrow (or buy debt) $\alpha D$; invest own money $\alpha E$.
4. Payoff in a state: levered case $\alpha(CF - D(1+r_f))$, unlevered case $\alpha \cdot CF$.
5. Convert € million to euros if asked in full euros.

@example
A firm is all equity, worth €100m, cash flow €150m or €70m next year, $r_f = 5\%$. An investor wants 2% of the equity the firm would have if it had borrowed €40m.

@solution
1. Unlevered firm, investor wants leverage: homemade borrowing.
2. Equity of the levered firm would be $100 - 40 = 60$.
3. Borrow $2\% \times 40 = €0.8$m (€800,000); own money $2\% \times 60 = €1.2$m.
4. Low state: $2\% \times (70 - 42) = €0.56$m; high state: $2\% \times (150 - 42) = €2.16$m.

@answer
Borrow €800,000, invest €1,200,000 of own money; payoff €560,000 (low) or €2,160,000 (high).

@pitfalls
- Forgetting the interest when computing payoffs: repay $\alpha D(1+r_f)$.
- To undo leverage, buying only equity; you must also buy the same fraction of the debt.
- Answering in € million when the question asks in euros.
`,

  'L1.concept': ex`
@task
Concept questions on capital structure in a perfect market: true/false, find the false (or true) statement among four, or pick the best answer to a short question.

@idea
Everything follows from MM:

- **MM I**: firm value is the value of the assets' cash flows and does not depend on financing. Recaps at fair prices are zero-NPV; the share price does not change.
- **MM II**: $r_E = r_U + \frac{D}{E}(r_U - r_D)$. Leverage raises equity risk and return **even without default risk**. The WACC stays at $r_U$.
- Leverage can raise expected EPS but not the price; EPS becomes riskier.
- The asset (unlevered) beta does not change with leverage; equity beta does.
- Homemade leverage: investors can borrow or lend themselves, so they pay nothing extra for the firm's leverage.
- Market-value balance sheets include intangibles; they are not historical cost.

@steps
1. Ask: does the statement claim financing changes *total value* or the *WACC*? In a perfect market that is false.
2. Does it claim leverage changes *equity* risk, return or beta? That is true.
3. Check conditions such as "only if debt is risky" — MM I and II hold with risk-free debt too.
4. For four options, mark each one and pick the odd one out.

@example
True or false? "In a perfect capital market, a firm can lower its WACC by substituting cheaper debt for more expensive equity."

@solution
1. The claim is about the WACC.
2. Replacing equity by debt raises $r_E$ by MM II, exactly offsetting the cheaper debt.
3. The WACC therefore stays at $r_U$.

@answer
False. In a perfect market the WACC is independent of capital structure.

@pitfalls
- "Higher EPS → higher share price": false in a perfect market.
- "Leverage raises the cost of equity only if debt is risky": false.
- "The unlevered beta rises with debt": false, only the equity beta rises.
- "Shareholders who keep their shares gain in a recap": false without imperfections.
`,
};
