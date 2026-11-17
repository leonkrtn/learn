import { ex, type ExplainMap } from '@/lib/explain';

export const L5: ExplainMap = {
  'L5.financing': ex`
@task
A firm needs an amount $A$ for a project and can use retained earnings, debt at a rate above what managers think is fair, or equity that managers think is underpriced. You are asked for the cost of each source to current shareholders, the ranking, and the underpricing at which equity and debt cost the same.

@idea
What matters to current shareholders is the **true value** of what they give away for $A$ of cash:

- Retained earnings: exactly $A$.
- Debt at rate $r_c$ when $r_{fair}$ is fair: they promise $A(1+r_c)$, worth $\frac{A(1+r_c)}{1+r_{fair}}$.
- Equity underpriced by $u$: shares are sold at $(1-u)$ of their value, so raising $A$ gives away shares worth $\frac{A}{1-u}$.

The cheapest source has the lowest cost; this is the logic of the **pecking order**.

@steps
1. Retained earnings: cost $= A$.
2. Debt: cost $= A(1 + r_c)/(1 + r_{fair})$.
3. Equity: cost $= A/(1 - u)$.
4. Rank from cheapest to most expensive.
5. Break-even underpricing: $u^* = 1 - A/\text{cost of debt}$.

@example
Raise €50m. Lenders charge 8%, managers think 6% is fair; equity is underpriced by 5%.

@solution
1. Retained earnings: €50m.
2. Debt: $50 \times 1.08 / 1.06 = €50.94$m.
3. Equity: $50 / 0.95 = €52.63$m.
4. Ranking: retained earnings, debt, equity.
5. $u^* = 1 - 50/50.94 = 1.85\%$.

@answer
Costs €50m, €50.94m and €52.63m: retained earnings, then debt, then equity.

@pitfalls
- Computing the equity cost as $A(1+u)$; selling at a discount of $u$ gives $A/(1-u)$.
- Taking the cost of debt as only the extra interest ($A(r_c - r_{fair})$) rather than the PV of the promised payment.
- Ranking debt behind equity without comparing the numbers.
`,

  'L5.lemons': ex`
@task
The stock is worth one of several equally likely values; investors price it at the average. The CEO, who knows the true value, wants to sell to diversify and would accept a discount of $d$. You are asked to what price the stock falls step by step, the final price, and for which true values the CEO sells.

@idea
**Adverse selection (lemons)**: investors know the CEO sells only if the price is attractive relative to the true value. Because diversification is worth a fraction $d$ to him, he sells as long as the price is at least $(1-d) \times$ the true value. If the highest type would not sell at the current price, investors exclude it, the average falls, and the process repeats until the CEO would sell for every remaining value.

@steps
1. Start with the price $=$ average of all values.
2. Check the highest remaining value $V_{top}$: does the CEO sell? Only if $(1-d)V_{top} \leq$ price.
3. If not, drop $V_{top}$ and recompute the price as the average of the remaining values.
4. Repeat until the highest remaining type would sell.
5. The final price is that average; the CEO sells for the remaining values.

@example
The stock is worth €100, €80 or €60 per share, equally likely; price €80. Diversification is worth 10% to the CEO.

@solution
1. Price €80.
2. Top type €100: $(1 - 0.10) \times 100 = 90 > 80$ → would not sell. Drop it.
3. New price $(80 + 60)/2 = €70$. Top type €80: $0.9 \times 80 = 72 > 70$ → would not sell. Drop it.
4. Price €60; top type €60: $0.9 \times 60 = 54 \leq 60$ → sells.
5. Final price €60.

@answer
The price falls to €70, then to €60; the CEO sells only if the true value is €60.

@pitfalls
- Comparing the price with the full value instead of $(1-d) \times$ value.
- Stopping after the first round.
- Averaging over values that investors have already ruled out.
`,

  'L5.signal': ex`
@task
An all-equity firm will be worth a high or low value next year. The CEO knows success is certain and considers debt as a signal; distress is costly. You are asked whether a given face value makes the claim credible, the threshold above which leverage is credible, and equity's payoff if the strategy fails.

@idea
A claim is credible only if it would be **too costly to make if untrue**. If the debt's face value exceeds the low outcome $L$, a firm with bad prospects would default and bear distress costs; only a CEO who is sure of success would choose it. Debt below $L$ can be repaid in every state, so any firm could issue it: no signal.

@steps
1. Compare the face value $F$ with the low firm value $L$.
2. $F > L$: credible signal (a bad firm would face distress).
3. $F \leq L$: not credible (repaid in both states).
4. If the strategy fails and $F > L$, equity holders get $\max(L - F, 0) = 0$.

@example
The firm is worth €200m or €100m in one year. Is debt with a face value of €80m credible? And €150m?

@solution
1. Low value $L = €100$m.
2. €80m < €100m: repaid even if the strategy fails, any firm can issue it — not credible.
3. €150m > €100m: a firm expecting failure would default — credible.
4. With €150m of debt and failure, equity receives nothing.

@answer
€80m: no. €150m: yes. Leverage becomes credible above €100m.

@pitfalls
- Using the high value or the average as the threshold.
- Thinking a small amount of debt is a stronger signal; the signal comes from the cost of distress in the bad state.
`,

  'L5.concept': ex`
@task
Concept questions on asymmetric information: true/false, find the false (or true) statement, or the best short answer.

@idea
- **Credibility**: a self-interested claim is believable only if the action backing it would be too costly if the claim were false. Leverage is such a signal **because** it could cause distress.
- **Lemons / adverse selection**: sellers who know their shares are good are reluctant to sell, so the average quality offered is below the average of all firms. The price falls on an equity-issue announcement and tends to rise before it.
- Firms issue equity when information asymmetry is **smallest** (e.g. right after earnings announcements).
- **Pecking order**: retained earnings, then debt, equity last. It gives no clear target D/E: profitable firms tend to have **low** leverage, but a low D/E does not prove low profitability.
- Full value: $V_L = V_U + PV(\text{ITS}) - PV(\text{FDC}) - PV(\text{agency costs}) + PV(\text{agency benefits})$.

@steps
1. Find the mechanism (signal, lemons, pecking order).
2. Check the direction of the claimed effect (price up/down, issue when asymmetry is high/low).
3. Check strength words ("unambiguously", "simply").
4. Pick the odd one out among four options.

@example
True or false? "The stock price tends to rise on the announcement of an equity issue."

@solution
1. Mechanism: adverse selection.
2. Investors infer that managers sell equity when they believe it is overvalued.
3. They lower their valuation on the news.

@answer
False. The price tends to fall on the announcement (and rise before it).

@pitfalls
- "Under the pecking order firms prefer equity to debt": false.
- "Firms issue equity when asymmetry is greatest": false.
- "Managers can remove asymmetry simply by announcing forecasts": false; claims need costly backing.
- "Leverage signals only if it can never cause distress": false — the reverse.
`,
};
