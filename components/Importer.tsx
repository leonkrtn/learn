'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { parseApkg, parseCsv, type ImportedCard } from '@/lib/cards/parse';
import { sanitizeHtml } from '@/lib/cards/sanitize';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useSubject } from './SubjectContext';

export default function Importer() {
  const { mod } = useSubject();
  const router = useRouter();
  const [cards, setCards] = useState<ImportedCard[] | null>(null);
  const [source, setSource] = useState<'apkg' | 'csv'>('csv');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function read(file: File) {
    setMsg(null); setCards(null); setBusy(true);
    try {
      const isApkg = /\.(apkg|colpkg)$/i.test(file.name);
      const raw = isApkg ? await parseApkg(file) : parseCsv(await file.text());
      const clean = raw.map(c => ({ front: sanitizeHtml(c.front), back: sanitizeHtml(c.back) })).filter(c => c.front && c.back);
      if (!clean.length) throw new Error('No cards with both a front and a back were found.');
      setCards(clean); setSource(isApkg ? 'apkg' : 'csv');
      setName(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
    setBusy(false);
  }

  async function save() {
    if (!cards) return;
    setBusy(true); setMsg(null);
    const sb = supabaseBrowser();
    const { data: u } = await sb.auth.getUser();
    const deck = await sb.from('decks').insert({ subject_slug: mod.slug, owner_id: u.user?.id, name: name.trim() || 'Imported deck', source }).select('id').single();
    if (deck.error) { setMsg({ ok: false, text: deck.error.message }); setBusy(false); return; }
    for (let i = 0; i < cards.length; i += 500) {
      const chunk = cards.slice(i, i + 500).map((c, j) => ({ deck_id: deck.data.id, front: c.front, back: c.back, sort: i + j }));
      const { error } = await sb.from('cards').insert(chunk);
      if (error) { setMsg({ ok: false, text: error.message }); setBusy(false); return; }
    }
    router.push(`/s/${mod.slug}/cards`);
    router.refresh();
  }

  return (
    <div className="page">
      <div className="pagehead"><h1>Import a deck</h1></div>
      <p className="lede">Anki packages (.apkg, including cloze notes) or CSV files with the front in the first column and the back in the second. Semicolon, comma and tab separators work. Images and audio are not imported. Imported decks are visible only to you.</p>
      <label className={'drop' + (over ? ' on' : '')} style={{ display: 'block', cursor: 'pointer' }}
        onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) read(f); }}>
        <input type="file" accept=".apkg,.colpkg,.csv,.tsv,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) read(f); }} />
        {busy && !cards ? 'Reading file…' : 'Drop a file here or click to choose one.'}
      </label>
      {msg && <p className={msg.ok ? 'okmsg' : 'err'}>{msg.text}</p>}
      {cards && (
        <>
          <label className="field" style={{ maxWidth: 420, fontFamily: 'var(--sans)', fontSize: 15.5 }}><span>Deck name</span>
            <input value={name} onChange={e => setName(e.target.value)} />
          </label>
          <p className="note">{cards.length} cards found. First {Math.min(8, cards.length)}:</p>
          <table className="stats preview">
            <thead><tr><th>Front</th><th>Back</th></tr></thead>
            <tbody>{cards.slice(0, 8).map((c, i) => <tr key={i}><td dangerouslySetInnerHTML={{ __html: c.front }} /><td dangerouslySetInnerHTML={{ __html: c.back }} /></tr>)}</tbody>
          </table>
          <button className="btn" type="button" disabled={busy} onClick={save}>{busy ? 'Importing…' : `Import ${cards.length} cards`}</button>
        </>
      )}
    </div>
  );
}
