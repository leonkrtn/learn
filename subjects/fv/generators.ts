// Firm Valuation: procedural generators for lectures 1 and 2.
// Every question draws a new fictional firm and new numbers; solutions are computed from the same inputs.
import { C, N, P, Q, chance, chooseParts, co, eur, fmtNum, mk, p_, pick, poss, rint, roundTo, rstep, table, v, type Item } from '@/lib/engine/gen-helpers';
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
      { part: N(`What is the present value of the cash flows in years 1–${n}?`, pvExp, 'm'), w: 0.7 },
      { part: N(`What is the value at the end of year ${n} of all cash flows after year ${n} (terminal value)?`, tv, 'm'), w: 0.6 },
      { part: N('What is the present value of the terminal value?', pvTv, 'm'), w: 0.5 },
      { part: N(v('What is the intrinsic value of the equity today?', 'What is the value of the equity according to the DCF?'), V, 'm'), must: true },
      { part: N('What is the intrinsic value per share?', vps, 'eur'), w: 0.8 },
      { part: C('Compared with this value, the shares are', ['Undervalued', 'Overvalued'], price < vps ? 0 : 1), w: 0.6 },
      { part: N('What share of the value comes from the terminal value?', pvTv / V * 100, 'pct'), w: 0.3 },
    ];
    return Q('L1.pv', 1, body, chooseParts(items, 3, 5));
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
    const items: Item[] = [
      { part: N('What is the market capitalisation (market value of equity)?', mcap, 'm'), must: true },
      { part: N('What is the net debt?', debt - cash, 'm'), w: 0.6 },
      { part: N(v('What is the enterprise (firm) value implied by the market?', 'What is the market value of the whole business, debt plus equity, net of cash?'), mcap + debt - cash, 'm'), must: true },
      { part: N('What fraction of the enterprise value is financed by net debt?', (debt - cash) / (mcap + debt - cash) * 100, 'pct'), w: 0.35 },
    ];
    return Q('L1.bridge', 1, body, chooseParts(items, 2, 4));
  }
  const pref = chance(0.45) ? roundTo(mcap * rstep(0.03, 0.15, 0.01), 5) : 0;
  const mino = chance(0.35) ? roundTo(mcap * rstep(0.02, 0.1, 0.01), 5) : 0;
  const Vf = roundTo((mcap + debt - cash + pref + mino) * rstep(0.75, 1.3, 0.01), 5);
  const E = Vf - debt + cash - pref - mino, vps = E / shares;
  const extras = [pref ? `preferred stock worth ${M(pref)}` : '', mino ? `minority interests of ${M(mino)}` : ''].filter(Boolean);
  const body = p_(`A DCF of ${poss(name)} free cash flows to the firm gives an enterprise value of ${M(Vf)}. The firm has debt with a market value of ${M(debt)}, cash of ${M(cash)}${extras.length ? ', ' + extras.join(' and ') : ''}. There are ${fmtNum(shares)} million shares outstanding, trading at ${eur(price)}.`);
  const items: Item[] = [
    { part: N('What is the value of the common equity?', E, 'm'), must: true },
    { part: N('What is the value per share?', vps, 'eur'), w: 0.8 },
    { part: N('By how much does the value per share exceed the share price? (Enter a shortfall as a negative number.)', (vps / price - 1) * 100, 'pct'), w: 0.5 },
    { part: C('Based on this valuation, the shares are', ['Undervalued', 'Overvalued'], vps > price ? 0 : 1), w: 0.5 },
  ];
  return Q('L1.bridge', 1, body, chooseParts(items, 2, 4));
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
    { part: N('What is the normal (expected) return of the stock on day 0?', (alpha + beta * rm[2]) * 100, 'pct'), w: 0.4 },
    { part: N('What is the abnormal return on day 0?', ar[2] * 100, 'pct'), must: true },
    { part: N('What is the cumulative abnormal return CAR(−2, +2)?', car(-2, 2) * 100, 'pct'), w: 0.7 },
    { part: N('What is the cumulative abnormal return CAR(0, +2)?', car(0, 2) * 100, 'pct'), w: 0.5 },
    { part: N('What is the abnormal return on day +1?', ar[3] * 100, 'pct'), w: 0.3 },
  ];
  return Q('L1.event', 1, body, chooseParts(items, 3, 4));
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
      const items: Item[] = [
        { part: N('What is the expected dividend next year?', D1, 'eur'), w: 0.6 },
        { part: N('What is the value of one share?', V, 'eur'), must: true },
        { part: N('What is the expected dividend yield for the coming year at this value?', D1 / V * 100, 'pct'), w: 0.35 },
      ];
      if (ke - g - 0.01 > 0.01) items.push({ part: N('What would the share be worth if growth were one percentage point higher?', D0 * (1 + g + 0.01) / (ke - g - 0.01), 'eur'), w: 0.35 });
      return Q('L2.gordon', 2, body, chooseParts(items, 2, 4));
    }
    if (vr === 1) {
      const E0 = rstep(1, 10, 0.05), payout = rstep(0.3, 0.8, 0.05), roe = rstep(0.06, 0.18, 0.005);
      const g = (1 - payout) * roe;
      if (ke - g < 0.015) continue;
      const D1 = E0 * payout * (1 + g), V = D1 / (ke - g);
      const body = p_(`${name} earned ${eur(E0)} per share last year and pays out ${P(payout, 0)} of its earnings as dividends. It earns a return on equity of ${P(roe, 1)} on reinvested earnings, which it expects to keep forever. Investors require ${P(ke, 2)}.`);
      const items: Item[] = [
        { part: N('What is the sustainable growth rate of dividends?', g * 100, 'pct'), must: true },
        { part: N('What is next year’s dividend per share?', D1, 'eur'), w: 0.6 },
        { part: N('What is the value per share?', V, 'eur'), must: true },
        { part: N('What is the implied forward P/E (value divided by next year’s earnings)?', V / (E0 * (1 + g)), 'x'), w: 0.3 },
      ];
      return Q('L2.gordon', 2, body, chooseParts(items, 2, 4));
    }
    if (vr === 2) {
      const D0 = rstep(0.5, 5, 0.05), g = rstep(0.01, 0.05, 0.0025);
      if (ke - g < 0.015) continue;
      const Pr = roundTo(D0 * (1 + g) / (ke - g), 0.01), keI = D0 * (1 + g) / Pr + g;
      const body = p_(`${poss(name)} shares trade at ${eur(Pr)}. The company has just paid a dividend of ${eur(D0)}, and the market expects dividends to grow at ${P(g, 2)} per year indefinitely.`);
      const items: Item[] = [
        { part: N('What is the expected dividend next year?', D0 * (1 + g), 'eur'), w: 0.5 },
        { part: N('What cost of equity is implied by the share price?', keI * 100, 'pct'), must: true },
        { part: N('Which part of that return is the expected dividend yield?', D0 * (1 + g) / Pr * 100, 'pct'), w: 0.5 },
      ];
      return Q('L2.gordon', 2, body, chooseParts(items, 2, 3));
    }
    const D1 = rstep(0.5, 6, 0.05), g = rstep(0.01, 0.05, 0.0025);
    if (ke - g < 0.015) continue;
    const Pr = roundTo(D1 / (ke - g), 0.01), gI = ke - D1 / Pr;
    const payout = rstep(0.3, 0.7, 0.05);
    const body = p_(`${name} is expected to pay a dividend of ${eur(D1)} per share next year. Its shares trade at ${eur(Pr)} and its cost of equity is ${P(ke, 2)}. The company pays out ${P(payout, 0)} of its earnings.`);
    const items: Item[] = [
      { part: N('What perpetual dividend growth rate is the market pricing in?', gI * 100, 'pct'), must: true },
      { part: N('What return on equity on reinvested earnings would sustain that growth?', gI / (1 - payout) * 100, 'pct'), w: 0.6 },
    ];
    return Q('L2.gordon', 2, body, chooseParts(items, 1, 2));
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
      { part: N('What growth rate is implied by the old policy?', g0 * 100, 'pct'), w: 0.5 },
      { part: N('What cost of equity is implied by the current share price?', ke * 100, 'pct'), must: true },
      { part: N('What is the growth rate of dividends under the new policy?', gNew * 100, 'pct'), w: 0.6 },
      { part: N('What is the share price under the new policy?', Pnew, 'eur'), must: true },
      { part: C('Compared with today, the share price', ['Rises', 'Falls', 'Stays the same'], rel), w: 0.6 },
    ];
    return Q('L2.retention', 2, body, chooseParts(items, 3, 5));
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
    let Dn1: number, body: string;
    if (useEps) {
      const pay0 = rstep(0.2, 0.4, 0.05), roeL = rstep(0.08, 0.14, 0.005), payL = 1 - gl / roeL;
      if (payL <= pay0) continue;
      const E0 = D0 / pay0, En1 = E0 * Math.pow(1 + gs, n) * (1 + gl);
      Dn1 = En1 * payL;
      body = p_(`${name} has just reported earnings of ${eur(E0)} per share and paid out ${P(pay0, 0)} of them as dividends (${eur(D0)}). Earnings and dividends are expected to grow at ${P(gs, 1)} for the next ${n} years. From year ${n + 1} the firm becomes mature: growth falls to ${P(gl, 2)} forever and, with a return on equity of ${P(roeL, 1)}, the payout ratio rises to the level that supports this growth. The cost of equity is ${P(ke, 2)}. ${ROUND_NOTE}`);
    } else {
      Dn1 = divs[n - 1] * (1 + gl);
      body = p_(`${name} has just paid a dividend of ${eur(D0)} per share. Dividends are expected to grow at ${P(gs, 1)} per year for the next ${n} years and at ${P(gl, 2)} per year forever after that. The cost of equity is ${P(ke, 2)}. ${ROUND_NOTE}`);
    }
    const Pn = Dn1 / (ke - gl), pvTv = pv(Pn, ke, n);
    const items: Item[] = [
      { part: N(`What is the dividend in year ${n}?`, divs[n - 1], 'eur'), w: 0.35 },
      { part: N(`What is the present value of the dividends in years 1–${n}?`, pv1, 'eur'), w: 0.7 },
      { part: N(`What is the dividend in year ${n + 1}?`, Dn1, 'eur'), w: useEps ? 0.8 : 0.4 },
      { part: N(`What is the value of the share at the end of year ${n}?`, Pn, 'eur'), w: 0.6 },
      { part: N('What is the value of the share today?', pv1 + pvTv, 'eur'), must: true },
    ];
    return Q('L2.twoStage', 2, body, chooseParts(items, 3, 5));
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
      { part: N('What is H in the H-model?', H, 'x'), w: 0.4 },
      { part: N('What would the share be worth if dividends grew at the stable rate from today?', stable, 'eur'), w: 0.55 },
      { part: N('What value does the period of above-normal growth add?', extra, 'eur'), w: 0.5 },
      { part: N('What is the value of the share according to the H-model?', stable + extra, 'eur'), must: true },
    ];
    return Q('L2.hModel', 2, body, chooseParts(items, 2, 4));
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
      { part: N('What is NOPAT, EBIT × (1 − t)?', nopat, 'm'), w: 0.5 },
      { part: N('What is the free cash flow to the firm (FCFF)?', fcff, 'm'), must: true },
      { part: N('What is the after-tax interest expense?', intr * (1 - t), 'm'), w: 0.3 },
      { part: N('What is the free cash flow to equity (FCFE)?', fcfe, 'm'), must: true },
      { part: N('What is net capital expenditure (capital expenditure minus depreciation)?', capex - da, 'm'), w: 0.3 },
    ];
    return Q('L2.fcf', 2, body, chooseParts(items, 2, 4));
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
      { part: N('What is the expected FCFF in year 1?', f[0], 'm'), w: 0.35 },
      { part: N(`What is the present value of the FCFF in years 1–${T}?`, pvE, 'm'), w: 0.7 },
      { part: N(`What is the terminal value at the end of year ${T}?`, tv, 'm'), w: 0.6 },
      { part: N('What is the present value of the terminal value?', pvTv, 'm'), w: 0.45 },
      { part: N('What is the value of the firm?', Vf, 'm'), must: true },
      { part: N('What is the value of the equity?', E, 'm'), w: 0.7 },
      { part: N('What is the value per share?', vps, 'eur'), w: 0.6 },
      { part: N('What percentage of the firm value comes from the terminal value?', pvTv / Vf * 100, 'pct'), w: 0.3 },
      { part: C('Your recommendation based on this value:', ['Buy', 'Sell'], vps > price ? 0 : 1), w: 0.3 },
    ];
    return Q('L2.dcf', 2, body, chooseParts(items, 3, 5));
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
      { part: N(`What is the FCFE in year ${T}?`, f[T - 1], 'm'), w: 0.35 },
      { part: N(`What is the present value of the FCFE in years 1–${T}?`, pvE, 'm'), w: 0.6 },
      { part: N(`What is the terminal value of equity at the end of year ${T}?`, tv, 'm'), w: 0.6 },
      { part: N('What is the value of the equity today?', E, 'm'), must: true },
      { part: N('What is the value per share?', E / shares, 'eur'), w: 0.7 },
    ];
    return Q('L2.fcfe', 2, body, chooseParts(items, 3, 4));
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
      { part: N('What is the FCFF in year 1?', fcff(1), 'm'), w: 0.45 },
      { part: N(`What is the FCFF in year ${n + 1}?`, fcff(n + 1), 'm'), w: 0.45 },
      { part: N(`What is the present value of the FCFF in years 1–${n}?`, pvE, 'm'), w: 0.5 },
      { part: N('What is the present value of the terminal value?', pvTv, 'm'), w: 0.5 },
      { part: N(`What is the deferred tax liability at the end of year ${n}?`, dtlN, 'm'), w: 0.55 },
      { part: N('What is the present value today of the deferred tax payments?', pvDt, 'm'), w: 0.5 },
      { part: N('What is the value of the firm?', Vf, 'm'), must: true },
      { part: N('What is the value of the preferred stock?', pref, 'm'), w: 0.4 },
      { part: N('What is the value of the common equity?', E, 'm'), w: 0.7 },
    ];
    return Q('L2.deferred', 2, body, chooseParts(items, 3, 5));
  }
  throw new Error('L2_deferred: no valid draw');
}
