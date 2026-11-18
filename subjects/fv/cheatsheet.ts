// Suggested exam cheatsheet for Firm Valuation: one A4 sheet, front and back. Markdown with $…$ formulas.
import { keyFacts } from '@/lib/sheet';
import type { SheetBlock } from '@/lib/subject';
import { BANK, LECTURES } from './concepts';

const B = (topic: string | null, title: string, body: string): SheetBlock => ({ topic, title, body });
const r = String.raw;

const BLOCKS: SheetBlock[] = [
  B(null, 'Value = discounted expected cash flows', r`$$V_0=\sum_n\frac{E[CF_n]}{(1+r)^n}$$
Cash flows to the firm at the WACC → firm value; to equity at $k_e$ → equity value. Never mix flow and rate.`),
  B(null, 'Routine', r`1. Whose cash flow? 2. Matching rate. 3. Explicit years + terminal value at year $T$. 4. Discount, add, bridge to equity, divide by shares. 5. Sanity check: TV share of value, $g<r$.`),

  // Lecture 1
  B('1', 'Market efficiency', r`Prices ≈ random walk: predictable patterns get traded away; competition for information keeps prices efficient.
- Weak: past prices and volume; technical analysis fails. Challenge: momentum, long-term reversal.
- Semi-strong: all public information. Challenges: post-earnings drift, size, value (B/M, P/E), January.
- Strong: all information; insiders profit ⇒ rejected.
Anomalies shrink after risk adjustment, costs and data mining; after costs active rarely beats passive. Joint hypothesis: tests need a pricing model.`),
  B('1', 'Event study', r`$$AR_t=R_{i,t}-(\alpha+\beta R_{m,t})$$
$$CAR(t_1,t_2)=\sum_{t_1}^{t_2}AR_t$$
Estimate $\alpha$, $\beta$ in a window before the event. Efficient: jump on day 0, no drift after; drift = slow reaction, run-up = leakage.`),
  B('1', 'Firm value and equity value', r`$E=V_F-\text{Debt}+\text{Cash}$ (− preferred − minorities). $V_F$ = assets in place + value of growth. Price ≈ value only if markets are efficient; valuation pays off where they are not.`),
  B('1', 'Traps (lecture 1)', r`Abnormal return subtracts the model return, not $r_f$ or the raw market (unless $\beta=1$, $\alpha=0$). Don’t add debt to firm value.`),

  // Lecture 2
  B('2', 'Which model', r`DDM: mature firms with stable payout (useless without dividends). FCFF @ WACC: whole firm; capital-intensive, growth phases, changing leverage. FCFE @ $k_e$: stable D/E (high or low).`),
  B('2', 'Gordon growth', r`$$V_0=\frac{D_1}{k_e-g}\qquad k_e=\frac{D_1}{P_0}+g$$
$g=b\cdot ROE=(1-\text{payout})ROE$. Needs $g<k_e$, $g\le$ long-run growth. Retention adds value only if $ROE>k_e$; PVGO $=P_0-\frac{E_1}{k_e}$.`),
  B('2', 'Two-stage model', r`$$V_0=\sum_{t=1}^n\frac{D_0(1+g_s)^t}{(1+k_e)^t}+\frac{P_n}{(1+k_e)^n}$$
$P_n=\frac{D_n(1+g_l)}{k_e-g_l}$. Growth drops overnight at $n$.`),
  B('2', 'H-model', r`$$V_0=\frac{D_0(1+g_L)+D_0H(g_S-g_L)}{k_e-g_L}$$
Growth falls linearly from $g_S$ to $g_L$ over $2H$ years. Example $D_0=2$, 8%→3% over 10 years ($H=5$), $k_e=10\%$: $\frac{2.06}{0.07}=29.43$ + $\frac{2\times5\times0.05}{0.07}=7.14$ ⇒ 36.57.`),
  B('2', 'Free cash flows', r`$$\begin{aligned}FCFF&=EBIT(1-t)+D\&A\\&\quad-CapEx-\Delta NWC\end{aligned}$$
$$FCFE\approx FCFF-I(1-\tau_c)+\Delta D$$
FCFF: before financing flows; FCFE: after after-tax interest and net borrowing. $\Delta NWC$: increase is an outflow.`),
  B('2', 'DCF with terminal value', r`$$V_0^F=\sum_{t=1}^T\frac{FCFF_t}{(1+WACC)^t}+\frac{TV_T}{(1+WACC)^T}$$
$TV_T=\frac{FCFF_T(1+g)}{WACC-g}$; $V_0^E=V_0^F-\text{Debt}+\text{Cash}$. Explicit 3–10 years; TV often > 60%: sensitivity to $g$ and WACC.`),
  B('2', 'Traps (lecture 2)', r`Gordon needs $D_1=D_0(1+g)$. TV at year $T$ is discounted $T$ years. Preferred stock and deferred taxes: treat as claims or cash effects consistently.`),
  B('2', 'APV', r`$$V_L=V_U+PV(TS),\quad V_U=\frac{FCFF_1}{\rho-g},\quad \rho=r_f+\beta_U MRP$$
TS $=t\,k_d\,D$ per year: permanent constant debt → $PV=tD$; loan for $n$ years → annuity at $k_d$. Constant D/E → discount TS at $\rho$ (APV = WACC value).`),

  // Lecture 3
  B('3', 'Historical growth', r`$\bar g_{geom}=(V_n/V_0)^{1/n}-1\le\bar g_{arith}$; $\sigma=\sqrt{\sum(g-\bar g)^2/(n-1)}$. Negative EPS: $EPS_t=a+bt$, $g\approx b/\overline{EPS}$. Volatile earnings mean-revert; ARIMA only short term; analysts good short term, worse long term and for small firms.`),
  B('3', 'Fundamental growth', r`$$RIR=\frac{\text{Net CapEx}+\Delta OWC}{EBIT(1-t)},\quad ROC=\frac{EBIT(1-t)}{BV_E+BV_D-\text{Cash}}$$
$g=RIR\times ROC$; changing ROC: $+\frac{ROC_t-ROC_{t-1}}{ROC_{t-1}}$. Net income: $g=b\times ROE$. Negative ROC → revenues × margin path. Market target: $R_n=M_0(1+g_M)^n s$, $CAGR=(R_n/R_0)^{1/n}-1$.`),

  // Lecture 4
  B('4', 'Premium and CAPM', r`$k_e=r_f+\beta(E[R_m]-r_f)$. Implied: $r=\frac{D_1}{P_0}+g$, $ERP=r-r_f$ (two-stage: solve for $r$). $r_f$: long-term government bond in the cash flows' currency.`),
  B('4', 'Betas', r`Regression → levered beta. Constant D/E: $\beta_L=\beta_U(1+D/E)$; fixed debt: $\beta_U[1+(1-t)D/E]$; risky debt $-\beta_D(1-t)D/E$. Bottom-up: weighted $\beta_U$, relever. Private owner: $\beta_U/\rho$; IPO: market beta. Operating leverage, cyclicality ↑ $\beta_U$.`),
  B('4', 'Cost of debt and WACC', r`Coverage $EBIT/I$ → rating → $k_d=r_f+$spread. $MV_D=I\frac{1-(1+k_d)^{-n}}{k_d}+\frac{F}{(1+k_d)^n}$.
$$WACC=\tfrac{E}{V}k_e+\tfrac{D}{V}k_d(1-t)$$ market weights; $E/V=1/(1+D/E)$.`),

  // Lecture 5
  B('5', 'Emerging markets', r`$r_{f,local}$ = local yield − default spread (FX bond − US/Bund, CDS − US CDS, rating). CRP: spread; spread×$\sigma_E/\sigma_B$; total $=ERP_{US}\sigma_C/\sigma_{US}$. $k_e$: $r_f+CRP+\beta ERP$; $r_f+\beta(ERP+CRP)$; $r_f+\beta ERP+\lambda CRP$.`),

  // Lecture 6
  B('6', 'Bridge to equity', r`$E=V_{op}+\text{cash}+\text{holdings}-\text{MI}-D-\text{options}$. Holdings: %×MV, BV×P/B, earnings×P/E. MI: (1−own)×MV or BV×P/B. $k_{net}=\frac{k_dD-r_fC}{D-C}$. Cash: ROC=WACC neutral, < wasting, > creator.`),
  B('6', 'Options and commitments', r`Diluted $\frac{E}{N+n}$; treasury $\frac{E+nK}{N+n}$; option value $\frac{E-n\,OV}{N}$ (best). Commitments: PV at pre-tax $k_d$, add to debt. What-if: sensitivity, scenarios, Monte Carlo.`),
  B('6', 'Exam case (Part II)', r`OWC = (inv + AR − AP)% × revenue, use $\Delta OWC$. $FCFF=EBIT(1-t)-\text{NetCapEx}-\Delta OWC$. TV: all grow at $g$, or $EBIT_4(1+g)(1-t)(1-RR)$, or last-year growth. Discount TV 4 years. Then bridge, ÷ shares.`),

  // Lecture 7
  B('7', 'Multiples', r`Equity/equity or EV/firm (P/EBITDA invalid). $\frac{P}{E}=\text{payout}\frac{1+g}{r-g}$, forward $\frac{\text{payout}}{r-g}$, $\frac{P}{BV}=ROE\cdot\frac{P}{E}$, PEG $=\frac{P/E}{g\cdot100}$. Price from EV/EBITDA: $(m\cdot EBITDA-D+C)/N$. Exit: $m\cdot$metric$_n/(1+r)^n$ × survival. Use median; outliers; cross-check DCF.`),
];

/** Hand-written entries per lecture, followed by the lecture's key facts from the concept bank. */
export const CHEATSHEET: SheetBlock[] = [
  ...BLOCKS.filter(b => b.topic === null),
  ...Object.keys(LECTURES).flatMap(t => [...BLOCKS.filter(b => b.topic === t), keyFacts(BANK, t, 6)]),
];
