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
  mode: 'endless' | 'session';
  sessionLen: number;
  newPerDay: number;
};
export const DEFAULT_SETTINGS: Settings = { enabled: null, mode: 'endless', sessionLen: 20, newPerDay: 20 };

export type TypeStat = { answers: number; correct: number; ema: number };
export type DueItem = { type_key: string; topic: string; due_at: string; box: number };

type Ctx = {
  mod: SubjectModule;
  bank: ConceptBank;
  settings: Settings;
  saveSettings: (s: Settings) => Promise<void>;
  stats: Record<string, TypeStat>;
  due: DueItem[];
  record: (typeKey: string, topic: string, mode: string, total: number, correct: number, detail?: unknown) => void;
  syncError: string | null;
};

const SubjectCtx = createContext<Ctx | null>(null);

export function useSubject(): Ctx {
  const c = useContext(SubjectCtx);
  if (!c) throw new Error('useSubject outside SubjectProvider');
  return c;
}

export function SubjectProvider({ slug, bank, initialSettings, initialStats, initialDue, children }: {
  slug: string;
  bank: ConceptBank;
  initialSettings: Partial<Settings> | null;
  initialStats: Record<string, TypeStat>;
  initialDue: DueItem[];
  children: ReactNode;
}) {
  const mod = getSubject(slug)!;
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS, ...(initialSettings || {}) });
  const [stats, setStats] = useState(initialStats);
  const [due, setDue] = useState(initialDue);
  const [syncError, setSyncError] = useState<string | null>(null);

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
    setDue(prev => {
      const now = Date.now();
      const item = prev.find(d => d.type_key === typeKey);
      if (correct < total) {
        const next = { type_key: typeKey, topic, box: 0, due_at: new Date(now + 864e5).toISOString() };
        return [...prev.filter(d => d.type_key !== typeKey), next];
      }
      if (item && Date.parse(item.due_at) <= now) return prev.filter(d => d.type_key !== typeKey);
      return prev;
    });
    supabaseBrowser().rpc('record_attempt', {
      p_subject: slug, p_type: typeKey, p_topic: topic, p_mode: mode, p_total: total, p_correct: correct, p_detail: detail ?? null,
    }).then(({ error }) => setSyncError(error ? 'Your last answer was not saved: ' + error.message : null));
  }, [slug]);

  const value = useMemo(() => ({ mod, bank, settings, saveSettings, stats, due, record, syncError }), [mod, bank, settings, saveSettings, stats, due, record, syncError]);
  return <SubjectCtx.Provider value={value}>{children}</SubjectCtx.Provider>;
}
