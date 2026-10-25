import type { Answers, Graded, NumPart, Question, Unit } from './types';

export const DEFAULT_TOL = 0.02;

/** Accepts German and English number formats: 12,5 · 12.5 · (1.234,56) · 1,234.56 · € 2 500,5 · −7,1 */
export function parseNum(raw: unknown): number {
  let s = String(raw ?? '').trim().replace(/[−–]/g, '-')
    .replace(/[€%\s ']|thousand|million|billion|mn|bn$|days|years|x$|m$/gi, '');
  if (!s) return NaN;
  let neg = false;
  const m = s.match(/^\((.*)\)$/);
  if (m) { neg = true; s = m[1]; }
  const nc = (s.match(/,/g) || []).length, nd = (s.match(/\./g) || []).length;
  if (nc && nd) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (nc) s = nc === 1 ? s.replace(',', '.') : s.replace(/,/g, '');
  else if (nd > 1) s = s.replace(/\./g, '');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  const x = parseFloat(s);
  return neg ? -Math.abs(x) : x;
}

/** Within TOL relative, with an absolute floor so rounding never counts as wrong. */
export function isOk(ans: number, unit: Unit, x: number, tolRel = DEFAULT_TOL, absFloor?: number): boolean {
  if (!isFinite(x)) return false;
  const tol = Math.max(tolRel * Math.abs(ans), absFloor ?? (unit === 'pct' ? 0.05 : 0.011));
  const hit = (y: number) => Math.abs(y - ans) <= tol + 1e-9;
  if (hit(x)) return true;
  if (unit === 'pct' && Math.abs(x) <= 1.5 && hit(x * 100)) return true;
  return false;
}

export function isOkPart(p: NumPart, x: number, tolRel = DEFAULT_TOL): boolean {
  return [p.ans, ...(p.alts || [])].some(a => isOk(a, p.unit, x, tolRel, p.abs));
}

export function gradeQuestion(q: Question, answers: Answers, tolRel = DEFAULT_TOL): Graded {
  const results = q.parts.map((p, i) => {
    const v = answers[i];
    if (p.type === 'num') {
      const answered = typeof v === 'string' && v.trim() !== '';
      return { answered, ok: answered && isOkPart(p, parseNum(v), tolRel) };
    }
    const answered = typeof v === 'number';
    return { answered, ok: answered && v === p.correct };
  });
  return { results, a: results.length, c: results.filter(r => r.ok).length };
}

export function fmtAns(a: number): string {
  const d = Math.abs(a) < 1 && a !== 0 ? 4 : 2;
  const s = Math.abs(a).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: d });
  return (a < 0 ? '−' : '') + s;
}

export const UNIT: Record<Unit, [label: string, prefix: boolean]> = {
  m: ['€ million', false], eur: ['€', true], pct: ['%', false], msh: ['million shares', false],
  msh_w: ['million warrants', false], x: ['', false], k: ['€ thousand', false], bn: ['€ billion', false],
};

export function fmtSolution(p: NumPart): string {
  const [label, prefix] = UNIT[p.unit];
  return prefix ? label + fmtAns(p.ans) : fmtAns(p.ans) + (label ? ' ' + label : '');
}
