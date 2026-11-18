'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { nextEma } from '@/lib/engine/select';
import type { ConceptBank } from '@/lib/engine/types';
import { supabaseBrowser } from '@/lib/supabase/client';
import { getSubject } from '@/subjects';
import type { SubjectModule } from '@/lib/subject';

export type Settings = {
  /** Enabled type keys; null means all. */
  enabled: string[] | null;
  /** Enabled problem-set type keys; null means all. */
  ps: string[] | null;
  newPerDay: number;
};
export const DEFAULT_SETTINGS: Settings = { enabled: null, ps: null, newPerDay: 20 };

export type TypeStat = { answers: number; correct: number; ema: number };

type Ctx = {
  mod: SubjectModule;
  bank: ConceptBank;
  settings: Settings;
  saveSettings: (s: Settings) => Promise<void>;
  stats: Record<string, TypeStat>;
  record: (typeKey: string, topic: string, mode: string, total: number, correct: number, detail?: unknown) => void;
  syncError: string | null;
  /** Lecture of the question on screen, so the cheatsheet drawer can file a new entry under it. */
  focusTopic: string | null;
  setFocusTopic: (t: string | null) => void;
};

const SubjectCtx = createContext<Ctx | null>(null);

export function useSubject(): Ctx {
  const c = useContext(SubjectCtx);
  if (!c) throw new Error('useSubject outside SubjectProvider');
  return c;
}

export function SubjectProvider({ slug, bank, initialSettings, initialStats, children }: {
  slug: string;
  bank: ConceptBank;
  initialSettings: Partial<Settings> | null;
  initialStats: Record<string, TypeStat>;
  children: ReactNode;
}) {
  const mod = getSubject(slug)!;
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS, ...(initialSettings || {}) });
  const [stats, setStats] = useState(initialStats);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [focusTopic, setFocusTopic] = useState<string | null>(null);

  const saveSettings = useCallback(async (s: Settings) => {
    setSettings(s);
    const { error } = await supabaseBrowser().from('user_settings').upsert({ subject_slug: slug, settings: s, updated_at: new Date().toISOString() }, { onConflict: 'user_id,subject_slug' });
    setSyncError(error ? 'Settings could not be saved: ' + error.message : null);
  }, [slug]);

  const record = useCallback((typeKey: string, topic: string, mode: string, total: number, correct: number, detail?: unknown) => {
    setStats(prev => {
      const p = prev[typeKey] || { answers: 0, correct: 0, ema: 0 };
      return { ...prev, [typeKey]: { answers: p.answers + total, correct: p.correct + correct, ema: nextEma(p.ema, total, correct) } };
    });
    supabaseBrowser().rpc('record_attempt', {
      p_subject: slug, p_type: typeKey, p_topic: topic, p_mode: mode, p_total: total, p_correct: correct, p_detail: detail ?? null,
    }).then(({ error }) => setSyncError(error ? 'Your last answer was not saved: ' + error.message : null));
  }, [slug]);

  const value = useMemo(() => ({ mod, bank, settings, saveSettings, stats, record, syncError, focusTopic, setFocusTopic }),
    [mod, bank, settings, saveSettings, stats, record, syncError, focusTopic]);
  return <SubjectCtx.Provider value={value}>{children}</SubjectCtx.Provider>;
}
