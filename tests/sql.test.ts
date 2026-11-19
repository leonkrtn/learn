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
  assert.deepEqual(n.rows.map(r => r.s), ['fd', 'fi', 'fv', 'fvcs', 'ifd', 'pif']);
  assert.equal(n.rows.find(r => r.s === 'fvcs')!.n, 216);
  const tri = await db.query<{ slug: string; t: number }>('select slug, trimester_id as t from public.subjects order by slug');
  assert.deepEqual(tri.rows.map(r => r.slug + ':' + r.t), ['fd:2', 'fi:2', 'fv:2', 'fvcs:1', 'ifd:2', 'pif:2']);
  const c = await db.query<{ n: number }>('select count(*)::int as n from public.cards');
  assert.ok(c.rows[0].n >= 50);
});

test('record_attempt keeps stats per user; study_activity and resets', async () => {
  const db = await boot();
  await as(db, U1, async () => {
    await db.query("select public.record_attempt('fvcs', 'L1.mm2', '1', 'practice', 4, 2, null)");
    await db.query("select public.record_attempt('fvcs', 'L1.mm2', '1', 'practice', 4, 4, null)");
    await db.query("select public.record_attempt('fi', 'L1.capm', '1', 'practice', 3, 3, null)");
  });
  const s = await as(db, U1, () => db.query<{ answers: number; correct: number; ema: number }>("select answers, correct, ema from public.type_stats where subject_slug = 'fvcs'"));
  assert.deepEqual([s.rows[0].answers, s.rows[0].correct], [8, 6]);
  assert.ok(Math.abs(s.rows[0].ema - 0.12) < 1e-6);
  const gone = await db.query<{ t: string | null }>("select to_regclass('public.review_items')::text as t");
  assert.equal(gone.rows[0].t, null, 'the review queue is dropped');
  const other = await as(db, U2, () => db.query('select * from public.type_stats'));
  assert.equal(other.rows.length, 0, 'RLS hides other users’ rows');
  const daily = await as(db, U1, () => db.query<{ answers: number; correct: number }>("select answers::int, correct::int from public.daily_accuracy('fvcs')"));
  assert.deepEqual([daily.rows[0].answers, daily.rows[0].correct], [8, 6]);

  // Two answers 4 minutes apart, then one after a 30-minute pause: 1 + 4 + 1 minutes; a 25-minute mock counts as 25.
  await db.exec(`update public.attempts set created_at = date_trunc('day', now()) + interval '9 hours' where subject_slug = 'fvcs' and parts_correct = 2;
    update public.attempts set created_at = date_trunc('day', now()) + interval '9 hours 4 minutes' where subject_slug = 'fvcs' and parts_correct = 4;
    update public.attempts set created_at = date_trunc('day', now()) + interval '9 hours 34 minutes' where subject_slug = 'fi';`);
  await as(db, U1, () => db.query("insert into public.mock_results (subject_slug, score, max_score, parts, minutes) values ('fvcs', 12, 20, '[]', 25)"));
  const act = await as(db, U1, () => db.query<{ s: string; answers: number; mocks: number; minutes: string }>(
    "select subject_slug as s, answers::int, mocks::int, minutes::text from public.study_activity(30, 'UTC') order by 1"));
  assert.deepEqual(act.rows.map(r => [r.s, r.answers, r.mocks, +r.minutes]), [['fi', 3, 0, 1], ['fvcs', 8, 1, 30]]);
  assert.equal((await as(db, U2, () => db.query('select * from public.study_activity()'))).rows.length, 0);

  await as(db, U1, () => db.query("select public.reset_subject_stats('fvcs')"));
  const left = await as(db, U1, () => db.query<{ s: string }>('select distinct subject_slug as s from public.attempts union select subject_slug from public.mock_results'));
  assert.deepEqual(left.rows.map(r => r.s), ['fi']);
  await as(db, U1, () => db.query('select public.reset_all_stats()'));
  const none = await as(db, U1, () => db.query('select 1 from public.attempts union all select 1 from public.type_stats'));
  assert.equal(none.rows.length, 0);
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
  assert.deepEqual(seen2.rows.map(r => r.name).sort(), ['FD core concepts', 'FI core concepts', 'FV lectures 1–7', 'FVCS core concepts', 'IFD core concepts', 'PIF core concepts']);
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

test('practice_sets: one row per scope, private, cleared by reset', async () => {
  const db = await boot();
  const up = (pos: number) => db.query(`insert into public.practice_sets (subject_slug, scope, pool, items, pos) values ('fvcs', 'practice', 'p', '[{"type":"L1.mm2","q":{}}]', ${pos})
    on conflict (user_id, subject_slug, scope) do update set items = excluded.items, pos = excluded.pos, updated_at = now()`);
  await as(db, U1, async () => { await up(0); await up(1); });
  const mine = await as(db, U1, () => db.query<{ pos: number }>('select pos from public.practice_sets'));
  assert.deepEqual(mine.rows.map(r => r.pos), [1]);
  const other = await as(db, U2, () => db.query('select * from public.practice_sets'));
  assert.equal(other.rows.length, 0, 'RLS hides other users’ sets');
  await assert.rejects(as(db, U1, () => db.query("insert into public.practice_sets (subject_slug, scope, pool, items) values ('fvcs', 'review', 'p', '{}')")));
  await as(db, U1, () => db.query("select public.reset_subject_stats('fvcs')"));
  const left = await db.query('select * from public.practice_sets');
  assert.equal(left.rows.length, 0);
});

test('display preferences belong to their user', async () => {
  const db = await boot();
  await as(db, U1, () => db.query(`insert into public.user_prefs (prefs) values ('{"size":"large","sep":"comma"}')`));
  await as(db, U1, () => db.query(`insert into public.user_prefs (user_id, prefs) values ('${U1}', '{"size":"small"}') on conflict (user_id) do update set prefs = excluded.prefs`));
  const mine = await as(db, U1, () => db.query<{ size: string }>("select prefs->>'size' as size from public.user_prefs"));
  assert.deepEqual(mine.rows.map(r => r.size), ['small']);
  assert.equal((await as(db, U2, () => db.query('select * from public.user_prefs'))).rows.length, 0);
  await assert.rejects(as(db, U2, () => db.query(`insert into public.user_prefs (user_id, prefs) values ('${U1}', '{}')`)));
});

test('study notes are private to their owner', async () => {
  const db = await boot();
  await as(db, U1, () => db.query("insert into public.study_notes (subject_slug, topic, body) values ('fvcs', '2', 'Look at MM II again')"));
  await assert.rejects(as(db, U1, () => db.query("insert into public.study_notes (subject_slug, body) values ('fvcs', '')")), 'empty notes are refused');
  await assert.rejects(as(db, U2, () => db.query(`insert into public.study_notes (user_id, subject_slug, body) values ('${U1}', 'fvcs', 'x')`)));
  assert.equal((await as(db, U2, () => db.query('select * from public.study_notes'))).rows.length, 0);
  await as(db, U2, () => db.query('update public.study_notes set done = true'));
  const mine = await as(db, U1, () => db.query<{ done: boolean }>('select done from public.study_notes'));
  assert.deepEqual(mine.rows.map(r => r.done), [false], 'others cannot change them');
});
