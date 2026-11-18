// Firm Valuation — adjusted present value (lecture 2), other assets and claims (lecture 6) and relative valuation
// (lecture 7). New numbers on every call; answers and worked steps come from the same inputs.
import { C, N, P, Q, calc, chance, chooseParts, co, fmtNum, p_, pick, poss, rint, roundTo, rstep, table, tn, tp, tq, v, withCalc, type Item } from '@/lib/engine/gen-helpers';
import type { Question } from '@/lib/engine/types';
import { EUR, USD, annuity, inM, perShareTag, pv, sum, type Cur } from './util';

const f2 = (x: number) => fmtNum(x, 2);
const pcs = (x: number, d = 2) => P(x, d);

// =====================================================================
// LECTURE 2 — Adjusted present value
// =====================================================================

export function L2_apv(): Question {
  for (let att = 0; att < 3000; att++) {
    const cur = pick([USD, EUR]), M = cur.M, name = co();
    const bu = rstep(0.7, 1.4, 0.05), rf = rstep(0.015, 0.04, 0.0025), mrp = rstep(0.05, 0.08, 0.0025), rho = rf + bu * mrp;
    const t = pick([0.2, 0.25, 0.3]), g = rstep(0.01, 0.035, 0.0025);
    if (rho - g < 0.03) continue;
    const ebit1 = rstep(50, 1500, 10), rr = rstep(0.1, 0.4, 0.05), fcff = ebit1 * (1 - t) * (1 - rr), vu = fcff / (rho - g);
    const debt = roundTo(vu * rstep(0.1, 0.4, 0.01), 10), kd = rf + rstep(0.005, 0.025, 0.0025), cash = roundTo(vu * rstep(0.02, 0.1, 0.005), 5), shares = rstep(10, 300, 5);
    const finite = chance(0.5), n = rint(3, 10);
    const tsYear = t * kd * debt, pvTs = finite ? annuity(tsYear, kd, n) : t * debt;
    const vl = vu + pvTs, eq = vl + cash - debt;
    const body = p_(`${name} expects EBIT of ${M(ebit1, 0)} next year, growing at ${pcs(g, 2)} per year forever, and reinvests ${pcs(rr, 0)} of its after-tax operating income. The beta of its assets (unlevered beta) is ${f2(bu)}, the risk-free rate is ${pcs(rf, 2)}, the market premium ${pcs(mrp, 2)} and the tax rate ${pcs(t, 0)}.`) +
      p_(finite ? `${name} borrows ${M(debt, 0)} at ${pcs(kd, 2)}, pays interest annually and repays the full amount after ${n} years; it then has no debt. Discount the interest tax shields at the cost of debt.`
        : `${name} keeps a constant amount of debt of ${M(debt, 0)} forever, at a cost of debt of ${pcs(kd, 2)}. Discount the interest tax shields at the cost of debt.`) +
      p_(`It holds ${M(cash, 0)} of cash and has ${fmtNum(shares)} million shares outstanding.`);
    const items: Item[] = [
      { part: N('What is the unlevered cost of capital?', rho * 100, 'pct', { key: 'rho' }), w: 0.5 },
      { part: N('What is next year’s FCFF?', fcff, cur.mUnit, { key: 'fcff' }), w: 0.4 },
      { part: N('What is the value of the unlevered firm?', vu, cur.mUnit, { key: 'vu' }), must: true },
      { part: N('What is the annual interest tax shield?', tsYear, cur.mUnit, { key: 'ts1' }), w: 0.35 },
      { part: N('What is the present value of the interest tax shields?', pvTs, cur.mUnit, { key: 'pvts' }), must: true },
      { part: N('What is the value of the levered firm (APV)?', vl, cur.mUnit, { key: 'vl' }), w: 0.6 },
      { part: N(`What is the value per share${perShareTag(cur)}?`, eq / shares, cur.sUnit, { key: 'vps' }), w: 0.5 },
    ];
    const c = calc();
    c.r(`**Unlevered cost of capital:** $\\rho = ${tn(rf * 100)}\\% + ${tn(bu)} \\times ${tn(mrp * 100)}\\% = ${tn(rho * 100)}\\%$.`, 'rho', rho * 100);
    c.r(`**FCFF:** $${tn(ebit1)} \\times (1 - ${tn(t)}) \\times (1 - ${tn(rr)}) = ${tn(fcff)}$ ${inM(cur)}.`, 'fcff', fcff);
    c.r(`**Unlevered value:** $\\frac{${tn(fcff)}}{${tp(rho)} - ${tp(g)}} = ${tn(vu)}$ ${inM(cur)}.`, 'vu', vu);
    c.r(`**Annual tax shield:** $t \\times k_d \\times D = ${tn(t)} \\times ${tn(kd, 4)} \\times ${tn(debt)} = ${tn(tsYear)}$ ${inM(cur)}.`, 'ts1', tsYear);
    c.r(finite ? `**PV of the tax shields:** an annuity for ${n} years at $k_d$: $${tn(tsYear)} \\times \\frac{1 - (1 + ${tp(kd)})^{-${n}}}{${tn(kd, 4)}} = ${tn(pvTs)}$ ${inM(cur)}.`
      : `**PV of the tax shields:** a perpetuity at $k_d$: $\\frac{t\\,k_d\\,D}{k_d} = t \\times D = ${tn(t)} \\times ${tn(debt)} = ${tn(pvTs)}$ ${inM(cur)}.`, 'pvts', pvTs);
    c.r(`**APV:** $${tn(vu)} + ${tn(pvTs)} = ${tn(vl)}$ ${inM(cur)}.`, 'vl', vl);
    c.r(`**Per share:** $\\frac{${tn(vl)} + ${tn(cash)} - ${tn(debt)}}{${tn(shares, 0)}} = ${tn(eq / shares)}$.`, 'vps', eq / shares);
    return withCalc(Q('L2.apv', 2, body, chooseParts(items, 3, 5)), c.steps);
  }
  throw new Error('L2_apv: no valid draw');
}

// =====================================================================
// LECTURE 6 — Options, holdings, cash, commitments
// =====================================================================

export function L6_options(force?: 'fcf' | 'ebit'): Question {
  for (let att = 0; att < 3000; att++) {
    const cur = pick([USD, EUR]), M = cur.M, name = co();
    const c = calc();
    let body: string, eq: number;
    if (force ? force === 'fcf' : chance(0.5)) {
      const fcf = rstep(20, 600, 5), r = rstep(0.07, 0.12, 0.0025), g = rstep(0.01, 0.04, 0.0025);
      if (r - g < 0.03) continue;
      const fv = fcf / (r - g), debt = roundTo(fv * rstep(0.2, 0.5, 0.01), 10);
      eq = fv - debt;
      body = p_(`${name} expects free cash flow to the firm of ${M(fcf, 0)} next year, growing at ${pcs(g, 1)} in perpetuity; its cost of capital is ${pcs(r, 2)}. Its debt is worth ${M(debt, 0)}.`);
      c.s(`**Firm value:** $\\frac{${tn(fcf)}}{${tp(r)} - ${tp(g)}} = ${tn(fv)}$; equity $= ${tn(fv)} - ${tn(debt)} = ${tn(eq)}$ ${inM(cur)}.`);
    } else {
      const ebit = rstep(50, 1500, 10), g = rstep(0.01, 0.05, 0.0025), t = pick([0.25, 0.3, 0.35, 0.4]), w = rstep(0.08, 0.12, 0.0025), rr = rstep(0.2, 0.45, 0.05);
      if (w - g < 0.03) continue;
      const fcff = ebit * (1 + g) * (1 - t) * (1 - rr), fv = fcff / (w - g), cash = roundTo(fv * rstep(0.05, 0.2, 0.01), 10), debt = roundTo(fv * rstep(0.15, 0.4, 0.01), 10);
      eq = fv + cash - debt;
      body = p_(`${name} has EBIT of ${M(ebit, 0)} this year, expected to grow at ${pcs(g, 1)} per year forever. The tax rate is ${pcs(t, 0)}, the cost of capital ${pcs(w, 1)} and the reinvestment rate ${pcs(rr, 0)}. It holds ${M(cash, 0)} in cash and marketable securities and has ${M(debt, 0)} of debt.`);
      c.s(`**Firm value:** $FCFF_1 = ${tn(ebit)} \\times (1 + ${tp(g)}) \\times ${tn(1 - t)} \\times ${tn(1 - rr)} = ${tn(fcff)}$; $\\frac{${tn(fcff)}}{${tp(w)} - ${tp(g)}} = ${tn(fv)}$; equity $= ${tn(fv)} + ${tn(cash)} - ${tn(debt)} = ${tn(eq)}$ ${inM(cur)}.`);
    }
    if (eq <= 0) continue;
    const sh = rstep(20, 400, 5), base = eq / sh, n = roundTo(sh * rstep(0.05, 0.2, 0.01), 0.5), K = roundTo(base * rstep(0.6, 1.1, 0.05), 0.5), ov = roundTo(base * rstep(0.08, 0.3, 0.01), 0.25);
    const dil = eq / (sh + n), tsm = (eq + n * K) / (sh + n), ovm = (eq - n * ov) / sh;
    body += p_(`There are ${fmtNum(sh)} million shares outstanding. Managers hold ${fmtNum(n, 1)} million options with an exercise price of ${cur.S(K)}; an option-pricing model values each option at ${cur.S(ov)}.`);
    const items: Item[] = [
      { part: N(`What is the value per share ignoring the options${perShareTag(cur)}?`, base, cur.sUnit, { key: 'base' }), w: 0.5 },
      { part: N('What is the value per share on a fully diluted basis (options counted as shares, no exercise proceeds)?', dil, cur.sUnit, { key: 'dil' }), w: 0.6 },
      { part: N('What is the value per share with the treasury stock approach?', tsm, cur.sUnit, { key: 'tsm' }), w: 0.75 },
      { part: N('What is the value per share when the option value is subtracted from equity?', ovm, cur.sUnit, { key: 'ovm' }), w: 0.75 },
    ];
    c.r(`**Ignoring options:** $\\frac{${tn(eq)}}{${tn(sh, 0)}} = ${tn(base)}$.`, 'base', base);
    c.r(`**Fully diluted:** $\\frac{${tn(eq)}}{${tn(sh, 0)} + ${tn(n)}} = ${tn(dil)}$; it overstates dilution because the exercise cash is ignored.`, 'dil', dil);
    c.r(`**Treasury stock:** exercise proceeds $${tn(n)} \\times ${tn(K)} = ${tn(n * K)}$; $\\frac{${tn(eq)} + ${tn(n * K)}}{${tn(sh + n)}} = ${tn(tsm)}$; it ignores the time value of the options.`, 'tsm', tsm);
    c.r(`**Option value method:** $\\frac{${tn(eq)} - ${tn(n)} \\times ${tn(ov)}}{${tn(sh, 0)}} = \\frac{${tn(eq - n * ov)}}{${tn(sh, 0)}} = ${tn(ovm)}$.`, 'ovm', ovm);
    return withCalc(Q('L6.options', 6, body, chooseParts(items, 2, 4)), c.steps);
  }
  throw new Error('L6_options: no valid draw');
}

export function L6_holdings(): Question {
  for (let att = 0; att < 3000; att++) {
    const cur = pick([USD, EUR]), M = cur.M, name = co(), a = co(), b = co();
    const ev = rstep(1, 20, 0.5) * 1000, cash = roundTo(ev * rstep(0.03, 0.15, 0.01), 10), debt = roundTo(ev * rstep(0.15, 0.45, 0.01), 10), shares = rstep(20, 500, 5);
    const pA = pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.35]), pB = pick([0.6, 0.7, 0.75, 0.8, 0.85, 0.9]), pb = rstep(1.2, 3.5, 0.1);
    const aMode = pick(['mv', 'pb', 'pe'] as const), bMode = pick(['mv', 'pb'] as const);
    let hold: number, aText: string, aMd: string;
    if (aMode === 'mv') { const mv = roundTo(ev * rstep(0.05, 0.3, 0.01), 10); hold = pA * mv; aText = `owns ${pcs(pA, 0)} of ${a}, whose shares have a total market value of ${M(mv, 0)}`; aMd = `$${tn(pA)} \\times ${tn(mv)} = ${tn(hold)}$`; }
    else if (aMode === 'pb') { const bv = roundTo(ev * rstep(0.005, 0.04, 0.001), 1); hold = bv * pb; aText = `owns ${pcs(pA, 0)} of ${a}, carried as an investment in affiliates at a book value of ${M(bv, 0)}`; aMd = `book value × sector P/B $= ${tn(bv)} \\times ${tn(pb)} = ${tn(hold)}$`; }
    else { const earn = roundTo(ev * rstep(0.001, 0.006, 0.0005), 0.5), pe = rint(8, 18); hold = earn * pe; aText = `owns ${pcs(pA, 0)} of ${a}, from which it recognised earnings of ${M(earn, 1)} this year (firms like ${a} trade at ${pe} times earnings)`; aMd = `share of earnings × P/E $= ${tn(earn)} \\times ${pe} = ${tn(hold)}$`; }
    let mi: number, bText: string, bMd: string;
    if (bMode === 'mv') { const mv = roundTo(ev * rstep(0.05, 0.3, 0.01), 10); mi = (1 - pB) * mv; bText = `owns ${pcs(pB, 0)} of ${b} and fully consolidates it; ${poss(b)} equity has a market value of ${M(mv, 0)}`; bMd = `$(1 - ${tn(pB)}) \\times ${tn(mv)} = ${tn(mi)}$`; }
    else { const bv = roundTo(ev * rstep(0.005, 0.04, 0.001), 1); mi = bv * pb; bText = `owns ${pcs(pB, 0)} of ${b} and fully consolidates it; the balance sheet shows minority interests of ${M(bv, 0)} at book value`; bMd = `book value × sector P/B $= ${tn(bv)} \\times ${tn(pb)} = ${tn(mi)}$`; }
    const eq = ev + cash + hold - mi - debt;
    if (eq <= 0) continue;
    const needPb = aMode === 'pb' || bMode === 'pb';
    const body = p_(`A DCF of ${poss(name)} consolidated free cash flows gives a value of operating assets of ${M(ev, 0)}. ${name} holds ${M(cash, 0)} of cash, has debt worth ${M(debt, 0)} and ${fmtNum(shares)} million shares. It ${aText}. It also ${bText}.${needPb ? ` The industry trades at ${fmtNum(pb, 1)} times book value.` : ''}`);
    const items: Item[] = [
      { part: N(`What value do you add for the holding in ${a}?`, hold, cur.mUnit, { key: 'hold' }), must: true },
      { part: N(`What value of minority interests in ${b} do you subtract?`, mi, cur.mUnit, { key: 'mi' }), must: true },
      { part: N('What is the value of equity?', eq, cur.mUnit, { key: 'eq' }), w: 0.7 },
      { part: N(`What is the value per share${perShareTag(cur)}?`, eq / shares, cur.sUnit, { key: 'vps' }), w: 0.6 },
    ];
    const c = calc();
    c.r(`**Minority holding in ${a}:** it is not in the consolidated cash flows, so add it: ${aMd} ${inM(cur)}.`, 'hold', hold);
    c.r(`**Minority interests in ${b}:** ${b} is fully in the consolidated cash flows, but ${tn((1 - pB) * 100, 0)}% belongs to outsiders: ${bMd} ${inM(cur)}.`, 'mi', mi);
    c.r(`**Equity:** $${tn(ev)} + ${tn(cash)} + ${tn(hold)} - ${tn(mi)} - ${tn(debt)} = ${tn(eq)}$ ${inM(cur)}.`, 'eq', eq);
    c.r(`**Per share:** $\\frac{${tn(eq)}}{${tn(shares, 0)}} = ${tn(eq / shares)}$.`, 'vps', eq / shares);
    return withCalc(Q('L6.holdings', 6, body, chooseParts(items, 2, 4)), c.steps);
  }
  throw new Error('L6_holdings: no valid draw');
}

export const CASH_KIND = ['Neutral asset', 'Wasting asset (value destroyer)', 'Potential value creator'];

export function L6_cash(): Question {
  for (let att = 0; att < 3000; att++) {
    const cur = pick([USD, EUR]), M = cur.M, name = co();
    const D = rstep(200, 5000, 50), C0 = roundTo(D * rstep(0.15, 0.7, 0.05), 10), kd = rstep(0.04, 0.09, 0.0025), rf = kd - rstep(0.01, 0.03, 0.0025);
    const knd = (kd * D - rf * C0) / (D - C0);
    const w = rstep(0.08, 0.12, 0.01);
    const kind = chance(0.33) ? 0 : chance(0.5) ? 1 : 2, rc = kind === 0 ? w : kind === 1 ? w - rstep(0.02, 0.05, 0.01) : w + rstep(0.05, 0.12, 0.01);
    const body = p_(`${name} has gross debt of ${M(D, 0)} at a cost of debt of ${pcs(kd, 2)} and holds ${M(C0, 0)} of cash earning the risk-free rate of ${pcs(rf, 2)}. An analyst wants to value it with net debt.`) +
      p_(`${name} earns a return on capital of ${pcs(rc, 0)} against a cost of capital of ${pcs(w, 0)}.`);
    const items: Item[] = [
      { part: N('What is the net debt?', D - C0, cur.mUnit, { key: 'nd' }), w: 0.4 },
      { part: N('What is the cost of net debt?', knd * 100, 'pct', { key: 'knd' }), must: true },
      { part: C(`How should the market value a dollar of ${poss(name)} cash, by this measure?`, CASH_KIND, kind, 'kind'), w: 0.7 },
    ];
    const c = calc();
    c.r(`**Net debt:** $${tn(D)} - ${tn(C0)} = ${tn(D - C0)}$ ${inM(cur)}.`, 'nd', D - C0);
    c.r(`**Cost of net debt:** $\\frac{k_d \\times D - r_f \\times \\text{Cash}}{D - \\text{Cash}} = \\frac{${tn(kd, 4)} \\times ${tn(D)} - ${tn(rf, 4)} \\times ${tn(C0)}}{${tn(D - C0)}} = \\frac{${tn(kd * D - rf * C0)}}{${tn(D - C0)}} = ${tn(knd * 100)}\\%$. It is above $k_d$: netting low-yield cash against debt makes the remaining debt look costlier.`, 'knd', knd * 100);
    c.r(`**Cash:** return on capital ${tn(rc * 100, 0)}% ${kind === 0 ? '=' : kind === 1 ? '<' : '>'} cost of capital ${tn(w * 100, 0)}%, so cash is likely a ${CASH_KIND[kind].toLowerCase()}.`, 'kind');
    return withCalc(Q('L6.cash', 6, body, chooseParts(items, 2, 3)), c.steps);
  }
  throw new Error('L6_cash: no valid draw');
}

export function L6_commit(): Question {
  for (let att = 0; att < 3000; att++) {
    const cur = pick([USD, EUR]), M = cur.M, name = co(['Media', 'Streaming', 'Studios', 'Entertainment', 'Networks']);
    const y1 = rstep(500, 5000, 10), sched = [y1, y1 * rstep(0.5, 0.8, 0.01), y1 * rstep(0.4, 0.7, 0.01), y1 * rstep(0.1, 0.3, 0.01), y1 * rstep(0.1, 0.3, 0.01)].map(x => roundTo(x, 1)), after = roundTo(y1 * rstep(0.01, 0.1, 0.005), 1);
    const kd = rstep(0.04, 0.09, 0.0025), cfs = [...sched, after], pvs = cfs.map((x, i) => pv(x, kd, i + 1)), pvC = sum(pvs);
    const debt = roundTo(pvC * rstep(0.2, 0.8, 0.01), 10), E = roundTo((debt + pvC) * rstep(2, 8, 0.1), 100);
    const w0 = debt / (debt + E), w1 = (debt + pvC) / (debt + pvC + E);
    const body = p_(`${name} has signed multi-year content-licensing commitments. You decide to treat them as debt, discounting them at its pre-tax cost of debt of ${pcs(kd, 2)}. Treat the amount due after year 5 as a single payment in year 6. ${name} also has conventional debt of ${M(debt, 0)}; the market value of its equity is ${M(E, 0)}.`) +
      table(['Year', '1', '2', '3', '4', '5', 'After 5'], [['Commitment', ...cfs.map(x => fmtNum(x, 0))]]);
    const items: Item[] = [
      { part: N('What is the present value of the commitments?', pvC, cur.mUnit, { key: 'pvC' }), must: true },
      { part: N('What is the total debt once the commitments are included?', debt + pvC, cur.mUnit, { key: 'D1' }), w: 0.6 },
      { part: N('What is the debt-to-capital ratio before the adjustment?', w0 * 100, 'pct', { key: 'w0' }), w: 0.4 },
      { part: N('What is the debt-to-capital ratio after the adjustment?', w1 * 100, 'pct', { key: 'w1' }), w: 0.6 },
    ];
    const c = calc();
    c.r(`**PV of the commitments:** $${cfs.map((x, i) => `\\frac{${tn(x, 0)}}{(1 + ${tp(kd)})^{${i + 1}}}`).join(' + ')} = ${pvs.map(x => tn(x)).join(' + ')} = ${tn(pvC)}$ ${inM(cur)}.`, 'pvC', pvC);
    c.r(`**Adjusted debt:** $${tn(debt)} + ${tn(pvC)} = ${tn(debt + pvC)}$ ${inM(cur)}.`, 'D1', debt + pvC);
    c.r(`**Debt ratio before:** $\\frac{${tn(debt)}}{${tn(debt)} + ${tn(E)}} = ${tn(w0 * 100)}\\%$.`, 'w0', w0 * 100);
    c.r(`**Debt ratio after:** $\\frac{${tn(debt + pvC)}}{${tn(debt + pvC)} + ${tn(E)}} = ${tn(w1 * 100)}\\%$. The firm is more levered than its balance sheet shows; its operating income and invested capital rise as well.`, 'w1', w1 * 100);
    return withCalc(Q('L6.commit', 6, body, chooseParts(items, 2, 3)), c.steps);
  }
  throw new Error('L6_commit: no valid draw');
}

// =====================================================================
// LECTURE 7 — Relative valuation
// =====================================================================

const PEERS = ['Arden', 'Belmont', 'Calder', 'Dunmore', 'Elstree', 'Falkner', 'Garrow', 'Halden', 'Kestrel', 'Marlow', 'Norland', 'Pemberton', 'Radley', 'Thorne'];

export function L7_multiples(): Question {
  for (let att = 0; att < 3000; att++) {
    const cur = pick([USD, EUR]), M = cur.M, name = co(['Footwear', 'Apparel', 'Retail', 'Brands', 'Foods']);
    const k = rint(4, 6), peers = [...PEERS].sort(() => Math.random() - 0.5).slice(0, k);
    const pes = peers.map(() => rstep(8, 26, 0.01)), evs = peers.map(() => rstep(5, 14, 0.01));
    const pe = sum(pes) / k, eve = sum(evs) / k, eps = rstep(0.8, 6, 0.01), ebitda = rstep(20, 600, 0.1), cash = roundTo(ebitda * rstep(0.2, 2, 0.1), 1), debt = roundTo(ebitda * rstep(0.05, 2, 0.05), 1), sh = rstep(10, 200, 1);
    const pPE = pe * eps, EV = eve * ebitda, pEV = (EV - debt + cash) / sh, lo = Math.min(...pes) * eps, hi = Math.max(...pes) * eps;
    if (pEV <= 0) continue;
    const mkt = roundTo(pPE * rstep(0.7, 1.3, 0.01), 0.01), over = (mkt - pPE) / pPE;
    const body = p_(`${name} has earnings per share of ${cur.S(eps)}, EBITDA of ${M(ebitda, 1)}, excess cash of ${M(cash, 0)}, debt of ${M(debt, 0)} and ${fmtNum(sh)} million shares outstanding; its shares trade at ${cur.S(mkt)}. Multiples of its listed peers:`) +
      table(['Peer', 'P/E', 'EV/EBITDA'], peers.map((p, i) => [p, f2(pes[i]), f2(evs[i])]));
    const items: Item[] = [
      { part: N('What is the average P/E of the peers?', pe, 'x', { key: 'pe' }), w: 0.3 },
      { part: N(`What share price does the average P/E imply${perShareTag(cur)}?`, pPE, cur.sUnit, { key: 'pPE' }), must: true },
      { part: N('What is the lowest share price implied by the range of peer P/Es?', lo, cur.sUnit, { key: 'lo' }), w: 0.3 },
      { part: N('What is the highest share price implied by the range of peer P/Es?', hi, cur.sUnit, { key: 'hi' }), w: 0.3 },
      { part: N('What enterprise value does the average EV/EBITDA imply?', EV, cur.mUnit, { key: 'EV' }), w: 0.45 },
      { part: N('What share price does the average EV/EBITDA imply?', pEV, cur.sUnit, { key: 'pEV' }), must: true },
      { part: N('By how much is the market price above the P/E-based value? (Enter a shortfall as a negative number.)', over * 100, 'pct', { key: 'over' }), w: 0.35 },
    ];
    const c = calc();
    c.r(`**Average P/E:** $\\frac{${pes.map(x => tn(x)).join(' + ')}}{${k}} = ${tn(pe)}$.`, 'pe', pe);
    c.r(`**Price from P/E:** $${tn(pe)} \\times ${tn(eps)} = ${tn(pPE)}$.`, 'pPE', pPE);
    c.r(`**Lowest:** $${tn(Math.min(...pes))} \\times ${tn(eps)} = ${tn(lo)}$.`, 'lo', lo);
    c.r(`**Highest:** $${tn(Math.max(...pes))} \\times ${tn(eps)} = ${tn(hi)}$.`, 'hi', hi);
    c.r(`**Enterprise value:** average EV/EBITDA $\\frac{${evs.map(x => tn(x)).join(' + ')}}{${k}} = ${tn(eve)}$; $${tn(eve)} \\times ${tn(ebitda)} = ${tn(EV)}$ ${inM(cur)}.`, 'EV', EV);
    c.r(`**Price from EV/EBITDA:** $\\frac{EV - \\text{Debt} + \\text{Cash}}{\\text{Shares}} = \\frac{${tn(EV)} - ${tn(debt)} + ${tn(cash)}}{${tn(sh, 0)}} = ${tn(pEV)}$.`, 'pEV', pEV);
    c.r(`**Over- or undervaluation:** $\\frac{\\text{Price} - \\text{Value}}{\\text{Value}} = \\frac{${tn(mkt)} - ${tn(pPE)}}{${tn(pPE)}} = ${tn(over * 100)}\\%$.`, 'over', over * 100);
    return withCalc(Q('L7.multiples', 7, body, chooseParts(items, 3, 4)), c.steps);
  }
  throw new Error('L7_multiples: no valid draw');
}

export type Firm = { price: number; sh: number; debt: number; cash: number; ebit: number; int: number; tax: number; da: number; pay: number; roe: number };
export const firmPE = (f: Firm) => f.price * f.sh / (f.ebit - f.int - f.tax);
export const firmEV = (f: Firm) => (f.price * f.sh + f.debt - f.cash) / (f.ebit + f.da);

export function drawFirm(scale: number): Firm {
  const ebit = roundTo(scale * rstep(0.5, 2, 0.01), 1), int = roundTo(ebit * rstep(0.05, 0.25, 0.01), 1), tax = roundTo((ebit - int) * pick([0.2, 0.25, 0.28, 0.3]), 1);
  const ni = ebit - int - tax, pe = rstep(8, 25, 0.1), sh = rstep(5, 80, 1), price = roundTo(ni * pe / sh, 0.5);
  return { price, sh, debt: roundTo(ebit * rstep(0.5, 3, 0.1), 5), cash: roundTo(ebit * rstep(0.1, 2, 0.1), 5), ebit, int, tax, da: roundTo(ebit * rstep(0.08, 0.3, 0.01), 1), pay: rstep(0.3, 0.7, 0.05), roe: rstep(0.08, 0.18, 0.01) };
}

export function L7_compare(): Question {
  for (let att = 0; att < 3000; att++) {
    const A = drawFirm(rstep(40, 400, 5)), B = drawFirm(rstep(40, 400, 5));
    const peA = firmPE(A), peB = firmPE(B), evA = firmEV(A), evB = firmEV(B);
    if (Math.abs(evA / evB - 1) < 0.05 || Math.abs(peA / peB - 1) < 0.05) continue;
    const gA = A.roe * (1 - A.pay), gB = B.roe * (1 - B.pay);
    const nA = co(), nB = co();
    const row = (l: string, a: string, b: string) => [l, a, b];
    const body = p_(`You compare two manufacturing companies (amounts in millions):`) +
      table(['', nA, nB], [
        row('Price per share', f2(A.price), f2(B.price)), row('Shares outstanding', fmtNum(A.sh), fmtNum(B.sh)), row('Market value of debt', fmtNum(A.debt), fmtNum(B.debt)), row('Cash and marketable securities', fmtNum(A.cash), fmtNum(B.cash)),
        row('EBIT', fmtNum(A.ebit), fmtNum(B.ebit)), row('Interest expense', fmtNum(A.int), fmtNum(B.int)), row('Tax expense', fmtNum(A.tax), fmtNum(B.tax)), row('Depreciation & amortisation', fmtNum(A.da), fmtNum(B.da)),
        row('Payout ratio', P(A.pay, 0), P(B.pay, 0)), row('ROE', P(A.roe, 0), P(B.roe, 0)),
      ]);
    const cheapEV = evA < evB ? 0 : 1;
    const items: Item[] = [
      { part: N(`What is the P/E of ${nA}?`, peA, 'x', { key: 'peA' }), w: 0.7 },
      { part: N(`What is the P/E of ${nB}?`, peB, 'x', { key: 'peB' }), w: 0.7 },
      { part: N(`What is the EV/EBITDA of ${nA}?`, evA, 'x', { key: 'evA' }), w: 0.7 },
      { part: N(`What is the EV/EBITDA of ${nB}?`, evB, 'x', { key: 'evB' }), w: 0.7 },
      { part: C('Which company is cheaper on EV/EBITDA?', [nA, nB], cheapEV, 'cheap'), w: 0.4 },
      { part: N(`What expected earnings growth do ${poss(nA)} fundamentals imply (ROE × retention)?`, gA * 100, 'pct', { key: 'gA' }), w: 0.3 },
      { part: N(`What expected earnings growth do ${poss(nB)} fundamentals imply?`, gB * 100, 'pct', { key: 'gB' }), w: 0.3 },
    ];
    const c = calc();
    const peMd = (f: Firm, n: string) => `**P/E of ${n}:** net income $= ${tn(f.ebit)} - ${tn(f.int)} - ${tn(f.tax)} = ${tn(f.ebit - f.int - f.tax)}$; $\\frac{${tn(f.price)} \\times ${tn(f.sh, 0)}}{${tn(f.ebit - f.int - f.tax)}} = ${tn(firmPE(f))}$.`;
    const evMd = (f: Firm, n: string) => `**EV/EBITDA of ${n}:** $\\frac{${tn(f.price * f.sh)} + ${tn(f.debt)} - ${tn(f.cash)}}{${tn(f.ebit)} + ${tn(f.da)}} = ${tn(firmEV(f))}$.`;
    c.r(peMd(A, nA), 'peA', peA); c.r(peMd(B, nB), 'peB', peB); c.r(evMd(A, nA), 'evA', evA); c.r(evMd(B, nB), 'evB', evB);
    c.r(`**Cheaper:** ${[nA, nB][cheapEV]} has the lower EV/EBITDA; before calling it undervalued, check whether growth, risk and leverage justify the gap.`, 'cheap');
    c.r(`**Growth ${nA}:** $${tn(A.roe)} \\times (1 - ${tn(A.pay)}) = ${tn(gA * 100)}\\%$.`, 'gA', gA * 100);
    c.r(`**Growth ${nB}:** $${tn(B.roe)} \\times (1 - ${tn(B.pay)}) = ${tn(gB * 100)}\\%$.`, 'gB', gB * 100);
    return withCalc(Q('L7.compare', 7, body, chooseParts(items, 3, 5)), c.steps);
  }
  throw new Error('L7_compare: no valid draw');
}

export function L7_fundPE(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), r = rstep(0.07, 0.13, 0.0025), roe = rstep(0.08, 0.25, 0.005), pay = rstep(0.3, 0.8, 0.05), g = roe * (1 - pay);
    if (r - g < 0.02) continue;
    const eps = rstep(1, 8, 0.05), pe = pay * (1 + g) / (r - g), fpe = pay / (r - g), peg = pe / (g * 100), pb = roe * pay * (1 + g) / (r - g);
    const body = p_(`${name} is in stable growth. It earns a return on equity of ${pcs(roe, 1)} (on beginning-of-year book equity), pays out ${pcs(pay, 0)} of its earnings and has a cost of equity of ${pcs(r, 2)}. It has just reported earnings per share of €${f2(eps)}.`);
    const items: Item[] = [
      { part: N('What is the expected growth rate?', g * 100, 'pct', { key: 'g' }), w: 0.5 },
      { part: N('What trailing P/E (price over current EPS) is justified by the fundamentals?', pe, 'x', { key: 'pe' }), must: true },
      { part: N('What forward P/E (price over next year’s EPS) is justified?', fpe, 'x', { key: 'fpe' }), w: 0.4 },
      { part: N('What is the PEG ratio (trailing P/E divided by growth in percent)?', peg, 'x', { key: 'peg' }), w: 0.4 },
      { part: N('What price-to-book ratio is justified?', pb, 'x', { key: 'pb' }), w: 0.4 },
      { part: N('What is the value per share?', pe * eps, 'eur', { key: 'p' }), w: 0.4 },
    ];
    const c = calc();
    c.r(`**Growth:** $g = ROE \\times (1 - \\text{payout}) = ${tn(roe, 4)} \\times ${tn(1 - pay)} = ${tn(g * 100)}\\%$.`, 'g', g * 100);
    c.r(`**Trailing P/E:** $\\text{payout} \\times \\frac{1 + g}{r - g} = ${tn(pay)} \\times \\frac{(1 + ${tp(g)})}{${tp(r)} - ${tp(g)}} = ${tn(pe)}$.`, 'pe', pe);
    c.r(`**Forward P/E:** $\\frac{\\text{payout}}{r - g} = \\frac{${tn(pay)}}{${tn(r - g, 4)}} = ${tn(fpe)}$.`, 'fpe', fpe);
    c.r(`**PEG:** $\\frac{${tn(pe)}}{${tn(g * 100)}} = ${tn(peg)}$.`, 'peg', peg);
    c.r(`**P/B:** $ROE \\times \\text{payout} \\times \\frac{1 + g}{r - g} = ${tn(roe, 4)} \\times ${tn(pe)} = ${tn(pb)}$.`, 'pb', pb);
    c.r(`**Value per share:** $${tn(pe)} \\times ${tn(eps)} = ${tn(pe * eps)}$ (€).`, 'p', pe * eps);
    return withCalc(Q('L7.fundPE', 7, body, chooseParts(items, 2, 4)), c.steps);
  }
  throw new Error('L7_fundPE: no valid draw');
}

export function L7_exit(force?: 'zimco' | 'lam'): Question {
  for (let att = 0; att < 3000; att++) {
    const cur = pick([USD, EUR]), M = cur.M, name = co(['Telecom', 'Media', 'Networks', 'Digital']);
    const c = calc();
    if (force ? force === 'zimco' : chance(0.55)) {
      const rev0 = rstep(200, 3000, 10), n = rint(3, 6), gR = rstep(0.03, 0.12, 0.005), m0 = rstep(-0.12, 0.02, 0.01), mN = rstep(0.06, 0.2, 0.01), mult = rstep(4, 10, 0.5), r = rstep(0.09, 0.15, 0.005);
      const revN = rev0 * Math.pow(1 + gR, n), ebN = revN * mN, evN = ebN * mult, ev0 = evN / Math.pow(1 + r, n);
      const cash = roundTo(rev0 * rstep(0.02, 0.1, 0.01), 5), debt = roundTo(ev0 * rstep(0.1, 0.6, 0.01), 5), sh = rstep(5, 100, 1), eq = ev0 + cash - debt;
      if (eq <= 0) continue;
      const body = p_(`${name} currently loses money: its EBITDA last year was ${M(rev0 * m0, 1)} on revenues of ${M(rev0, 0)}. Revenues are expected to grow ${pcs(gR, 1)} a year for ${n} years, and the EBITDA margin should reach ${pcs(mN, 0)} in year ${n}. Healthy firms in the industry trade at ${fmtNum(mult, 1)} times EBITDA. The cost of capital is ${pcs(r, 1)}; ${name} has ${M(cash, 0)} of cash, ${M(debt, 0)} of debt and ${fmtNum(sh)} million shares. Value it with a terminal multiple in year ${n}.`);
      const items: Item[] = [
        { part: N(`What are revenues in year ${n}?`, revN, cur.mUnit, { key: 'revN' }), w: 0.4 },
        { part: N(`What is EBITDA in year ${n}?`, ebN, cur.mUnit, { key: 'ebN' }), w: 0.4 },
        { part: N(`What is the enterprise value in year ${n}?`, evN, cur.mUnit, { key: 'evN' }), w: 0.5 },
        { part: N('What is the enterprise value today?', ev0, cur.mUnit, { key: 'ev0' }), w: 0.6 },
        { part: N(`What is the value per share today${perShareTag(cur)}?`, eq / sh, cur.sUnit, { key: 'vps' }), must: true },
      ];
      c.r(`**Revenue in year ${n}:** $${tn(rev0)} \\times (1 + ${tp(gR)})^{${n}} = ${tn(revN)}$ ${inM(cur)}.`, 'revN', revN);
      c.r(`**EBITDA in year ${n}:** $${tn(revN)} \\times ${tn(mN)} = ${tn(ebN)}$.`, 'ebN', ebN);
      c.r(`**Exit value:** $${tn(ebN)} \\times ${tn(mult)} = ${tn(evN)}$.`, 'evN', evN);
      c.r(`**Today:** $\\frac{${tn(evN)}}{(1 + ${tp(r)})^{${n}}} = ${tn(ev0)}$.`, 'ev0', ev0);
      c.r(`**Per share:** $\\frac{${tn(ev0)} + ${tn(cash)} - ${tn(debt)}}{${tn(sh, 0)}} = ${tn(eq / sh)}$.`, 'vps', eq / sh);
      return withCalc(Q('L7.exit', 7, body, chooseParts(items, 2, 4)), c.steps);
    }
    const n = rint(2, 5), revN = rstep(100, 2000, 10), mult = rstep(1.5, 6, 0.5), r = rstep(0.1, 0.25, 0.01), pf = pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.4]);
    const sale = revN * mult, pvS = sale / Math.pow(1 + r, n), val = pvS * (1 - pf);
    const body = p_(`You consider investing in ${name}, a young firm with no cash or debt. You expect revenues of ${M(revN, 0)} in year ${n}, when you plan to sell the firm at ${fmtNum(mult, 1)} times revenues. The cost of capital is ${pcs(r, 0)}. There is a ${pcs(pf, 0)} chance that the firm fails before then and is worth nothing.`);
    const items: Item[] = [
      { part: N(`What is the sale value in year ${n} if the firm survives?`, sale, cur.mUnit, { key: 'sale' }), w: 0.5 },
      { part: N('What is the present value of that sale price?', pvS, cur.mUnit, { key: 'pvS' }), w: 0.6 },
      { part: N('What is the value of the equity today, allowing for failure?', val, cur.mUnit, { key: 'val' }), must: true },
    ];
    c.r(`**Sale value:** $${tn(mult)} \\times ${tn(revN)} = ${tn(sale)}$ ${inM(cur)}.`, 'sale', sale);
    c.r(`**Discounted:** $\\frac{${tn(sale)}}{(1 + ${tp(r)})^{${n}}} = ${tn(pvS)}$.`, 'pvS', pvS);
    c.r(`**Survival-weighted:** $${tn(pvS)} \\times (1 - ${tn(pf)}) = ${tn(val)}$ ${inM(cur)}.`, 'val', val);
    return withCalc(Q('L7.exit', 7, body, chooseParts(items, 2, 3)), c.steps);
  }
  throw new Error('L7_exit: no valid draw');
}

export function L7_regression(force?: 'tax' | 'predict'): Question {
  for (let att = 0; att < 3000; att++) {
    const cur = pick([USD, EUR]), M = cur.M, name = co();
    const a = rstep(3, 8, 0.5), bg = rint(40, 100), br = rint(10, 30), bt = rint(5, 15);
    const g = rstep(0.02, 0.12, 0.005), r = rstep(0.07, 0.12, 0.005), t = pick([0.1, 0.15, 0.2, 0.25, 0.3]);
    const pred = a + bg * g - br * r - bt * t;
    if (pred < 2) continue;
    const ebitda = rstep(50, 1000, 10), act = pred * rstep(0.7, 1.3, 0.01), ev = roundTo(ebitda * act, 1), actual = ev / ebitda;
    const solveTax = force ? force === 'tax' : chance(0.4);
    const eqn = `EV/EBITDA = ${fmtNum(a, 1)} + ${bg} × (revenue growth) − ${br} × (cost of capital) − ${bt} × (tax rate)`;
    const c = calc();
    if (solveTax) {
      const tImp = (a + bg * g - br * r - actual) / bt;
      if (tImp < 0 || tImp > 0.5) continue;
      const body = p_(`A regression across the sector gives ${eqn}. ${name} has EBITDA of ${M(ebitda, 0)}, an enterprise value of ${M(ev, 0)}, revenue growth of ${pcs(g, 1)} and a cost of capital of ${pcs(r, 1)}. Assume it is fairly priced.`);
      const items: Item[] = [
        { part: N('What is the current EV/EBITDA?', actual, 'x', { key: 'act' }), w: 0.5 },
        { part: N(`What effective tax rate is implied for ${name}?`, tImp * 100, 'pct', { key: 'tImp' }), must: true },
      ];
      c.r(`**Actual multiple:** $\\frac{${tn(ev)}}{${tn(ebitda)}} = ${tn(actual)}$.`, 'act', actual);
      c.r(`**Solve:** $${tn(actual)} = ${tn(a)} + ${bg} \\times ${tn(g, 4)} - ${br} \\times ${tn(r, 4)} - ${bt}\\,t = ${tn(a + bg * g - br * r)} - ${bt}\\,t$, so $t = \\frac{${tn(a + bg * g - br * r)} - ${tn(actual)}}{${bt}} = ${tn(tImp * 100)}\\%$.`, 'tImp', tImp * 100);
      return withCalc(Q('L7.regression', 7, body, chooseParts(items, 1, 2)), c.steps);
    }
    const mis = actual / pred - 1;
    const body = p_(`A regression across the sector gives ${eqn}. ${name} has EBITDA of ${M(ebitda, 0)}, an enterprise value of ${M(ev, 0)}, revenue growth of ${pcs(g, 1)}, a cost of capital of ${pcs(r, 1)} and an effective tax rate of ${pcs(t, 0)}.`);
    const items: Item[] = [
      { part: N('What is the current EV/EBITDA?', actual, 'x', { key: 'act' }), w: 0.5 },
      { part: N('What EV/EBITDA does the regression predict?', pred, 'x', { key: 'pred' }), must: true },
      { part: N('What enterprise value does the predicted multiple imply?', pred * ebitda, cur.mUnit, { key: 'evp' }), w: 0.5 },
      { part: N('By how much is the actual multiple above the predicted one? (Enter a shortfall as a negative number.)', mis * 100, 'pct', { key: 'mis' }), w: 0.5 },
      { part: C(`Relative to the sector, ${name} looks`, ['Overvalued', 'Undervalued'], mis > 0 ? 0 : 1, 'verdict'), w: 0.4 },
    ];
    c.r(`**Actual multiple:** $\\frac{${tn(ev)}}{${tn(ebitda)}} = ${tn(actual)}$.`, 'act', actual);
    c.r(`**Predicted multiple:** $${tn(a)} + ${bg} \\times ${tn(g, 4)} - ${br} \\times ${tn(r, 4)} - ${bt} \\times ${tn(t)} = ${tn(a)} + ${tn(bg * g)} - ${tn(br * r)} - ${tn(bt * t)} = ${tn(pred)}$.`, 'pred', pred);
    c.r(`**Implied EV:** $${tn(pred)} \\times ${tn(ebitda)} = ${tn(pred * ebitda)}$ ${inM(cur)}.`, 'evp', pred * ebitda);
    c.r(`**Gap:** $\\frac{${tn(actual)}}{${tn(pred)}} - 1 = ${tn(mis * 100)}\\%$.`, 'mis', mis * 100);
    c.r(`**Verdict:** the market multiple is ${mis > 0 ? 'above' : 'below'} what the fundamentals predict, so ${name} looks ${mis > 0 ? 'overvalued' : 'undervalued'}.`, 'verdict');
    return withCalc(Q('L7.regression', 7, body, chooseParts(items, 2, 4)), c.steps);
  }
  throw new Error('L7_regression: no valid draw');
}

