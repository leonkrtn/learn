// Payoff diagrams of option positions: read the marked points off a plot (L2.diagram) and derive the same points by
// formula without a plot (L2.points). Net payoff = payoff at maturity + initial cash flow carried forward, CF0·e^(rT).
import { C, N, P, Q, calc, chance, chooseParts, p_, pick, roundTo, rstep, shuffle, tn, tq, withCalc, type Item } from '@/lib/engine/gen-helpers';
import type { Question } from '@/lib/engine/types';
import { CONT, STRATS, e2, f2, legStr, legText, mText, payoff, quoteTable, stratDraw, type Leg, type Strat } from './generators';

export const SINGLES: Strat[] = [
  { name: 'long call', view: 'a rise in the share price', n: 1, legs: ([a]) => [{ k: 'c', X: a, q: 1 }] },
  { name: 'short call', view: 'the share price not rising', n: 1, legs: ([a]) => [{ k: 'c', X: a, q: -1 }] },
  { name: 'long put', view: 'a fall in the share price', n: 1, legs: ([a]) => [{ k: 'p', X: a, q: 1 }] },
  { name: 'short put', view: 'the share price not falling', n: 1, legs: ([a]) => [{ k: 'p', X: a, q: -1 }] },
];
/** Call and put versions of a spread or butterfly have the same diagram, so a diagram names only the shape. */
const shapeName = (st: Strat) => st.name.replace(/ with (calls|puts)$/, '');
/** Each shape with the four shapes it is most easily confused with, the options of the naming question. */
const LOOKALIKE: Record<string, string[]> = {
  'long call': ['short put', 'bull spread', 'straddle', 'long put'],
  'short call': ['long put', 'bear spread', 'inverted straddle', 'long call'],
  'long put': ['short call', 'bear spread', 'straddle', 'long call'],
  'short put': ['long call', 'bull spread', 'inverted straddle', 'short call'],
  'bull spread': ['bear spread', 'long call', 'short put', 'butterfly spread'],
  'bear spread': ['bull spread', 'long put', 'short call', 'inverted strangle'],
  straddle: ['strangle', 'inverted straddle', 'butterfly spread', 'long call'],
  'inverted straddle': ['inverted strangle', 'straddle', 'butterfly spread', 'short put'],
  strangle: ['straddle', 'inverted strangle', 'butterfly spread', 'bull spread'],
  'inverted strangle': ['inverted straddle', 'strangle', 'butterfly spread', 'bear spread'],
  'butterfly spread': ['inverted straddle', 'inverted strangle', 'straddle', 'bull spread'],
};
/** "a straddle", "an inverted straddle". */
const an = (s: string) => (/^[aeiou]/.test(s) ? 'an ' : 'a ') + s;
const isSpread = (st: Strat) => /spread with/.test(st.name) && st.n === 2;
const isSingle = (st: Strat) => st.legs([1]).length === 1;
const pickPosition = () => (chance(0.4) ? pick(SINGLES) : pick(STRATS));

type Draw = ReturnType<typeof stratDraw>;
const EPS = 1e-6;

/** Slope of the net payoff above the highest strike (calls in the money) and below the lowest (puts in the money). */
const slopes = (legs: Leg[]) => ({
  hi: legs.filter(l => l.k === 'c').reduce((t, l) => t + l.q, 0),
  lo: -legs.filter(l => l.k === 'p').reduce((t, l) => t + l.q, 0),
});

/** Where the net payoff is extreme or every option expires worthless; `at` is a strike where the level is reached. */
function levels(d: Draw) {
  const xs = [...new Set(d.xs)].sort((a, b) => a - b);
  const zeroAt = xs.find(x => Math.abs(payoff(d.legs, x)) < EPS)!;
  const out: { id: 'LVL' | 'GAIN' | 'LOSS'; v: number; at: number; gain: boolean; loss: boolean }[] = [];
  const atKink = (v: number) => xs.find(x => Math.abs(d.net(x) - v) < EPS);
  const gain = Number.isFinite(d.maxP) && atKink(d.maxP) != null, loss = Number.isFinite(d.maxL) && atKink(d.maxL) != null;
  out.push({ id: 'LVL', v: d.fv, at: zeroAt, gain: gain && Math.abs(d.maxP - d.fv) < EPS, loss: loss && Math.abs(d.maxL - d.fv) < EPS });
  if (gain && Math.abs(d.maxP - d.fv) > EPS) out.push({ id: 'GAIN', v: d.maxP, at: atKink(d.maxP)!, gain: true, loss: false });
  if (loss && Math.abs(d.maxL - d.fv) > EPS) out.push({ id: 'LOSS', v: d.maxL, at: atKink(d.maxL)!, gain: false, loss: true });
  return out;
}

type Mark = { id: string; axis: 'x' | 'y'; v: number; at: number; letter: string; gain?: boolean; loss?: boolean };

/** Marks on the axes: strikes and break-evens on the horizontal axis, levels on the vertical axis. */
function marksOf(d: Draw): Omit<Mark, 'letter'>[] {
  const xs = [...new Set(d.xs)].sort((a, b) => a - b);
  const strikes = xs.map((X, i) => ({ id: xs.length === 1 ? 'X' : 'X' + (i + 1), axis: 'x' as const, v: X, at: X }));
  // At most six points: a butterfly shows the middle strike and one of the outer two.
  const shown = xs.length === 3 ? [strikes[1], strikes[pick([0, 2])]] : strikes;
  const bes = d.be.map((b, i) => ({ id: d.be.length === 1 ? 'BE' : 'BE' + (i + 1), axis: 'x' as const, v: b, at: b }));
  return [...shown, ...bes, ...levels(d).map(l => ({ ...l, axis: 'y' as const }))];
}

const W = 520, H = 300, PL = 46, PR = 34, PT = 26, PB = 30;
const rd = (x: number) => Math.round(x * 10) / 10;

/** The plot: net payoff against the share price at maturity, with letters at the marks and nothing else numeric. */
function frame(d: Draw, marks: Omit<Mark, 'letter'>[]) {
  const pts = [...d.xs, ...d.be], lo = Math.min(...pts), hi = Math.max(...pts), span = Math.max(hi - lo, 0.25 * hi);
  const x0 = Math.max(0, lo - 0.45 * span), x1 = hi + 0.45 * span;
  const knots = [x0, ...[...new Set(d.xs)].sort((a, b) => a - b), x1];
  const ys = [0, ...knots.map(d.net)], yLo = Math.min(...ys), yHi = Math.max(...ys), pad = 0.16 * (yHi - yLo);
  const y0 = yLo - pad, y1 = yHi + pad;
  const sx = (v: number) => rd(PL + (v - x0) / (x1 - x0) * (W - PL - PR));
  const sy = (v: number) => rd(PT + (1 - (v - y0) / (y1 - y0)) * (H - PT - PB));
  // Letters must not collide: points on an axis keep their distance from each other, from the origin and from the other axis.
  const xm = marks.filter(m => m.axis === 'x').map(m => sx(m.v)).sort((a, b) => a - b);
  const ym = marks.filter(m => m.axis === 'y').map(m => sy(m.v)).sort((a, b) => a - b);
  const ok = xm.every((p, i) => (i === 0 ? p - PL >= 26 : p - xm[i - 1] >= 30)) && ym.every((p, i) => (i === 0 || p - ym[i - 1] >= 20) && Math.abs(p - sy(0)) >= 16);
  return { ok, x0, x1, knots, sx, sy };
}

function svg(d: Draw, marks: Mark[], f: ReturnType<typeof frame>, axisLetter?: string): string {
  const { sx, sy, knots } = f, ax = sy(0), xEnd = W - PR + 14;
  const out: string[] = [];
  out.push(`<line class="ax" x1="${PL}" y1="${ax}" x2="${xEnd}" y2="${ax}"/><path class="arrow" d="M${xEnd} ${ax}l-7 -4v8z"/>`);
  out.push(`<line class="ax" x1="${PL}" y1="${H - 6}" x2="${PL}" y2="${PT - 14}"/><path class="arrow" d="M${PL} ${PT - 14}l-4 7h8z"/>`);
  out.push(`<text class="axl" x="${PL + 8}" y="${PT - 6}">Net payoff</text>`);
  out.push(axisLetter ? `<text class="lt" x="${xEnd}" y="${ax + 18}" text-anchor="end">${axisLetter}</text>`
    : `<text class="axl" x="${xEnd}" y="${ax + 18}" text-anchor="end">S<tspan class="sub" dy="4">T</tspan></text>`);
  for (const m of marks.filter(k => k.axis === 'y')) {
    const y = sy(m.v);
    out.push(`<line class="guide" x1="${PL}" y1="${y}" x2="${sx(m.at)}" y2="${y}"/><line class="tick" x1="${PL - 4}" y1="${y}" x2="${PL + 4}" y2="${y}"/>`);
    out.push(`<text class="lt" x="${PL - 9}" y="${rd(y + 5)}" text-anchor="end">${m.letter}</text>`);
  }
  for (const m of marks.filter(k => k.axis === 'x')) {
    const x = sx(m.v), yc = sy(d.net(m.v));
    if (/^X/.test(m.id)) {
      out.push(`<line class="guide" x1="${x}" y1="${ax}" x2="${x}" y2="${yc}"/><line class="tick" x1="${x}" y1="${ax - 4}" x2="${x}" y2="${ax + 4}"/>`);
      out.push(`<text class="lt" x="${x}" y="${yc < ax ? rd(ax + 18) : rd(ax - 8)}" text-anchor="middle">${m.letter}</text>`);
    } else {
      // A break-even: the letter goes on the side where the line is above the axis, below it.
      const rising = d.net(m.v + 0.01) > d.net(m.v - 0.01);
      out.push(`<circle class="dot" cx="${x}" cy="${ax}" r="3.5"/>`);
      out.push(`<text class="lt" x="${rising ? rd(x + 7) : rd(x - 7)}" y="${rd(ax + 18)}" text-anchor="${rising ? 'start' : 'end'}">${m.letter}</text>`);
    }
  }
  out.push(`<polyline class="curve" points="${knots.map(s => sx(s) + ',' + sy(d.net(s))).join(' ')}"/>`);
  return `<div class="payplot"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Net payoff at maturity against the share price at maturity, with lettered points">${out.join('')}</svg></div>`;
}

/** Draws a position whose plot has room for every letter. */
function drawPlot(st: Strat) {
  for (;;) {
    const d = stratDraw(undefined, st), m = marksOf(d), f = frame(d, m);
    if (f.ok) return { d, m, f };
  }
}

const ORD = ['lower', 'middle', 'upper'];
function strikeName(m: { id: string }, d: Draw) {
  const n = new Set(d.xs).size;
  if (m.id === 'X') return 'the strike price X';
  const i = +m.id.slice(1) - 1;
  return `the ${n === 2 ? (i === 0 ? 'lower' : 'upper') : ORD[i]} strike price`;
}
/** "the lower strike price" → "Lower strike price" for a step heading. */
const cap = (s: string) => s.replace(/^the /, '').replace(/^./, c => c.toUpperCase());
const beName = (m: { id: string }) => (m.id === 'BE' ? 'the break-even share price' : m.id === 'BE1' ? 'the lower break-even share price' : 'the upper break-even share price');

/** Break-even on the linear piece of the net payoff where it changes sign, as a worked step. */
function beMd(d: Draw, b: number, label: string) {
  const pts = [0, ...[...new Set(d.xs)].sort((a, c) => a - c), d.xs[d.xs.length - 1] * 3];
  let i = 0;
  for (; i < pts.length - 2; i++) if (b >= pts[i] - 1e-9 && b <= pts[i + 1] + 1e-9) break;
  const lo = pts[i], up = pts[i + 1], m = Math.round((d.net(up) - d.net(lo)) / (up - lo) * 1e6) / 1e6, a0 = d.net(lo) - m * lo;
  return `**${label}:** between ${tn(lo)} and ${tn(up)} the net payoff line is $${tn(a0, 4)} ${m < 0 ? '-' : '+'} ${tn(Math.abs(m), 0)} \\cdot S_T$. It crosses the horizontal axis where this is zero: $S_T = \\frac{${tn(-a0, 4)}}{${tn(m, 0)}} = ${tn(b, 4)}$.`;
}
const cfMd = (d: Draw) => {
  const pr = (l: Leg) => d.prem.get(l.k + l.X)!;
  return `**Initial cash flow:** buying costs the premium, selling brings it in. $CF_0 = ${d.legs.map(l => `${tq(-l.q, 0)} \\times ${tn(pr(l))}`).join(' + ')} = ${tn(d.cf0)}$.`;
};
const fvMd = (d: Draw, head: string) =>
  `**${head}:** where every option expires worthless the payoff is 0, so the line sits at the initial cash flow carried to maturity: $CF_0 e^{rT} = ${tq(d.cf0)} \\times e^{${tn(d.r, 4)} \\times ${tn(d.T, 6)}} = ${tq(d.cf0)} \\times ${tn(Math.exp(d.r * d.T), 6)} = ${tn(d.fv, 4)}$.`;
const levelMd = (d: Draw, v: number, at: number, head: string) =>
  `**${head}:** the line is flat or turns at ${tn(at)}; there the leg payoffs are $${d.legs.map(l => legStr(l, at)).join('$; $')}$, so the net payoff is $${tn(payoff(d.legs, at), 4)} + ${tq(d.fv, 4)} = ${tn(v, 4)}$.`;

const FORMULA: Record<string, [string, string[]]> = {
  'long call': ['X + c·eʳᵀ', ['X − c·eʳᵀ', 'c·eʳᵀ − X', 'X·eʳᵀ + c']],
  'short call': ['X + c·eʳᵀ', ['X − c·eʳᵀ', 'c·eʳᵀ − X', 'X·eʳᵀ − c']],
  'long put': ['X − p·eʳᵀ', ['X + p·eʳᵀ', 'p·eʳᵀ − X', 'X·eʳᵀ − p']],
  'short put': ['X − p·eʳᵀ', ['X + p·eʳᵀ', 'p·eʳᵀ − X', 'X·eʳᵀ + p']],
};
const AXIS = ['The share price at maturity, Sᴛ', 'Today’s share price, S₀', 'The strike price, X', 'The time to maturity'];

/** Read the lettered points off a payoff diagram, or compute their values from the premiums (lecture 2). */
export function L2_diagram(): Question {
  const st = pickPosition(), { d, m: raw, f } = drawPlot(st);
  const letters = shuffle('ABCDEF'.slice(0, raw.length).split(''));
  const marks: Mark[] = raw.map((m, i) => ({ ...m, letter: letters[i] }));
  const sorted = [...marks].sort((a, b) => (a.letter < b.letter ? -1 : 1)), opts = sorted.map(m => m.letter);
  const compute = chance(0.5);
  const axisLetter = !compute && chance(0.4) ? 'ABCDEFG'[marks.length] : undefined;
  const kk = calc();
  const intro = 'The diagram shows the net payoff at maturity of a position in European options on one share, all with the same maturity: the payoff at maturity plus the initial cash flow carried forward to that date.';
  const lvl = marks.find(m => m.id === 'LVL')!;

  if (compute) {
    const html = p_(`A share trades at ${e2(d.S)}. A trader sets up the following position in European options maturing in ${mText(d.T)}: ${d.legs.map(legText).join('; ')}. The risk-free rate is ${P(d.r)}. ${CONT}`) +
      quoteTable(d) + p_(intro.replace('a position in European options on one share, all with the same maturity', 'this position')) + svg(d, marks, f);
    const prompt = (m: Mark) => m.axis === 'x' ? `Point ${m.letter} lies on the horizontal axis. Which share price at maturity does it mark?` : `Point ${m.letter} lies on the vertical axis. Which net payoff does it mark?`;
    const items: Item[] = sorted.map(m => ({ part: N(prompt(m), m.v, 'eur', { key: m.letter }), w: /^BE/.test(m.id) ? 0.85 : /^X/.test(m.id) ? 0.25 : 0.8 }));
    const parts = chooseParts(items, 3, 4);
    kk.s(cfMd(d));
    kk.r(fvMd(d, `Point ${lvl.letter}`), lvl.letter, d.fv);
    for (const m of marks.filter(k => /^X/.test(k.id))) kk.r(`**Point ${m.letter}:** the line bends only at strikes; ${m.letter} is ${strikeName(m, d)}, ${tn(m.v)}.`, m.letter, m.v);
    for (const m of marks.filter(k => /^BE/.test(k.id))) kk.r(beMd(d, m.v, `Point ${m.letter} (${beName(m).replace('the ', '')})`), m.letter, m.v);
    for (const m of marks.filter(k => k.id === 'GAIN' || k.id === 'LOSS')) kk.r(levelMd(d, m.v, m.at, `Point ${m.letter} (largest ${m.id === 'GAIN' ? 'gain' : 'loss'})`), m.letter, m.v);
    const sol = p_(`This is ${an(st.name)}. Initial cash flow ${e2(d.cf0)}, carried to maturity ${e2(d.fv)}.`) +
      p_(sorted.map(m => `${m.letter} = ${e2(m.v)}`).join('; ') + '.');
    return { ...withCalc(Q('L2.diagram', 2, html, parts), kk.steps), solution: sol };
  }

  const html = p_(intro) + svg(d, marks, f, axisLetter) + p_('The letters mark points on the axes; no values are given.');
  const items: Item[] = [];
  for (const m of sorted) {
    if (/^X/.test(m.id)) items.push({ part: C(`Which point marks ${strikeName(m, d)}?`, opts, opts.indexOf(m.letter), 'k' + m.id), w: 0.75 });
    else if (/^BE/.test(m.id)) items.push({ part: C(`Which point marks ${beName(m)}?`, opts, opts.indexOf(m.letter), 'k' + m.id), w: 0.8 });
  }
  const phrases = (m: Mark) => [
    ...(m.id === 'LVL' && !isSpread(st) ? [d.fv < 0 ? 'the net premium paid, carried to maturity (the cost of the position)' : 'the net premium received, carried to maturity'] : []),
    ...(m.gain ? ['the largest possible net payoff'] : []), ...(m.loss ? ['the largest possible loss'] : []),
  ];
  const asked = new Map<string, string>();
  for (const m of sorted.filter(k => k.axis === 'y')) {
    const ph = phrases(m);
    if (!ph.length) continue;
    const p = pick(ph);
    asked.set(m.id, p);
    items.push({ part: C(`Which point marks ${p}?`, opts, opts.indexOf(m.letter), 'k' + m.id), w: 0.8 });
  }
  const shape = shapeName(st);
  items.push({ part: C('Which position does the diagram show?', shuffle([shape, ...LOOKALIKE[shape]]), 0, 'kName'), w: 0.55 });
  if (FORMULA[st.name]) items.push({ part: C(`With premium ${st.name.includes('call') ? 'c' : 'p'} paid or received today, which expression gives the break-even?`, shuffle([FORMULA[st.name][0], ...FORMULA[st.name][1]]), 0, 'kForm'), w: 0.6 });
  if (axisLetter) items.push({ part: C(`What does ${axisLetter} on the horizontal axis stand for?`, AXIS, 0, 'kAxis'), must: true });
  const parts = chooseParts(items, 3, 5).map(p => {
    if (p.type !== 'choice') return p;
    if (p.key === 'kName') return { ...p, correct: p.options.indexOf(shape) };
    if (p.key === 'kForm') return { ...p, correct: p.options.indexOf(FORMULA[st.name][0]) };
    return p;
  });

  if (axisLetter) kk.r(`**Horizontal axis (${axisLetter}):** a payoff diagram plots the result at maturity against the share price at maturity $S_T$. Today's price $S_0$ enters only through the premiums.`, 'kAxis');
  for (const m of sorted.filter(k => /^X/.test(k.id))) kk.r(`**${cap(strikeName(m, d))}:** the line bends only where an option starts to pay, at a strike. Point ${m.letter} sits under ${m.id === 'X' ? 'the bend' : ['the first', 'the second', 'the third'][+m.id.slice(1) - 1] + ' bend from the left'}.`, 'k' + m.id);
  for (const m of sorted.filter(k => /^BE/.test(k.id))) kk.r(`**${cap(beName(m))}:** the net payoff is zero where the line crosses the horizontal axis. That is point ${m.letter}.`, 'k' + m.id);
  for (const m of sorted.filter(k => k.axis === 'y' && asked.has(k.id))) {
    const p = asked.get(m.id)!;
    const why = /premium/.test(p) ? `where every option expires worthless the payoff is 0, so the line sits at the initial cash flow carried forward, $CF_0 e^{rT}$, which is ${d.fv < 0 ? 'negative: the premium paid' : 'positive: the premium received'}`
      : /gain/.test(p) ? 'the highest level the line reaches is the flat part or peak at the top' : 'the lowest level the line reaches is the flat part or trough at the bottom';
    kk.r(`**${cap(p)}:** ${why}. Its height is marked on the vertical axis by point ${m.letter}.`, 'k' + m.id);
  }
  kk.r(`**Shape:** ${shapeText(st)} That is ${an(shape)}${shape !== st.name && !isSingle(st) ? ' (with calls or with puts: both give this diagram)' : ''}.`, 'kName');
  if (FORMULA[st.name]) {
    const call = st.name.includes('call'), long = st.name.startsWith('long'), c = call ? 'c' : 'p';
    kk.r(`**Break-even:** the line is flat at $${long ? '-' : ''}${c} e^{rT}$ where the ${call ? 'call' : 'put'} expires worthless (${call ? 'below' : 'above'} $X$) and moves 1:1 with $S_T$ on the other side, so it reaches zero ${call ? 'above' : 'below'} the strike at $S_T = X ${call ? '+' : '-'} ${c} \\, e^{rT}$.`, 'kForm');
  }
  const sol = p_(`The diagram shows ${an(shape)}. ` + sorted.map(m => `${m.letter}: ${m.axis === 'x' ? (/^X/.test(m.id) ? strikeName(m, d) : beName(m)) : (phrases(m)[0] || (m.v === d.maxP ? 'the largest net payoff' : 'the largest loss'))}`).join('; ') + '.');
  return { ...withCalc(Q('L2.diagram', 2, html, parts), kk.steps), solution: sol };
}

function shapeText(st: Strat): string {
  const s = shapeName(st);
  const T: Record<string, string> = {
    'long call': 'flat and negative on the left, then rising 1:1 without limit to the right.',
    'short call': 'flat and positive on the left, then falling 1:1 without limit to the right.',
    'long put': 'falling 1:1 from the left down to a flat negative part on the right.',
    'short put': 'rising 1:1 from the left up to a flat positive part on the right.',
    'bull spread': 'flat at a loss on the left, rising between the two strikes, flat at a gain on the right.',
    'bear spread': 'flat at a gain on the left, falling between the two strikes, flat at a loss on the right.',
    straddle: 'a V with its lowest point (a loss) at one strike.',
    'inverted straddle': 'an upside-down V with its peak (a gain) at one strike, falling without limit on both sides.',
    strangle: 'flat at a loss between two strikes and rising on both sides: a V with a flat bottom.',
    'inverted strangle': 'flat at a gain between two strikes and falling on both sides.',
    'butterfly spread': 'flat at a small loss on both sides with a peak at the middle strike.',
  };
  return 'The line is ' + T[s];
}

// ---------------------------------------------------------------------------------------------------------------
// Without a plot: the same points from formulas, forwards and backwards.
// ---------------------------------------------------------------------------------------------------------------

/** Key points of a payoff diagram without the plot: height, intercept, slope, crossings and extremes (lecture 2). */
export function L2_points(): Question {
  return chance(0.4) ? pointsInverse() : pointsForward();
}

function pointsForward(): Question {
  const st = pickPosition(), d = stratDraw(undefined, st), sl = slopes(d.legs), one = new Set(d.xs).size === 1;
  const kk = calc();
  const html = p_(`A share trades at ${e2(d.S)}. A trader sets up the following position in European options maturing in ${mText(d.T)}: ${d.legs.map(legText).join('; ')}. The risk-free rate is ${P(d.r)}. ${CONT}`) + quoteTable(d) +
    p_('Think of the net payoff diagram: net payoff at maturity (payoff plus the initial cash flow carried forward) against the share price at maturity. Answer without drawing it.');
  const useHi = chance(0.5), slope = useHi ? sl.hi : sl.lo, where = one ? (useHi ? 'above the strike' : 'below the strike') : (useHi ? 'above the highest strike' : 'below the lowest strike');
  const items: Item[] = [
    { part: N('At what height is the line where every option expires worthless?', d.fv, 'eur', { key: 'lvl' }), w: 0.8 },
    { part: N('Where does the line meet the vertical axis (net payoff at a share price of 0)?', d.net(0), 'eur', { key: 'int' }), w: 0.5 },
    { part: N(`What is the slope of the line ${where} (change in net payoff per €1 rise in the share price)?`, slope, 'n', { key: 'slope' }), w: 0.6 },
    { part: N(d.be.length > 1 ? 'At which share price does the line cross the horizontal axis first (lower break-even)?' : 'At which share price does the line cross the horizontal axis (break-even)?', d.be[0], 'eur', { key: 'be1' }), must: true },
    ...(d.be.length > 1 ? [{ part: N('… and where does it cross it again (upper break-even)?', d.be[d.be.length - 1], 'eur', { key: 'be2' }), w: 0.6 }] : []),
    ...(Number.isFinite(d.maxP) ? [{ part: N('What is the highest point of the line (largest net payoff)?', d.maxP, 'eur', { key: 'maxP' }), w: 0.45 }] : []),
    ...(Number.isFinite(d.maxL) ? [{ part: N('What is the lowest point of the line (worst net payoff, a loss is negative)?', d.maxL, 'eur', { key: 'maxL' }), w: 0.45 }] : []),
  ];
  const parts = chooseParts(items, 3, 5);
  kk.s(cfMd(d));
  kk.r(fvMd(d, 'Height where all options expire worthless'), 'lvl', d.fv);
  kk.r(`**Vertical axis:** at $S_T = 0$ the leg payoffs are $${d.legs.map(l => legStr(l, 0)).join('$; $')}$. Net payoff $${tn(payoff(d.legs, 0), 4)} + ${tq(d.fv, 4)} = ${tn(d.net(0), 4)}$.`, 'int', d.net(0));
  const ins = d.legs.filter(l => (useHi ? l.k === 'c' : l.k === 'p'));
  kk.r(`**Slope ${where}:** there every ${useHi ? 'call is in the money and every put worthless' : 'put is in the money and every call worthless'}. Each long ${useHi ? 'call adds +1' : 'put adds −1'}, each short one the opposite: ${ins.length ? `$${ins.map(l => (useHi ? tq(l.q, 0) : tq(-l.q, 0))).join(' + ')} = ${tn(slope, 0)}$` : `no ${useHi ? 'call' : 'put'} is in the position, so the slope is $0$`}.`, 'slope', slope);
  kk.r(beMd(d, d.be[0], d.be.length > 1 ? 'Lower break-even' : 'Break-even'), 'be1', d.be[0]);
  if (d.be.length > 1) kk.r(beMd(d, d.be[d.be.length - 1], 'Upper break-even'), 'be2', d.be[d.be.length - 1]);
  const kinks = [0, ...[...new Set(d.xs)].sort((a, b) => a - b)];
  const kinkText = `The line is straight between the strikes, so its extremes sit at $S_T = 0$ or at a strike: $${kinks.map(s => `\\text{net}(${tn(s)}) = ${tn(d.net(s), 4)}`).join('$; $')}$.`;
  if (Number.isFinite(d.maxP)) kk.r(`**Highest point:** ${kinkText} ${sl.hi > 0 ? '' : 'Above the highest strike the slope is not positive, so nothing higher follows. '}The largest value is ${tn(d.maxP, 4)}.`, 'maxP', d.maxP);
  if (Number.isFinite(d.maxL)) kk.r(`**Lowest point:** ${kinkText} ${sl.hi < 0 ? '' : 'Above the highest strike the slope is not negative, so nothing lower follows. '}The smallest value is ${tn(d.maxL, 4)}.`, 'maxL', d.maxL);
  const sol = p_(`${an(st.name).replace(/^a/, 'A')}. Initial cash flow ${e2(d.cf0)}, at maturity ${e2(d.fv)}; net payoff at 0: ${e2(d.net(0))}; slope ${where}: ${slope}; break-even${d.be.length > 1 ? 's' : ''} ${d.be.map(e2).join(' and ')}.`);
  return { ...withCalc(Q('L2.points', 2, html, parts), kk.steps), solution: sol };
}

/** A single option from points of its diagram: strike and premium from the break-even and the flat part, or the flat part from strike and break-even. */
function pointsInverse(): Question {
  const st = pick(SINGLES), call = st.name.includes('call'), long = st.name.startsWith('long'), opt = call ? 'call' : 'put', c = call ? 'c' : 'p';
  const S = rstep(20, 120, 1), g = S >= 60 ? 5 : S >= 30 ? 2.5 : 1, X = roundTo(S * rstep(0.9, 1.1, 0.01), g);
  const r = rstep(0.02, 0.07, 0.0025), T = pick([2, 3, 4, 6, 9]) / 12, gr = Math.exp(r * T);
  const fv = roundTo(X * rstep(0.03, 0.12, 0.001), 0.01) || 0.5, lvl = long ? -fv : fv, be = call ? X + fv : X - fv;
  const prem = fv / gr, side = call ? 'below' : 'above', sT = roundTo(call ? X + fv * rstep(1.5, 3, 0.1) : X - fv * rstep(1.5, 3, 0.1), 0.5);
  const net = lvl + (long ? 1 : -1) * Math.max(call ? sT - X : X - sT, 0);
  const fromBe = chance(0.5);
  const kk = calc();
  const given = fromBe
    ? `is flat at ${e2(lvl)} for share prices ${side} the strike and crosses the horizontal axis at ${e2(be)}`
    : `has its kink at ${e2(X)} and crosses the horizontal axis at ${e2(be)}`;
  const html = p_(`The net payoff diagram (payoff at maturity plus the initial cash flow carried forward) of ${an(st.name)} on a share ${given}. The ${opt} is European and matures in ${mText(T)}; the risk-free rate is ${P(r)}. ${CONT}`);
  const items: Item[] = fromBe ? [
    { part: N('What is the strike price?', X, 'eur', { key: 'X' }), must: true },
    { part: N(`What premium was ${long ? 'paid' : 'received'} for the ${opt} today?`, prem, 'eur', { key: 'prem' }), must: true },
    { part: N(`What is the net payoff if the share ends at ${e2(sT)}?`, net, 'eur', { key: 'net' }), w: 0.6 },
  ] : [
    { part: N(`At what height is the flat part of the line (${side} the strike)?`, lvl, 'eur', { key: 'lvl' }), must: true },
    { part: N(`What premium was ${long ? 'paid' : 'received'} for the ${opt} today?`, prem, 'eur', { key: 'prem' }), must: true },
    { part: N(`What is the net payoff if the share ends at ${e2(sT)}?`, net, 'eur', { key: 'net' }), w: 0.6 },
  ];
  const parts = chooseParts(items, 2, 3);
  kk.s(`**Shape of ${an(st.name)}:** ${side} the strike the ${opt} expires worthless, so the line is flat at the premium carried to maturity, $${long ? '-' : '+'}${c} \\, e^{rT}$. On the other side it moves 1:1 ${long ? 'up into a gain' : 'down into a loss'}, so it crosses zero at $X ${call ? '+' : '-'} ${c} \\, e^{rT}$.`);
  if (fromBe) {
    kk.r(`**Strike:** the distance between the break-even and the strike is the premium carried to maturity, ${tn(fv)}. $X = ${tn(be)} ${call ? '-' : '+'} ${tn(fv)} = ${tn(X)}$.`, 'X', X);
  } else {
    kk.r(`**Flat part:** the premium carried to maturity is the distance between break-even and strike, $|${tn(be)} - ${tn(X)}| = ${tn(fv)}$. ${long ? 'It was paid, so the line sits at' : 'It was received, so the line sits at'} $${tn(lvl)}$.`, 'lvl', lvl);
  }
  kk.r(`**Premium today:** discount the carried amount. $${c} = ${tn(fv)} \\, e^{-${tn(r, 4)} \\times ${tn(T, 6)}} = ${tn(fv)} \\times ${tn(1 / gr, 6)} = ${tn(prem, 4)}$.`, 'prem', prem);
  const pay = Math.max(call ? sT - X : X - sT, 0);
  kk.r(`**Net payoff at ${tn(sT)}:** $${long ? '' : '-'}\\max(${call ? `${tn(sT)} - ${tn(X)}` : `${tn(X)} - ${tn(sT)}`}, 0) ${long ? '-' : '+'} ${tn(fv)} = ${long ? '' : '-'}${tn(pay)} ${long ? '-' : '+'} ${tn(fv)} = ${tn(net, 4)}$.`, 'net', net);
  const sol = p_(`Premium carried to maturity: |${f2(be)} − ${f2(X)}| = ${f2(fv)}; strike ${e2(X)}; premium today ${f2(fv)} × e<sup>−${tn(r, 4)} × ${tn(T, 4)}</sup> = ${e2(prem)}; flat part at ${e2(lvl)}.`);
  return { ...withCalc(Q('L2.points', 2, html, parts), kk.steps), solution: sol };
}

