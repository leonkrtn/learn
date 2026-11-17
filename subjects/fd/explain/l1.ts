import { ex, type ExplainMap } from '@/lib/explain';

export const L1: ExplainMap = {
  'L1.bounds': ex`
@task
A European call or put on a share without dividends, with its price, strike, days to maturity and the risk-free rate (continuous). You are asked for the intrinsic value, time value, lower and upper bound, whether there is an arbitrage, and the riskless profit if a bound is broken.

@idea
No-arbitrage puts every option price inside a band:

| | Lower bound | Upper bound |
|---|---|---|
| Call | $\max(S - PV(X), 0)$ | $S$ |
| Put | $\max(PV(X) - S, 0)$ | $PV(X)$ |

with $PV(X) = X e^{-rT}$. Intrinsic value is what immediate exercise would pay, $\max(S - X, 0)$ or $\max(X - S, 0)$; time value $=$ price $-$ intrinsic value (it can be negative for a deep in-the-money European put). If the price is below the lower bound, buy the cheap option and hedge it: the hedge locks in the gap today.

@steps
1. $PV(X) = X e^{-rT}$ with $T = \text{days}/365$.
2. Intrinsic value and time value $=$ price $-$ intrinsic.
3. Lower and upper bound from the table.
4. Price below the lower bound: call — buy call, short share, invest $PV(X)$; put — buy put and share, borrow $PV(X)$.
5. Profit today $=$ lower bound $-$ price.

@example
A share trades at €40. A European put with strike €45 and 90 days to maturity costs €4.00; $r = 5\%$.

@solution
1. $PV(X) = 45 e^{-0.05 \times 90/365} = 44.4486$.
2. Intrinsic $= 45 - 40 = 5.00$; time value $= 4.00 - 5.00 = -1.00$.
3. Lower bound $= \max(44.45 - 40, 0) = 4.45$; upper bound $= 44.45$.
4. €4.00 < €4.45: buy the put and the share (pay €44.00) and borrow €44.45.
5. Profit today $= 4.45 - 4.00 = €0.45$; at maturity the position is worth $\max(X, S_T) - X \geq 0$.

@answer
Intrinsic €5.00, time value −€1.00, bounds €4.45 and €44.45; the put is below its lower bound, riskless profit €0.45.

@pitfalls
- Using $X$ instead of $PV(X)$ in the bounds of a European option.
- Thinking a negative time value is impossible; it happens for deep in-the-money European puts.
- Reversing the arbitrage: you always **buy** the option that is too cheap.
- Using months/12 when the question says days/365.
`,

  'L1.parity': ex`
@task
A share price, a call and a put with the same strike and maturity, the risk-free rate and possibly a dividend. You are asked for $PV(X)$ (and $PV(D)$), what $c - p$ should be, whether the quotes allow arbitrage and the riskless profit.

@idea
A long call plus a short put pays $S_T - X$ in every state — the same as holding the share and owing $X$. So their values must match:

$$c - p = S - PV(D) - PV(X)$$

If the market's $c - p$ is larger, the call is too expensive relative to the put: sell the call, buy the put and the share, and borrow. If it is smaller, do the reverse. The profit is the gap.

@steps
1. $PV(X) = X e^{-rT}$; with a dividend, $PV(D) = D e^{-r t_D}$.
2. Theoretical $c - p = S - PV(D) - PV(X)$.
3. Market $c - p$ from the quotes.
4. Market > theory → sell call, buy put and share, borrow. Market < theory → buy call, sell put, short share, invest.
5. Profit $= |$market $-$ theory$|$.

@example
Share €50, no dividend; 6-month call €4.50 and put €2.70 with strike €50; $r = 4\%$.

@solution
1. $PV(X) = 50 e^{-0.02} = 49.01$.
2. Theory: $c - p = 50 - 49.01 = 0.99$.
3. Market: $4.50 - 2.70 = 1.80$.
4. The call is too expensive: sell the call, buy the put and the share, borrow €49.01.
5. Profit $= 1.80 - 0.99 = €0.81$ today; at maturity the position is worth zero in every state.

@answer
Parity requires c − p = €0.99; the market has €1.80, so selling the call and buying the synthetic call earns €0.81.

@pitfalls
- Forgetting to subtract the PV of a dividend paid before maturity.
- Using $X$ instead of $PV(X)$.
- Getting the direction wrong: the expensive side is always sold.
`,

  'L1.putInterval': ex`
@task
Calls are quoted with a bid and an ask. You are asked for the lowest ask and highest bid of a European put with the same strike and maturity that rule out arbitrage.

@idea
Put-call parity gives a synthetic put: $p = c - S + PV(X)$ (sell the share, buy the call, invest $PV(X)$, or the reverse). With bid and ask prices, each arbitrage trades at the unfavourable side:

- If the put's **ask** is too low, buy the put and sell the synthetic put (sell the call at the bid): $p^{ask} \geq c^{bid} - S + PV(X)$.
- If the put's **bid** is too high, sell the put and buy the synthetic put (buy the call at the ask): $p^{bid} \leq c^{ask} - S + PV(X)$.

@steps
1. $PV(X) = X e^{-rT}$.
2. Lowest put ask $= c^{bid} - S + PV(X)$.
3. Highest put bid $= c^{ask} - S + PV(X)$.

@example
Calls with strike €32 and 3 months to maturity: bid €3.00, ask €3.20. Share €30, $r = 6\%$.

@solution
1. $PV(X) = 32 e^{-0.06 \times 0.25} = 31.5236$.
2. Lowest ask $= 3.00 - 30 + 31.5236 = €4.52$.
3. Highest bid $= 3.20 - 30 + 31.5236 = €4.72$.

@answer
The put's ask must be at least €4.52 and its bid at most €4.72.

@pitfalls
- Using the call ask for the lower limit (or the bid for the upper).
- Forgetting the minus sign on $S$ or using $X$ instead of $PV(X)$.
`,

  'L1.earlyPut': ex`
@task
An American put on a share without dividends, the share has fallen far. You are asked what exercising now and investing the proceeds gives at maturity, the most the put can pay if you wait, the share price below which early exercise is certainly optimal, and the decision.

@idea
Waiting can never give more than $X$ (if the share falls to zero). Exercising now gives $X - S$ immediately, which grows to $(X - S)e^{rT}$. If that already beats $X$, waiting cannot win:

$$(X - S)e^{rT} > X \iff S < X\left(1 - e^{-rT}\right)$$

This is a **sufficient** condition: above the threshold early exercise may still be optimal, but this comparison does not prove it.

@steps
1. Exercise now and invest: $(X - S)e^{rT}$.
2. Best case if you wait: $X$.
3. Threshold $= X(1 - e^{-rT})$.
4. $S$ below the threshold → exercise now is certainly optimal.

@example
American put with strike €50, 6 months left, share at €1.20, $r = 6\%$.

@solution
1. $(50 - 1.20)e^{0.06 \times 0.5} = 48.80 \times 1.0305 = €50.29$.
2. Waiting pays at most €50.
3. Threshold $= 50(1 - e^{-0.03}) = €1.48$.
4. €1.20 < €1.48: exercise now.

@answer
Exercising gives €50.29 at maturity, more than the €50 maximum from waiting: exercise immediately.

@pitfalls
- Comparing with $X - S$ instead of $X$ as the best outcome of waiting.
- Concluding "never exercise" when the share is above the threshold; the test is only sufficient.
- Applying this to an American call without dividends, which is never exercised early.
`,

  'L1.dividend': ex`
@task
A share pays a known dividend before the options mature. You are asked for the lower bounds of the European call and put, and whether an American call can be optimally exercised just before the ex-dividend date.

@idea
The dividend leaves the firm, so the share is worth $S - PV(D)$ for the option holder:

$$c \geq \max(S - PV(D) - PV(X), 0), \qquad p \geq \max(PV(X) + PV(D) - S, 0)$$

An American call is exercised early only to capture the dividend. Exercising at $t$ (just before ex-date) costs the interest on $X$ over the remaining time, $X(1 - e^{-r(T-t)})$. If the dividend is smaller, early exercise is never optimal.

@steps
1. $PV(D) = De^{-rt_D}$, $PV(X) = Xe^{-rT}$.
2. Call bound $= \max(S - PV(D) - PV(X), 0)$; put bound $= \max(PV(X) + PV(D) - S, 0)$.
3. Threshold $= X(1 - e^{-r(T - t_D)})$.
4. $D >$ threshold → early exercise can be optimal; otherwise never.

@example
Share €60, dividend €1.50 in 3 months; options with strike €58 maturing in 6 months; $r = 5\%$.

@solution
1. $PV(D) = 1.50e^{-0.0125} = 1.4814$; $PV(X) = 58e^{-0.025} = 56.5680$.
2. Call $\geq 60 - 1.4814 - 56.5680 = €1.95$; put $\geq \max(56.57 + 1.48 - 60, 0) = 0$.
3. Threshold $= 58(1 - e^{-0.05 \times 0.25}) = €0.72$.
4. €1.50 > €0.72: early exercise just before the dividend can be optimal.

@answer
Call bound €1.95, put bound €0; with a €1.50 dividend above the €0.72 threshold, early exercise of the American call can be optimal.

@pitfalls
- Forgetting the dividend in the bounds, or adding it with the wrong sign.
- Using the full time to maturity $T$ in the threshold instead of $T - t_D$.
- Thinking the dividend test alone makes exercise optimal; it is necessary, not sufficient.
`,

  'L1.concept': ex`
@task
Concept questions on options, bounds, parity and early exercise: true/false, find the false (or true) statement, or the best short answer.

@idea
- Options are rights, not obligations; forwards are obligations.
- European call (no income): $\max(S - PV(X), 0) \leq c \leq S$. European put: $\max(PV(X) - S, 0) \leq p \leq PV(X)$.
- Parity (European, no income): $c = p + S - PV(X)$. For **American** options only $S - X \leq C - P \leq S - PV(X)$.
- An American call without income is never exercised early ($C = c$); an American put may be, so $P > p$ is possible.
- Deep in-the-money European puts can have a negative time value.
- Income lowers call bounds and raises put bounds.

@steps
1. Identify the option type (call/put, European/American) and whether there is income.
2. Recall the matching bound, parity or exercise rule.
3. Watch for $X$ vs $PV(X)$ and "exactly" vs inequality.
4. Pick the odd one out among four options.

@example
True or false? "An American call on a share without dividends should be exercised as soon as it is deep in the money."

@solution
1. American call, no income.
2. Its value is at least $S - PV(X) > S - X$, the exercise value.
3. Selling the call always beats exercising it.

@answer
False. An American call on a non-dividend share is never exercised early.

@pitfalls
- "Put-call parity holds exactly for American options": false.
- "An American put equals the European put without dividends": false.
- "A European put can be worth more than its strike": false (at most $PV(X)$).
- "Time value can never be negative": false.
`,

  'PS1.ex1': ex`
@task
A table of American call and put prices for several strikes and maturities, a share without dividends and risk-free rates. You are asked about one call (intrinsic and time value, bounds, arbitrage), whether a call–put pair satisfies American put-call parity, and whether a put should be exercised immediately.

@idea
- An American call without dividends is never exercised early, so it has the **European** bounds: $\max(S - PV(X), 0) \leq C \leq S$.
- American parity is only a band: $S - X \leq C - P \leq S - PV(X)$. Above the band the call is too expensive relative to the put; below it too cheap.
- An American put can be exercised at any time, so it can never trade below $X - S$; if it does, buy and exercise it.

@steps
1. Call: intrinsic $\max(S - X, 0)$; time value $=$ price $-$ intrinsic; bounds as above with $PV(X) = Xe^{-r \cdot days/365}$.
2. Call below its lower bound → buy call, short share, invest $PV(X)$.
3. Parity: compute $C - P$ and compare with $S - X$ and $S - PV(X)$.
4. Put: compare its price with $X - S$.

@example
Share €100. A 60-day call with strike €95 costs €5.80; $r = 3\%$. The 60-day call and put with strike €100 cost €3.50 and €2.60. A put with strike €105 costs €4.70.

@solution
1. Call 95: intrinsic €5.00, time value €0.80; $PV(95) = 95e^{-0.03 \times 60/365} = 94.53$, lower bound €5.47, upper bound €100.
2. €5.80 > €5.47: no arbitrage from the bounds.
3. $C - P = 0.90$; band: $100 - 100 = 0$ to $100 - 99.51 = 0.49$. 0.90 is above the band: sell the call, buy the put and the share, borrow $PV(X)$.
4. Put 105: exercise value €5.00 > price €4.70 → buy and exercise at once for €0.30.

@answer
Call 95: bounds €5.47–€100, no arbitrage. The 100-strike pair violates the upper parity bound. The 105 put should be bought and exercised.

@pitfalls
- Using $S - X$ as the call's lower bound; with no dividends it is $S - PV(X)$.
- Applying European parity as an equality to American options.
- Forgetting that each maturity has its own rate.
`,

  'PS1.ex4': ex`
@task
For European options on a share without dividends you get the time values of two calls. You fill in a table of intrinsic values, time values and bounds for the calls and for a put (via put-call parity), and judge whether a quoted call price allows arbitrage.

@idea
Price $=$ intrinsic value $+$ time value. With the call price known, parity gives the put: $p = c - S + PV(X)$. Then apply the usual bounds:

- Call: $\max(S - PV(X), 0)$ to $S$.
- Put: $\max(PV(X) - S, 0)$ to $PV(X)$.

A quote below the call's lower bound is an arbitrage: buy the call, short the share, invest $PV(X)$.

@steps
1. Intrinsic values: call $\max(S - X, 0)$, put $\max(X - S, 0)$.
2. Call prices $=$ intrinsic $+$ time value.
3. Put price $= c - S + PV(X)$; its time value = $p$ − intrinsic value (may be negative).
4. Bounds from the formulas above.
5. Compare the quoted call with its lower bound.

@example
Share €40, 3 months, $r = 4\%$. Call X = €36 has time value 1.20; call X = €44 has time value 1.50. A dealer quotes the 36-call at €4.20.

@solution
1. Call 36 intrinsic €4.00; call 44 intrinsic 0; put 44 intrinsic €4.00.
2. Call 36 $= 5.20$; call 44 $= 1.50$.
3. $PV(44) = 43.5622$; put $= 1.50 - 40 + 43.5622 = 5.0622$; time value $= 1.0622$.
4. Call 36: lower $40 - 35.6418 = 4.36$, upper 40. Put 44: lower $43.56 - 40 = 3.56$, upper 43.56.
5. €4.20 < €4.36: buy the call, short the share, invest €35.64 → €0.16 today.

@answer
Put 44 worth €5.06 (bounds €3.56–€43.56); the 36-call at €4.20 is below its €4.36 lower bound — arbitrage of €0.16.

@pitfalls
- Using the call's intrinsic value as its lower bound.
- Using $X$ instead of $PV(X)$ in parity or bounds.
- Taking the put's upper bound as $X$ instead of $PV(X)$.
`,
};
