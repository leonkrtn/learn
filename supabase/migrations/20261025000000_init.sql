-- Schema for the exam practice site.
-- Content tables (trimesters, subjects, concept_items, official decks) are readable by every signed-in user.
-- Progress tables are private to each user through row level security.

-- ---------- content ----------
create table if not exists public.trimesters (
  id smallint primary key,
  name text not null,
  sort smallint not null default 0
);

create table if not exists public.subjects (
  slug text primary key,
  trimester_id smallint not null references public.trimesters (id),
  name text not null,
  short_name text not null,
  sort smallint not null default 0,
  active boolean not null default true
);

create table if not exists public.concept_items (
  id bigint generated always as identity primary key,
  subject_slug text not null references public.subjects (slug) on delete cascade,
  topic text not null,
  kind text not null check (kind in ('T', 'F', 'MC')),
  text text not null,
  correct text[],
  distractors text[],
  unique (subject_slug, topic, kind, text)
);

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  subject_slug text not null references public.subjects (slug) on delete cascade,
  owner_id uuid references auth.users (id) on delete cascade,
  name text not null,
  source text not null default 'official',
  created_at timestamptz not null default now()
);
create index if not exists decks_subject_idx on public.decks (subject_slug);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  front text not null,
  back text not null,
  sort integer not null default 0,
  ext_key text,
  unique (deck_id, ext_key)
);
create index if not exists cards_deck_idx on public.cards (deck_id);

-- ---------- progress ----------
create table if not exists public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_slug text not null references public.subjects (slug) on delete cascade,
  type_key text not null,
  topic text not null,
  mode text not null,
  parts_total smallint not null,
  parts_correct smallint not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index if not exists attempts_user_subject_time_idx on public.attempts (user_id, subject_slug, created_at);

create table if not exists public.type_stats (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_slug text not null references public.subjects (slug) on delete cascade,
  type_key text not null,
  topic text not null,
  answers integer not null default 0,
  correct integer not null default 0,
  ema real not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_slug, type_key)
);

-- Spaced repetition on question types: a wrong answer schedules the type again with new numbers.
create table if not exists public.review_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_slug text not null references public.subjects (slug) on delete cascade,
  type_key text not null,
  topic text not null,
  box smallint not null default 0,
  due_at timestamptz not null,
  primary key (user_id, subject_slug, type_key)
);

create table if not exists public.mock_results (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_slug text not null references public.subjects (slug) on delete cascade,
  score numeric(6, 2) not null,
  max_score numeric(6, 2) not null,
  parts jsonb not null,
  minutes integer not null,
  created_at timestamptz not null default now()
);
create index if not exists mock_results_user_idx on public.mock_results (user_id, subject_slug, created_at);

create table if not exists public.user_settings (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_slug text not null references public.subjects (slug) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_slug)
);

create table if not exists public.card_states (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  due timestamptz not null,
  fsrs jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, card_id)
);
create index if not exists card_states_due_idx on public.card_states (user_id, due);

create table if not exists public.card_reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  rating smallint not null check (rating between 1 and 4),
  reviewed_at timestamptz not null default now()
);
create index if not exists card_reviews_user_idx on public.card_reviews (user_id, reviewed_at);

-- ---------- row level security ----------
alter table public.trimesters enable row level security;
alter table public.subjects enable row level security;
alter table public.concept_items enable row level security;
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.attempts enable row level security;
alter table public.type_stats enable row level security;
alter table public.review_items enable row level security;
alter table public.mock_results enable row level security;
alter table public.user_settings enable row level security;
alter table public.card_states enable row level security;
alter table public.card_reviews enable row level security;

drop policy if exists "read trimesters" on public.trimesters;
create policy "read trimesters" on public.trimesters for select to authenticated using (true);
drop policy if exists "read subjects" on public.subjects;
create policy "read subjects" on public.subjects for select to authenticated using (true);
drop policy if exists "read concepts" on public.concept_items;
create policy "read concepts" on public.concept_items for select to authenticated using (true);

drop policy if exists "read decks" on public.decks;
create policy "read decks" on public.decks for select to authenticated
  using (owner_id is null or owner_id = (select auth.uid()));
drop policy if exists "insert own decks" on public.decks;
create policy "insert own decks" on public.decks for insert to authenticated
  with check (owner_id = (select auth.uid()));
drop policy if exists "update own decks" on public.decks;
create policy "update own decks" on public.decks for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "delete own decks" on public.decks;
create policy "delete own decks" on public.decks for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "read cards" on public.cards;
create policy "read cards" on public.cards for select to authenticated
  using (exists (select 1 from public.decks d where d.id = deck_id and (d.owner_id is null or d.owner_id = (select auth.uid()))));
drop policy if exists "insert cards in own decks" on public.cards;
create policy "insert cards in own decks" on public.cards for insert to authenticated
  with check (exists (select 1 from public.decks d where d.id = deck_id and d.owner_id = (select auth.uid())));
drop policy if exists "delete cards in own decks" on public.cards;
create policy "delete cards in own decks" on public.cards for delete to authenticated
  using (exists (select 1 from public.decks d where d.id = deck_id and d.owner_id = (select auth.uid())));

do $$
declare t text;
begin
  foreach t in array array['attempts', 'type_stats', 'review_items', 'mock_results', 'user_settings', 'card_states', 'card_reviews'] loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- ---------- functions ----------
-- Records one graded question: attempt row, per-type statistics (error EMA) and the review schedule.
create or replace function public.record_attempt(
  p_subject text, p_type text, p_topic text, p_mode text,
  p_total integer, p_correct integer, p_detail jsonb default null
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  err real := (p_total - p_correct)::real / greatest(p_total, 1);
  cur_box smallint;
  cur_due timestamptz;
  steps integer[] := array[1, 3, 7, 16, 35];
begin
  if uid is null then raise exception 'not signed in'; end if;

  insert into public.attempts (user_id, subject_slug, type_key, topic, mode, parts_total, parts_correct, detail)
  values (uid, p_subject, p_type, p_topic, p_mode, p_total, p_correct, p_detail);

  insert into public.type_stats as s (user_id, subject_slug, type_key, topic, answers, correct, ema, updated_at)
  values (uid, p_subject, p_type, p_topic, p_total, p_correct, 0.4 * err, now())
  on conflict (user_id, subject_slug, type_key) do update
    set answers = s.answers + excluded.answers,
        correct = s.correct + excluded.correct,
        ema = 0.6 * s.ema + 0.4 * err,
        updated_at = now();

  select box, due_at into cur_box, cur_due from public.review_items
   where user_id = uid and subject_slug = p_subject and type_key = p_type;

  if p_correct < p_total then
    insert into public.review_items (user_id, subject_slug, type_key, topic, box, due_at)
    values (uid, p_subject, p_type, p_topic, 0, now() + interval '1 day')
    on conflict (user_id, subject_slug, type_key) do update set box = 0, due_at = now() + interval '1 day';
  elsif cur_box is not null and cur_due <= now() then
    -- Only a correct answer on a due item moves it up; same-day repeats do not count.
    if cur_box + 1 >= array_length(steps, 1) then
      delete from public.review_items where user_id = uid and subject_slug = p_subject and type_key = p_type;
    else
      update public.review_items
         set box = cur_box + 1, due_at = now() + make_interval(days => steps[cur_box + 2])
       where user_id = uid and subject_slug = p_subject and type_key = p_type;
    end if;
  end if;
end $$;

-- Daily answers and correct answers for the history chart.
create or replace function public.daily_accuracy(p_subject text, p_days integer default 120, p_tz text default 'Europe/Lisbon')
returns table (day date, answers bigint, correct bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select (a.created_at at time zone p_tz)::date as day,
         sum(a.parts_total)::bigint, sum(a.parts_correct)::bigint
    from public.attempts a
   where a.user_id = (select auth.uid()) and a.subject_slug = p_subject
     and a.created_at > now() - make_interval(days => p_days)
   group by 1
   order by 1;
$$;

create or replace function public.reset_subject_stats(p_subject text) returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.attempts where user_id = (select auth.uid()) and subject_slug = p_subject;
  delete from public.type_stats where user_id = (select auth.uid()) and subject_slug = p_subject;
  delete from public.review_items where user_id = (select auth.uid()) and subject_slug = p_subject;
  delete from public.mock_results where user_id = (select auth.uid()) and subject_slug = p_subject;
$$;

-- Per-deck card counts for the signed-in user: total, never studied, due now, introduced today.
create or replace function public.deck_overview(p_subject text, p_tz text default 'Europe/Lisbon')
returns table (deck_id uuid, name text, source text, owner_id uuid, total bigint, fresh bigint, due bigint, new_today bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select d.id, d.name, d.source, d.owner_id,
         count(c.id),
         count(c.id) filter (where s.card_id is null),
         count(c.id) filter (where s.due <= now()),
         count(c.id) filter (where s.created_at >= ((now() at time zone p_tz)::date)::timestamp at time zone p_tz)
    from public.decks d
    left join public.cards c on c.deck_id = d.id
    left join public.card_states s on s.card_id = c.id and s.user_id = (select auth.uid())
   where d.subject_slug = p_subject
   group by d.id
   order by d.owner_id nulls first, d.created_at;
$$;

revoke execute on function public.record_attempt(text, text, text, text, integer, integer, jsonb) from public, anon;
revoke execute on function public.daily_accuracy(text, integer, text) from public, anon;
revoke execute on function public.reset_subject_stats(text) from public, anon;
revoke execute on function public.deck_overview(text, text) from public, anon;
grant execute on function public.record_attempt(text, text, text, text, integer, integer, jsonb) to authenticated;
grant execute on function public.daily_accuracy(text, integer, text) to authenticated;
grant execute on function public.reset_subject_stats(text) to authenticated;
grant execute on function public.deck_overview(text, text) to authenticated;
