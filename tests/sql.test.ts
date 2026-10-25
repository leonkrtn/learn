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
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
    insert into auth.users values ('${U1}'), ('${U2}');
  `);
  await db.exec(readFileSync('supabase/setup.sql', 'utf8'));
  await db.exec(`grant usage on schema public to authenticated; grant all on all tables in schema public to authenticated;`);
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
  assert.deepEqual(n.rows.map(r => r.s), ['fv', 'fvcs']);
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
  assert.deepEqual(seen2.rows.map(r => r.name).sort(), ['FV lectures 1–2', 'FVCS core concepts']);
  const ov = await as(db, U1, async () => {
    const card = await db.query<{ id: string }>(`select id from public.cards where deck_id = '${deck}' limit 1`);
    await db.query(`insert into public.card_states (user_id, card_id, due, fsrs) values ('${U1}', '${card.rows[0].id}', now() - interval '1 hour', '{}')`);
    return db.query<{ name: string; total: number; fresh: number; due: number; new_today: number }>("select name, total::int, fresh::int, due::int, new_today::int from public.deck_overview('fvcs')");
  });
  const mine = ov.rows.find(r => r.name === 'Mine')!;
  assert.deepEqual([mine.total, mine.fresh, mine.due, mine.new_today], [2, 1, 1, 1]);
  await as(db, U1, () => db.query("select public.reset_subject_stats('fvcs')"));
});
