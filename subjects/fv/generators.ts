// Firm Valuation: procedural generators for lectures 1 and 2.
// Every question draws a new fictional firm and new numbers; solutions are computed from the same inputs.
import { C, N, P, Q, calc, chance, chooseParts, co, eur, fmtNum, mk, p_, pick, poss, rint, roundTo, rstep, table, tn, tp, tq, v, withCalc, type Item } from '@/lib/engine/gen-helpers';
import type { Question } from '@/lib/engine/types';

const pv = (cf: number, r: number, t: number) => cf / Math.pow(1 + r, t);
const annuity = (cf: number, r: number, n: number) => cf / r * (1 - 1 / Math.pow(1 + r, n));
const ROUND_NOTE = 'Round only your final answers.';

// =====================================================================
// LECTURE 1 — Market efficiency, price and value
// =====================================================================

/** Value as the present value of expected cash flows, compared with the market price. */
export function L1_pv(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), M = mk();
    const n = rint(3, 5), r = rstep(0.06, 0.12, 0.005), g = chance(0.25) ? 0 : rstep(0.01, 0.035, 0.005);
    if (r - g < 0.03) continue;
    const cf: number[] = []; let c = rstep(20, 400, 5);
    for (let i = 0; i < n; i++) { cf.push(c); c = roundTo(c * rstep(1.02, 1.15, 0.01), 1); }
    const pvExp = cf.reduce((s, x, i) => s + pv(x, r, i + 1), 0);
    const tv = cf[n - 1] * (1 + g) / (r - g), pvTv = pv(tv, r, n), V = pvExp + pvTv;
    const shares = rstep(10, 200, 5), vps = V / shares;
    const price = roundTo(vps * rstep(0.75, 1.25, 0.01), 0.01);
    if (Math.abs(price / vps - 1) < 0.03) continue;
    const head = ['(€ million)', ...cf.map((_, i) => 'Year ' + (i + 1))];
    const body = p_(`An analyst expects ${name} to generate the following cash flows to equity. ${g ? `After year ${n} the cash flows are expected to grow at ${P(g, 1)} per year forever` : `After year ${n} the cash flow is expected to stay at the year-${n} level forever`}. The appropriate discount rate is ${P(r, 1)}. ${name} has ${fmtNum(shares)} million shares outstanding, trading at ${eur(price)}. ${ROUND_NOTE}`) +
      table(head, [['Expected cash flow', ...cf.map(x => fmtNum(x))]]);
    const items: Item[] = [
      { part: N(`What is the present value of the cash flows in years 1–${n}?`, pvExp, 'm', { key: 'pvExp' }), w: 0.7 },
      { part: N(`What is the value at the end of year ${n} of all cash flows after year ${n} (terminal value)?`, tv, 'm', { key: 'tv' }), w: 0.6 },
      { part: N('What is the present value of the terminal value?', pvTv, 'm', { key: 'pvTv' }), w: 0.5 },
      { part: N(v('What is the intrinsic value of the equity today?', 'What is the value of the equity according to the DCF?'), V, 'm', { key: 'V' }), must: true },
      { part: N('What is the intrinsic value per share?', vps, 'eur', { key: 'vps' }), w: 0.8 },
      { part: C('Compared with this value, the shares are', ['Undervalued', 'Overvalued'], price < vps ? 0 : 1, 'verdict'), w: 0.6 },
      { part: N('What share of the value comes from the terminal value?', pvTv / V * 100, 'pct', { key: 'tvShare' }), w: 0.3 },
    ];
    const k = calc(), fac = (t: number) => Math.pow(1 + r, t), cfN1 = cf[n - 1] * (1 + g);
    cf.forEach((x, i) => k.s(`**Year ${i + 1}.** Discount factor $(1 + ${tn(r, 4)})^{${i + 1}} = ${tn(fac(i + 1), 6)}$, so $PV_{${i + 1}} = \\frac{${tn(x)}}{${tn(fac(i + 1), 6)}} = ${tn(pv(x, r, i + 1), 4)}$.`));
    k.r(`**PV of years 1–${n}:** $${cf.map((x, i) => tn(pv(x, r, i + 1), 4)).join(' + ')} = ${tn(pvExp, 4)}$ (€ million).`, 'pvExp', pvExp);
    k.s(g ? `**Cash flow in year ${n + 1}:** $CF_{${n + 1}} = CF_{${n}}(1 + g) = ${tn(cf[n - 1])} \\times ${tn(1 + g, 4)} = ${tn(cfN1, 4)}$.`
      : `**Cash flow in year ${n + 1}:** no growth, so $CF_{${n + 1}} = CF_{${n}} = ${tn(cfN1, 4)}$.`);
    k.r(`**Terminal value at the end of year ${n}:** $TV_{${n}} = \\frac{CF_{${n + 1}}}{r - g} = \\frac{${tn(cfN1, 4)}}{${tn(r, 4)} - ${tn(g, 4)}} = \\frac{${tn(cfN1, 4)}}{${tn(r - g, 4)}} = ${tn(tv, 4)}$.`, 'tv', tv);
    k.r(`**Present value of the terminal value:** it sits at the end of year ${n}, so $\\frac{${tn(tv, 4)}}{(1 + ${tn(r, 4)})^{${n}}} = \\frac{${tn(tv, 4)}}{${tn(fac(n), 6)}} = ${tn(pvTv, 4)}$.`, 'pvTv', pvTv);
    k.r(`**Equity value:** $${tn(pvExp, 4)} + ${tn(pvTv, 4)} = ${tn(V, 4)}$ (€ million).`, 'V', V);
    k.r(`**Terminal-value share:** $\\frac{${tn(pvTv, 4)}}{${tn(V, 4)}} = ${tn(pvTv / V, 6)}$, i.e. $${tn(pvTv / V * 100, 2)}\\%$.`, 'tvShare', pvTv / V * 100);
    k.r(`**Value per share:** $\\frac{${tn(V, 4)}}{${tn(shares, 0)}} = ${tn(vps, 4)}$ (€ per share).`, 'vps', vps);
    k.r(`**Verdict:** the price of ${eur(price)} is ${price < vps ? 'below' : 'above'} the value of ${eur(vps)}, so the shares are ${price < vps ? 'undervalued' : 'overvalued'}.`, 'verdict');
    return withCalc(Q('L1.pv', 1, body, chooseParts(items, 3, 5)), k.steps);
  }
  throw new Error('L1_pv: no valid draw');
}

/** Firm (enterprise) value versus equity value. */
export function L1_bridge(): Question {
  const name = co(), M = mk();
  const shares = rstep(20, 400, 5), price = rstep(5, 120, 0.25), mcap = shares * price;
  const debt = roundTo(mcap * rstep(0.1, 0.9, 0.01), 5), cash = roundTo(mcap * rstep(0.02, 0.25, 0.01), 5);
  if (chance(0.4)) {
    const body = p_(`${name} has ${fmtNum(shares)} million shares outstanding at ${eur(price)} per share. The market value of its debt is ${M(debt)} and it holds ${M(cash)} in cash.`);
    const ev = mcap + debt - cash;
    const items: Item[] = [
      { part: N('What is the market capitalisation (market value of equity)?', mcap, 'm', { key: 'mcap' }), must: true },
      { part: N('What is the net debt?', debt - cash, 'm', { key: 'nd' }), w: 0.6 },
      { part: N(v('What is the enterprise (firm) value implied by the market?', 'What is the market value of the whole business, debt plus equity, net of cash?'), ev, 'm', { key: 'ev' }), must: true },
      { part: N('What fraction of the enterprise value is financed by net debt?', (debt - cash) / ev * 100, 'pct', { key: 'share' }), w: 0.35 },
    ];
    const k = calc();
    k.r(`**Market capitalisation:** shares × price $= ${tn(shares, 0)} \\times ${tn(price)} = ${tn(mcap, 4)}$ (€ million).`, 'mcap', mcap);
    k.r(`**Net debt:** debt minus cash $= ${tn(debt)} - ${tn(cash)} = ${tn(debt - cash)}$ (€ million).`, 'nd', debt - cash);
    k.r(`**Enterprise value:** market cap plus net debt $= ${tn(mcap, 4)} + ${tn(debt - cash)} = ${tn(ev, 4)}$ (€ million).`, 'ev', ev);
    k.r(`**Net-debt share:** $\\frac{${tn(debt - cash)}}{${tn(ev, 4)}} = ${tn((debt - cash) / ev, 6)}$, i.e. $${tn((debt - cash) / ev * 100, 2)}\\%$.`, 'share', (debt - cash) / ev * 100);
    return withCalc(Q('L1.bridge', 1, body, chooseParts(items, 2, 4)), k.steps);
  }
  const pref = chance(0.45) ? roundTo(mcap * rstep(0.03, 0.15, 0.01), 5) : 0;
  const mino = chance(0.35) ? roundTo(mcap * rstep(0.02, 0.1, 0.01), 5) : 0;
  const Vf = roundTo((mcap + debt - cash + pref + mino) * rstep(0.75, 1.3, 0.01), 5);
  const E = Vf - debt + cash - pref - mino, vps = E / shares;
  const extras = [pref ? `preferred stock worth ${M(pref)}` : '', mino ? `minority interests of ${M(mino)}` : ''].filter(Boolean);
  const body = p_(`A DCF of ${poss(name)} free cash flows to the firm gives an enterprise value of ${M(Vf)}. The firm has debt with a market value of ${M(debt)}, cash of ${M(cash)}${extras.length ? ', ' + extras.join(' and ') : ''}. There are ${fmtNum(shares)} million shares outstanding, trading at ${eur(price)}.`);
  const items: Item[] = [
    { part: N('What is the value of the common equity?', E, 'm', { key: 'E' }), must: true },
    { part: N('What is the value per share?', vps, 'eur', { key: 'vps' }), w: 0.8 },
    { part: N('By how much does the value per share exceed the share price? (Enter a shortfall as a negative number.)', (vps / price - 1) * 100, 'pct', { key: 'gap' }), w: 0.5 },
    { part: C('Based on this valuation, the shares are', ['Undervalued', 'Overvalued'], vps > price ? 0 : 1, 'verdict'), w: 0.5 },
  ];
  const k = calc();
  k.r(`**Common equity:** firm value − debt + cash${pref ? ' − preferred' : ''}${mino ? ' − minorities' : ''} $= ${tn(Vf)} - ${tn(debt)} + ${tn(cash)}${pref ? ' - ' + tn(pref) : ''}${mino ? ' - ' + tn(mino) : ''} = ${tn(E, 4)}$ (€ million).`, 'E', E);
  k.r(`**Value per share:** $\\frac{${tn(E, 4)}}{${tn(shares, 0)}} = ${tn(vps, 4)}$ (€).`, 'vps', vps);
  k.r(`**Gap to the price:** $\\frac{${tn(vps, 4)}}{${tn(price)}} - 1 = ${tn(vps / price, 6)} - 1 = ${tn(vps / price - 1, 6)}$, i.e. $${tn((vps / price - 1) * 100, 2)}\\%$.`, 'gap', (vps / price - 1) * 100);
  k.r(`**Verdict:** value ${eur(vps)} ${vps > price ? '>' : '<'} price ${eur(price)}, so the shares are ${vps > price ? 'undervalued' : 'overvalued'}.`, 'verdict');
  return withCalc(Q('L1.bridge', 1, body, chooseParts(items, 2, 4)), k.steps);
}

/** Event study with the market model: abnormal and cumulative abnormal returns. */
export function L1_event(): Question {
  const name = co();
  const alpha = rstep(-0.0003, 0.0004, 0.0001), beta = rstep(0.6, 1.6, 0.05);
  const ev = pick(['an earnings announcement', 'the announcement of an acquisition', 'a dividend increase', 'a profit warning', 'the announcement of a share buyback']);
  const sign = ev.includes('warning') ? -1 : chance(0.75) ? 1 : -1;
  const days = [-2, -1, 0, 1, 2];
  const rm = days.map(() => +(rstep(-0.015, 0.015, 0.0005)).toFixed(4));
  const shock = sign * rstep(0.02, 0.07, 0.0025);
  const ri = days.map((d, i) => +(alpha + beta * rm[i] + (d === 0 ? shock : d > 0 ? sign * rstep(-0.002, 0.008, 0.0005) : rstep(-0.004, 0.004, 0.0005))).toFixed(4));
  const ar = ri.map((x, i) => x - (alpha + beta * rm[i]));
  const car = (a: number, b: number) => ar.filter((_, i) => days[i] >= a && days[i] <= b).reduce((s, x) => s + x, 0);
  const pc = (x: number) => (x < 0 ? '−' : '') + Math.abs(x * 100).toFixed(2) + '%';
  const body = p_(`You study the share price reaction of ${name} to ${ev} on day 0. Estimated over a clean window before the event, the market model is R<sub>i</sub> = ${pc(alpha)} + ${fmtNum(beta)} × R<sub>m</sub> (daily returns). Daily returns around the event:`) +
    table(['Day', ...days.map(d => d < 0 ? '−' + -d : d > 0 ? '+' + d : '0')], [['Stock return', ...ri.map(pc)], ['Market return', ...rm.map(pc)]]) +
    p_('Enter returns in percent, e.g. 1.25 for 1.25%.');
  const items: Item[] = [
    { part: N('What is the normal (expected) return of the stock on day 0?', (alpha + beta * rm[2]) * 100, 'pct', { key: 'nr0' }), w: 0.4 },
    { part: N('What is the abnormal return on day 0?', ar[2] * 100, 'pct', { key: 'ar0' }), must: true },
    { part: N('What is the cumulative abnormal return CAR(−2, +2)?', car(-2, 2) * 100, 'pct', { key: 'car22' }), w: 0.7 },
    { part: N('What is the cumulative abnormal return CAR(0, +2)?', car(0, 2) * 100, 'pct', { key: 'car02' }), w: 0.5 },
    { part: N('What is the abnormal return on day +1?', ar[3] * 100, 'pct', { key: 'ar1' }), w: 0.3 },
  ];
  // Everything in percent: normal return = α + β·R_m, abnormal = actual − normal.
  const pc4 = (x: number) => tn(x * 100, 4), lbl = (d: number) => d < 0 ? '−' + -d : d > 0 ? '+' + d : '0';
  const k = calc();
  k.s(`**Market model in percent:** normal return $= ${pc4(alpha)}\\% + ${tn(beta)} \\times R_m$; abnormal return $=$ actual $-$ normal.`);
  days.forEach((d, i) => {
    const nr = alpha + beta * rm[i], line = `$${pc4(alpha)} + ${tn(beta)} \\times ${tq(rm[i] * 100, 2)} = ${pc4(nr)}\\%$`;
    if (d === 0) {
      k.r(`**Day 0, normal return:** ${line}.`, 'nr0', nr * 100);
      k.r(`**Day 0, abnormal return:** $${tn(ri[i] * 100, 2)} - ${tq(nr * 100, 4)} = ${pc4(ar[i])}\\%$.`, 'ar0', ar[i] * 100);
    } else if (d === 1) {
      k.r(`**Day +1:** normal ${line}; abnormal $${tn(ri[i] * 100, 2)} - ${tq(nr * 100, 4)} = ${pc4(ar[i])}\\%$.`, 'ar1', ar[i] * 100);
    } else {
      k.s(`**Day ${lbl(d)}:** normal ${line}; abnormal $${tn(ri[i] * 100, 2)} - ${tq(nr * 100, 4)} = ${pc4(ar[i])}\\%$.`);
    }
  });
  k.r(`**CAR(0, +2):** $${[2, 3, 4].map(i => tq(ar[i] * 100, 4)).join(' + ')} = ${pc4(car(0, 2))}\\%$.`, 'car02', car(0, 2) * 100);
  k.r(`**CAR(−2, +2):** $${ar.map(x => tq(x * 100, 4)).join(' + ')} = ${pc4(car(-2, 2))}\\%$.`, 'car22', car(-2, 2) * 100);
  return withCalc(Q('L1.event', 1, body, chooseParts(items, 3, 4)), k.steps);
}

// =====================================================================
// LECTURE 2 — DCF models: DDM, FCFF, FCFE
// =====================================================================

/** Gordon growth model, sustainable growth, implied cost of equity and growth. */
export function L2_gordon(): Question {
  const name = co();
  for (let att = 0; att < 3000; att++) {
    const ke = rstep(0.06, 0.13, 0.0025);
    const vr = rint(0, 3);
    if (vr === 0) {
      const D0 = rstep(0.4, 6, 0.05), g = rstep(0.01, 0.05, 0.0025);
      if (ke - g < 0.02) continue;
      const D1 = D0 * (1 + g), V = D1 / (ke - g);
      const body = p_(`${name} has just paid an annual dividend of ${eur(D0)} per share. Dividends are expected to grow at ${P(g, 2)} per year forever, and the cost of equity is ${P(ke, 2)}.`);
      const g2 = g + 0.01, V2 = D0 * (1 + g2) / (ke - g2);
      const items: Item[] = [
        { part: N('What is the expected dividend next year?', D1, 'eur', { key: 'D1' }), w: 0.6 },
        { part: N('What is the value of one share?', V, 'eur', { key: 'V' }), must: true },
        { part: N('What is the expected dividend yield for the coming year at this value?', D1 / V * 100, 'pct', { key: 'dy' }), w: 0.35 },
      ];
      if (ke - g - 0.01 > 0.01) items.push({ part: N('What would the share be worth if growth were one percentage point higher?', V2, 'eur', { key: 'V2' }), w: 0.35 });
      const k = calc();
      k.r(`**Next year’s dividend:** $D_1 = D_0(1 + g) = ${tn(D0)} \\times ${tn(1 + g, 4)} = ${tn(D1, 4)}$ (€).`, 'D1', D1);
      k.r(`**Value (Gordon):** $P_0 = \\frac{D_1}{k_e - g} = \\frac{${tn(D1, 4)}}{${tn(ke, 4)} - ${tn(g, 4)}} = \\frac{${tn(D1, 4)}}{${tn(ke - g, 4)}} = ${tn(V, 4)}$ (€).`, 'V', V);
      k.r(`**Dividend yield:** $\\frac{D_1}{P_0} = \\frac{${tn(D1, 4)}}{${tn(V, 4)}} = ${tn(D1 / V, 6)}$, i.e. $${tn(D1 / V * 100, 2)}\\%$ (it equals $k_e - g$).`, 'dy', D1 / V * 100);
      k.r(`**With growth one point higher:** $g = ${tn(g2, 4)}$, $D_1 = ${tn(D0)} \\times ${tn(1 + g2, 4)} = ${tn(D0 * (1 + g2), 4)}$, $P_0 = \\frac{${tn(D0 * (1 + g2), 4)}}{${tn(ke, 4)} - ${tn(g2, 4)}} = \\frac{${tn(D0 * (1 + g2), 4)}}{${tn(ke - g2, 4)}} = ${tn(V2, 4)}$ (€).`, 'V2', V2);
      return withCalc(Q('L2.gordon', 2, body, chooseParts(items, 2, 4)), k.steps);
    }
    if (vr === 1) {
      const E0 = rstep(1, 10, 0.05), payout = rstep(0.3, 0.8, 0.05), roe = rstep(0.06, 0.18, 0.005);
      const g = (1 - payout) * roe;
      if (ke - g < 0.015) continue;
      const D1 = E0 * payout * (1 + g), V = D1 / (ke - g);
      const body = p_(`${name} earned ${eur(E0)} per share last year and pays out ${P(payout, 0)} of its earnings as dividends. It earns a return on equity of ${P(roe, 1)} on reinvested earnings, which it expects to keep forever. Investors require ${P(ke, 2)}.`);
      const E1 = E0 * (1 + g);
      const items: Item[] = [
        { part: N('What is the sustainable growth rate of dividends?', g * 100, 'pct', { key: 'g' }), must: true },
        { part: N('What is next year’s dividend per share?', D1, 'eur', { key: 'D1' }), w: 0.6 },
        { part: N('What is the value per share?', V, 'eur', { key: 'V' }), must: true },
        { part: N('What is the implied forward P/E (value divided by next year’s earnings)?', V / E1, 'x', { key: 'pe' }), w: 0.3 },
      ];
      const k = calc();
      k.s(`**Retention ratio:** $b = 1 - \\text{payout} = 1 - ${tn(payout)} = ${tn(1 - payout)}$.`);
      k.r(`**Sustainable growth:** $g = b \\times ROE = ${tn(1 - payout)} \\times ${tn(roe, 4)} = ${tn(g, 6)}$, i.e. $${tn(g * 100, 4)}\\%$.`, 'g', g * 100);
      k.s(`**Next year’s earnings:** $E_1 = E_0(1 + g) = ${tn(E0)} \\times ${tn(1 + g, 6)} = ${tn(E1, 4)}$ (€).`);
      k.r(`**Next year’s dividend:** $D_1 = E_1 \\times \\text{payout} = ${tn(E1, 4)} \\times ${tn(payout)} = ${tn(D1, 4)}$ (€).`, 'D1', D1);
      k.r(`**Value per share:** $P_0 = \\frac{D_1}{k_e - g} = \\frac{${tn(D1, 4)}}{${tn(ke, 4)} - ${tn(g, 6)}} = \\frac{${tn(D1, 4)}}{${tn(ke - g, 6)}} = ${tn(V, 4)}$ (€).`, 'V', V);
      k.r(`**Forward P/E:** $\\frac{P_0}{E_1} = \\frac{${tn(V, 4)}}{${tn(E1, 4)}} = ${tn(V / E1, 4)}$.`, 'pe', V / E1);
      return withCalc(Q('L2.gordon', 2, body, chooseParts(items, 2, 4)), k.steps);
    }
    if (vr === 2) {
      const D0 = rstep(0.5, 5, 0.05), g = rstep(0.01, 0.05, 0.0025);
      if (ke - g < 0.015) continue;
      const Pr = roundTo(D0 * (1 + g) / (ke - g), 0.01), keI = D0 * (1 + g) / Pr + g;
      const body = p_(`${poss(name)} shares trade at ${eur(Pr)}. The company has just paid a dividend of ${eur(D0)}, and the market expects dividends to grow at ${P(g, 2)} per year indefinitely.`);
      const D1 = D0 * (1 + g), dy = D1 / Pr;
      const items: Item[] = [
        { part: N('What is the expected dividend next year?', D1, 'eur', { key: 'D1' }), w: 0.5 },
        { part: N('What cost of equity is implied by the share price?', keI * 100, 'pct', { key: 'ke' }), must: true },
        { part: N('Which part of that return is the expected dividend yield?', dy * 100, 'pct', { key: 'dy' }), w: 0.5 },
      ];
      const k = calc();
      k.r(`**Next year’s dividend:** $D_1 = D_0(1 + g) = ${tn(D0)} \\times ${tn(1 + g, 4)} = ${tn(D1, 4)}$ (€).`, 'D1', D1);
      k.r(`**Dividend yield:** $\\frac{D_1}{P_0} = \\frac{${tn(D1, 4)}}{${tn(Pr)}} = ${tn(dy, 6)}$, i.e. $${tn(dy * 100, 4)}\\%$.`, 'dy', dy * 100);
      k.r(`**Implied cost of equity:** $k_e = \\frac{D_1}{P_0} + g = ${tn(dy, 6)} + ${tn(g, 4)} = ${tn(keI, 6)}$, i.e. $${tn(keI * 100, 4)}\\%$.`, 'ke', keI * 100);
      return withCalc(Q('L2.gordon', 2, body, chooseParts(items, 2, 3)), k.steps);
    }
    const D1 = rstep(0.5, 6, 0.05), g = rstep(0.01, 0.05, 0.0025);
    if (ke - g < 0.015) continue;
    const Pr = roundTo(D1 / (ke - g), 0.01), gI = ke - D1 / Pr;
    const payout = rstep(0.3, 0.7, 0.05);
    const body = p_(`${name} is expected to pay a dividend of ${eur(D1)} per share next year. Its shares trade at ${eur(Pr)} and its cost of equity is ${P(ke, 2)}. The company pays out ${P(payout, 0)} of its earnings.`);
    const items: Item[] = [
      { part: N('What perpetual dividend growth rate is the market pricing in?', gI * 100, 'pct', { key: 'g' }), must: true },
      { part: N('What return on equity on reinvested earnings would sustain that growth?', gI / (1 - payout) * 100, 'pct', { key: 'roe' }), w: 0.6 },
    ];
    const k = calc();
    k.s(`**Dividend yield:** $\\frac{D_1}{P_0} = \\frac{${tn(D1)}}{${tn(Pr)}} = ${tn(D1 / Pr, 6)}$.`);
    k.r(`**Implied growth:** from $P_0 = \\frac{D_1}{k_e - g}$, $g = k_e - \\frac{D_1}{P_0} = ${tn(ke, 4)} - ${tn(D1 / Pr, 6)} = ${tn(gI, 6)}$, i.e. $${tn(gI * 100, 4)}\\%$.`, 'g', gI * 100);
    k.r(`**ROE that sustains it:** $g = b \\times ROE$ with $b = 1 - ${tn(payout)} = ${tn(1 - payout)}$, so $ROE = \\frac{${tn(gI, 6)}}{${tn(1 - payout)}} = ${tn(gI / (1 - payout), 6)}$, i.e. $${tn(gI / (1 - payout) * 100, 4)}\\%$.`, 'roe', gI / (1 - payout) * 100);
    return withCalc(Q('L2.gordon', 2, body, chooseParts(items, 1, 2)), k.steps);
  }
  throw new Error('L2_gordon: no valid draw');
}

/** Changing the retention ratio: value rises only if ROE exceeds the cost of equity. */
export function L2_retention(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co();
    const E = rstep(1, 10, 0.25), roe0 = rstep(0.07, 0.16, 0.005), b0 = rstep(0.3, 0.6, 0.05), b1 = +(b0 + rstep(0.1, 0.3, 0.05)).toFixed(2);
    if (b1 > 0.85) continue;
    const ke = chance(0.4) ? roe0 : rstep(0.07, 0.14, 0.005);
    const g0 = b0 * roe0;
    if (ke - g0 < 0.02) continue;
    const Pr = E * (1 - b0) * (1 + g0) / (ke - g0);
    const scen = pick(['same', 'higher', 'lower'] as const);
    const roe1 = scen === 'same' ? roe0 : scen === 'higher' ? roe0 + rstep(0.01, 0.04, 0.005) : roe0 - rstep(0.01, 0.04, 0.005);
    if (roe1 < 0.03) continue;
    const gFirst = b0 * roe1, gNew = b1 * roe1;
    if (ke - gNew < 0.008) continue;
    const Pnew = E * (1 + gFirst) * (1 - b1) / (ke - gNew);
    const rel = Math.abs(Pnew / Pr - 1) < 0.005 ? 2 : Pnew > Pr ? 0 : 1;
    const roeText = scen === 'same' ? `continues to earn ${P(roe1, 1)} on equity` : `will earn ${P(roe1, 1)} on equity from now on`;
    const body = p_(`${name} has a return on equity of ${P(roe0, 1)}. It has just reported earnings per share of ${eur(E)} and has always retained ${P(b0, 0)} of its earnings. Its shares trade at ${eur(Pr)}, consistent with the constant-growth model.`) +
      p_(`Management announces that from now on it will retain ${P(b1, 0)} of earnings. Next year’s earnings still reflect the old reinvestment policy; growth after that reflects the new one. Assume the firm ${roeText} and that the cost of equity does not change.`);
    const items: Item[] = [
      { part: N('What growth rate is implied by the old policy?', g0 * 100, 'pct', { key: 'g0' }), w: 0.5 },
      { part: N('What cost of equity is implied by the current share price?', ke * 100, 'pct', { key: 'ke' }), must: true },
      { part: N('What is the growth rate of dividends under the new policy?', gNew * 100, 'pct', { key: 'gNew' }), w: 0.6 },
      { part: N('What is the share price under the new policy?', Pnew, 'eur', { key: 'Pnew' }), must: true },
      { part: C('Compared with today, the share price', ['Rises', 'Falls', 'Stays the same'], rel, 'rel'), w: 0.6 },
    ];
    const D1 = E * (1 + g0) * (1 - b0), E1 = E * (1 + gFirst), D1n = E1 * (1 - b1);
    const k = calc();
    k.r(`**Old growth:** $g_0 = b_0 \\times ROE = ${tn(b0)} \\times ${tn(roe0, 4)} = ${tn(g0, 6)}$, i.e. $${tn(g0 * 100, 4)}\\%$.`, 'g0', g0 * 100);
    k.s(`**Next year’s dividend under the old policy:** $D_1 = E_0(1 + g_0)(1 - b_0) = ${tn(E)} \\times ${tn(1 + g0, 6)} \\times ${tn(1 - b0)} = ${tn(D1, 4)}$.`);
    k.r(`**Implied cost of equity:** $k_e = \\frac{D_1}{P_0} + g_0 = \\frac{${tn(D1, 4)}}{${tn(Pr, 4)}} + ${tn(g0, 6)} = ${tn(D1 / Pr, 6)} + ${tn(g0, 6)} = ${tn(ke, 6)}$, i.e. $${tn(ke * 100, 4)}\\%$.`, 'ke', ke * 100);
    k.s(`**Next year’s earnings** (still the old retention, ROE ${tn(roe1 * 100, 2)}%): $E_1 = E_0(1 + b_0 \\cdot ROE) = ${tn(E)} \\times (1 + ${tn(b0)} \\times ${tn(roe1, 4)}) = ${tn(E)} \\times ${tn(1 + gFirst, 6)} = ${tn(E1, 4)}$.`);
    k.r(`**New growth:** $g_1 = b_1 \\times ROE = ${tn(b1)} \\times ${tn(roe1, 4)} = ${tn(gNew, 6)}$, i.e. $${tn(gNew * 100, 4)}\\%$.`, 'gNew', gNew * 100);
    k.s(`**New dividend:** $D_1' = E_1(1 - b_1) = ${tn(E1, 4)} \\times ${tn(1 - b1)} = ${tn(D1n, 4)}$.`);
    k.r(`**New price:** $P' = \\frac{D_1'}{k_e - g_1} = \\frac{${tn(D1n, 4)}}{${tn(ke, 6)} - ${tn(gNew, 6)}} = \\frac{${tn(D1n, 4)}}{${tn(ke - gNew, 6)}} = ${tn(Pnew, 4)}$ (€).`, 'Pnew', Pnew);
    k.r(`**Comparison:** new price ${tn(Pnew, 2)} against today ${tn(Pr, 2)}: the price ${['rises', 'falls', 'stays the same'][rel]} (ROE ${tn(roe1 * 100, 2)}% ${roe1 > ke + 1e-9 ? '>' : roe1 < ke - 1e-9 ? '<' : '='} cost of equity ${tn(ke * 100, 2)}%).`, 'rel');
    return withCalc(Q('L2.retention', 2, body, chooseParts(items, 3, 5)), k.steps);
  }
  throw new Error('L2_retention: no valid draw');
}

/** Two-stage dividend discount model. */
export function L2_twoStage(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), n = rint(3, 7);
    const D0 = rstep(0.5, 4, 0.05), gs = rstep(0.06, 0.2, 0.005), gl = rstep(0.015, 0.04, 0.0025), ke = rstep(0.07, 0.13, 0.0025);
    if (ke - gl < 0.025 || Math.abs(gs - ke) < 0.003) continue;
    const useEps = chance(0.35);
    const divs = Array.from({ length: n }, (_, i) => D0 * Math.pow(1 + gs, i + 1));
    const pv1 = divs.reduce((s, d, i) => s + pv(d, ke, i + 1), 0);
    let Dn1: number, body: string, epsMd = '';
    if (useEps) {
      const pay0 = rstep(0.2, 0.4, 0.05), roeL = rstep(0.08, 0.14, 0.005), payL = 1 - gl / roeL;
      if (payL <= pay0) continue;
      const E0 = D0 / pay0, En1 = E0 * Math.pow(1 + gs, n) * (1 + gl);
      Dn1 = En1 * payL;
      epsMd = `**Dividend in year ${n + 1}:** earnings today $E_0 = \\frac{${tn(D0)}}{${tn(pay0)}} = ${tn(E0, 4)}$; then $E_{${n + 1}} = E_0(1 + g_S)^{${n}}(1 + g_L) = ${tn(E0, 4)} \\times ${tn(Math.pow(1 + gs, n), 6)} \\times ${tn(1 + gl, 4)} = ${tn(En1, 4)}$. Mature payout $1 - \\frac{g_L}{ROE} = 1 - \\frac{${tn(gl, 4)}}{${tn(roeL, 4)}} = ${tn(payL, 6)}$, so $D_{${n + 1}} = ${tn(En1, 4)} \\times ${tn(payL, 6)} = ${tn(Dn1, 4)}$ (€).`;
      body = p_(`${name} has just reported earnings of ${eur(E0)} per share and paid out ${P(pay0, 0)} of them as dividends (${eur(D0)}). Earnings and dividends are expected to grow at ${P(gs, 1)} for the next ${n} years. From year ${n + 1} the firm becomes mature: growth falls to ${P(gl, 2)} forever and, with a return on equity of ${P(roeL, 1)}, the payout ratio rises to the level that supports this growth. The cost of equity is ${P(ke, 2)}. ${ROUND_NOTE}`);
    } else {
      Dn1 = divs[n - 1] * (1 + gl);
      body = p_(`${name} has just paid a dividend of ${eur(D0)} per share. Dividends are expected to grow at ${P(gs, 1)} per year for the next ${n} years and at ${P(gl, 2)} per year forever after that. The cost of equity is ${P(ke, 2)}. ${ROUND_NOTE}`);
    }
    const Pn = Dn1 / (ke - gl), pvTv = pv(Pn, ke, n);
    const items: Item[] = [
      { part: N(`What is the dividend in year ${n}?`, divs[n - 1], 'eur', { key: 'Dn' }), w: 0.35 },
      { part: N(`What is the present value of the dividends in years 1–${n}?`, pv1, 'eur', { key: 'pv1' }), w: 0.7 },
      { part: N(`What is the dividend in year ${n + 1}?`, Dn1, 'eur', { key: 'Dn1' }), w: useEps ? 0.8 : 0.4 },
      { part: N(`What is the value of the share at the end of year ${n}?`, Pn, 'eur', { key: 'Pn' }), w: 0.6 },
      { part: N('What is the value of the share today?', pv1 + pvTv, 'eur', { key: 'V' }), must: true },
    ];
    const k = calc();
    divs.forEach((d, i) => {
      const t = i + 1, md = `**Year ${t}:** $D_{${t}} = ${tn(D0)} \\times ${tn(1 + gs, 4)}^{${t}} = ${tn(D0)} \\times ${tn(Math.pow(1 + gs, t), 6)} = ${tn(d, 4)}$; discounted $\\frac{${tn(d, 4)}}{${tn(1 + ke, 4)}^{${t}}} = \\frac{${tn(d, 4)}}{${tn(Math.pow(1 + ke, t), 6)}} = ${tn(pv(d, ke, t), 4)}$.`;
      if (t === n) k.r(md, 'Dn', d); else k.s(md);
    });
    k.r(`**PV of the dividends in years 1–${n}:** $${divs.map((d, i) => tn(pv(d, ke, i + 1), 4)).join(' + ')} = ${tn(pv1, 4)}$ (€).`, 'pv1', pv1);
    k.r(useEps ? epsMd : `**Dividend in year ${n + 1}:** $D_{${n + 1}} = D_{${n}}(1 + g_L) = ${tn(divs[n - 1], 4)} \\times ${tn(1 + gl, 4)} = ${tn(Dn1, 4)}$ (€).`, 'Dn1', Dn1);
    k.r(`**Share value at the end of year ${n}:** $P_{${n}} = \\frac{D_{${n + 1}}}{k_e - g_L} = \\frac{${tn(Dn1, 4)}}{${tn(ke, 4)} - ${tn(gl, 4)}} = \\frac{${tn(Dn1, 4)}}{${tn(ke - gl, 4)}} = ${tn(Pn, 4)}$ (€).`, 'Pn', Pn);
    k.s(`**Its present value:** $\\frac{${tn(Pn, 4)}}{${tn(1 + ke, 4)}^{${n}}} = \\frac{${tn(Pn, 4)}}{${tn(Math.pow(1 + ke, n), 6)}} = ${tn(pvTv, 4)}$.`);
    k.r(`**Value today:** $${tn(pv1, 4)} + ${tn(pvTv, 4)} = ${tn(pv1 + pvTv, 4)}$ (€).`, 'V', pv1 + pvTv);
    return withCalc(Q('L2.twoStage', 2, body, chooseParts(items, 3, 5)), k.steps);
  }
  throw new Error('L2_twoStage: no valid draw');
}

/** H-model: growth declines linearly from the high to the stable rate. */
export function L2_hModel(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co();
    const D0 = rstep(0.5, 5, 0.05), gS = rstep(0.06, 0.18, 0.005), gL = rstep(0.015, 0.04, 0.0025), ke = rstep(0.07, 0.13, 0.0025);
    const T = pick([4, 6, 8, 10, 12, 14]), H = T / 2;
    if (ke - gL < 0.025) continue;
    const stable = D0 * (1 + gL) / (ke - gL), extra = D0 * H * (gS - gL) / (ke - gL);
    const body = p_(`${name} has just paid a dividend of ${eur(D0)}. Dividend growth is currently ${P(gS, 1)} and is expected to decline linearly over the next ${T} years to a stable ${P(gL, 2)}, where it remains forever. The cost of equity is ${P(ke, 2)}.`);
    const items: Item[] = [
      { part: N('What is H in the H-model?', H, 'x', { key: 'H' }), w: 0.4 },
      { part: N('What would the share be worth if dividends grew at the stable rate from today?', stable, 'eur', { key: 'stable' }), w: 0.55 },
      { part: N('What value does the period of above-normal growth add?', extra, 'eur', { key: 'extra' }), w: 0.5 },
      { part: N('What is the value of the share according to the H-model?', stable + extra, 'eur', { key: 'V' }), must: true },
    ];
    const k = calc();
    k.r(`**H:** half the length of the decline, $H = \\frac{${T}}{2} = ${H}$.`, 'H', H);
    k.r(`**Stable part:** $\\frac{D_0(1 + g_L)}{k_e - g_L} = \\frac{${tn(D0)} \\times ${tn(1 + gL, 4)}}{${tn(ke, 4)} - ${tn(gL, 4)}} = \\frac{${tn(D0 * (1 + gL), 4)}}{${tn(ke - gL, 4)}} = ${tn(stable, 4)}$ (€).`, 'stable', stable);
    k.r(`**Extra growth:** $\\frac{D_0 \\cdot H \\cdot (g_S - g_L)}{k_e - g_L} = \\frac{${tn(D0)} \\times ${H} \\times (${tn(gS, 4)} - ${tn(gL, 4)})}{${tn(ke - gL, 4)}} = \\frac{${tn(D0 * H * (gS - gL), 6)}}{${tn(ke - gL, 4)}} = ${tn(extra, 4)}$ (€).`, 'extra', extra);
    k.r(`**H-model value:** $${tn(stable, 4)} + ${tn(extra, 4)} = ${tn(stable + extra, 4)}$ (€).`, 'V', stable + extra);
    return withCalc(Q('L2.hModel', 2, body, chooseParts(items, 2, 4)), k.steps);
  }
  throw new Error('L2_hModel: no valid draw');
}

/** Free cash flow to the firm and to equity from accounting data. */
export function L2_fcf(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), M = mk();
    const t = pick([0.2, 0.21, 0.25, 0.25, 0.27, 0.28, 0.3, 0.32]);
    const ebit = rstep(80, 2000, 10), da = roundTo(ebit * rstep(0.1, 0.4, 0.01), 1);
    const capex = roundTo(da * rstep(0.8, 2.2, 0.05), 1), dnwc = roundTo(ebit * rstep(-0.05, 0.15, 0.01), 1);
    const intr = roundTo(ebit * rstep(0.05, 0.3, 0.01), 1), dD = roundTo(ebit * rstep(-0.2, 0.25, 0.01), 1);
    const nopat = ebit * (1 - t), fcff = nopat + da - capex - dnwc;
    const fcfe = fcff - intr * (1 - t) + dD;
    const ni = (ebit - intr) * (1 - t);
    if (Math.abs(fcff) < 5) continue;
    const yr = rint(2025, 2028);
    const showNI = chance(0.35);
    const rows = [
      ['EBIT', fmtNum(ebit)], ['Interest expense', fmtNum(intr)],
      ...(showNI ? [['Net income', fmtNum(ni)]] : []),
      ['Depreciation and amortisation', fmtNum(da)], ['Capital expenditure', fmtNum(capex)],
      ['Increase in net working capital', fmtNum(dnwc)], ['Net new borrowing (repayment negative)', fmtNum(dD)],
    ];
    const body = p_(`Selected figures for ${name} for ${yr} (€ million). The marginal tax rate is ${P(t, 0)}; assume interest is fully deductible.`) + table(['', String(yr)], rows, 'narrow');
    const items: Item[] = [
      { part: N('What is NOPAT, EBIT × (1 − t)?', nopat, 'm', { key: 'nopat' }), w: 0.5 },
      { part: N('What is the free cash flow to the firm (FCFF)?', fcff, 'm', { key: 'fcff' }), must: true },
      { part: N('What is the after-tax interest expense?', intr * (1 - t), 'm', { key: 'ati' }), w: 0.3 },
      { part: N('What is the free cash flow to equity (FCFE)?', fcfe, 'm', { key: 'fcfe' }), must: true },
      { part: N('What is net capital expenditure (capital expenditure minus depreciation)?', capex - da, 'm', { key: 'netcap' }), w: 0.3 },
    ];
    const k = calc();
    k.r(`**NOPAT:** $EBIT(1 - t) = ${tn(ebit)} \\times (1 - ${tn(t)}) = ${tn(ebit)} \\times ${tn(1 - t)} = ${tn(nopat, 4)}$ (€ million).`, 'nopat', nopat);
    k.r(`**FCFF:** NOPAT + D&A − CapEx − ΔNWC $= ${tn(nopat, 4)} + ${tn(da)} - ${tn(capex)} - ${tq(dnwc)} = ${tn(fcff, 4)}$ (€ million).`, 'fcff', fcff);
    k.r(`**After-tax interest:** $${tn(intr)} \\times ${tn(1 - t)} = ${tn(intr * (1 - t), 4)}$ (€ million).`, 'ati', intr * (1 - t));
    k.r(`**FCFE:** FCFF − after-tax interest + net borrowing $= ${tn(fcff, 4)} - ${tn(intr * (1 - t), 4)} + ${tq(dD)} = ${tn(fcfe, 4)}$ (€ million).`, 'fcfe', fcfe);
    k.r(`**Net capital expenditure:** $${tn(capex)} - ${tn(da)} = ${tn(capex - da)}$ (€ million).`, 'netcap', capex - da);
    return withCalc(Q('L2.fcf', 2, body, chooseParts(items, 2, 4)), k.steps);
  }
  throw new Error('L2_fcf: no valid draw');
}

/** FCFF valuation: explicit forecast, terminal value, bridge to equity. */
export function L2_dcf(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), M = mk();
    const T = rint(3, 6), f0 = rstep(50, 900, 5), g1 = rstep(0.03, 0.12, 0.005), g = rstep(0.015, 0.035, 0.0025), w = rstep(0.065, 0.11, 0.0025);
    if (w - g < 0.03) continue;
    const f = Array.from({ length: T }, (_, i) => f0 * Math.pow(1 + g1, i + 1));
    const pvE = f.reduce((s, x, i) => s + pv(x, w, i + 1), 0);
    const tv = f[T - 1] * (1 + g) / (w - g), pvTv = pv(tv, w, T), Vf = pvE + pvTv;
    const debt = roundTo(Vf * rstep(0.1, 0.5, 0.01), 5), cash = roundTo(Vf * rstep(0.01, 0.12, 0.01), 5);
    const shares = rstep(10, 400, 5), E = Vf - debt + cash, vps = E / shares;
    const price = roundTo(vps * rstep(0.75, 1.25, 0.01), 0.01);
    if (E <= 0 || Math.abs(price / vps - 1) < 0.03) continue;
    const body = p_(`${name} generated free cash flow to the firm of ${M(f0)} last year. FCFF is expected to grow at ${P(g1, 1)} per year for the next ${T} years and at ${P(g, 2)} per year forever after that. The WACC is ${P(w, 2)} and is expected to stay constant. ${name} has debt with a market value of ${M(debt)}, cash of ${M(cash)} and ${fmtNum(shares)} million shares trading at ${eur(price)}. ${ROUND_NOTE}`);
    const items: Item[] = [
      { part: N('What is the expected FCFF in year 1?', f[0], 'm', { key: 'f1' }), w: 0.35 },
      { part: N(`What is the present value of the FCFF in years 1–${T}?`, pvE, 'm', { key: 'pvE' }), w: 0.7 },
      { part: N(`What is the terminal value at the end of year ${T}?`, tv, 'm', { key: 'tv' }), w: 0.6 },
      { part: N('What is the present value of the terminal value?', pvTv, 'm', { key: 'pvTv' }), w: 0.45 },
      { part: N('What is the value of the firm?', Vf, 'm', { key: 'Vf' }), must: true },
      { part: N('What is the value of the equity?', E, 'm', { key: 'E' }), w: 0.7 },
      { part: N('What is the value per share?', vps, 'eur', { key: 'vps' }), w: 0.6 },
      { part: N('What percentage of the firm value comes from the terminal value?', pvTv / Vf * 100, 'pct', { key: 'tvShare' }), w: 0.3 },
      { part: C('Your recommendation based on this value:', ['Buy', 'Sell'], vps > price ? 0 : 1, 'rec'), w: 0.3 },
    ];
    const k = calc(), fac = (t: number) => Math.pow(1 + w, t);
    f.forEach((x, i) => {
      const t = i + 1, md = `**Year ${t}:** $FCFF_{${t}} = ${tn(f0)} \\times ${tn(1 + g1, 4)}^{${t}} = ${tn(f0)} \\times ${tn(Math.pow(1 + g1, t), 6)} = ${tn(x, 4)}$; discounted $\\frac{${tn(x, 4)}}{${tn(1 + w, 4)}^{${t}}} = \\frac{${tn(x, 4)}}{${tn(fac(t), 6)}} = ${tn(pv(x, w, t), 4)}$.`;
      if (t === 1) k.r(md, 'f1', x); else k.s(md);
    });
    k.r(`**PV of the forecast:** $${f.map((x, i) => tn(pv(x, w, i + 1), 4)).join(' + ')} = ${tn(pvE, 4)}$ (€ million).`, 'pvE', pvE);
    k.r(`**Terminal value:** $TV_{${T}} = \\frac{FCFF_{${T}}(1 + g)}{WACC - g} = \\frac{${tn(f[T - 1], 4)} \\times ${tn(1 + g, 4)}}{${tn(w, 4)} - ${tn(g, 4)}} = \\frac{${tn(f[T - 1] * (1 + g), 4)}}{${tn(w - g, 4)}} = ${tn(tv, 4)}$ (€ million).`, 'tv', tv);
    k.r(`**PV of the terminal value:** $\\frac{${tn(tv, 4)}}{${tn(fac(T), 6)}} = ${tn(pvTv, 4)}$ (€ million).`, 'pvTv', pvTv);
    k.r(`**Firm value:** $${tn(pvE, 4)} + ${tn(pvTv, 4)} = ${tn(Vf, 4)}$ (€ million).`, 'Vf', Vf);
    k.r(`**Equity:** firm value − debt + cash $= ${tn(Vf, 4)} - ${tn(debt)} + ${tn(cash)} = ${tn(E, 4)}$ (€ million).`, 'E', E);
    k.r(`**Value per share:** $\\frac{${tn(E, 4)}}{${tn(shares, 0)}} = ${tn(vps, 4)}$ (€).`, 'vps', vps);
    k.r(`**Terminal-value share:** $\\frac{${tn(pvTv, 4)}}{${tn(Vf, 4)}} = ${tn(pvTv / Vf, 6)}$, i.e. $${tn(pvTv / Vf * 100, 2)}\\%$.`, 'tvShare', pvTv / Vf * 100);
    k.r(`**Recommendation:** value ${eur(vps)} ${vps > price ? '>' : '<'} price ${eur(price)}, so ${vps > price ? 'buy' : 'sell'}.`, 'rec');
    return withCalc(Q('L2.dcf', 2, body, chooseParts(items, 3, 5)), k.steps);
  }
  throw new Error('L2_dcf: no valid draw');
}

/** FCFE valuation discounted at the cost of equity. */
export function L2_fcfe(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), M = mk();
    const T = rint(2, 5), f1 = rstep(20, 500, 5), g1 = rstep(0.03, 0.15, 0.005), g = rstep(0.015, 0.035, 0.0025), ke = rstep(0.08, 0.14, 0.0025);
    if (ke - g < 0.035) continue;
    const f = Array.from({ length: T }, (_, i) => f1 * Math.pow(1 + g1, i));
    const pvE = f.reduce((s, x, i) => s + pv(x, ke, i + 1), 0);
    const tv = f[T - 1] * (1 + g) / (ke - g), pvTv = pv(tv, ke, T), E = pvE + pvTv;
    const shares = rstep(10, 300, 5);
    const body = p_(`${name} keeps its debt-equity ratio stable. Next year it expects free cash flow to equity of ${M(f1)}; FCFE then grows at ${P(g1, 1)} per year until year ${T}, and at ${P(g, 2)} per year forever after year ${T}. The cost of equity is ${P(ke, 2)} and there are ${fmtNum(shares)} million shares outstanding. ${ROUND_NOTE}`);
    const items: Item[] = [
      { part: N(`What is the FCFE in year ${T}?`, f[T - 1], 'm', { key: 'fT' }), w: 0.35 },
      { part: N(`What is the present value of the FCFE in years 1–${T}?`, pvE, 'm', { key: 'pvE' }), w: 0.6 },
      { part: N(`What is the terminal value of equity at the end of year ${T}?`, tv, 'm', { key: 'tv' }), w: 0.6 },
      { part: N('What is the value of the equity today?', E, 'm', { key: 'E' }), must: true },
      { part: N('What is the value per share?', E / shares, 'eur', { key: 'vps' }), w: 0.7 },
    ];
    const k = calc(), fac = (t: number) => Math.pow(1 + ke, t);
    f.forEach((x, i) => {
      const t = i + 1;
      const grow = t === 1 ? `$FCFE_1 = ${tn(x, 4)}$ (given)` : `$FCFE_{${t}} = ${tn(f1)} \\times ${tn(1 + g1, 4)}^{${t - 1}} = ${tn(f1)} \\times ${tn(Math.pow(1 + g1, t - 1), 6)} = ${tn(x, 4)}$`;
      const md = `**Year ${t}:** ${grow}; discounted $\\frac{${tn(x, 4)}}{${tn(1 + ke, 4)}^{${t}}} = \\frac{${tn(x, 4)}}{${tn(fac(t), 6)}} = ${tn(pv(x, ke, t), 4)}$.`;
      if (t === T) k.r(md, 'fT', x); else k.s(md);
    });
    k.r(`**PV of the forecast:** $${f.map((x, i) => tn(pv(x, ke, i + 1), 4)).join(' + ')} = ${tn(pvE, 4)}$ (€ million).`, 'pvE', pvE);
    k.r(`**Terminal value:** $TV_{${T}} = \\frac{FCFE_{${T}}(1 + g)}{k_e - g} = \\frac{${tn(f[T - 1], 4)} \\times ${tn(1 + g, 4)}}{${tn(ke, 4)} - ${tn(g, 4)}} = \\frac{${tn(f[T - 1] * (1 + g), 4)}}{${tn(ke - g, 4)}} = ${tn(tv, 4)}$ (€ million).`, 'tv', tv);
    k.s(`**PV of the terminal value:** $\\frac{${tn(tv, 4)}}{${tn(fac(T), 6)}} = ${tn(pvTv, 4)}$.`);
    k.r(`**Equity value:** $${tn(pvE, 4)} + ${tn(pvTv, 4)} = ${tn(E, 4)}$ (€ million).`, 'E', E);
    k.r(`**Value per share:** $\\frac{${tn(E, 4)}}{${tn(shares, 0)}} = ${tn(E / shares, 4)}$ (€).`, 'vps', E / shares);
    return withCalc(Q('L2.fcfe', 2, body, chooseParts(items, 3, 4)), k.steps);
  }
  throw new Error('L2_fcfe: no valid draw');
}

/** FCFF valuation with a rising tax rate, reversal of deferred taxes and preferred stock (as in class 2, Q3). */
export function L2_deferred(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), M = mk();
    const n = rint(3, 6), k = pick([5, 8, 10, 10]);
    const ebit0 = rstep(100, 800, 10), capex0 = roundTo(ebit0 * rstep(0.1, 0.3, 0.01), 1), da0 = roundTo(capex0 * rstep(0.15, 0.6, 0.05), 1), nwc0 = roundTo(ebit0 * rstep(0.05, 0.2, 0.01), 1);
    const g1 = rstep(0.06, 0.15, 0.005), g2 = rstep(0.02, 0.05, 0.005), wacc = rstep(0.1, 0.17, 0.005);
    const te = pick([0.2, 0.22, 0.25, 0.28, 0.3]), tm = te + pick([0.05, 0.08, 0.1, 0.12]);
    const dtl0 = roundTo(ebit0 * rstep(0.5, 1.5, 0.05), 5), debt = roundTo(ebit0 * rstep(0.6, 1.4, 0.05), 1);
    const prefDiv = roundTo(ebit0 * rstep(0.05, 0.15, 0.01), 1), kp = rstep(0.08, 0.14, 0.005);
    if (wacc - g2 < 0.05) continue;
    const grow = (x: number, t: number) => t <= n ? x * Math.pow(1 + g1, t) : x * Math.pow(1 + g1, n) * Math.pow(1 + g2, t - n);
    const fcff = (t: number) => grow(ebit0, t) * (1 - (t <= n ? te : tm)) + grow(da0, t) - grow(capex0, t) - grow(nwc0, t);
    const pvE = Array.from({ length: n }, (_, i) => pv(fcff(i + 1), wacc, i + 1)).reduce((a, b) => a + b, 0);
    const pvTv = fcff(n + 1) / (wacc - g2) / Math.pow(1 + wacc, n);
    if (fcff(1) <= 0 || fcff(n + 1) <= 0) continue;
    const sumEbit = Array.from({ length: n }, (_, i) => grow(ebit0, i + 1)).reduce((a, b) => a + b, 0);
    const dtlN = dtl0 + sumEbit * (tm - te), inst = dtlN / k, pvDt = annuity(inst, wacc, k) / Math.pow(1 + wacc, n);
    const Vf = pvE + pvTv - pvDt, pref = prefDiv / kp, E = Vf - debt - pref;
    if (E <= 0) continue;
    const body = p_(`${name} reported EBIT of ${M(ebit0)} last year, with capital expenditure of ${M(capex0)}, depreciation of ${M(da0)} and an increase in net working capital of ${M(nwc0)}. All four items are expected to grow at ${P(g1, 1)} per year for the next ${n} years and at ${P(g2, 1)} per year forever after that. The WACC is ${P(wacc, 1)}.`) +
      p_(`Thanks to accelerated tax depreciation, ${name} pays an effective tax rate of ${P(te, 0)} for the next ${n} years; afterwards it pays its marginal rate of ${P(tm, 0)}. Its balance sheet shows a deferred tax liability of ${M(dtl0)}, which grows each year by EBIT × (${P(tm, 0)} − ${P(te, 0)}) until year ${n}. The deferred tax liability at the end of year ${n} is paid in ${k} equal annual instalments in years ${n + 1}–${n + k}.`) +
      p_(`${name} has debt of ${M(debt)} and preferred stock paying a fixed annual dividend of ${M(prefDiv)}, with a required return of ${P(kp, 1)}. ${ROUND_NOTE}`);
    const items: Item[] = [
      { part: N('What is the FCFF in year 1?', fcff(1), 'm', { key: 'f1' }), w: 0.45 },
      { part: N(`What is the FCFF in year ${n + 1}?`, fcff(n + 1), 'm', { key: 'fn1' }), w: 0.45 },
      { part: N(`What is the present value of the FCFF in years 1–${n}?`, pvE, 'm', { key: 'pvE' }), w: 0.5 },
      { part: N('What is the present value of the terminal value?', pvTv, 'm', { key: 'pvTv' }), w: 0.5 },
      { part: N(`What is the deferred tax liability at the end of year ${n}?`, dtlN, 'm', { key: 'dtl' }), w: 0.55 },
      { part: N('What is the present value today of the deferred tax payments?', pvDt, 'm', { key: 'pvDt' }), w: 0.5 },
      { part: N('What is the value of the firm?', Vf, 'm', { key: 'Vf' }), must: true },
      { part: N('What is the value of the preferred stock?', pref, 'm', { key: 'pref' }), w: 0.4 },
      { part: N('What is the value of the common equity?', E, 'm', { key: 'E' }), w: 0.7 },
    ];
    const kc = calc(), fac = (t: number) => Math.pow(1 + wacc, t);
    const line = (t: number) => {
      const tax = t <= n ? te : tm, gf = t <= n ? `${tn(1 + g1, 4)}^{${t}} = ${tn(Math.pow(1 + g1, t), 6)}` : `${tn(1 + g1, 4)}^{${n}} \\times ${tn(1 + g2, 4)}^{${t - n}} = ${tn(Math.pow(1 + g1, n) * Math.pow(1 + g2, t - n), 6)}`;
      return `**Year ${t}:** growth factor $${gf}$; EBIT $${tn(grow(ebit0, t), 4)}$, D&A $${tn(grow(da0, t), 4)}$, CapEx $${tn(grow(capex0, t), 4)}$, ΔNWC $${tn(grow(nwc0, t), 4)}$; $FCFF_{${t}} = ${tn(grow(ebit0, t), 4)} \\times (1 - ${tn(tax)}) + ${tn(grow(da0, t), 4)} - ${tn(grow(capex0, t), 4)} - ${tn(grow(nwc0, t), 4)} = ${tn(fcff(t), 4)}$; discounted $\\frac{${tn(fcff(t), 4)}}{${tn(fac(t), 6)}} = ${tn(pv(fcff(t), wacc, t), 4)}$.`;
    };
    for (let t = 1; t <= n; t++) { if (t === 1) kc.r(line(t), 'f1', fcff(1)); else kc.s(line(t)); }
    kc.r(`**PV of years 1–${n}:** $${Array.from({ length: n }, (_, i) => tn(pv(fcff(i + 1), wacc, i + 1), 4)).join(' + ')} = ${tn(pvE, 4)}$ (€ million).`, 'pvE', pvE);
    kc.r(`**Year ${n + 1}** (marginal tax ${tn(tm * 100, 0)}%, growth ${tn(g2 * 100, 1)}%): EBIT $${tn(grow(ebit0, n + 1), 4)}$, D&A $${tn(grow(da0, n + 1), 4)}$, CapEx $${tn(grow(capex0, n + 1), 4)}$, ΔNWC $${tn(grow(nwc0, n + 1), 4)}$; $FCFF_{${n + 1}} = ${tn(grow(ebit0, n + 1), 4)} \\times ${tn(1 - tm)} + ${tn(grow(da0, n + 1), 4)} - ${tn(grow(capex0, n + 1), 4)} - ${tn(grow(nwc0, n + 1), 4)} = ${tn(fcff(n + 1), 4)}$.`, 'fn1', fcff(n + 1));
    kc.r(`**PV of the terminal value:** $\\frac{FCFF_{${n + 1}}}{WACC - g_2} = \\frac{${tn(fcff(n + 1), 4)}}{${tn(wacc - g2, 4)}} = ${tn(fcff(n + 1) / (wacc - g2), 4)}$ at year ${n}; today $\\frac{${tn(fcff(n + 1) / (wacc - g2), 4)}}{${tn(fac(n), 6)}} = ${tn(pvTv, 4)}$ (€ million).`, 'pvTv', pvTv);
    kc.r(`**Deferred tax liability at year ${n}:** $DTL_0 + (t_m - t_e)\\sum EBIT = ${tn(dtl0)} + ${tn(tm - te)} \\times ${tn(sumEbit, 4)} = ${tn(dtlN, 4)}$ (€ million).`, 'dtl', dtlN);
    kc.r(`**PV of the deferred tax payments:** instalment $\\frac{${tn(dtlN, 4)}}{${k}} = ${tn(inst, 4)}$; annuity at year ${n}: $\\frac{${tn(inst, 4)}}{${tn(wacc, 4)}}\\left(1 - \\frac{1}{${tn(1 + wacc, 4)}^{${k}}}\\right) = \\frac{${tn(inst, 4)}}{${tn(wacc, 4)}} \\times ${tn(1 - 1 / Math.pow(1 + wacc, k), 6)} = ${tn(annuity(inst, wacc, k), 4)}$; today $\\frac{${tn(annuity(inst, wacc, k), 4)}}{${tn(fac(n), 6)}} = ${tn(pvDt, 4)}$ (€ million).`, 'pvDt', pvDt);
    kc.r(`**Firm value:** $${tn(pvE, 4)} + ${tn(pvTv, 4)} - ${tn(pvDt, 4)} = ${tn(Vf, 4)}$ (€ million).`, 'Vf', Vf);
    kc.r(`**Preferred stock:** perpetuity $\\frac{${tn(prefDiv)}}{${tn(kp, 4)}} = ${tn(pref, 4)}$ (€ million).`, 'pref', pref);
    kc.r(`**Common equity:** $${tn(Vf, 4)} - ${tn(debt)} - ${tn(pref, 4)} = ${tn(E, 4)}$ (€ million).`, 'E', E);
    return withCalc(Q('L2.deferred', 2, body, chooseParts(items, 3, 5)), kc.steps);
  }
  throw new Error('L2_deferred: no valid draw');
}
