import { ex, type ExplainMap } from '@/lib/explain';

export const L3: ExplainMap = {
  'L3.effort': ex`
@task
An entrepreneur needs an investment; the firm's later value depends on her unobservable effort, which costs her $\kappa$. You are asked up to which $\kappa$ she chooses high effort with her own money, with outside equity (and the fraction investors need), and with debt (and the face value).

@idea
**Moral hazard**: she chooses high effort only if **her own** gain from it covers $\kappa$.

- **Own money**: she keeps the whole gain, $\kappa \leq E_{high} - E_{low}$.
- **Outside equity**: investors need $\alpha = I/E_{high}$ (priced assuming high effort). She keeps only $1-\alpha$ of the gain, so $\kappa \leq (1-\alpha)(E_{high} - E_{low})$.
- **Debt**: face value from $E_{high}[\min(F, V)] = I$. She keeps everything above $F$, so $\kappa \leq \sum (p_{high} - p_{low}) \max(V - F, 0)$.

Debt leaves her the full upside, so it usually supports high effort for larger effort costs than equity.

@steps
1. $E_{high} = \sum p_{high} V$, $E_{low} = \sum p_{low} V$.
2. Own money: $\kappa^* = E_{high} - E_{low}$.
3. Equity: $\alpha = I/E_{high}$; $\kappa^* = (1-\alpha)(E_{high} - E_{low})$.
4. Debt: solve $\sum p_{high}\min(F, V) = I$ for $F$.
5. $\kappa^* = \sum (p_{high} - p_{low})\max(V - F, 0)$.

@example
Investment €50m. The firm will be worth €120m or €20m. High effort: 75% / 25%; low effort: 30% / 70%. Discount rate zero.

@solution
1. $E_{high} = 90 + 5 = 95$; $E_{low} = 36 + 14 = 50$.
2. Own money: $\kappa \leq 45$.
3. $\alpha = 50/95 = 52.63\%$; $\kappa \leq 0.4737 \times 45 = 21.32$.
4. $0.75F + 0.25 \times 20 = 50 \Rightarrow F = €60$m.
5. $\kappa \leq (0.75 - 0.30) \times (120 - 60) = 27.00$.

@answer
High effort up to κ = €45m (own money), €21.32m (equity, α = 52.63%), €27m (debt, F = €60m).

@pitfalls
- Pricing the securities at low effort; investors believe she works hard.
- With debt, giving her a payoff in the state where $V < F$.
- Using $\alpha$ instead of $1 - \alpha$ as her share of the gain.
`,

  'L3.lemons': ex`
@task
Good and bad entrepreneurs need the same investment for a project that succeeds or fails; good types succeed more often. Investors cannot tell them apart and price securities at the pooled average. You are asked for the equity fraction, the debt face value, how much each security is underpriced for a good type, the value she keeps with debt, and which security she prefers.

@idea
At pooled prices, securities of good types are **underpriced** (investors assume the average), those of bad types overpriced. The damage depends on how sensitive a security is to the private information:

- Equity gets a share of the whole value, which depends strongly on the type.
- Debt pays $F$ in success and $L$ in failure; only the default part depends on the type.

So debt is **less underpriced** for good types and they prefer it. A bad type issuing equity would reveal herself, so she pools on debt too: the **pecking order**.

@steps
1. $E_g = p_g H + (1-p_g)L$, $E_b$ likewise; pooled value $= qE_g + (1-q)E_b$.
2. Equity: $\alpha = I/\text{pooled}$.
3. Debt: $\bar p = q p_g + (1-q)p_b$; $F = \frac{I - (1-\bar p)L}{\bar p}$.
4. Underpricing for the good type: equity $\alpha E_g - I$; debt $p_g F + (1-p_g)L - I$.
5. She keeps $(1-\alpha)E_g$ with equity and $p_g(H - F)$ with debt; she picks the larger.

@example
Investment €50m; project worth €80m (success) or €30m (failure). Good types succeed with 80%, bad with 40%; half are good.

@solution
1. $E_g = 70$, $E_b = 50$, pooled $= 60$.
2. $\alpha = 50/60 = 83.33\%$.
3. $\bar p = 0.6$; $F = (50 - 0.4 \times 30)/0.6 = €63.33$m.
4. Equity underpriced by $0.8333 \times 70 - 50 = 8.33$; debt by $0.8 \times 63.33 + 0.2 \times 30 - 50 = 6.67$.
5. Keeps $70/6 = 11.67$ with equity, $0.8 \times (80 - 63.33) = 13.33$ with debt.

@answer
Good types prefer debt: underpriced by €6.67m instead of €8.33m, keeping €13.33m instead of €11.67m.

@pitfalls
- Pricing the securities at the good type's probabilities; investors use the pooled average.
- Measuring underpricing with pooled values instead of the good type's true values.
- Concluding good types prefer equity because it has no repayment.
`,

  'L3.concept': ex`
@task
Concept questions on incentives and information: true/false, find the false (or true) statement, or the best short answer.

@idea
- **Moral hazard**: with outside equity the entrepreneur keeps only part of the gain from effort → high effort for a smaller range of costs. Debt leaves her all upside above $F$ → stronger incentives. Investors price on their beliefs; she bears the cost if they are not met.
- **Adverse selection**: at pooled prices good types' securities are underpriced, equity more than debt, because equity is more information-sensitive.
- Pooling on debt: a bad type issuing equity would reveal herself.
- **Pecking order**: internal funds, then debt, equity last. With asymmetric information the NPV of the financing transaction itself matters.

@steps
1. Is it about effort (moral hazard) or about types (adverse selection)?
2. Check which security gives better incentives or less mispricing (debt in both cases).
3. Watch for reversed claims ("good types prefer equity", "same effort with any security").
4. Pick the odd one out among four options.

@example
True or false? "Outside equity gives the entrepreneur the same effort incentives as using her own money."

@solution
1. Moral hazard question.
2. With her own money she keeps the whole gain from effort; with outside equity only $1 - \alpha$ of it.
3. Lower private gain → high effort for a smaller range of costs.

@answer
False. Outside equity weakens effort incentives.

@pitfalls
- "Bad types prefer debt because it is more overpriced for them": false.
- "A bad type can issue equity at the pooled price without revealing herself": false.
- "Pecking order: equity before debt": false.
- "Debt and equity always lead to the same effort": false.
`,

  'PS3.hotel': ex`
@task
A hotel is a "star" or a "common" type; it pays a high or low cash flow with type-dependent probabilities. An advertising campaign raises the high-state probability for either type and must be financed with outside equity or debt. You are asked for market and true values, what each type keeps under equity or debt, whether they retain more or less than the campaign's NPV, who issues which security when investors are sophisticated, and the fraction an equity issuer must give up.

@idea
Value $= L + p(H - L)$. The campaign has the same NPV for both types: $\Delta p (H - L) - K$.

- **Equity at the pooled price**: the fraction $\alpha = K/\text{pooled value}$ is too large for a star (her shares are underpriced) and too small for a common hotel. Star keeps **less** than the NPV, common keeps **more**.
- **Debt**: if the low cash flow covers $K$, the debt is riskless and fairly priced for both; both keep **exactly** the NPV.
- **Sophisticated investors** know a star would not sell underpriced equity, so only common hotels issue equity (and are priced as common); both can issue debt.

@steps
1. True values $V_S = L + p_S(H-L)$, $V_C = L + p_C(H-L)$; market value $= qV_S + (1-q)V_C$.
2. With the campaign: $V_S' = V_S + \Delta p(H-L)$, $V_C'$ likewise; NPV $= \Delta p(H-L) - K$.
3. Equity: $\alpha = K/(qV_S' + (1-q)V_C')$; each keeps $(1-\alpha)V'$.
4. Debt (riskless): each keeps $V' - K$.
5. Separating: equity issuers are common, so $\alpha = K/V_C'$.

@example
High €60m, low €20m. Star: 50% high; common: 30%. Campaign costs €4m and adds 15 points. Half the hotels are stars.

@solution
1. $V_S = 20 + 0.5 \times 40 = 40$, $V_C = 32$, market $= 36$.
2. $V_S' = 46$, $V_C' = 38$; NPV $= 0.15 \times 40 - 4 = 2$.
3. Pooled $= 42$, $\alpha = 4/42 = 9.52\%$: star keeps $41.62$ (gain 1.62 < 2), common keeps $34.38$ (gain 2.38 > 2).
4. Debt: star $46 - 4 = 42$, common $34$ (gain exactly 2 each).
5. Only common hotels issue equity: $\alpha = 4/38 = 10.53\%$.

@answer
With equity a star retains less and a common hotel more than the NPV; with debt both retain exactly the NPV. Only common hotels issue equity (α = 10.53%); both types issue debt.

@pitfalls
- Using the pre-campaign values to price the equity issue.
- Assuming the debt is risky when the low cash flow covers the face value.
- Forgetting that sophisticated investors price an equity issuer as a common hotel.
`,
};
