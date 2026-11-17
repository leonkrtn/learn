// Official IFD flashcards: definitions, formulas and results from the four lectures.
// Seeded into Supabase by `npm run seed:sql`. Fronts and backs may contain simple HTML.

export type SeedCard = { key: string; front: string; back: string };

export const DECK_NAME = 'IFD core concepts';

export const CARDS: SeedCard[] = [
  // Lecture 1
  { key: 'l1-proceeds', front: 'IPO proceeds to the firm', back: 'New shares × offer price × (1 − underwriting spread).' },
  { key: 'l1-cost', front: 'Total cost of an IPO to the original shareholders', back: 'Underpricing, new shares × (first-day price − offer price), plus direct costs, the underwriting spread. Equivalently: value they would own in a perfect market (post-IPO value − proceeds) minus the actual value of their shares.' },
  { key: 'l1-perfect', front: 'IPO in a perfect market: price and number of new shares', back: 'Price = (post-IPO value − amount raised) / old shares; new shares = amount raised / that price.' },
  { key: 'l1-rights', front: 'Share price after a rights issue (all rights exercised)', back: '(old shares × old price + amount raised) / (old shares + new shares).' },
  { key: 'l1-rights-ind', front: 'Does the subscription price of a rights issue matter to shareholders?', back: 'No. Rights go to all shareholders pro rata, so a lower price only shifts value between their old and new shares (provided they exercise or sell the rights).' },
  { key: 'l1-curse', front: 'Winner’s curse in IPOs', back: 'Uninformed bidders are rationed in the good IPOs and get full allocations in the bad ones, so their expected return = Σ p·allocation·return is far below the average first-day return.' },
  { key: 'l1-under', front: 'Why are IPOs underpriced on average?', back: 'Among other reasons, to keep uninformed investors participating despite the winner’s curse: they must break even on the shares they actually receive.' },
  // Lecture 2
  { key: 'l2-price', front: 'Price of a risky zero-coupon bond with zero beta', back: 'B<sub>0</sub> = E[payoff] / (1 + r<sub>f</sub>), where the payoff is min(F, firm value) in each state.' },
  { key: 'l2-yield', front: 'Yield and default spread of a one-year zero-coupon bond', back: 'y = F/B<sub>0</sub> − 1; default spread = y − r<sub>f</sub>. Match it to the rating with the closest typical spread.' },
  { key: 'l2-face', front: 'Face value of risky debt that raises I', back: 'Solve E[min(F, V)] / (1 + r) = I. With two states and default in the low one: F = [I(1 + r) − (1 − p)V<sub>L</sub>] / p.' },
  { key: 'l2-junior', front: 'Senior and subordinated (junior) debt', back: 'In default senior debt is paid first; junior debt only gets what is left. New junior debt funding a project can raise the value of existing senior bonds.' },
  { key: 'l2-conv', front: 'Convertible bond payoff at maturity', back: 'max(min(K, V), x/(n + x) × V): the principal K (or V in default), or the fraction of the firm the x new shares represent.' },
  { key: 'l2-ratio', front: 'Conversion ratio of a convertible bond', back: 'Shares received per bond: x / number of bonds, e.g. per €100 of face value x / (K/100).' },
  { key: 'l2-same', front: 'Straight versus convertible debt in a perfect market', back: 'Both fairly priced, so the share price is the same: (existing value + NPV) / shares. Shareholders are indifferent.' },
  { key: 'l2-bankr', front: 'When do bankruptcy costs lower the share price?', back: 'Only if the security can default. A convertible with a principal below the firm value in every state never triggers them.' },
  // Lecture 3
  { key: 'l3-own', front: 'Effort with own cash', back: 'High effort if κ ≤ E[V | high] − E[V | low]: the entrepreneur bears the whole cost and keeps the whole gain.' },
  { key: 'l3-equity', front: 'Effort with outside equity', back: 'Investors take α = I / E[V | high]; the entrepreneur keeps 1 − α of the gain: high effort if κ ≤ (1 − α)(E[V | high] − E[V | low]).' },
  { key: 'l3-debt', front: 'Effort with debt', back: 'Face value F from E<sub>high</sub>[min(F, V)] = I; high effort if κ ≤ Σ(p<sub>high</sub> − p<sub>low</sub>) max(V − F, 0). The entrepreneur keeps the whole upside above F.' },
  { key: 'l3-incentive', front: 'Incentivizing power of debt', back: 'For a range of effort costs only debt sustains high effort, because it leaves the entrepreneur residual claimant on the upside.' },
  { key: 'l3-pool', front: 'Pooled prices under asymmetric information', back: 'Equity: α = I / average expected value. Debt: F from the average success probability. Good types’ securities are underpriced, bad types’ overpriced.' },
  { key: 'l3-sensitive', front: 'Information sensitivity', back: 'Debt’s value depends less on private information than equity’s, so it is less mispriced. Good types prefer debt.' },
  { key: 'l3-pecking', front: 'Pecking order theory', back: 'Internal funds first, then debt, then equity. Issuing equity would reveal a bad type, so all types pool on debt.' },
  // Lecture 4
  { key: 'l4-npv', front: 'NPV rule', back: 'NPV = Σ E[CF<sub>t</sub>] / (1 + r)<sup>t</sup>. Undertake the project if NPV > 0; NPV is what you would pay for the right to do the project.' },
  { key: 'l4-incr', front: 'Incremental cash flows', back: 'CF with the project − CF without it. Exclude sunk costs and allocated costs that do not change; include opportunity costs and externalities (e.g. cannibalisation).' },
  { key: 'l4-fcf', front: 'Free cash flow', back: 'FCF = EBITDA − τ·EBIT − CapEx − ΔNWC + other = EBIT(1 − τ) + Dep − CapEx − ΔNWC + other. No interest, no dividends.' },
  { key: 'l4-nwc', front: 'Net working capital', back: 'Operating cash + inventory + accounts receivable − accounts payable. An increase is a cash outflow; NWC is recovered at the end of a project.' },
  { key: 'l4-capex', front: 'CapEx from the balance sheet', back: 'Change in non-current assets + depreciation.' },
  { key: 'l4-salvage', front: 'After-tax salvage value', back: 'Sale price − τ × (sale price − book value).' },
  { key: 'l4-tv', front: 'Continuation value', back: 'TV<sub>T</sub> = FCF<sub>T+1</sub> / (r − g), a cash flow at year T, discounted back with (1 + r)<sup>T</sup>.' },
  { key: 'l4-twin', front: 'Twin-firm method', back: 'Take the equity beta of pure players in the project’s business, unlever it: β<sub>U</sub> = E/V·β<sub>E</sub> + D/V·β<sub>D</sub>, relever at the project’s D′/E′: β<sub>E′</sub> = β<sub>U</sub> + D′/E′(β<sub>U</sub> − β<sub>D′</sub>).' },
  { key: 'l4-apv', front: 'Adjusted present value', back: 'V<sup>L</sup> = V<sup>U</sup> + PV(debt tax shield) + other financing effects. Tax shield in year t: τ·r<sub>D</sub>·D<sub>t−1</sub>.' },
  { key: 'l4-rdts', front: 'Discount rate for the tax shield', back: 'r<sub>D</sub> if the debt schedule is predetermined (perpetual debt: PV = τD); r<sub>U</sub> if debt keeps a constant leverage ratio.' },
  { key: 'l4-wacc', front: 'WACC', back: 'E′/(D′ + E′)·r<sub>E′</sub> + D′/(D′ + E′)·r<sub>D′</sub>(1 − τ); with constant leverage r<sub>U</sub> − D/V·τ·r<sub>D</sub>. V<sup>L</sup> = Σ FCF / (1 + WACC)<sup>t</sup>.' },
  { key: 'l4-apvwacc', front: 'APV or WACC?', back: 'Same value in principle. WACC is quick but assumes a constant leverage ratio; APV is more flexible (fixed debt schedules, subsidised loans, distress costs).' },
];
