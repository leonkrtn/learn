import { ex, type ExplainMap } from '@/lib/explain';

export const L2: ExplainMap = {
  'L2.riskyDebt': ex`
@task
A new firm finances a one-year project entirely with zero-coupon bonds. The project pays a high or a low amount, uncorrelated with the market. You are asked for the face value, the yield to maturity, the default spread, the matching credit rating from a table, and the value of equity.

@idea
Because the cash flows have zero beta, investors require only the risk-free rate on their **expected** payoff. In the low state the firm cannot pay the face value $F$, so bondholders take everything ($L$). Fair pricing therefore means

$$I = \frac{p F + (1-p) L}{1 + r_f}$$

The **yield** is computed on the promised payment, $y = F/I - 1$; it exceeds $r_f$ because of the default risk. The **default spread** $y - r_f$ is matched to the nearest rating. Equity gets $H - F$ in the high state only.

@steps
1. Solve for $F$: $F = \dfrac{I(1+r_f) - (1-p)L}{p}$ (valid when $L < F$).
2. Yield $= F/I - 1$.
3. Spread $=$ yield $- r_f$; pick the rating with the closest spread.
4. Equity $= \dfrac{p (H - F)}{1 + r_f}$ (also $=$ project value $- I$).

@example
Investment €60m; payoff €100m or €55m, equally likely; $r_f = 3\%$; no bankruptcy costs.

@solution
1. $F = (60 \times 1.03 - 0.5 \times 55)/0.5 = (61.8 - 27.5)/0.5 = €68.6$m.
2. Yield $= 68.6/60 - 1 = 14.33\%$.
3. Spread $= 14.33\% - 3\% = 11.33\%$, closest to CCC (10%).
4. Equity $= 0.5 \times (100 - 68.6)/1.03 = €15.24$m.

@answer
Face value €68.6m, yield 14.33%, spread 11.33% (CCC), equity €15.24m.

@pitfalls
- Setting $F = I(1+r_f)$ as if the debt were risk-free.
- Calling the yield the expected return; the expected return is $r_f$ here.
- Giving equity holders something in the low state.
`,

  'L2.seniority': ex`
@task
After financing a first project with zero-coupon bonds, the firm adds a second project financed with **subordinated** bonds maturing at the same time. You are asked for the original face value and equity, the junior face value, the new value and rating of the senior bonds, and the new equity value.

@idea
Seniority decides who is paid first in the low state: **senior** debt up to its face value, then **junior** debt from what is left, then equity. The second project raises the low-state cash flow, and the senior bondholders capture that first — their bonds become safer and **gain value** without paying anything. Junior bondholders therefore need a high face value to break even, and part of the new project's value leaks to the senior bonds.

@steps
1. Original debt: $F = \frac{I(1+r_f) - (1-p)L}{p}$; equity $= p(H-F)/(1+r_f)$.
2. New low state $L_2 = L + \Delta L$, high state $H_2 = H + \Delta H$.
3. Junior gets $\max(L_2 - F, 0)$ in the low state; solve $I_2(1+r_f) = p F_2 + (1-p)\max(L_2 - F, 0)$ for $F_2$.
4. Senior value $= [pF + (1-p)\min(F, L_2)]/(1+r_f)$; yield and spread give the new rating.
5. Equity $= [p(H_2 - F - F_2) + (1-p)\max(L_2 - F - F_2, 0)]/(1+r_f)$.

@example
As before: €60m project, €100m or €55m, 50/50, $r_f = 3\%$, $F = 68.6$. A second project costs €10m and adds €20m (high) or €8m (low), financed with junior bonds.

@solution
1. Original: $F = 68.6$, equity $= 15.24$.
2. $L_2 = 63$, $H_2 = 120$.
3. Junior gets $\max(63 - 68.6, 0) = 0$ in the low state: $10.3 = 0.5 F_2 \Rightarrow F_2 = €20.6$m.
4. Senior $= (0.5 \times 68.6 + 0.5 \times 63)/1.03 = €63.88$m; yield $68.6/63.88 - 1 = 7.38\%$, spread 4.38% → B (5%).
5. Equity $= 0.5 \times (120 - 68.6 - 20.6)/1.03 = €14.95$m.

@answer
Junior face value €20.6m; senior bonds rise to €63.88m (rating B instead of CCC); equity falls to €14.95m.

@pitfalls
- Paying junior debt before senior debt in the low state.
- Keeping the old value of the senior bonds; they gain from the higher low-state cash flow.
- Valuing the senior bonds against the new investment rather than with their unchanged face value.
`,

  'L2.straight': ex`
@task
An all-equity firm with certain existing cash flows invests in a project with three scenarios, financed with straight debt; discount rate zero. You are asked for the share price before, the project NPV, the face value, the price of a €100 bond, payoffs per share in each scenario, and the share price after the announcement.

@idea
Firm value next year is existing assets plus the project's cash flow in each scenario. Debt is fairly priced: its **expected** payoff must equal the amount raised (discount rate zero). Where the firm cannot pay $F$, debt holders get the whole firm. Shareholders keep the rest. Because the debt is fairly priced in a perfect market, **shareholders capture the entire NPV**: the new price is $(A + NPV)/n$.

@steps
1. Price before $= A/n$; NPV $= \sum p_i CF_i - I$.
2. Firm values $V_i = A + CF_i$.
3. Face value from $\sum p_i \min(F, V_i) = I$; usually only the bad state defaults, so $F = \frac{I - p_{bad} V_{bad}}{1 - p_{bad}}$.
4. Bond price per €100 face $= 100 \times I/F$.
5. Payoff per share $= \max(V_i - F, 0)/n$; price $= \sum p_i \times$ payoff.

@example
Existing assets €100m, 20 million shares. Project costs €120m and pays €250m (30%), €100m (60%) or €0 (10%).

@solution
1. Price before $= €5.00$; NPV $= 75 + 60 - 120 = €15$m.
2. $V = 350, 200, 100$.
3. Bad state defaults: $0.9F + 0.1 \times 100 = 120 \Rightarrow F = €122.22$m.
4. Bond price $= 100 \times 120/122.22 = €98.18$.
5. Per share: $(350 - 122.22)/20 = 11.39$, $(200 - 122.22)/20 = 3.89$, $0$; price $= 0.3 \times 11.39 + 0.6 \times 3.89 = 5.75 = (100 + 15)/20$, i.e. €5.75.

@answer
Face value €122.22m, bond price €98.18, share price rises from €5.00 to €5.75.

@pitfalls
- Assuming the debt is repaid in every state.
- Forgetting the existing assets in the firm value.
- Discounting when the question says the discount rate is zero.
`,

  'L2.convertible': ex`
@task
Same setting, but the project is financed with a convertible bond with principal $K$ that can instead be converted into $x$ new shares. You are asked for $x$, the bond price and conversion ratio, payoffs per share, the original shareholders' stake, the share price, and comparisons with straight debt (also with bankruptcy costs).

@idea
At maturity bondholders take the better of the principal and their share of the firm. With $q = x/(n+x)$ their payoff is $\max(\min(K, V), qV)$. Fair pricing again requires the expected payoff to equal $I$; you find $q$ by guessing in which states they convert and checking. Because both straight and convertible debt are fairly priced, the **share price is the same** with either. A convertible with $K$ below the bad-state value **never defaults**, so bankruptcy costs would only hurt with straight debt.

@steps
1. Guess the conversion states (where $qV > K$), write $\sum_{conv} p_i q V_i + \sum_{no} p_i \min(K, V_i) = I$, solve for $q$, and check the guess.
2. $x = q n / (1 - q)$.
3. Bond price per €100 $= 100 \times I/K$; conversion ratio $= x / (K/100)$ shares per bond.
4. Payoff per share: converting states $V(1-q)/n$; otherwise $(V - \min(K,V))/n$.
5. Share price $= \sum p_i \times$ payoff; original holders own $n/(n+x)$ where bonds convert.

@example
Existing assets €100m, 20 million shares; project €120m paying €250m/€100m/€0 with 30%/60%/10%. Convertible principal €80m.

@solution
1. Try conversion in good and mediocre: $0.3 \times 350q + 0.6 \times 200q + 0.1 \times 80 = 120 \Rightarrow 225q = 112 \Rightarrow q = 0.4978$. Check: $0.4978 \times 200 = 99.6 > 80$ ✓, $0.4978 \times 100 = 49.8 < 80$ ✓.
2. $x = 0.4978 \times 20/0.5022 = 19.82$m shares.
3. Bond price $= 100 \times 120/80 = €150$; ratio $= 19.82/0.8 = 24.78$ shares per bond.
4. Per share: $350 \times 0.5022/20 = 8.79$, $200 \times 0.5022/20 = 5.02$, $(100 - 80)/20 = 1.00$.
5. Price $= 0.3 \times 8.79 + 0.6 \times 5.02 + 0.1 \times 1.00 = €5.75$; original holders own 50.2% in the good state.

@answer
19.82 million conversion shares; share price €5.75, the same as with straight debt. Only straight debt can default, so bankruptcy costs would matter only there.

@pitfalls
- Not checking the conversion guess; if a state flips, solve again.
- Using $x/n$ instead of $x/(n+x)$ as the bondholders' share.
- Thinking the convertible changes the NPV or the share price in a perfect market.
`,

  'L2.concept': ex`
@task
Concept questions on debt financing: true/false, find the false (or true) statement, or the best short answer.

@idea
- Zero-beta risky debt is priced by discounting its **expected** payoff at $r_f$.
- Yield $= F/\text{price} - 1$ is a promised return; it is **not** the expected return. Default spread $=$ yield $- r_f$; higher spread → lower rating.
- Face value of risky debt is above $I(1+r_f)$.
- **Senior** debt is paid before junior debt; a new project financed with junior debt can make senior bonds more valuable.
- In a perfect market with fair prices, straight and convertible debt leave shareholders equally well off and they capture the whole NPV.
- Bankruptcy costs only matter for a security that can actually default.

@steps
1. Identify the claim: pricing, yield vs expected return, seniority or straight vs convertible.
2. Check it against the facts above.
3. Watch words like "always" and "only".
4. Pick the odd one out among four options.

@example
True or false? "The promised yield of a risky bond equals its expected return."

@solution
1. The yield uses the face value, paid only if there is no default.
2. Expected payoffs are lower than promised, so the expected return is lower.
3. With zero beta the expected return is $r_f$, below the yield.

@answer
False. The yield is the promised return; the expected return is lower.

@pitfalls
- "Junior debt is repaid before senior debt": false.
- "Convertibles always give a higher share price": false in a perfect market.
- "Face value $= I(1+r_f)$" for risky debt: false.
- "Bankruptcy costs matter only with convertibles": false — they matter for whichever security can default.
`,

  'PS2.yield': ex`
@task
A one-year zero-coupon bond is repaid in full with some probability; otherwise bondholders receive a recovery amount. Cash flows are uncorrelated with the market. You are asked for the bond price, its yield to maturity or its default spread (multiple choice).

@idea
Zero beta means the bond's **expected** payoff is discounted at the risk-free rate. The yield is what you earn if the bond pays its face value; the spread is the extra yield over $r_f$ that compensates for expected default losses:

$$B_0 = \frac{pF + (1-p)L}{1 + r_f}, \qquad y = \frac{F}{B_0} - 1, \qquad s = y - r_f$$

@steps
1. Expected payoff $= pF + (1-p)L$.
2. Price = expected payoff $/(1 + r_f)$.
3. Yield $= F/B_0 - 1$.
4. Spread $= y - r_f$.

@example
Face value €100m; repaid with probability 80%, otherwise bondholders get €60m. $r_f = 4\%$.

@solution
1. Expected payoff $= 0.8 \times 100 + 0.2 \times 60 = 92$.
2. $B_0 = 92/1.04 = €88.46$m.
3. $y = 100/88.46 - 1 = 13.04\%$.
4. $s = 13.04\% - 4\% = 9.04\%$.

@answer
Price €88.46m, yield 13.04%, default spread 9.04%.

@pitfalls
- Discounting the face value at $r_f$ (that prices a risk-free bond).
- Discounting the expected payoff at the yield or at $r_f$ plus the spread.
- Reporting the yield as the spread.
`,

  'PS2.bankruptcy': ex`
@task
An all-equity firm finances a project either with straight debt or with a convertible bond, both fairly priced. You are asked how introducing bankruptcy costs would affect the share price: not at all, with either security, only with straight debt or only with convertible debt.

@idea
Bankruptcy costs arise only when a security **defaults**. Shareholders bear their expected value, because fairly priced debt holders pay less upfront. So check, for each security, whether the firm can fail to pay it in the worst scenario:

- Straight debt with face value $F$ defaults if the bad-state firm value $V_{bad} < F$.
- A convertible with principal $K$ defaults only if $V_{bad} < K$; otherwise bondholders are paid or convert, never forcing bankruptcy.

@steps
1. Find the firm value in the bad scenario: $V_{bad}$ = existing assets + bad-state project cash flow.
2. Compare it with the straight debt's face value $F$.
3. Compare it with the convertible's principal $K$.
4. The price is affected for each security that can default.

@example
Existing assets €100m; the project pays €250m, €100m or €0. Straight debt has face value €122.22m; the convertible has a principal of €80m.

@solution
1. $V_{bad} = 100 + 0 = €100$m.
2. $100 < 122.22$: the straight debt defaults in the bad scenario.
3. $100 \geq 80$: the convertible is always repaid or converted.
4. Only the straight debt can trigger bankruptcy.

@answer
The share price would be affected only if the firm issued the straight debt.

@pitfalls
- Assuming debt holders bear bankruptcy costs; with fair pricing shareholders do.
- Comparing the principal with the expected firm value instead of the worst case.
- Thinking convertibles always default less: if $K > V_{bad}$, both default.
`,
};
