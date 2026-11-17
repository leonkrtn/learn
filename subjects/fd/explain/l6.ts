import { ex, type ExplainMap } from '@/lib/explain';

export const L6: ExplainMap = {
  'L6.forward': ex`
@task
The fair forward price of a share (with or without a dividend), an index with a yield, a currency, or a commodity with storage costs and a convenience yield. For financial assets you also judge a dealer's quote and the riskless profit.

@idea
Cost of carry: buying the asset today and holding it must cost the same as buying it forward.

| Asset | Forward price |
|---|---|
| No income | $Se^{rT}$ |
| Known income, PV $I$ | $(S - I)e^{rT}$ |
| Yield $q$ | $Se^{(r-q)T}$ |
| Currency (foreign rate $r_f$) | $Se^{(r - r_f)T}$ |
| Commodity (storage $u$, convenience $y$) | $Se^{(r + u - y)T}$ |

If the quote is **above** $F$: borrow, buy the asset, sell forward (cash and carry). If **below**: short the asset, invest, buy forward (reverse cash and carry). Profit at maturity $= |$quote $- F|$.

@steps
1. Pick the formula for the asset type.
2. Compute $F$ (discount income with $e^{-rt}$ first).
3. Compare with the quote and choose the direction.
4. Profit per unit $= |$quote $- F|$ at maturity.

@example
A share without dividends trades at €50; $r = 4\%$; delivery in 6 months. A dealer quotes €52.

@solution
1. No income: $F = Se^{rT}$.
2. $F = 50e^{0.02} = €51.01$.
3. €52 > €51.01: borrow €50, buy the share, sell it forward at €52.
4. At maturity: receive 52, repay 51.01 → €0.99.

@answer
Fair forward price €51.01; cash and carry earns €0.99 per share.

@pitfalls
- Using simple instead of continuous compounding.
- Adding income instead of subtracting it.
- Using $r_f - r$ for a currency.
- Treating the convenience yield as a cost.
`,

  'L6.value': ex`
@task
A trader entered a long forward with delivery price $K$ some time ago. You are asked for today's forward price for the same date and the value of the long and short positions.

@idea
Today's forward price $F_0$ is what a new contract would lock in at zero value. The old contract locks in $K$ instead, so the long side gains $F_0 - K$ at delivery, worth today

$$f = (F_0 - K)e^{-rT}$$

The short side is worth $-f$.

@steps
1. $F_0 = Se^{(r-q)T}$ ($q = 0$ without income).
2. $f_{long} = (F_0 - K)e^{-rT}$.
3. $f_{short} = -f_{long}$.

@example
Delivery price €48, 6 months left, asset €50 without income, $r = 4\%$.

@solution
1. $F_0 = 50e^{0.02} = 51.01$.
2. $f = (51.01 - 48)e^{-0.02} = €2.95$.
3. Short side: −€2.95.

@answer
Long forward worth €2.95, short −€2.95.

@pitfalls
- Reporting $F_0 - K$ without discounting.
- Using $S - K$ instead of the forward price.
- Giving both sides the same sign.
`,

  'L6.hedge': ex`
@task
Either a commodity exposure hedged with futures on a related commodity (minimum-variance hedge ratio, number of contracts, long or short), or a share portfolio whose beta is changed with index futures (number of contracts).

@idea
- **Minimum-variance hedge**: $h^* = \rho\frac{\sigma_S}{\sigma_F}$; contracts $= h^* \times \frac{\text{exposure}}{\text{contract size}}$. Buying later → long futures; selling later → short futures.
- **Beta change**: $N = (\beta^* - \beta)\frac{V}{F \times \text{multiplier}}$; negative means sell. A full hedge has $\beta^* = 0$.

@steps
1. Commodity: $h^* = \rho\sigma_S/\sigma_F$; $N = h^* Q_A/Q_F$; side from the exposure.
2. Index: $N = (\beta^* - \beta)V/(F \times m)$.

@example
(a) A firm will buy 1,000,000 units; $\sigma_S = 0.05$, $\sigma_F = 0.06$, $\rho = 0.9$; contract size 50,000. (b) A €10m portfolio with beta 1.2 is fully hedged with index futures at 5,000 points, €25 per point.

@solution
1. (a) $h^* = 0.9 \times 0.05/0.06 = 0.75$; $N = 0.75 \times 1{,}000{,}000/50{,}000 = 15$; long futures (it will buy).
2. (b) $N = (0 - 1.2) \times 10{,}000{,}000/(5{,}000 \times 25) = -96$: sell 96 contracts.

@answer
(a) Hedge ratio 0.75, long 15 contracts. (b) Sell 96 index futures.

@pitfalls
- Using $\rho\sigma_F/\sigma_S$.
- Choosing the wrong side: a future purchase is hedged with a long position.
- Forgetting the multiplier in the contract value.
`,

  'L6.margin': ex`
@task
A long or short futures position with initial and maintenance margins and daily settlement prices. You are asked for the margin balance after day 1, the day of the first margin call, the amount paid in, and the cumulative gain.

@idea
Futures are **marked to market daily**: each day's gain or loss is credited to or debited from the margin account. For a long position the change is $+n \times \text{size} \times (F_t - F_{t-1})$; for a short, the negative. If the balance falls **below the maintenance margin**, the investor must pay in enough to restore the **initial** margin.

@steps
1. Total initial and maintenance margin $=$ per contract × number of contracts.
2. Each day: balance $+=$ (±) $n \times$ size × price change.
3. Balance below maintenance → call $=$ initial $-$ balance; reset to initial.
4. Cumulative gain $=$ (±) $n \times$ size × (last price $-$ entry price).

@example
Long 2 contracts of 1,000 units at €50.00; initial margin €5,000 and maintenance €3,750 per contract. Settlement prices: 49.20, 48.50, 48.90, 49.60.

@solution
1. Initial total 10,000; maintenance 7,500.
2. Day 1: $10{,}000 + 2{,}000 \times (-0.80) = 8{,}400$.
3. Day 2: $8{,}400 - 1{,}400 = 7{,}000 < 7{,}500$ → call of €3,000, back to 10,000.
4. Days 3–4: +800, +1,400 → 12,200. Cumulative gain $= 2{,}000 \times (49.60 - 50.00) = -€800$.

@answer
€8,400 after day 1; first margin call on day 2 of €3,000; cumulative loss €800.

@pitfalls
- Topping up only to the maintenance margin.
- Getting the sign wrong for a short position.
- Including margin payments in the gain.
`,

  'L6.swap': ex`
@task
Zero rates (continuous) for several years and an annual-pay interest rate swap that has just been reset. You are asked for a discount factor, the par swap rate, the value of the fixed-rate bond of an existing swap, and the swap's value to the fixed receiver.

@idea
A swap is a fixed-rate bond against a floating-rate bond. Right after a reset the floating bond is worth its **notional**. The par swap rate makes the fixed bond worth par:

$$s = \frac{1 - DF_n}{\sum_{i=1}^n DF_i}, \qquad DF_i = e^{-z_i i}$$

For an existing swap with fixed rate $K$: $B_{fix} = K L \sum DF_i + L \cdot DF_n$, and the receive-fixed value is $B_{fix} - L$.

@steps
1. $DF_i = e^{-z_i \times i}$.
2. Annuity $A = \sum DF_i$.
3. Par rate $s = (1 - DF_n)/A$.
4. $B_{fix} = KLA + L \cdot DF_n$.
5. Value to receive fixed $= B_{fix} - L$ (pay fixed: the negative).

@example
Zero rates 2.0%, 2.5%, 3.0% for 1–3 years; notional €100m; existing swap fixed rate 3.5%.

@solution
1. $DF = 0.9802, 0.9512, 0.9139$.
2. $A = 2.8454$.
3. $s = (1 - 0.9139)/2.8454 = 3.025\%$.
4. $B_{fix} = 3.5 \times 2.8454 + 100 \times 0.9139 = 101.35$.
5. Value $= 101.35 - 100 = €1.35$m.

@answer
Par swap rate 3.03%; the 3.5% swap is worth €1.35m to the fixed receiver.

@pitfalls
- Valuing the floating bond at anything other than par right after a reset.
- Using simple discounting with continuous zero rates.
- Mixing up the sign for the payer and receiver.
`,

  'L6.concept': ex`
@task
Concept questions on forwards, futures and swaps: true/false, find the false (or true) statement, or the best short answer.

@idea
- Forwards and futures are **obligations**. Fair forward: $Se^{rT}$, $(S - I)e^{rT}$, $Se^{(r-q)T}$, $Se^{(r - r_f)T}$; commodities $Se^{(r + u - y)T}$ — the convenience yield **lowers** it.
- A forward entered at the current forward price has zero value **at inception**; later its value is $(F_0 - K)e^{-rT}$.
- Futures settle daily; below the maintenance margin you top up to the initial margin. A short gains when the price falls.
- With constant rates futures and forward prices are equal.
- Hedge ratio $\rho\sigma_S/\sigma_F$; beta change $N = (\beta^* - \beta)V/(F \cdot m)$.
- Swap $=$ fixed bond $-$ floating bond; the floating bond is worth par after a reset; a par swap starts at zero value.

@steps
1. Identify the instrument and the claim.
2. Check the matching formula or rule.
3. Watch signs (long/short, add/subtract income).
4. Pick the odd one out among four options.

@example
True or false? "The convenience yield raises the forward price of a commodity."

@solution
1. The convenience yield is a benefit of physically holding the commodity.
2. Holding the asset is then more attractive than a forward, so the forward price is lower: $F = Se^{(r + u - y)T}$.

@answer
False. It lowers the forward price.

@pitfalls
- "A forward always has zero value": only at inception.
- "A short futures position gains when the price rises": false.
- "The hedge ratio is always 1": false.
- "A new swap has a large value to the payer": false, it starts at zero.
`,
};
