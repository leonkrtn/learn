import { ex, type ExplainMap } from '@/lib/explain';

export const L3: ExplainMap = {
  'L3.twoState': ex`
@task
A firm is worth a high value if a venture succeeds and a low value if it fails; risk is diversifiable, so everything is discounted at $r_f$. The firm issues zero-coupon debt to buy back shares, and default destroys part of the value (a fixed amount or a percentage). You are asked for the unlevered value, levered equity, debt, PV of distress costs, share price, shares repurchased, the debt's yield, or who bears the costs.

@idea
Value each claim from its payoffs in the two states:

- Equity gets $V_s - F$ in success and nothing in failure.
- Debt gets $F$ in success and the **failure value minus the distress costs** in failure.

Debt holders anticipate the loss and pay less for the debt. Because the shares are bought back with the debt proceeds at a fair price, the **original shareholders bear the PV of distress costs**: the levered firm is worth $V_U - PV(\text{costs})$, and the share price falls accordingly.

@steps
1. $V_U = \frac{p V_s + (1-p) V_f}{1 + r_f}$.
2. $E = \frac{p (V_s - F)}{1 + r_f}$.
3. $D = \frac{p F + (1-p)(V_f - \text{cost})}{1 + r_f}$.
4. $V_L = E + D$; $PV(\text{costs}) = \frac{(1-p)\,\text{cost}}{1 + r_f} = V_U - V_L$.
5. Share price $= V_L / N$; shares bought back $= D / \text{price}$.
6. Yield to maturity $= F/D - 1$.

@example
Worth €300m if successful, €120m if it fails, equally likely, $r_f = 5\%$, 10 million shares. Zero-coupon debt with face value €180m; default destroys 25% of the assets (€30m).

@solution
1. $V_U = (150 + 60)/1.05 = 200.00$.
2. $E = 0.5 \times 120 / 1.05 = 57.14$.
3. $D = (0.5 \times 180 + 0.5 \times 90)/1.05 = 128.57$.
4. $V_L = 185.71$; PV(costs) $= 0.5 \times 30 / 1.05 = 14.29$.
5. Price $= 185.71 / 10 = €18.57$; buyback $= 128.57 / 18.57 = 6.92$ million shares.
6. Yield $= 180 / 128.57 - 1 = 40.0\%$.

@answer
Debt €128.57m, levered equity €57.14m, PV of distress costs €14.29m, share price €18.57.

@pitfalls
- Giving debt holders the full failure value; subtract the distress costs.
- Thinking debt holders bear the costs; they price them in, so shareholders pay.
- Confusing the yield to maturity (promised) with the expected return (here $r_f$).
- Taking the percentage cost of the success value instead of the failure value.
`,

  'L3.multiState': ex`
@task
Like the two-state case, but the firm has several equally likely values next year. Debt with face value $F$ is issued to buy back shares, and a percentage of assets is lost in default. You are asked for unlevered equity, debt value, its yield and expected return, levered equity, total value, share price, or the debt value without bankruptcy costs.

@idea
Go state by state. In each state the debt pays $F$ if the firm is worth at least $F$; otherwise the firm defaults and debt holders get the value **after** the bankruptcy loss, $(1-b)V$. Equity gets $\max(V - F, 0)$. Average over the states (equal probabilities) and discount at $r_f$, since risk is diversifiable. The **expected return** on the debt is $r_f$, while its **yield** is higher because it is computed on the promised $F$.

@steps
1. $V_U = \text{average}(V)/(1 + r_f)$.
2. Debt payoff per state: $F$ if $V \geq F$, else $(1-b)V$. Debt value $=$ average payoff$/(1+r_f)$.
3. Yield $= F/D - 1$; expected return $= r_f$.
4. Equity payoff $\max(V - F, 0)$; $E =$ average$/(1+r_f)$.
5. $V_L = E + D$; share price $= V_L / N$.
6. Without bankruptcy costs, debt pays $\min(F, V)$.

@example
Values next year €200m, €160m, €130m or €100m, equally likely; $r_f = 5\%$; 10 million shares. Face value €140m; 20% of assets lost in default.

@solution
1. $V_U = 147.5 / 1.05 = 140.48$.
2. Debt payoffs: 140, 140, $0.8 \times 130 = 104$, $0.8 \times 100 = 80$; average 116; $D = 116/1.05 = 110.48$.
3. Yield $= 140 / 110.48 - 1 = 26.72\%$; expected return 5%.
4. Equity payoffs 60, 20, 0, 0; average 20; $E = 19.05$.
5. $V_L = 129.52$; price $= €12.95$.
6. Without costs: payoffs 140, 140, 130, 100; $D = 127.5/1.05 = 121.43$.

@answer
Debt €110.48m (yield 26.72%, expected return 5%), equity €19.05m, firm €129.52m, share price €12.95.

@pitfalls
- Applying the bankruptcy loss in states where the firm does not default.
- Reporting the yield as the expected return of the debt.
- Using the levered value per share before the buyback with the wrong number of shares: the price is $V_L$ divided by the shares before the repurchase.
`,

  'L3.tradeoff': ex`
@task
A table gives, for several debt levels, the PV of financial distress costs and (sometimes) the PV of the interest tax shield. You are asked for the optimal debt level, the net benefit there, the firm value at the optimum, or the optimum at a different tax rate.

@idea
The trade-off theory: debt adds the tax shield but brings expected distress costs.

$$V_L = V_U + PV(\text{interest tax shield}) - PV(\text{financial distress costs})$$

The optimal debt level maximises the **net benefit** $PV(\text{ITS}) - PV(\text{FDC})$. If the tax shield row is missing and the debt is permanent, use $PV(\text{ITS}) = \tau_c D$.

@steps
1. For every debt level, $PV(\text{ITS}) = \tau_c \times D$ (or take the row given).
2. Net benefit $= PV(\text{ITS}) - PV(\text{FDC})$.
3. The optimal debt level is the column with the largest net benefit.
4. Firm value at the optimum $= V_U +$ net benefit.
5. For another tax rate, recompute step 1 with the new rate and repeat.

@example
Tax rate 25%, permanent debt. PV(distress costs) for debt of 0, 10, 20, 30, 40, 50 (€m): 0, 0, 0.6, 2.2, 4.8, 8.5. $V_U = €300$m.

@solution
1. PV(ITS): 0, 2.5, 5.0, 7.5, 10.0, 12.5.
2. Net benefit: 0, 2.5, 4.4, 5.3, 5.2, 4.0.
3. Maximum 5.3 at debt of €30m.
4. Firm value $= 300 + 5.3 = €305.3$m.

@answer
Optimal debt €30m, net benefit €5.3m, firm value €305.3m.

@pitfalls
- Choosing the debt level with the largest tax shield or the smallest distress costs instead of the largest difference.
- Forgetting that the net benefit at zero debt is zero, not $V_U$.
- Using the interest rate instead of the debt amount for the shield of permanent debt.
`,

  'L3.concept': ex`
@task
Concept questions on financial distress: true/false, find the false (or true) statement, or the best answer to a short question.

@idea
- In a **perfect market**, bankruptcy only shifts ownership from shareholders to creditors; it destroys no value. A drop in value when a project fails is **economic** distress, not caused by bankruptcy.
- With **costs** of distress, debt holders anticipate them and pay less, so the **original shareholders bear** the PV of distress costs.
- Direct costs (lawyers, fees) average about 3–4% of assets; **indirect** costs (lost customers, suppliers, employees, fire sales) are usually much larger.
- Distress is more likely with volatile cash flows; costs are high for firms with intangible assets (tech), low for real estate.
- Chapter 11: reorganisation, management stays; Chapter 7: trustee liquidates.
- **Trade-off theory**: $V_L = V_U + PV(\text{ITS}) - PV(\text{FDC})$; it explains why firms do not use the maximum tax shield.

@steps
1. Is the statement set in a perfect market or with distress costs? The answers differ.
2. Who bears the cost? With fair pricing: the shareholders.
3. Compare magnitudes and directions (direct vs indirect, volatility up → probability up).
4. For four options, mark each one and pick the odd one out.

@example
True or false? "When debt is fairly priced, the debt holders bear the present value of the financial distress costs."

@solution
1. Fairly priced debt means the price reflects expected losses in default.
2. Debt holders pay less upfront, so they earn a fair return anyway.
3. The lower proceeds reduce the value left for shareholders.

@answer
False. The original shareholders bear the PV of distress costs.

@pitfalls
- "Bankruptcy causes the loss of value in a perfect market": false.
- "Direct costs exceed indirect costs": false.
- "Real estate firms have higher distress costs than tech firms": false.
- "A firm must default whenever it lacks cash": false if its assets exceed its liabilities and it can raise capital.
`,
};
