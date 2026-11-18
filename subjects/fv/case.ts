// Firm Valuation — the valuation case of Part II of the exam, in three formats taken from the past papers:
//  - growth: revenue, EBIT and net CapEx grow for four years, working capital is a share of revenue (2021, 2023);
//  - accounts: four years of projected statements with inventory, receivables and payables (2024);
//  - apv: a perpetuity with a constant amount of debt, valued with the adjusted present value (2022).
// Each format ends with the bridge to equity (cash, holdings, minority interests, options, debt) and a per-share value.
import { N, P, Q, calc, chance, chooseParts, co, fmtNum, p_, pick, poss, rint, roundTo, rstep, table, tn, tp, tq, withCalc, type Item } from '@/lib/engine/gen-helpers';
import type { Part, Question } from '@/lib/engine/types';
import { EUR, JPY, USD, inM, perShareTag, pv, sum, type Cur } from './util';

const f2 = (x: number) => fmtNum(x, 2);
const pcs = (x: number, d = 2) => P(x, d);

export type Holding = 'pe' | 'pb' | 'mv' | 'none';
export type Minority = 'mv' | 'pb' | 'given' | 'none';
export type GrowthOpts = {
  cur?: Cur; terminal?: 'rr' | 'allGrow'; beta?: 'comps' | 'given'; rule?: 'notax' | 'hamada'; kdFrom?: 'given' | 'spread';
  holding?: Holding; minority?: Minority; options?: boolean; apv?: boolean; nParts?: [number, number]; must?: string[];
};

type Bridge = { md: string[]; items: Item[]; add: number; text: string };

/** Holdings, minority interests and options, with their text, parts and calculation steps. */
function bridgeExtras(cur: Cur, name: string, scale: number, holding: Holding, minority: Minority, options: boolean, shares: number, pbOverride?: number): Bridge {
  const M = cur.M, md: string[] = [], items: Item[] = [], txt: string[] = [];
  let add = 0;
  const pb = pbOverride ?? rstep(1.2, 3.5, 0.1);
  if (holding !== 'none') {
    const other = co(), pct = pick([0.15, 0.2, 0.25, 0.3, 0.35, 0.4]);
    let val = 0;
    if (holding === 'pe') {
      const earn = roundTo(scale * rstep(0.004, 0.02, 0.001), 0.5), pe = rint(7, 18);
      val = earn * pe;
      txt.push(`It holds ${pcs(pct, 0)} of ${other}; this year it recognised earnings of ${M(earn, 1)} from ${other}. Firms in the same segment as ${other} trade at a P/E of ${pe}x.`);
      md.push(`**Minority holding in ${other}:** recognised earnings × sector P/E $= ${tn(earn)} \\times ${pe} = ${tn(val)}$ ${inM(cur)}.`);
    } else if (holding === 'pb') {
      const bv = roundTo(scale * rstep(0.005, 0.03, 0.001), 1);
      val = bv * pb;
      txt.push(`It owns ${pcs(pct, 0)} of ${other}, reported as a minority holding (investment in affiliates) with a book value of ${M(bv, 0)}. The price-to-book multiple of the industry is ${fmtNum(pb, 1)}x.`);
      md.push(`**Minority holding in ${other}:** book value × P/B $= ${tn(bv)} \\times ${tn(pb)} = ${tn(val)}$ ${inM(cur)}.`);
    } else {
      const mv = roundTo(scale * rstep(0.03, 0.15, 0.005), 10);
      val = mv * pct;
      txt.push(`It owns ${pcs(pct, 0)} of ${other}, whose equity has a market value of ${M(mv, 0)}.`);
      md.push(`**Minority holding in ${other}:** $${tn(pct)} \\times ${tn(mv)} = ${tn(val)}$ ${inM(cur)}.`);
    }
    add += val;
    items.push({ part: N(`What value do you assign to the holding in ${other}?`, val, cur.mUnit, { key: 'hold' }), w: 0.45 });
  }
  if (minority !== 'none') {
    const sub = co(), own = pick([0.6, 0.7, 0.75, 0.8, 0.9]);
    let val = 0;
    if (minority === 'mv') {
      const mv = roundTo(scale * rstep(0.05, 0.2, 0.005), 10);
      val = (1 - own) * mv;
      txt.push(`It owns ${pcs(own, 0)} of ${sub}, which it fully consolidates; the market value of ${poss(sub)} equity is ${M(mv, 0)}.`);
      md.push(`**Minority interests in ${sub}:** the outside shareholders own $1 - ${tn(own)}$: $${tn(1 - own)} \\times ${tn(mv)} = ${tn(val)}$ ${inM(cur)}.`);
    } else if (minority === 'pb') {
      const bv = roundTo(scale * rstep(0.004, 0.02, 0.001), 1);
      val = bv * pb;
      txt.push(`It owns ${pcs(own, 0)} of ${sub} and fully consolidates it; the book value of minority interests in the consolidated balance sheet is ${M(bv, 0)}.${holding === 'pb' ? '' : ` The price-to-book multiple of the industry is ${fmtNum(pb, 1)}x.`}`);
      md.push(`**Minority interests:** book value × P/B $= ${tn(bv)} \\times ${tn(pb)} = ${tn(val)}$ ${inM(cur)}.`);
    } else {
      val = roundTo(scale * rstep(0.005, 0.03, 0.001), 1);
      txt.push(`The market value of minority interests in ${name} is ${M(val, 0)}.`);
      md.push(`**Minority interests:** given at market value, $${tn(val)}$ ${inM(cur)}.`);
    }
    add -= val;
    items.push({ part: N('What value of minority interests do you subtract?', val, cur.mUnit, { key: 'mi' }), w: 0.35 });
  }
  if (options) {
    const n = roundTo(shares * rstep(0.01, 0.08, 0.005), 0.5), ov = rstep(1, 12, 0.5);
    const val = n * ov;
    txt.push(`${name} has issued ${fmtNum(n, 1)} million stock options to its management; each is worth ${cur.S(ov)}.`);
    md.push(`**Management options:** $${tn(n)} \\times ${tn(ov)} = ${tn(val)}$ ${inM(cur)}, a claim on equity.`);
    add -= val;
    items.push({ part: N('What value of the management options do you subtract?', val, cur.mUnit, { key: 'opt' }), w: 0.25 });
  }
  return { md, items, add, text: txt.join(' ') };
}

// =====================================================================
// Format 1: growth assumptions and working capital as a share of revenue
// =====================================================================

export function caseGrowth(fam: string, topic: string, o: GrowthOpts = {}): Question {
  for (let att = 0; att < 3000; att++) {
    const cur = o.cur ?? pick([USD, EUR]), M = cur.M, name = co();
    const terminal = o.terminal ?? pick(['rr', 'allGrow'] as const), beta = o.beta ?? pick(['comps', 'comps', 'given'] as const);
    const rule = o.apv ? 'notax' : o.rule ?? pick(['notax', 'hamada'] as const), kdFrom = o.apv ? 'given' : o.kdFrom ?? pick(['given', 'spread'] as const);
    const rev0 = rstep(1, 20, 0.5) * 1000, margin = rstep(0.06, 0.16, 0.005), ebit0 = roundTo(rev0 * margin, 10), ncap0 = roundTo(ebit0 * rstep(0.12, 0.3, 0.01), 5);
    const inv = rstep(0.02, 0.1, 0.005), ar = rstep(0.05, 0.2, 0.005), ap = rstep(0.04, 0.18, 0.005), owcp = inv + ar - ap;
    if (owcp < 0.01) continue;
    const g1 = rstep(0.03, 0.08, 0.005), gL = rstep(0.015, 0.03, 0.0025), t = pick([0.2, 0.25, 0.25, 0.3]), rr = rstep(0.1, 0.3, 0.05);
    const rf = rstep(0.015, 0.04, 0.0025), mrp = rstep(0.05, 0.08, 0.0025), de = rstep(0.2, 0.6, 0.05);
    const fu = (x: number) => rule === 'hamada' ? 1 + (1 - t) * x : 1 + x;
    const blc = rstep(0.9, 1.8, 0.05), dec = rstep(0.2, 1, 0.05), bu = beta === 'comps' ? blc / fu(dec) : rstep(0.8, 1.3, 0.05);
    const bl = bu * fu(de), ke = rf + bl * mrp, spread = rstep(0.005, 0.025, 0.0025), kd = o.apv ? rf : kdFrom === 'spread' ? rf + spread : rf + rstep(0, 0.02, 0.0025);
    const wd = de / (1 + de), wacc = (1 - wd) * ke + wd * kd * (1 - t);
    if (wacc - gL < 0.03) continue;
    const yrs = [1, 2, 3, 4], gf = (k: number) => Math.pow(1 + g1, k);
    const ebit = [ebit0, ...yrs.map(k => ebit0 * gf(k))], ncap = [ncap0, ...yrs.map(k => ncap0 * gf(k))], rev = [rev0, ...yrs.map(k => rev0 * gf(k))];
    const owc = rev.map(r => r * owcp), dowc = [0, ...yrs.map(k => owc[k] - owc[k - 1])];
    const fcff = [0, ...yrs.map(k => ebit[k] * (1 - t) - ncap[k] - dowc[k])];
    const f5 = terminal === 'rr' ? ebit[4] * (1 + gL) * (1 - t) * (1 - rr) : fcff[4] * (1 + gL);
    if (fcff.slice(1).some(x => x <= 0) || f5 <= 0) continue;
    const df = (k: number) => Math.pow(1 + wacc, k), pvs = yrs.map(k => fcff[k] / df(k)), pvE = sum(pvs);
    const tv = f5 / (wacc - gL), pvTv = tv / df(4), ev = pvE + pvTv;
    const cash = roundTo(ev * rstep(0.02, 0.1, 0.005), 10), debt = roundTo(ev * wd * rstep(0.85, 1.15, 0.01), 5);
    const shares = roundTo(rstep(20, 400, 5), 5);
    const br = bridgeExtras(cur, name, ev, o.holding ?? pick(['pe', 'pb', 'mv', 'none']), o.minority ?? pick(['mv', 'given', 'pb', 'none']), o.options ?? chance(0.5), shares);
    const eq = ev + cash - debt + br.add, vps = eq / shares;
    if (eq <= 0) continue;

    const year0 = rint(2024, 2027);
    const growText = `Revenue, EBIT and net capital expenditure are expected to grow at ${pcs(g1, 1)} per year for the next 4 years. Inventory, trade receivables and trade payables are ${pcs(inv, 1)}, ${pcs(ar, 1)} and ${pcs(ap, 1)} of revenue and stay at these shares.`;
    const termText = terminal === 'rr' ? `After year 4, EBIT will grow at a constant ${pcs(gL, 2)} and the company will keep a reinvestment ratio of ${pcs(rr, 0)}.`
      : `After year 4, EBIT, net capital expenditure and the change in operating working capital will all grow at a constant ${pcs(gL, 2)}.`;
    const ruleText = rule === 'hamada' ? 'Use β<sub>L</sub> = β<sub>U</sub>[1 + (1 − t)D/E].' : 'Use β<sub>L</sub> = β<sub>U</sub>(1 + D/E) (debt rebalanced to a constant ratio).';
    const betaText = beta === 'comps' ? `Comparable firms with an average debt-to-equity ratio of ${f2(dec)} have an average equity beta of ${f2(blc)}.` : `Based on comparable firms, the beta of an all-equity company with similar operations is ${f2(bu)}.`;
    const kdText = kdFrom === 'spread' ? `Its credit rating corresponds to a default spread of ${pcs(spread, 2)} over the risk-free rate.` : `Its cost of debt is ${pcs(kd, 2)}.`;
    const body = p_(`It is the start of ${year0 + 1}. You are valuing ${name}. In ${year0} it reported revenue of ${M(rev0, 0)}, EBIT of ${M(ebit0, 0)} and net capital expenditure of ${M(ncap0, 0)}. ${growText} ${termText}`) +
      p_(`${betaText} ${name} will maintain a debt-to-equity ratio of ${f2(de)}. ${kdText} The market value of its debt is ${M(debt, 0)}. ${ruleText}`) +
      p_(`${name} holds ${M(cash, 0)} in excess cash. ${br.text} There are ${fmtNum(shares)} million shares outstanding.`) +
      p_(`The corporate tax rate is ${pcs(t, 0)}, the risk-free rate ${pcs(rf, 2)} and the market risk premium ${pcs(mrp, 2)}. Round only your final answers.`);

    const items: Item[] = [
      { part: N('What is the FCFF in year 1?', fcff[1], cur.mUnit, { key: 'f1' }), w: 0.5 },
      { part: N('What is the change in operating working capital in year 1?', dowc[1], cur.mUnit, { key: 'dowc1' }), w: 0.25 },
      ...(beta === 'comps' ? [{ part: N('What is the unlevered beta?', bu, 'n', { key: 'bu' }), w: 0.4 }] : []),
      { part: N(`What is the levered beta of ${name}?`, bl, 'n', { key: 'bl' }), w: 0.45 },
      { part: N('What is the cost of equity?', ke * 100, 'pct', { key: 'ke' }), w: 0.4 },
      { part: N('What is the WACC?', wacc * 100, 'pct', { key: 'wacc' }), w: 0.75, must: o.must?.includes('wacc') },
      { part: N('What is the present value of the FCFF in years 1–4?', pvE, cur.mUnit, { key: 'pvE' }), w: 0.45 },
      { part: N('What is the terminal value at the end of year 4?', tv, cur.mUnit, { key: 'tv' }), w: 0.45 },
      { part: N('What is the enterprise value (value of operating assets)?', ev, cur.mUnit, { key: 'ev' }), w: 0.7, must: o.must?.includes('ev') },
      ...br.items,
      { part: N('What is the value of equity?', eq, cur.mUnit, { key: 'eq' }), w: 0.6, must: o.must?.includes('eq') },
      { part: N(`What is the value per share${perShareTag(cur)}?`, vps, cur.sUnit, { key: 'vps' }), must: true },
    ];
    const c = calc();
    c.r(`**Year-1 working capital:** OWC is $${tn(inv * 100)}\\% + ${tn(ar * 100)}\\% - ${tn(ap * 100)}\\% = ${tn(owcp * 100)}\\%$ of revenue: $${tn(owc[0])}$ in year 0 and $${tn(rev[1])} \\times ${tn(owcp, 4)} = ${tn(owc[1])}$ in year 1, so $\\Delta OWC_1 = ${tn(dowc[1])}$ ${inM(cur)}.`, 'dowc1', dowc[1]);
    yrs.forEach(k => {
      const md = `**Year ${k}:** EBIT $${tn(ebit[k])}$, net CapEx $${tn(ncap[k])}$, $\\Delta OWC = ${tn(dowc[k])}$; $FCFF_{${k}} = ${tn(ebit[k])} \\times (1 - ${tn(t)}) - ${tn(ncap[k])} - ${tn(dowc[k])} = ${tn(fcff[k])}$.`;
      if (k === 1) c.r(md, 'f1', fcff[1]); else c.s(md);
    });
    if (beta === 'comps') c.r(rule === 'hamada' ? `**Unlevered beta:** $\\frac{${tn(blc)}}{1 + (1 - ${tn(t)}) \\times ${tn(dec)}} = ${tn(bu, 4)}$.` : `**Unlevered beta:** $\\frac{${tn(blc)}}{1 + ${tn(dec)}} = ${tn(bu, 4)}$.`, 'bu', bu);
    c.r(rule === 'hamada' ? `**Levered beta:** $${tn(bu, 4)} \\times [1 + (1 - ${tn(t)}) \\times ${tn(de)}] = ${tn(bl, 4)}$.` : `**Levered beta:** $${tn(bu, 4)} \\times (1 + ${tn(de)}) = ${tn(bl, 4)}$.`, 'bl', bl);
    c.r(`**Cost of equity:** $${tn(rf * 100)}\\% + ${tn(bl, 4)} \\times ${tn(mrp * 100)}\\% = ${tn(ke * 100)}\\%$.`, 'ke', ke * 100);
    c.r(`**WACC:** ${kdFrom === 'spread' ? `$k_d = ${tn(rf * 100)}\\% + ${tn(spread * 100)}\\% = ${tn(kd * 100)}\\%$; ` : ''}$\\frac{E}{V} = \\frac{1}{1 + ${tn(de)}} = ${tn(1 - wd, 4)}$; $WACC = ${tn(1 - wd, 4)} \\times ${tn(ke * 100)}\\% + ${tn(wd, 4)} \\times ${tn(kd * 100)}\\% \\times (1 - ${tn(t)}) = ${tn(wacc * 100)}\\%$.`, 'wacc', wacc * 100);
    c.r(`**PV of years 1–4:** $${yrs.map(k => `\\frac{${tn(fcff[k])}}{(1 + ${tp(wacc)})^{${k}}}`).join(' + ')} = ${pvs.map(x => tn(x)).join(' + ')} = ${tn(pvE)}$ ${inM(cur)}.`, 'pvE', pvE);
    c.r(terminal === 'rr'
      ? `**Terminal value:** $FCFF_5 = EBIT_4(1 + g)(1 - t)(1 - RR) = ${tn(ebit[4])} \\times (1 + ${tp(gL)}) \\times ${tn(1 - t)} \\times ${tn(1 - rr)} = ${tn(f5)}$; $TV_4 = \\frac{${tn(f5)}}{${tp(wacc)} - ${tp(gL)}} = ${tn(tv)}$ ${inM(cur)}.`
      : `**Terminal value:** $FCFF_5 = FCFF_4(1 + g) = ${tn(fcff[4])} \\times (1 + ${tp(gL)}) = ${tn(f5)}$; $TV_4 = \\frac{${tn(f5)}}{${tp(wacc)} - ${tp(gL)}} = ${tn(tv)}$ ${inM(cur)}.`, 'tv', tv);
    c.r(`**Enterprise value:** PV of the terminal value $\\frac{${tn(tv)}}{${tn(df(4), 4)}} = ${tn(pvTv)}$; $EV = ${tn(pvE)} + ${tn(pvTv)} = ${tn(ev)}$ ${inM(cur)}.`, 'ev', ev);
    br.md.forEach((m, i) => { const p = br.items[i].part as Part & { key: string; ans: number }; c.r(m, p.key, p.ans); });
    c.r(`**Equity:** $EV + \\text{cash} - \\text{debt}${br.add ? ' + \\text{holdings} - \\text{claims}' : ''} = ${tn(ev)} + ${tn(cash)} - ${tn(debt)}${br.add ? ' ' + (br.add < 0 ? '- ' + tn(-br.add) : '+ ' + tn(br.add)) : ''} = ${tn(eq)}$ ${inM(cur)}.`, 'eq', eq);
    c.r(`**Per share:** $\\frac{${tn(eq)}}{${tn(shares, 0)}} = ${tn(vps)}$.`, 'vps', vps);

    let parts = chooseParts(items, ...(o.nParts ?? [4, 6]));
    if (o.apv) {
      const rho = rf + bu * mrp, dfu = (k: number) => Math.pow(1 + rho, k);
      const tvU = f5 / (rho - gL), vu = sum(yrs.map(k => fcff[k] / dfu(k))) + tvU / dfu(4);
      // Debt at a constant share of levered value; the year-4 figure also holds the year-4 value of all later interest.
      const VL = [ev]; yrs.forEach(k => VL.push(VL[k - 1] * (1 + wacc) - fcff[k]));
      const VU = [vu]; yrs.forEach(k => VU.push(VU[k - 1] * (1 + rho) - fcff[k]));
      const intr = yrs.map(k => kd * wd * VL[k - 1]);
      intr[3] += (VL[4] - VU[4]) / t;
      const ts = intr.map(x => x * t), pvTs = sum(ts.map((x, i) => x / dfu(i + 1)));
      const body2 = body + p_(`<b>APV.</b> Assume the following interest expenses (${cur.sym} million). The year-4 figure also includes the value, as of the end of year 4, of the interest expenses of all later years. Discount the tax shields at the unlevered cost of capital.`) +
        table(['', 'Year 1', 'Year 2', 'Year 3', 'Year 4'], [['Interest expense', ...intr.map(x => fmtNum(x, 2))]]);
      const items2: Item[] = [
        { part: N('What is the unlevered cost of capital (cost of equity of the all-equity firm)?', rho * 100, 'pct', { key: 'rho' }), w: 0.6 },
        { part: N('What is the unlevered firm value?', vu, cur.mUnit, { key: 'vu' }), must: true },
        { part: N('What is the present value of the interest tax shields?', pvTs, cur.mUnit, { key: 'pvts' }), must: true },
        { part: N('What is the enterprise value with the APV method?', vu + pvTs, cur.mUnit, { key: 'apv' }), w: 0.6 },
        { part: N(`What is the value per share with the APV method${perShareTag(cur)}?`, (vu + pvTs + cash - debt + br.add) / shares, cur.sUnit, { key: 'vpsApv' }), w: 0.6 },
      ];
      c.r(`**Unlevered cost of capital:** $\\rho = r_f + \\beta_U \\times MRP = ${tn(rf * 100)}\\% + ${tn(bu, 4)} \\times ${tn(mrp * 100)}\\% = ${tn(rho * 100)}\\%$.`, 'rho', rho * 100);
      c.r(`**Unlevered value:** discount the same FCFF at $\\rho$: $${yrs.map(k => tn(fcff[k] / dfu(k))).join(' + ')} + \\frac{${tn(f5)} / (${tp(rho)} - ${tp(gL)})}{${tn(dfu(4), 4)}} = ${tn(vu)}$ ${inM(cur)}.`, 'vu', vu);
      c.r(`**Tax shields:** $t \\times$ interest $= ${ts.map(x => tn(x)).join(',\\ ')}$; discounted at $\\rho$: $${ts.map((x, i) => `\\frac{${tn(x)}}{${tn(dfu(i + 1), 4)}}`).join(' + ')} = ${tn(pvTs)}$ ${inM(cur)}.`, 'pvts', pvTs);
      c.r(`**APV:** $${tn(vu)} + ${tn(pvTs)} = ${tn(vu + pvTs)}$ ${inM(cur)}, the same as the WACC value.`, 'apv', vu + pvTs);
      c.r(`**Per share (APV):** $\\frac{${tn(vu + pvTs)} + ${tn(cash)} - ${tn(debt)}${br.add ? (br.add < 0 ? ' - ' + tn(-br.add) : ' + ' + tn(br.add)) : ''}}{${tn(shares, 0)}} = ${tn((vu + pvTs + cash - debt + br.add) / shares)}$.`, 'vpsApv', (vu + pvTs + cash - debt + br.add) / shares);
      parts = chooseParts(items2, 3, 4);
      return withCalc(Q(fam, topic, body2, parts), c.steps);
    }
    return withCalc(Q(fam, topic, body, parts), c.steps);
  }
  throw new Error('caseGrowth: no valid draw');
}

// =====================================================================
// Format 2: projected statements with working-capital accounts (2024)
// =====================================================================

export type AccountsOpts = { cur?: Cur; nParts?: [number, number]; combined?: boolean };

export function caseAccounts(fam: string, topic: string, o: AccountsOpts = {}): Question {
  for (let att = 0; att < 4000; att++) {
    const cur = o.cur ?? pick([JPY, USD, EUR]), M = cur.M, name = co(['Electronics', 'Instruments', 'Systems', 'Industries', 'Technologies']);
    const sc = cur === JPY ? 1000 : 1;
    const ebit0 = rstep(200, 4000, 10) * sc, gr = [rstep(0.03, 0.12, 0.01), rstep(0.05, 0.2, 0.01), rstep(0.03, 0.12, 0.01)], g4 = rstep(0.005, 0.025, 0.0005);
    const ebit = [ebit0]; gr.forEach(g => ebit.push(roundTo(ebit[ebit.length - 1] * (1 + g), 10 * sc / 10))); ebit.push(roundTo(ebit[3] * (1 + g4), 10 * sc / 10));
    const capexR = rstep(0.1, 0.2, 0.005), depR = capexR * rstep(0.7, 0.95, 0.01);
    const capex = ebit.map((e, i) => roundTo(e * (i < 3 ? capexR : capexR * 0.85), sc)), dep = ebit.map((e, i) => roundTo(e * (i < 3 ? depR : capexR * 0.85 * rstep(0.85, 0.98, 0.01)), sc));
    capex[4] = capex[3]; dep[4] = dep[3];
    const invR = rstep(0.03, 0.08, 0.005), arR = rstep(0.1, 0.2, 0.005), apR = rstep(0.05, 0.1, 0.005);
    const invA = ebit.map(e => roundTo(e * invR, sc)), arA = ebit.map(e => roundTo(e * arR, sc)), apA = ebit.map(e => roundTo(e * apR, sc));
    const nwc = ebit.map((_, i) => invA[i] + arA[i] - apA[i]);
    const t = pick([0.25, 0.25, 0.3, 0.21]);
    const fcff = [0, 1, 2, 3, 4].map(k => k === 0 ? 0 : ebit[k] * (1 - t) + dep[k] - capex[k] - (nwc[k] - nwc[k - 1]));
    const g = fcff[4] / fcff[3] - 1;
    if (fcff.slice(1).some(x => x <= 0) || g < 0.003 || g > 0.04) continue;
    const yld = rstep(0.02, 0.05, 0.001), cds = rstep(0.004, 0.02, 0.0005), rf = yld - cds;
    const beta = rstep(0.7, 1.3, 0.05), de0 = rstep(0.15, 0.4, 0.05), de1 = +(de0 + rstep(0.1, 0.3, 0.05)).toFixed(2), kd = rf + rstep(0.005, 0.025, 0.0025), mrp = rstep(0.05, 0.08, 0.0025);
    const bu = beta / (1 + de0), bl = bu * (1 + de1), ke = rf + bl * mrp, wd = de1 / (1 + de1), wacc = (1 - wd) * ke + wd * kd * (1 - t);
    if (wacc - g < 0.025) continue;
    const df = (k: number) => Math.pow(1 + wacc, k), pvs = [1, 2, 3, 4].map(k => fcff[k] / df(k)), pvE = sum(pvs);
    const tv = fcff[4] * (1 + g) / (wacc - g), pvTv = tv / df(4), ev = pvE + pvTv;
    const debt = roundTo(ev * wd * rstep(0.8, 1.2, 0.01), 100 * sc / 100), cash = roundTo(ev * rstep(0.03, 0.12, 0.005), 100 * sc / 100);
    const pct = pick([0.2, 0.25, 0.3, 0.4]), earn = roundTo(ev * rstep(0.002, 0.01, 0.0005), sc), pe = rint(8, 18), hold = earn * pe;
    const shares = roundTo(rstep(50, 2000, 10) * (cur === JPY ? 10 : 1), 10), nOpt = roundTo(shares * rstep(0.02, 0.1, 0.005), 1), ov = roundTo(rstep(0.05, 0.2, 0.005) * (ev / shares), cur === JPY ? 1 : 0.5);
    const opt = nOpt * ov, eq = ev + cash + hold - opt - debt, vps = eq / shares;
    if (eq <= 0 || ov <= 0) continue;
    const country = cur === JPY ? 'Japan' : cur === USD ? 'the United States' : 'the euro area';
    const bond = cur === JPY ? 'Japanese government bond' : cur === USD ? 'US Treasury bond' : 'euro-area government bond';
    const y0 = rint(2024, 2027), years = [0, 1, 2, 3, 4].map(k => `31 Dec. ${y0 + k}`);
    const row = (lab: string, xs: number[]) => [lab, ...xs.map(x => fmtNum(x, 0))];
    const body = p_(`It is 1 January ${y0 + 1}. You are valuing ${name}, which operates in ${country}. You have the most recent financials and projections for the next four years [${cur.sym} million]:`) +
      table(['', ...years], [row('EBIT', ebit), row('CapEx', capex), row('Depreciation', dep), row('Inventory', invA), row('Accounts receivable', arA), row('Accounts payable', apA)]) +
      p_(`From ${y0 + 5} onwards, FCFF is expected to grow at a stable rate equal to its growth rate in the last projected year (${y0 + 4}).`) +
      p_(`A regression of ${poss(name)} excess returns on the market’s excess returns gives a beta of ${f2(beta)}, estimated while the company kept a debt-to-equity ratio of ${f2(de0)}. From now on it will keep a D/E ratio of ${f2(de1)}; use β<sub>L</sub> = β<sub>U</sub>(1 + D/E). Its cost of debt is ${pcs(kd, 2)} and the market value of its debt is ${M(debt, 0)}.`) +
      p_(`${name} holds ${M(cash, 0)} in excess cash and owns ${pcs(pct, 0)} of ${co()}, from which it recognised earnings of ${M(earn, 0)} this year; companies in that segment trade at a P/E of ${pe}x. It has ${fmtNum(shares)} million shares outstanding and has issued ${fmtNum(nOpt)} million stock options to its managers, worth ${cur.S(ov)} each on average.`) +
      p_(`The yield on a 10-year ${bond} is ${pcs(yld, 2)} and the 10-year CDS spread of the government is ${pcs(cds, 2)}. The corporate tax rate is ${pcs(t, 0)} and the market premium ${pcs(mrp, 2)}.`);
    const items: Item[] = [
      { part: N(`What is the FCFF for ${y0 + 1}?`, fcff[1], cur.mUnit, { key: 'f1' }), w: 0.55 },
      { part: N(`What is the FCFF for ${y0 + 4}?`, fcff[4], cur.mUnit, { key: 'f4' }), w: 0.3 },
      { part: N('What stable growth rate do you use for the terminal value?', g * 100, 'pct', { key: 'g' }), w: 0.45 },
      { part: N('What risk-free rate do you use?', rf * 100, 'pct', { key: 'rf' }), w: 0.35 },
      { part: N('What is the relevered beta?', bl, 'n', { key: 'bl' }), w: 0.45 },
      { part: N('What is the WACC?', wacc * 100, 'pct', { key: 'wacc' }), w: 0.65 },
      { part: N('What is the enterprise value?', ev, cur.mUnit, { key: 'ev' }), w: 0.65 },
      { part: N('What is the value of equity?', eq, cur.mUnit, { key: 'eq' }), w: 0.5 },
      { part: N(`What is the value per share${perShareTag(cur)}?`, vps, cur.sUnit, { key: 'vps' }), must: true },
    ];
    const c = calc();
    [1, 2, 3, 4].forEach(k => {
      const dn = nwc[k] - nwc[k - 1];
      const md = `**${y0 + k}:** $NWC = ${tn(invA[k], 0)} + ${tn(arA[k], 0)} - ${tn(apA[k], 0)} = ${tn(nwc[k], 0)}$, $\\Delta NWC = ${tq(dn, 0)}$; $FCFF = ${tn(ebit[k], 0)} \\times (1 - ${tn(t)}) + ${tn(dep[k], 0)} - ${tn(capex[k], 0)} - ${tq(dn, 0)} = ${tn(fcff[k])}$.`;
      if (k === 1) c.r(md, 'f1', fcff[1]); else if (k === 4) c.r(md, 'f4', fcff[4]); else c.s(md);
    });
    c.r(`**Stable growth:** $\\frac{${tn(fcff[4])}}{${tn(fcff[3])}} - 1 = ${tn(g * 100)}\\%$.`, 'g', g * 100);
    c.r(`**Risk-free rate:** government yield minus default spread $= ${tn(yld * 100)}\\% - ${tn(cds * 100)}\\% = ${tn(rf * 100)}\\%$.`, 'rf', rf * 100);
    c.s(`**Unlever the regression beta** at the old leverage: $\\frac{${tn(beta)}}{1 + ${tn(de0)}} = ${tn(bu, 4)}$.`);
    c.r(`**Relever:** $${tn(bu, 4)} \\times (1 + ${tn(de1)}) = ${tn(bl, 4)}$.`, 'bl', bl);
    c.r(`**WACC:** $k_e = ${tn(rf * 100)}\\% + ${tn(bl, 4)} \\times ${tn(mrp * 100)}\\% = ${tn(ke * 100)}\\%$; $\\frac{E}{V} = \\frac{1}{${tn(1 + de1)}} = ${tn(1 - wd, 4)}$; $WACC = ${tn(1 - wd, 4)} \\times ${tn(ke * 100)}\\% + ${tn(wd, 4)} \\times ${tn(kd * 100)}\\% \\times ${tn(1 - t)} = ${tn(wacc * 100)}\\%$.`, 'wacc', wacc * 100);
    c.r(`**Enterprise value:** PV of the forecast $${pvs.map(x => tn(x)).join(' + ')} = ${tn(pvE)}$; $TV = \\frac{${tn(fcff[4])} \\times (1 + ${tp(g)})}{${tp(wacc)} - ${tp(g)}} = ${tn(tv)}$, today $\\frac{${tn(tv)}}{${tn(df(4), 4)}} = ${tn(pvTv)}$; $EV = ${tn(ev)}$ ${inM(cur)}.`, 'ev', ev);
    c.r(`**Equity:** holding $${tn(earn, 0)} \\times ${pe} = ${tn(hold)}$, options $${tn(nOpt)} \\times ${tn(ov)} = ${tn(opt)}$; $${tn(ev)} + ${tn(cash, 0)} + ${tn(hold)} - ${tn(opt)} - ${tn(debt, 0)} = ${tn(eq)}$ ${inM(cur)}.`, 'eq', eq);
    c.r(`**Per share:** $\\frac{${tn(eq)}}{${tn(shares, 0)}} = ${tn(vps)}$.`, 'vps', vps);
    let parts = chooseParts(items, ...(o.nParts ?? [4, 6]));
    if (o.combined) {
      const bur = rstep(0.7, 1.4, 0.05), buc = (bu + bur) / 2, blc = buc * (1 + de1);
      c.r(`**Combined firm:** equal weights, $\\beta_U = \\frac{${tn(bu, 4)} + ${tn(bur)}}{2} = ${tn(buc, 4)}$; relevered $${tn(buc, 4)} \\times (1 + ${tn(de1)}) = ${tn(blc, 4)}$.`, 'comb', blc);
      parts = [...parts, N(`${name} considers acquiring a retail group, financed so that D/E stays at ${f2(de1)}. In the combined firm both segments would be equally weighted; the unlevered beta of the retail sector is ${f2(bur)}. What is the levered beta of the combined company?`, blc, 'n', { key: 'comb' })];
    }
    return withCalc(Q(fam, topic, body, parts), c.steps);
  }
  throw new Error('caseAccounts: no valid draw');
}

// =====================================================================
// Format 3: perpetuity with a constant amount of debt, APV (2022)
// =====================================================================

export type ApvOpts = { cur?: Cur; options?: 'treasury' | 'value'; nParts?: [number, number] };

export function caseApv(fam: string, topic: string, o: ApvOpts = {}): Question {
  for (let att = 0; att < 3000; att++) {
    const cur = o.cur ?? pick([USD, EUR]), M = cur.M, name = co();
    const ebit1 = rstep(40, 900, 5), g = rstep(0.01, 0.04, 0.0025), rr = rstep(0.1, 0.4, 0.05), t = pick([0.2, 0.25, 0.3]);
    const blc = rstep(0.8, 1.6, 0.05), dec = rstep(0.2, 0.9, 0.05), bu = blc / (1 + dec), rf = rstep(0.01, 0.04, 0.0025), mrp = rstep(0.05, 0.08, 0.0025), rho = rf + bu * mrp;
    if (rho - g < 0.025) continue;
    const fcff = ebit1 * (1 - t) * (1 - rr), vu = fcff / (rho - g);
    const debt = roundTo(vu * rstep(0.1, 0.35, 0.01), 5), kd = rf + rstep(0.005, 0.025, 0.0025), ts = t * debt, vl = vu + ts;
    const cash = roundTo(vu * rstep(0.03, 0.12, 0.005), 5), pct = pick([0.2, 0.3, 0.4]), earn = roundTo(vu * rstep(0.002, 0.01, 0.0005), 0.5), pe = rint(8, 16), hold = earn * pe;
    const shares = rstep(10, 200, 5), eq = vl + cash + hold - debt;
    if (eq <= 0) continue;
    const mode = o.options ?? pick(['treasury', 'value'] as const), nOpt = roundTo(shares * rstep(0.02, 0.08, 0.005), 0.5);
    const strike = roundTo(eq / shares * rstep(0.3, 0.9, 0.05), 0.5), ov = roundTo(eq / shares * rstep(0.05, 0.25, 0.01), 0.1);
    const vps = mode === 'treasury' ? (eq + nOpt * strike) / (shares + nOpt) : (eq - nOpt * ov) / shares;
    const body = p_(`${name} is a newly listed firm. You expect earnings before interest and taxes of ${M(ebit1, 0)} in the coming year, growing at ${pcs(g, 2)} a year forever, with a constant reinvestment ratio of ${pcs(rr, 0)}.`) +
      p_(`${poss(name)} own beta cannot be estimated reliably yet. Other firms in the industry, with an average debt-to-equity ratio of ${f2(dec)}, have an average equity beta of ${f2(blc)}; unlever with β<sub>U</sub> = β<sub>L</sub> / (1 + D/E). ${name} plans to hold a constant amount of debt of ${M(debt, 0)} forever; its cost of debt is ${pcs(kd, 2)}.`) +
      p_(`${name} holds ${M(cash, 0)} in excess cash and ${pcs(pct, 0)} of ${co()}, from which it recognised earnings of ${M(earn, 1)} this year; the P/E of that segment is ${pe}x. It has ${fmtNum(shares)} million shares outstanding and has issued ${fmtNum(nOpt, 1)} million stock options to its managers, ${mode === 'treasury' ? `with an exercise price of ${cur.S(strike)}; use the treasury stock approach` : `each worth ${cur.S(ov)}`}.`) +
      p_(`The corporate tax rate is ${pcs(t, 0)}, the risk-free rate ${pcs(rf, 2)} and the market premium ${pcs(mrp, 2)}. Value ${name} with the adjusted present value (APV) method.`);
    const items: Item[] = [
      { part: N('What is the FCFF expected for next year?', fcff, cur.mUnit, { key: 'fcff' }), w: 0.5 },
      { part: N('What is the unlevered beta of the industry?', bu, 'n', { key: 'bu' }), w: 0.45 },
      { part: N('What is the unlevered cost of capital?', rho * 100, 'pct', { key: 'rho' }), w: 0.6 },
      { part: N('What is the value of the unlevered firm?', vu, cur.mUnit, { key: 'vu' }), w: 0.7 },
      { part: N('What is the present value of the interest tax shields?', ts, cur.mUnit, { key: 'ts' }), w: 0.6 },
      { part: N('What is the value of the holding?', hold, cur.mUnit, { key: 'hold' }), w: 0.3 },
      { part: N('What is the value of equity before the options?', eq, cur.mUnit, { key: 'eq' }), w: 0.5 },
      { part: N(`What is the value per share${perShareTag(cur)}?`, vps, cur.sUnit, { key: 'vps' }), must: true },
    ];
    const c = calc();
    c.r(`**FCFF:** $EBIT_1(1 - t)(1 - RR) = ${tn(ebit1)} \\times ${tn(1 - t)} \\times ${tn(1 - rr)} = ${tn(fcff)}$ ${inM(cur)}.`, 'fcff', fcff);
    c.r(`**Unlevered beta:** $\\frac{${tn(blc)}}{1 + ${tn(dec)}} = ${tn(bu, 4)}$.`, 'bu', bu);
    c.r(`**Unlevered cost of capital:** $\\rho = ${tn(rf * 100)}\\% + ${tn(bu, 4)} \\times ${tn(mrp * 100)}\\% = ${tn(rho * 100)}\\%$.`, 'rho', rho * 100);
    c.r(`**Unlevered value:** $V_U = \\frac{${tn(fcff)}}{${tp(rho)} - ${tp(g)}} = ${tn(vu)}$ ${inM(cur)}.`, 'vu', vu);
    c.r(`**Tax shields:** a constant, permanent debt gives $t \\times k_d \\times D$ per year, discounted at $k_d$: $PV = t \\times D = ${tn(t)} \\times ${tn(debt)} = ${tn(ts)}$ ${inM(cur)}.`, 'ts', ts);
    c.r(`**Holding:** $${tn(earn)} \\times ${pe} = ${tn(hold)}$ ${inM(cur)}.`, 'hold', hold);
    c.r(`**Equity:** $V_U + PV(TS) + \\text{cash} + \\text{holding} - D = ${tn(vu)} + ${tn(ts)} + ${tn(cash)} + ${tn(hold)} - ${tn(debt)} = ${tn(eq)}$ ${inM(cur)}.`, 'eq', eq);
    c.r(mode === 'treasury'
      ? `**Per share (treasury stock):** exercise brings in $${tn(nOpt)} \\times ${tn(strike)}$: $\\frac{${tn(eq)} + ${tn(nOpt * strike)}}{${tn(shares, 0)} + ${tn(nOpt)}} = ${tn(vps)}$.`
      : `**Per share (option value):** $\\frac{${tn(eq)} - ${tn(nOpt)} \\times ${tn(ov)}}{${tn(shares, 0)}} = ${tn(vps)}$.`, 'vps', vps);
    return withCalc(Q(fam, topic, body, chooseParts(items, ...(o.nParts ?? [4, 6]))), c.steps);
  }
  throw new Error('caseApv: no valid draw');
}

/** Lecture type: one of the three exam formats. */
export function L6_case(): Question {
  const r = Math.random();
  return r < 0.5 ? caseGrowth('L6.case', '6') : r < 0.8 ? caseAccounts('L6.case', '6') : caseApv('L6.case', '6');
}

