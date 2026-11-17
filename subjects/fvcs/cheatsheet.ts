// Suggested exam cheatsheet for Firm Value and Capital Structure: one A4 sheet, front and back. Markdown with $…$ formulas.
import { keyFacts } from '@/lib/sheet';
import type { SheetBlock } from '@/lib/subject';
import { BANK, LECTURES } from './concepts';

const B = (topic: string | null, title: string, body: string): SheetBlock => ({ topic, title, body });
const r = String.raw;

const BLOCKS: SheetBlock[] = [
  B(null, 'Already on the official sheet', r`Annuity $C\cdot\frac1r\big(1-\frac1{(1+r)^N}\big)$, perpetuity $\frac Cr$, growing $\frac C{r-g}$; $\beta_L=\beta_U[1+(1-\tau)\frac DE]$; CAPM; WACC. Use this sheet for everything else.`),
  B(null, 'Routine', r`1. Which imperfection does the question add (none, taxes, distress, agency, information, issuance)? 2. Market values, never book values. 3. Draw the market-value balance sheet before and after. 4. Who gains, who pays (old vs new shareholders, debt holders)?`),

  // Lecture 1
  B('1', 'MM I (perfect markets)', r`No taxes, no distress or agency costs, symmetric information, same rates for all ⇒ $V_L=E+D=V_U$. Homemade leverage: borrow to buy unlevered equity copies levered equity; buy $D$ and $E$ pro rata to unlever. Market-value balance sheet: assets (incl. intangibles) $=D+E$.`),
  B('1', 'MM II', r`$$r_E=r_U+\tfrac DE(r_U-r_D)$$
$$r_U=\tfrac EV r_E+\tfrac DV r_D=\text{pretax WACC}$$
$$\beta_E=\beta_U+\tfrac DE(\beta_U-\beta_D)$$
$\beta_U=\frac EV\beta_E+\frac DV\beta_D$. Unlever with the left forms, relever at the new $D/E$. Risky debt changes $r_D$, $\beta_D$ only.`),
  B('1', 'Leveraged recap example', r`$V=1000$ (50m shares at 20), $r_U=10\%$, borrow 400 at 4%: price stays 20, buy back 20m shares, $E=600$, $D/E=0.667$, $r_E=10\%+0.667\times6\%=14\%$, WACC $0.6\times14\%+0.4\times4\%=10\%$. Expected EPS rises, but EPS is riskier: price unchanged.`),
  B('1', 'Traps (lecture 1)', r`WACC never falls with leverage in perfect markets (raise $r_E$!). Use market $D/E$. MM I holds with risky debt.`),

  // Lecture 2
  B('2', 'Interest tax shield', r`ITS$_t=\tau_c\times$interest$_t$ (principal not deductible; interest above a cap, e.g. 30% of EBIT, gives none). $V_L=V_U+PV(ITS)$.
- Fixed risk-free schedule: discount each $\tau_c r_D D_{t-1}$ at $r_f$ (annuity).
- Permanent debt: $PV=\tau_c r_fD/r_f=\tau_cD$.
- Target $D/E$: shield as risky as the firm: $V_L=\frac{FCF_1}{r_{wacc}-g}$, $V_U=\frac{FCF_1}{r_U-g}$, $PV(ITS)=V_L-V_U$.`),
  B('2', 'After-tax WACC', r`$$r_{wacc}=\tfrac EV r_E+\tfrac DV r_D(1-\tau_c)$$
$$r_{wacc}=r_U-\tfrac DV\tau_c r_D\ \ (\text{target }D/V)$$
FCF ignores the shield, so the WACC carries it. Unlever a comparable: $\beta_U=\beta_L/[1+(1-\tau)\frac DE]$ (sheet formula, permanent debt).`),
  B('2', 'Recap with taxes', r`Price jumps at the **announcement**: $P=\frac{V_U+\tau_cD}n$; buy back $D/P$ at the new price (sellers share the shield); equity after $V_U+\tau_cD-D$. Example $V_U=300$, 20m shares, $\tau_c=25\%$, $D=100$ permanent: $V_L=325$, $P=16.25$, 6.15m shares bought, $E=225$.`),
  B('2', 'Personal taxes', r`$$\tau^*=1-\frac{(1-\tau_c)(1-\tau_e)}{1-\tau_i}$$
$\tau_i=\tau_e$ ⇒ $\tau^*=\tau_c$; $\tau^*<0$ possible. Permanent debt: $PV=\tau^*D$. Excess interest (above EBIT) gives no corporate benefit; tax-optimal leverage: interest = EBIT.`),

  // Lecture 3
  B('3', 'Financial distress', r`Perfect market: default only shifts ownership, no cost. Real: direct costs ≈ 3–4% of assets (lawyers, courts), indirect larger (customers, suppliers, staff leave, fire sales, delayed liquidation). Borne by **today’s shareholders**: lenders price them in. Economic distress (value falls anyway) ≠ financial distress. Chapter 7 liquidation vs Chapter 11 reorganisation.`),
  B('3', 'Two-state pricing', r`Debt pays $F$ if $V\ge F$, else $V$ − distress costs. Diversifiable risk: $D=\frac{E[\text{payoff}]}{1+r_f}$, $E=\frac{E[\max(V-F,0)]}{1+r_f}$; $PV(FDC)=V_U-(D+E)$. YTM $=F/D-1$ > expected return ($r_f$).
Example: 200/80 at 50%, $r_f=5\%$, $F=120$, costs 20%: $V_U=133.33$, $D=87.62$, $E=38.10$, $PV(FDC)=7.62$, YTM 36.95%.`),
  B('3', 'Trade-off theory', r`$$V_L=V_U+PV(ITS)-PV(FDC)$$
Optimum: marginal tax shield = marginal distress cost. Stable cash flows and tangible assets (utilities, real estate) carry more debt; volatile, intangible-heavy firms less.`),

  // Lecture 4
  B('4', 'Agency costs of debt', r`Managers maximise **equity** value (not firm value).
- Asset substitution: gamble with negative NPV; add remaining assets to every state.
- Debt overhang: $\text{gain}=\frac{\max(0,B-F)}{1+r}-I-\frac{\max(0,A-F)}{1+r}$; reject positive NPV if gain < 0 (gain = NPV when $F\le A$).
- Cashing out: sell assets cheaply, pay dividends.
Lenders anticipate ⇒ shareholders pay. Remedies: short maturities, covenants. Ratchet: no voluntary deleveraging.`),
  B('4', 'Agency benefits of debt', r`Managers act in **their own** interest: debt keeps ownership concentrated, commits free cash flow (Jensen), invites monitoring, reduces entrenchment. Waste rate $w$: each €1 of interest costs shareholders $(1-\tau_c)(1-w)$; payouts rise by $1-(1-\tau_c)(1-w)$. Owner selling fraction $s$ bears $1-s$ of perks.`),

  // Lecture 5
  B('5', 'Signals', r`Credibility principle: claim believed only if costly when false. Leverage signals only if $F>$ value in the bad state (would cause distress); small debt is cheap to fake.`),
  B('5', 'Lemons and timing', r`Informed seller ⇒ buyers discount; good types withdraw, price unravels until all remaining types sell. Equity issues: price falls on announcement, rises before; issues right after earnings releases (smallest information gap).`),
  B('5', 'Pecking order and costs', r`Retained earnings → debt → equity (last resort); profitable firms have low leverage (prediction not clean). Raising $A$: retained costs $A$; mispriced debt $A\frac{1+r_{charged}}{1+r_{fair}}$; equity underpriced by $u$: $\frac A{1-u}$. Equity = debt when $u=1-\frac A{\text{cost of debt}}$.`),

  // Lecture 6
  B('6', 'Venture rounds', r`Price $=\frac{I}{\text{new shares}}$. Pre-money $=$ old shares × price; post $=$ pre $+I$ = all shares × price. Investor wants fraction $s$: total $=\frac{\text{old}}{1-s}$, new $=$ total − old. Later rounds dilute % but raise value if the price rises. VC funds ≈ 2% fee + 20% carry.`),
  B('6', 'IPOs and SPACs', r`SPAC: units at €10 (share + warrant, $K=11.50$), 18–24 months to merge. Promote = 20% of SPAC = public shares/4. Redeem at €10 (keep warrants) if price < 10. Cash $=10\times$remaining public + PIPE − fees. Cashless warrants: $W\frac{P-K}P$ shares. Effective IPO price $=\frac{\text{gross cash}}{\text{shares to non-target holders}}$ (public, sponsor, PIPE, warrant shares) — well below €10.`),
  B('6', 'Traps (lecture 6)', r`Pre-money excludes the new shares. Promote base: public/4, not 20% of public. Effective price divides by all non-target shares.`),
];

/** Hand-written entries per lecture, followed by the lecture's key facts from the concept bank. */
export const CHEATSHEET: SheetBlock[] = [
  ...BLOCKS.filter(b => b.topic === null),
  ...Object.keys(LECTURES).flatMap(t => [...BLOCKS.filter(b => b.topic === t), keyFacts(BANK, t, 7)]),
];
