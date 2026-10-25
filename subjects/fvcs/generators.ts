// Firm Value and Capital Structure: procedural generators for numeric questions.
// Every question draws a new fictional firm and new numbers; solutions are computed from the same inputs.
import { C, N, P, Q, chance, chooseParts, co, eur, fmtNum, mk, p_, pick, poss, r2, rint, roundTo, rstep, sh, shuffle, table, ul, v, type Item } from '@/lib/engine/gen-helpers';
import type { Part, Question } from '@/lib/engine/types';

const PERF = () => v('Assume perfect capital markets.', 'Assume a perfect capital market setting.', 'Capital markets are perfect.', 'Assume there are no taxes, transaction costs or other market imperfections.');
const TAXONLY = () => v('Assume that the only market imperfection is the corporate tax.', 'Corporate taxes are the only market imperfection.', 'Ignore all market imperfections other than corporate taxes.');

// =====================================================================
// LECTURE 1 — Capital structure in a perfect market
// =====================================================================
export function L1_project(): Question {
  const rf = rstep(0.02, 0.06, 0.005), prem = rstep(0.04, 0.12, 0.01), rU = rf + prem;
  const L = rstep(60, 300, 10) * 1000, H = L + rstep(40, 260, 10) * 1000;
  const p = chance(0.6) ? 0.5 : pick([0.4, 0.6, 0.3, 0.7, 0.45, 0.55, 0.35, 0.65]);
  const ECF = p * H + (1 - p) * L, VU = ECF / (1 + rU);
  const I = Math.round(VU * rstep(0.55, 0.9, 0.01) / 1000) * 1000;
  const psVar = chance(0.5) && I * (1 + rf) <= L;
  const D = psVar ? I : Math.max(1000, Math.round(L / (1 + rf) * rstep(0.35, 0.95, 0.05) / 1000) * 1000);
  const E = VU - D, rep = D * (1 + rf), eH = H - rep, eL = L - rep;
  const rE = (p * eH + (1 - p) * eL) / E - 1;
  const name = co();
  const prob = p === 0.5 ? v('with each outcome being equally likely', 'both outcomes being equally likely', 'each with a probability of 50%')
    : v(`the high cash flow occurring with a probability of ${P(p)}`, `where the probability of the high outcome is ${P(p)}`);
  const tpl = rint(0, 2);
  const strongW = tpl === 1 ? 'strong' : v('strong', 'good', 'high'), weakW = { strong: 'weak', good: 'bad', high: 'low' }[strongW];
  const intro = [
    `Consider a project with free cash flows in one year of ${eur(L)} or ${eur(H)}, ${prob}. The initial investment required for the project is ${eur(I)}, and the project's cost of capital is ${P(rU)}. The risk-free interest rate is ${P(rf)}. ${PERF()}`,
    `${name} is evaluating an investment opportunity that requires ${eur(I)} today. Next year, the project will generate cash flows of ${eur(H)} if the economy is strong and ${eur(L)} if the economy is weak, ${prob}. Because the cash flows depend on the overall economy, investors demand a risk premium of ${P(prem)} over the current risk-free interest rate of ${P(rf)}. ${PERF()}`,
    `An entrepreneur considers a venture costing ${eur(I)}. In one year, the venture pays off either ${eur(L)} (${weakW} state) or ${eur(H)} (${strongW} state), ${prob}. The appropriate cost of capital for the venture is ${P(rU)}, and the risk-free rate is ${P(rf)}. ${PERF()}`][tpl];
  const who = tpl === 1 ? 'the firm' : 'the entrepreneur';
  const debt = psVar ? v(`For the parts involving leverage, suppose the initial ${eur(I)} is instead raised by borrowing at the risk-free interest rate.`, `Alternatively, the entire investment of ${eur(I)} can be financed with a one-year loan at the risk-free rate.`)
    : v(`Alternatively, ${who} can borrow ${eur(D)} at the risk-free rate and sell equity for the remainder.`, `Where leverage is concerned, assume ${who} borrows ${eur(D)} at the risk-free interest rate in addition to selling equity.`);
  // reverse target
  let D2 = Math.round(L / (1 + rf) * rstep(0.3, 0.95, 0.05) / 1000) * 1000; if (Math.abs(D2 - D) < 2000) D2 = Math.round(D * 0.6 / 1000) * 1000;
  const rt = Math.round((rU + D2 / (VU - D2) * (rU - rf)) * 10000) / 10000;
  const k = (rt - rU) / (rU - rf), Dt = VU * k / (1 + k);
  const items: Item[] = [
    { part: N(v('What is the NPV of this project?', 'Compute the net present value of the project.'), VU - I, 'eur'), w: 0.7 },
    { part: N(v('If the project is financed entirely with equity, what is the initial market value of the unlevered equity?', 'Suppose the project is sold to investors as an all-equity firm. How much money can be raised in this way?'), VU, 'eur'), w: 0.6 },
    { part: [N(`What are the cash flows of the levered equity in the ${tpl === 1 ? 'weak economy' : weakW + ' state'}?`, eL, 'eur'), N(`… and in the ${tpl === 1 ? 'strong economy' : strongW + ' state'}?`, eH, 'eur')], w: 0.45 },
    { part: N(v('According to MM, what is the initial value of the levered equity?', 'What is the market value of the levered equity today?'), E, 'eur'), must: true },
    { part: N(v('What is the expected return on the levered equity?', 'What expected return will levered equity holders earn?'), rE * 100, 'pct'), w: 0.75 },
    { part: N(`What is the realized return on levered equity in the ${tpl === 1 ? 'weak economy' : weakW + ' state'}? (Enter a negative return with a minus sign.)`, (eL / E - 1) * 100, 'pct'), w: 0.3 },
    { part: N(`Instead of ${eur(D)}, how much would the firm have to borrow at the risk-free rate for the expected return on levered equity to equal ${P(rt)}?`, Dt, 'eur'), w: 0.3 },
  ];
  return Q('L1.project', 1, p_(intro) + p_(debt), chooseParts(items, 3, 5));
}

export function L1_mm2(): Question {
  const name = co();
  if (chance(0.55)) {
    const DE0 = rstep(0.25, 1.5, 0.05), rD0 = rstep(0.03, 0.07, 0.0025), rE0 = rD0 + rstep(0.04, 0.10, 0.001);
    const rU = (rE0 + DE0 * rD0) / (1 + DE0);
    const down = chance(0.5);
    let DE1 = down ? Math.max(0.1, +(DE0 - rstep(0.1, 0.6, 0.05)).toFixed(2)) : +(DE0 + rstep(0.1, 0.8, 0.05)).toFixed(2);
    let rD1 = down ? rD0 - rstep(0.0025, 0.01, 0.0025) : rD0 + rstep(0.0025, 0.01, 0.0025);
    if (rD1 >= rU - 0.005) rD1 = rD0;
    const rE1 = rU + DE1 * (rU - rD1);
    const action = down ? v('issue equity and use the proceeds to repay debt', 'raise new equity and retire part of its debt') : v('borrow and use the proceeds to repurchase shares', 'issue debt and buy back shares');
    const useDV = chance(0.3);
    const lev0 = useDV ? `debt finances ${P(DE0 / (1 + DE0), 2)} of ${poss(name)} market value` : `${name} has a market debt-equity ratio of ${fmtNum(DE0)}`;
    const lev1 = useDV ? `debt makes up ${P(DE1 / (1 + DE1), 2)} of firm value` : `its debt-equity ratio becomes ${fmtNum(DE1)}`;
    const intro = v(
      `${name} has a market debt-equity ratio of ${fmtNum(DE0)}. Its current debt cost of capital is ${P(rD0)} and its equity cost of capital is ${P(rE0)}. The firm plans to ${action} so that ${lev1}. This will change its debt cost of capital to ${P(rD1)}. ${PERF()}`,
      `Currently, ${lev0}. Its equity cost of capital is ${P(rE0)} and its debt cost of capital is ${P(rD0)}. Management intends to ${action} such that ${lev1}; the debt cost of capital would then be ${P(rD1)}. ${PERF()}`);
    const ttarget = Math.round((rU + rstep(0.2, 2.0, 0.05) * (rU - rD1)) * 1000) / 1000;
    const items = [
      { part: N(v(`What is ${poss(name)} current WACC?`, 'What is the firm’s weighted average cost of capital before the transaction?'), rU * 100, 'pct'), w: 0.75 },
      { part: N(v('What will the equity cost of capital be after the transaction?', 'What is the new equity cost of capital?'), rE1 * 100, 'pct'), must: true },
      { part: N(v('What is the WACC after the transaction?', 'What will the firm’s WACC be after the transaction?'), rU * 100, 'pct'), w: 0.6 },
      { part: N(`Assuming the debt cost of capital stays at ${P(rD1)}, at what debt-equity ratio would the equity cost of capital be ${P(ttarget, 1)}?`, (ttarget - rU) / (rU - rD1), 'x'), w: 0.4 },
    ];
    return Q('L1.mm2', 1, p_(intro), chooseParts(items, 3, 4));
  } else {
    const E0 = rstep(200, 2000, 20), DE0 = rstep(0.1, 0.8, 0.05), D0 = roundTo(E0 * DE0, 10);
    const rD0 = rstep(0.03, 0.06, 0.0025), rE0 = rD0 + rstep(0.04, 0.09, 0.0025);
    const rU = (E0 * rE0 + D0 * rD0) / (E0 + D0);
    const X = roundTo((E0 + D0) * rstep(0.05, 0.25, 0.01), 10), rD1 = rD0 + rstep(0.0025, 0.0125, 0.0025);
    const D1 = D0 + X, E1 = E0 - X, rE1 = rU + D1 / E1 * (rU - rD1);
    const M = mk();
    const intro = `${name} has equity with a market value of ${M(E0)} and debt with a market value of ${M(D0)}. Its equity cost of capital is ${P(rE0)} and its debt cost of capital is ${P(rD0)}. ${name} ${v('announces that it will', 'plans to')} borrow an additional ${M(X)} and use the full amount to repurchase shares. Because of the higher leverage, the cost of all of its debt will rise to ${P(rD1)}. ${PERF()}`;
    const items = [
      { part: N(v('What is the unlevered cost of capital of the firm?', 'What is the cost of capital of the firm’s assets?'), rU * 100, 'pct'), w: 0.7 },
      { part: N('What is the debt-equity ratio after the transaction?', D1 / E1, 'x'), w: 0.5 },
      { part: N(v('What is the equity cost of capital after the transaction?', 'What expected return will equity holders require after the recapitalization?'), rE1 * 100, 'pct'), must: true },
      { part: N('What is the WACC after the transaction?', rU * 100, 'pct'), w: 0.5 },
    ];
    return Q('L1.mm2', 1, p_(intro), chooseParts(items, 3, 4));
  }
}

export function L1_recap(): Question {
  const name = co(), M = mk();
  const Nsh = rstep(10, 200, 5), Pr = rstep(4, 80, 0.5), V = Nsh * Pr;
  const D = Math.max(5, roundTo(V * rstep(0.1, 0.6, 0.01), V > 500 ? 10 : 5));
  const rU = rstep(0.08, 0.14, 0.0025), rD = rstep(0.03, 0.065, 0.0025);
  const E1 = V - D, n = D / Pr, rE1 = rU + D / E1 * (rU - rD);
  if (chance(0.25)) {
    const remain = Nsh - roundTo(Nsh * rstep(0.1, 0.5, 0.01), 0.5);
    const Dd = (Nsh - remain) * Pr;
    const intro = `${name} is an all-equity firm with ${fmtNum(Nsh)} million shares outstanding, trading at ${eur(Pr)} per share. Its equity cost of capital is ${P(rU)}. ${name} undertakes a leveraged recapitalization: it borrows at ${P(rD)} and uses the entire proceeds to repurchase shares. After the transaction, ${fmtNum(remain)} million shares remain outstanding. ${PERF()}`;
    const DE = Dd / (remain * Pr);
    const parts = [
      N('How much did the firm borrow?', Dd, 'm'),
      N('What is the share price after the transaction?', Pr, 'eur'),
      N('What is the market value of equity after the transaction?', remain * Pr, 'm'),
      N('What is the equity cost of capital after the transaction?', (rU + DE * (rU - rD)) * 100, 'pct'),
    ];
    return Q('L1.recap', 1, p_(intro), parts);
  }
  const intro = v(
    `${name} is currently an all-equity firm with ${fmtNum(Nsh)} million shares outstanding that trade at ${eur(Pr)} per share. ${name} plans to increase its leverage by borrowing ${M(D)} and using the funds to repurchase shares. The firm’s current equity cost of capital is ${P(rU)}, and the new debt will carry an interest rate of ${P(rD)}. ${PERF()}`,
    `Assume ${name} has ${fmtNum(Nsh)} million shares outstanding with a market price of ${eur(Pr)} per share and no debt. Its equity holders currently require a return of ${P(rU)}. Management considers borrowing ${M(D)} at ${P(rD)} and using all the borrowed funds to repurchase outstanding shares. ${PERF()}`);
  const items: Item[] = [
    { part: N(v('How many shares will be repurchased?', 'How many shares can the firm buy back?'), n, 'msh'), w: 0.7 },
    { part: N('What is the share price after the transaction?', Pr, 'eur'), w: 0.6 },
    { part: N(v('What is the market value of equity after the transaction?', 'What is the total value of the remaining equity?'), E1, 'm'), w: 0.6 },
    { part: N('What is the market debt-equity ratio after the transaction?', D / E1, 'x'), w: 0.3 },
    { part: N(v('What is the equity cost of capital after the transaction?', 'What expected return will the remaining shareholders require?'), rE1 * 100, 'pct'), must: true },
    { part: N('What is the firm’s WACC after the transaction?', rU * 100, 'pct'), w: 0.3 },
  ];
  return Q('L1.recap', 1, p_(intro), chooseParts(items, 3, 5));
}

export function L1_eps(): Question {
  const name = co(), M = mk();
  const Nsh = rstep(5, 50, 1), rUt = rstep(0.08, 0.16, 0.0025), EBIT = rstep(5, 60, 0.5);
  const Pr = Math.round(EBIT / Nsh / rUt * 4) / 4; const rU = EBIT / (Nsh * Pr);
  const n = Math.max(0.5, roundTo(Nsh * rstep(0.1, 0.5, 0.01), 0.5)), D = n * Pr;
  let rD = rstep(0.04, 0.08, 0.0025); if (rD >= rU - 0.01) rD = rU - 0.02;
  const EPS0 = EBIT / Nsh, EPS1 = (EBIT - rD * D) / (Nsh - n), E1 = Nsh * Pr - D, rE1 = rU + D / E1 * (rU - rD);
  const EBITlow = roundTo(EBIT * rstep(0.4, 0.8, 0.05), 0.5);
  const intro = v(
    `${name} is currently an all-equity firm. It expects to generate earnings before interest and taxes (EBIT) of ${M(EBIT)} over the next year and every year thereafter. ${name} has ${fmtNum(Nsh)} million shares outstanding, and its stock trades for ${eur(Pr)} per share. The firm is considering changing its capital structure by borrowing ${M(D)} at an interest rate of ${P(rD)} and using the proceeds to repurchase shares at ${eur(Pr)} per share. There are no taxes, EBIT is not expected to grow, and all earnings are paid out as dividends. ${PERF()}`,
    `${name} has no debt and ${fmtNum(Nsh)} million shares outstanding at a price of ${eur(Pr)}. Its EBIT is expected to remain constant at ${M(EBIT)} per year forever, and it pays out all earnings as dividends. The CFO proposes a recapitalization: borrow ${M(D)} at ${P(rD)} per year and buy back shares at the current price. Assume there are no taxes and perfect capital markets otherwise.`);
  const items: Item[] = [
    { part: N(v('What is the firm’s unlevered cost of capital implied by the current share price?', 'What is the equity cost of capital of the all-equity firm?'), rU * 100, 'pct'), w: 0.5 },
    { part: N('What is the expected EPS without leverage?', EPS0, 'eur'), w: 0.45 },
    { part: N(v('What is the expected EPS after the recapitalization?', 'What will expected earnings per share be with leverage?'), EPS1, 'eur'), must: true },
    { part: N('What is the equity cost of capital after the recapitalization?', rE1 * 100, 'pct'), w: 0.7 },
    { part: N('What is the share price after the recapitalization?', Pr, 'eur'), w: 0.5 },
    { part: N(`Suppose EBIT instead turns out to be only ${M(EBITlow)} in a given year. What is EPS in that year with leverage?`, (EBITlow - rD * D) / (Nsh - n), 'eur'), w: 0.3 },
  ];
  return Q('L1.eps', 1, p_(intro), chooseParts(items, 3, 5));
}

export function L1_beta(): Question {
  const name = co();
  const bE = rstep(0.8, 2.0, 0.05), bD = pick([0, 0, 0.1, 0.15, 0.2, 0.25]), DE0 = rstep(0.2, 1.5, 0.05);
  const bU = (bE + DE0 * bD) / (1 + DE0);
  const DE1 = Math.max(0.1, +(DE0 + pick([-1, 1]) * rstep(0.2, 0.8, 0.05)).toFixed(2)), bD1 = bD;
  const bE1 = bU + DE1 * (bU - bD1);
  const rf = rstep(0.02, 0.05, 0.0025), mrp = rstep(0.04, 0.07, 0.0025);
  const useMrp = chance(0.5);
  const mkt = useMrp ? `the market risk premium is ${P(mrp)}` : `the expected return on the market is ${P(rf + mrp)}`;
  const intro = `${poss(name)} equity has a beta of ${fmtNum(bE)} and its debt has a beta of ${fmtNum(bD)}. The firm has a market debt-equity ratio of ${fmtNum(DE0)}. The risk-free rate is ${P(rf)}, and ${mkt}. ${PERF()}`;
  const plan = v(`${name} plans to change its debt-equity ratio to ${fmtNum(DE1)}, keeping the beta of its debt unchanged.`, `Suppose ${name} recapitalizes to a debt-equity ratio of ${fmtNum(DE1)}; the debt beta stays at ${fmtNum(bD1)}.`);
  const items: Item[] = [
    { part: N(v(`What is ${poss(name)} unlevered beta?`, 'What is the beta of the firm’s assets?'), bU, 'x'), must: true },
    { part: N('What is the firm’s unlevered cost of capital?', (rf + bU * mrp) * 100, 'pct'), w: 0.45 },
    { part: N('What will the equity beta be after the recapitalization?', bE1, 'x'), must: true },
    { part: N('What will the equity cost of capital be after the recapitalization?', (rf + bE1 * mrp) * 100, 'pct'), w: 0.6 },
    { part: N('What is the WACC after the recapitalization?', (rf + bU * mrp) * 100, 'pct'), w: 0.25 },
  ];
  return Q('L1.beta', 1, p_(intro) + p_(plan), chooseParts(items, 3, 4));
}

export function L1_homemade(): Question {
  const name = co(), M = mk();
  const rf = rstep(0.02, 0.06, 0.005);
  const L = rstep(40, 300, 5), H = L + rstep(30, 300, 5);
  const V = roundTo((L + H) / 2 / (1 + rstep(0.08, 0.16, 0.01)), 1);
  const D = roundTo(L / (1 + rf) * rstep(0.3, 0.9, 0.05), 1);
  const E = V - D;
  const alpha = pick([0.01, 0.02, 0.05, 0.1, 0.005, 0.03, 0.04]);
  const st = v('weak economy', 'recession', 'bad state'), stg = { 'weak economy': 'strong economy', 'recession': 'boom', 'bad state': 'good state' }[st];
  const intro0 = `${name} will generate a cash flow of either ${M(H)} (${stg}) or ${M(L)} (${st}) next year, after which it will be liquidated. The risk-free interest rate is ${P(rf)}. ${PERF()}`;
  if (chance(0.5)) {
    const intro = intro0 + ' ' + `${name} is all-equity financed with a total market value of ${M(V)}. An investor would prefer ${name} to have borrowed ${M(D)} at the risk-free rate, and wants to hold ${P(alpha, 1)} of the levered equity that would exist in that case. The investor can borrow at the risk-free rate as well.`;
    const items = [
      { part: N(v('How much must the investor borrow to replicate this position (homemade leverage)?', 'What amount of personal borrowing replicates the desired position?'), alpha * D * 1e6, 'eur'), must: true },
      { part: N('How much of the investor’s own money is required?', alpha * E * 1e6, 'eur'), w: 0.7 },
      { part: N(`What is the investor’s net payoff next year in the ${st}?`, alpha * (L - D * (1 + rf)) * 1e6, 'eur'), w: 0.7 },
      { part: N(`What is the investor’s net payoff next year in the ${stg}?`, alpha * (H - D * (1 + rf)) * 1e6, 'eur'), w: 0.5 },
    ];
    return Q('L1.homemade', 1, p_(intro), chooseParts(items, 3, 4));
  } else {
    const intro = intro0 + ' ' + `${name} has risk-free debt outstanding with a market value of ${M(D)}, and the total market value of the firm is ${M(V)}. An investor would prefer to hold unlevered equity and wants exposure equal to ${P(alpha, 1)} of the firm’s total cash flows.`;
    const items = [
      { part: N('How much must the investor invest in the firm’s equity?', alpha * E * 1e6, 'eur'), must: true },
      { part: N('How much must the investor invest in the firm’s debt?', alpha * D * 1e6, 'eur'), must: true },
      { part: N(`What is the investor’s total payoff next year in the ${st}?`, alpha * L * 1e6, 'eur'), w: 0.7 },
      { part: N('What is the total cost of this position?', alpha * V * 1e6, 'eur'), w: 0.5 },
    ];
    return Q('L1.homemade', 1, p_(intro), chooseParts(items, 3, 4));
  }
}

// =====================================================================
// LECTURE 2 — Debt and taxes
// =====================================================================
const annuity = (Cf: number, r: number, n: number) => Cf / r * (1 - 1 / Math.pow(1 + r, n));
const TAXR = [0.15, 0.2, 0.21, 0.25, 0.25, 0.3, 0.3, 0.35, 0.39, 0.4, 0.28, 0.32];

export function L2_itsFinite(): Question {
  const name = co(), M = mk();
  const tc = pick(TAXR), rf = rstep(0.02, 0.07, 0.0025);
  const vr = Math.random();
  if (vr < 0.45) {
    const B = rstep(100, 2000, 50), c = rstep(0.03, 0.09, 0.0025), Nn = rint(4, 15), I = B * c;
    const useC = chance(0.5);
    const intro = useC ? `${name} issues bonds with a face value of ${M(B)} and an annual coupon rate of ${P(c)}. It will pay the coupons each year for the next ${Nn} years and repay the principal in year ${Nn}. These payments are risk-free, ${poss(name)} marginal corporate tax rate will remain ${P(tc, 0)} throughout this period, and the risk-free interest rate is ${P(rf)}.`
      : `Suppose ${name} plans to pay ${M(I)} in interest each year for the next ${Nn} years and then repay the principal of ${M(B)} in year ${Nn}. These payments are risk-free, and ${poss(name)} marginal tax rate will remain ${P(tc, 0)} throughout this period. The risk-free interest rate is ${P(rf)}.`;
    const items = [
      { part: N('What is the annual interest tax shield?', tc * I, 'm'), w: 0.5 },
      { part: N(v('By how much does the interest tax shield increase the value of the firm?', 'What is the present value of the interest tax shield?'), annuity(tc * I, rf, Nn), 'm'), must: true },
      { part: N(`Suppose instead that ${name} keeps the debt outstanding permanently, paying the same interest every year. What would the present value of the interest tax shield be?`, tc * I / rf, 'm'), w: 0.35 },
    ];
    return Q('L2.itsFinite', 2, p_(intro), chooseParts(items, 2, 3));
  } else if (vr < 0.7) {
    const I1 = rstep(10, 120, 5), n1 = rint(3, 6), I2 = roundTo(I1 * rstep(0.4, 1.6, 0.1), 1), n2 = rint(3, 8);
    const pv1 = annuity(tc * I1, rf, n1), pv2 = annuity(tc * I2, rf, n2) / Math.pow(1 + rf, n1);
    const intro = `${name} has arranged its debt so that it will pay interest of ${M(I1)} per year for the next ${n1} years. After refinancing in year ${n1}, it will pay ${M(I2)} per year for the following ${n2} years, after which all debt is repaid. All payments are risk-free, the corporate tax rate is ${P(tc, 0)} throughout, and the risk-free rate is ${P(rf)}.`;
    const parts = [
      N(`What is the present value of the interest tax shields over the first ${n1} years?`, pv1, 'm'),
      N('What is the total present value of the interest tax shield?', pv1 + pv2, 'm'),
    ];
    return Q('L2.itsFinite', 2, p_(intro), chance(0.5) ? parts : [parts[1]]);
  } else {
    const yrs = rint(4, 5), y0 = rint(2026, 2030), ints = []; let x = rstep(20, 120, 5);
    for (let i = 0; i < yrs; i++) { ints.push(x); x = roundTo(x * rstep(0.9, 1.4, 0.05), 5); }
    const ebit = ints.map(i => roundTo(i * rstep(4, 12, 0.5), 1));
    const rows = [['EBIT', ...ebit.map(e => fmtNum(e))], ['Interest expense', ...ints.map(i => '−' + fmtNum(i))]];
    const head = ['(€ million)', ...Array.from({ length: yrs }, (_, i) => String(y0 + i))];
    const tot = ints.reduce((a, b) => a + b, 0) * tc;
    const pv = ints.reduce((a, b, i) => a + tc * b / Math.pow(1 + rf, i + 1), 0);
    const intro = `Shown below is part of the pro-forma income statement of ${name}. Its marginal corporate tax rate is ${P(tc, 0)}, interest payments are risk-free, and the risk-free rate is ${P(rf)}. Assume that the first year shown ends one year from today.`;
    const items = [
      { part: N(`What is the interest tax shield in ${y0 + 1}?`, tc * ints[1], 'm'), w: 0.4 },
      { part: N('By how much does the interest tax shield increase the total amount the firm can pay to its investors over the period shown?', tot, 'm'), w: 0.7 },
      { part: N('What is the present value today of the interest tax shields over the period shown?', pv, 'm'), w: 0.8 },
      { part: N(`What is net income in ${y0 + yrs - 1}?`, (ebit[yrs - 1] - ints[yrs - 1]) * (1 - tc), 'm'), w: 0.3 },
    ];
    return Q('L2.itsFinite', 2, p_(intro) + table(head, rows), chooseParts(items, 2, 3));
  }
}

export function L2_income(): Question {
  const name = co(), M = mk();
  const tc = pick(TAXR), EBIT = rstep(200, 5000, 50);
  if (chance(0.55)) {
    const Int = roundTo(EBIT * rstep(0.08, 0.35, 0.01), 5);
    const NIL = (EBIT - Int) * (1 - tc), NIU = EBIT * (1 - tc);
    const intro = `${name} expects earnings before interest and taxes of ${M(EBIT)} this year and has interest expenses of ${M(Int)}. Its marginal corporate tax rate is ${P(tc, 0)}.`;
    const items = [
      { part: N('What is net income with leverage?', NIL, 'm'), w: 0.6 },
      { part: N('What would net income be without leverage?', NIU, 'm'), w: 0.4 },
      { part: N('What is the total amount available to all investors (debt and equity holders) with leverage?', NIL + Int, 'm'), must: true },
      { part: N(v('By how much does leverage increase the total amount paid to investors?', 'What is the interest tax shield this year?'), tc * Int, 'm'), w: 0.6 },
    ];
    return Q('L2.income', 2, p_(intro), chooseParts(items, 3, 4));
  } else {
    const lim = pick([0.3, 0.3, 0.25, 0.3]), cap = lim * EBIT;
    const Int = roundTo(cap * rstep(0.5, 1.9, 0.05), 5);
    const ded = Math.min(Int, cap), tax = (EBIT - ded) * tc, NI = EBIT - Int - tax;
    const intro = `${name} has EBIT of ${M(EBIT)} and interest expense of ${M(Int)}. The corporate tax rate is ${P(tc, 0)}. The interest deduction is limited to ${P(lim, 0)} of EBIT; interest above this limit cannot be deducted in the current year.`;
    const items = [
      { part: N('What is the allowed interest deduction?', ded, 'm'), w: 0.5 },
      { part: N('What are the firm’s taxes?', tax, 'm'), w: 0.6 },
      { part: N('What is net income?', NI, 'm'), w: 0.6 },
      { part: N('What are the tax savings from leverage compared with an all-equity firm?', ded * tc, 'm'), must: true },
      { part: N('What is the maximum interest expense that would still be fully tax-deductible this year?', cap, 'm'), w: 0.35 },
    ];
    return Q('L2.income', 2, p_(intro), chooseParts(items, 3, 4));
  }
}

export function L2_recapTax(): Question {
  const name = co(), M = mk();
  const Nsh = rstep(5, 120, 1), Pr = rstep(5, 120, 0.5), VU = Nsh * Pr, tc = pick(TAXR);
  const D = Math.max(10, roundTo(VU * rstep(0.08, 0.4, 0.01), VU > 1000 ? 50 : 10));
  const rf = rstep(0.02, 0.06, 0.005);
  const ITS = tc * D, VL = VU + ITS, E = VL - D, P1 = VL / Nsh, n = D / P1;
  if (chance(0.2)) {
    // reverse: infer tax rate from announcement price
    const intro = `${name} has ${fmtNum(Nsh)} million shares outstanding at ${eur(Pr)} per share and no debt. It announces that it will borrow ${M(D)} on a permanent basis and use the proceeds to repurchase shares. On the announcement, the share price rises to ${eur(P1)}. ${TAXONLY()}`;
    const parts = [N('What marginal corporate tax rate is the market assuming?', tc * 100, 'pct'),
    N('How many shares will the firm repurchase?', n, 'msh'), N('What is the market value of equity after the repurchase?', E, 'm')];
    return Q('L2.recapTax', 2, p_(intro), chance(0.5) ? parts : parts.slice(0, 2));
  }
  const intro = v(
    `Assume a company that currently has ${fmtNum(Nsh)} million shares outstanding with a market price of ${eur(Pr)} per share. The company is all-equity financed, has consistently stable earnings, and pays a corporate tax rate of ${P(tc, 0)}. Management considers the following transaction: borrow ${M(D)} on a permanent basis at the risk-free interest rate of ${P(rf)} and use all the borrowed funds to repurchase outstanding shares. ${TAXONLY()}`,
    `${name} wants to boost its stock price. It currently has ${fmtNum(Nsh)} million shares outstanding trading at ${eur(Pr)} per share and no debt. ${name} has had stable earnings and pays a ${P(tc, 0)} corporate tax rate. Management plans to borrow ${M(D)} permanently and use the funds to buy back shares. ${TAXONLY()}`);
  const tauI = pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4]);
  const tauE = chance(0.35) ? tauI : pick([0.1, 0.15, 0.2, 0.25, 0.3]);
  const tstar = 1 - (1 - tc) * (1 - tauE) / (1 - tauI);
  const Pfd = roundTo(Pr + (P1 - Pr) * rstep(0.2, 0.8, 0.05), 0.01);
  const items: Item[] = [
    { part: N('What is the present value of the interest tax shield?', ITS, 'm'), w: 0.4 },
    { part: N(v('What is the firm value after the transaction?', 'What is the value of the levered firm?'), VL, 'm'), w: 0.55 },
    { part: N('What is the equity value after the transaction?', E, 'm'), w: 0.55 },
    { part: N(v('What is the share price after the announcement?', 'At what price will the shares be repurchased?'), P1, 'eur'), must: true },
    { part: N('How many shares will be repurchased?', n, 'msh'), w: 0.6 },
    { part: N('Suppose that, in addition to the corporate tax, investors pay personal taxes: ' + `${P(tauI, 0)} on interest income and ${P(tauE, 0)} on equity income. What is the present value of the interest tax shield under these assumptions?`, tstar * D, 'm'), w: 0.35 },
    { part: N(`Suppose instead that corporate taxes and financial distress costs are the only imperfections, and the share price rises only to ${eur(Pfd)} on the announcement. What is the present value of the financial distress costs implied by this price?`, (P1 - Pfd) * Nsh, 'm'), w: 0.25 },
  ];
  let parts = chooseParts(items, 3, 5);
  return Q('L2.recapTax', 2, p_(intro), parts);
}

export function L2_target(): Question {
  const name = co(), M = mk();
  let FCF = 0, g = 0, rE = 0, rD = 0, tc = 0, DE = 0, wpre = 0, w = 0;
  for (let t = 0; t < 50; t++) {
    FCF = rstep(1, 20, 0.25); g = rstep(0.01, 0.04, 0.005); rE = rstep(0.07, 0.14, 0.005); rD = rstep(0.03, Math.min(0.07, rE - 0.02), 0.005);
    tc = pick(TAXR); DE = rstep(0.25, 2.5, 0.25);
    wpre = (rE + DE * rD) / (1 + DE); w = (rE + DE * rD * (1 - tc)) / (1 + DE);
    if (w - g > 0.012) break;
  }
  const VU = FCF / (wpre - g), VL = FCF / (w - g), ITS = VL - VU;
  const rr = (x: number) => Math.round(x * 10000) / 10000;
  const VUr = FCF / (rr(wpre) - g), VLr = FCF / (rr(w) - g);
  const useDV = chance(0.3);
  const lev = useDV ? `maintains debt at ${P(DE / (1 + DE), 2)} of its total market value` : `maintains a debt-equity ratio of ${fmtNum(DE)}`;
  const intro = v(
    `${name} expects to have free cash flow in the coming year of ${M(FCF)}. Its free cash flow is expected to grow at a rate of ${P(g, 1)} per year thereafter. ${name} has an equity cost of capital of ${P(rE, 1)}, a debt cost of capital of ${P(rD, 1)}, and it pays a corporate tax rate of ${P(tc, 0)}. ${name} ${lev}. ${TAXONLY()}`,
    `Next year, ${name} will generate free cash flow of ${M(FCF)}, growing at ${P(g, 1)} per year forever. The firm ${lev} at all times. Its equity holders require ${P(rE, 1)} and its lenders ${P(rD, 1)}; the corporate tax rate is ${P(tc, 0)}. ${TAXONLY()}`);
  const items: Item[] = [
    { part: N('What is the pretax WACC?', wpre * 100, 'pct'), w: 0.35 },
    { part: N('What is the unlevered value of the firm?', VU, 'm', { alts: [VUr] }), w: 0.35 },
    { part: N('What is the (after-tax) WACC?', w * 100, 'pct'), w: 0.35 },
    { part: N('What is the value of the levered firm?', VL, 'm', { alts: [VLr] }), w: 0.35 },
    { part: N(v('What is the present value of the interest tax shield?', 'What is the value of the interest tax shield?'), ITS, 'm', { alts: [VLr - VUr] }), must: true },
    { part: N('What is the market value of the firm’s debt?', VL * DE / (1 + DE), 'm', { alts: [VLr * DE / (1 + DE)] }), w: 0.2 },
  ];
  return Q('L2.target', 2, p_(intro), chooseParts(items, 1, 4));
}

export function L2_personal(): Question {
  const name = co(), M = mk();
  const tc = pick(TAXR), ti = pick([0.15, 0.2, 0.25, 0.3, 0.34, 0.35, 0.37, 0.4, 0.45]);
  let te, eqText;
  if (chance(0.3)) {
    const td = pick([0.15, 0.2, 0.25, 0.3]), tg = pick([0.1, 0.15, 0.2, 0.25]), po = pick([0.4, 0.5, 0.6, 0.7]);
    te = po * td + (1 - po) * tg;
    eqText = `dividends are taxed at ${P(td, 0)} and capital gains at ${P(tg, 0)}. The firm pays out ${P(po, 0)} of its equity income as dividends; the remainder is realized as capital gains each year, so the average tax rate on equity income is the payout-weighted average of the two rates`;
  } else { te = pick([0.1, 0.15, 0.2, 0.25, 0.28, 0.3, 0.35]); eqText = `the personal tax rate on equity income is ${P(te, 0)}`; }
  const tstar = 1 - (1 - tc) * (1 - te) / (1 - ti);
  const VU = rstep(200, 3000, 50), D = roundTo(VU * rstep(0.1, 0.5, 0.05), 10);
  const intro = `${name} pays a corporate tax rate of ${P(tc, 0)}. Its investors pay a personal tax rate of ${P(ti, 0)} on interest income, and ${eqText}.`;
  const items: Item[] = [
    { part: N('How much does a debt holder receive after all taxes from €1 of EBIT paid out as interest?', 1 - ti, 'eur'), w: 0.35 },
    { part: N('How much does an equity holder receive after all taxes from €1 of EBIT paid out to equity?', (1 - tc) * (1 - te), 'eur'), w: 0.35 },
    { part: N(v('What is the effective tax advantage of debt?', 'What is τ*, the effective tax advantage of debt?'), tstar * 100, 'pct'), must: true },
    { part: N(`The unlevered value of ${name} is ${M(VU)}. If it adds ${M(D)} of permanent debt, what is its value with leverage?`, VU + tstar * D, 'm'), w: 0.5 },
    { part: N('Holding the other tax rates fixed, at what personal tax rate on interest income would debt have no tax advantage at all?', (1 - (1 - tc) * (1 - te)) * 100, 'pct'), w: 0.3 },
  ];
  return Q('L2.personal', 2, p_(intro), chooseParts(items, 2, 4));
}

export function L2_hamada(): Question {
  const name = co(), comp = co();
  const tc = pick(TAXR), bLc = rstep(0.7, 1.8, 0.05), DEc = rstep(0.2, 1.2, 0.05);
  const bU = bLc / (1 + (1 - tc) * DEc);
  const useDV = chance(0.35), DEt = rstep(0.2, 1.5, 0.05), DVt = rstep(0.15, 0.6, 0.05);
  const DE = useDV ? DVt / (1 - DVt) : DEt;
  const bLt = bU * (1 + (1 - tc) * DE);
  const rf = rstep(0.02, 0.05, 0.0025), mrp = rstep(0.04, 0.07, 0.0025), useM = chance(0.5);
  const rE = rf + bLt * mrp, rD = rf + rstep(0.005, 0.03, 0.0025);
  const wacc = (rE + DE * rD * (1 - tc)) / (1 + DE);
  const intro = `${name} is a private firm planning a new division. A comparable listed firm, ${comp}, has an equity beta of ${fmtNum(bLc)} and a debt-equity ratio of ${fmtNum(DEc)}. ${name} will finance the division ${useDV ? `with ${P(DVt, 0)} debt (as a fraction of total value)` : `at a debt-equity ratio of ${fmtNum(DEt)}`}. Both firms face a corporate tax rate of ${P(tc, 0)}. The risk-free rate is ${P(rf)}, ${useM ? `the market risk premium is ${P(mrp)}` : `the expected market return is ${P(rf + mrp)}`}, and ${name} can borrow at ${P(rD)}. Use the levered beta formula from the formula sheet.`;
  const items: Item[] = [
    { part: N(`What is the unlevered beta of ${comp}?`, bU, 'x'), must: true },
    { part: N('What is the levered equity beta of the division?', bLt, 'x'), w: 0.8 },
    { part: N('What is the equity cost of capital of the division?', rE * 100, 'pct'), w: 0.7 },
    { part: N('What is the WACC of the division?', wacc * 100, 'pct'), w: 0.7 },
  ];
  return Q('L2.hamada', 2, p_(intro), chooseParts(items, 3, 4));
}

// =====================================================================
// LECTURE 3 — Financial distress
// =====================================================================
export function L3_twoState(): Question {
  const name = co(), M = mk();
  const Vs = rstep(100, 400, 10), Vf = roundTo(Vs * rstep(0.3, 0.7, 0.05), 5);
  const F = roundTo(Vf + (Vs - Vf) * rstep(0.15, 0.7, 0.05), 5);
  const p = chance(0.6) ? 0.5 : pick([0.4, 0.6, 0.55, 0.45, 0.7, 0.3]);
  const rf = rstep(0.03, 0.06, 0.005);
  const pctCost = chance(0.4);
  const Cc = roundTo(Vf * rstep(0.1, 0.35, 0.05), 1), cp = pick([0.1, 0.15, 0.2, 0.25, 0.3]);
  const cost = pctCost ? cp * Vf : Cc;
  const Nsh = rstep(5, 40, 1);
  const VU = (p * Vs + (1 - p) * Vf) / (1 + rf), E = p * (Vs - F) / (1 + rf), D = (p * F + (1 - p) * (Vf - cost)) / (1 + rf);
  const VL = E + D, PVF = (1 - p) * cost / (1 + rf), PL = VL / Nsh;
  const probT = p === 0.5 ? 'equally likely to succeed or to fail' : `successful with a probability of ${P(p, 0)}`;
  const costT = pctCost ? `In the event of default, ${P(cp, 0)} of the value of the firm’s assets will be lost to bankruptcy and financial distress costs.` : `The costs of financial distress are ${M(Cc)} in case of default.`;
  let body;
  if (chance(0.5)) {
    body = p_(`Consider the following outcomes for ${poss(name)} new venture:`) + ul([`The venture is ${probT}.`, `The risk-free rate is ${P(rf, 1)}.`, 'The venture has a beta of 0 and the cost of capital is equal to the risk-free rate.', costT, `${name} has ${fmtNum(Nsh)} million shares outstanding.`]) +
      p_('The table summarizes the value of the firm’s securities at the end of the year (€ million) for two capital structures. With leverage, the firm has zero-coupon debt with a face value of ' + M(F) + ' due at the end of the year.') +
      table(['', 'Unlevered: success', 'Unlevered: failure', 'Levered: success', 'Levered: failure'], [
        ['Debt value', '—', '—', fmtNum(F), fmtNum(Vf - cost)],
        ['Equity value', fmtNum(Vs), fmtNum(Vf), fmtNum(Vs - F), '0'],
        ['Total to all investors', fmtNum(Vs), fmtNum(Vf), fmtNum(Vs), fmtNum(Vf - cost)]]);
  } else {
    body = p_(`${name} is launching a new product. If it is a hit, ${name} will be worth ${M(Vs)} at the end of the year; if it fails, it will be worth only ${M(Vf)}. The product is ${probT}, and the risk is fully diversifiable, so the appropriate discount rate is the risk-free rate of ${P(rf, 1)}. ${name} currently has ${fmtNum(Nsh)} million shares outstanding and no debt.`) +
      p_(`${name} announces plans to issue zero-coupon debt with a face value of ${M(F)}, due at the end of the year, and to use the proceeds to repurchase shares. ${costT} Ignore taxes.`);
  }
  const who = C('Who ultimately bears the present value of the financial distress costs?', shuffle(['The original shareholders', 'The debt holders', 'Debt and equity holders equally', 'Nobody; they are diversifiable']), 0);
  who.correct = who.options.indexOf('The original shareholders');
  const items: Item[] = [
    { part: N(v('What is the value of the firm at the beginning of the year if it is unlevered?', 'What is the initial value of the unlevered equity?'), VU, 'm'), w: 0.5 },
    { part: N('What is the initial value of the levered equity?', E, 'm'), w: 0.6 },
    { part: N('What is the initial value of the debt?', D, 'm'), must: true },
    { part: N('What is the present value of the financial distress costs?', PVF, 'm'), w: 0.55 },
    { part: N('What is the share price after the debt issue and repurchase?', PL, 'eur'), w: 0.45 },
    { part: N('How many shares will be repurchased?', D / PL, 'msh'), w: 0.3 },
    { part: N('What is the yield to maturity of the debt?', (F / D - 1) * 100, 'pct'), w: 0.35 },
    { part: who, w: 0.2 },
  ];
  return Q('L3.twoState', 3, body, chooseParts(items, 4, 5));
}

export function L3_multiState(): Question {
  const name = co(), M = mk();
  const k = pick([3, 4, 4, 5]);
  let vals = [];
  let top = rstep(100, 300, 5);
  for (let i = 0; i < k; i++) { vals.push(top); top = roundTo(top * rstep(0.72, 0.92, 0.01), 5); }
  const F = roundTo(vals[k - 1] + (vals[0] - vals[k - 1]) * rstep(0.3, 0.6, 0.05), 5);
  if (F <= vals[k - 1]) return L3_multiState();
  const rf = rstep(0.03, 0.06, 0.005), b = pick([0.1, 0.15, 0.2, 0.25, 0.3]), Nsh = rstep(5, 30, 1);
  const pr = 1 / k, disc = 1 + rf;
  const VU = vals.reduce((a, x) => a + pr * x, 0) / disc;
  const Dn = vals.reduce((a, x) => a + pr * Math.min(F, x), 0) / disc;
  const Db = vals.reduce((a, x) => a + pr * (x >= F ? F : x * (1 - b)), 0) / disc;
  const E = vals.reduce((a, x) => a + pr * Math.max(0, x - F), 0) / disc;
  const list = vals.map(x => M(x));
  const valT = list.slice(0, -1).join(', ') + ', or ' + list[k - 1];
  const body = p_(`${name} is about to launch a new product. Depending on its success, ${name} will have one of ${k} values next year: ${valT}. These outcomes are all equally likely, the risk is diversifiable, and ${name} will not make any payouts to investors during the year. The risk-free interest rate is ${P(rf, 1)}. ${name} has ${fmtNum(Nsh)} million shares outstanding.`) +
    p_(`Suppose ${name} issues zero-coupon debt with a face value of ${M(F)} due next year and uses the proceeds to repurchase shares. In the event of default, ${P(b, 0)} of the value of ${poss(name)} assets will be lost to bankruptcy costs. Ignore all other market imperfections.`);
  const items: Item[] = [
    { part: N('What is the initial value of the equity without leverage?', VU, 'm'), w: 0.35 },
    { part: N('What is the initial value of the debt?', Db, 'm'), must: true },
    { part: N('What is the yield to maturity of the debt?', (F / Db - 1) * 100, 'pct'), w: 0.55 },
    { part: N('What is the expected return of the debt?', rf * 100, 'pct'), w: 0.35 },
    { part: N('What is the initial value of the levered equity?', E, 'm'), w: 0.5 },
    { part: N('What is the total value of the firm with leverage?', E + Db, 'm'), w: 0.45 },
    { part: N('What will the share price be after the debt issue and repurchase?', (E + Db) / Nsh, 'eur'), w: 0.5 },
    { part: N('Without bankruptcy costs, what would the debt be worth initially?', Dn, 'm'), w: 0.2 },
  ];
  return Q('L3.multiState', 3, body, chooseParts(items, 3, 5));
}

export function L3_tradeoff(): Question {
  const name = co(), M = mk();
  for (let t = 0; t < 200; t++) {
    const a = pick([5, 10, 10, 15, 20, 25]);
    const irregular = chance(0.35);
    const lv = irregular ? [0, 2 * a, 4 * a, 5 * a, 6 * a, 7 * a] : [0, a, 2 * a, 3 * a, 4 * a, 5 * a];
    const tc = pick(TAXR);
    const d0 = lv[rint(1, 2)];
    const c = rstep(0.02, 0.2, 0.005) / a;
    const ex = rstep(1.6, 2.4, 0.1);
    const fdc = lv.map(d => r2(d <= d0 ? 0 : c * Math.pow(d - d0, ex) * (1 + (Math.random() - 0.5) * 0.1)));
    const its = lv.map(d => r2(tc * d));
    const net = lv.map((d, i) => its[i] - fdc[i]);
    const best = net.indexOf(Math.max(...net));
    const sorted = [...net].sort((x, y) => y - x);
    if (best === 0 || best === lv.length - 1 || sorted[0] - sorted[1] < 0.1) continue;
    const showITS = chance(0.55);
    const VU = roundTo(lv[5] * rstep(3, 8, 0.5), 5);
    const rows = [];
    if (showITS) rows.push(['PV(interest tax shield)', ...its.map(x => fmtNum(x, 2))]);
    rows.push(['PV(financial distress costs)', ...fdc.map(x => fmtNum(x, 2))]);
    const body = p_(`${name} is considering adding leverage to its capital structure. Its managers believe they can add as much as ${M(lv[5])} in debt and exploit the benefits of the tax shield; they estimate a corporate tax rate of ${P(tc, 0)}${showITS ? '' : ' and expect any debt to be permanent'}. However, they also recognize that higher debt increases the risk of financial distress. Based on simulations of the firm’s future cash flows, the CFO has made these estimates (€ million):`) +
      table(['Debt', ...lv.map(x => fmtNum(x))], rows);
    const tc2 = tc >= 0.3 ? tc - 0.1 : tc + 0.1;
    const net2 = lv.map((d, i) => tc2 * d - fdc[i]);
    const b2 = net2.indexOf(Math.max(...net2)); const s2 = [...net2].sort((x, y) => y - x);
    const items = [
      { part: N(v('What is the optimal debt choice?', 'Which debt level maximizes firm value?'), lv[best], 'm'), must: true },
      { part: N('What is the net benefit of leverage at the optimal debt level?', net[best], 'm'), w: 0.6 },
      { part: N(`The value of ${name} without leverage is ${M(VU)}. What is the value of the firm at the optimal debt level?`, VU + net[best], 'm'), w: 0.4 },
    ];
    if (s2[0] - s2[1] >= 0.1) items.push({ part: N(`Suppose the corporate tax rate were ${P(tc2, 0)} instead. What would the optimal debt level be?`, lv[b2], 'm'), w: 0.3 });
    return Q('L3.tradeoff', 3, body, chooseParts(items, 2, 3));
  }
  return L3_twoState();
}

// =====================================================================
// LECTURE 4 — Managerial incentives (agency)
// =====================================================================
export function L4_assetSub(): Question {
  const M = mk();
  if (chance(0.4)) {
    // Wildcat-style: two assets, swap one for a speculative lease
    const name = co(['Drilling', 'Exploration', 'Mining', 'Resources', 'Energy']);
    const A = rstep(100, 300, 10), F = roundTo(2 * A * rstep(1.05, 1.5, 0.05), 10);
    const big = roundTo(F * rstep(1.6, 3, 0.1), 50), mid = roundTo(F * rstep(0.8, 1.3, 0.05), 25);
    let pb = pick([0.05, 0.1, 0.15]), pm = pick([0.1, 0.15, 0.2, 0.25]); const p0 = 1 - pb - pm;
    const st = [[pb, A + big], [pm, A + mid], [p0, A]];
    const EV = st.reduce((s, [p, x]) => s + p * x, 0), ED = st.reduce((s, [p, x]) => s + p * Math.min(F, x), 0), EE = st.reduce((s, [p, x]) => s + p * Math.max(0, x - F), 0);
    const body = p_(`${name} is currently operating two active fields, each with a market value of ${M(A)}. If the company does not change its strategy, the market values will be the same at the end of the year. Unfortunately, ${name} has ${M(F)} in debt coming due at the end of the year. Another company has offered ${name} a highly speculative, but potentially very valuable, lease in exchange for one of its active fields. If ${name} accepts, there is a ${P(pb, 0)} chance that the lease will be worth ${M(big)}, a ${P(pm, 0)} chance that it will be worth ${M(mid)}, and a ${P(p0, 0)} chance that it will be worthless (all values at the end of the year). In your answers, include the value of the remaining active field. Ignore discounting.`);
    const acc = C('Based on total firm value, should the deal be accepted?', ['Yes', 'No'], EV > 2 * A ? 0 : 1);
    const items = [
      { part: N('What is the expected value of the firm at the end of the year if it accepts the deal?', EV, 'm'), w: 0.7 },
      { part: N('What is the expected value for debt holders at the end of the year if the deal is accepted?', ED, 'm'), must: true },
      { part: N('What is the expected value for equity holders at the end of the year if the deal is accepted?', EE, 'm'), must: true },
      { part: N('By how much does the deal change the expected value of the firm? (Enter a decrease as a negative number.)', EV - 2 * A, 'm'), w: 0.5 },
      { part: acc, w: 0.3 },
    ];
    return Q('L4.assetSub', 4, body, chooseParts(items, 3, 5));
  }
  const name = co();
  const k = chance(0.5) ? 1000 : 1; // values in € thousand (shown as full euros) or € million
  const unit = k === 1000 ? 'eur' : 'm', fx = k === 1000 ? ((x: number) => eur(x * 1000)) : M;
  const F = k === 1000 ? rstep(5, 40, 1) * 100 : rstep(50, 400, 10);
  const lowLev = chance(0.25);
  const V0 = lowLev ? roundTo(F * rstep(1.4, 2.5, 0.1), 10) : roundTo(F * rstep(0.6, 0.95, 0.05), 10);
  const p = pick([0.3, 0.4, 0.5, 0.5, 0.6]);
  const Vh = roundTo(Math.max(F, V0) * rstep(1.15, 1.6, 0.05), 10);
  const Vl = Math.max(0, roundTo((V0 * rstep(0.8, 1.02, 0.01) - p * Vh) / (1 - p), 10));
  const EV = p * Vh + (1 - p) * Vl, EE = p * Math.max(0, Vh - F) + (1 - p) * Math.max(0, Vl - F), ED = p * Math.min(F, Vh) + (1 - p) * Math.min(F, Vl);
  const E0 = Math.max(0, V0 - F), D0 = Math.min(F, V0);
  const ans = (x: number) => k === 1000 ? x * 1000 : x;
  const body = p_(`${name} has a loan of ${fx(F)} due at the end of the year. Without a change in its strategy, the market value of its assets will be ${fx(V0)} at that time. ${name} is considering a new strategy that requires no upfront investment. It has a ${P(p, 0)} chance of success, in which case the value of the firm’s assets will increase to ${fx(Vh)}; if it fails, the value of the firm’s assets will fall to ${fx(Vl)}. Assume risk-neutral investors, and ignore discounting and taxes.`);
  const pref = C('Will equity holders be in favor of the new strategy?', ['Yes', 'No'], EE > E0 ? 0 : 1);
  const items: Item[] = [
    { part: N('What is the expected value of the firm’s assets under the new strategy?', ans(EV), unit), w: 0.5 },
    { part: N('What is the expected payoff to equity holders under the new strategy?', ans(EE), unit), must: true },
    { part: N('What is the expected payoff to debt holders under the new strategy?', ans(ED), unit), w: 0.6 },
    { part: N('What is the payoff to equity holders if the firm keeps its current strategy?', ans(E0), unit), w: 0.35 },
    { part: N('By how much does the new strategy change the expected payoff to debt holders? (Enter a loss as a negative number.)', ans(ED - D0), unit), w: 0.4 },
    { part: pref, w: 0.55 },
  ];
  return Q('L4.assetSub', 4, body, chooseParts(items, 3, 5));
}

export function L4_overhang(): Question {
  const M = mk();
  const rf = rstep(0.03, 0.1, 0.01);
  const lowLev = chance(0.2);
  let F = 0, A = 0, I = 0, B = 0;
  for (let t = 0; t < 100; t++) {
    A = rstep(3, 40, 1); F = lowLev ? roundTo(A * rstep(0.4, 0.8, 0.05), 1) : roundTo(A * rstep(1.2, 2.2, 0.1), 1);
    I = roundTo(A * rstep(0.4, 1.5, 0.1), 1);
    B = roundTo(A + I * (1 + rf) * rstep(1.08, 1.8, 0.02), 1);
    const gain = Math.max(0, B - F) / (1 + rf) - I - Math.max(0, A - F) / (1 + rf);
    if (Math.abs(gain) > 0.05 && B > F && (-I + (B - A) / (1 + rf)) > 0.1) break;
  }
  const ctx = pick(['land', 'event', 'plant']);
  let body;
  if (ctx === 'land') body = `Consider a firm whose only asset is a plot of vacant land, and whose only liability is debt of ${M(F)} due in one year. If left vacant, the land will be worth ${M(A)} in one year. Alternatively, the firm can develop the land at an upfront cost of ${M(I)}; the developed land will be worth ${M(B)} in one year. No lender is willing to finance the development, so the ${M(I)} must be raised from equity holders.`;
  else if (ctx === 'event') body = `Consider a company whose only asset is a building and whose only liability is a loan of ${M(F)} due in one year. If the company does nothing, the building will be worth ${M(A)} in one year. Alternatively, the company can become an event organizer, hosting events in the building. This requires an upfront cost of ${M(I)} today, which must be raised from the equity holders because no lender is willing to lend to the firm. The company value under this strategy will be ${M(B)} in one year.`;
  else body = `${co()} owes ${M(F)} to its creditors, due in one year. Its existing assets will be worth ${M(A)} at that time. Management has identified a risk-free expansion that requires an investment of ${M(I)} today and will raise the value of the firm’s assets in one year to ${M(B)}. The firm has no cash, and the investment would have to be funded with new equity from the existing shareholders.`;
  body += ` Suppose the risk-free interest rate is ${P(rf, 0)}, all cash flows are risk-free, and there are no taxes.`;
  const d = 1 + rf;
  const Eno = Math.max(0, A - F) / d, Dno = Math.min(A, F) / d, Ein = Math.max(0, B - F) / d, Din = Math.min(B, F) / d;
  const npv = -I + (B - A) / d, gain = Ein - I - Eno;
  const inv = C('Will equity holders be willing to provide the funds?', ['Yes', 'No'], gain > 0 ? 0 : 1);
  const items: Item[] = [
    { part: N('If the firm does nothing, what is the value of the debt today?', Dno, 'm'), w: 0.5 },
    { part: N('If the firm does nothing, what is the value of the equity today?', Eno, 'm'), w: 0.25 },
    { part: N(v('What is the NPV of the investment?', 'What is the net present value of the new strategy?'), npv, 'm'), must: true },
    { part: N('If the firm undertakes the investment, what is the value of the equity today (excluding the funds contributed)?', Ein, 'm'), w: 0.45 },
    { part: N('If the firm undertakes the investment, what is the value of the debt today?', Din, 'm'), w: 0.35 },
    { part: N('What is the net gain (or loss) to equity holders from funding the investment? (Enter a loss as a negative number.)', gain, 'm'), w: 0.45 },
    { part: inv, w: 0.6 },
    { part: N('Up to what face value of the debt would the equity holders still be willing to fund the investment?', Math.max(A, B - I * d), 'm'), w: 0.25 },
  ];
  return Q('L4.overhang', 4, p_(body), chooseParts(items, 3, 5));
}

export function L4_cashout(): Question {
  const name = co(), M = mk();
  const rf = rstep(0.03, 0.08, 0.01), d = 1 + rf;
  const lowLev = chance(0.3);
  const V = rstep(50, 900, 10);
  const F = lowLev ? roundTo(V * rstep(0.3, 0.6, 0.05), 10) : roundTo(V * rstep(1.05, 1.4, 0.05), 10);
  const loss = roundTo(V * rstep(0.08, 0.2, 0.01), 5), V1 = V - loss, X = roundTo(loss * rstep(0.2, 0.6, 0.05), 1);
  const E0 = Math.max(0, V - F) / d, E1 = X + Math.max(0, V1 - F) / d, D0 = Math.min(F, V) / d, D1 = Math.min(F, V1) / d;
  const body = p_(`${name} has debt with a face value of ${M(F)} due at the end of the year. Without any changes, its assets will be worth ${M(V)} at that time. ${name} has equipment that it can sell today for ${M(X)} and pay out immediately as a cash dividend. Without the equipment, ${name} would have to shut down some operations, and the firm would be worth only ${M(V1)} at the end of the year. All values are certain; the risk-free rate is ${P(rf, 0)}. Ignore taxes.`);
  const fav = C('Will equity holders be in favor of selling the equipment and paying the dividend?', ['Yes', 'No'], E1 > E0 ? 0 : 1);
  const items: Item[] = [
    { part: N('What is the value of equity today if the firm does not sell the equipment?', E0, 'm'), w: 0.5 },
    { part: N('What is the total value to equity holders today (including the dividend) if the firm sells the equipment?', E1, 'm'), must: true },
    { part: N('By how much does the value of the debt today fall if the firm sells the equipment?', D0 - D1, 'm'), w: 0.5 },
    { part: N('By how much does the total value of the firm today fall as a result of the sale?', (V - V1) / d - X, 'm'), w: 0.4 },
    { part: fav, must: true },
  ];
  return Q('L4.cashout', 4, body, chooseParts(items, 3, 4));
}

export function L4_petron(): Question {
  const name = co(), M = mk();
  for (let t = 0; t < 300; t++) {
    const pr = [1, rstep(0.75, 0.9, 0.05), rstep(0.55, 0.7, 0.05), rstep(0.3, 0.45, 0.05)];
    const vA = rstep(30, 80, 5); const vs = [vA];
    for (let i = 1; i < 4; i++) vs.push(roundTo(vs[i - 1] * rstep(1.12, 1.35, 0.01), 1));
    const ev = vs.map((x, i) => pr[i] * x);
    if (!(ev[0] > ev[1] && ev[1] > ev[2] && ev[2] > ev[3])) continue;
    const choose = (F: number) => { const e = vs.map((x, i) => pr[i] * Math.max(0, x - F)); const m = Math.max(...e); const s = [...e].sort((a, b) => b - a); return { i: e.indexOf(m), gap: s[0] - s[1], eq: m }; };
    const Fs = []; for (let F = 5; F < vs[0] * 0.95; F += 5) Fs.push(F);
    const cand = Fs.map(F => ({ F, ...choose(F) })).filter(c => c.gap >= 0.5);
    const nonA = cand.filter(c => c.i >= 2);
    const mid = cand.filter(c => c.i === 1);
    if (!nonA.length || !mid.length) continue;
    const c2 = pick(nonA), c1 = pick(mid);
    if (c1.F >= c2.F) continue;
    const L = ['A', 'B', 'C', 'D'];
    const body = p_(`${name} has to decide on a new corporate strategy. There are four options, each with a different probability of success and total firm value in the event of success, as shown below. For each strategy, firm value is zero in the event of failure. Management will choose the strategy that leads to the highest expected value of ${poss(name)} equity. Assume all risk is idiosyncratic, the risk-free interest rate is zero, and there are no taxes.`) +
      table(['', ...L.map(x => 'Strategy ' + x)], [['Probability of success', ...pr.map(x => P(x, 0))], ['Firm value if successful (€ million)', ...vs.map(x => fmtNum(x))]]);
    const firm2 = ev[c2.i], debt2 = firm2 - c2.eq;
    const items = [
      { part: C('Which strategy has the highest expected payoff for the firm as a whole?', L, 0), w: 0.3 },
      { part: C(`Which strategy will management choose if ${name} has debt with a face value of ${M(c1.F)}?`, L, c1.i), w: 0.6 },
      { part: C(`Which strategy will management choose if ${name} has debt with a face value of ${M(c2.F)}?`, L, c2.i), must: true },
      { part: N(`With debt of ${M(c2.F)}, what is the expected value of equity?`, c2.eq, 'm'), w: 0.6 },
      { part: N(`With debt of ${M(c2.F)}, what is the expected value of the firm?`, firm2, 'm'), w: 0.5 },
      { part: N(`With debt of ${M(c2.F)}, what is the expected value of the debt?`, debt2, 'm'), w: 0.35 },
      { part: N(`What are the agency costs of debt with a face value of ${M(c2.F)}, measured as the loss in expected firm value?`, ev[0] - firm2, 'm'), w: 0.35 },
    ];
    return Q('L4.petron', 4, body, chooseParts(items, 3, 5));
  }
  return L4_overhang();
}

export function L4_empire(): Question {
  const name = co(), M = mk();
  const EBIT = rstep(200, 3000, 50), tc = pick(TAXR), w = pick([0.05, 0.1, 0.15, 0.2, 0.25, 0.08, 0.12]);
  const NI = EBIT * (1 - tc);
  const Int = roundTo(EBIT * rstep(0.1, 0.5, 0.05), 10);
  const showTable = chance(0.6);
  const body = (showTable ? p_(`${name} forecasts the following income for the coming year (€ thousand):`) + table(['', ''], [['EBIT', fmtNum(EBIT)], ['Interest expense', '0'], ['Income before tax', fmtNum(EBIT)], ['Taxes (' + P(tc, 0) + ')', '−' + fmtNum(EBIT * tc)], ['Net income', fmtNum(NI)]], 'nohead narrow')
    : p_(`${name} expects EBIT of €${fmtNum(EBIT)} thousand in the coming year. It has no debt and pays a corporate tax rate of ${P(tc, 0)}.`)) +
    p_(`Unfortunately, ${poss(name)} managers are expected to waste ${P(w, 0)} of its net income on needless perks, pet projects, and other expenditures that do not contribute to the firm. All remaining income will be returned to shareholders through dividends and share repurchases.`);
  const items: Item[] = [
    { part: N('By how much would each €1 of interest expense reduce dividends and share repurchases?', (1 - tc) * (1 - w), 'eur'), must: true },
    { part: N('What is the increase in the total funds paid to investors for each €1 of interest expense?', 1 - (1 - tc) * (1 - w), 'eur'), w: 0.75 },
    { part: N('Without debt, how much will be paid out to shareholders?', NI * (1 - w), 'k'), w: 0.35 },
    { part: N(`If ${name} takes on debt with interest expense of €${fmtNum(Int)} thousand per year, what are the total funds paid to all investors?`, Int + (EBIT - Int) * (1 - tc) * (1 - w), 'k'), w: 0.45 },
  ];
  return Q('L4.empire', 4, body, chooseParts(items, 2, 3));
}

// =====================================================================
// LECTURE 5 — Asymmetric information
// =====================================================================
export function L5_financing(): Question {
  const name = co(), M = mk();
  const A = rstep(5, 100, 2.5);
  const fair = rstep(0.04, 0.1, 0.005), rc = fair + rstep(0.005, 0.03, 0.0025), u = pick([0.02, 0.03, 0.04, 0.05, 0.06, 0.075, 0.08, 0.1, 0.12]);
  const cD = A * (1 + rc) / (1 + fair), cE = A / (1 - u);
  const ranking = ['Retained earnings, debt, equity', 'Retained earnings, equity, debt', 'Debt, retained earnings, equity', 'Equity, debt, retained earnings'];
  const corr = cD <= cE ? 0 : 1;
  const body = p_(v(
    `${name} needs to raise ${M(A)} for a new investment project. If the firm issues one-year debt, it may have to pay an interest rate of ${P(rc)}, although ${poss(name)} managers believe that ${P(fair)} would be a fair rate given the level of risk. However, if the firm issues equity, they believe the equity may be underpriced by ${P(u, 1)}.`,
    `To fund a ${M(A)} project, ${name} can use retained earnings, issue one-year debt, or issue new equity. Lenders would charge ${P(rc)}, whereas management considers ${P(fair)} the fair rate for the firm’s risk. Management also believes that the market underprices ${poss(name)} shares by ${P(u, 1)}.`));
  const items: Item[] = [
    { part: N('What is the cost to current shareholders of financing the project out of retained earnings?', A, 'm'), w: 0.3 },
    { part: N('What is the cost to current shareholders of financing the project with debt?', cD, 'm'), must: true },
    { part: N('What is the cost to current shareholders of financing the project with equity?', cE, 'm'), must: true },
    { part: C('Rank the sources from cheapest to most expensive for current shareholders.', ranking, corr), w: 0.4 },
    { part: N('Up to what level of underpricing would issuing equity be cheaper than issuing debt?', (1 - A / cD) * 100, 'pct'), w: 0.3 },
  ];
  return Q('L5.financing', 5, body, chooseParts(items, 3, 4));
}

export function L5_lemons(): Question {
  const name = co();
  const k = pick([3, 3, 4]); const stp = rstep(5, 25, 5); const low = rstep(40, 120, 5);
  const vals = Array.from({ length: k }, (_, i) => low + stp * (k - 1 - i)); // descending
  const d = pick([0.05, 0.08, 0.1, 0.1, 0.15, 0.2, 0.25, 0.3]);
  let S = vals.slice(); const prices = [];
  while (true) { const pr = S.reduce((a, b) => a + b, 0) / S.length; prices.push(pr); const top = S[0]; if ((1 - d) * top > pr + 1e-9 && S.length > 1) S = S.slice(1); else break; }
  const final = prices[prices.length - 1];
  const sellers = vals.filter(x => (1 - d) * x <= final + 1e-9);
  const list = vals.map(x => eur(x)).join(', ').replace(/, ([^,]*)$/, ', or $1');
  const body = p_(`${poss(name)} stock is worth either ${list} per share. Investors believe each case is equally likely, and the current share price equals the average value of ${eur(prices[0])}. Suppose the CEO of ${name} announces that he will sell most of his holdings of the stock to diversify. Diversifying is worth ${P(d, 0)} of the share price to him, that is, he would be willing to receive ${P(d, 0)} less than the shares are worth to achieve the benefits of diversification. Investors believe the CEO knows the true value.`);
  const optsSet = [];
  for (let j = 1; j <= k; j++) optsSet.push(vals.slice(k - j));
  const optText = (s: number[]) => s.length === k ? 'In all cases' : s.length === 1 ? `Only if the true value is ${eur(s[0])}` : `Only if the true value is ${s.map(x => eur(x)).join(' or ')}`;
  const options = optsSet.map(optText);
  const ci = optsSet.findIndex(s => s.length === sellers.length);
  const items: Item[] = [
    { part: N('At what price will the CEO ultimately be able to sell his shares?', final, 'eur'), must: true },
    { part: C('For which true values of the stock will the CEO sell?', options, ci), must: true },
  ];
  if (prices.length > 1) items.splice(0, 0, { part: N(`If investors conclude that the CEO would not sell if the true value were ${eur(vals[0])}, to what price should the stock fall?`, prices[1], 'eur'), w: 0.5 });
  return Q('L5.lemons', 5, body, chooseParts(items, 2, 3));
}

export function L5_signal(): Question {
  const name = co(), M = mk();
  const L = rstep(30, 300, 10), H = roundTo(L * rstep(1.4, 2.5, 0.1), 10);
  const D1 = roundTo(L * rstep(0.3, 0.9, 0.1), 5), D2 = roundTo(L + (H - L) * rstep(0.1, 0.8, 0.1), 5);
  const order = chance(0.5);
  const body = p_(`${name} currently uses all-equity financing. Its market value in one year’s time will be either ${M(H)} or ${M(L)}, depending on the success of a new strategy. Investors currently view the outcomes as equally likely, but the CEO has information that success is virtually certain. The CEO considers taking on debt (due in one year) to signal this information. Financial distress is costly.`);
  const a = C(`Would debt with a face value of ${M(order ? D1 : D2)} make the CEO’s claim credible?`, ['Yes', 'No'], order ? 1 : 0);
  const b = C(`Would debt with a face value of ${M(order ? D2 : D1)} make the CEO’s claim credible?`, ['Yes', 'No'], order ? 0 : 1);
  const parts: Part[] = [a, b];
  if (chance(0.6)) parts.push(N('Above what face value of debt does the leverage become a credible signal?', L, 'm'));
  if (chance(0.4)) parts.push(N(`If the firm issues debt with a face value of ${M(D2)} and the strategy fails, how much will equity holders receive in one year?`, 0, 'm'));
  return Q('L5.signal', 5, body, parts);
}

// =====================================================================
// LECTURE 6 — Raising equity capital
// =====================================================================
export function L6_vc(): Question {
  const name = co(['Software', 'Robotics', 'Labs', 'Health', 'Games', 'Analytics', 'Bio', 'Mobility', 'AI', 'Energy']);
  const N0 = rstep(0.5, 12, 0.25) * 1e6; const inv0 = roundTo(N0 * rstep(0.02, 0.12, 0.01), 10000);
  const Na = chance(0.6) ? roundTo(N0 * rstep(0.15, 0.7, 0.05), 50000) : 0;
  const old = N0 + Na;
  const angelT = Na ? ` Since then, you have sold an additional ${sh(Na)} shares to angel investors.` : '';
  const founder = v(`You founded your own firm two years ago. Initially, you contributed ${eur(inv0)} of your own money and in return received ${sh(N0)} shares of stock.${angelT}`,
    `Last year you started ${name}, investing ${eur(inv0)} in exchange for ${sh(N0)} shares.${Na ? ` Afterwards, angel investors bought ${sh(Na)} newly issued shares.` : ''}`);
  const vr = rint(0, 3);
  let body, items;
  if (vr === 0) {
    const s = rstep(0.2, 0.6, 0.01), I = rstep(0.5, 15, 0.25) * 1e6;
    const tot = old / (1 - s), nv = tot - old, pr = I / nv;
    body = founder + ` You now need to raise a new round of capital, and a venture capitalist is willing to invest ${eur(I)} if she owns ${P(s, 0)} of the company after the investment is completed.`;
    items = [
      { part: N('How many shares must the venture capitalist receive?', nv / 1e6, 'msh'), must: true },
      { part: N('What is the implied price per share of this funding round?', pr, 'eur', { abs: 0.006 }), w: 0.8 },
      { part: N('What is the pre-money valuation?', old * pr / 1e6, 'm'), w: 0.7 },
      { part: N('What is the post-money valuation?', tot * pr / 1e6, 'm'), w: 0.7 },
      { part: N('What percentage of the firm will you own after the round?', N0 / tot * 100, 'pct'), w: Na ? 0.5 : 0.2 },
    ];
  } else if (vr === 1) {
    const I = rstep(1, 15, 0.5) * 1e6, post = roundTo(I / rstep(0.2, 0.65, 0.01), 100000);
    const pre = post - I, pr = pre / old, nv = I / pr, tot = old + nv;
    body = founder + ` You are now raising capital from a venture capitalist, who has agreed to invest ${eur(I)} at a post-money valuation of ${eur(post)}. This is the venture capitalist’s first investment in the company.`;
    items = [
      { part: N('What percentage of the firm will the venture capitalist own?', I / post * 100, 'pct'), w: 0.6 },
      { part: N('What is the price per share in this round?', pr, 'eur', { abs: 0.006 }), w: 0.5 },
      { part: N('How many new shares will the venture capitalist receive?', nv / 1e6, 'msh'), w: 0.4 },
      { part: N('What percentage of the firm will you own?', N0 / tot * 100, 'pct'), must: true },
      { part: N('What is the value of your shares after the round?', N0 * pr / 1e6, 'm'), must: true },
    ];
  } else if (vr === 2) {
    const nv = roundTo(old * rstep(0.4, 2, 0.05), 50000); const pr = rstep(0.4, 6, 0.05); const I = nv * pr;
    body = founder + ` You now want to raise more capital from a venture capitalist, who invests ${eur(I)} and receives ${sh(nv)} newly issued shares.`;
    const tot = old + nv;
    items = [
      { part: N('What is the post-money valuation after this funding round?', tot * pr / 1e6, 'm'), must: true },
      { part: N('What is the pre-money valuation?', old * pr / 1e6, 'm'), w: 0.4 },
      { part: N('What percentage of the firm will you own?', N0 / tot * 100, 'pct'), w: 0.7 },
      { part: N('What percentage of the firm will the venture capitalist own?', nv / tot * 100, 'pct'), w: 0.6 },
      { part: N('What will be the value of your shares?', N0 * pr / 1e6, 'm'), w: 0.7 },
    ];
  } else {
    const pre = roundTo(old * rstep(0.5, 6, 0.05), 100000), I = rstep(0.5, 10, 0.25) * 1e6;
    const pr = pre / old, nv = I / pr, tot = old + nv;
    body = founder + ` A venture capitalist offers to invest ${eur(I)} at a pre-money valuation of ${eur(pre)}.`;
    items = [
      { part: N('What is the price per share in this round?', pr, 'eur', { abs: 0.006 }), must: true },
      { part: N('How many shares will the venture capitalist receive?', nv / 1e6, 'msh'), w: 0.6 },
      { part: N('What is the post-money valuation?', (pre + I) / 1e6, 'm'), w: 0.5 },
      { part: N('What percentage of the firm will you own after the round?', N0 / tot * 100, 'pct'), w: 0.7 },
      { part: N('By what multiple has the value of your shares increased relative to your initial investment?', N0 * pr / inv0, 'x'), w: 0.3 },
    ];
  }
  return Q('L6.vc', 6, p_(body), chooseParts(items, 3, 5));
}

export function L6_rounds(): Question {
  const name = co(['Networks', 'Software', 'Media', 'Labs', 'Systems', 'Cloud']);
  const NA = rint(5, 20) * 1e6 + rint(0, 999) * 1000, pA = rstep(0.03, 0.2, 0.01);
  const NB = roundTo(NA * rstep(0.1, 0.4, 0.01), 1000), pB = r2(pA * rstep(4, 12, 0.5));
  const NC = roundTo((NA + NB) * rstep(0.1, 0.35, 0.01), 1000), pC = r2(pB * rstep(1.5, 4, 0.1));
  const body = p_(`${name} was founded by a single entrepreneur, whose initial investment of ${eur(NA * pA, 0)} represented ${sh(NA)} shares of Series A preferred stock (a purchase price of about ${eur(pA)} per share). To raise additional capital, ${name} sold ${sh(NB)} shares of Series B preferred stock to an angel investor at ${eur(pB)} per share. A year later, venture capital firms bought ${sh(NC)} shares of Series C preferred stock at ${eur(pC)} per share. Treat all preferred shares as equivalent to common shares.`);
  const items: Item[] = [
    { part: N('What is the pre-money valuation of the Series B round?', NA * pB / 1e6, 'm'), w: 0.6 },
    { part: N('What is the post-money valuation of the Series B round?', (NA + NB) * pB / 1e6, 'm'), w: 0.6 },
    { part: N('What fraction of the firm does the founder own after the Series B round?', NA / (NA + NB) * 100, 'pct'), w: 0.5 },
    { part: N('What is the post-money valuation of the Series C round?', (NA + NB + NC) * pC / 1e6, 'm'), must: true },
    { part: N('What fraction of the firm does the founder own after the Series C round?', NA / (NA + NB + NC) * 100, 'pct'), w: 0.6 },
    { part: N('What is the value of the angel investor’s stake after the Series C round?', NB * pC / 1e6, 'm'), w: 0.4 },
  ];
  return Q('L6.rounds', 6, body, chooseParts(items, 3, 5));
}

export function L6_spac(): Question {
  const name = co(['Motors', 'Mobility', 'Energy', 'Space', 'Health', 'Robotics']);
  const spac = pick(['Ironbridge', 'Northstar', 'Meridian', 'Highgate', 'Lighthouse', 'Summit', 'Crown', 'Atlas']) + ' Acquisition Corp';
  const U = rstep(20, 300, 5), w = pick([0.2, 0.25, 1 / 3, 0.5]), Ws = roundTo(U * rstep(0.1, 0.25, 0.01), 0.05);
  const prom = U / 4;
  const pPipe = rstep(10, 15, 0.5), pipeN = roundTo(U * rstep(0.3, 1.5, 0.05), 1), PIPE = pipeN * pPipe;
  const red = chance(0.3) ? pick([0.1, 0.2, 0.25, 0.3, 0.4]) : 0;
  const Upub = U * (1 - red);
  const cash = 10 * Upub + PIPE, fee = roundTo(cash * rstep(0.03, 0.06, 0.005), 1);
  const T = roundTo(U * rstep(3, 8, 0.5), 5);
  const K = 11.5, Pw = rstep(14, 26, 0.25);
  const W = w * U + Ws, wsh = W * (Pw - K) / Pw;
  const S0 = Upub + prom + pipeN, tot = S0 + T + wsh, issued = S0 + wsh, eff = cash / issued;
  const first = r2(eff * rstep(1.1, 2.5, 0.05));
  const wT = { 0.2: '0.2 warrants', 0.25: 'one quarter of a warrant', 0.5: 'one half of a warrant' }[w] || 'one third of a warrant';
  const body = p_(`${name} announces that it will go public in a merger with a SPAC, ${spac}. The SPAC raised ${eur(10 * U, 0)} million in its IPO by issuing ${fmtNum(U)} million units at €10 per unit. Each unit consisted of one share of common stock and ${wT} with a strike price of €11.50 per share. The sponsor received ${fmtNum(Ws)} million warrants in addition to the standard 20% promote (20% of SPAC ownership, conditional on completing a deal). The SPAC has also arranged to raise ${eur(PIPE)} million from PIPE investors at ${eur(pPipe)} per share.`) +
    p_(`Under the terms of the merger, ${poss(name)} current shareholders receive ${fmtNum(T)} million shares. Fees associated with the merger are expected to be ${eur(fee)} million.${red ? ` Before the merger closes, holders of ${P(red, 0)} of the SPAC’s public shares redeem them for €10 per share.` : ' Assume no SPAC shares are redeemed.'} Shortly after the deal closes, all warrants are exercised on a cashless basis at a share price of ${eur(Pw)}.`);
  const items: Item[] = [
    { part: N('How many shares does the sponsor receive as its promote?', prom, 'msh'), w: 0.4 },
    { part: N('How many SPAC shares are outstanding just prior to the merger (after any redemptions)?', S0, 'msh'), w: 0.45 },
    { part: N('How many warrants are outstanding in total?', W, 'msh_w'), w: 0.4 },
    { part: N('How much cash is available at the close of the deal, net of fees?', cash - fee, 'm'), w: 0.5 },
    { part: N('How many new shares are issued in the cashless warrant exercise?', wsh, 'msh'), w: 0.5 },
    { part: N(`What is the effective price per share at which ${name} issued shares in its “IPO” (gross cash raised divided by shares issued to non-target shareholders)?`, eff, 'eur'), must: true },
    { part: N('What is the implied post-deal equity value?', eff * tot / 1000, 'bn'), w: 0.4 },
    { part: N('What are the direct fees as a percentage of the gross cash raised?', fee / cash * 100, 'pct'), w: 0.3 },
    { part: N(`On the first day of trading after the close, ${poss(name)} shares trade at ${eur(first)}. What is the implied underpricing?`, (first / eff - 1) * 100, 'pct'), w: 0.3 },
  ];
  return Q('L6.spac', 6, body, chooseParts(items, 4, 5));
}

