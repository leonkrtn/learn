// Official Firm Valuation flashcards for lectures 1 and 2. Seeded into Supabase by `npm run seed:sql`.
import type { SeedCard } from '../fvcs/cards';

export const DECK_NAME = 'FV lectures 1–2';

export const CARDS: SeedCard[] = [
  // Lecture 1
  { key: 'l1-weak', front: 'Weak-form efficiency', back: 'Prices reflect all past prices and volume. Technical analysis earns no abnormal returns. Challenged by momentum.' },
  { key: 'l1-semi', front: 'Semi-strong-form efficiency', back: 'Prices reflect all public information. Fundamental analysis earns no persistent abnormal returns. Event studies show fast reactions; post-earnings drift contradicts it.' },
  { key: 'l1-strong', front: 'Strong-form efficiency', back: 'Prices reflect public and private information, so even insiders cannot beat the market. Rejected: insiders earn abnormal returns.' },
  { key: 'l1-tests', front: 'Three empirical tests of market efficiency', back: 'Autocorrelation tests, event studies, cross-sectional tests (do size or book-to-market predict returns?).' },
  { key: 'l1-ev', front: 'Firm (enterprise) value', back: 'Value of the whole business to debt and equity holders: what a buyer pays for the entire firm.' },
  { key: 'l1-eqv', front: 'Equity value', back: 'Residual claim of shareholders = firm value − net debt (− preferred, − minorities). Equals market capitalisation in market terms.' },
  { key: 'l1-assets', front: 'Two parts of firm value', back: 'Assets in place (existing investments with current cash flows) + growth assets (value of future investments).' },
  { key: 'l1-dcf', front: 'Fundamental DCF equation', back: 'V<sub>0</sub> = Σ E[CF<sub>n</sub>] / (1 + r)<sup>n</sup>' },
  { key: 'l1-ar', front: 'Abnormal return (market model)', back: 'AR<sub>t</sub> = R<sub>t</sub> − (α + β R<sub>m,t</sub>). CAR = sum of ARs over the event window.' },
  { key: 'l1-crs', front: 'Chordia, Roll & Subrahmanyam (2005)', back: 'NYSE daily returns are not autocorrelated, order imbalances persist; arbitrage restores efficiency within 5–60 minutes.' },
  { key: 'l1-msz', front: 'Moeller, Schlingemann & Stulz (2005)', back: 'Acquirers lost 12 cents per dollar spent in 1998–2001 ($240bn), driven by a few large deals by highly valued acquirers.' },
  { key: 'l1-ahxz', front: 'Ang, Hodrick, Xing & Zhang (2009)', back: 'High idiosyncratic volatility → low future returns; 1.31% per month spread across 23 markets.' },
  { key: 'l1-lunar', front: 'Yuan, Zheng & Zhu (2006)', back: 'Returns around full moons are 3–5% p.a. lower than around new moons in 48 countries; not explained by volatility or volume.' },
  // Lecture 2
  { key: 'l2-which', front: 'DDM vs. FCFF vs. FCFE: when to use which', back: 'DDM: mature firms, stable dividends. FCFF at WACC: whole firm, changing leverage, capital-intensive or growth phases. FCFE at k<sub>e</sub>: stable leverage, focus on equity.' },
  { key: 'l2-gordon', front: 'Gordon growth model', back: 'V<sub>0</sub> = D<sub>1</sub> / (k<sub>e</sub> − g), with g &lt; k<sub>e</sub> and g ≤ long-run growth of the economy.' },
  { key: 'l2-sustain', front: 'Sustainable growth', back: 'g = b × ROE = (1 − payout) × ROE' },
  { key: 'l2-implied', front: 'Implied cost of equity', back: 'k<sub>e</sub> = D<sub>1</sub> / P<sub>0</sub> + g' },
  { key: 'l2-retain', front: 'When does retaining more earnings raise value?', back: 'Only if ROE > k<sub>e</sub>. At ROE = k<sub>e</sub> nothing changes; below it, investors prefer dividends now.' },
  { key: 'l2-twostage', front: 'Two-stage DDM', back: 'PV of dividends growing at g<sub>s</sub> for n years + D<sub>n</sub>(1 + g<sub>l</sub>) / [(k<sub>e</sub> − g<sub>l</sub>)(1 + k<sub>e</sub>)<sup>n</sup>]. Weakness: abrupt drop in growth.' },
  { key: 'l2-h', front: 'H-model', back: 'V<sub>0</sub> = [D<sub>0</sub>(1 + g<sub>L</sub>) + D<sub>0</sub> H (g<sub>S</sub> − g<sub>L</sub>)] / (k<sub>e</sub> − g<sub>L</sub>); H = half the transition period, growth falls linearly.' },
  { key: 'l2-fcff', front: 'FCFF', back: 'EBIT(1 − t) + D&amp;A − CapEx − ΔNWC' },
  { key: 'l2-fcfe', front: 'FCFE', back: 'FCFF − interest × (1 − t) + net new borrowing' },
  { key: 'l2-tv', front: 'Terminal value rules', back: 'TV<sub>T</sub> = CF<sub>T+1</sub> / (r − g); g typically 2–4% and below r; WACC stable in the long run. Check the TV share (often above 70%).' },
  { key: 'l2-bridge', front: 'Bridge from firm value to equity value', back: 'Equity = firm value − market value of debt + cash − preferred stock − minority interests.' },
  { key: 'l2-pref', front: 'Value of preferred stock', back: 'Preferred dividend / required return on preferred (a perpetuity).' },
  { key: 'l2-dtl', front: 'Deferred tax liability in a DCF', back: 'Its reversal is a future cash outflow: forecast the payments and subtract their PV from firm value.' },
  { key: 'l2-horizon', front: 'Why 3–10 explicit years plus a terminal value?', back: 'Cash flows stabilise, uncertainty grows and the value becomes very sensitive to distant forecasts.' },
  { key: 'l2-dt', front: 'Dichev & Tang (2009)', back: 'Volatile earnings are harder to forecast; analysts do not fully adjust, so pull volatile earnings towards the mean in projections.' },
];
