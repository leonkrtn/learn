// Official Financial Investments flashcards. Seeded into Supabase by `npm run seed:sql`.
import type { SeedCard } from '../fvcs/cards';

export const DECK_NAME = 'FI core concepts';

export const CARDS: SeedCard[] = [
  // Lecture 1
  { key: 'l1-sml', front: 'Security market line (SML)', back: 'E[r<sub>i</sub>] = r<sub>f</sub> + β<sub>i</sub> (E[r<sub>M</sub>] − r<sub>f</sub>), with β<sub>i</sub> = cov(r<sub>i</sub>, r<sub>M</sub>) / σ²<sub>M</sub>. All correctly priced assets lie on it.' },
  { key: 'l1-cml', front: 'Capital market line (CML)', back: 'E[r<sub>C</sub>] = r<sub>f</sub> + (E[R<sub>M</sub>]/σ<sub>M</sub>) σ<sub>C</sub>. Combinations of the market and the risk-free asset; the efficient set if the CAPM holds.' },
  { key: 'l1-cal', front: 'CAL spanned by an asset P in a CAPM world', back: 'Slope = ρ<sub>PM</sub> × Sharpe ratio of the market.' },
  { key: 'l1-mrp', front: 'Market risk premium in equilibrium', back: 'E[r<sub>M</sub>] − r<sub>f</sub> = Ā σ²<sub>M</sub>, with Ā the average risk aversion (plausibly 2–5).' },
  { key: 'l1-assump', front: 'CAPM assumptions', back: 'Mean-variance investors, one period, same investable universe and input list, same r<sub>f</sub> for lending and borrowing, risk-free asset in zero net supply, no frictions.' },
  { key: 'l1-sim', front: 'Single-index model', back: 'R<sub>i</sub> = α<sub>i</sub> + β<sub>i</sub>R<sub>M</sub> + e<sub>i</sub>; σ²<sub>i</sub> = β²<sub>i</sub>σ²<sub>M</sub> + σ²(e<sub>i</sub>); cov(R<sub>i</sub>, R<sub>j</sub>) = β<sub>i</sub>β<sub>j</sub>σ²<sub>M</sub>.' },
  { key: 'l1-params', front: 'Parameters: Markowitz vs. single-index for n = 100', back: 'Markowitz: 100 means + 100 variances + 4,950 covariances = 5,150. Single index: about 403.' },
  { key: 'l1-alpha', front: 'Alpha and mispricing', back: 'α = E[r] − (r<sub>f</sub> + β E[R<sub>M</sub>]): vertical distance to the SML. α &gt; 0 underpriced, α &lt; 0 overpriced.' },
  { key: 'l1-zb', front: 'Zero-beta CAPM (Black, 1972)', back: 'E[r<sub>i</sub>] = E[r<sub>Z</sub>] + β<sub>i</sub>(E[r<sub>M</sub>] − E[r<sub>Z</sub>]). With borrowing constraints; flatter SML, positive alphas on low-beta stocks.' },
  { key: 'l1-roll', front: 'Roll’s critique (1977)', back: 'The true market portfolio (incl. real estate, human capital) is unobservable; only the efficiency of a proxy can be rejected.' },
  { key: 'l1-ccapm', front: 'Consumption CAPM', back: 'p<sub>t</sub>u′(c<sub>t</sub>) = βE[x<sub>t+1</sub>u′(c<sub>t+1</sub>)]; SDF m = βu′(c<sub>t+1</sub>)/u′(c<sub>t</sub>). Assets paying in recessions are worth more.' },
  { key: 'l1-icapm', front: 'ICAPM (Merton, 1973)', back: 'Multi-period investors hedge changes in the opportunity set (r<sub>f</sub>, inflation, growth): market plus hedging-portfolio factors.' },
  // Lecture 2
  { key: 'l2-apt', front: 'APT: three propositions (Ross, 1976)', back: 'Returns follow a factor model; enough securities to diversify idiosyncratic risk; no arbitrage in frictionless markets.' },
  { key: 'l2-sml', front: 'Multifactor APT SML', back: 'E[r<sub>i</sub>] = r<sub>f</sub> + Σ<sub>k</sub> β<sub>ik</sub> RP<sub>k</sub>, for well-diversified portfolios.' },
  { key: 'l2-cond', front: 'Conditional expected return with factor surprises', back: 'E[r | F] = E[r] + Σ β<sub>k</sub>(F<sub>k</sub> − E[F<sub>k</sub>]).' },
  { key: 'l2-capmvsapt', front: 'APT vs. CAPM', back: 'APT: only well-diversified portfolios, no market-portfolio or mean-variance assumption, a few large arbitrageurs suffice. CAPM: all assets, market is tangency portfolio, many price-taking investors.' },
  { key: 'l2-ff', front: 'Fama-French three factors', back: 'Market excess return, SMB (small minus big), HML (high minus low book-to-market). Carhart adds momentum.' },
  { key: 'l2-emh', front: 'Three forms of the EMH', back: 'Weak: past prices and volume. Semi-strong: all public information. Strong: all information, including private.' },
  { key: 'l2-anom', front: 'Classic anomalies', back: 'Momentum (Jegadeesh-Titman), long-term reversal (De Bondt-Thaler), P/E (Basu), size (Banz), book-to-market, January, post-earnings drift (Ball-Brown).' },
  { key: 'l2-joint', front: 'Joint hypothesis problem', back: 'Abnormal returns relative to a model test efficiency and the model at once; the model may be wrong.' },
  { key: 'l2-lta', front: 'Limits to arbitrage', back: 'Trading costs, idiosyncratic risk, margin requirements, short-sale constraints, short squeezes. Momentum and short-term reversal are hard to exploit after costs.' },
  { key: 'l2-ei', front: 'Efficiently inefficient markets (Pedersen)', back: 'Prices are inefficient just enough to reward the costs and risks of the active investors who keep them close to efficient.' },
  // Lecture 3
  { key: 'l3-dwr', front: 'Time- vs. dollar-weighted returns', back: 'Time-weighted: arithmetic or geometric average of period returns. Dollar-weighted: IRR of the investor’s cash flows; weights periods by money invested.' },
  { key: 'l3-ratios', front: 'Sharpe, Treynor, Jensen, IR', back: 'Sharpe = (r̄<sub>P</sub> − r̄<sub>f</sub>)/σ<sub>P</sub>; Treynor = (r̄<sub>P</sub> − r̄<sub>f</sub>)/β<sub>P</sub>; α = r̄<sub>P</sub> − [r̄<sub>f</sub> + β<sub>P</sub>(r̄<sub>M</sub> − r̄<sub>f</sub>)]; IR = α/σ(e<sub>P</sub>).' },
  { key: 'l3-m2', front: 'M² (Modigliani and Modigliani)', back: 'Lever P to the market’s volatility: M² = r<sub>f</sub> + SR<sub>P</sub>σ<sub>M</sub> − E[r<sub>M</sub>].' },
  { key: 'l3-which', front: 'Which measure when?', back: 'Entire risky portfolio: Sharpe (or M²). One of many sub-portfolios: Treynor. Single active portfolio next to an index: information ratio.' },
  { key: 'l3-tstat', front: 'Months needed for a significant alpha', back: 't = (α/σ<sub>e</sub>)√N &gt; 1.96 ⇒ N &gt; (1.96 σ<sub>e</sub>/α)². E.g. α = 0.2%, σ<sub>e</sub> = 2% per month ⇒ N &gt; 384.' },
  { key: 'l3-attrib', front: 'Performance attribution', back: 'r<sub>P</sub> − r<sub>B</sub> = Σ(w<sub>Pi</sub> − w<sub>Bi</sub>)r<sub>Bi</sub> [asset allocation] + Σ w<sub>Pi</sub>(r<sub>Pi</sub> − r<sub>Bi</sub>) [security selection].' },
  { key: 'l3-mrar', front: 'MRAR', back: 'Morningstar risk-adjusted return, MRAR(γ) = [(1/T)Σ((1 + r<sub>t</sub>)/(1 + r<sub>f,t</sub>))<sup>−γ</sup>]<sup>−12/γ</sup> − 1. Manipulation-proof (Ingersoll et al.).' },
  { key: 'l3-timing', front: 'Market-timing regressions', back: 'Treynor-Mazuy: add c(r<sub>M</sub> − r<sub>f</sub>)². Henriksson-Merton: add c(r<sub>M</sub> − r<sub>f</sub>)D, D = 1 if the market excess return is positive.' },
  // Lecture 4
  { key: 'l4-tb', front: 'Treynor-Black steps', back: 'w<sub>i</sub>⁰ = α<sub>i</sub>/σ²(e<sub>i</sub>), scale to sum to 1; α<sub>A</sub>, β<sub>A</sub>, σ²(e<sub>A</sub>) = Σw²<sub>i</sub>σ²(e<sub>i</sub>); w<sub>A</sub>⁰ = [α<sub>A</sub>/σ²(e<sub>A</sub>)]/[E(R<sub>M</sub>)/σ²<sub>M</sub>]; w<sub>A</sub>* = w<sub>A</sub>⁰/[1 + (1 − β<sub>A</sub>)w<sub>A</sub>⁰].' },
  { key: 'l4-sr', front: 'Sharpe ratio of the Treynor-Black portfolio', back: 'SR²<sub>P</sub> = SR²<sub>M</sub> + IR²<sub>A</sub> = SR²<sub>M</sub> + Σ IR²<sub>i</sub>.' },
  { key: 'l4-te', front: 'Benchmark risk', back: 'σ(T<sub>E</sub>) = w<sub>A</sub> √[(1 − β<sub>A</sub>)²σ²<sub>M</sub> + σ²(e<sub>A</sub>)].' },
  { key: 'l4-kkw', front: 'Adjusting alpha for forecast precision', back: 'Kane, Kim and White: α̃ = R² × α, with R² from regressing realised on forecast alphas (often about 0.001). Shrinks weights towards zero.' },
  { key: 'l4-bl', front: 'Black-Litterman steps', back: '1) Σ from history. 2) Baseline returns from market weights (E[R<sub>M</sub>] = Āσ²<sub>M</sub>, CAPM betas). 3) Views Q = P′R + ε. 4) Posterior R* = R<sub>E</sub> + (D/σ²<sub>D</sub>)Σ<sub>F</sub>P with Σ<sub>F</sub> = τΣ, D = Q − Q<sub>E</sub>. 5) Optimise.' },
  { key: 'l4-fee', front: 'Value of active management (Kane, Marcus and Trippi)', back: 'f = (1/2A) Σ IR²<sub>i</sub>: rises with the number of stocks and forecast precision, falls with risk aversion.' },
  // Lecture 5
  { key: 'l5-jk', front: 'Jobson and Korkie (1980)', back: 'Estimated mean-variance weights are extremely noisy; imprecision rises with the number of assets and their correlation, falls with sample size.' },
  { key: 'l5-michaud', front: 'Michaud (1989): error maximisation', back: 'Optimisers overweight assets with extreme (likely erroneous) estimates; weights are unstable and counter-intuitive.' },
  { key: 'l5-dgu', front: 'DeMiguel, Garlappi and Uppal (2009)', back: 'Out of sample, none of 13 optimised strategies systematically beats 1/N: estimation error outweighs optimal diversification.' },
  { key: 'l5-ppp', front: 'Parametric portfolio policies (Brandt, Santa-Clara and Valkanov, 2009)', back: 'w<sub>i,t</sub> = θ′x<sub>i,t</sub>/N<sub>t</sub>, θ chosen to maximise utility. Avoids estimating Σ, few parameters, robust, simple.' },
  { key: 'l5-galton', front: 'Galton correction (Barroso and Saxena, 2021)', back: 'Use past out-of-sample errors to correct inputs for regression to the mean; sensible weights and realistic risk estimates.' },
  // Lecture 6
  { key: 'l6-vs', front: 'Hedge funds vs. mutual funds', back: 'Hedge funds: minimal disclosure, ≤100 sophisticated investors, flexible strategies with shorting and leverage, lock-ups, 2-and-20 fees. Mutual funds: regulated, transparent, liquid, fees 0.5–1.5%.' },
  { key: 'l6-pa', front: 'Portable alpha with futures', back: 'Contracts to sell = (portfolio value × β)/(S<sub>0</sub> × multiplier). Hedge payoff N·mult·S<sub>0</sub>(r<sub>f</sub> − r<sub>M</sub>); hedged value = V(1 + r<sub>f</sub> + α) + V·e.' },
  { key: 'l6-fees', front: 'Incentive fee as a call option', back: 'Strike = portfolio value × (1 + hurdle). The manager gains from volatility; investors in funds of funds can pay fees while losing money.' },
  { key: 'l6-hwm', front: 'High-water mark', back: 'Incentive fees only on value above the previous peak; deep losses push funds to close.' },
  { key: 'l6-bias', front: 'Hedge fund data biases', back: 'Survivorship bias (about twice that of mutual funds) and backfill bias (Malkiel and Saha, 2005).' },
  { key: 'l6-sw', front: 'Scholes-Williams beta', back: 'Regress on current and lagged market returns; corrected β = sum of the coefficients. Asness, Krail and Liew: true risk 2–4 times higher, alphas mostly negative.' },
  { key: 'l6-liq', front: 'Liquidity and hedge fund alpha', back: 'Aragon (2007): alpha insignificant after controlling for lock-ups. Sadka (2010): high liquidity-risk betas earn about 6% more per year.' },
];
