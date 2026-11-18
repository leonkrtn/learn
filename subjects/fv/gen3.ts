// Firm Valuation, lecture 3 — growth: historical averages, trend regressions, fundamental growth, market-size targets
// and revenue/margin paths. Every question draws new numbers; answers and steps come from the same inputs.
import { C, N, P, Q, calc, chance, chooseParts, co, eur, fmtNum, p_, pick, poss, rint, roundTo, rstep, table, tn, tp, tq, v, withCalc, type Item } from '@/lib/engine/gen-helpers';
import type { Question } from '@/lib/engine/types';
import { EUR, USD, anyCur, inM, perShareTag, sum, sumMd, type Cur } from './util';

const pc = (x: number, d = 2) => fmtNum(x * 100, d) + '%';

// =====================================================================
// Historical growth: arithmetic and geometric averages, variability
// =====================================================================

export function L3_hist(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), cur = anyCur();
    const item = pick(['revenue', 'EBITDA', 'EBIT'] as const);
    const y0 = rint(2018, 2021), base = rstep(80, 2400, 10);
    const vals = [base];
    for (let i = 0; i < 5; i++) vals.push(roundTo(vals[i] * (1 + rstep(-0.02, 0.14, 0.001)), 0.1));
    const g = vals.slice(1).map((x, i) => x / vals[i] - 1);
    if (g.some(x => Math.abs(x) < 0.003)) continue;
    const ar = sum(g) / 5, geo = Math.pow(vals[5] / vals[0], 1 / 5) - 1;
    const dev2 = g.map(x => Math.pow((x - ar) * 100, 2)), sd = Math.sqrt(sum(dev2) / 4);
    const next = vals[5] * (1 + geo);
    const k = rint(1, 5);
    const years = vals.map((_, i) => String(y0 + i));
    const body = p_(`${poss(name)} ${item} over the last six years${cur.tag}:`) +
      table(['Year', ...years], [[item[0].toUpperCase() + item.slice(1), ...vals.map(x => fmtNum(x, 1))]]) +
      p_('Enter growth rates in percent, e.g. 6.96 for 6.96%; give the standard deviation in percentage points.');
    const items: Item[] = [
      { part: N(`What was the growth rate in ${years[k]}?`, g[k - 1] * 100, 'pct', { key: 'gk' }), w: 0.35 },
      { part: N('What is the arithmetic average annual growth rate?', ar * 100, 'pct', { key: 'ar' }), must: true },
      { part: N(v('What is the geometric average annual growth rate (CAGR)?', 'What is the compounded annual growth rate from the first to the last year?'), geo * 100, 'pct', { key: 'geo' }), must: true },
      { part: N('What is the sample standard deviation of the annual growth rates?', sd, 'pct', { key: 'sd' }), w: 0.5 },
      { part: N(`What ${item} do you forecast for ${y0 + 6} if growth continues at the geometric average?`, next, cur.mUnit, { key: 'next' }), w: 0.45 },
    ];
    const c = calc();
    g.forEach((x, i) => {
      const md = `**Growth ${years[i + 1]}:** $\\frac{${tn(vals[i + 1])}}{${tn(vals[i])}} - 1 = ${tn(x * 100)}\\%$.`;
      if (i + 1 === k) c.r(md, 'gk', x * 100); else c.s(md);
    });
    c.r(`**Arithmetic average:** $\\bar g = \\frac{${g.map(x => tq(x * 100)).join(' + ')}}{5} = ${tn(ar * 100)}\\%$.`, 'ar', ar * 100);
    c.r(`**Geometric average:** $\\left(\\frac{${tn(vals[5])}}{${tn(vals[0])}}\\right)^{1/5} - 1 = ${tn(vals[5] / vals[0], 4)}^{0.2} - 1 = ${tn(geo * 100)}\\%$. It is below the arithmetic mean because growth varies.`, 'geo', geo * 100);
    c.s(`**Squared deviations from the mean** (percentage points): $${g.map((x, i) => `(${tn(x * 100)} - ${tn(ar * 100)})^2 = ${tn(dev2[i])}`).join(',\\; ')}$; sum $= ${tn(sum(dev2))}$.`);
    c.r(`**Standard deviation:** $\\sigma = \\sqrt{\\frac{${tn(sum(dev2))}}{5 - 1}} = ${tn(sd)}$ percentage points.`, 'sd', sd);
    c.r(`**Forecast:** $${tn(vals[5])} \\times (1 + ${tn(geo, 4)}) = ${tn(next)}$ ${inM(cur)}.`, 'next', next);
    return withCalc(Q('L3.hist', 3, body, chooseParts(items, 3, 4)), c.steps);
  }
  throw new Error('L3_hist: no valid draw');
}

// =====================================================================
// Trend regression for earnings that were negative
// =====================================================================

export function L3_trend(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co();
    const b = rstep(0.15, 0.9, 0.01), a = rstep(-1.6, 0.4, 0.05);
    const eps = Array.from({ length: 6 }, (_, i) => roundTo(a + b * (i + 1) + rstep(-0.25, 0.25, 0.01), 0.01));
    if (!eps.some(x => x < 0) || eps[5] <= 0.3) continue;
    const t = [1, 2, 3, 4, 5, 6], tb = 3.5, yb = sum(eps) / 6;
    if (yb < 0.4) continue;
    const sxy = sum(t.map((x, i) => (x - tb) * (eps[i] - yb))), sxx = 17.5, slope = sxy / sxx, g = slope / yb;
    const y0 = rint(2018, 2021);
    const body = p_(`${name} has reported the following earnings per share (€). Because some years were losses, year-on-year growth rates are meaningless, so you fit a linear trend EPS<sub>t</sub> = a + b × t with t = 1, …, 6.`) +
      table(['Year', ...t.map(x => String(y0 + x - 1))], [['t', ...t.map(String)], ['EPS (€)', ...eps.map(x => fmtNum(x, 2))]]);
    const items: Item[] = [
      { part: N('What is the average EPS over the six years?', yb, 'eur', { key: 'yb' }), w: 0.6 },
      { part: N('What is the slope b of the trend line (€ per year)?', slope, 'eur', { key: 'b' }), must: true },
      { part: N('What growth rate does the trend imply (b divided by average EPS)?', g * 100, 'pct', { key: 'g' }), must: true },
      { part: N(`What EPS does the trend line give for t = 7?`, a0(slope, yb) + slope * 7, 'eur', { key: 'f7' }), w: 0.35 },
    ];
    const c = calc();
    c.r(`**Average EPS:** $\\bar y = \\frac{${sumMd(eps)}}{6} = ${tn(yb)}$ (€); average $\\bar t = 3.5$.`, 'yb', yb);
    c.s(`**Cross products** $(t - \\bar t)(EPS_t - \\bar y)$: $${t.map((x, i) => `${tq(x - tb, 1)} \\times ${tq(eps[i] - yb)}`).join(' + ')} = ${tn(sxy)}$; $\\sum (t - \\bar t)^2 = 17.5$.`);
    c.r(`**Slope:** $b = \\frac{${tn(sxy)}}{17.5} = ${tn(slope)}$ (€ per year).`, 'b', slope);
    c.r(`**Implied growth:** $\\frac{b}{\\bar y} = \\frac{${tn(slope)}}{${tn(yb)}} = ${tn(g * 100)}\\%$.`, 'g', g * 100);
    c.r(`**Trend value for t = 7:** intercept $a = \\bar y - b\\,\\bar t = ${tn(yb)} - ${tn(slope)} \\times 3.5 = ${tq(a0(slope, yb))}$, so $${tq(a0(slope, yb))} + ${tn(slope)} \\times 7 = ${tn(a0(slope, yb) + 7 * slope)}$ (€).`, 'f7', a0(slope, yb) + 7 * slope);
    return withCalc(Q('L3.trend', 3, body, chooseParts(items, 2, 4)), c.steps);
  }
  throw new Error('L3_trend: no valid draw');
}
const a0 = (b: number, yb: number) => yb - b * 3.5;

// =====================================================================
// Fundamental growth: reinvestment rate × return on capital, retention × ROE
// =====================================================================

export function L3_fundamental(force?: 'accounts' | 'change' | 'equity'): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), cur = anyCur(), M = cur.M;
    const vr = force ?? pick(['accounts', 'accounts', 'change', 'equity'] as const);
    if (vr === 'equity') {
      const bve = rstep(200, 4000, 10), roe = rstep(0.06, 0.2, 0.001), ni = roundTo(bve * roe, 0.1), pay = rstep(0.2, 0.7, 0.05), div = roundTo(ni * pay, 0.1);
      const b = 1 - div / ni, ROE = ni / bve, g = b * ROE;
      const body = p_(`${name} reported net income of ${M(ni, 1)} and paid dividends of ${M(div, 1)}. The book value of equity at the start of the year was ${M(bve, 0)}. Assume the retention ratio and the return on equity stay constant.`);
      const items: Item[] = [
        { part: N('What is the retention ratio?', b * 100, 'pct', { key: 'b' }), must: true },
        { part: N('What is the return on equity?', ROE * 100, 'pct', { key: 'roe' }), must: true },
        { part: N('What is the expected growth rate of net income and dividends?', g * 100, 'pct', { key: 'g' }), must: true },
      ];
      const c = calc();
      c.r(`**Retention ratio:** $1 - \\frac{\\text{Dividends}}{\\text{Net income}} = 1 - \\frac{${tn(div)}}{${tn(ni)}} = ${tn(b * 100)}\\%$.`, 'b', b * 100);
      c.r(`**Return on equity:** $\\frac{\\text{Net income}}{BV\\ \\text{of equity}_{t-1}} = \\frac{${tn(ni)}}{${tn(bve)}} = ${tn(ROE * 100)}\\%$.`, 'roe', ROE * 100);
      c.r(`**Growth:** $g = b \\times ROE = ${tn(b, 4)} \\times ${tn(ROE, 4)} = ${tn(g * 100)}\\%$.`, 'g', g * 100);
      return withCalc(Q('L3.fundamental', 3, body, chooseParts(items, 3, 3)), c.steps);
    }
    const t = pick([0.2, 0.25, 0.25, 0.3, 0.35]);
    const ebit = rstep(60, 2500, 10), nopat = ebit * (1 - t);
    const rir = rstep(0.1, 0.7, 0.01), reinv = nopat * rir;
    const dowc = roundTo(reinv * rstep(0.1, 0.4, 0.01), 1), netcap = roundTo(reinv - dowc, 1);
    if (netcap <= 0) continue;
    const dep = roundTo(ebit * rstep(0.1, 0.5, 0.01), 1), capex = netcap + dep;
    const roc0 = rstep(0.06, 0.2, 0.001), ic = roundTo(nopat / roc0, 10);
    const debt = roundTo(ic * rstep(0.2, 0.5, 0.01), 10), cash = roundTo(ic * rstep(0.03, 0.15, 0.01), 10), bve = ic - debt + cash;
    const RIR = (netcap + dowc) / nopat, ROC = nopat / ic, g = RIR * ROC;
    if (vr === 'change') {
      const dRoc = rstep(0.01, 0.04, 0.005) * (chance(0.8) ? 1 : -1), roc1 = ROC + dRoc;
      if (roc1 < 0.04) continue;
      const g1 = RIR * roc1 + (roc1 - ROC) / ROC;
      const body = p_(`${name} earned after-tax operating income of ${M(nopat, 1)} last year on invested capital of ${M(ic, 0)}. It reported net capital expenditure of ${M(netcap, 0)} and an increase in operating working capital of ${M(dowc, 0)}. The reinvestment rate is expected to stay the same.`) +
        p_(`Next year, the return on capital is expected to ${dRoc > 0 ? 'rise' : 'fall'} by ${fmtNum(Math.abs(dRoc) * 100, 1)} percentage points, on new and existing capital.`);
      const items: Item[] = [
        { part: N('What is the current return on capital?', ROC * 100, 'pct', { key: 'roc' }), w: 0.7 },
        { part: N('What is the reinvestment rate?', RIR * 100, 'pct', { key: 'rir' }), w: 0.7 },
        { part: N('What growth in operating income would you expect if the return on capital stayed unchanged?', g * 100, 'pct', { key: 'g' }), must: true },
        { part: N('What growth in operating income do you expect next year, given the change in the return on capital?', g1 * 100, 'pct', { key: 'g1' }), must: true },
      ];
      const c = calc();
      c.r(`**Return on capital:** $ROC = \\frac{EBIT(1 - t)}{\\text{Invested capital}} = \\frac{${tn(nopat)}}{${tn(ic)}} = ${tn(ROC * 100)}\\%$.`, 'roc', ROC * 100);
      c.r(`**Reinvestment rate:** $\\frac{\\text{Net CapEx} + \\Delta OWC}{EBIT(1 - t)} = \\frac{${tn(netcap)} + ${tn(dowc)}}{${tn(nopat)}} = ${tn(RIR * 100)}\\%$.`, 'rir', RIR * 100);
      c.r(`**Growth at constant ROC:** $g = RIR \\times ROC = ${tn(RIR, 4)} \\times ${tn(ROC, 4)} = ${tn(g * 100)}\\%$.`, 'g', g * 100);
      c.r(`**Growth with changing ROC:** $g = RIR \\times ROC_t + \\frac{ROC_t - ROC_{t-1}}{ROC_{t-1}} = ${tn(RIR, 4)} \\times ${tn(roc1, 4)} + \\frac{${tn(roc1, 4)} - ${tn(ROC, 4)}}{${tn(ROC, 4)}} = ${tn(RIR * roc1 * 100)}\\% + ${tq((roc1 - ROC) / ROC * 100)}\\% = ${tn(g1 * 100)}\\%$. The second term is the efficiency gain on existing assets.`, 'g1', g1 * 100);
      return withCalc(Q('L3.fundamental', 3, body, chooseParts(items, 3, 4)), c.steps);
    }
    const givenIc = chance(0.4);
    const body = p_(`${name} earned EBIT of ${M(ebit, 0)} last year. It spent ${M(capex, 0)} on capital expenditure, recorded depreciation of ${M(dep, 0)}, and its operating working capital rose by ${M(dowc, 0)}. ` +
      (givenIc ? `Its invested capital at the start of the year was ${M(ic, 0)}.` : `At the start of the year, its book value of equity was ${M(bve, 0)}, its book value of debt ${M(debt, 0)} and it held ${M(cash, 0)} of cash.`) +
      ` The tax rate is ${P(t, 0)}. Assume the return on capital and the reinvestment rate stay unchanged.`);
    const items: Item[] = [
      { part: N('What is the after-tax operating income, EBIT × (1 − t)?', nopat, cur.mUnit, { key: 'nopat' }), w: 0.3 },
      { part: N('What is the reinvestment rate?', RIR * 100, 'pct', { key: 'rir' }), w: 0.7 },
      { part: N('What is the return on capital?', ROC * 100, 'pct', { key: 'roc' }), w: 0.7 },
      { part: N('What is the expected growth rate of EBIT?', g * 100, 'pct', { key: 'g' }), must: true },
    ];
    const c = calc();
    c.r(`**After-tax operating income:** $${tn(ebit)} \\times (1 - ${tn(t)}) = ${tn(nopat)}$ ${inM(cur)}.`, 'nopat', nopat);
    c.r(`**Reinvestment rate:** net CapEx $= ${tn(capex)} - ${tn(dep)} = ${tn(netcap)}$; $RIR = \\frac{${tn(netcap)} + ${tn(dowc)}}{${tn(nopat)}} = ${tn(RIR * 100)}\\%$.`, 'rir', RIR * 100);
    c.r(givenIc ? `**Return on capital:** $\\frac{${tn(nopat)}}{${tn(ic)}} = ${tn(ROC * 100)}\\%$.`
      : `**Return on capital:** invested capital $= BV_E + BV_D - \\text{Cash} = ${tn(bve)} + ${tn(debt)} - ${tn(cash)} = ${tn(ic)}$; $ROC = \\frac{${tn(nopat)}}{${tn(ic)}} = ${tn(ROC * 100)}\\%$.`, 'roc', ROC * 100);
    c.r(`**Expected growth:** $g = RIR \\times ROC = ${tn(RIR, 4)} \\times ${tn(ROC, 4)} = ${tn(g * 100)}\\%$.`, 'g', g * 100);
    return withCalc(Q('L3.fundamental', 3, body, chooseParts(items, 2, 4)), c.steps);
  }
  throw new Error('L3_fundamental: no valid draw');
}

// =====================================================================
// Growth from a market-size and market-share target
// =====================================================================

export function L3_market(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(['Software', 'Games', 'Robotics', 'Biotech', 'Media']), cur = pick([USD, EUR]), M = cur.M;
    const mkt = rstep(0.8, 12, 0.1) * 1000, r0 = roundTo(mkt * rstep(0.003, 0.03, 0.0005), 0.5), gm = rstep(0.02, 0.1, 0.005), n = pick([5, 6, 8, 10, 10]), s = rstep(0.03, 0.15, 0.005);
    const mN = mkt * Math.pow(1 + gm, n), rN = mN * s, cagr = Math.pow(rN / r0, 1 / n) - 1;
    if (cagr < 0.05 || cagr > 0.8) continue;
    const body = p_(`${name} is a small firm that reported revenues of ${M(r0, 1)} last year. Total revenues of its market were ${M(mkt, 0)} and are expected to grow at ${P(gm, 1)} per year. You expect ${name} to capture ${P(s, 1)} of the market in ${n} years.`);
    const items: Item[] = [
      { part: N(`What is today’s market share of ${name}?`, r0 / mkt * 100, 'pct', { key: 'share0' }), w: 0.3 },
      { part: N(`What will total market revenues be in ${n} years?`, mN, cur.mUnit, { key: 'mN' }), w: 0.5 },
      { part: N(`What revenues do you expect for ${name} in ${n} years?`, rN, cur.mUnit, { key: 'rN' }), must: true },
      { part: N('What compounded annual revenue growth rate does this imply?', cagr * 100, 'pct', { key: 'cagr' }), must: true },
    ];
    const c = calc();
    c.r(`**Market share today:** $\\frac{${tn(r0)}}{${tn(mkt)}} = ${tn(r0 / mkt * 100)}\\%$.`, 'share0', r0 / mkt * 100);
    c.r(`**Market in ${n} years:** $${tn(mkt)} \\times (1 + ${tp(gm)})^{${n}} = ${tn(mkt)} \\times ${tn(Math.pow(1 + gm, n), 4)} = ${tn(mN)}$ ${inM(cur)}.`, 'mN', mN);
    c.r(`**Target revenue:** $${tn(mN)} \\times ${tn(s, 4)} = ${tn(rN)}$ ${inM(cur)}.`, 'rN', rN);
    c.r(`**CAGR:** $\\left(\\frac{${tn(rN)}}{${tn(r0)}}\\right)^{1/${n}} - 1 = ${tn(rN / r0, 4)}^{${tn(1 / n, 4)}} - 1 = ${tn(cagr * 100)}\\%$.`, 'cagr', cagr * 100);
    return withCalc(Q('L3.market', 3, body, chooseParts(items, 2, 4)), c.steps);
  }
  throw new Error('L3_market: no valid draw');
}

// =====================================================================
// Revenue growth path and a converging operating margin
// =====================================================================

export function revenuePath(r0: number, gs: number[]) {
  const rev = [r0];
  gs.forEach(g => rev.push(rev[rev.length - 1] * (1 + g)));
  return rev;
}

export function L3_margin(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(['Online', 'Digital', 'Streaming', 'Commerce', 'Labs']), cur = pick([USD, EUR]), M = cur.M;
    const r0 = rstep(40, 1500, 10), m0 = rstep(-0.15, -0.01, 0.01), m5 = rstep(0.06, 0.2, 0.01);
    const g1 = rstep(0.4, 1, 0.05), gs = [g1, g1 * 0.75, g1 * 0.5, g1 * 0.3, g1 * 0.3].map(x => roundTo(x, 0.05));
    if (gs.some(x => x <= 0)) continue;
    const geom = chance(0.3);
    const rev = revenuePath(r0, gs);
    const e0 = 1 - m0, e5 = 1 - m5, ge = Math.pow(e5 / e0, 1 / 5) - 1;
    const marg = rev.map((_, k) => geom ? 1 - e0 * Math.pow(1 + ge, k) : m0 + k * (m5 - m0) / 5);
    const ebit = rev.map((r, k) => r * marg[k]);
    const j = rint(1, 4);
    const body = p_(`${name} reported an operating ${m0 < 0 ? 'loss' : 'profit'} of ${M(Math.abs(r0 * m0), 1)} on revenues of ${M(r0, 0)} last year. You expect revenue growth of ${gs.map((x, i) => `${P(x, 0)} in year ${i + 1}`).join(', ')}. ` +
      (geom ? `Operating expenses (all costs before EBIT, as a share of revenue) are expected to fall at a constant annual rate so that the pre-tax operating margin reaches ${P(m5, 0)} in year 5.`
        : `The pre-tax operating margin is expected to improve by equal steps each year to ${P(m5, 0)} in year 5.`));
    const items: Item[] = [
      { part: N(`What are revenues in year ${j}?`, rev[j], cur.mUnit, { key: 'rj' }), w: 0.5 },
      { part: N(`What is the operating margin in year ${j}?`, marg[j] * 100, 'pct', { key: 'mj' }), w: 0.6 },
      { part: N(`What is operating income (EBIT) in year ${j}? (Enter a loss as a negative number.)`, ebit[j], cur.mUnit, { key: 'ej' }), must: true },
      { part: N('What are revenues in year 5?', rev[5], cur.mUnit, { key: 'r5' }), w: 0.4 },
      { part: N('What is operating income in year 5?', ebit[5], cur.mUnit, { key: 'e5' }), w: 0.6 },
    ];
    const c = calc();
    c.s(`**Starting margin:** $\\frac{${tq(r0 * m0)}}{${tn(r0)}} = ${tn(m0 * 100)}\\%$.`);
    c.s(geom
      ? `**Cost ratio path:** operating expenses are $1 - m$ of revenue: $${tn(e0, 4)}$ today and $${tn(e5, 4)}$ in year 5; $${tn(e5, 4)} = ${tn(e0, 4)}(1 + g)^5$ gives $g = \\left(\\frac{${tn(e5, 4)}}{${tn(e0, 4)}}\\right)^{1/5} - 1 = ${tn(ge * 100)}\\%$ per year.`
      : `**Margin step:** $\\frac{${tn(m5 * 100)}\\% - (${tn(m0 * 100)}\\%)}{5} = ${tn((m5 - m0) / 5 * 100)}$ percentage points per year.`);
    for (let k = 1; k <= 5; k++) {
      const rmd = `$${tn(rev[k - 1])} \\times ${tn(1 + gs[k - 1])} = ${tn(rev[k])}$`;
      const mmd = geom ? `$1 - ${tn(e0, 4)} \\times (1 + ${tp(ge)})^{${k}} = ${tn(marg[k] * 100)}\\%$` : `$${tn(m0 * 100)}\\% + ${k} \\times ${tn((m5 - m0) / 5 * 100)}\\% = ${tn(marg[k] * 100)}\\%$`;
      const emd = `$${tn(rev[k])} \\times ${tq(marg[k], 4)} = ${tn(ebit[k])}$`;
      if (k === j) {
        c.r(`**Year ${k} revenue:** ${rmd} ${inM(cur)}.`, 'rj', rev[k]);
        c.r(`**Year ${k} margin:** ${mmd}.`, 'mj', marg[k] * 100);
        c.r(`**Year ${k} EBIT:** ${emd} ${inM(cur)}.`, 'ej', ebit[k]);
      } else if (k === 5) {
        c.r(`**Year 5 revenue:** ${rmd} ${inM(cur)}.`, 'r5', rev[5]);
        c.r(`**Year 5 EBIT:** margin ${mmd}; ${emd} ${inM(cur)}.`, 'e5', ebit[5]);
      } else c.s(`**Year ${k}:** revenue ${rmd}, margin ${mmd}, EBIT ${emd}.`);
    }
    return withCalc(Q('L3.margin', 3, body, chooseParts(items, 3, 4)), c.steps);
  }
  throw new Error('L3_margin: no valid draw');
}

