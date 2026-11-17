import { ex, type ExplainMap } from '@/lib/explain';

export const L3: ExplainMap = {
  'L3.replicate': ex`
@task
A one-period binomial model: the share goes up by $u$ or down by $d$, the risk-free rate is simple per period, and a call or put trades at a market price. You are asked for the replicating portfolio ($m$ shares, borrowing $B$), the option value, the risk-neutral probability and whether there is an arbitrage.

@idea
Two states, two instruments: a portfolio of $m$ shares and a loan can copy the option's payoff in both states.

$$m = \frac{c_u - c_d}{S_u - S_d}, \qquad B = \frac{m S_u - c_u}{1 + r}, \qquad c = mS - B$$

The same value comes from risk-neutral pricing, $c = \frac{\pi c_u + (1-\pi)c_d}{1+r}$ with $\pi = \frac{1 + r - d}{u - d}$. If the market price differs, sell the expensive one (option or replica) and buy the cheap one.

@steps
1. $S_u = uS$, $S_d = dS$; option payoffs $c_u$, $c_d$.
2. $m = (c_u - c_d)/(S_u - S_d)$ (negative for a put).
3. $B = (m S_u - c_u)/(1 + r)$ (negative means lending).
4. Value $= mS - B$; $\pi = (1 + r - d)/(u - d)$ as a check.
5. Market above value → sell option, buy replica; below → buy option, sell replica.

@example
Share €100, $u = 1.2$, $d = 0.9$, $r = 5\%$ per period. A call with strike €100 trades at €10.50.

@solution
1. $S_u = 120$, $S_d = 90$; $c_u = 20$, $c_d = 0$.
2. $m = 20/30 = 0.6667$.
3. $B = (0.6667 \times 120 - 20)/1.05 = 57.14$.
4. $c = 66.67 - 57.14 = €9.52$; $\pi = (1.05 - 0.9)/0.3 = 50\%$, and $0.5 \times 20/1.05 = 9.52$ ✓.
5. €10.50 > €9.52: sell the call, buy 0.667 shares, borrow €57.14 → €0.98 riskless profit.

@answer
m = 0.667, B = €57.14, value €9.52, π = 50%; the call is overpriced by €0.98.

@pitfalls
- Using the real probability of an up move; it plays no role.
- Discounting $B$ twice or forgetting to discount it.
- For a put, $m$ is negative (short shares) and $B$ is negative (lend).
`,

  'L3.twoStep': ex`
@task
A two-period tree for a European call or put with $u = e^{\sigma\sqrt{\Delta t}}$ and $d = 1/u$, continuous compounding. You are asked for $u$, the risk-neutral probability, the option value at the up node and today, and the delta today.

@idea
Build the share tree, compute payoffs at maturity, and work backwards: each node's value is the discounted risk-neutral expectation of the two nodes after it.

$$\pi = \frac{e^{r\Delta t} - d}{u - d}, \qquad V = e^{-r\Delta t}\left[\pi V_u + (1-\pi)V_d\right]$$

Delta at a node $= \frac{V_u - V_d}{S_u - S_d}$.

@steps
1. $\Delta t = T/2$; $u = e^{\sigma\sqrt{\Delta t}}$, $d = 1/u$.
2. $\pi = (e^{r\Delta t} - d)/(u - d)$.
3. Share prices: $Su^2$, $S$, $Sd^2$ at maturity; payoffs there.
4. Roll back to $t = 1$ and then to today.
5. Delta today $= (V_u - V_d)/(S_u - S_d)$.

@example
Share €50, $\sigma = 30\%$, call with strike €50 maturing in 6 months, $r = 5\%$.

@solution
1. $\Delta t = 0.25$; $u = e^{0.15} = 1.1618$, $d = 0.8607$.
2. $\pi = (e^{0.0125} - 0.8607)/(1.1618 - 0.8607) = 0.5043$.
3. Maturity: 67.49, 50.00, 37.04 → payoffs 17.49, 0, 0.
4. Up node: $e^{-0.0125} \times 0.5043 \times 17.49 = 8.71$; down node 0. Today: $e^{-0.0125} \times 0.5043 \times 8.71 = €4.34$.
5. Delta $= (8.71 - 0)/(58.09 - 43.04) = 0.579$.

@answer
u = 1.1618, π = 50.43%, call €4.34 (€8.71 at the up node), delta 0.58.

@pitfalls
- Using $\sigma\sqrt{T}$ instead of $\sigma\sqrt{\Delta t}$.
- Using $1 + r\Delta t$ when rates are continuous.
- Discounting only once over both periods with the per-step factor.
`,

  'L3.american': ex`
@task
A two-period tree for a put; you value the European and the American put and say at which node early exercise is optimal.

@idea
The American put can be exercised at every node, so its value there is the **larger** of the continuation value (discounted risk-neutral expectation) and the exercise value $X - S$:

$$V = \max\left(X - S,\; \text{disc} \times [\pi V_u + (1-\pi)V_d]\right)$$

The difference to the European put is the value of the early-exercise right; it usually pays off at low share prices, where waiting wastes interest on $X$.

@steps
1. Build the share tree and the risk-neutral $\pi$.
2. Payoffs at maturity are the same for both puts.
3. European: roll back with continuation values only.
4. American: at each earlier node take $\max(X - S, \text{continuation})$; mark nodes where exercise wins.
5. Compare the values today.

@example
Share €100, $u = 1.2$, $d = 0.8$, $r = 5\%$ per period, two periods, put strike €110.

@solution
1. $\pi = (1.05 - 0.8)/0.4 = 0.625$. Maturity prices 144, 96, 64 → payoffs 0, 14, 46.
2. Up node (120): continuation $(0.625 \times 0 + 0.375 \times 14)/1.05 = 5.00$; exercise $\max(110 - 120, 0) = 0$ → 5.00.
3. Down node (80): continuation $(0.625 \times 14 + 0.375 \times 46)/1.05 = 24.76$; exercise $30$ → American takes 30.
4. European today: $(0.625 \times 5 + 0.375 \times 24.76)/1.05 = €11.82$.
5. American today: $(0.625 \times 5 + 0.375 \times 30)/1.05 = €13.69$; exercising today (10) is worse.

@answer
European put €11.82, American put €13.69; exercise early at the down node.

@pitfalls
- Comparing exercise with the European value only at the root.
- Using the American values only at maturity (they equal the European payoffs there).
- Forgetting to check the root node itself.
`,

  'L3.nPeriod': ex`
@task
A European call over $n$ periods with constant $u$, $d$ and per-period rate $r$. You are asked for $\pi$, the risk-neutral probability that the call ends in the money, and its value.

@idea
After $n$ steps with $j$ up moves the share is $S u^j d^{n-j}$, reached with risk-neutral probability $\binom{n}{j}\pi^j(1-\pi)^{n-j}$. The call is the discounted expected payoff:

$$c = \frac{1}{(1+r)^n} \sum_{j=0}^{n} \binom{n}{j}\pi^j(1-\pi)^{n-j}\max(S u^j d^{n-j} - X, 0)$$

The probability of ending in the money adds the weights of all $j$ with $S u^j d^{n-j} > X$.

@steps
1. $\pi = (1 + r - d)/(u - d)$.
2. For each $j$: final price, weight $\binom{n}{j}\pi^j(1-\pi)^{n-j}$, payoff.
3. In-the-money probability $=$ sum of weights with positive payoff.
4. Value $=$ sum of weight × payoff, divided by $(1+r)^n$.

@example
Share €100, $u = 1.10$, $d = 0.95$, $r = 2\%$ per period, call with strike €105 after 3 periods.

@solution
1. $\pi = (1.02 - 0.95)/0.15 = 0.4667$.
2. $j = 3$: 133.10, weight 0.1016, payoff 28.10. $j = 2$: 114.95, weight 0.3484, payoff 9.95. $j = 1$: 99.28 and $j = 0$: 85.74, payoff 0.
3. ITM probability $= 0.1016 + 0.3484 = 45.0\%$.
4. $c = (0.1016 \times 28.10 + 0.3484 \times 9.95)/1.02^3 = 6.322/1.0612 = €5.96$.

@answer
π = 46.67%, probability in the money 45.0%, call €5.96.

@pitfalls
- Forgetting the binomial coefficient $\binom{n}{j}$.
- Discounting with $(1+r)$ once instead of $(1+r)^n$.
- Counting a final price exactly equal to $X$ as in the money.
`,

  'L3.dividendTree': ex`
@task
A share pays a known dividend between two tree steps. You build a tree for $S^* = S - PV(D)$, add the dividend back where it is still to come, and value a European call, an American call (exercise just before the dividend), the call's delta and a European put.

@idea
A tree for the share itself would not recombine after a cash dividend. Instead model the part of the share price **without** the known dividend, $S^* = S - PV(D)$, as a normal recombining tree, and add the present value of the dividend still to be paid back to the nodes before the ex-date:

- today: $S = S^* + PV(D)$;
- just before the dividend (cum): $S = S^* u$ or $S^* d$ plus $D$;
- after it: only $S^*$ paths.

An American call may be exercised at the cum-dividend node: compare $S_{cum} - X$ with the continuation value.

@steps
1. $PV(D) = De^{-r t_D}$; $S^* = S - PV(D)$; $u = e^{\sigma\sqrt{\Delta t}}$, $d = 1/u$, $\pi = (e^{r\Delta t} - d)/(u - d)$.
2. Tree for $S^*$; add $D$ at the cum-dividend nodes.
3. Payoffs at maturity from the $S^*$ nodes; roll back.
4. American call: at each cum node take $\max(S_{cum} - X, \text{continuation})$.
5. Put: same tree with put payoffs.

@example
Share €60, $\sigma = 25\%$, dividend €2 in 3 months, call strike €60 maturing in 6 months, $r = 5\%$ (two 3-month steps).

@solution
1. $PV(D) = 2e^{-0.0125} = 1.9752$; $S^* = 58.02$; $u = e^{0.125} = 1.1331$; $\pi = 0.5190$.
2. Step 1 (cum): $58.02 \times 1.1331 + 2 = 67.75$ and $58.02/1.1331 + 2 = 53.21$. Maturity: 74.51, 58.02, 45.19.
3. European: up node $e^{-0.0125} \times 0.519 \times 14.51 = 7.43$; today $e^{-0.0125} \times 0.519 \times 7.43 = €3.81$; delta $= 7.43/(67.75 - 53.21) = 0.511$.
4. American: at the up node exercise gives $67.75 - 60 = 7.75 > 7.43$ → exercise; today $e^{-0.0125} \times 0.519 \times 7.75 = €3.97$.
5. European put $= €4.30$.

@answer
European call €3.81 (delta 0.51), American call €3.97 (exercise just before the dividend at the up node), European put €4.30.

@pitfalls
- Building the tree on $S$ instead of $S^*$.
- Forgetting to add the dividend back at the cum-dividend nodes.
- Allowing early exercise of the call after the dividend has been paid.
`,

  'L3.yield': ex`
@task
An index with a continuous dividend yield $q$; a two-step monthly tree for a European call or put. You are asked for the risk-neutral probability, the option value in index points and its delta.

@idea
The dividend yield lowers the expected growth of the index under the risk-neutral measure from $r$ to $r - q$, so only $\pi$ changes; discounting still uses $r$:

$$\pi = \frac{e^{(r-q)\Delta t} - d}{u - d}, \qquad V = e^{-r\Delta t}[\pi V_u + (1-\pi)V_d]$$

@steps
1. $\Delta t = 1/12$; $u = e^{\sigma\sqrt{\Delta t}}$, $d = 1/u$.
2. $\pi$ with $r - q$.
3. Index tree and payoffs after two steps.
4. Roll back twice with $e^{-r\Delta t}$.
5. Delta $= (V_u - V_d)/(S_u - S_d)$.

@example
Index 4,000, $\sigma = 20\%$, $q = 2\%$, $r = 4\%$, call with strike 4,000 maturing in 2 months.

@solution
1. $u = e^{0.2\sqrt{1/12}} = 1.0594$, $d = 0.9439$.
2. $\pi = (e^{0.02/12} - 0.9439)/(1.0594 - 0.9439) = 0.5000$.
3. Maturity: 4,489.60, 4,000, 3,563.79 → payoffs 489.60, 0, 0.
4. Up node: $e^{-0.04/12} \times 0.5 \times 489.60 = 243.99$; today: $e^{-0.04/12} \times 0.5 \times 243.99 = 121.59$.
5. Delta $= 243.99/(4{,}237.74 - 3{,}775.60) = 0.528$.

@answer
π = 50.0%, call 121.59 index points, delta 0.53.

@pitfalls
- Using $r$ instead of $r - q$ in $\pi$.
- Discounting with $r - q$ instead of $r$.
- Using yearly instead of monthly steps.
`,

  'L3.vol': ex`
@task
Closing prices on consecutive trading days. You are asked for the average daily log return, the sample variance and the annualised volatility.

@idea
Volatility is estimated from **log** returns $u_i = \ln(S_i/S_{i-1})$. Use the sample variance (divide by $n - 1$) and scale by the number of **trading** days, 252:

$$\hat\sigma = \sqrt{252 \times \frac{1}{n-1}\sum (u_i - \bar u)^2}$$

@steps
1. $u_i = \ln(S_i/S_{i-1})$ for each pair of days ($n$ returns from $n + 1$ prices).
2. Mean $\bar u$.
3. Variance $= \sum (u_i - \bar u)^2/(n-1)$.
4. Annual volatility $= \sqrt{252 \times \text{variance}}$.

@example
Prices: 20.00, 20.40, 20.10, 20.50, 20.30, 20.80.

@solution
1. Returns: 0.01980, −0.01482, 0.01971, −0.00980, 0.02433.
2. Mean $= 0.00784$ (0.78%).
3. Variance $= 0.000345$.
4. $\sigma = \sqrt{252 \times 0.000345} = 29.5\%$.

@answer
Average daily return 0.78%, variance 0.000345, annual volatility 29.5%.

@pitfalls
- Using simple returns instead of log returns.
- Dividing by $n$ instead of $n - 1$.
- Multiplying by 365 instead of 252, or annualising the standard deviation by 252 instead of $\sqrt{252}$.
`,

  'L3.concept': ex`
@task
Concept questions on the binomial model: true/false, find the false (or true) statement, or the best short answer.

@idea
- Replication: $c = mS - B$, with $m$ the delta (hedge ratio). No arbitrage needs $d < 1 + r < u$.
- $\pi = (1 + r - d)/(u - d)$ is a pricing device, **not** the real probability; the real probability does not affect the value.
- $u = e^{\sigma\sqrt{\Delta t}}$, $d = 1/u$, $\pi = (e^{r\Delta t} - d)/(u - d)$ match the lognormal model; with a yield use $r - q$.
- American nodes take $\max(\text{exercise}, \text{continuation})$. With dividends an American call may be exercised early.
- A tree with a cash dividend does not recombine unless built on $S - PV(D)$.
- Put deltas are negative; a higher $r$ raises call values. Volatility $=$ sd of daily log returns × $\sqrt{252}$.

@steps
1. Identify the claim: replication, probabilities, tree parameters, American exercise or dividends.
2. Check it against the rules.
3. Watch for "real" vs "risk-neutral".
4. Pick the odd one out among four options.

@example
True or false? "The value of a call in the binomial model rises with the real probability of an up move."

@solution
1. The value comes from replication with shares and a loan.
2. Replication works whatever the probabilities are.
3. Only $u$, $d$, $r$ and the payoffs enter.

@answer
False. The real probability does not affect the option value.

@pitfalls
- "π is the probability investors expect": false.
- "The share must earn $r$ in reality": false.
- "A put delta is positive": false.
- "A higher $r$ lowers a call": false.
`,
};
