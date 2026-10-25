import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import type { DueItem, TypeStat } from '@/components/SubjectContext';
import type { ConceptBank } from './engine/types';

export type SubjectRow = { slug: string; name: string; short_name: string; trimester_id: number; sort: number };
export type TrimesterRow = { id: number; name: string; sort: number };
export type DeckRow = { deck_id: string; name: string; source: string; owner_id: string | null; total: number; fresh: number; due: number; new_today: number };

type ConceptRow = { topic: string; kind: 'T' | 'F' | 'MC'; text: string; correct: string[] | null; distractors: string[] | null };

export function rowsToBank(rows: ConceptRow[]): ConceptBank {
  const bank: ConceptBank = {};
  for (const r of rows) {
    const b = bank[r.topic] ||= { T: [], F: [], MC: [] };
    if (r.kind === 'MC') b.MC.push({ q: r.text, correct: r.correct || [], distractors: r.distractors || [] });
    else b[r.kind].push(r.text);
  }
  return bank;
}

export async function getCatalog(sb: SupabaseClient) {
  const [t, s] = await Promise.all([
    sb.from('trimesters').select('id, name, sort').order('sort'),
    sb.from('subjects').select('slug, name, short_name, trimester_id, sort').eq('active', true).order('sort'),
  ]);
  return { trimesters: (t.data || []) as TrimesterRow[], subjects: (s.data || []) as SubjectRow[], error: t.error || s.error };
}

/** Cached per request: layout and page share one round trip. */
export const getDecks = cache(async (sb: SupabaseClient, slug: string): Promise<DeckRow[]> => {
  const { data } = await sb.rpc('deck_overview', { p_subject: slug });
  return ((data || []) as DeckRow[]).map(d => ({ ...d, total: +d.total, fresh: +d.fresh, due: +d.due, new_today: +d.new_today }));
});

/** Cards available to study now: due reviews plus new cards up to the daily limit. */
export const studyable = (d: DeckRow, newPerDay: number) => d.due + Math.min(d.fresh, Math.max(0, newPerDay - d.new_today));

export const loadSubject = cache(async (sb: SupabaseClient, slug: string) => {
  const [subj, concepts, settings, stats, due] = await Promise.all([
    sb.from('subjects').select('slug, name, short_name, trimester_id, sort, trimesters(name)').eq('slug', slug).maybeSingle(),
    sb.from('concept_items').select('topic, kind, text, correct, distractors').eq('subject_slug', slug),
    sb.from('user_settings').select('settings').eq('subject_slug', slug).maybeSingle(),
    sb.from('type_stats').select('type_key, answers, correct, ema').eq('subject_slug', slug),
    sb.from('review_items').select('type_key, topic, due_at, box').eq('subject_slug', slug),
  ]);
  const statMap: Record<string, TypeStat> = {};
  for (const r of (stats.data || []) as (TypeStat & { type_key: string })[]) statMap[r.type_key] = { answers: r.answers, correct: r.correct, ema: r.ema };
  const tri = (subj.data as unknown as { trimesters: { name: string } | null } | null)?.trimesters;
  return {
    subject: subj.data as SubjectRow | null,
    trimesterName: tri?.name || '',
    bank: rowsToBank((concepts.data || []) as ConceptRow[]),
    settings: (settings.data?.settings || null) as Record<string, unknown> | null,
    stats: statMap,
    due: (due.data || []) as DueItem[],
    error: subj.error || concepts.error,
  };
});
