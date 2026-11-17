// Suggested exam cheatsheet for Financial Investments: one A4 sheet, front and back. Markdown with $…$ formulas.
import { keyFacts } from '@/lib/sheet';
import type { SheetBlock } from '@/lib/subject';
import { BANK, LECTURES } from './concepts';

const B = (topic: string | null, title: string, body: string): SheetBlock => ({ topic, title, body });
const r = String.raw;

const BLOCKS: SheetBlock[] = [
  // Lecture 1
  B('1', 'From Markowitz to the CAPM', r`Same inputs, same $r_f$, no frictions ⇒ everyone holds the tangency portfolio = market; $E[r_M]-r_f=\bar A\sigma_M^2$.
$$E[r_i]=r_f+\beta_i(E[r_M]-r_f)$$
$$\beta_i=\frac{\text{cov}(r_i,r_M)}{\sigma_M^2}=\rho_{iM}\frac{\sigma_i}{\sigma_M}$$
$\alpha=$ actual − SML. Only covariance with $M$ is priced (not volatility, ROE, default risk).`),
  B('1', 'CML, CAL, single index', r`CAL(P): $E[r_C]=r_f+\rho_{PM}\frac{E[r_M]-r_f}{\sigma_M}\sigma_C$; CML: efficient portfolios ($\rho=1$); SML: every asset. Diversified: $\sigma_P=\beta_P\sigma_M$.
SIM $R_i=\alpha_i+\beta_iR_M+e_i$: $\sigma_i^2=\beta_i^2\sigma_M^2+\sigma^2(e_i)$, $\text{cov}(R_i,R_j)=\beta_i\beta_j\sigma_M^2$.`),
  B('1', 'Example and extensions', r`Price when correlation doubles (PS1): $\beta=\frac{12\%-5\%}{6\%}=1.167$ → 2.333, $E[r]=19\%$, $P=9/0.19=47.37$.
Zero-beta CAPM (no riskless borrowing: flatter SML), Roll critique, CCAPM, ICAPM, liquidity $E[r_i]=r_f+\beta_iE[R_M]+IL_i$. Projects: own beta.`),

  // Lecture 2
  B('2', 'APT', r`$R_i=E[R_i]+\sum\beta_{ik}F_k+e_i$; given realised factors $E[r|F]=E[r]+\sum\beta_k(F_k-E[F_k])$ (surprises, not levels).
No arbitrage: $E[r]=r_f+\sum\beta_kRP_k$ for well-diversified portfolios. Equal weights: $\sigma^2(e_P)=\sigma_e^2/n$.`),
  B('2', 'Arbitrage example (PS2)', r`$A$: $\beta=1.2$, 10.21%; $B$: $\beta=0.8$, 7.89% ⇒ $RP=5.8$, $r_f=3.25$. $J$: $\beta=0.5$ should earn 6.15%, offers 6.35%: buy $J$, short $5/12$ of $A$ + $7/12$ risk-free ⇒ 0.20% riskless. Zero-cost portfolio: profit / one leg.`),
  B('2', 'Market efficiency', r`Weak (momentum, long-term reversal), semi-strong (P/E, size, B/M, January, post-earnings drift), strong (insiders profit). Risk (Fama-French) or mispricing? Joint-hypothesis problem; anomalies decay after publication (McLean-Pontiff); limits to arbitrage; “efficiently inefficient” (Pedersen). Predictors of market returns: dividend ratios, earnings yields, spreads.`),

  // Lecture 3
  B('3', 'Performance measures', r`$$SR=\frac{\bar r_P-\bar r_f}{\sigma_P}\quad T=\frac{\bar r_P-\bar r_f}{\beta_P}$$
$$\alpha_P=\bar r_P-[\bar r_f+\beta_P(\bar r_M-\bar r_f)]\quad IR=\frac{\alpha_P}{\sigma(e_P)}$$
$M^2=r_f+SR_P\sigma_M-E[r_M]$. Whole portfolio: SR, M²; one of many: Treynor; active next to an index: IR ($SR_P^2=SR_M^2+IR^2$). $\sigma^2(e)=(1-R^2)\sigma_P^2=\sigma_P^2-\beta^2\sigma_M^2$; $t(\alpha)=\frac\alpha{\sigma_e}\sqrt N$.`),
  B('3', 'Manipulation, timing, style', r`Varying risk lowers the measured Sharpe ratio (MRAR is manipulation-proof). Timing: convexity — Treynor-Mazuy (squared market term), Henriksson-Merton (up-market dummy). Style analysis: regress on asset-class indices, weights ≥ 0 summing to 1.`),
  B('3', 'Attribution and returns', r`$$\begin{aligned}r_P-r_B&=\textstyle\sum(w_{Pi}-w_{Bi})r_{Bi}\\&\quad+\textstyle\sum w_{Pi}(r_{Pi}-r_{Bi})\end{aligned}$$
First sum: allocation; second: selection.
Time-weighted (geometric, judges the manager) vs dollar-weighted (IRR of the flows, the investor’s experience).`),

  // Lecture 4
  B('4', 'Treynor-Black', r`$w_i^0=\frac{\alpha_i}{\sigma^2(e_i)}$, rescale to sum 1 (negative α ⇒ short). $\alpha_A=\sum w_i\alpha_i$, $\beta_A=\sum w_i\beta_i$, $\sigma^2(e_A)=\sum w_i^2\sigma^2(e_i)$.
$$w_A^0=\frac{\alpha_A/\sigma^2(e_A)}{E[R_M]/\sigma_M^2}\quad w_A^*=\frac{w_A^0}{1+(1-\beta_A)w_A^0}$$
$\beta_P=1-w_A^*+w_A^*\beta_A$, $\sigma_P^2=\beta_P^2\sigma_M^2+w_A^{*2}\sigma^2(e_A)$, $SR_P^2=SR_M^2+IR_A^2$; $\sigma(TE)=w_A\sqrt{(1-\beta_A)^2\sigma_M^2+\sigma^2(e_A)}$.`),
  B('4', 'Making it usable', r`Raw analyst alphas ⇒ extreme positions. Cap $w_A$, cap tracking error, shrink alphas by forecast precision (Kane-Kim-White: $R^2\approx0.001$; scale alphas by $R^2$: active weight shrinks, relative weights unchanged).`),
  B('4', 'Black-Litterman', r`View $Q$ (e.g. $E[R_B]-E[R_S]$) with sd $\sigma_\varepsilon$; baseline $Q_E=P'R_E$; $\Sigma_F=\tau\Sigma$ ($\tau=0.01$), $\sigma_D^2=\sigma_\varepsilon^2+P'\Sigma_FP$.
$$R^*=R_E+\frac{Q-Q_E}{\sigma_D^2}\Sigma_FP$$
Covariances from history.`),
  B('4', 'Value of active management', r`$f=\frac1{2A}\sum IR_i^2$ (× assets). PS4: 100 stocks, $\alpha=1\%$ with $R^2=5\%$, $\sigma_e=6\%$, $A=3$, \$50m: $f=100\times(0.0005/0.06)^2/6\times50\text{m}$ = \$57,870.`),

  // Lecture 5
  B('5', 'Two-asset Markowitz', r`Excess returns $\mu$:
$$w_1=\frac{\mu_1\sigma_2^2-\mu_2\sigma_{12}}{\mu_1\sigma_2^2+\mu_2\sigma_1^2-(\mu_1+\mu_2)\sigma_{12}}$$
$$w_1^{GMV}=\frac{\sigma_2^2-\sigma_{12}}{\sigma_1^2+\sigma_2^2-2\sigma_{12}}$$`),
  B('5', 'Estimation error', r`Optimisers overweight assets with large estimation errors (Michaud); weights very noisy (Jobson-Korkie: worse with more assets, higher correlation, shorter samples); 1/N rarely beaten out of sample (DeMiguel-Garlappi-Uppal).
Fixes: shrink means; $\tilde\Sigma=(1-\lambda)\Sigma_s+\lambda\Sigma_t$ (Ledoit-Wolf); shrink weights to 1/N, market or GMV; constraints; out-of-sample tests (rolling/expanding); parametric policies $w_{i,t}=\theta'x_{i,t}/N_t$ — $K$ parameters, no covariance matrix.`),

  // Lecture 6
  B('6', 'Hedge funds vs mutual funds', r`Partnerships, little disclosure, ≈100 sophisticated investors, shorting, leverage, derivatives, lock-ups; fees 1–2% + 20% (a call on returns; high-water mark). Funds of funds pay incentive fees fund by fund even when the total loses.`),
  B('6', 'Measuring performance', r`Survivorship (≈2× mutual funds) and backfill bias; no persistence; liquidity premia (Aragon, Sadka); option-writer exposures and tail risk (Taleb). Lagged betas: $R_{t+1}=\alpha+\sum_{k}\beta_kR_{m,t+1-k}+\varepsilon$, $\hat\beta_c=\sum\hat\beta_i$; simple CAPM **overstates** α.`),
  B('6', 'Portable alpha', r`Sell $N=\frac{V\beta}{S_0\times\text{mult}}$ futures ($F_0=S_0(1+r_f)$).
$V_{t+1}=V(1+r_f+\alpha-\beta r_f)+V\beta r_M+Ve$, $H_{t+1}=V\beta(r_f-r_M)$, hedged $V(1+r_f+\alpha)+Ve$. Example \$3m, α 12%, β 2, $r_f$ 5%, index 2000×250: sell 12; hedged $3.51+3e$.`),
];

/** Hand-written entries per lecture, followed by the lecture's key facts from the concept bank. */
export const CHEATSHEET: SheetBlock[] = [
  ...BLOCKS.filter(b => b.topic === null),
  ...Object.keys(LECTURES).flatMap(t => [...BLOCKS.filter(b => b.topic === t), keyFacts(BANK, t, 7)]),
];
