'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { SheetBlock } from '@/lib/subject';
import { groupsOf } from './CheatsheetView';
import Icon from './Icons';
import Rich from './Rich';
import SheetPreview, { FillMeter, SheetFlow, type SheetGroup } from './SheetPreview';
import { useSubject } from './SubjectContext';

const keyOf = (b: SheetBlock, i: number) => (b.topic ?? 'g') + ':' + i;

/** A ready-made two-sided A4 cheatsheet for the subject: preview, print, or copy entries into your own sheet. */
export default function SuggestedSheet({ have, error }: { have: string[]; error?: string }) {
  const { mod } = useSubject();
  const sb = supabaseBrowser();
  const blocks = useMemo(() => mod.cheatsheet || [], [mod.cheatsheet]);
  const groups = useMemo(() => groupsOf(mod.topics), [mod.topics]);
  const sheet: SheetGroup[] = useMemo(() => groups.map(g => ({
    key: String(g.id), name: g.name,
    items: blocks.map((b, i) => ({ b, i })).filter(({ b }) => (b.topic ?? null) === g.id).map(({ b, i }) => ({ id: keyOf(b, i), title: b.title, body: b.body })),
  })), [groups, blocks]);
  const [added, setAdded] = useState<Set<string>>(() => new Set(have));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(error || null);
  const [pages, setPages] = useState<number | null>(null);
  const title = `${mod.short} · ${mod.name}`;
  const missing = blocks.filter(b => !added.has(b.title));

  async function add(list: SheetBlock[]) {
    if (!list.length || busy) return;
    setBusy(true);
    const base = Date.now();
    const { error } = await sb.from('cheat_entries').insert(list.map((b, i) => ({ subject_slug: mod.slug, topic: b.topic, title: b.title, body: b.body, sort: base + i })));
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setErr(null);
    setAdded(s => new Set([...s, ...list.map(b => b.title)]));
  }

  if (!blocks.length) {
    return (
      <div className="page wide">
        <div className="pagehead"><h1>Suggested cheatsheet</h1></div>
        <p className="note">There is no suggested cheatsheet for {mod.short} yet.</p>
        <Link className="btn ghost small" href={`/s/${mod.slug}/cheatsheet`}>Back to my cheatsheet</Link>
      </div>
    );
  }

  return (
    <div className="page wide">
      <div className="pagehead">
        <h1>Suggested cheatsheet</h1>
        <span className="aside"><Link href={`/s/${mod.slug}/cheatsheet`}>My cheatsheet</Link></span>
      </div>
      <p className="lede">A proposal for the sheet you may bring to the exam: one A4 page, front and back, with the formulas, steps and traps of every lecture. Print it as it is, or add entries to your own cheatsheet and shorten or extend them there.</p>

      <div className="sheetbar">
        <FillMeter pages={pages} />
        <span className="spacer" />
        <button type="button" className="btn ghost small" onClick={() => window.print()}><Icon name="print" size={16} />Print A4</button>
        <button type="button" className="btn small" disabled={busy || !missing.length} onClick={() => add(missing)}>
          <Icon name="copy" size={16} />{missing.length ? `Add ${missing.length === blocks.length ? 'all' : 'the remaining ' + missing.length} to mine` : 'All added'}
        </button>
      </div>
      {err && <p className="err">{err}</p>}

      <SheetPreview title={title} groups={sheet} onMeasure={setPages} />

      <h2 className="sec">Entries<small>add the ones you want to your own sheet</small></h2>
      <div className="sheetgroups">
        {groups.map(g => {
          const list = blocks.map((b, i) => ({ b, i })).filter(({ b }) => (b.topic ?? null) === g.id);
          if (!list.length) return null;
          return (
            <section key={String(g.id)} className="sheetgroup">
              <div className="sgh"><h2>{g.name}</h2></div>
              {list.map(({ b, i }) => (
                <div key={keyOf(b, i)} className="sugrow">
                  <div className="rich-wrap" style={{ flex: 1, minWidth: 0 }}>
                    <b className="sugt">{b.title}</b>
                    <Rich text={b.body} />
                  </div>
                  <button type="button" className="act" disabled={busy || added.has(b.title)} onClick={() => add([b])}>
                    <Icon name={added.has(b.title) ? 'copy' : 'plus'} size={15} />{added.has(b.title) ? 'In my sheet' : 'Add to mine'}
                  </button>
                </div>
              ))}
            </section>
          );
        })}
      </div>

      <div className="cheatprint" aria-hidden><div className="cpcols"><SheetFlow title={title} groups={sheet} /></div></div>
    </div>
  );
}
