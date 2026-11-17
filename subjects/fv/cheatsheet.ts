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
];

/** Hand-written entries per lecture, followed by the lecture's key facts from the concept bank. */
export const CHEATSHEET: SheetBlock[] = [
  ...BLOCKS.filter(b => b.topic === null),
  ...Object.keys(LECTURES).flatMap(t => [...BLOCKS.filter(b => b.topic === t), keyFacts(BANK, t, 10)]),
];
