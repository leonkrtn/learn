// Official FD flashcards: definitions, formulas and results from the lectures and problem set 1.
// Seeded into Supabase by `npm run seed:sql`. Fronts and backs may contain simple HTML.

export type SeedCard = { key: string; front: string; back: string };

export const DECK_NAME = 'FD core concepts';

export const CARDS: SeedCard[] = [
  // Lecture 1
  { key: 'l1-deriv', front: 'Derivative security', back: 'A security whose value derives from an underlying variable, often the price of a traded asset (the underlying, or primitive, asset). Used to hedge, speculate and arbitrage.' },
  { key: 'l1-option', front: 'Call and put', back: 'Right, not obligation, to buy (call) or sell (put) the underlying at the strike X on (European) or up to (American) the maturity date T. Payoffs max(S<sub>T</sub> − X, 0) and max(X − S<sub>T</sub>, 0).' },
  { key: 'l1-intrinsic', front: 'Intrinsic value and time value', back: 'Intrinsic value: max(S − X, 0) for a call, max(X − S, 0) for a put. Time value = option price − intrinsic value (can be negative for a European put deep in the money).' },
  { key: 'l1-callbounds', front: 'Bounds on a European call (no income)', back: 'max(S − PV(X), 0) ≤ c ≤ S.' },
  { key: 'l1-putbounds', front: 'Bounds on a European put (no income)', back: 'max(PV(X) − S, 0) ≤ p ≤ PV(X).' },
  { key: 'l1-parity', front: 'Put-call parity', back: 'c = p + S − PV(X) (no income); with income of present value D: c = p + S − PV(X) − D. American options: S − X ≤ C − P ≤ S − PV(X).' },
  { key: 'l1-amcall', front: 'Early exercise of an American call (no income)', back: 'Never optimal: C ≥ S − PV(X) > S − X, so selling beats exercising. Hence C = c.' },
  { key: 'l1-amput', front: 'Early exercise of an American put (no income)', back: 'Can be optimal when S is low: exercising and investing (X − S)e<sup>rT</sup> can exceed X, the most the put pays at maturity. Hence P > p.' },
  { key: 'l1-div', front: 'Bounds with income D (present value)', back: 'c ≥ S − PV(X) − D, p ≥ PV(X) − S + D. An American call may be exercised just before a large dividend; the incentive to exercise an American put early falls.' },
  { key: 'l1-arb', front: 'Exploiting a call below its lower bound', back: 'Buy the call, short the share, invest PV(X): cash today S − PV(X) − c > 0, payoff at T max(S<sub>T</sub>, X) − S<sub>T</sub> ≥ 0.' },
  // Lecture 2
  { key: 'l2-bull', front: 'Bull spread', back: 'Calls: buy X1, sell X2 > X1 (outflow). Puts: buy X1, sell X2 (inflow). Bet on a rise within a limited range.' },
  { key: 'l2-bear', front: 'Bear spread', back: 'Calls: sell X1, buy X2 > X1 (inflow). Puts: sell X1, buy X2 (outflow). Bet on a fall within a limited range.' },
  { key: 'l2-straddle', front: 'Straddle and inverted straddle', back: 'Buy (sell) a call and a put with the same strike: bet on volatility (stability). Choose X close to S<sub>t</sub>. The inverted straddle has unlimited risk.' },
  { key: 'l2-strangle', front: 'Strangle and inverted strangle', back: 'Buy (sell) a put with X1 and a call with X2 > X1. Cheaper than a straddle; the inverted strangle bets on stability over the range X1 to X2.' },
  { key: 'l2-butterfly', front: 'Butterfly spread', back: 'Buy one option with X1, sell two with X2, buy one with X3 (calls or puts; symmetric if X2 = (X1 + X3)/2). Bet on stability with limited risk; costs money up front.' },
  { key: 'l2-calendar', front: 'Calendar spread', back: 'Sell a call maturing at T and buy a call with the same strike maturing at T* > T. Bet on stability; the reverse calendar spread bets on volatility.' },
  { key: 'l2-fv', front: 'Net payoff of a strategy', back: 'Payoff at maturity + future value of the initial cash flow, CF<sub>0</sub>e<sup>rT</sup>.' },
  // Lecture 3
  { key: 'l3-repl', front: 'Replicating portfolio (one period)', back: 'm = (c<sup>u</sup> − c<sup>d</sup>)/(S<sup>u</sup> − S<sup>d</sup>) shares and borrowing B = (mS<sup>u</sup> − c<sup>u</sup>)/(1 + r); c = mS − B. m is the delta (hedge ratio).' },
  { key: 'l3-pi', front: 'Risk-neutral probability', back: 'π = (1 + r − d)/(u − d), or (e<sup>rΔt</sup> − d)/(u − d) with continuous rates and (e<sup>(r − q)Δt</sup> − d)/(u − d) with a dividend yield q. Requires d < 1 + r < u.' },
  { key: 'l3-crr', front: 'u and d from volatility', back: 'u = e<sup>σ√Δt</sup>, d = 1/u = e<sup>−σ√Δt</sup>; they match the mean and variance of the lognormal price over Δt.' },
  { key: 'l3-npd', front: 'n-period binomial formula', back: 'c<sub>0</sub> = (1 + r)<sup>−n</sup> Σ<sub>j</sub> C(n, j) π<sup>j</sup>(1 − π)<sup>n−j</sup> max(S<sub>0</sub>u<sup>j</sup>d<sup>n−j</sup> − X, 0).' },
  { key: 'l3-am', front: 'American options in a tree', back: 'At every node take max(value alive, value dead): discounted risk-neutral expectation versus immediate exercise.' },
  { key: 'l3-divtree', front: 'Tree with a known dividend', back: 'Build the recombining tree for S* = S − PV(dividends); at each node add back the PV of the dividends still to come.' },
  { key: 'l3-effects', front: 'Effect of parameters on option values', back: 'S: call +, put −. X: call −, put +. Volatility: both +. Time: call +, put ±. r: call +, put −. Real up-probability: no effect.' },
  { key: 'l3-vol', front: 'Historical volatility', back: 'u<sub>t</sub> = ln(S<sub>t</sub>/S<sub>t−1</sub>); σ̂ = sample standard deviation of u<sub>t</sub> × √252 (daily data).' },
  // Lecture 4
  { key: 'l4-gbm', front: 'Lognormal model', back: 'dS = μS dt + σS dz ⇒ ln S<sub>T</sub> ~ N(ln S<sub>0</sub> + (μ − σ²/2)T, σ²T); E[S<sub>T</sub>] = S<sub>0</sub>e<sup>μT</sup>.' },
  { key: 'l4-bs', front: 'Black-Scholes formulas', back: 'c = S N(d1) − Xe<sup>−rT</sup>N(d2), p = Xe<sup>−rT</sup>N(−d2) − S N(−d1); d1 = [ln(S/X) + (r + σ²/2)T]/(σ√T), d2 = d1 − σ√T.' },
  { key: 'l4-nd2', front: 'N(d2) and N(d1)', back: 'N(d2): risk-neutral probability that the call is exercised. N(d1): delta of the call. With μ instead of r in d2: real-world probability of exercise.' },
  { key: 'l4-div', front: 'Black-Scholes with income', back: 'Known dividends: replace S by S − PV(D). Continuous yield q: replace S by Se<sup>−qT</sup> (r − q in d1).' },
  { key: 'l4-iv', front: 'Implied volatility', back: 'The σ that makes the Black-Scholes value equal the market price; found by trial and error. Above historical volatility ⇒ the market expects more risk.' },
  // Lecture 5
  { key: 'l5-decomp', front: 'Valuing a structured product', back: 'Decompose the payoff into zero-coupon bonds, the underlying and plain options; value each; the issuer’s margin = price − value.' },
  { key: 'l5-guar', front: 'Guarantee G plus α options', back: 'Price × (1 − margin) = Ge<sup>−rT</sup> + α × option value ⇒ α.' },
  { key: 'l5-floor', front: 'Payoff max(A, B − S<sub>T</sub>)', back: 'A + max((B − A) − S<sub>T</sub>, 0): a bond paying A plus a put with strike B − A.' },
  { key: 'l5-abs', front: 'Payoff K(1 + |R|)', back: 'K + (K/S<sub>0</sub>)|S<sub>T</sub> − S<sub>0</sub>|: a bond paying K plus K/S<sub>0</sub> at-the-money straddles.' },
  { key: 'l5-rev', front: 'Reverse convertible', back: 'Bond paying N(1 + k) minus N/S<sub>0</sub> puts struck at S<sub>0</sub>: the high coupon pays the investor for the puts sold.' },
  { key: 'l5-comm', front: 'Risk-neutral drift of a commodity', back: 'r + u − y (storage cost u, convenience yield y): value options on it like an asset with yield q = y − u.' },
  // Lecture 6
  { key: 'l6-fwd', front: 'Forward price', back: 'No income: Se<sup>rT</sup>; known income I: (S − I)e<sup>rT</sup>; yield q: Se<sup>(r − q)T</sup>; currency: Se<sup>(r − r<sub>f</sub>)T</sup>; commodity: Se<sup>(r + u − y)T</sup>.' },
  { key: 'l6-value', front: 'Value of a forward contract', back: 'Long: f = (F<sub>0</sub> − K)e<sup>−rT</sup>; zero at inception.' },
  { key: 'l6-margin', front: 'Futures margin account', back: 'Gains and losses settled daily. Below the maintenance margin ⇒ margin call back to the initial margin.' },
  { key: 'l6-hedge', front: 'Minimum-variance hedge', back: 'h* = ρ σ<sub>S</sub>/σ<sub>F</sub>; contracts N* = h* Q<sub>A</sub>/Q<sub>F</sub>. Index futures: N = (β* − β)V/(F × multiplier).' },
  { key: 'l6-swap', front: 'Interest rate swap', back: 'Receive-fixed value = B<sub>fix</sub> − B<sub>fl</sub>; B<sub>fl</sub> = notional right after a reset. Par rate s = (1 − DF<sub>n</sub>)/Σ DF<sub>t</sub>.' },
];
