import { ex, type ExplainMap } from '@/lib/explain';

export const L4: ExplainMap = {
  'L4.bs': ex`
@task
A share without dividends, its volatility, the risk-free rate and a strike and maturity. You are asked for $d_1$, $d_2$, the Black-Scholes call and put values, and the number of shares that makes a short call position delta-neutral.

@idea
$$d_1 = \frac{\ln(S/X) + (r + \sigma^2/2)T}{\sigma\sqrt T}, \qquad d_2 = d_1 - \sigma\sqrt T$$
$$c = S\,N(d_1) - Xe^{-rT}N(d_2), \qquad p = Xe^{-rT}N(-d_2) - S\,N(-d_1)$$

$N(d_1)$ is the call's delta: the number of shares that moves like one call. A trader who has written $n$ calls holds $n \cdot N(d_1)$ shares to be delta-neutral. Check: $c - p = S - Xe^{-rT}$.

@steps
1. $T$ in years; compute $\sigma\sqrt T$.
2. $d_1$, then $d_2 = d_1 - \sigma\sqrt T$.
3. $N(d_1)$, $N(d_2)$ (and $N(-d) = 1 - N(d)$).
4. Call and put from the formulas.
5. Delta hedge: $n \times N(d_1)$ shares.

@example
Share €50, strike €52, $\sigma = 30\%$, $r = 4\%$, 6 months. A trader has written 1,000 calls.

@solution
1. $\sigma\sqrt T = 0.3 \times 0.7071 = 0.2121$.
2. $d_1 = (\ln(50/52) + (0.04 + 0.045) \times 0.5)/0.2121 = 0.0155$; $d_2 = -0.1967$.
3. $N(d_1) = 0.5062$, $N(d_2) = 0.4220$.
4. $c = 50 \times 0.5062 - 52e^{-0.02} \times 0.4220 = €3.80$; $p = 50.97 \times 0.5780 - 50 \times 0.4938 = €4.77$.
5. Hold $1{,}000 \times 0.5062 = 506$ shares.

@answer
d1 = 0.0155, d2 = −0.1967, call €3.80, put €4.77, delta hedge 506 shares.

@pitfalls
- Forgetting the $\sigma^2/2$ term or using $\sigma$ instead of $\sigma\sqrt T$.
- Using $N(d_2)$ as the delta.
- Mixing up $N(-d)$ and $-N(d)$.
- Taking $T$ in months.
`,

  'L4.probability': ex`
@task
The share follows $dS = \mu S\,dt + \sigma S\,dz$. You are asked for the real-world and the risk-neutral probability that a call is exercised, its Black-Scholes value, the implied volatility of a market price, and what the comparison says.

@idea
Under the lognormal model the probability that $S_T > X$ is $N(d_2)$, where $d_2$ uses the drift of the share:

- **Risk-neutral** (used for pricing): drift $r$ → $N(d_2)$ with $d_2 = \frac{\ln(S/X) + (r - \sigma^2/2)T}{\sigma\sqrt T}$.
- **Real-world**: drift $\mu$ → replace $r$ by $\mu$.

A market price above the Black-Scholes value means the market uses a **higher** volatility (implied volatility > the estimate).

@steps
1. $T$ = weeks/52.
2. Real-world: $d_2^{\mu} = \frac{\ln(S/X) + (\mu - \sigma^2/2)T}{\sigma\sqrt T}$, probability $N(d_2^\mu)$.
3. Risk-neutral: same with $r$, probability $N(d_2)$.
4. Black-Scholes call with $\sigma$.
5. Implied vol: try volatilities until the BS value matches the market price.

@example
$S = €20$, $X = €22$, $\mu = 15\%$, $\sigma = 30\%$, $r = 4\%$, 8 weeks. The call trades at €0.40.

@solution
1. $T = 8/52 = 0.1538$; $\sigma\sqrt T = 0.1177$.
2. $d_2^\mu = (\ln(20/22) + (0.15 - 0.045) \times 0.1538)/0.1177 = -0.673$ → 25.1%.
3. $d_2 = (\ln(20/22) + (0.04 - 0.045) \times 0.1538)/0.1177 = -0.817$ → 20.7%.
4. $d_1 = -0.699$; $c = 20 \times 0.2423 - 22e^{-0.0062} \times 0.2071 = €0.32$.
5. €0.40 > €0.32, so the implied volatility is above 30%.

@answer
Real-world exercise probability 25.1%, risk-neutral 20.7%, BS value €0.32; the market implies a higher volatility.

@pitfalls
- Using $N(d_1)$ as the exercise probability.
- Using $r$ for the real-world probability (or $\mu$ for the price).
- Weeks/52, not weeks/365.
`,

  'L4.dividends': ex`
@task
Black-Scholes with income: either a known dividend before maturity (share) or a continuous dividend yield (index). You are asked for the adjusted input and the call and put values.

@idea
Dividends go to the shareholder, not to the option holder.

- **Known dividend**: use $S^* = S - De^{-rt_D}$ in place of $S$.
- **Continuous yield** $q$: use $Se^{-qT}$ in place of $S$; equivalently $d_1 = \frac{\ln(S/X) + (r - q + \sigma^2/2)T}{\sigma\sqrt T}$ and $c = Se^{-qT}N(d_1) - Xe^{-rT}N(d_2)$.

Everything else in the formula is unchanged. Income lowers calls and raises puts.

@steps
1. Adjusted price: $S - PV(D)$ or $Se^{-qT}$.
2. $d_1$, $d_2$ with the adjusted price (or with $r - q$).
3. Call and put with the standard formulas.
4. Check: $c - p = S_{adj} - Xe^{-rT}$.

@example
Share €40, dividend €1 in 3 months, strike €40, 6 months, $\sigma = 30\%$, $r = 5\%$.

@solution
1. $S^* = 40 - e^{-0.0125} = 39.0124$.
2. $d_1 = (\ln(39.0124/40) + (0.05 + 0.045) \times 0.5)/0.2121 = 0.1061$; $d_2 = -0.1061$.
3. $c = 39.0124 \times 0.5422 - 39.0124 \times 0.4578 = €3.30$; $p = €3.30$.
4. $PV(X) = 40e^{-0.025} = 39.0124 = S^*$, so $c = p$ here, as parity requires.

@answer
Use S* = €39.01; call and put are both worth €3.30.

@pitfalls
- Subtracting the dividend without discounting it.
- Subtracting a dividend paid after maturity.
- With a yield, discounting with $q$ in $Xe^{-rT}$ as well.
`,

  'L4.implied': ex`
@task
A call's market price, the share price, strike, maturity and rate. You are asked for the volatility that makes the Black-Scholes value equal the market price.

@idea
There is no closed formula for $\sigma$, but the call value rises steadily with volatility. So search: guess $\sigma$, compute the BS price, and adjust — higher if the BS price is too low, lower if too high — until it matches (bisection or interpolation).

@steps
1. Pick two volatilities whose BS prices bracket the market price.
2. Interpolate linearly for a first estimate.
3. Recompute the BS price there and narrow the bracket.
4. Stop when the price matches to the cent.

@example
Call with strike €50, 3 months, share €50, $r = 4\%$, market price €3.20.

@solution
1. $\sigma = 25\%$ gives €2.74; $\sigma = 30\%$ gives €3.23.
2. Interpolate: $25\% + 5\% \times (3.20 - 2.74)/(3.23 - 2.74) = 29.7\%$.
3. BS at 29.7% ≈ €3.20.
4. Done.

@answer
Implied volatility ≈ 29.7%.

@pitfalls
- Searching in the wrong direction: a higher price needs a higher volatility.
- Using a put formula for a call price.
- Stopping at the first linear guess when the bracket is wide.
`,

  'L4.lognormal': ex`
@task
A share follows geometric Brownian motion with expected return $\mu$ and volatility $\sigma$. You are asked for the mean and standard deviation of $\ln S_T$, the expected price, a 95% confidence interval and the probability of ending above a level.

@idea
$\ln S_T$ is normally distributed:

$$\ln S_T \sim N\!\left(\ln S_0 + (\mu - \sigma^2/2)T,\; \sigma^2 T\right)$$

So intervals and probabilities are computed for $\ln S_T$ and then exponentiated. The expected price is $E[S_T] = S_0 e^{\mu T}$ (larger than the median $e^{m}$).

@steps
1. $m = \ln S_0 + (\mu - \sigma^2/2)T$; $s = \sigma\sqrt T$.
2. $E[S_T] = S_0 e^{\mu T}$.
3. 95% interval: $e^{m \pm 1.96 s}$.
4. $P(S_T > K) = 1 - N\left(\frac{\ln K - m}{s}\right)$.

@example
$S_0 = €50$, $\mu = 12\%$, $\sigma = 25\%$, one year, level €60.

@solution
1. $m = \ln 50 + (0.12 - 0.03125) = 4.0008$; $s = 0.25$.
2. $E[S_T] = 50e^{0.12} = €56.37$.
3. $e^{4.0008 \pm 0.49}$ → €33.47 to €89.19.
4. $(\ln 60 - 4.0008)/0.25 = 0.374$ → $1 - 0.646 = 35.4\%$.

@answer
ln S_T has mean 4.0008 and sd 0.25; E[S_T] = €56.37; interval €33.47–€89.19; P(S_T > 60) = 35.4%.

@pitfalls
- Treating $S_T$ itself as normal.
- Forgetting $-\sigma^2/2$ in the mean of $\ln S_T$, or using it in $E[S_T]$.
- Using $\sigma$ instead of $\sigma\sqrt T$.
`,

  'L4.concept': ex`
@task
Concept questions on Black-Scholes and the lognormal model: true/false, find the false (or true) statement, or the best short answer.

@idea
- $\ln S_T$ is normal with mean $\ln S_0 + (\mu - \sigma^2/2)T$ and variance $\sigma^2T$; $S_T$ is lognormal, $E[S_T] = S_0 e^{\mu T}$ (the median is lower).
- $c = SN(d_1) - Xe^{-rT}N(d_2)$; call delta $N(d_1)$, put delta $N(d_1) - 1$.
- $N(d_2)$ is the **risk-neutral** exercise probability; the real-world one uses $\mu$.
- The option value does **not** depend on $\mu$.
- Implied volatility makes the BS value equal the market price; it need not equal historical volatility.
- Dividends: use $S - PV(D)$ or $Se^{-qT}$.

@steps
1. Identify the quantity (probability, delta, distribution, effect of μ).
2. Check real-world vs risk-neutral.
3. Check "normal" vs "lognormal", mean vs median.
4. Pick the odd one out among four options.

@example
True or false? "A higher expected return on the share raises the Black-Scholes value of a call."

@solution
1. The BS formula contains $S$, $X$, $r$, $\sigma$, $T$ — not $\mu$.
2. The option is priced by replication, which works whatever $\mu$ is.

@answer
False. The expected return does not enter the option value.

@pitfalls
- "N(d2) is the real-world exercise probability": false.
- "The share price itself is normally distributed": false.
- "The put delta is N(d1)": false.
- "The median is $S_0e^{\mu T}$": false, that is the mean.
`,

  'PS4.ex9': ex`
@task
A troubled company's share trades far below the strike. You value a deep in-the-money European put and the call by Black-Scholes, and then again after a dividend is announced.

@idea
Use the standard Black-Scholes formulas; with a dividend, replace $S$ by $S - PV(D)$. Two lessons:

- A deep in-the-money **European** put can be worth **less than** $X - S$: you cannot exercise early, and the strike is received only at maturity (its present value is smaller).
- A dividend lowers the share price at the ex-date: the put becomes more valuable, the call less.

The call follows from parity: $c = p + S - PV(X)$.

@steps
1. $d_1$, $d_2$ with $S$; $p = Xe^{-rT}N(-d_2) - SN(-d_1)$; $c = p + S - Xe^{-rT}$.
2. Compare $p$ with $X - S$.
3. With the dividend: $S^* = S - De^{-rt_D}$; recompute.

@example
Share €10, strike €20, $\sigma = 60\%$, $r = 4\%$, 2 months. Then a dividend of €1 in 1 month.

@solution
1. $d_1 = -2.680$, $d_2 = -2.925$; $p = 20e^{-0.0067} \times 0.9983 - 10 \times 0.9963 = €9.87$; $c = €0.0026$.
2. $9.87 < X - S = 10$: the European put is worth less than its intrinsic value.
3. $S^* = 10 - e^{-0.04/12} = 9.0033$: $p = €10.86$, $c = €0.0005$.

@answer
Put €9.87 and call €0.003 without the dividend; €10.86 and €0.0005 with it.

@pitfalls
- Assuming a put can never be worth less than $X - S$ (that holds only for American puts).
- Forgetting to discount the dividend.
- Rounding $N(\cdot)$ too early for such extreme values of $d$.
`,
};
