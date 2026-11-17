import { ex, type ExplainMap } from '@/lib/explain';

export const L2: ExplainMap = {
  'L2.strategy': ex`
@task
A position built from European calls and puts (spread, straddle, strangle, butterfly or their inverted forms) with given premiums. You are asked for the initial cash flow, its value at maturity, the net payoff at given share prices, the break-even price(s), the largest and worst net payoff, and what the position bets on.

@idea
Treat each leg separately and add up:

- Payoff of a long call $\max(S_T - X, 0)$, of a long put $\max(X - S_T, 0)$; a short leg has the opposite sign.
- Initial cash flow: $-$premium for every option bought, $+$premium for every option sold.
- **Net payoff** $=$ payoff at maturity $+$ initial cash flow carried forward, $CF_0 \, e^{rT}$.

The net payoff is piecewise linear with kinks at the strikes, so break-evens and extremes are found at or between the strikes.

@steps
1. $CF_0 = -\sum(\text{bought premiums}) + \sum(\text{sold premiums})$; at maturity $CF_0 e^{rT}$.
2. For a given $S_T$: add the leg payoffs, then add $CF_0 e^{rT}$.
3. Break-even: solve net payoff $= 0$ on the linear piece where the sign changes.
4. Largest/worst payoff: check the flat pieces (below the lowest and above the highest strike, and at the strikes).
5. Name the view: bull/bear spread (moderate rise/fall), straddle/strangle (big move), inverted ones and butterflies (stability).

@example
Share €50. Buy a call with strike €45 (€6.00) and sell a call with strike €55 (€2.00), 3 months, $r = 4\%$.

@solution
1. $CF_0 = -6.00 + 2.00 = -4.00$; at maturity $-4.00 e^{0.01} = -4.0402$.
2. At $S_T = 40$: payoff 0, net $-4.04$. At $S_T = 52$: payoff 7, net $2.96$.
3. Break-even: $S_T - 45 - 4.0402 = 0 \Rightarrow S_T = 49.04$.
4. Above 55 the payoff is capped at 10: best net $5.96$; worst $-4.04$.
5. A bull spread with calls: a bet on a moderate rise.

@answer
Initial cash flow −€4.00; break-even €49.04; net payoff between −€4.04 and €5.96.

@pitfalls
- Forgetting to carry the premium forward with $e^{rT}$.
- Signs: buying an option is an outflow; a short call loses when the share rises.
- Giving only one break-even for a straddle, strangle or butterfly (they have two).
`,

  'L2.butterfly': ex`
@task
Calls and puts with three strikes are quoted with bid and ask. You are asked what a butterfly costs with calls and with puts, which is cheaper, and the net payoff of the cheaper one below the lowest strike and at the middle strike.

@idea
A butterfly buys one option at $X_1$ and one at $X_3$ and sells two at the middle strike $X_2$. You **buy at the ask and sell at the bid**:

$$\text{cost} = \text{ask}(X_1) + \text{ask}(X_3) - 2\,\text{bid}(X_2)$$

Calls and puts give the same payoff (zero outside the outer strikes, a peak of $X_2 - X_1$ at the middle), so choose the cheaper one. Net payoff $=$ payoff $-$ cost $\times e^{rT}$.

@steps
1. Cost with calls and with puts from the formula.
2. Pick the cheaper.
3. Below $X_1$ (and above $X_3$): net payoff $= -\text{cost} \cdot e^{rT}$.
4. At $X_2$: net payoff $= (X_2 - X_1) - \text{cost} \cdot e^{rT}$.

@example
Strikes 45/50/55, 3 months, $r = 4\%$. Calls bid/ask: 6.10/6.30, 3.00/3.10, 1.20/1.30. Puts: 0.60/0.70, 2.40/2.50, 5.60/5.80.

@solution
1. Calls: $6.30 + 1.30 - 2 \times 3.00 = 1.60$; puts: $0.70 + 5.80 - 2 \times 2.40 = 1.70$.
2. Calls are cheaper.
3. Below 45: $-1.60e^{0.01} = -1.62$.
4. At 50: $5 - 1.62 = 3.38$.

@answer
The call butterfly costs €1.60 (puts €1.70); net payoff −€1.62 outside the wings and €3.38 at the middle strike.

@pitfalls
- Using mid prices or selling at the ask.
- Selling only one middle option.
- Forgetting to compound the cost to maturity.
`,

  'L2.portfolio': ex`
@task
A trader holds several long and short calls and puts. You are asked for the portfolio's current value, its payoff at maturity for several share prices, and how much the payoff changes per €1 above the highest strike.

@idea
Value and payoff are both additive over the legs, with long legs counted positive and short legs negative:

- Value today $= \sum q_i \times \text{premium}_i$.
- Payoff $= \sum q_i \times$ (option payoff at $S_T$).

Above the highest strike all calls are in the money and all puts are worthless, so the slope is (number of long calls) $-$ (number of short calls).

@steps
1. Value $= \sum$ (quantity × premium), short positions negative.
2. For each $S_T$: compute every leg's payoff, multiply by its quantity, add.
3. Slope above the highest strike $=$ net number of calls.

@example
2 long calls with strike €40 (€5.00), 3 short calls with strike €50 (€1.50), 1 long put with strike €50 (€6.20). Share €45.

@solution
1. Value $= 2 \times 5.00 - 3 \times 1.50 + 6.20 = €11.70$.
2. $S_T = 30$: calls 0, put 20 → 20. $S_T = 45$: $2 \times 5 + 0 + 5 = 15$. $S_T = 60$: $2 \times 20 - 3 \times 10 + 0 = 10$.
3. Slope above 50: $2 - 3 = -1$.

@answer
Value €11.70; payoffs 20, 15 and 10; the payoff falls by €1 for each €1 above €50.

@pitfalls
- Treating short options as positive value.
- Forgetting the put pays nothing above its strike.
- Counting the put in the slope above the highest strike.
`,

  'L2.identify': ex`
@task
A list of legs (buy or sell calls and puts with given strikes). You pick the name of the strategy.

@idea
Recognise the pattern by the option type, the direction and the strikes:

| Position | Name | View |
|---|---|---|
| Buy call low, sell call high | Bull spread (calls) | Moderate rise |
| Buy put low, sell put high | Bull spread (puts) | Moderate rise |
| Sell call low, buy call high | Bear spread (calls) | Moderate fall |
| Sell put low, buy put high | Bear spread (puts) | Moderate fall |
| Buy call + buy put, same strike | Straddle | Big move |
| Sell call + sell put, same strike | Inverted straddle | Stability, unlimited risk |
| Buy put low + buy call high | Strangle | Big move, cheaper |
| Sell put low + sell call high | Inverted strangle | Stability |
| Buy 1 low, sell 2 middle, buy 1 high | Butterfly | Stability, limited risk |

@steps
1. Same option type for all legs → spread or butterfly; calls and puts mixed → straddle or strangle.
2. Three strikes with 1/−2/1 → butterfly.
3. Two strikes: who buys the lower strike? Buying the lower = bull, selling the lower = bear.
4. Call and put: same strike → straddle, different → strangle; selling both → inverted.

@example
Buy 1 put with strike €45 and buy 1 call with strike €55.

@solution
1. A put and a call → straddle or strangle.
2. Different strikes → strangle.
3. Both bought → not inverted.

@answer
A strangle: a bet on high volatility, cheaper than a straddle.

@pitfalls
- Calling a put spread "bear" just because it uses puts; bull or bear depends on which strike is bought.
- Mixing up straddle (same strike) and strangle (different strikes).
`,

  'L2.concept': ex`
@task
Concept questions on option trading strategies: true/false, find the false (or true) statement, or the best short answer.

@idea
- Bull spread with calls: buy low strike, sell high → **outflow** at the start. Bull spread with puts: buy low, sell high → **inflow**.
- Bear spread with calls: sell low, buy high → inflow. Bear spread with puts: buy the **higher** put, sell the lower.
- Straddle/strangle bet on **big moves**; the strangle is cheaper. Inverted versions bet on stability with **unlimited** risk and start with an inflow.
- Butterfly: 1 / −2 / 1 at three strikes, bet on stability with **limited** risk; a reverse butterfly bets on a big move.
- Payoff diagrams with the premium use its **future value**. Scaling the position does not move the strikes.

@steps
1. Identify the strategy and write down its legs.
2. Determine the sign of the initial cash flow (expensive option bought → outflow).
3. Check the claimed view and risk.
4. Pick the odd one out among four options.

@example
True or false? "A straddle profits when the share price stays close to the strike."

@solution
1. A straddle buys a call and a put with the same strike.
2. At the strike both expire worthless and the premiums are lost.
3. It profits only if the share moves far in either direction.

@answer
False. A straddle bets on a big move; staying near the strike is its worst case.

@pitfalls
- "A bull spread with calls starts with an inflow": false.
- "A butterfly has unlimited losses": false.
- "An inverted strangle starts with an outflow": false.
- "n butterflies change the peak strike": false.
`,
};
