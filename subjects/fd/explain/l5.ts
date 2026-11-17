import { ex, type ExplainMap } from '@/lib/explain';

export const L5: ExplainMap = {
  'L5.guaranteed': ex`
@task
A structured product sells at €1,000 and pays a guaranteed amount plus $\alpha$ times the payoff of a call (or put) on a share. Given the bank's margin, you are asked for the PV of the guarantee, the Black-Scholes value of one option, $\alpha$, and the payoff for a given final share price.

@idea
Decompose the product: a **zero-coupon bond** paying the guarantee $G$ plus **$\alpha$ options**. The bank keeps its margin, so what remains of the price buys options:

$$\alpha = \frac{\text{price} \times (1 - \text{margin}) - Ge^{-rT}}{\text{option value}}$$

@steps
1. PV of the guarantee $= Ge^{-rT}$.
2. Option value by Black-Scholes.
3. Budget $=$ price × (1 − margin) − PV(G); $\alpha =$ budget $/$ option value.
4. Payoff $= G + \alpha \times$ option payoff at $S_T$.

@example
Price €1,000, guarantee €950, 1 year, call with strike €20 on a share at €20, $\sigma = 40\%$, $r = 3\%$, margin 3%.

@solution
1. $PV(G) = 950e^{-0.03} = 921.92$.
2. Call value $= €3.43$.
3. Budget $= 970 - 921.92 = 48.08$; $\alpha = 48.08/3.43 = 14.03$.
4. If $S_T = 25$: $950 + 14.03 \times 5 = €1{,}020.13$.

@answer
α = 14.03 calls per unit; payoff €1,020.13 at a final price of €25.

@pitfalls
- Using the full €1,000 instead of the price net of the margin.
- Forgetting to discount the guarantee.
- Dividing by the option's payoff instead of its value.
`,

  'L5.floor': ex`
@task
A product pays $\max(A, B - S_T)$ where $S_T$ is a commodity price with storage costs and a convenience yield. You are asked for the decomposition, the annual volatility from weekly data, real-world and risk-neutral probabilities that it pays exactly $A$, the option value and the product's value.

@idea
$\max(A, B - S_T) = A + \max(0, (B - A) - S_T)$: a **bond paying $A$** plus a **put** with strike $K = B - A$.

For a commodity, risk-neutral growth is $r + u - y$ (storage cost $u$ adds, convenience yield $y$ subtracts), so it behaves like an asset with yield $q = y - u$ in Black-Scholes. Weekly figures scale with $\sqrt{52}$ (volatility) and 52 (mean).

It pays exactly $A$ when $S_T \geq K$: risk-neutral probability $N(d_2)$; the real-world one uses the real drift.

@steps
1. $K = B - A$; product $=$ bond($A$) $+$ put($K$).
2. $\sigma = \sigma_{week}\sqrt{52}$; $q = y - u$.
3. Put by Black-Scholes with $Se^{-qT}$.
4. Value $= Ae^{-rT} +$ put.
5. Real-world: $\ln S_T \sim N(\ln S + 52T\mu_w,\; \sigma_w^2 52T)$; $P = 1 - N\left(\frac{\ln K - m}{s}\right)$. Risk-neutral: $N(d_2)$.

@example
Lead at €600/t; product pays max(€1,000, €1,500 − S) in 2 years. $r = 3\%$, convenience yield 2%, storage cost 4%, weekly mean log change 0.3% and sd 3%.

@solution
1. $K = 500$: bond paying 1,000 plus a put with strike 500.
2. $\sigma = 0.03\sqrt{52} = 21.63\%$; $q = 0.02 - 0.04 = -2\%$.
3. Put $= €15.86$.
4. Value $= 1{,}000e^{-0.06} + 15.86 = €957.63$.
5. Real-world $P(S_T \geq 500) = 94.7\%$; risk-neutral $N(d_2) = 77.9\%$.

@answer
Bond €941.76 + put €15.86 = €957.63 per unit.

@pitfalls
- Decomposing into a call; the payoff rises when the price falls → put.
- Getting the sign of $q$ wrong: storage costs raise the forward price, the convenience yield lowers it.
- Annualising the weekly sd with 52 instead of $\sqrt{52}$.
`,

  'L5.absolute': ex`
@task
A product costs €1,000 and pays $K(1 + |R|)$, where $R$ is a share's return to maturity. You are asked for the building blocks, the at-the-money call and put values, the $K$ that leaves the bank its margin, and the payoff for a given final price.

@idea
$K(1 + |R|) = K + K\frac{|S_T - S_0|}{S_0}$, and $|S_T - S_0| = \max(S_T - S_0, 0) + \max(S_0 - S_T, 0)$. So one unit is a **bond paying $K$** plus **$K/S_0$ at-the-money straddles** (calls and puts struck at $S_0$). Its value per unit of $K$ is

$$e^{-rT} + \frac{c + p}{S_0}$$

and $K$ follows from price × (1 − margin) $= K \times$ that value.

@steps
1. ATM call and put by Black-Scholes ($X = S_0$).
2. Value per €1 of $K$: $e^{-rT} + (c + p)/S_0$.
3. $K = \text{price}(1 - \text{margin}) /$ step 2.
4. Payoff $= K(1 + |S_T/S_0 - 1|)$.

@example
Share €20, $\sigma = 40\%$, $r = 2\%$, 6 months, price €1,000, margin 5%.

@solution
1. $c = 2.339$, $p = 2.140$.
2. $e^{-0.01} + 4.479/20 = 0.9900 + 0.2240 = 1.2140$.
3. $K = 950/1.2140 = €782.54$.
4. If $S_T = 23$ ($R = 15\%$): $782.54 \times 1.15 = €899.92$.

@answer
K = €782.54; payoff €899.92 after a 15% move either way.

@pitfalls
- Using only calls: a fall also pays.
- Buying $K$ straddles instead of $K/S_0$.
- Ignoring the margin.
`,

  'L5.participation': ex`
@task
A capital-protected note on an index: it repays (part of) the €1,000 and adds a participation rate times the index's rise. You are asked for the PV of the protection, the ATM call value, the participation rate the issuer can offer, and the payoff for a given rise.

@idea
The note is a **zero-coupon bond** for the protected amount plus **calls** on the index. One unit of participation in €1,000 × max($S_T/S_0 - 1$, 0) equals $1{,}000/S_0$ ATM calls. What is left after the margin and the bond buys calls:

$$\text{participation} = \frac{1{,}000(1 - m) - \text{prot} \times 1{,}000e^{-rT}}{(1{,}000/S_0) \times c}$$

with $c$ from Black-Scholes with the dividend yield $q$.

@steps
1. PV of protection $=$ prot × 1,000 × $e^{-rT}$.
2. ATM call with $Se^{-qT}$ (index points).
3. Budget $= 1{,}000(1 - m) -$ step 1.
4. Participation $=$ budget $/ ((1{,}000/S_0)c)$.
5. Payoff $=$ protection $+$ participation × 1,000 × rise.

@example
Index 4,000, $\sigma = 20\%$, $q = 2\%$, $r = 3\%$, 5 years, full protection, margin 2%.

@solution
1. $1{,}000e^{-0.15} = 860.71$.
2. $c = 716.87$ points.
3. Budget $= 980 - 860.71 = 119.29$.
4. Cost of 100% participation $= 0.25 \times 716.87 = 179.22$; participation $= 66.6\%$.
5. Index +40%: $1{,}000 + 0.666 \times 400 = €1{,}266.25$.

@answer
Participation rate 66.6%; €1,266 if the index rises 40%.

@pitfalls
- Forgetting the dividend yield (it makes calls cheaper).
- Pricing calls on the €1,000 instead of $1{,}000/S_0$ units of the index.
- Believing higher volatility raises participation; calls get dearer, so it falls.
`,

  'L5.reverse': ex`
@task
A reverse convertible pays a coupon and, at maturity, €1,000 if the share ends at or above its initial price, otherwise $1{,}000/S_0$ shares. You are asked for the building blocks, the ATM put value, the coupon the issuer can offer and the payoff for a given final price.

@idea
Delivering shares worth less than €1,000 when the share falls is the same as **selling puts**: the payoff is $1{,}000(1 + k) - \frac{1{,}000}{S_0}\max(S_0 - S_T, 0)$. So the note is a bond paying $1{,}000(1 + k)$ minus $1{,}000/S_0$ ATM puts. The investor is compensated for the puts with the coupon:

$$1{,}000(1 - m) = 1{,}000(1 + k)e^{-rT} - \frac{1{,}000}{S_0}\,p \;\Rightarrow\; k = \frac{(1{,}000(1-m) + \frac{1{,}000}{S_0}p)\,e^{rT}}{1{,}000} - 1$$

@steps
1. ATM put by Black-Scholes.
2. Shares per note $= 1{,}000/S_0$.
3. Coupon $k$ from the formula.
4. Payoff $= 1{,}000k + \min(1{,}000,\; \frac{1{,}000}{S_0} S_T)$.

@example
Share €40, $\sigma = 30\%$, $r = 3\%$, 1 year, margin 2%.

@solution
1. Put $= €4.13$.
2. 25 shares per note.
3. $k = (980 + 25 \times 4.13)e^{0.03}/1{,}000 - 1 = 11.6\%$.
4. If $S_T = 32$: $116.27 + 25 \times 32 = €916.27$.

@answer
Coupon 11.6%; if the share falls to €32 the note pays €916.27.

@pitfalls
- Adding calls instead of subtracting puts.
- Thinking the note protects against a falling share; the investor bears the fall.
- Forgetting that the coupon is paid in either case.
`,

  'L5.concept': ex`
@task
Concept questions on structured products: true/false, find the false (or true) statement, or the best short answer.

@idea
- Value a product by splitting it into bonds, the underlying and plain options; the issuer's margin is the **selling price minus** that value.
- Guarantee + upside $=$ bond $+$ calls. $\max(A, B - S_T) =$ bond($A$) $+$ put($B - A$). $K(1 + |R|) =$ bond($K$) $+$ $K/S_0$ ATM calls and puts.
- Reverse convertible $=$ bond $-$ puts: higher coupon, the investor bears the downside.
- Higher volatility makes options dearer → lower participation rates for capital-protected notes.
- Commodities grow at $r +$ storage $-$ convenience yield under the risk-neutral measure.

@steps
1. Write the payoff as a sum of simple payoffs.
2. Identify which options are long or short.
3. Check the effect of volatility, rates and margins.
4. Pick the odd one out among four options.

@example
True or false? "A reverse convertible protects the investor against a fall in the share price."

@solution
1. Payoff: €1,000(1 + k) if the share holds up, otherwise shares worth less.
2. That is a bond minus puts: the investor has **sold** downside protection.

@answer
False. The investor bears the fall and earns the higher coupon for it.

@pitfalls
- "Participation rises with volatility": false.
- "Margin = guarantee − price": false; it is price − value.
- "$\max(A, B - S_T)$ contains a call": false, a put.
- "Structured products cannot be decomposed": false.
`,
};
