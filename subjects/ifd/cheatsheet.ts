// Suggested exam cheatsheet for Investment and Financing Decisions: one A4 sheet, front and back. Markdown with $…$ formulas.
import { keyFacts } from '@/lib/sheet';
import type { SheetBlock } from '@/lib/subject';
import { BANK, LECTURES } from './concepts';

const B = (topic: string | null, title: string, body: string): SheetBlock => ({ topic, title, body });
const r = String.raw;

const BLOCKS: SheetBlock[] = [
  B(null, 'Routine', r`Amounts in millions; state per-share vs total. Zero-beta cash flows ⇒ discount expected payoffs at $r_f$. Draw the state table (probability, $V$, payoff to each claim) before any formula.`),

  // Lecture 1
  B('1', 'IPO cost', r`Proceeds $=n_{new}P_{offer}(1-s)$. Value after day 1 $=(n_{old}+n_{new})P_1$.
Perfect market: $P=\frac{V_{after}-\text{proceeds}}{n_{old}}$; new shares = proceeds$/P$.
Cost to old shareholders = underpricing $n_{new}(P_1-P_{offer})$ + spread $n_{new}P_{offer}s$.
AquaVibe: 10m old, 5m new at \$20, 7%, $P_1=50$: proceeds 93, $V=750$, fair 65.70, 1.42m shares would do; cost 150 + 7 = 157.`),
  B('1', 'Rights issue', r`$k$ rights buy one share at $X$: $P_{after}=\frac{nP+\text{raised}}{n+n/k}$. Subscription price irrelevant to wealth (pro-rata rights, exercised or sold). MacKenzie: 10m at 40, 5 rights + \$30 ⇒ 60 raised, $P=38.33$; 1 right + \$6 ⇒ $P=23$, same wealth.`),
  B('1', 'Winner’s curse', r`Return per unit bid $=\sum p_s\cdot\text{alloc}_s\cdot r_s$ (zero on the unallocated part; don’t divide by allocation). Sterling: average 15.6%, with allocations 10/30/100%: 1.68%. Break-even in moderate cases: $0.008+0.24x-0.02=0$ ⇒ $x=5\%$. Underpricing keeps uninformed investors in.`),

  // Lecture 2
  B('2', 'Risky zero-coupon debt', r`$$B_0=\frac{E[\min(F,V)]}{1+r_f}\qquad y=\frac F{B_0}-1$$
Spread $=y-r_f$ → nearest rating. Two states, default low: $F=\frac{I(1+r_f)-(1-p)V_L}p$. Equity $=\frac{E[\max(V-F,0)]}{1+r_f}$ = project value − debt.
Arden: 60 raised, 100/54, 5%: $F=72$, $y=20\%$, spread 15% (CC), $E=13.33$.`),
  B('2', 'Seniority', r`Senior paid first; junior gets $\min(F_{jun},\max(0,V-F_{sen}))$. A junior-funded project raises the low-state value: senior bonds gain (e.g. CC → B−); part of the project’s value goes to them. Face value of junior: solve $I_2(1+r_f)=E[\text{junior payoff}]$.`),
  B('2', 'Convertibles', r`Payoff $\max\big(\min(K,V),\frac x{n+x}V\big)$; conversion ratio $=x/$bonds (per €100: $x/(K/100)$). Perfect market: straight and convertible give the same share price $\frac{V+NPV}n$. Bankruptcy costs only matter if the security can default; a low-principal convertible never does.`),

  // Lecture 3
  B('3', 'Effort incentives', r`Own cash: high effort if $\kappa\le E_H[V]-E_L[V]$.
Equity: $\alpha=\frac I{E_H[V]}$, $\kappa\le(1-\alpha)(E_H[V]-E_L[V])$.
Debt: $E_H[\min(F,V)]=I$, $\kappa\le\sum(p_H-p_L)\max(V-F,0)$.
Quiz: 100 in, 125/75 (0.6/0.4) vs 125/75/0 (0.5/0.4/0.1): own 12.5, equity 0.6, debt $F=116.67$ ⇒ 0.83. Price on beliefs, then check incentives.`),
  B('3', 'Asymmetric information', r`Pooled equity $\alpha=I/\overline{E[V]}$; pooled debt $F$ from the average success probability. Good types’ securities underpriced: loss = value under true probabilities − money received. Debt less information-sensitive ⇒ pecking order: internal funds → debt → equity; issuing equity signals a bad type.`),

  // Lecture 4
  B('4', 'NPV and FCF', r`$NPV=\sum_t\frac{E[CF_t]}{(1+r)^t}$; incremental CFs: exclude sunk and unchanged allocated costs; include opportunity costs, cannibalisation.
$$FCF=EBIT(1-\tau)+Dep-CapEx-\Delta NWC$$
$NWC=$ cash + inventory + A/R − A/P (increase = outflow, recovered at the end). CapEx = Δ non-current assets + Dep. Salvage: sale − $\tau$(sale − book). Taxes on EBIT, never on EBIT − interest.`),
  B('4', 'Terminal value', r`$TV_T=\frac{FCF_{T+1}}{r-g}$, a cash flow at $T$, discounted $T$ years. Final-year FCF: $EBIT_T(1-\tau)+Dep_T$ + post-tax PPE + $NWC_T$.`),
  B('4', 'Discount rate', r`$E[R]=r_f+\beta(E[R_M]-r_f)$. Twin firms: $\beta_U=\frac EV\beta_E+\frac DV\beta_D$, relever $\beta_{E'}=\beta_U+\frac{D'}{E'}(\beta_U-\beta_{D'})$. $r_E=r_U+\frac DE(r_U-r_D)$. New business ⇒ twins’ beta, not the firm’s.`),
  B('4', 'APV and WACC', r`$V^L=V^U+PV(DTS)$ + other; DTS$_t=\tau r_DD_{t-1}$, discount at $r_D$ (fixed schedule; perpetual: $\tau D$) or $r_U$ (constant leverage).
$$WACC=\tfrac{E'}{V}r_{E'}+\tfrac{D'}{V}r_{D'}(1-\tau)$$
Constant leverage: $r_U-\frac DV\tau r_D$. Same value; APV for fixed schedules, subsidised loans, distress costs.`),
];

/** Hand-written entries per lecture, followed by the lecture's key facts from the concept bank. */
export const CHEATSHEET: SheetBlock[] = [
  ...BLOCKS.filter(b => b.topic === null),
  ...Object.keys(LECTURES).flatMap(t => [...BLOCKS.filter(b => b.topic === t), keyFacts(BANK, t, 8)]),
];
