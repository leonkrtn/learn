// Programming in Finance: procedural generators for VBA code reading (loops, arrays, conditionals, Call, Range objects,
// user-defined functions) and for the finance cases of the course (progressive income tax, uniform and Normal simulation,
// summary statistics and covariance, Sharpe and Sortino ratios). Every answer is computed from the same inputs the
// question shows; numeric parts use the 2% tolerance, counts, cells and labels are multiple choice.
import { C, N, P, Q, chance, chooseParts, eur, fmtNum, p_, pick, rint, rstep, shuffle, table } from '@/lib/engine/gen-helpers';
import { mcText } from '@/lib/engine/mc';
import type { ChoicePart, Part, Question } from '@/lib/engine/types';

// ---------------------------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------------------------

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Inline code. */
export const ic = (s: string) => '<code>' + esc(s) + '</code>';

/** A block of VBA code; comments (from a quote outside a string literal) are set in a lighter colour. */
export function code(lines: string[]): string {
  const hl = (l: string) => {
    let inStr = false;
    for (let i = 0; i < l.length; i++) {
      if (l[i] === '"') inStr = !inStr;
      else if (l[i] === "'" && !inStr) return esc(l.slice(0, i)) + '<span class="c">' + esc(l.slice(i)) + '</span>';
    }
    return esc(l);
  };
  return '<pre class="vba"><code>' + lines.map(hl).join('\n') + '</code></pre>';
}

/** Column letter of a column number: 1 → A, 27 → AA. */
export function colL(c: number): string {
  let s = '';
  for (let n = c; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s;
  return s;
}
export const addr = (r: number, c: number) => colL(c) + r;

/** A number as it appears in VBA code or in a MsgBox: point as decimal separator, no grouping. */
export const vb = (x: number) => String(+x.toFixed(8));
export const f2 = (x: number) => fmtNum(x, 2);
export const f4 = (x: number) => fmtNum(x, 4);
export const f6 = (x: number) => fmtNum(x, 6);

/** Choice part with text options: the right one and up to three distinct wrong ones. */
export function CT(prompt: string, right: string, wrong: string[]): ChoicePart {
  const w = shuffle([...new Set(wrong.filter(x => x !== right))]).slice(0, 3);
  const all = shuffle([right, ...w]);
  return C(prompt, all, all.indexOf(right));
}

/** Choice part with numeric options: typical mistakes first, then neighbours, so off-by-one errors are tested. */
export function CN(prompt: string, ans: number, wrong: number[], fmt: (x: number) => string = x => fmtNum(x, 4)): ChoicePart {
  const r = fmt(ans), seen = new Set([r]), w: string[] = [];
  for (const x of [...shuffle(wrong), ...[1, -1, 2, -2, 3, 5, -3, 10, 20].map(d => ans + d)]) {
    if (w.length >= 3) break;
    const s = fmt(x);
    if (Number.isFinite(x) && !seen.has(s)) { seen.add(s); w.push(s); }
  }
  const all = shuffle([r, ...w]);
  return C(prompt, all, all.indexOf(r));
}

/** Numeric part for small decimals (returns, standard deviations): 2% relative band with a tiny absolute floor. */
const Nd = (prompt: string, ans: number, floor = 1e-7) => N(prompt, ans, 'n', { abs: floor });

/** A worksheet excerpt: row numbers on the left, column letters on top. */
export function sheet(cols: number[], rows: [number, (string | number)[]][]): string {
  return table(['', ...cols.map(colL)], rows.map(([r, cells]) => [String(r), ...cells.map(c => typeof c === 'number' ? vb(c) : esc(c))]), 'sheet');
}

const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const stdevS = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const covS = (a: number[], b: number[]) => { const ma = mean(a), mb = mean(b); return a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0) / (a.length - 1); };

/** Inverse of the standard normal CDF (Acklam's rational approximation, relative error below 1.2e-9). */
export function normSInv(p: number): number {
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - lo) return -normSInv(1 - p);
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// ---------------------------------------------------------------------------------------------------------------
// Income tax table of Case 1 (Income taxes table.xlsx, rows 3 to 11; the top bracket has no upper limit)
// ---------------------------------------------------------------------------------------------------------------

export type TaxTable = { from: number[]; to: (number | null)[]; rate: number[] };
export const TAX: TaxTable = {
  from: [0, 7479, 11284, 15992, 20700, 26355, 38632, 50483, 78834],
  to: [7479, 11284, 15992, 20700, 26355, 38632, 50483, 78834, null],
  rate: [14.5, 21, 26.5, 28.5, 35, 37, 43.5, 45, 48],
};

/** Progressive tax: each bracket's rate applies only to the part of the income inside it. */
export function taxOf(income: number, t: TaxTable = TAX): number {
  let tax = 0;
  for (let k = 0; k < t.rate.length; k++) {
    const top = t.to[k] ?? Infinity;
    if (income > t.from[k]) tax += (Math.min(income, top) - t.from[k]) * t.rate[k] / 100;
  }
  return tax;
}
/** Index of the bracket that contains the income (first upper threshold ≥ income). */
export const bracketOf = (income: number, t: TaxTable = TAX) => { const k = t.to.findIndex(u => u == null || income <= u); return k < 0 ? t.to.length - 1 : k; };

function taxSheet(t: TaxTable, withF: boolean, first = 3): string {
  const head = ['Row', 'A (From)', 'B (To)', 'C (Rate %)', ...(withF ? ['D (Bracket)', 'E (Tax)', 'F (Cumul.)'] : [])];
  let cum = 0;
  const rows = t.rate.map((r, k) => {
    const to = t.to[k];
    const w = to == null ? null : to - t.from[k];
    const e = w == null ? null : w * r / 100;
    if (e != null) cum += e;
    return [String(first + k), sh(t.from[k]), to == null ? '(empty)' : sh(to), fmtNum(r, 1), ...(withF ? [w == null ? '' : sh(w), e == null ? '' : f2(e), e == null ? '' : f2(cum)] : [])];
  });
  return table(head, rows);
}
const sh = (x: number) => fmtNum(x, 0);

// ---------------------------------------------------------------------------------------------------------------
// Class 1: variables, references and loops
// ---------------------------------------------------------------------------------------------------------------

/** Trace an accumulator loop: the value written, the cell, the counter after the loop. */
export function L1_trace(): Question {
  const kind = pick(['add', 'addi', 'mul', 'sq'] as const);
  const a = rint(1, 3), b = a + rint(3, 6), r = rint(1, 12), c = rint(1, 6);
  let s0 = 0, body = '', f: (x: number, i: number) => number;
  if (kind === 'add') { s0 = rint(0, 20); const k = rint(2, 9); body = `x = x + ${k}`; f = x => x + k; }
  else if (kind === 'addi') { s0 = rint(0, 10); const k = rint(2, 6); body = `x = x + ${k} * i`; f = (x, i) => x + k * i; }
  else if (kind === 'mul') { s0 = pick([100, 1000, 50, 200]); const g = pick([1.02, 1.05, 1.1, 0.9, 1.03]); body = `x = x * ${vb(g)}`; f = x => x * g; }
  else { s0 = rint(0, 5); body = 'x = x + i * i'; f = (x, i) => x + i * i; }
  const run = (lo: number, hi: number) => { let x = s0; for (let i = lo; i <= hi; i++) x = f(x, i); return x; };
  const ans = run(a, b);
  const lines = ['Sub Loop_Test()', '    Dim x As Double', '    Dim i As Long', `    x = ${s0}`, `    For i = ${a} To ${b}`, `        ${body}`, '    Next', `    Worksheets("Sheet1").Cells(${r}, ${c}) = x`, '    MsgBox ("i = " & i)', 'End Sub'];
  const val: Part = kind === 'mul' ? N('Value of x written to the sheet', ans, 'n', { abs: 0.005 }) : CN('Value of x written to the sheet', ans, [run(a, b - 1), run(a, b + 1), run(a + 1, b), ans - s0]);
  const parts: Part[] = [
    val,
    CT('Cell that receives x', addr(r, c), [addr(c, r), addr(r, c + 1), addr(r + 1, c), colL(r) + c, addr(r, c + 2)]),
    CT('Message shown by the MsgBox', 'i = ' + (b + 1), ['i = ' + b, 'i = ' + (b - 1), 'i = ' + a, 'i = ' + vb(+ans.toFixed(4))]),
  ];
  const trace: string[][] = [];
  let x = s0;
  for (let i = a; i <= b; i++) { x = f(x, i); trace.push([String(i), f4(x)]); }
  const sol = p_(`The loop runs ${b - a + 1} times, for i = ${a} to ${b}. x after each iteration:`) + table(['i', 'x'], trace) +
    p_(`Cells(${r}, ${c}) is row ${r}, column ${c} = ${addr(r, c)}. Next raises i once more after the last pass, so the loop ends with i = ${b + 1}.`);
  return { ...Q('L1.trace', 1, p_('Read the Sub and answer the questions.') + code(lines), parts), solution: sol };
}

/** Copy-paste with code: which cells a loop writes and what they hold. */
export function L1_cells(): Question {
  const sc = rint(1, 3), a = rint(1, 3), b = a + rint(2, 5), k = pick([0, 1, 2, 5, 10]);
  let dc = rint(2, 6);
  if (dc === sc) dc = sc + 2;
  const m = pick([1, 1, 2, 1.1, 0.5, 100]);
  const prices = Array.from({ length: b + 1 }, () => rstep(20, 250, 0.25));
  const expr = `Worksheets("Sheet1").Cells(i, ${sc})` + (m === 1 ? '' : ' * ' + vb(m));
  const lines = ['Sub Copy_Prices()', '    Dim i As Long', `    For i = ${a} To ${b}`, `        Worksheets("Sheet1").Cells(i${k ? ' + ' + k : ''}, ${dc}) = ${expr}`, '    Next', 'End Sub'];
  const j = rint(a, b);
  const parts: Part[] = [
    CT('Last cell written by the loop', addr(b + k, dc), [addr(b, dc), addr(b + k + 1, dc), addr(b + k, sc), addr(dc, b + k), addr(a + k, dc)]),
    CN('Number of cells written', b - a + 1, [b - a, b - a + 2, b]),
    N(`Value written to ${addr(j + k, dc)}`, prices[j] * m, 'n', { abs: 0.005 }),
  ];
  const rows: [number, (string | number)[]][] = Array.from({ length: b }, (_, i) => [i + 1, [prices[i + 1]]]);
  const html = p_(`Column ${colL(sc)} of Sheet1 holds share prices:`) + sheet([sc], rows) + p_('The following Sub runs:') + code(lines);
  const sol = p_(`i runs from ${a} to ${b}: ${b - a + 1} iterations. Each reads ${colL(sc)}i (row i, column ${sc}) and writes row i${k ? ' + ' + k : ''}, column ${dc} (${colL(dc)}). The last write goes to ${addr(b + k, dc)}.`) +
    p_(`${addr(j + k, dc)} receives the price in ${addr(j, sc)}${m === 1 ? '' : ' × ' + vb(m)}: ${f2(prices[j])}${m === 1 ? '' : ' × ' + vb(m) + ' = ' + f2(prices[j] * m)}.`);
  return { ...Q('L1.cells', 1, html, parts), solution: sol };
}

/** Types, assignment and concatenation in a small portfolio Sub. */
export function L1_types(): Question {
  const ticker = pick(['AAPL', 'MSFT', 'SAP', 'ASML', 'GALP', 'EDP', 'BCP', 'NOS', 'JMT', 'SON']);
  let q = rstep(5, 60, 0.1);
  while (Math.abs(q - Math.floor(q) - 0.5) < 1e-9) q = rstep(5, 60, 0.1);
  if (chance(0.35)) q = Math.round(q);
  const p = rstep(10, 300, 0.05);
  const shares = Math.round(q), total = shares * p;
  const lines = ['Sub My_Portfolio()', '    Dim ticker As String', '    Dim shares As Long', '    Dim price As Double', '    Dim total', '', `    ticker = "${ticker}"`, `    shares = ${vb(q)}`, `    price = ${vb(p)}`, '    total = shares * price', '', '    MsgBox ("Stock: " & ticker & ", Value: " & total)', 'End Sub'];
  const msg = `Stock: ${ticker}, Value: ${vb(total)}`;
  const parts = chooseParts([
    { part: CN('Value stored in shares', shares, [q === shares ? shares + 1 : q, Math.floor(q), Math.ceil(q) === shares ? Math.floor(q) : Math.ceil(q)], x => vb(x)), w: q === shares ? 0.3 : 0.9 },
    { part: N('Value of total', total, 'n', { abs: 0.005 }), must: true },
    { part: CT('Type of the variable total', 'Variant', ['Double', 'Long', 'String']), w: 0.5 },
    { part: CT('Text shown by the MsgBox', msg, ['Stock: ticker, Value: total', `Stock: ${ticker}, Value: ${vb(q * p)}`, `Stock: ${ticker}, Value: shares * price`, `Stock:${ticker},Value:${vb(total)}`]), w: 0.7 },
  ], 3, 3);
  const sol = p_(`shares is a Long, so ${vb(q)} is stored as the whole number ${shares}.${q === shares ? '' : ' The decimals are lost before the multiplication.'}`) +
    p_(`total has no type, so it is a Variant; it holds ${shares} × ${vb(p)} = ${vb(total)}. & glues the pieces into “${esc(msg)}”.`);
  return { ...Q('L1.types', 1, p_('Read the Sub and answer the questions.') + code(lines), parts), solution: sol };
}

// ---------------------------------------------------------------------------------------------------------------
// Class 2: arrays, conditionals and debugging
// ---------------------------------------------------------------------------------------------------------------

/** Arrays with accumulators: sum, average, maximum or a count. */
export function L2_array(): Question {
  const n = rint(4, 6), prices = Array.from({ length: n }, () => rstep(40, 240, 0.5));
  const kind = pick(['avg', 'max', 'count', 'single'] as const);
  const th = rstep(80, 200, 10);
  const total = prices.reduce((s, x) => s + x, 0);
  const head = ['Sub Store_Prices()', `    Dim prices(1 To ${n}) As Double`, '    Dim total As Double', '    Dim i As Long'];
  let lines: string[] = [], parts: Part[] = [], sol = '';
  if (kind === 'single') {
    lines = ['Sub Sum_Prices()', '    Dim price As Double', '    Dim total As Double', '    Dim i As Long', '    total = 0', `    For i = 1 To ${n}`, '        price = Worksheets("Sheet1").Cells(i, 2)', '        total = total + price', '    Next', '    MsgBox ("Total = " & total)', 'End Sub'];
    parts = [N('Total shown by the MsgBox', total, 'n', { abs: 0.005 }), CN('Value of price after the loop', prices[n - 1], [prices[0], total, prices[n - 2]], f2), CN('Value of i after the loop', n + 1, [n, n - 1, 1])];
    sol = p_(`total accumulates ${prices.map(f2).join(' + ')} = ${f2(total)}. The single variable price is overwritten in every iteration, so only the last value, ${f2(prices[n - 1])}, survives; an array would keep all of them.`);
  } else if (kind === 'avg') {
    lines = [...head, '    total = 0', `    For i = 1 To ${n}`, '        prices(i) = Worksheets("Sheet1").Cells(i, 2)', '        total = total + prices(i)', '    Next', `    Worksheets("Sheet1").Cells(${n + 2}, 2) = total / ${n}`, 'End Sub'];
    const k = rint(1, n);
    parts = [N(`Value written to B${n + 2}`, total / n, 'n', { abs: 0.005 }), N('Value of total after the loop', total, 'n', { abs: 0.005 }), CN(`Value of prices(${k}) after the loop`, prices[k - 1], [prices[n - 1], total, prices[(k) % n]], f2)];
    sol = p_(`total = ${prices.map(f2).join(' + ')} = ${f2(total)}; average = ${f2(total)} / ${n} = ${f2(total / n)}. The array still holds every price, so prices(${k}) = ${f2(prices[k - 1])}.`);
  } else if (kind === 'max') {
    const mx = Math.max(...prices);
    lines = [...head, '    Dim max_price As Double', '    total = 0', `    For i = 1 To ${n}`, '        prices(i) = Worksheets("Sheet1").Cells(i, 2)', '        total = total + prices(i)', '    Next', '    max_price = prices(1)', `    For i = 2 To ${n}`, '        If prices(i) > max_price Then', '            max_price = prices(i)', '        End If', '    Next', '    MsgBox ("Max = " & max_price & ", total = " & total)', 'End Sub'];
    parts = [CN('Value of max_price', mx, [prices[0], prices[n - 1], Math.min(...prices)], f2), N('Value of total', total, 'n', { abs: 0.005 })];
    sol = p_(`max_price starts at prices(1) = ${f2(prices[0])} and is replaced whenever a later price is larger: the maximum is ${f2(mx)}. total = ${f2(total)}.`);
  } else {
    const cnt = prices.filter(x => x > th).length;
    lines = [...head, '    Dim cnt As Long', '    cnt = 0', `    For i = 1 To ${n}`, '        prices(i) = Worksheets("Sheet1").Cells(i, 2)', `        If prices(i) > ${th} Then`, '            cnt = cnt + 1', '        End If', '    Next', '    MsgBox ("Count = " & cnt)', 'End Sub'];
    parts = [CN('Count shown by the MsgBox', cnt, [n - cnt, cnt + 1, n]), CN('Value of i after the loop', n + 1, [n, n - 1, 1])];
    sol = p_(`Prices above ${th}: ${prices.filter(x => x > th).map(f2).join(', ') || 'none'}, so cnt = ${cnt}. After the loop i = ${n + 1}.`);
  }
  const html = p_('Sheet1 holds these prices in column B:') + sheet([2], prices.map((x, i) => [i + 1, [x]])) + p_('Read the Sub and answer the questions.') + code(lines);
  return { ...Q('L2.array', 2, html, parts), solution: sol };
}

const SIGNALS = ['Strong Buy', 'Buy', 'Hold', 'Sell'];

/** If / ElseIf / Else: which branch runs, including the order trap and boundary values. */
export function L2_signal(): Question {
  const th = pick([0.01, 0.02, 0.03]), strong = pick([0.08, 0.1]), wrongOrder = chance(0.4), ge = chance(0.35);
  const op = ge ? '>=' : '>';
  const lines = ['Sub Trading_Signal()', '    Dim ret As Double', '    ret = Worksheets("Sheet1").Cells(3, 2)',
    ...(wrongOrder
      ? [`    If ret ${op} ${vb(th)} Then`, '        MsgBox ("Buy")', `    ElseIf ret > ${vb(strong)} Then`, '        MsgBox ("Strong Buy")']
      : [`    If ret > ${vb(strong)} Then`, '        MsgBox ("Strong Buy")', `    ElseIf ret ${op} ${vb(th)} Then`, '        MsgBox ("Buy")']),
    `    ElseIf ret < ${vb(-th)} Then`, '        MsgBox ("Sell")', '    Else', '        MsgBox ("Hold")', '    End If', 'End Sub'];
  const buy = (r: number) => ge ? r >= th - 1e-12 : r > th + 1e-12;
  const sig = (r: number) => {
    if (wrongOrder) { if (buy(r)) return 'Buy'; if (r > strong) return 'Strong Buy'; }
    else { if (r > strong) return 'Strong Buy'; if (buy(r)) return 'Buy'; }
    if (r < -th - 1e-12) return 'Sell';
    return 'Hold';
  };
  const pool = shuffle([strong + pick([0.01, 0.02, 0.05]), th, -th, th + 0.005, -th - 0.01, 0, th / 2, strong, -0.05]);
  const rets = [pool[0], ...pool.slice(1).filter(x => x !== pool[0]).slice(0, 2)];
  if (!rets.some(r => r > strong)) rets[0] = strong + 0.02;
  const parts = rets.map(r => C(`B3 holds ${vb(r)}: message shown`, SIGNALS, SIGNALS.indexOf(sig(r))));
  const sol = (wrongOrder ? p_(`The Buy test comes first. VBA runs the first true branch only, so every return above ${vb(strong)} already triggers “Buy” and “Strong Buy” is never reached.`) : '') +
    p_(rets.map(r => `ret = ${vb(r)} → ${sig(r)}`).join('; ') + '.') +
    p_(`Boundary values: ${op} ${vb(th)} ${ge ? 'includes' : 'excludes'} ${vb(th)} itself, and < ${vb(-th)} excludes ${vb(-th)}.`);
  return { ...Q('L2.signal', 2, p_('Read the Sub. What does it show for each value in B3?') + code(lines), parts), solution: sol };
}

const NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Hugo', 'Ines', 'João', 'Kira', 'Luis'];

/** A loop with an If inside: classify rows and count. */
export function L2_filter(): Question {
  const n = rint(5, 7), names = shuffle(NAMES).slice(0, n), th = pick([30000, 35000, 40000]);
  const sal = Array.from({ length: n }, () => rint(20, 55) * 1000);
  if (chance(0.5)) sal[rint(0, n - 1)] = th;
  const ge = chance(0.3), op = ge ? '>=' : '>', withSum = chance(0.5);
  const senior = (s: number) => ge ? s >= th : s > th;
  const cnt = sal.filter(senior).length, sum = sal.filter(senior).reduce((a, b) => a + b, 0);
  const lines = ['Sub Salary_Filter()', '    Dim salary As Double', '    Dim senior_count As Long', ...(withSum ? ['    Dim senior_total As Double'] : []), '    Dim i As Long', '    senior_count = 0',
    `    For i = 1 To ${n}`, '        salary = Worksheets("Sheet1").Cells(i, 2)', `        If salary ${op} ${th} Then`, '            Worksheets("Sheet1").Cells(i, 3) = "Senior"', '            senior_count = senior_count + 1',
    ...(withSum ? ['            senior_total = senior_total + salary'] : []), '        Else', '            Worksheets("Sheet1").Cells(i, 3) = "Junior"', '        End If', '    Next', '    MsgBox ("Senior employees: " & senior_count)', 'End Sub'];
  const eq = sal.findIndex(s => s === th);
  const k = eq >= 0 && chance(0.7) ? eq : rint(0, n - 1);
  const parts: Part[] = [
    CN('Number shown by the MsgBox', cnt, [n - cnt, cnt + 1, cnt - 1, n]),
    C(`Label written to C${k + 1}`, ['Senior', 'Junior'], senior(sal[k]) ? 0 : 1),
    ...(withSum ? [N('Value of senior_total after the loop', sum, 'eur')] : []),
  ];
  const html = p_('Sheet1 holds names in column A and salaries in column B:') + sheet([1, 2], names.map((nm, i) => [i + 1, [nm, sal[i]]])) + p_('Read the Sub and answer the questions.') + code(lines);
  const sol = p_(`Seniors (salary ${op} ${sh(th)}): ${names.filter((_, i) => senior(sal[i])).join(', ') || 'none'}, so senior_count = ${cnt}.`) +
    p_(`Row ${k + 1}: ${names[k]} earns ${sh(sal[k])}, label “${senior(sal[k]) ? 'Senior' : 'Junior'}”.${sal[k] === th ? ` The salary equals the threshold, so ${op} decides.` : ''}`) +
    (withSum ? p_(`senior_total = ${sal.filter(senior).map(sh).join(' + ') || '0'} = ${sh(sum)}.`) : '');
  return { ...Q('L2.filter', 2, html, parts), solution: sol };
}

const ERRS = ['Subscript out of range', 'Type mismatch', 'Expected: End If', 'Run-time error 91 (object variable not set)', 'No error: the code runs'];

/** Debugging: which error does the code raise? */
export function L2_errors(): Question {
  const n = rint(3, 5);
  const cases: (() => { html: string; right: string; sol: string })[] = [
    () => ({ html: code(['Sub Store_Prices()', `    Dim prices(1 To ${n - 1}) As Double`, '    Dim i As Long', `    For i = 1 To ${n}`, '        prices(i) = Worksheets("Sheet1").Cells(i, 2)', '    Next', 'End Sub']), right: ERRS[0], sol: p_(`The array has ${n - 1} slots; when i reaches ${n}, prices(${n}) does not exist: “Subscript out of range”.`) }),
    () => ({ html: p_('The workbook has one worksheet, renamed from “Sheet1” to “Portfolio”.') + code(['Sub Read_Price()', '    Dim price As Double', '    price = Worksheets("Sheet1").Cells(3, 2)', '    MsgBox ("Price: " & price)', 'End Sub']), right: ERRS[0], sol: p_('No worksheet is called “Sheet1” any more, so Worksheets("Sheet1") points to nothing: “Subscript out of range”.') }),
    () => ({ html: p_('Cell B3 of Sheet1 contains the text “n/a”.') + code(['Sub Read_Price()', '    Dim price As Double', '    price = Worksheets("Sheet1").Cells(3, 2)', '    MsgBox ("Price: " & price)', 'End Sub']), right: ERRS[1], sol: p_('Text cannot be stored in a Double: “Type mismatch”.') }),
    () => ({ html: code(['Sub Classify_Return()', '    Dim ret As Double', '    ret = Worksheets("Sheet1").Cells(1, 2)', '    If ret > 0 Then', '        MsgBox ("Positive")', '    Else', '        MsgBox ("Not positive")', 'End Sub']), right: ERRS[2], sol: p_('The If block is never closed. VBA refuses to compile: “Expected: End If”. Write End If right after If, then fill in the middle.') }),
    () => ({ html: code(['Sub Store_Prices()', `    Dim prices(1 To ${n}) As Double`, '    Dim i As Long', `    For i = 1 To ${n}`, '        prices(i) = Worksheets("Sheet1").Cells(i, 2)', '    Next', '    MsgBox ("First: " & prices(1))', 'End Sub']), right: ERRS[4], sol: p_(`The loop stays inside the bounds 1 to ${n} and Sheet1 holds numbers in column B: the code runs.`) }),
    () => ({ html: code(['Sub Test_Random()', '    Dim ws As Worksheet', '    ws = Worksheets("Sheet1")', '    ws.Cells(3, 1) = Rnd()', 'End Sub']), right: ERRS[3], sol: p_('A Worksheet is an object and must be assigned with Set ws = Worksheets("Sheet1"); without Set VBA stops with run-time error 91.') }),
  ];
  const c = pick(cases)();
  const html = p_('Unless stated otherwise, Sheet1 exists and holds numbers in column B. What happens when you run this code?') + c.html;
  return mcText('L2.errors', '2', html, c.right, ERRS.filter(e => e !== c.right), c.sol, false);
}

// ---------------------------------------------------------------------------------------------------------------
// Class 3: Case 1, the income tax model
// ---------------------------------------------------------------------------------------------------------------

/** Tax for an income with the course's table: bracket, cells used, tax, average and marginal rate. */
export function L3_tax(): Question {
  const income = chance(0.15) ? pick(TAX.to.slice(0, 8) as number[]) : rint(4, 157) * 500;
  const k = bracketOf(income), tax = taxOf(income), withF = chance(0.5);
  const inTable = TAX.to[k] != null;
  const rowOpts = TAX.to.slice(0, 8).map((_, i) => 'B' + (i + 3));
  const parts = chooseParts([
    { part: N('Total tax', tax, 'eur'), must: true },
    ...(inTable ? [{ part: C('Cell to overwrite with the income', rowOpts, k), w: 0.7 }] : []),
    { part: N('Average tax rate (tax ÷ income)', tax / income * 100, 'pct', { abs: 0.01 }), w: 0.5 },
    { part: N('Marginal tax rate', TAX.rate[k], 'pct', { abs: 0.01 }), w: 0.4 },
  ], 2, 3);
  const html = p_(`The income tax table of Case 1 is on Sheet2, rows 3 to 11${withF ? ', with the helper columns D to F' : ''}:`) + taxSheet(TAX, withF) +
    p_(`A client earns <b>€${sh(income)}</b>.`);
  let cum = 0; const steps: string[] = [];
  for (let i = 0; i <= k; i++) { const top = Math.min(income, TAX.to[i] ?? Infinity); const t = (top - TAX.from[i]) * TAX.rate[i] / 100; cum += t; steps.push(`(${sh(top)} − ${sh(TAX.from[i])}) × ${fmtNum(TAX.rate[i], 1)}% = ${f2(t)}`); }
  const sol = p_(`The income lies in row ${k + 3} (${sh(TAX.from[k])} to ${TAX.to[k] == null ? 'no limit' : sh(TAX.to[k]!)}).` + (inTable ? ` In the worksheet: overwrite B${k + 3} with ${sh(income)}, read F${k + 3}, restore B${k + 3}.` : ' The top bracket has no upper threshold to overwrite; compute the last bracket by hand.')) +
    '<ul>' + steps.map(s => '<li>' + s + '</li>').join('') + '</ul>' +
    p_(`Total tax ${eur(tax)}; average rate ${f2(tax / income * 100)}%, marginal rate ${fmtNum(TAX.rate[k], 1)}%.`);
  return { ...Q('L3.tax', 3, html, parts), solution: sol };
}

/** A new progressive table: bracket width, bracket tax, cumulative tax and the tax for an income. */
export function L3_table(): Question {
  const n = rint(4, 6);
  const from = [0]; const rate: number[] = [];
  let r = rstep(8, 15, 0.5);
  for (let i = 0; i < n; i++) { rate.push(r); r = +(r + rstep(4, 10, 0.5)).toFixed(1); if (i < n - 1) from.push(from[i] + rint(4, 16) * 1000); }
  const to: (number | null)[] = [...from.slice(1), null];
  const t: TaxTable = { from, to, rate };
  const income = rint(Math.round(from[1] / 500) + 1, Math.round((from[n - 1] + 15000) / 500)) * 500;
  const k = bracketOf(income, t), j = rint(0, n - 2);
  const width = (to[j] as number) - from[j], ej = width * rate[j] / 100;
  const cumJ = taxOf(to[j] as number, t), tax = taxOf(income, t);
  const parts = chooseParts([
    { part: N(`Tax of the bracket in row ${j + 3} (column E)`, ej, 'eur'), w: 0.6 },
    { part: N(`Cumulative tax in F${j + 3}`, cumJ, 'eur'), w: 0.6 },
    { part: N(`Tax for an income of €${sh(income)}`, tax, 'eur'), must: true },
    { part: N('Average tax rate for that income', tax / income * 100, 'pct', { abs: 0.01 }), w: 0.4 },
  ], 2, 3);
  const html = p_('A consulting client uses this progressive tax table (D = B − A, E = D × C / 100, F = cumulative sum of E):') + taxSheet(t, false);
  const sol = p_(`Row ${j + 3}: width ${sh(to[j] as number)} − ${sh(from[j])} = ${sh(width)}, tax ${sh(width)} × ${fmtNum(rate[j], 1)}% = ${f2(ej)}; F${j + 3} = ${f2(cumJ)}.`) +
    p_(`€${sh(income)} lies in row ${k + 3}: tax = F${k + 2} (tax up to ${sh(from[k])}, ${f2(taxOf(from[k], t))}) + (${sh(income)} − ${sh(from[k])}) × ${fmtNum(rate[k], 1)}% = ${f2(tax)}; average rate ${f2(tax / income * 100)}%.`);
  return { ...Q('L3.table', 3, html, parts), solution: sol };
}

/** The core loop of income_tax_main: Exit For, the cells used, and < versus <=. */
export function L3_code(): Question {
  const strict = chance(0.4), op = strict ? '<' : '<=';
  let income: number;
  if (chance(0.45)) income = TAX.to[rint(0, 6)] as number;
  else { do income = rint(3, 155) * 500; while (income >= 78834); }
  const upper = TAX.to.map(u => u ?? 0);
  const i = upper.findIndex((u, k) => k < 9 && (strict ? income < u : income <= u)) + 1;
  const tax = taxOf(income);
  const lines = ['    Dim tax As Double', '    For i = 1 To 9', `        If income ${op} upper(i) Then`, '            Worksheets("Sheet2").Cells(i + 2, 2) = income', '            tax = Worksheets("Sheet2").Cells(i + 2, 6)', '            Exit For', '        End If', '    Next'];
  const html = p_('Step 2 of income_tax_main has saved the upper thresholds B3:B11 of Sheet2 in upper(1 To 9) with upper(i) = Cells(i + 2, 2). B11 is empty (the top bracket has no limit). Columns D to F compute the bracket widths, bracket taxes and the cumulative tax from A to C.') +
    taxSheet(TAX, false) + p_(`Step 3 runs with <b>income = ${vb(income)}</b>:`) + code(lines);
  const parts: Part[] = [
    CN('Value of i when Exit For runs', i, [i + 1, i - 1, 9]),
    CT('Cell overwritten with the income', addr(i + 2, 2), [addr(i + 1, 2), addr(i + 3, 2), addr(i + 2, 6), addr(i, 2)]),
    CT('Cell the tax is read from', addr(i + 2, 6), [addr(i + 2, 5), addr(i + 1, 6), addr(i + 2, 2), addr(i, 6)]),
    N('Tax read into the variable tax', tax, 'eur'),
  ];
  const eqTh = upper.indexOf(income) + 1;
  const sol = p_(`The first i with income ${op} upper(i) is i = ${i} (upper(${i}) = ${sh(upper[i - 1])}), so row ${i + 2}: overwrite B${i + 2}, read F${i + 2}, Exit For.`) +
    (eqTh > 0 ? p_(strict
      ? `The income equals upper(${eqTh}), and with < that row is skipped: row ${i + 2} is overwritten instead. Its bracket width becomes 0, so F${i + 2} equals F${eqTh + 2} and the tax is still right.`
      : `The income equals upper(${eqTh}); <= keeps it in row ${eqTh + 2}, so F${eqTh + 2} is the tax directly.`) : '') +
    p_(`Tax = ${eur(tax)}. Without Exit For, later rows would also satisfy the condition and be overwritten, giving the wrong tax.`);
  return { ...Q('L3.code', 3, html, parts), solution: sol };
}

// ---------------------------------------------------------------------------------------------------------------
// Class 4: parameterised Subs and Call
// ---------------------------------------------------------------------------------------------------------------

/** Classify(income, out_row) called in a loop. */
export function L4_call(): Question {
  const th = pick([40000, 50000, 60000]), a = 2, b = a + rint(2, 5), off = pick([0, 0, 1, 10]), oc = pick([2, 3]);
  const inc = Array.from({ length: b - a + 1 }, () => rint(20, 95) * 1000);
  if (chance(0.5)) inc[rint(0, inc.length - 1)] = th;
  const high = inc.filter(x => x > th).length;
  const lines = ['Sub Classify(income As Double, out_row As Long)', `    If income > ${th} Then`, `        Worksheets("Sheet1").Cells(out_row, ${oc}) = "High"`, '    Else', `        Worksheets("Sheet1").Cells(out_row, ${oc}) = "Low"`, '    End If', 'End Sub', '',
    'Sub Test_Classify()', '    Dim income As Double', '    Dim r As Long', `    For r = ${a} To ${b}`, '        income = Worksheets("Sheet1").Cells(r, 1)', `        Call Classify(income, r${off ? ' + ' + off : ''})`, '    Next', 'End Sub'];
  const eq = inc.indexOf(th);
  const kk = eq >= 0 && chance(0.6) ? eq : rint(0, inc.length - 1), rk = a + kk;
  const parts: Part[] = [
    CN('Number of cells that receive “High”', high, [inc.length - high, high + 1, inc.length]),
    CT(`Cell that receives the label for the income in A${rk}`, addr(rk + off, oc), [addr(rk, oc === 2 ? 3 : 2), addr(rk + off + 1, oc), addr(rk, 1), addr(rk + off, oc + 1)].filter(x => x !== addr(rk + off, oc)).concat(addr(rk + off + 2, oc))),
    C(`Label written for the income in A${rk}`, ['High', 'Low'], inc[kk] > th ? 0 : 1),
  ];
  const html = p_('Column A of Sheet1 holds incomes:') + sheet([1], inc.map((x, i) => [a + i, [x]])) + p_('Test_Classify is run.') + code(lines);
  const sol = p_(`Test_Classify reads row r and passes income and r${off ? ' + ' + off : ''} to Classify, which writes to column ${oc} (${colL(oc)}). Above ${sh(th)}: ${inc.filter(x => x > th).map(sh).join(', ') || 'none'} → ${high} × “High”.`) +
    p_(`A${rk} = ${sh(inc[kk])} → ${addr(rk + off, oc)} gets “${inc[kk] > th ? 'High' : 'Low'}”.${inc[kk] === th ? ' An income equal to the threshold is not > ' + sh(th) + ', so it is Low.' : ''}`);
  return { ...Q('L4.call', 4, html, parts), solution: sol };
}

/** Tax_Batch: outer loop over clients, inner Sub Tax_One per client. */
export function L4_batch(): Question {
  const n = rint(5, 30), off = rint(1, 3), oc = rint(2, 4), k = rint(1, n);
  const income = rint(4, 150) * 500;
  const lines = ['Sub Tax_Batch()', '    Dim n_clients As Long', `    n_clients = ${n}`, '    Dim i As Long', '    Dim client_income As Double', '    For i = 1 To n_clients',
    `        client_income = Worksheets("Sheet1").Cells(i + ${off}, 1)`, `        Call Tax_One(client_income, i + ${off}, ${oc})`, '    Next', 'End Sub'];
  const parts = chooseParts([
    { part: CT(`Cell that receives the tax of client i = ${k}`, addr(k + off, oc), [addr(k, oc), addr(k + off, 1), addr(k + off + 1, oc), addr(oc, k + off)]), must: true },
    { part: CN('Last row read from column A', n + off, [n, n + off - 1, n + off + 1]), w: 0.6 },
    { part: CN('Number of times Tax_One runs', n, [n + 1, n - 1, n + off]), w: 0.4 },
    { part: N(`Tax written for client i = ${k}, whose income is €${sh(income)}`, taxOf(income), 'eur'), w: 0.7 },
  ], 3, 3);
  const html = p_('Tax_One(income, out_row, out_col) computes the tax with the Case 1 table and writes it to row out_row, column out_col of Sheet1. The table is:') + taxSheet(TAX, false) + code(lines);
  const sol = p_(`Client i is read from row i + ${off} and written to row i + ${off}, column ${oc} (${colL(oc)}). Client ${k}: ${addr(k + off, oc)}. The loop calls Tax_One ${n} times and reads rows ${1 + off} to ${n + off}.`) +
    p_(`Tax for €${sh(income)}: ${eur(taxOf(income))}.`);
  return { ...Q('L4.batch', 4, html, parts), solution: sol };
}

const DESIGN: [string, string][] = [
  ['The number of clients grows from 20 to 1 000.', 'Tax_Batch'],
  ['The tax table gets a tenth bracket.', 'Tax_One'],
  ['The client list moves to another worksheet.', 'Tax_Batch'],
  ['The taxes should be written to column D instead of column B.', 'Tax_Batch'],
  ['The tax table moves to another worksheet.', 'Tax_One'],
  ['The rate of the top bracket changes in the worksheet.', 'Neither'],
];

/** Calls with literal arguments, and which Sub owns which concern. */
export function L4_args(): Question {
  const calls: { inc: number; r: number; c: number }[] = [];
  for (let k = rint(2, 3); calls.length < k;) {
    const x = { inc: rint(4, 150) * 500, r: rint(2, 30), c: rint(2, 6) };
    if (!calls.some(y => y.r === x.r && y.c === x.c)) calls.push(x);
  }
  const lines = ['Sub test_call()', ...calls.map(x => `    Call Tax_One(${x.inc}, ${x.r}, ${x.c})`), 'End Sub'];
  const j = rint(0, calls.length - 1), d = pick(DESIGN);
  const x = calls[j];
  const parts: Part[] = [
    CT(`Cell written by call number ${j + 1}`, addr(x.r, x.c), [addr(x.c, x.r), colL(x.r > 26 ? 1 : x.r) + x.c, addr(x.r, x.c + 1), addr(x.r + 1, x.c)]),
    N(`Value written by call number ${j + 1}`, taxOf(x.inc), 'eur'),
    C(`Tax_Batch loops over clients and calls Tax_One. Which Sub changes? ${d[0]}`, ['Tax_Batch', 'Tax_One', 'Both', 'Neither'], ['Tax_Batch', 'Tax_One', 'Both', 'Neither'].indexOf(d[1])),
  ];
  const html = p_('Tax_One(income As Double, out_row As Long, out_col As Long) computes the tax with the Case 1 table and writes it to Cells(out_row, out_col) of Sheet1.') + taxSheet(TAX, false) + code(lines);
  const sol = p_(`Arguments are matched by position: income ${sh(x.inc)}, row ${x.r}, column ${x.c} → ${addr(x.r, x.c)} receives ${eur(taxOf(x.inc))}.`) +
    p_(`${d[0]} → ${d[1]}. The outer Sub owns the data layout (how many clients, where they are, where results go); the inner Sub owns the tax logic (the table and its brackets).${d[1] === 'Neither' ? ' A rate is read from the worksheet, so no code changes.' : ''}`);
  return { ...Q('L4.args', 4, html, parts), solution: sol };
}

// ---------------------------------------------------------------------------------------------------------------
// Class 5: simulation and Excel functions in VBA
// ---------------------------------------------------------------------------------------------------------------

const RANGES: [number, number][] = [[-0.02, 0.02], [-0.005, 0.005], [-0.03, 0.01], [0, 0.1], [-0.01, 0.03], [-0.05, 0.05], [0.02, 0.08]];

/** Rnd() * (b − a) + a for given draws. */
export function L5_uniform(): Question {
  const [a, b] = pick(RANGES);
  const u1 = rstep(0.02, 0.98, 0.01);
  let u2 = rstep(0.02, 0.98, 0.01);
  while (Math.abs(u2 - u1) < 0.1) u2 = rstep(0.02, 0.98, 0.01);
  const g = (u: number) => u * (b - a) + a;
  const lines = ['    a = ' + vb(a), '    b = ' + vb(b), '    For i = 1 To 40', '        ret = Rnd() * (b - a) + a', '        ws.Cells(i + 2, 1) = ret', '    Next'];
  const parts = chooseParts([
    { part: Nd(`ret when Rnd() returns ${vb(u1)}`, g(u1)), must: true },
    { part: Nd(`ret when Rnd() returns ${vb(u2)}`, g(u2)), w: 0.6 },
    { part: Nd('Average of many simulated returns', (a + b) / 2), w: 0.5 },
    { part: CT('Range of possible values of ret', `[${vb(a)}, ${vb(b)})`, [`[${vb(a)}, ${vb(b)}]`, `[0, ${vb(b - a)})`, `[${vb(a)}, ${vb(a + b)})`, '[0, 1)']), w: 0.5 },
    { part: CT('Row of the cell that receives the draw of i = 1', 'Row 3', ['Row 1', 'Row 2', 'Row 4']), w: 0.3 },
  ], 2, 3);
  const html = p_('Uniform_Returns simulates daily returns (rows 1 and 2 hold the title and headers):') + code(lines) + p_('Enter returns as decimals, e.g. 0.0123.');
  const sol = p_(`ret = u × (${vb(b)} − (${vb(a)})) + (${vb(a)}) = u × ${vb(b - a)} ${a < 0 ? '− ' + vb(-a) : '+ ' + vb(a)}. For u = ${vb(u1)}: ${vb(+g(u1).toFixed(6))}; for u = ${vb(u2)}: ${vb(+g(u2).toFixed(6))}.`) +
    p_(`Rnd() lies in [0, 1), so ret lies in [${vb(a)}, ${vb(b)}): it can equal a but never b. The midpoint ${vb((a + b) / 2)} is the average. i + 2 skips the two header rows, so i = 1 lands in row 3.`);
  return { ...Q('L5.uniform', 5, html, parts), solution: sol };
}

const PROBS = [0.975, 0.025, 0.95, 0.05, 0.9, 0.1, 0.99, 0.01, 0.8, 0.2, 0.7, 0.3, 0.6, 0.4, 0.85, 0.15];

/** WorksheetFunction.NormInv(p, mean, std) = mean + std × z(p). */
export function L5_norm(): Question {
  const mu = pick([0, 0, 0.0005, 0.001, 0.05]), s = mu === 0.05 ? pick([0.1, 0.2]) : pick([0.01, 0.015, 0.02]);
  const [p1, p2] = shuffle(PROBS).slice(0, 2);
  const z1 = +normSInv(p1).toFixed(4), z2 = +normSInv(p2).toFixed(4);
  const hi = Math.max(p1, 1 - p1);
  const parts = chooseParts([
    { part: Nd(`NormInv(${vb(p1)}, ${vb(mu)}, ${vb(s)})`, mu + s * z1), must: true },
    { part: Nd(`NormInv(${vb(p2)}, ${vb(mu)}, ${vb(s)})`, mu + s * z2), w: 0.6 },
    { part: Nd(`NormInv(0.5, ${vb(mu)}, ${vb(s)})`, mu), w: 0.3 },
    { part: N(`Share of draws between ${vb(+(mu - s * Math.abs(normSInv(hi))).toFixed(5))} and ${vb(+(mu + s * Math.abs(normSInv(hi))).toFixed(5))}`, (2 * hi - 1) * 100, 'pct', { abs: 0.01 }), w: 0.5 },
  ], 2, 3);
  const html = p_(`Normal_Returns draws daily returns with ${ic(`Application.WorksheetFunction.NormInv(Rnd(), ${vb(mu)}, ${vb(s)})`)}. Standard normal quantiles: NORM.S.INV(${vb(p1)}) = ${vb(z1)}, NORM.S.INV(${vb(p2)}) = ${vb(z2)}${hi !== p1 && hi !== p2 ? `, NORM.S.INV(${vb(hi)}) = ${vb(+normSInv(hi).toFixed(4))}` : ''}.`) +
    p_('Enter returns as decimals.');
  const sol = p_(`NormInv(p, μ, σ) = μ + σ × z(p): ${vb(mu)} + ${vb(s)} × ${vb(z1)} = ${vb(+(mu + s * z1).toFixed(6))}; ${vb(mu)} + ${vb(s)} × ${vb(z2)} = ${vb(+(mu + s * z2).toFixed(6))}. p = 0.5 gives the mean.`) +
    p_(`Between the ${vb(+(1 - hi).toFixed(3))} and ${vb(hi)} quantiles lie ${f2((2 * hi - 1) * 100)}% of the draws.`);
  return { ...Q('L5.norm', 5, html, parts), solution: sol };
}

/** Writing a 2D array to a Range in one step: sizes and positions. */
export function L5_array(): Question {
  const T = pick([20, 30, 40, 50, 60, 100]), n = rint(1, 6), r0 = rint(2, 4), c0 = pick([1, 1, 2]);
  const i = rint(1, T), j = rint(1, n);
  const lines = ['Sub Normal_Returns()', '    Dim ws As Worksheet', '    Dim ret_range As Range', `    Dim returns(1 To ${T}, 1 To ${n}) As Double`, '    Dim i As Long, j As Long', '    Set ws = Worksheets("Sheet1")',
    `    Set ret_range = ws.Range(ws.Cells(${r0}, ${c0}), ws.Cells(?, ?))`, `    For i = 1 To ${T}`, `        For j = 1 To ${n}`, '            returns(i, j) = Application.WorksheetFunction.NormInv(Rnd(), 0, 0.01)', '        Next j', '    Next i', '    ret_range.Value = returns', 'End Sub'];
  const br = addr(r0 + T - 1, c0 + n - 1);
  const parts = chooseParts([
    { part: CT('Bottom-right cell the Range must end at (the ? marks)', br, [addr(r0 + T, c0 + n - 1), addr(T, n), addr(r0 + T - 1, c0 + n), addr(n, r0 + T - 1), addr(T, c0 + n - 1)]), must: true },
    { part: CN('Number of random draws written', T * n, [T + n, T * n - n, (T + 1) * n, T]), w: 0.6 },
    { part: CT(`Cell that receives returns(${i}, ${j})`, addr(r0 + i - 1, c0 + j - 1), [addr(i, j), addr(r0 + i, c0 + j - 1), addr(r0 + i - 1, c0 + j), addr(j, i)]), w: 0.7 },
  ], 2, 3);
  const html = p_('The array must match the Range exactly. Read the Sub:') + code(lines);
  const sol = p_(`The array has ${T} rows and ${n} column${n > 1 ? 's' : ''}; starting at ${addr(r0, c0)} the block ends ${T - 1} rows lower and ${n - 1} column${n === 2 ? '' : 's'} to the right: ${br}. That is ${T} × ${n} = ${T * n} draws, written in one step.`) +
    p_(`returns(i, j) lands in row ${r0} + i − 1, column ${c0} + j − 1: returns(${i}, ${j}) → ${addr(r0 + i - 1, c0 + j - 1)}.`);
  return { ...Q('L5.array', 5, html, parts), solution: sol };
}

const E5 = ['Run-time error 91 (object variable not set)', 'Run-time error 1004', 'Sub or Function not defined', 'Type mismatch', 'No error: the code runs'];

/** Objects, Set and the two ways of calling Excel functions. */
export function L5_errors(): Question {
  const mu = pick([0, 0.05]), s = pick([0.01, 0.1]);
  const cases: (() => Question)[] = [
    () => mcText('L5.errors', '5', p_('What happens when this Sub runs?') + code(['Sub Test_Random()', '    Dim ws As Worksheet', '    ws = Worksheets("Sheet1")', '    ws.Cells(3, 1) = Rnd()', 'End Sub']), E5[0], E5.slice(1), p_('ws is an object variable; it must be assigned with Set. Without Set VBA stops with run-time error 91.'), false),
    () => mcText('L5.errors', '5', p_('What happens when this Sub runs?') + code(['Sub Stats()', '    Dim ws As Worksheet', '    Dim col As Range', '    Set ws = Worksheets("Sheet1")', '    col = ws.Range(ws.Cells(1, 1), ws.Cells(20, 1))', '    ws.Cells(22, 1) = Application.WorksheetFunction.Average(col)', 'End Sub']), E5[0], E5.slice(1), p_('A Range is an object too: Set col = ws.Range(…). Forgetting Set gives run-time error 91.'), false),
    () => mcText('L5.errors', '5', p_('What happens when this Sub runs?') + code(['Sub Draw()', '    Dim p As Double', '    Dim ret As Double', '    p = ' + pick(['0', '1']), `    ret = Application.WorksheetFunction.NormInv(p, ${vb(mu)}, ${vb(s)})`, '    Worksheets("Sheet1").Cells(3, 1) = ret', 'End Sub']), E5[1], E5.filter(e => e !== E5[1]), p_('NormInv needs a probability strictly between 0 and 1; at 0 or 1 the inverse CDF is infinite and WorksheetFunction raises run-time error 1004.'), false),
    () => mcText('L5.errors', '5', p_('What happens when this Sub runs?') + code(['Sub Draw()', '    Dim ws As Worksheet', '    Dim ret As Double', '    Set ws = Worksheets("Sheet1")', `    ret = Application.WorksheetFunction.NormInv(Rnd(), ${vb(mu)}, ${vb(s)})`, '    ws.Cells(3, 1) = ret', 'End Sub']), E5[4], E5.slice(0, 4), p_('Set is used for the worksheet and Rnd() returns a probability in [0, 1) (exactly 0 is possible but extremely rare): the code runs and writes one Normal draw to A3.'), false),
    () => {
      const m1 = chance(0.5);
      const lines = m1 ? ['Sub NormInv_Method1()', '    Dim ws As Worksheet', '    Set ws = Worksheets("Sheet1")', `    ws.Cells(3, 1).Formula = "=NORM.INV(RAND(), ${vb(mu)}, ${vb(s)})"`, 'End Sub']
        : ['Sub NormInv_Method2()', '    Dim ws As Worksheet', '    Dim ret As Double', '    Set ws = Worksheets("Sheet1")', `    ret = Application.WorksheetFunction.NormInv(Rnd(), ${vb(mu)}, ${vb(s)})`, '    ws.Cells(3, 1) = ret', 'End Sub'];
      const A = `The formula =NORM.INV(RAND(), ${vb(mu)}, ${vb(s)}), which recalculates`, B = 'A static number that does not change when Excel recalculates';
      return mcText('L5.errors', '5', p_('After the Sub runs, you click A3. What does the cell contain?') + code(lines), m1 ? A : B,
        [m1 ? B : A, 'Nothing: the function result stays inside VBA', `The text "NORM.INV(RAND(), ${vb(mu)}, ${vb(s)})"`, 'Run-time error 91'],
        p_(m1 ? 'Method 1 injects a formula string through .Formula: the cell keeps the formula, and RAND() makes it change at every recalculation.' : 'Method 2 runs the function inside VBA through WorksheetFunction and writes the result: a plain number, no formula.'), false);
    },
  ];
  return pick(cases)();
}

// ---------------------------------------------------------------------------------------------------------------
// Class 6: Range objects, summary statistics and covariance
// ---------------------------------------------------------------------------------------------------------------

/** Average, StDev_S, Covariance_S, correlation and Sharpe of a small sample. */
export function L6_stats(): Question {
  const n = rint(5, 8);
  let x: number[] = [], y: number[] = [];
  do {
    x = Array.from({ length: n }, () => rstep(-0.15, 0.25, 0.01));
    const beta = rstep(-0.8, 0.8, 0.1);
    y = x.map(v => +Math.max(-0.3, Math.min(0.35, beta * v + rstep(-0.12, 0.18, 0.01))).toFixed(2));
  } while (stdevS(x) < 0.03 || stdevS(y) < 0.03);
  const mx = mean(x), sx = stdevS(x), sy = stdevS(y), cv = covS(x, y), rho = cv / (sx * sy);
  const html = p_(`Sheet1 holds ${n} simulated returns for two assets:`) + sheet([1, 2], x.map((v, i) => [i + 1, [v, y[i]]])) +
    code(['    Set col1 = ws.Range(ws.Cells(1, 1), ws.Cells(' + n + ', 1))', '    Set col2 = ws.Range(ws.Cells(1, 2), ws.Cells(' + n + ', 2))']) + p_('What do these WorksheetFunction calls return?');
  const parts = chooseParts([
    { part: Nd('Average(col1)', mx, 1e-5), w: 0.6 },
    { part: Nd('StDev_S(col1)', sx, 1e-5), w: 0.7 },
    { part: Nd('Covariance_S(col1, col2)', cv, 5e-5), w: 0.8 },
    { part: Nd('Covariance_S(col1, col1)', sx * sx, 5e-5), w: 0.4 },
    { part: N('Correlation of the two assets', rho, 'n', { abs: 0.005 }), w: 0.5 },
    { part: Nd('Sharpe ratio of asset 2, Average(col2) / StDev_S(col2) (r_f = 0)', mean(y) / sy, 0.002), w: 0.4 },
  ], 3, 4);
  const sol = p_(`Mean of asset 1 = ${f6(mx)}; StDev_S divides by n − 1 = ${n - 1}: s<sub>1</sub> = ${f6(sx)}, s<sub>2</sub> = ${f6(sy)}.`) +
    p_(`Covariance_S = Σ(x − x̄)(y − ȳ) / (n − 1) = ${f6(cv)}. With the same column twice it gives the variance, ${f6(sx * sx)} = s<sub>1</sub>². Correlation = ${f6(cv)} / (${f4(sx)} × ${f4(sy)}) = ${f4(rho)}.`) +
    p_(`Sharpe of asset 2 = ${f6(mean(y))} / ${f6(sy)} = ${f4(mean(y) / sy)}.`);
  return { ...Q('L6.stats', 6, html, parts), solution: sol };
}

/** The covariance matrix: symmetry, diagonal, correlation and where Covar_Matrix writes each entry. */
export function L6_matrix(): Question {
  const k = rint(3, 5);
  const sd = Array.from({ length: k }, () => rstep(0.05, 0.3, 0.01));
  const M: number[][] = sd.map((si, i) => sd.map((sj, j) => i === j ? +(si * si).toFixed(4) : 0));
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { const c = +(rstep(-0.5, 0.8, 0.05) * sd[i] * sd[j]).toFixed(4); M[i][j] = c; M[j][i] = c; }
  let a = rint(0, k - 1), b = rint(0, k - 1);
  while (b === a) b = rint(0, k - 1);
  const [lo, hi] = a < b ? [a, b] : [b, a];
  const r0 = pick([30, 20, 40]), c0 = pick([0, 1]);
  const html = p_(`Covar_Matrix wrote the sample covariance matrix of ${k} assets; the entry below the diagonal in row ${hi + 1}, column ${lo + 1} has been deleted:`) +
    table(['', ...sd.map((_, j) => 'Asset ' + (j + 1))], M.map((row, i) => ['Asset ' + (i + 1), ...row.map((v, j) => i === hi && j === lo ? '?' : f4(v))])) +
    code([`    For i = 1 To ${k}`, `        Set col_i = ws.Range(ws.Cells(1, i), ws.Cells(20, i))`, `        For j = 1 To ${k}`, `            Set col_j = ws.Range(ws.Cells(1, j), ws.Cells(20, j))`, `            ws.Cells(${r0} + i, ${c0 ? c0 + ' + ' : ''}j) = Application.WorksheetFunction.Covariance_S(col_i, col_j)`, '        Next j', '    Next i']);
  const p = rint(0, k - 1), q = rint(0, k - 1);
  const rho = M[lo][hi] / Math.sqrt(M[lo][lo] * M[hi][hi]);
  const parts = chooseParts([
    { part: Nd('The missing covariance', M[hi][lo], 5e-5), must: true },
    { part: Nd(`Standard deviation of asset ${a + 1}`, Math.sqrt(M[a][a]), 1e-4), w: 0.6 },
    { part: N(`Correlation of assets ${lo + 1} and ${hi + 1}`, rho, 'n', { abs: 0.005 }), w: 0.7 },
    { part: CT(`Cell that holds Cov(${p + 1}, ${q + 1})`, addr(r0 + p + 1, c0 + q + 1), [addr(r0 + q + 1, c0 + p + 1 + (p === q ? 1 : 0)), addr(r0 + p, c0 + q + 1), addr(p + 1, c0 + q + 1), addr(r0 + p + 1, c0 + q + 2)]), w: 0.6 },
  ], 3, 3);
  const sol = p_(`The matrix is symmetric, Cov(${hi + 1}, ${lo + 1}) = Cov(${lo + 1}, ${hi + 1}) = ${f4(M[lo][hi])}. The diagonal holds variances, so σ<sub>${a + 1}</sub> = √${f4(M[a][a])} = ${f4(Math.sqrt(M[a][a]))}.`) +
    p_(`ρ = ${f4(M[lo][hi])} / (√${f4(M[lo][lo])} × √${f4(M[hi][hi])}) = ${f4(rho)}. Entry (i, j) goes to row ${r0} + i, column ${c0 ? c0 + ' + ' : ''}j: Cov(${p + 1}, ${q + 1}) → ${addr(r0 + p + 1, c0 + q + 1)}.`);
  return { ...Q('L6.matrix', 6, html, parts), solution: sol };
}

/** ws.Range(ws.Cells(r1, c1), ws.Cells(r2, c2)) and the summary table layout. */
export function L6_range(): Question {
  const r1 = rint(1, 4), c1 = rint(1, 3), r2 = r1 + pick([19, 39, 9, 29]), c2 = c1 + rint(0, 5);
  const j = rint(1, c2 - c1 + 1);
  const lines = ['Sub Summary_Table()', '    Dim ws As Worksheet', '    Set ws = Worksheets("Sheet1")', '    Dim col As Range', '    Dim j As Long', `    Set col = ws.Range(ws.Cells(${r1}, ${c1}), ws.Cells(${r2}, ${c2}))`, `    MsgBox (col.Address & " has " & col.Count & " cells")`, `    For j = ${c1} To ${c2}`, `        Set col = ws.Range(ws.Cells(${r1}, j), ws.Cells(${r2}, j))`, `        ws.Cells(${r2 + 2}, j) = Application.WorksheetFunction.Average(col)`, `        ws.Cells(${r2 + 3}, j) = Application.WorksheetFunction.StDev_S(col)`, '    Next j', 'End Sub'];
  const block = `${addr(r1, c1)}:${addr(r2, c2)}`, cnt = (r2 - r1 + 1) * (c2 - c1 + 1);
  const jc = c1 + j - 1;
  const parts: Part[] = [
    CT('Block of the first Range (col.Address without $ signs)', block, [`${addr(c1, r1)}:${addr(c2, r2)}`, `${addr(r1, c1)}:${addr(r2 + 1, c2)}`, `${addr(r1, c1)}:${addr(c2, r2)}`, `${addr(r1, c1)}:${addr(r2, c2 + 1)}`]),
    CN('Number of cells in it', cnt, [r2 - r1 + 1, (r2 - r1) * (c2 - c1 + 1), (r2 - r1 + 1) * (c2 - c1), r2 * c2]),
    CT(`Cell that receives the standard deviation of column ${colL(jc)}`, addr(r2 + 3, jc), [addr(r2 + 2, jc), addr(r2 + 3, j), addr(jc, r2 + 3), addr(r2 + 4, jc)]),
  ];
  const sol = p_(`Range(top-left, bottom-right): Cells(${r1}, ${c1}) = ${addr(r1, c1)} and Cells(${r2}, ${c2}) = ${addr(r2, c2)}, so ${block}: ${r2 - r1 + 1} rows × ${c2 - c1 + 1} column${c2 > c1 ? 's' : ''} = ${cnt} cells.`) +
    p_(`In the loop the Set line builds one column per j; the mean goes to row ${r2 + 2}, StDev_S to row ${r2 + 3}: column ${colL(jc)} → ${addr(r2 + 3, jc)}.`);
  return { ...Q('L6.range', 6, p_('Read the Sub and answer the questions.') + code(lines), parts), solution: sol };
}

// ---------------------------------------------------------------------------------------------------------------
// Class 7: user-defined functions
// ---------------------------------------------------------------------------------------------------------------

/** Trace a user-defined function, including ByRef arguments and a result that is never assigned. */
export function L7_trace(): Question {
  const kind = pick(['grow', 'pv', 'signal'] as const);
  if (kind === 'grow') {
    const v0 = pick([100, 1000, 250, 50]), r = pick([0.02, 0.03, 0.05, 0.08, 0.1]), n = rint(2, 5);
    const fv = v0 * (1 + r) ** n;
    const lines = ['Function grow(v As Double, r As Double, n As Long) As Double', '    Dim i As Long', '    For i = 1 To n', '        v = v * (1 + r)', '    Next i', '    grow = v', 'End Function', '',
      'Sub Test_Grow()', '    Dim x As Double', '    Dim y As Double', `    x = ${v0}`, `    y = grow(x, ${vb(r)}, ${n})`, '    MsgBox (x & " / " & y)', 'End Sub'];
    const parts: Part[] = [N(`Value of =grow(${v0}, ${vb(r)}, ${n}) in a cell`, fv, 'n', { abs: 0.005 }), N('Value of x shown by the MsgBox', fv, 'n', { abs: 0.005 }), CN(`Value of =grow(${v0}, ${vb(r)}, 0)`, v0, [0, v0 * (1 + r), 1], f4)];
    const sol = p_(`grow compounds v for n periods: ${v0} × ${vb(1 + r)}<sup>${n}</sup> = ${f4(fv)}. With n = 0 the loop does not run and v = ${v0} is returned.`) +
      p_(`Arguments are passed ByRef by default. x is a Double variable passed to v As Double, so the loop changes x itself: the MsgBox shows ${f4(fv)} for x as well, not ${v0}.`);
    return { ...Q('L7.trace', 7, p_('Read the function and the Sub that calls it.') + code(lines), parts), solution: sol };
  }
  if (kind === 'pv') {
    const cf = pick([100, 50, 1000, 200]), r = pick([0.04, 0.05, 0.06, 0.08, 0.1]), n = rint(2, 6);
    let pv = 0; for (let t = 1; t <= n; t++) pv += cf / (1 + r) ** t;
    const lines = ['Function pv_sum(cf As Double, r As Double, n As Long) As Double', '    Dim t As Long', '    Dim total As Double', '    For t = 1 To n', '        total = total + cf / (1 + r) ^ t', '    Next t', '    pv_sum = total', 'End Function'];
    let pv1 = 0; for (let t = 1; t <= n - 1; t++) pv1 += cf / (1 + r) ** t;
    const parts: Part[] = [N(`Value of =pv_sum(${cf}, ${vb(r)}, ${n})`, pv, 'n', { abs: 0.005 }), N(`Value of =pv_sum(${cf}, ${vb(r)}, ${n - 1})`, pv1, 'n', { abs: 0.005 }), CN(`Value of =pv_sum(${cf}, ${vb(r)}, 0)`, 0, [cf, cf / (1 + r), 1], f4)];
    const sol = p_(`pv_sum adds the discounted cash flows cf / (1 + r)<sup>t</sup> for t = 1 … n: ${f4(pv)} for n = ${n}, ${f4(pv1)} for n = ${n - 1}. total starts at 0 (default of a Double); with n = 0 the loop does not run and 0 is returned.`);
    return { ...Q('L7.trace', 7, p_('A user-defined function is used in worksheet cells.') + code(lines), parts), solution: sol };
  }
  const th = pick([0.01, 0.02, 0.03]);
  const lines = ['Function signal(ret As Double) As String', `    If ret > ${vb(th)} Then`, '        signal = "Buy"', `    ElseIf ret < ${vb(-th)} Then`, '        signal = "Sell"', '    End If', 'End Function'];
  const opts = ['Buy', 'Sell', 'Hold', 'An empty text ""'];
  const rets = shuffle([th + 0.01, -th - 0.01, 0, th, th / 2, -th]).slice(0, 3);
  const res = (r: number) => r > th + 1e-12 ? 0 : r < -th - 1e-12 ? 1 : 3;
  const parts = rets.map(r => C(`=signal(${vb(r)}) returns`, opts, res(r)));
  const sol = p_(`Only two branches assign the function name. When neither condition holds (−${vb(th)} ≤ ret ≤ ${vb(th)}) the name is never assigned and the function returns the default of its type: an empty String. Add Else: signal = "Hold" to fix it.`) +
    p_(rets.map(r => `${vb(r)} → ${['Buy', 'Sell', '', '""'][res(r)]}`).join('; ') + '.');
  return { ...Q('L7.trace', 7, p_('Read the function.') + code(lines), parts), solution: sol };
}

/** UniformArray(T, N, a, b): size, an element for a given draw, where an array result lands. */
export function L7_uniform(): Question {
  const T = rint(5, 30), n = rint(2, 6), [a, b] = pick(RANGES), u = rstep(0.02, 0.98, 0.01);
  const r0 = rint(1, 5), c0 = rint(1, 4);
  const lines = ['Function UniformArray(T As Long, N As Long, a As Single, b As Single) As Variant', '    Dim my_array() As Double', '    ReDim my_array(1 To T, 1 To N)', '    Dim i As Integer, j As Integer', '    For i = 1 To T', '        For j = 1 To N', '            my_array(i, j) = Rnd() * (b - a) + a', '        Next j', '    Next i', '    UniformArray = my_array', 'End Function'];
  const parts = chooseParts([
    { part: CN(`Number of draws returned by UniformArray(${T}, ${n}, ${vb(a)}, ${vb(b)})`, T * n, [T + n, T, n, (T - 1) * n]), must: true },
    { part: Nd(`my_array(1, 1) if the first Rnd() returns ${vb(u)}`, u * (b - a) + a, 1e-6), w: 0.7 },
    { part: CT(`The result is entered as an array formula starting in ${addr(r0, c0)}. Bottom-right cell of the block`, addr(r0 + T - 1, c0 + n - 1), [addr(r0 + n - 1, c0 + T - 1), addr(r0 + T, c0 + n), addr(T, n), addr(r0 + T - 1, c0 + n)]), w: 0.6 },
    { part: CT('Why is my_array declared with Dim my_array() and then ReDim?', 'T and N are only known at run time; fixed bounds must be constants', ['ReDim makes the array two-dimensional', 'Dim cannot declare Double arrays', 'ReDim fills the array with zeros']), w: 0.5 },
  ], 3, 3);
  const sol = p_(`ReDim sizes the array to ${T} × ${n}: ${T * n} draws, each Rnd() × (b − a) + a. With u = ${vb(u)}: ${vb(u)} × ${vb(b - a)} + (${vb(a)}) = ${vb(+(u * (b - a) + a).toFixed(6))}.`) +
    p_(`A ${T} × ${n} result fills ${T} rows and ${n} columns from ${addr(r0, c0)} to ${addr(r0 + T - 1, c0 + n - 1)}. Dim my_array(1 To T, 1 To N) would not compile, because the bounds of a fixed array must be constants.`);
  return { ...Q('L7.uniform', 7, p_('UniformArray from the class workbook:') + code(lines), parts), solution: sol };
}

const SYNTAX: { q: string; right: string; wrong: string[]; sol: string }[] = [
  { q: 'Which header declares a function that takes a Range of returns and a Double rate and returns a Double?', right: 'Function sharpe_ratio(returns As Range, rf As Double) As Double', wrong: ['Sub sharpe_ratio(returns As Range, rf As Double) As Double', 'Function sharpe_ratio(returns As Double, rf As Range) As Double', 'Function sharpe_ratio As Double (returns As Range, rf As Double)', 'Function sharpe_ratio(returns, rf) As Range'], sol: 'Arguments with their types in parentheses, the result type after them. A Sub has no result type.' },
  { q: 'Inside Function avg_ret(r As Range) As Double, which line returns the mean of r?', right: 'avg_ret = Application.WorksheetFunction.Average(r)', wrong: ['Return Application.WorksheetFunction.Average(r)', 'avg_ret(r) = Application.WorksheetFunction.Average(r)', 'r = Application.WorksheetFunction.Average(avg_ret)', 'MsgBox (Application.WorksheetFunction.Average(r))'], sol: 'A VBA function returns its result by assigning it to the function’s own name.' },
  { q: 'Which lines create an array sized by the function inputs T and N?', right: 'Dim my_array() As Double, then ReDim my_array(1 To T, 1 To N)', wrong: ['Dim my_array(1 To T, 1 To N) As Double', 'ReDim my_array(T + N), then Dim my_array() As Double', 'Set my_array = Range(T, N)', 'Dim my_array(T, N) As Range'], sol: 'Fixed bounds must be constants. Declare a dynamic array without bounds and size it with ReDim at run time.' },
  { q: 'Function ThisWB() As Workbook should return the workbook that holds the code. Which line does it?', right: 'Set ThisWB = ThisWorkbook', wrong: ['ThisWB = ThisWorkbook', 'Return ThisWorkbook', 'Set ThisWorkbook = ThisWB', 'ThisWB = ThisWorkbook.Name'], sol: 'A Workbook is an object, so the function name is assigned with Set.' },
  { q: 'How do you use regards_function(name As String) As String in cell C1 with the name typed in B1?', right: '=regards_function(B1)', wrong: ['=Call regards_function(B1)', '=regards_function("B1")', 'Run regards_function(B1)', '=regards_function(B1) As String'], sol: 'A user-defined function is used in a cell like a built-in one: =name(arguments). "B1" in quotes would pass the text B1.' },
  { q: 'What is the right return type for a function that returns a T × N array of simulated returns?', right: 'As Variant', wrong: ['As Double', 'As Long', 'As Range', 'As Worksheet'], sol: 'An array result is returned in a Variant.' },
  { q: 'A function’s argument is declared name As String. A Sub passes an undeclared variable x (no Dim). What happens?', right: 'Compile error: ByRef argument type mismatch', wrong: ['VBA converts x to a String and runs', 'Run-time error 91', 'Subscript out of range', 'The function returns an empty text'], sol: 'Without Dim, x is a Variant. Passed by reference to a String parameter, the types do not match: “ByRef argument type mismatch”. Declare x As String or pass a literal.' },
];

/** Syntax of user-defined functions. */
export function L7_syntax(): Question {
  const s = pick(SYNTAX);
  return mcText('L7.syntax', '7', p_(s.q), s.right, s.wrong, p_(s.sol), false);
}

// ---------------------------------------------------------------------------------------------------------------
// Class 8: Sharpe and Sortino ratios as user-defined functions
// ---------------------------------------------------------------------------------------------------------------

const SHARPE_CODE = ['Function sharpe_ratio(returns As Range, rf As Double) As Double', '    avg_return = Application.WorksheetFunction.Average(returns)', '    std_return = Application.WorksheetFunction.StDev_S(returns)', '    tdays = 252', '    Dim rf_d As Double', '    rf_d = rf / tdays', '    sharpe_ratio = Sqr(tdays) * ((avg_return - rf_d) / std_return)', 'End Function'];

/** Daily sample of returns rounded to 0.1%. */
function dailySample(n: number, negMin: number): number[] {
  let r: number[] = [];
  // Realistic daily figures: a small positive mean (0.03% to 0.3%) and a volatility of 0.6% to 2%.
  do r = Array.from({ length: n }, () => rstep(-0.02, 0.022, 0.001));
  while (r.filter(x => x < 0).length < negMin || r.filter(x => x > 0).length < 2 || mean(r) < 0.0003 || mean(r) > 0.003 || stdevS(r) < 0.006 || stdevS(r) > 0.02 || stdevS(r.filter(x => x < 0)) < 0.002);
  return r;
}

/** sharpe_ratio from the class: daily statistics, rf / 252 and the √252 annualisation. */
export function L8_sharpe(): Question {
  const rf = rstep(0.01, 0.04, 0.005);
  if (chance(0.5)) {
    const m = rstep(0.0002, 0.0012, 0.0001), s = rstep(0.006, 0.02, 0.001), m2 = rstep(0.0002, 0.0012, 0.0001), s2 = rstep(0.006, 0.02, 0.001);
    const sr = (mm: number, ss: number) => Math.sqrt(252) * (mm - rf / 252) / ss;
    const html = p_(`Two funds have these daily statistics over two years; the annual risk-free rate is ${P(rf, 1)} (rf = ${vb(rf)}). The function from class is:`) + code(SHARPE_CODE) +
      table(['Fund', 'Average daily return', 'StDev_S of daily returns'], [['Fund 1', vb(m), vb(s)], ['Fund 2', vb(m2), vb(s2)]]);
    const parts: Part[] = [Nd('sharpe_ratio of fund 1', sr(m, s), 1e-3), Nd('sharpe_ratio of fund 2', sr(m2, s2), 1e-3), C('Fund with the higher Sharpe ratio', ['Fund 1', 'Fund 2'], sr(m, s) >= sr(m2, s2) ? 0 : 1)];
    const sol = p_(`rf_d = ${vb(rf)} / 252 = ${f6(rf / 252)}. Fund 1: √252 × (${vb(m)} − ${f6(rf / 252)}) / ${vb(s)} = ${f4(sr(m, s))}. Fund 2: √252 × (${vb(m2)} − ${f6(rf / 252)}) / ${vb(s2)} = ${f4(sr(m2, s2))}.`);
    return { ...Q('L8.sharpe', 8, html, parts), solution: sol };
  }
  const r = dailySample(rint(6, 8), 2);
  const m = mean(r), s = stdevS(r), sr = Math.sqrt(252) * (m - rf / 252) / s;
  const html = p_(`A fund’s daily returns are in A2:A${r.length + 1}; H2 holds the annual risk-free rate ${vb(rf)}. Cell C2 contains =sharpe_ratio(A2:A${r.length + 1}, H2), using:`) + code(SHARPE_CODE) + sheet([1], r.map((x, i) => [i + 2, [x]]));
  const parts = chooseParts([
    { part: Nd('avg_return', m, 1e-6), w: 0.6 },
    { part: Nd('std_return', s, 1e-6), w: 0.6 },
    { part: Nd('Value shown in C2', sr, 1e-3), must: true },
  ], 2, 3);
  const sol = p_(`avg_return = ${f6(m)}, std_return (n − 1 = ${r.length - 1}) = ${f6(s)}, rf_d = ${vb(rf)} / 252 = ${f6(rf / 252)}.`) +
    p_(`Sharpe = √252 × (${f6(m)} − ${f6(rf / 252)}) / ${f6(s)} = ${f4(sr)}.`);
  return { ...Q('L8.sharpe', 8, html, parts), solution: sol };
}

/** Sortino ratio: excess return over the standard deviation of the negative returns. */
export function L8_sortino(): Question {
  const rf = rstep(0.01, 0.04, 0.005), r = dailySample(rint(8, 10), 3);
  const m = mean(r), neg = r.filter(x => x < 0), dd = stdevS(neg), s = stdevS(r);
  const so = Math.sqrt(252) * (m - rf / 252) / dd, sr = Math.sqrt(252) * (m - rf / 252) / s;
  const html = p_(`sortino_ratio(returns, rf) follows the plan from class: average return, tdays = 252, rf_d = rf / tdays, keep only the negative returns, take StDev_S of those (the downside volatility), then Sqr(tdays) × (average − rf_d) / downside volatility. A fund’s daily returns (rf = ${vb(rf)}):`) +
    sheet([1], r.map((x, i) => [i + 2, [x]]));
  const parts = chooseParts([
    { part: Nd('Average daily return', m, 1e-6), w: 0.4 },
    { part: Nd('Downside volatility (StDev_S of the negative returns)', dd, 1e-6), must: true },
    { part: Nd('Sortino ratio', so, 1e-3), must: true },
    { part: Nd('Sharpe ratio of the same fund (StDev_S of all returns)', sr, 1e-3), w: 0.4 },
  ], 2, 3);
  const sol = p_(`Negative returns: ${neg.map(vb).join(', ')} → StDev_S (n − 1 = ${neg.length - 1}) = ${f6(dd)}. Average of all ${r.length} returns = ${f6(m)}, rf_d = ${f6(rf / 252)}.`) +
    p_(`Sortino = √252 × (${f6(m)} − ${f6(rf / 252)}) / ${f6(dd)} = ${f4(so)}; Sharpe with the total StDev_S ${f6(s)} = ${f4(sr)}.`);
  return { ...Q('L8.sortino', 8, html, parts), solution: sol };
}

/** Sharpe ratios with skewness and kurtosis: what the standard deviation misses. */
export function L8_compare(): Question {
  const rf = pick([0.01, 0.02, 0.03]);
  const mA = rstep(0.08, 0.16, 0.0001), sA = rstep(0.14, 0.24, 0.0001);
  const mB = +(mA + rstep(-0.01, 0.005, 0.0001)).toFixed(4), sB = +(sA * rstep(0.7, 0.88, 0.01)).toFixed(4);
  const skA = rstep(-0.3, 0.4, 0.01), kA = rstep(-0.3, 0.5, 0.01), skB = rstep(-5, -2, 0.01), kB = rstep(15, 40, 0.01);
  const swap = chance(0.5);
  const L = swap ? ['B', 'A'] : ['A', 'B'];
  const rows = [[L[0], mA, sA, skA, kA], [L[1], mB, sB, skB, kB]] as [string, number, number, number, number][];
  rows.sort((x, y) => x[0] < y[0] ? -1 : 1);
  const shp = (m: number, s: number) => (m - rf) / s;
  const html = p_(`Annualised statistics of two portfolios (risk-free rate ${P(rf, 0)}):`) +
    table(['Portfolio', 'Mean', 'Std', 'Skew', 'Kurtosis'], rows.map(r => [r[0], P(r[1]), P(r[2]), f2(r[3]), f2(r[4])]));
  const [ra, rb] = rows;
  const sa = shp(ra[1], ra[2]), sb = shp(rb[1], rb[2]);
  const tail = ra[3] < rb[3] ? 0 : 1;
  const parts: Part[] = [Nd('Sharpe ratio of A', sa, 1e-3), Nd('Sharpe ratio of B', sb, 1e-3), C('Portfolio with the fatter left tail', ['A', 'B'], tail)];
  const sol = p_(`Sharpe = (mean − r<sub>f</sub>) / std: A (${P(ra[1])} − ${P(rf, 0)}) / ${P(ra[2])} = ${f4(sa)}; B (${P(rb[1])} − ${P(rf, 0)}) / ${P(rb[2])} = ${f4(sb)}.`) +
    p_(`Portfolio ${rows[tail][0]} has strongly negative skewness (${f2(rows[tail][3])}) and very high kurtosis (${f2(rows[tail][4])}): rare large losses. Its lower standard deviation flatters the Sharpe ratio, which ignores the shape of the distribution; the Sortino ratio looks at downside volatility instead.`);
  return { ...Q('L8.compare', 8, html, parts), solution: sol };
}

