// Investment and Financing Decisions: practice in the format of the Moodle quizzes and the practice exercises.
// Cases with several steps keep numeric entry, single questions are multiple choice A–E with wrong options from
// typical mistakes. Each set also covers content of the lecture and its additional material that the quizzes leave out.
import { C, P, Q, chance, fmtNum, p_, pick, rstep, shuffle } from '@/lib/engine/gen-helpers';
import { CANNOT, mcNum, mcText, shortAnswer } from '@/lib/engine/mc';
import type { Question } from '@/lib/engine/types';
import { BANK } from './concepts';
import * as G from './generators';

const pp = (x: number, d = 2) => P(x, d);
const f2 = (x: number) => fmtNum(x, 2);
const retag = (key: string, g: () => Question) => () => ({ ...g(), fam: key });
const mil = (s: string) => (x: number) => (x < 0 ? '−' : '') + s + fmtNum(Math.abs(x), 2) + 'm';
const one = (s: string) => (x: number) => (x < 0 ? '−' : '') + s + fmtNum(Math.abs(x), 2);

// =====================================================================
// Set 1 — Equity financing
// =====================================================================

export function PS1_ipoMc(): Question {
  const d = G.ipoDraw(), { c } = d;
  const html = p_(`${d.name} has ${d.n0} million shares outstanding and issues ${d.nNew} million new shares in an IPO at ${c.one(d.P0, 0)} per share, with an underwriting spread of ${P(d.s, 0)}. The share price rises to ${c.one(d.P1, 0)} on the first day of trading.`);
  if (chance(0.5)) {
    return mcNum('PS1.ipoMc', '1', html + p_('How much money does the firm receive from the IPO?'), d.raised,
      [d.nNew * d.P0, d.nNew * d.P1 * (1 - d.s), d.nNew * d.P1, d.nNew * d.P0 * d.s, (d.n0 + d.nNew) * d.P0 * (1 - d.s)], mil(c.s),
      { sol: p_(`The firm receives the offer price net of the spread: ${d.nNew}m × ${c.one(d.P0, 0)} × (1 − ${P(d.s, 0)}) = ${c.mil(d.raised)}. The first-day price goes to the investors who bought the shares.`) });
  }
  return mcNum('PS1.ipoMc', '1', html + p_('What is the total cost to the original shareholders due to market imperfections?'), d.total,
    [d.under, d.direct, d.n0 * (d.P1 - d.P0), (d.n0 + d.nNew) * (d.P1 - d.P0), d.mv - d.raised], mil(c.s),
    { sol: p_(`Underpricing ${d.nNew}m × (${c.one(d.P1, 0)} − ${c.one(d.P0, 0)}) = ${c.mil(d.under)} plus the spread ${d.nNew}m × ${c.one(d.P0, 0)} × ${P(d.s, 0)} = ${c.mil(d.direct)}: ${c.mil(d.total)}. Equivalently, in a perfect market the old shares would be worth ${c.mil(d.mv)} − ${c.mil(d.raised)} = ${c.mil(d.pre)}, against ${c.mil(d.n0 * d.P1)} now.`) });
}

export function PS1_rightsMc(): Question {
  const d = G.rightsDraw(), { c } = d;
  const html = p_(`${d.name} has ${d.n} million shares outstanding at ${c.one(d.P0, 0)}. In a rights issue each shareholder receives one right per share, and ${d.k} rights buy one new share at ${c.one(d.X, 0)}. All rights are exercised. What is the share price after the rights issue?`);
  const sol = p_(`New shares ${d.n}m / ${d.k} = ${f2(d.n / d.k)}m raise ${c.mil(d.raised)}. Price = (${d.n}m × ${c.one(d.P0, 0)} + ${c.mil(d.raised)}) / ${f2(d.n + d.n / d.k)}m = ${c.one(d.post)}.`);
  return mcNum('PS1.rightsMc', '1', html, d.post, [d.P0, d.X, (d.n * d.P0 + d.raised) / d.n, (d.P0 + d.X) / 2, d.P0 - d.X / d.k], one(c.s), { sol });
}

const PS1_short = () => shortAnswer('PS1.short', '1', BANK['1'].MC);

// =====================================================================
// Set 2 — Debt financing
// =====================================================================

export function PS2_rating(): Question {
  const d = G.ardenDraw(), { c } = d;
  const html = p_(`${d.name} finances a new project costing ${c.mil(d.I, 0)} entirely with one-year zero-coupon bonds. The project pays ${c.mil(d.H, 0)} if demand is high and ${c.mil(d.L, 0)} if it is low; ${d.p === 0.5 ? 'both are equally likely' : `high demand has a probability of ${P(d.p, 0)}`}, and demand is uncorrelated with the market. The risk-free rate is ${pp(d.rf, 0)}; there are no bankruptcy costs.`) + G.ratingTable() + p_('Which credit rating is most consistent with the bonds’ default spread?');
  const sol = p_(`F = [${f2(d.I)} × ${f2(1 + d.rf)} − ${f2(1 - d.p)} × ${f2(d.L)}] / ${f2(d.p)} = ${f2(d.F)}; yield ${f2(d.F)}/${f2(d.I)} − 1 = ${pp(d.y)}; spread ${pp(d.s)}, nearest ${G.RATING_NAMES[G.ratingOf(d.s)]}.`);
  return { ...Q('PS2.rating', '2', html, [C('Rating', G.RATING_NAMES, G.ratingOf(d.s))]), solution: sol };
}

export function PS2_faceMc(): Question {
  const d = G.ardenDraw(), { c } = d;
  const html = p_(`${d.name} finances a project costing ${c.mil(d.I, 0)} entirely with one-year zero-coupon bonds. The project pays ${c.mil(d.H, 0)} if demand is high and ${c.mil(d.L, 0)} if it is low; ${d.p === 0.5 ? 'both are equally likely' : `high demand has a probability of ${P(d.p, 0)}`}, and demand is uncorrelated with the market. The risk-free rate is ${pp(d.rf, 0)}; there are no bankruptcy costs and no other assets or liabilities.`);
  const need = d.I * (1 + d.rf);
  if (chance(0.55)) {
    return mcNum('PS2.faceMc', '2', html + p_('What is the total face value of the debt?'), d.F, [need, need / d.p, need - (1 - d.p) * d.L, d.I / d.p, d.p * d.H + (1 - d.p) * d.L - d.L * 0.5], mil(c.s),
      { sol: p_(`Bondholders get F if demand is high and the whole ${f2(d.L)} if it is low; with zero beta the bonds are priced at r<sub>f</sub>: ${f2(d.I)} = [${f2(d.p)}F + ${f2(1 - d.p)} × ${f2(d.L)}] / ${f2(1 + d.rf)}, so F = ${c.mil(d.F)}.`) });
  }
  return mcNum('PS2.faceMc', '2', html + p_('What is the market value of the equity immediately after the investment?'), d.E,
    [d.p * (d.H - d.F), (d.H - d.F) / (1 + d.rf), d.p * d.H + (1 - d.p) * d.L - d.I, d.p * (d.H - d.I) / (1 + d.rf)], mil(c.s),
    { sol: p_(`F = ${f2(d.F)}. Equity gets ${f2(d.H)} − ${f2(d.F)} if demand is high and nothing otherwise: ${f2(d.p)} × ${f2(d.H - d.F)} / ${f2(1 + d.rf)} = ${c.mil(d.E)}, which is also project value minus the debt raised.`), last: CANNOT });
}

export function PS2_bankruptcy(): Question {
  const d = G.bpDraw(), { c } = d;
  const Kb = chance(0.6) ? d.K : Math.round(d.V[2] * rstep(1.1, 1.4, 0.05) / 10) * 10;
  const html = p_(`${d.name} has existing assets worth a certain ${c.mil(d.A, 0)} next year and invests ${c.mil(d.I, 0)} in a project paying ${d.cf.map(f2).join(', ')} (in millions) in the good, mediocre and bad scenarios. It can raise the money with straight debt with a face value of ${c.mil(d.F)}, or with a convertible bond with a principal of ${c.mil(Kb, 0)}. Both are fairly priced; the discount rate is zero.`) + p_('What would be the effect on the share price if bankruptcy costs were introduced?');
  const opts = ['The share price would not be affected regardless of which type of debt is issued.', 'The share price would be affected regardless of which type of debt is issued.', 'The share price would be affected only if the firm issued the straight debt.', 'The share price would be affected only if the firm issued the convertible debt.'];
  const right = Kb > d.V[2] ? opts[1] : opts[2];
  const sol = p_(`In the bad scenario the firm is worth ${f2(d.V[2])}. The straight debt promises ${f2(d.F)} and defaults there. The convertible promises ${f2(Kb)}: ${Kb > d.V[2] ? 'it defaults too, so bankruptcy costs hit either way' : 'it is always repaid or converted, so bankruptcy costs never arise'}. Shareholders bear expected bankruptcy costs through a lower price for the securities they sell.`);
  return mcText('PS2.bankruptcy', '2', html, right, opts.filter(o => o !== right), sol, false);
}

export function PS2_yield(): Question {
  const c = pick(['€', '$']), F = Math.round(rstep(50, 150, 5)), p = pick([0.7, 0.75, 0.8, 0.85, 0.9]), L = Math.round(F * rstep(0.5, 0.9, 0.05)), rf = rstep(0.02, 0.05, 0.005);
  const B = (p * F + (1 - p) * L) / (1 + rf), y = F / B - 1, s = y - rf;
  const html = p_(`A company has a one-year zero-coupon bond with a face value of ${c}${F} million. With probability ${P(p, 0)} its project succeeds and the bond is repaid in full; otherwise the firm defaults and bondholders receive the project’s ${c}${L} million. The project’s cash flows are uncorrelated with the market and the risk-free rate is ${pp(rf, 1)}.`);
  const sol = p_(`B<sub>0</sub> = (${f2(p)} × ${F} + ${f2(1 - p)} × ${L}) / ${fmtNum(1 + rf, 3)} = ${f2(B)}; y = ${F}/${f2(B)} − 1 = ${pp(y)}; default spread ${pp(y)} − ${pp(rf, 1)} = ${pp(s)}.`);
  const v = pick([0, 1, 2]);
  if (v === 0) return mcNum('PS2.yield', '2', html + p_('What is the price of the bond today (in millions)?'), B, [F / (1 + rf), p * F + (1 - p) * L, p * F / (1 + rf), (p * F + (1 - p) * L) / (1 + rf + s)], one(c), { sol });
  if (v === 1) return mcNum('PS2.yield', '2', html + p_('What is the bond’s yield to maturity?'), y, [rf, (F - B) / F, s, (p * F + (1 - p) * L) / B - 1, y + rf], x => pp(x), { sol });
  return mcNum('PS2.yield', '2', html + p_('What is the bond’s default spread?'), s, [y, rf, (F - B) / F - rf, (1 - p) * (F - L) / F, s * (1 + rf) + rf], x => pp(x), { sol });
}

const PS2_short = () => shortAnswer('PS2.short', '2', BANK['2'].MC);

// =====================================================================
// Set 3 — Incentives and information
// =====================================================================

export function PS3_kappaMc(): Question {
  const d = G.effortDraw(), { c } = d, own = d.Eh - d.El;
  const v = pick(['own', 'equity', 'debt'] as const);
  const html = G.effortText(d) + (v === 'own' ? p_('For which values of κ would the entrepreneur choose high effort if she had the money herself? Give the largest value.')
    : p_(`She has no money and investors believe she will choose high effort. If she finances the start-up with ${v === 'equity' ? 'outside equity' : 'debt'}, what is the maximum κ for which she still chooses high effort?`));
  const sol = p_(`Own cash: κ ≤ ${f2(d.Eh)} − ${f2(d.El)} = ${f2(own)}. Equity: α = ${f2(d.I)}/${f2(d.Eh)} = ${fmtNum(d.alpha, 4)}, κ ≤ (1 − α) × ${f2(own)} = ${f2(d.kE)}. Debt: F = ${f2(d.F)}, κ ≤ ${f2(d.kD)}.`);
  const ans = v === 'own' ? own : v === 'equity' ? d.kE : d.kD;
  return mcNum('PS3.kappaMc', '3', html, ans, [own, d.kE, d.kD, d.alpha * own, own - d.kD, d.kD * 2], mil(c.s), { sol, step: 1 });
}

export function PS3_pecking(): Question {
  const d = G.lemonsDraw(), { c } = d;
  const right = `Good types prefer debt: it is underpriced by ${c.mil(d.ud)} for them, against ${c.mil(d.ue)} for equity.`;
  const wrong = [
    `Good types prefer equity: it is underpriced by ${c.mil(d.ud)} for them, against ${c.mil(d.ue)} for debt.`,
    'Bad types issue equity in equilibrium, because equity is the most overpriced security for them.',
    'Both securities are fairly priced for good types, so they are indifferent.',
    'Good types prefer equity because it carries no repayment obligation and therefore no underpricing.',
  ];
  const sol = p_(`At pooled prices, α = ${fmtNum(d.alpha, 4)} and F = ${f2(d.F)}. Under the good type’s true probabilities the equity sold is worth ${f2(d.alpha * d.Eg)} and the debt ${f2(d.ud + d.I)}, both against ${f2(d.I)} received. Debt is less information-sensitive and less underpriced, so good types issue debt; a bad type issuing equity would reveal herself, so she pools on debt too. With internal funds, nothing would be mispriced at all: the pecking order.`);
  return mcText('PS3.pecking', '3', G.lemonsText(d) + p_('Which statement is correct?'), right, wrong, sol);
}

const PS3_short = () => shortAnswer('PS3.short', '3', BANK['3'].MC);

// =====================================================================
// Set 4 — Capital budgeting
// =====================================================================

const RELEVANT = [
  'An increase in the sales of an existing product caused by the project',
  'The value of a currently unused machine that the project will use',
  'Additional advertising expenses for the new product',
  'Lost sales of an existing product that the new product replaces',
  'The working capital the project ties up in inventory',
  'The after-tax resale value of the equipment at the end of the project',
];
const IRRELEVANT = [
  'The cost of a feasibility study for the project completed last month',
  'The part of headquarters’ electricity expenses allocated to the project',
  'The cost of the sports car the manager plans to buy with the profits',
  'Interest payments on the loan that finances the project',
  'Dividends the firm will pay out of the project’s profits',
  'Research costs already spent on the product, which cannot be recovered',
];

export function PS4_relevant(): Question {
  const sol = p_('Relevant are cash flows that differ with and without the project: opportunity costs, externalities on other products, extra expenses, working capital and salvage values. Sunk costs, allocations that do not change total costs and financing flows (interest, dividends) are not.');
  if (chance(0.5)) return mcText('PS4.relevant', '4', p_('Which of the following is relevant to the decision whether to undertake a project?'), pick(RELEVANT), shuffle(IRRELEVANT), sol);
  return mcText('PS4.relevant', '4', p_('Which of the following should NOT be included in the cash flows used to decide whether to undertake a project?'), pick(IRRELEVANT), shuffle(RELEVANT), sol);
}

export function PS4_npvMc(): Question {
  const d = G.npvDraw(), { I, cf, study, machine, cann, hq, r } = d;
  const wrongs = [d.wrong, d.pv([-I, ...cf], r), d.pv([-I - machine, ...cf], r), d.pv([-I, ...cf.map(x => x - cann)], r), d.flows.reduce((a, x) => a + x, 0), d.pv([-I - study - machine, ...cf.map(x => x - cann - hq)], r)];
  return mcNum('PS4.npvMc', '4', d.html + p_('What is the NPV of the project?'), d.npv, wrongs, one(d.c.s), { sol: G.npvSolution(d) });
}

export function PS4_waccMc(): Question {
  const d = G.waccDraw(), { c } = d;
  const html = p_(`${d.name} is an all-equity company with a cost of capital of ${pp(d.rU, 1)}. It levers up to a debt-to-value ratio of ${P(d.dv, 0)}, kept constant, and debtholders expect ${pp(d.rD, 1)}. The tax rate is ${P(d.tau, 0)}. Free cash flows are ${c.mil(d.fcf, 1)} next year${d.g ? `, growing at ${pp(d.g, 1)} a year` : ' and every year'} forever.`);
  const sol = p_(`r<sub>E</sub> = ${pp(d.rU, 1)} + ${fmtNum(d.dv / (1 - d.dv), 3)} × (${pp(d.rU, 1)} − ${pp(d.rD, 1)}) = ${pp(d.rE)}; WACC = ${P(1 - d.dv, 0)} × ${pp(d.rE)} + ${P(d.dv, 0)} × ${pp(d.rD, 1)} × (1 − ${P(d.tau, 0)}) = ${pp(d.wacc)} = r<sub>U</sub> − D/V·τ·r<sub>D</sub>. Value ${f2(d.fcf)} / (${pp(d.wacc)}${d.g ? ` − ${pp(d.g, 1)}` : ''}) = ${c.mil(d.VL)}.`);
  if (chance(0.5)) {
    return mcNum('PS4.waccMc', '4', html + p_('What is the WACC?'), d.wacc, [d.rU, (1 - d.dv) * d.rE + d.dv * d.rD, d.rU - d.tau * d.rD, (1 - d.dv) * d.rU + d.dv * d.rD * (1 - d.tau), d.rE * (1 - d.tau)], x => pp(x), { sol });
  }
  const gg = d.g;
  return mcNum('PS4.waccMc', '4', html + p_('What is the value of the levered company?'), d.VL, [d.VU, d.fcf / ((1 - d.dv) * d.rE + d.dv * d.rD - gg), d.VU + d.tau * d.dv * d.VU, d.fcf / (d.rE - gg)], mil(c.s), { sol });
}

export function PS4_betaMc(): Question {
  const d = G.betaDraw();
  const html = p_(`A firm with an equity beta of ${f2(d.bE + 0.4)} considers a project in a new line of business. A pure player in that business has an equity beta of ${f2(d.bE)}, a debt-to-equity ratio of ${f2(d.de)} and a debt beta of ${f2(d.bD)}. The risk-free rate is ${pp(d.rf, 1)} and the market risk premium ${pp(d.mrp, 1)}.`);
  const sol = p_(`Use the pure player’s business risk: β<sub>U</sub> = (${f2(d.bE)} + ${f2(d.de)} × ${f2(d.bD)}) / (1 + ${f2(d.de)}) = ${fmtNum(d.bU, 4)}, so r<sub>U</sub> = ${pp(d.rf, 1)} + ${fmtNum(d.bU, 4)} × ${pp(d.mrp, 1)} = ${pp(d.rU)}. The firm’s own beta reflects its existing business, not the project.`);
  return mcNum('PS4.betaMc', '4', html + p_('What is the project’s cost of capital if it is all-equity financed?'), d.rU,
    [d.rf + d.bE * d.mrp, d.rf + (d.bE + 0.4) * d.mrp, d.rf + d.bE / (1 + d.de) * d.mrp, d.bU * d.mrp, d.rf + (d.bE * (1 + d.de)) * d.mrp], x => pp(x), { sol });
}

export function PS4_terminalMc(): Question {
  const c = pick(['€', '$']), tau = pick([0.2, 0.25, 0.3]), r = rstep(0.07, 0.12, 0.01);
  if (chance(0.5)) {
    const sale = rstep(2, 8, 0.5), book = rstep(0, 6, 0.5);
    if (Math.abs(sale - book) < 0.5) return PS4_terminalMc();
    const salv = sale - tau * (sale - book);
    return mcNum('PS4.terminalMc', '4', p_(`At the end of a project, equipment with a book value of ${c}${f2(book)} million is sold for ${c}${f2(sale)} million. The tax rate is ${P(tau, 0)}. What after-tax cash flow does the sale bring?`), salv,
      [sale, sale * (1 - tau), book, sale + tau * (sale - book), book + (1 - tau) * sale], mil(c),
      { sol: p_(`Only the gain over book value is taxed${sale < book ? ' (here a loss, which gives a tax credit)' : ''}: ${f2(sale)} − ${P(tau, 0)} × (${f2(sale)} − ${f2(book)}) = ${c}${f2(salv)} million.`) });
  }
  const T = pick([3, 4, 5]), g = rstep(0.01, 0.04, 0.005), fcfT = rstep(5, 30, 0.5), tv = fcfT * (1 + g) / (r - g);
  return mcNum('PS4.terminalMc', '4', p_(`A project’s free cash flow in year ${T} is ${c}${f2(fcfT)} million and is expected to grow at ${pp(g, 1)} a year forever afterwards. The discount rate is ${pp(r, 0)}. What is the continuation value at the end of year ${T}?`), tv,
    [fcfT / (r - g), fcfT * (1 + g) / r, tv / (1 + r) ** T, fcfT / r, fcfT * (1 + g) / (r + g)], mil(c),
    { sol: p_(`TV<sub>${T}</sub> = FCF<sub>${T + 1}</sub> / (r − g) = ${f2(fcfT)} × ${fmtNum(1 + g, 3)} / (${pp(r, 0)} − ${pp(g, 1)}) = ${c}${f2(tv)} million, a value at year ${T}.`) });
}

const PS4_short = () => shortAnswer('PS4.short', '4', BANK['4'].MC);

// ---------------------------------------------------------------------

export type PsTypeSpec = { key: string; name: string; gen: () => Question; fromPs: boolean };
export type PsSpec = { id: string; topic: string; title: string; types: PsTypeSpec[] };
const T = (key: string, name: string, gen: () => Question, fromPs = true): PsTypeSpec => ({ key, name, gen, fromPs });

export const PROBLEM_SETS: PsSpec[] = [
  { id: '1', topic: '1', title: 'Equity financing', types: [
    T('PS1.ipo', 'Cost of an IPO (exercise)', retag('PS1.ipo', G.L1_ipo)),
    T('PS1.rights', 'Rights issue (exercise)', retag('PS1.rights', G.L1_rights)),
    T('PS1.winners', 'IPO underpricing and the winner’s curse', retag('PS1.winners', G.L1_winners)),
    T('PS1.ipoMc', 'IPO proceeds and cost', PS1_ipoMc),
    T('PS1.rightsMc', 'Share price after a rights issue', PS1_rightsMc),
    T('PS1.short', 'Short answers', PS1_short, false),
  ] },
  { id: '2', topic: '2', title: 'Debt financing', types: [
    T('PS2.arden', 'Risky and subordinated debt (exercise)', retag('PS2.arden', G.L2_seniority)),
    T('PS2.rating', 'Credit rating from the default spread', PS2_rating),
    T('PS2.faceMc', 'Face value and equity with risky debt', PS2_faceMc),
    T('PS2.straight', 'Financing with straight debt (exercise)', retag('PS2.straight', G.L2_straight)),
    T('PS2.convertible', 'Financing with a convertible bond (exercise)', retag('PS2.convertible', G.L2_convertible)),
    T('PS2.bankruptcy', 'Bankruptcy costs: straight or convertible', PS2_bankruptcy),
    T('PS2.yield', 'Bond price, yield and default spread', PS2_yield, false),
    T('PS2.short', 'Short answers', PS2_short, false),
  ] },
  { id: '3', topic: '3', title: 'Incentives and information', types: [
    T('PS3.effort', 'Effort with own cash, equity and debt (exercise)', retag('PS3.effort', G.L3_effort)),
    T('PS3.kappaMc', 'Largest effort cost for high effort', PS3_kappaMc),
    T('PS3.lemons', 'Asymmetric information: pooled prices (exercise)', retag('PS3.lemons', G.L3_lemons), false),
    T('PS3.pecking', 'Which security do good types issue?', PS3_pecking, false),
    T('PS3.short', 'Short answers', PS3_short, false),
  ] },
  { id: '4', topic: '4', title: 'Capital budgeting', types: [
    T('PS4.fcf', 'Free cash flow from financial statements (exercise)', retag('PS4.fcf', G.L4_fcf), false),
    T('PS4.relevant', 'Relevant cash flows', PS4_relevant, false),
    T('PS4.npvMc', 'NPV with incremental cash flows', PS4_npvMc, false),
    T('PS4.apv', 'APV with a debt schedule (exercise)', retag('PS4.apv', G.L4_apv), false),
    T('PS4.waccMc', 'WACC and levered value', PS4_waccMc, false),
    T('PS4.betaMc', 'Cost of capital from a twin firm', PS4_betaMc, false),
    T('PS4.terminalMc', 'Salvage and continuation value', PS4_terminalMc, false),
    T('PS4.short', 'Short answers', PS4_short, false),
  ] },
];

