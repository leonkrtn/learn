'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setNumPrefs } from '@/lib/numfmt';
import { PREFS_COOKIE, SIZES, type Prefs } from '@/lib/prefs';
import { supabaseBrowser } from '@/lib/supabase/client';

type Ctx = { prefs: Prefs; update: (p: Prefs) => Promise<string | null> };
const PrefsCtx = createContext<Ctx | null>(null);

const writeCookie = (p: Prefs) => { document.cookie = `${PREFS_COOKIE}=${encodeURIComponent(JSON.stringify(p))}; path=/; max-age=31536000; samesite=lax`; };

/** Applies the display preferences: text size and accent on <html>, number format for generated questions. */
export function PrefsProvider({ initial, persist, children }: { initial: Prefs; persist: boolean; children: ReactNode }) {
  const [prefs, setPrefs] = useState(initial);
  if (typeof window !== 'undefined') setNumPrefs(prefs);
  // Preferences read from the database on a new device go into the cookie for the next page load.
  useEffect(() => { if (persist) writeCookie(initial); }, [persist, initial]);

  const update = useCallback(async (p: Prefs) => {
    setPrefs(p);
    setNumPrefs(p);
    const el = document.documentElement;
    el.dataset.accent = p.accent;
    el.style.setProperty('--fs', String(SIZES[p.size]));
    writeCookie(p);
    const sb = supabaseBrowser();
    const { data } = await sb.auth.getUser();
    if (!data.user) return null;
    const { error } = await sb.from('user_prefs').upsert({ user_id: data.user.id, prefs: p, updated_at: new Date().toISOString() });
    return error ? 'Saved on this device only: ' + error.message : null;
  }, []);

  const value = useMemo(() => ({ prefs, update }), [prefs, update]);
  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>;
}

export function usePrefs(): Ctx {
  const c = useContext(PrefsCtx);
  if (!c) throw new Error('usePrefs outside PrefsProvider');
  return c;
}
