// Runs supabase/setup.sql against an in-process Postgres with a minimal stand-in for Supabase's auth schema.
import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const U1 = '11111111-1111-1111-1111-111111111111';
const U2 = '22222222-2222-2222-2222-222222222222';

async function boot() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
    insert into auth.users values ('${U1}', 'claude@wa-profis.de'), ('${U2}', 'jane.doe@example.com');
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
  `);
  await db.exec(readFileSync('supabase/setup.sql', 'utf8'));
  await db.exec(`grant usage on schema public to authenticated; grant all on all tables in schema public to authenticated;
    grant usage on schema storage to authenticated; grant all on all tables in schema storage to authenticated;`);
  return db;
}

async function as<T>(db: PGlite, uid: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role authenticated; set request.uid = '${uid}';`);
  try { return await fn(); } finally { await db.exec('reset role; reset request.uid;'); }
}

test('setup.sql applies twice and seeds content', async () => {
  const db = await boot();
  await db.exec(readFileSync('supabase/setup.sql', 'utf8'));
  const n = await db.query<{ s: string; n: number }>("select subject_slug as s, count(*)::int as n from public.concept_items group by 1 order by 1");
  assert.deepEqual(n.rows.map(r => r.s), ['fi', 'fv', 'fvcs']);
  assert.equal(n.rows.find(r => r.s === 'fvcs')!.n, 216);
  const c = await db.query<{ n: number }>('select count(*)::int as n from public.cards');
  assert.ok(c.rows[0].n >= 50);
});

test('record_attempt keeps stats and the review schedule per user', async () => {
  const db = await boot();
  await as(db, U1, async () => {
    await db.query("select public.record_attempt('fvcs', 'L1.mm2', '1', 'practice', 4, 2, null)");
    await db.query("select public.record_attempt('fvcs', 'L1.mm2', '1', 'practice', 4, 4, null)");
  });
  const s = await as(db, U1, () => db.query<{ answers: number; correct: number; ema: number }>('select answers, correct, ema from public.type_stats'));
  assert.deepEqual([s.rows[0].answers, s.rows[0].correct], [8, 6]);
  assert.ok(Math.abs(s.rows[0].ema - 0.12) < 1e-6);
  const r = await as(db, U1, () => db.query<{ box: number; later: boolean }>("select box, due_at > now() + interval '20 hours' as later from public.review_items"));
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].box, 0, 'same-day correct answer must not advance the box');
  assert.ok(r.rows[0].later);
  // Make it due, answer correctly: box moves up.
  await db.exec("update public.review_items set due_at = now() - interval '1 minute'");
  await as(db, U1, () => db.query("select public.record_attempt('fvcs', 'L1.mm2', '1', 'review', 3, 3, null)"));
  const r2 = await db.query<{ box: number }>('select box from public.review_items');
  assert.equal(r2.rows[0].box, 1);
  const other = await as(db, U2, () => db.query('select * from public.type_stats'));
  assert.equal(other.rows.length, 0, 'RLS hides other users’ rows');
  const daily = await as(db, U1, () => db.query<{ answers: number; correct: number }>("select answers::int, correct::int from public.daily_accuracy('fvcs')"));
  assert.deepEqual([daily.rows[0].answers, daily.rows[0].correct], [11, 9]);
});

test('decks: official visible to all, own decks private, overview counts', async () => {
  const db = await boot();
  const deck = await as(db, U1, async () => {
    const d = await db.query<{ id: string }>("insert into public.decks (subject_slug, owner_id, name, source) values ('fvcs', '" + U1 + "', 'Mine', 'csv') returning id");
    await db.query(`insert into public.cards (deck_id, front, back) values ('${d.rows[0].id}', 'a', 'b'), ('${d.rows[0].id}', 'c', 'd')`);
    return d.rows[0].id;
  });
  await assert.rejects(as(db, U2, () => db.query(`insert into public.cards (deck_id, front, back) values ('${deck}', 'x', 'y')`)));
  const seen2 = await as(db, U2, () => db.query<{ name: string }>('select name from public.decks'));
  assert.deepEqual(seen2.rows.map(r => r.name).sort(), ['FI core concepts', 'FV lectures 1–2', 'FVCS core concepts']);
  const ov = await as(db, U1, async () => {
    const card = await db.query<{ id: string }>(`select id from public.cards where deck_id = '${deck}' limit 1`);
    await db.query(`insert into public.card_states (user_id, card_id, due, fsrs) values ('${U1}', '${card.rows[0].id}', now() - interval '1 hour', '{}')`);
    return db.query<{ name: string; total: number; fresh: number; due: number; new_today: number }>("select name, total::int, fresh::int, due::int, new_today::int from public.deck_overview('fvcs')");
  });
  const mine = ov.rows.find(r => r.name === 'Mine')!;
  assert.deepEqual([mine.total, mine.fresh, mine.due, mine.new_today], [2, 1, 1, 1]);
  await as(db, U1, () => db.query("select public.reset_subject_stats('fvcs')"));
});

test('slides: only the admin uploads, notes are public or private, replies follow their parent', async () => {
  const db = await boot();
  const prof = await db.query<{ display_name: string }>('select display_name from public.profiles order by display_name');
  assert.deepEqual(prof.rows.map(r => r.display_name), ['claude', 'jane.doe']);
  await assert.rejects(as(db, U2, () => db.query("insert into public.slide_decks (subject_slug, topic, title, storage_path, pages) values ('fvcs', '1', 'L1', 'fvcs/x.pdf', 10)")));
  await assert.rejects(as(db, U2, () => db.query("insert into storage.objects (bucket_id, name) values ('slides', 'fvcs/x.pdf')")));
  const deck = await as(db, U1, async () => {
    await db.query("insert into storage.objects (bucket_id, name) values ('slides', 'fvcs/x.pdf')");
    const d = await db.query<{ id: string }>("insert into public.slide_decks (subject_slug, topic, title, storage_path, pages) values ('fvcs', '1', 'L1', 'fvcs/x.pdf', 10) returning id");
    return d.rows[0].id;
  });
  const ids = await as(db, U2, async () => {
    const pub = await db.query<{ id: string }>(`insert into public.slide_notes (subject_slug, deck_id, page, body) values ('fvcs', '${deck}', 3, 'MM I: $V_L = V_U$') returning id`);
    const priv = await db.query<{ id: string }>(`insert into public.slide_notes (subject_slug, deck_id, page, body, is_public) values ('fvcs', '${deck}', 3, 'mine', false) returning id`);
    await db.query("insert into public.slide_notes (subject_slug, body) values ('fvcs', 'general note')");
    return { pub: pub.rows[0].id, priv: priv.rows[0].id };
  });
  await assert.rejects(as(db, U2, () => db.query(`insert into public.slide_notes (subject_slug, page, body) values ('fvcs', 3, 'page without deck')`)));
  const seen = await as(db, U1, () => db.query<{ body: string; author: string }>('select body, author from public.slide_notes_view order by body'));
  assert.deepEqual(seen.rows.map(r => r.body), ['MM I: $V_L = V_U$', 'general note'], 'private notes stay private');
  assert.equal(seen.rows[0].author, 'jane.doe');
  await as(db, U1, async () => {
    await db.query(`insert into public.slide_notes (subject_slug, deck_id, page, parent_id, body) values ('fvcs', '${deck}', 3, '${ids.pub}', 'reply')`);
    await db.query(`insert into public.note_votes (note_id) values ('${ids.pub}')`);
  });
  await assert.rejects(as(db, U1, () => db.query(`insert into public.slide_notes (subject_slug, deck_id, page, parent_id, body) values ('fvcs', '${deck}', 3, '${ids.priv}', 'sneaky')`)));
  await assert.rejects(as(db, U1, () => db.query(`insert into public.note_votes (note_id) values ('${ids.priv}')`)));
  const v = await as(db, U2, () => db.query<{ votes: number; voted: boolean }>(`select votes, voted from public.slide_notes_view where id = '${ids.pub}'`));
  assert.deepEqual([v.rows[0].votes, v.rows[0].voted], [1, false]);
  // Others cannot edit, the admin can delete for moderation.
  const upd = await as(db, U1, () => db.query(`update public.slide_notes set body = 'x' where id = '${ids.pub}'`));
  assert.equal(upd.affectedRows, 0);
  await as(db, U1, () => db.query(`delete from public.slide_notes where id = '${ids.pub}'`));
  const left = await db.query<{ n: number }>('select count(*)::int as n from public.slide_notes where deck_id is not null');
  assert.equal(left.rows[0].n, 1, 'deleting a note removes its replies');
});

test('cheatsheets are private until shared', async () => {
  const db = await boot();
  await as(db, U1, async () => {
    await db.query("insert into public.cheat_entries (subject_slug, topic, title, body, sort) values ('fvcs', '2', 'WACC', '$$r_{wacc}$$', 1), ('fvcs', null, 'General', 'text', 2)");
  });
  const hidden = await as(db, U2, () => db.query('select * from public.cheat_entries'));
  assert.equal(hidden.rows.length, 0);
  await assert.rejects(as(db, U2, () => db.query(`insert into public.cheat_entries (user_id, subject_slug, title) values ('${U1}', 'fvcs', 'forged')`)));
  await as(db, U1, () => db.query("insert into public.cheatsheets (subject_slug, shared) values ('fvcs', true)"));
  const shared = await as(db, U2, () => db.query<{ author: string; entries: number }>('select author, entries from public.shared_cheatsheets'));
  assert.deepEqual(shared.rows.map(r => [r.author, r.entries]), [['claude', 2]]);
  const visible = await as(db, U2, () => db.query('select * from public.cheat_entries'));
  assert.equal(visible.rows.length, 2);
  const upd = await as(db, U2, () => db.query("update public.cheat_entries set title = 'x'"));
  assert.equal(upd.affectedRows, 0);
});

test('pins sit on a slide inside its bounds, stars are private', async () => {
  const db = await boot();
  const deck = await as(db, U1, async () => {
    await db.query("insert into storage.objects (bucket_id, name) values ('slides', 'fvcs/p.pdf')");
    const d = await db.query<{ id: string }>("insert into public.slide_decks (subject_slug, topic, title, storage_path, pages) values ('fvcs', '2', 'L2', 'fvcs/p.pdf', 8) returning id");
    return d.rows[0].id;
  });
  await as(db, U2, () => db.query(`insert into public.slide_notes (subject_slug, deck_id, page, body, x, y) values ('fvcs', '${deck}', 2, 'here', 0.25, 0.6)`));
  await assert.rejects(as(db, U2, () => db.query(`insert into public.slide_notes (subject_slug, deck_id, page, body, x, y) values ('fvcs', '${deck}', 2, 'off', 1.4, 0.6)`)));
  await assert.rejects(as(db, U2, () => db.query("insert into public.slide_notes (subject_slug, body, x, y) values ('fvcs', 'general with pin', 0.5, 0.5)")));
  await assert.rejects(as(db, U2, () => db.query(`insert into public.slide_notes (subject_slug, deck_id, page, body, x) values ('fvcs', '${deck}', 2, 'half', 0.5)`)));
  const pin = await as(db, U1, () => db.query<{ x: number; y: number }>('select x, y from public.slide_notes_view'));
  assert.deepEqual([pin.rows[0].x, pin.rows[0].y], [0.25, 0.6]);
  await as(db, U1, () => db.query(`insert into public.slide_stars (deck_id, page) values ('${deck}', 3), ('${deck}', 5)`));
  const mine = await as(db, U1, () => db.query<{ page: number }>('select page from public.slide_stars order by page'));
  assert.deepEqual(mine.rows.map(r => r.page), [3, 5]);
  const theirs = await as(db, U2, () => db.query('select * from public.slide_stars'));
  assert.equal(theirs.rows.length, 0);
  await assert.rejects(as(db, U2, () => db.query(`insert into public.slide_stars (user_id, deck_id, page) values ('${U1}', '${deck}', 1)`)));
});
