// Suggested exam cheatsheet for Financial Derivatives: one A4 sheet, front and back. Markdown with $…$ formulas.
import { keyFacts } from '@/lib/sheet';
import type { SheetBlock } from '@/lib/subject';
import { BANK, LECTURES } from './concepts';
import { Phi } from './generators';

const B = (topic: string | null, title: string, body: string): SheetBlock => ({ topic, title, body });
const r = String.raw;

/** Standard normal table N(x) for x = 0.0 … 2.9 in three column pairs; N(−x) = 1 − N(x). */
function normalTable(): string {
  const rows = Array.from({ length: 10 }, (_, i) => [i, i + 10, i + 20].map(k => `${(k / 10).toFixed(1)} & ${Phi(k / 10).toFixed(4)}`).join(' & '));
  return '$$\\begin{array}{c|c|c|c|c|c}x&N(x)&x&N(x)&x&N(x)\\\\\\hline ' + rows.join('\\\\ ') + '\\end{array}$$';
}

const BLOCKS: SheetBlock[] = [
  B(null, 'Conventions', r`Continuous compounding: $PV(X)=Xe^{-rT}$, $FV=CF\,e^{rT}$. Days/365, months/12, weeks/52; volatility from daily data ×$\sqrt{252}$. Lecture trees: simple rate per period $(1+r)$. $c,p$ European; $C,P$ American; $D$ = PV of income; $S$ underlying, $X$ strike, $T$ maturity.`),
  B(null, 'Routine for every question', r`1. European or American? Income (dividend, yield, storage)? 2. Convert $T$, discount with $e^{-rT}$. 3. Write the payoff and a table by interval of $S_T$. 4. Check bounds/parity before pricing. 5. Arbitrage: say what you buy/sell, cash today, payoff at $T$.`),
  B(null, 'Derivatives in one paragraph', r`Value derives from an underlying variable (shares, indices, bonds, FX, commodities; also rates, inflation, ratings, weather, defaults). Forwards, futures, swaps, options; exotics (binary, barrier) cannot be built from forwards + plain options. Uses: hedge, speculate, arbitrage — all take or remove exposure to the underlying.`),

  // Lecture 1
  B('1', 'Payoffs, intrinsic and time value', r`Call $\max(S_T-X,0)$, put $\max(X-S_T,0)$; holder has the right, writer the obligation (unlike a forward). Intrinsic: $\max(S-X,0)$ / $\max(X-S,0)$. Time value = price − intrinsic (European put deep ITM: negative). ITM/ATM/OTM by intrinsic value.`),
  B('1', 'Bounds (no income)', r`$$\max(S-Xe^{-rT},0)\le c\le S$$
$$\max(Xe^{-rT}-S,0)\le p\le Xe^{-rT}$$
With income $D$: $c\ge S-D-PV(X)$, $p\ge PV(X)+D-S$. American: $C\ge c$, $P\ge p$, $P\le X$.`),
  B('1', 'Arbitrage when a bound breaks', r`- $c<S-PV(X)$: buy call, short share, invest $PV(X)$ → cash today, payoff $\max(S_T,X)-S_T\ge0$.
- $p<PV(X)-S$: buy put + share, borrow $PV(X)$.
- Call above $S$: sell call, buy share. Put above $PV(X)$: sell put, invest the premium.
- American put below $X-S$: buy and exercise now.`),
  B('1', 'Put-call parity', r`$$c+PV(X)+D=p+S$$
Synthetic call = put + share − borrowing $PV(X)$. Call too expensive: sell call, buy put + share, borrow $PV(X)(+D)$; too cheap: reverse. Profit today = gap.
American, no income: $S-X\le C-P\le S-PV(X)$ (above: sell $C$, buy $P$+share, borrow; below: buy $C$, sell $P$, short, invest $X$).`),
  B('1', 'Bid-ask bounds (PS1 2A)', r`$p^{ask}\ge c^{bid}-S+PV(X)$, $p^{bid}\le c^{ask}-S+PV(X)$. Example $S=12$, $r=8\%$, 3 m, $X=15$: $PV=14.70$; call 4/4.60 ⇒ put ask ≥ 6.70, bid ≤ 7.30.`),
  B('1', 'Early exercise', r`- American call, no income: never ($C\ge S-PV(X)>S-X$) ⇒ $C=c$.
- American put: exercise if $(X-S)e^{rT}>X$, i.e. $S<X(1-e^{-rT})$ (sufficient). E.g. $S=1$, $X=25$, 1 y, 5%: $24\times1.05=25.2>25$. $P>p$.
- Call on dividend payer: only just before ex-date, if $d$ > time value lost ($d>X(1-e^{-r(T-t)})$ necessary).
- Put on dividend payer: never just before payout; less incentive overall.`),
  B('1', 'Traps (lecture 1)', r`$S-PV(X)$ is the bound, $S-X$ only intrinsic. Buy at ask, sell at bid. Parity is an equality only for European options. Same $X$ and $T$ in parity.`),

  // Lecture 2
  B('2', 'Strategy cash flows', r`Net payoff $=\sum q_i\,\text{payoff}_i(S_T)+CF_0e^{rT}$. Buy = outflow, sell = inflow. Table: one row per interval between strikes, check continuity at kinks; break-even where net = 0.`),
  B('2', 'Spreads (X₁ < X₂)', r`- Bull calls: $+c(X_1)-c(X_2)$, outflow. Bull puts: $+p(X_1)-p(X_2)$, inflow.
- Bear calls: $-c(X_1)+c(X_2)$, inflow. Bear puts: $-p(X_1)+p(X_2)$, outflow.
- Payoff range $X_2-X_1$; net = that ± FV(cash flow). $n$ spreads scale it; OTM strikes shift it.`),
  B('2', 'Volatility and stability bets', r`- Straddle $+c(X)+p(X)$, $X\approx S_t$; BE $X\pm FV(c+p)$. Inverted straddle: sell both, unlimited risk.
- Strangle $+p(X_1)+c(X_2)$, cheaper; inverted strangle: flat top between strikes.
- Butterfly $+1\,X_1$, $-2\,X_2$, $+1\,X_3$ ($X_2=\frac{X_1+X_3}2$): cost $c_1+c_3-2c_2>0$, peak $X_2-X_1-FV$, BE $X_1+FV$, $X_3-FV$; limited risk.
- Calendar: sell $c(T)$, buy $c(T^*)$, peak near $X$. Reverse butterfly / strangle / reverse calendar: volatility with limited risk.`),
  B('2', 'Butterfly example (PS1 2B)', r`$X=15,17.5,20$; calls: $4.60+0.70-2\times2=1.30$; puts: $7+8.22-2\times7.25=0.72$ ⇒ puts cheaper. $FV(0.72)=0.735$ (8%, 3 m).
| below 15: −0.735 | 15–17.5: $S_T-15.735$ | 17.5–20: $19.265-S_T$ | above 20: −0.735 |. Before maturity the value is a smooth hump, flatter with more time to go.`),
  B('2', 'Portfolio payoff (PS1 4)', r`$3$ long $c(20)$, $5$ short $c(20)$, $2$ long $p(25)$ = $-2\,c(20)+2\,p(25)$: value $-2c+2p$; payoff $2(25-S)$ below 20 … slope above 25 $=3-5=-2$. Always sum slopes by interval.`),

  // Lecture 3
  B('3', 'One period: replication', r`$$m=\frac{c^u-c^d}{S^u-S^d}\qquad B=\frac{mS^u-c^u}{1+r}$$
$$c=mS-B$$
$m$ = delta (put: $m<0$, $B<0$ = lend). Market > model: sell option, buy $m$ shares, borrow $B$. Example $S=100$, $u=1.2712$, $d=0.8521$, $r=6.18\%$, $X=110$: $m=0.4085$, $B=32.78$, $c=8.07$.`),
  B('3', 'Risk-neutral valuation', r`$$\pi=\frac{1+r-d}{u-d}\quad\text{or}\quad\frac{e^{(r-q)\Delta t}-d}{u-d}$$
$$c=\frac{\pi c^u+(1-\pi)c^d}{1+r}$$
Needs $d<1+r<u$. $u=e^{\sigma\sqrt{\Delta t}}$, $d=1/u$. Real probability irrelevant; unique martingale measure in a complete market.`),
  B('3', 'Several periods', r`$c_0=(1+r)^{-n}\sum_j\binom nj\pi^j(1-\pi)^{n-j}\max(S_0u^jd^{n-j}-X,0)$. Two periods: $c_0=\frac{\pi^2c^{uu}+2\pi(1-\pi)c^{ud}+(1-\pi)^2c^{dd}}{(1+r)^2}$. Delta at each node from the next two nodes.`),
  B('3', 'American, dividends, delta', r`- Node value $=\max\big(e^{-r\Delta t}[\pi V^u+(1-\pi)V^d],\ \text{exercise}\big)$; check today too. Lecture put $X=110$, $u=1.1752$, $d=0.8857$, 3.04%: exercise at $S^d=88.57$ (21.43 > 18.18), $P_0=11.79$.
- Known dividend: tree for $S^*=S-PV(D)$, node $=S^*+PV$(dividends still to come). Call exercised with cum price $S^*+D$. (Lecture alternative: subtract $d$ at the node; tree no longer recombines.)
- Put delta = call delta − 1. Portfolio (straddle) value/delta = sum of legs.`),
  B('3', 'Parameter effects, volatility', r`$S$: c+, p−. $X$: c−, p+. $\sigma$: both +. $T$: c+, p±. $r$: c+, p−. Up-probability: none.
$u_t=\ln\frac{S_t}{S_{t-1}}$, $s^2=\frac{\sum(u_t-\bar u)^2}{n-1}$, $\sigma=s\sqrt{252}$.`),
  B('3', 'Traps (lecture 3)', r`Which rate: $(1+r)$ per period vs $e^{r\Delta t}$. $\pi$ with a yield uses $r-q$. Discount every step. American: compare at every node.`),

  // Lecture 4
  B('4', 'Lognormal model', r`$dS=\mu S\,dt+\sigma S\,dz$:
$$\ln S_T\sim N\big(\ln S_0+(\mu-\tfrac{\sigma^2}2)T,\ \sigma^2T\big)$$
$E[S_T]=S_0e^{\mu T}$; median $S_0e^{(\mu-\sigma^2/2)T}$; 95%: $e^{m\pm1.96s}$. Weekly data: mean $n\bar u$, var $ns^2$, $\sigma=s\sqrt{52}$. Risk-neutral: $\mu\to r-q$ (commodity $r+u-y$).`),
  B('4', 'Black-Scholes', r`$$c=Se^{-qT}N(d_1)-Xe^{-rT}N(d_2)$$
$$p=Xe^{-rT}N(-d_2)-Se^{-qT}N(-d_1)$$
$$d_1=\frac{\ln\frac SX+(r-q+\frac{\sigma^2}2)T}{\sigma\sqrt T}$$
$d_2=d_1-\sigma\sqrt T$; $N(-x)=1-N(x)$. Discrete dividends: $S\to S-PV(D)$.`),
  B('4', 'Probabilities, delta, implied vol', r`$N(d_2)$ = risk-neutral $P(S_T>X)$; real world: $d_2$ with $\mu$. $\Delta_c=N(d_1)$, $\Delta_p=N(d_1)-1$; $n$ short calls hedged with $nN(d_1)$ shares. Implied $\sigma$: trial and error until BS = market; market > BS(σ_hist) ⇒ implied > historical.`),
  B('4', 'PS1 6 and 9 in numbers', r`$dS=0.2S\,dt+0.4S\,dz$, $S=11$, $X=12$, 3 weeks, $r=10\%$: real $P=20.2\%$, risk-neutral $18.6\%$, BS $c=0.122$ vs market 0.13 ⇒ implied σ ≈ 41%.
$S=5$, $X=10$, σ 60%, 2 m, 4%: $p=4.93<X-S$ (European!), $c=0.001$; dividend 0.6 in 1 m: $p=5.53$.`),
  B('4', 'Normal table', normalTable()),

  // Lecture 5
  B('5', 'Method', r`1. Plot/table the payoff. 2. Decompose: flat = bond; slope $+k$ above $K$ = $k$ calls; slope $-k$ below $K$ = $k$ long puts; slope $+k$ below $K$ = $k$ short puts. 3. Value: bond $\times e^{-rT}$, options by BS/tree. 4. Price$\times(1-m)$ = value ⇒ solve for $\alpha$, $K$, participation, coupon. Margin = price − value.`),
  B('5', 'Standard products', r`- $G+\alpha\max(X-S_T,0)$: $\alpha=\frac{P(1-m)-Ge^{-rT}}{p}$.
- $\max(A,B-S_T)=A+\max(B-A-S_T,0)$: bond + put($B-A$).
- $K(1+|R|)=K+\frac K{S_0}[c+p]_{X=S_0}$: $K=\frac{P(1-m)}{e^{-rT}+(c+p)/S_0}$.
- Protected note: $N+\text{part}\,\frac N{S_0}\max(S_T-S_0,0)$: part $=\frac{N(1-m)-Ne^{-rT}}{(N/S_0)c}$.
- Reverse convertible: $N(1+k)-\frac N{S_0}\max(S_0-S_T,0)$ (investor sells puts).`),
  B('5', 'PS1 7–9 in numbers', r`Lead: $\max(1000,1300-S)$, $S=500$, 3 y, $r=5\%$, $u=6\%$, $y=2\%$, σ $=3\%\sqrt{52}=21.6\%$: put(300) with $q=y-u=-4\%$ = 0.95; value 861.66. Real drift: $\ln S_T\sim N(\ln500+156\times0.005,\,156\times0.03^2)$.
Nokia: $S=10$, σ 50%, 2 m, 4%, 5% margin: $K=822.16$.
ALMOSTBROKE: $G=900$, put(10): $\alpha=11.34$.`),
  B('5', 'Commodities and motives', r`Risk-neutral drift $r+u-y$ ⇒ BS with $q=y-u$ (can be negative). Probabilities of a payoff: real drift; value: risk-neutral. Issuer short a put on its input (battery maker on lead) hedges costs; retail products sell volatility or bets the bank can hedge.`),

  // Lecture 6
  B('6', 'Forward prices', r`$F_0=S_0e^{rT}$; income $I$: $(S_0-I)e^{rT}$; yield: $S_0e^{(r-q)T}$; FX: $S_0e^{(r-r_f)T}$; commodity: $S_0e^{(r+u-y)T}$.
$F$ too high: borrow, buy, sell forward. Too low: short, invest, buy forward (consumption goods: only the upper bound holds).
Long forward value $f=(F_0-K)e^{-rT}=S_0e^{-qT}-Ke^{-rT}$; zero at inception.`),
  B('6', 'Futures and hedging', r`Daily settlement; below maintenance ⇒ call back to **initial** margin. Constant rates: futures = forward price.
$h^*=\rho\frac{\sigma_S}{\sigma_F}$, $N^*=\frac{h^*Q_A}{Q_F}$. Index: $N=(\beta^*-\beta)\frac V{F\cdot\text{mult}}$ (negative = sell). Long asset ⇒ short futures.`),
  B('6', 'Swaps', r`Receive fixed: $V=B_{fix}-B_{fl}$, $B_{fl}=L$ right after a reset. $B_{fix}=KL\sum DF_t+L\,DF_n$, $DF_t=e^{-z_tt}$. Par rate $s=\frac{1-DF_n}{\sum DF_t}$; $V=(K-s)L\sum DF_t$. Pay fixed = $-V$.`),
];

/** Hand-written entries per lecture, followed by the lecture's key facts from the concept bank. */
export const CHEATSHEET: SheetBlock[] = [
  ...BLOCKS.filter(b => b.topic === null),
  ...Object.keys(LECTURES).flatMap(t => [...BLOCKS.filter(b => b.topic === t), keyFacts(BANK, t, 6)]),
];
