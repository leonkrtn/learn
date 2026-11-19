'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { questionSig } from '@/lib/engine/marked';
import type { Question } from '@/lib/engine/types';
import { supabaseBrowser } from '@/lib/supabase/client';

export type Mark = { id: string; type_key: string; topic: string; sig: string; q: Question; created_at: string };

/** Your marked questions of a subject: loads them once, marks and unmarks with an optimistic update. */
export function useMarks(slug: string) {
  const [marks, setMarks] = useState<Mark[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) =>
      sb.from('marked_questions').select('id, type_key, topic, sig, q, created_at').eq('subject_slug', slug).eq('user_id', data.user?.id || '')
        .order('created_at').then(({ data: rows, error: e }) => {
          if (!live) return;
          if (e) setError('Your marked questions could not be loaded: ' + e.message);
          setMarks((rows || []) as Mark[]);
        }));
    return () => { live = false; };
  }, [slug]);

  const sigs = useMemo(() => new Set((marks || []).map(m => m.sig)), [marks]);

  const unmark = useCallback(async (sig: string) => {
    const prev = marks;
    setMarks(ms => (ms || []).filter(m => m.sig !== sig));
    const { error: e } = await supabaseBrowser().from('marked_questions').delete().eq('subject_slug', slug).eq('sig', sig);
    if (e) { setMarks(prev); setError('The mark could not be removed: ' + e.message); } else setError(null);
  }, [marks, slug]);

  const mark = useCallback(async (q: Question, type: { key: string; topic: string }) => {
    const sig = questionSig(q);
    if (sigs.has(sig)) return;
    const temp: Mark = { id: 'new:' + sig, type_key: type.key, topic: type.topic, sig, q, created_at: new Date().toISOString() };
    setMarks(ms => [...(ms || []), temp]);
    const { data, error: e } = await supabaseBrowser().from('marked_questions')
      .insert({ subject_slug: slug, type_key: type.key, topic: type.topic, sig, q }).select('id, type_key, topic, sig, q, created_at').single();
    if (e) { setMarks(ms => (ms || []).filter(m => m.sig !== sig)); setError('The question could not be marked: ' + e.message); return; }
    setError(null);
    setMarks(ms => (ms || []).map(m => m.sig === sig ? data as Mark : m));
  }, [sigs, slug]);

  return { marks, sigs, mark, unmark, error };
}
