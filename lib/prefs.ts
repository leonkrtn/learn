// Display preferences, the same for all subjects: stored in public.user_prefs and mirrored in a cookie so the
// root layout can apply them before the first paint.
import type { Sep } from './numfmt';

export const SIZES = { small: 0.9, normal: 1, large: 1.125, larger: 1.25 } as const;
export const ACCENTS = { blue: '#2952e3', teal: '#0d7c8a', violet: '#6a3fd1', orange: '#c25a12', graphite: '#3d4350' } as const;
export type Prefs = { size: keyof typeof SIZES; accent: keyof typeof ACCENTS; sep: Sep; decimals: 2 | 3 | 4 };
export const DEFAULT_PREFS: Prefs = { size: 'normal', accent: 'blue', sep: 'point', decimals: 2 };
export const PREFS_COOKIE = 'learn-prefs';

/** Keeps only known values, so a stale cookie or row can never break the page. */
export function parsePrefs(raw: unknown): Prefs {
  let o: Record<string, unknown> = {};
  try { o = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>) || {}; } catch { /* defaults */ }
  return {
    size: o.size as string in SIZES ? o.size as Prefs['size'] : DEFAULT_PREFS.size,
    accent: o.accent as string in ACCENTS ? o.accent as Prefs['accent'] : DEFAULT_PREFS.accent,
    sep: o.sep === 'comma' ? 'comma' : 'point',
    decimals: o.decimals === 3 || o.decimals === 4 ? o.decimals : 2,
  };
}
