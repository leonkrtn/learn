-- Paste into the Supabase SQL editor and run once. Safe to re-run.

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

-- Lecture slides with per-slide and per-subject notes, and a personal cheatsheet per subject.
-- Slides are uploaded by the admin only; every signed-in user can read them and post notes.
-- Notes are public or private per note. Cheatsheets are private unless their owner shares them.

-- ---------- admin and profiles ----------
-- The admin is the account with this email address. Change it here and re-run to hand over.
create or replace function public.is_admin() returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from auth.users u where u.id = (select auth.uid()) and lower(u.email) = 'claude@wa-profis.de');
$$;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  updated_at timestamptz not null default now()
);

-- Every account gets a profile; the default display name is the part of the email before the @.
create or replace function public.create_profile() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, left(coalesce(nullif(split_part(new.email, '@', 1), ''), 'Student'), 40))
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists create_profile on auth.users;
create trigger create_profile after insert on auth.users for each row execute function public.create_profile();

insert into public.profiles (user_id, display_name)
select id, left(coalesce(nullif(split_part(email, '@', 1), ''), 'Student'), 40) from auth.users
on conflict (user_id) do nothing;

-- ---------- slides ----------
create table if not exists public.slide_decks (
  id uuid primary key default gen_random_uuid(),
  subject_slug text not null references public.subjects (slug) on delete cascade,
  topic text not null,
  title text not null check (char_length(title) between 1 and 200),
  storage_path text not null unique,
  pages integer not null check (pages > 0),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists slide_decks_subject on public.slide_decks (subject_slug, topic);

-- deck_id and page are both null for general notes on the subject, both set for notes on one slide.
create table if not exists public.slide_notes (
  id uuid primary key default gen_random_uuid(),
  subject_slug text not null references public.subjects (slug) on delete cascade,
  deck_id uuid references public.slide_decks (id) on delete cascade,
  page integer,
  parent_id uuid references public.slide_notes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  body text not null check (char_length(body) between 1 and 8000),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((deck_id is null) = (page is null)),
  check (page is null or page > 0)
);
create index if not exists slide_notes_deck on public.slide_notes (deck_id, page);
create index if not exists slide_notes_subject on public.slide_notes (subject_slug) where deck_id is null;
create index if not exists slide_notes_parent on public.slide_notes (parent_id);

create table if not exists public.note_votes (
  note_id uuid not null references public.slide_notes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (note_id, user_id)
);

-- Notes with author name, vote count and whether the reader voted; row level security of the base tables applies.
-- Dropped first so setup.sql stays re-runnable after later migrations add columns.
drop view if exists public.slide_notes_view;
create view public.slide_notes_view with (security_invoker = true) as
select n.id, n.subject_slug, n.deck_id, n.page, n.parent_id, n.user_id, n.body, n.is_public, n.created_at, n.updated_at,
       coalesce(p.display_name, 'Student') as author,
       (select count(*) from public.note_votes v where v.note_id = n.id)::integer as votes,
       exists (select 1 from public.note_votes v where v.note_id = n.id and v.user_id = (select auth.uid())) as voted
  from public.slide_notes n
  left join public.profiles p on p.user_id = n.user_id;

-- ---------- cheatsheets ----------
create table if not exists public.cheatsheets (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  subject_slug text not null references public.subjects (slug) on delete cascade,
  shared boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_slug)
);

-- topic null means the "General" group.
create table if not exists public.cheat_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  subject_slug text not null references public.subjects (slug) on delete cascade,
  topic text,
  title text not null default '' check (char_length(title) <= 200),
  body text not null default '' check (char_length(body) <= 8000),
  sort double precision not null default 0,
  source_note_id uuid references public.slide_notes (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cheat_entries_owner on public.cheat_entries (user_id, subject_slug, sort);

-- Shared cheatsheets with their owner's display name, for the list of classmates' sheets.
create or replace view public.shared_cheatsheets with (security_invoker = true) as
select c.user_id, c.subject_slug, c.updated_at, coalesce(p.display_name, 'Student') as author,
       (select count(*) from public.cheat_entries e where e.user_id = c.user_id and e.subject_slug = c.subject_slug)::integer as entries
  from public.cheatsheets c
  left join public.profiles p on p.user_id = c.user_id
 where c.shared;

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.slide_decks enable row level security;
alter table public.slide_notes enable row level security;
alter table public.note_votes enable row level security;
alter table public.cheatsheets enable row level security;
alter table public.cheat_entries enable row level security;

drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles for select to authenticated using (true);
drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "read slides" on public.slide_decks;
create policy "read slides" on public.slide_decks for select to authenticated using (true);
drop policy if exists "admin writes slides" on public.slide_decks;
create policy "admin writes slides" on public.slide_decks for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "read notes" on public.slide_notes;
create policy "read notes" on public.slide_notes for select to authenticated
  using (is_public or user_id = (select auth.uid()));
-- Replies go only under top-level notes the writer can see, on the same slide; a reply is public exactly when its parent is.
-- Checked in a function because a policy on slide_notes may not query slide_notes itself.
create or replace function public.can_reply(p_parent uuid, p_subject text, p_deck uuid, p_page integer, p_public boolean) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.slide_notes p
     where p.id = p_parent and p.parent_id is null and p.is_public = p_public and p.subject_slug = p_subject
       and p.deck_id is not distinct from p_deck and p.page is not distinct from p_page
       and (p.is_public or p.user_id = (select auth.uid())));
$$;
grant execute on function public.can_reply(uuid, text, uuid, integer, boolean) to authenticated;

drop policy if exists "insert own notes" on public.slide_notes;
create policy "insert own notes" on public.slide_notes for insert to authenticated
  with check (user_id = (select auth.uid()) and (parent_id is null or public.can_reply(parent_id, subject_slug, deck_id, page, is_public)));
drop policy if exists "update own notes" on public.slide_notes;
create policy "update own notes" on public.slide_notes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "delete own notes" on public.slide_notes;
create policy "delete own notes" on public.slide_notes for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "read votes" on public.note_votes;
create policy "read votes" on public.note_votes for select to authenticated using (true);
drop policy if exists "vote on visible notes" on public.note_votes;
create policy "vote on visible notes" on public.note_votes for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.slide_notes n where n.id = note_id and n.is_public));
drop policy if exists "remove own votes" on public.note_votes;
create policy "remove own votes" on public.note_votes for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "read own or shared cheatsheets" on public.cheatsheets;
create policy "read own or shared cheatsheets" on public.cheatsheets for select to authenticated
  using (shared or user_id = (select auth.uid()));
drop policy if exists "write own cheatsheets" on public.cheatsheets;
create policy "write own cheatsheets" on public.cheatsheets for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "read own or shared entries" on public.cheat_entries;
create policy "read own or shared entries" on public.cheat_entries for select to authenticated
  using (user_id = (select auth.uid()) or exists (
    select 1 from public.cheatsheets c where c.user_id = cheat_entries.user_id and c.subject_slug = cheat_entries.subject_slug and c.shared));
drop policy if exists "write own entries" on public.cheat_entries;
create policy "write own entries" on public.cheat_entries for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- storage: private bucket for slide PDFs ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('slides', 'slides', false, 52428800, array['application/pdf'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "read slide files" on storage.objects;
create policy "read slide files" on storage.objects for select to authenticated using (bucket_id = 'slides');
drop policy if exists "admin uploads slide files" on storage.objects;
create policy "admin uploads slide files" on storage.objects for insert to authenticated
  with check (bucket_id = 'slides' and (select public.is_admin()));
drop policy if exists "admin updates slide files" on storage.objects;
create policy "admin updates slide files" on storage.objects for update to authenticated
  using (bucket_id = 'slides' and (select public.is_admin()));
drop policy if exists "admin deletes slide files" on storage.objects;
create policy "admin deletes slide files" on storage.objects for delete to authenticated
  using (bucket_id = 'slides' and (select public.is_admin()));

-- A note can point at a spot on its slide (x and y as fractions of the slide's width and height),
-- and everyone can star slides for themselves.

alter table public.slide_notes add column if not exists x real;
alter table public.slide_notes add column if not exists y real;
alter table public.slide_notes drop constraint if exists slide_notes_pin;
alter table public.slide_notes add constraint slide_notes_pin check (
  (x is null and y is null)
  or (page is not null and x is not null and y is not null and x between 0 and 1 and y between 0 and 1)
);

drop view if exists public.slide_notes_view;
create view public.slide_notes_view with (security_invoker = true) as
select n.id, n.subject_slug, n.deck_id, n.page, n.parent_id, n.user_id, n.body, n.is_public, n.created_at, n.updated_at,
       coalesce(p.display_name, 'Student') as author,
       (select count(*) from public.note_votes v where v.note_id = n.id)::integer as votes,
       exists (select 1 from public.note_votes v where v.note_id = n.id and v.user_id = (select auth.uid())) as voted,
       n.x, n.y
  from public.slide_notes n
  left join public.profiles p on p.user_id = n.user_id;

create table if not exists public.slide_stars (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  deck_id uuid not null references public.slide_decks (id) on delete cascade,
  page integer not null check (page > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, deck_id, page)
);

alter table public.slide_stars enable row level security;
drop policy if exists "own rows" on public.slide_stars;
create policy "own rows" on public.slide_stars for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Fixed question sets: practice, problem sets and review draw 20 questions at a time and keep them, with the
-- answers given so far, so a set can be continued on another device. One row per user, subject and scope
-- ('practice', 'ps', 'ps:<set id>', 'review'); the row is overwritten when the next set starts.

create table if not exists public.practice_sets (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_slug text not null references public.subjects (slug) on delete cascade,
  scope text not null check (char_length(scope) between 1 and 64),
  -- Fingerprint of the question pool the set was drawn from; a different pool starts a new set.
  pool text not null,
  -- [{ type: string, q: Question, answers?: object, checked?: boolean }]
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 40),
  pos smallint not null default 0 check (pos >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_slug, scope)
);

alter table public.practice_sets enable row level security;
drop policy if exists "own rows" on public.practice_sets;
create policy "own rows" on public.practice_sets for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.reset_subject_stats(p_subject text) returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.attempts where user_id = (select auth.uid()) and subject_slug = p_subject;
  delete from public.type_stats where user_id = (select auth.uid()) and subject_slug = p_subject;
  delete from public.review_items where user_id = (select auth.uid()) and subject_slug = p_subject;
  delete from public.mock_results where user_id = (select auth.uid()) and subject_slug = p_subject;
  delete from public.practice_sets where user_id = (select auth.uid()) and subject_slug = p_subject;
$$;

-- Account page: study activity across subjects and a reset for all subjects. The review queue is gone:
-- record_attempt no longer schedules question types, and review_items with its stored sets is dropped.

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
end $$;

-- Answers, correct answers, flashcard reviews, mock exams and estimated minutes per day and subject.
-- Minutes: the time since the previous answer or card review counts if it is at most ten minutes, otherwise the
-- event counts as one minute (start of a session). Mock exams count with their recorded duration instead.
create or replace function public.study_activity(p_days integer default 3650, p_tz text default 'Europe/Lisbon')
returns table (day date, subject_slug text, answers bigint, correct bigint, cards bigint, mocks bigint, minutes numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  with ev as (
    select a.created_at as t, a.subject_slug as s, a.parts_total as n, a.parts_correct as c, 0 as k, 0 as m, 0 as mm, a.mode = 'mock' as timed
      from public.attempts a
     where a.user_id = (select auth.uid()) and a.created_at > now() - make_interval(days => p_days)
    union all
    select r.reviewed_at, d.subject_slug, 0, 0, 1, 0, 0, false
      from public.card_reviews r
      join public.cards c on c.id = r.card_id
      join public.decks d on d.id = c.deck_id
     where r.user_id = (select auth.uid()) and r.reviewed_at > now() - make_interval(days => p_days)
    union all
    select x.created_at, x.subject_slug, 0, 0, 0, 1, x.minutes, true
      from public.mock_results x
     where x.user_id = (select auth.uid()) and x.created_at > now() - make_interval(days => p_days)
  ), timed as (
    select ev.*, extract(epoch from t - lag(t) over (partition by timed order by t)) as gap from ev
  )
  select (t at time zone p_tz)::date, s,
         sum(n)::bigint, sum(c)::bigint, sum(k)::bigint, sum(m)::bigint,
         round(sum(case when timed then mm when gap is null or gap > 600 then 60 else gap end / (case when timed then 1 else 60 end))::numeric, 1)
    from timed
   group by 1, 2
   order by 1, 2;
$$;

create or replace function public.reset_subject_stats(p_subject text) returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.attempts where user_id = (select auth.uid()) and subject_slug = p_subject;
  delete from public.type_stats where user_id = (select auth.uid()) and subject_slug = p_subject;
  delete from public.mock_results where user_id = (select auth.uid()) and subject_slug = p_subject;
  delete from public.practice_sets where user_id = (select auth.uid()) and subject_slug = p_subject;
$$;

create or replace function public.reset_all_stats() returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.attempts where user_id = (select auth.uid());
  delete from public.type_stats where user_id = (select auth.uid());
  delete from public.mock_results where user_id = (select auth.uid());
  delete from public.practice_sets where user_id = (select auth.uid());
$$;

delete from public.practice_sets where scope = 'review';
drop table if exists public.review_items;

revoke execute on function public.study_activity(integer, text) from public, anon;
revoke execute on function public.reset_all_stats() from public, anon;
grant execute on function public.study_activity(integer, text) to authenticated;
grant execute on function public.reset_all_stats() to authenticated;

-- Display preferences of a user (text size, accent colour, decimal separator, decimals), the same for all subjects.
create table if not exists public.user_prefs (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_prefs enable row level security;
drop policy if exists "own rows" on public.user_prefs;
create policy "own rows" on public.user_prefs for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Private study notes per subject: things to look at again, open questions, to-dos. Opened from the top bar like the cheatsheet.
-- topic null means "General"; done marks a note as dealt with.
create table if not exists public.study_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  subject_slug text not null references public.subjects (slug) on delete cascade,
  topic text,
  body text not null check (char_length(body) between 1 and 4000),
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists study_notes_owner on public.study_notes (user_id, subject_slug, created_at);

alter table public.study_notes enable row level security;
drop policy if exists "own rows" on public.study_notes;
create policy "own rows" on public.study_notes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Generated by `npm run seed:sql`. Do not edit by hand.

insert into public.trimesters (id, name, sort) values (1, 'Trimester 1', 1) on conflict (id) do nothing;
insert into public.trimesters (id, name, sort) values (2, 'Trimester 2', 2) on conflict (id) do nothing;
insert into public.subjects (slug, trimester_id, name, short_name, sort) values ('fvcs', 1, 'Firm Value and Capital Structure', 'FVCS', 1) on conflict (slug) do update set trimester_id = excluded.trimester_id, name = excluded.name, short_name = excluded.short_name, sort = excluded.sort;
insert into public.subjects (slug, trimester_id, name, short_name, sort) values ('fv', 2, 'Firm Valuation', 'FV', 1) on conflict (slug) do update set trimester_id = excluded.trimester_id, name = excluded.name, short_name = excluded.short_name, sort = excluded.sort;
insert into public.subjects (slug, trimester_id, name, short_name, sort) values ('fi', 2, 'Financial Investments', 'FI', 2) on conflict (slug) do update set trimester_id = excluded.trimester_id, name = excluded.name, short_name = excluded.short_name, sort = excluded.sort;
insert into public.subjects (slug, trimester_id, name, short_name, sort) values ('ifd', 2, 'Investment and Financing Decisions', 'IFD', 3) on conflict (slug) do update set trimester_id = excluded.trimester_id, name = excluded.name, short_name = excluded.short_name, sort = excluded.sort;
insert into public.subjects (slug, trimester_id, name, short_name, sort) values ('fd', 2, 'Financial Derivatives', 'FD', 4) on conflict (slug) do update set trimester_id = excluded.trimester_id, name = excluded.name, short_name = excluded.short_name, sort = excluded.sort;
insert into public.subjects (slug, trimester_id, name, short_name, sort) values ('pif', 2, 'Programming in Finance', 'PIF', 5) on conflict (slug) do update set trimester_id = excluded.trimester_id, name = excluded.name, short_name = excluded.short_name, sort = excluded.sort;

delete from public.concept_items where subject_slug = 'fvcs';
insert into public.concept_items (subject_slug, topic, kind, text, correct, distractors) values
  ('fvcs', '1', 'T', 'In a perfect capital market, the total value of a firm is equal to the market value of the total cash flows generated by its assets and is not affected by its choice of capital structure.', null, null),
  ('fvcs', '1', 'T', 'Leverage increases the risk of a firm’s equity even when there is no risk that the firm will default.', null, null),
  ('fvcs', '1', 'T', 'With perfect capital markets, a firm’s WACC is independent of its capital structure.', null, null),
  ('fvcs', '1', 'T', 'Investors can alter the leverage choice of the firm to suit their personal tastes by borrowing or lending on their own.', null, null),
  ('fvcs', '1', 'T', 'In a perfect capital market, a leveraged recapitalization leaves the share price unchanged.', null, null),
  ('fvcs', '1', 'T', 'In a perfect capital market, a leveraged recapitalization increases the expected return on equity.', null, null),
  ('fvcs', '1', 'T', 'The unlevered beta measures the market risk of a firm as if it had no leverage, which is equivalent to the beta of the firm’s assets.', null, null),
  ('fvcs', '1', 'T', 'Although leverage can increase a firm’s expected earnings per share, it does not increase the share price in a perfect capital market.', null, null),
  ('fvcs', '1', 'T', 'According to MM Proposition II, the cost of capital of levered equity equals the unlevered cost of capital plus a premium proportional to the market value debt-equity ratio.', null, null),
  ('fvcs', '1', 'T', 'A market value balance sheet includes intangible assets such as reputation, brand name, or human capital.', null, null),
  ('fvcs', '1', 'T', 'In a perfect capital market, selling debt at a fair price and using the proceeds to repurchase shares is a zero-NPV transaction.', null, null),
  ('fvcs', '1', 'T', 'If a firm issues equity to repay debt in a perfect capital market, its equity cost of capital falls while its WACC remains unchanged.', null, null),
  ('fvcs', '1', 'T', 'For an all-equity firm, the equity cost of capital equals the cost of capital of its assets.', null, null),
  ('fvcs', '1', 'T', 'Debt that bears no systematic risk has a risk premium of zero.', null, null),
  ('fvcs', '1', 'T', 'To estimate the unlevered beta of a project, one should rely on the unlevered betas of firms with comparable investments.', null, null),
  ('fvcs', '1', 'T', 'Savings from the lower cost of debt are exactly offset by a higher equity cost of capital in a perfect capital market.', null, null),
  ('fvcs', '1', 'T', 'An investor who prefers unlevered equity can recreate it by buying both the debt and the equity of a levered firm in proportion to their market values.', null, null),
  ('fvcs', '1', 'F', 'In a perfect capital market, a firm can lower its WACC by substituting cheaper debt for more expensive equity.', null, null),
  ('fvcs', '1', 'F', 'Assume a perfect capital market setting. If a company increases its leverage, the share price and the earnings per share will increase to compensate equity investors for an increase in risk.', null, null),
  ('fvcs', '1', 'F', 'Leverage increases the equity cost of capital only if the debt is risky.', null, null),
  ('fvcs', '1', 'F', 'In a perfect capital market, a recapitalization that raises expected EPS also raises the share price.', null, null),
  ('fvcs', '1', 'F', 'The market value balance sheet values the firm’s assets at their historical cost.', null, null),
  ('fvcs', '1', 'F', 'In a perfect capital market, the unlevered beta of a firm increases when the firm takes on more debt.', null, null),
  ('fvcs', '1', 'F', 'MM Proposition I only holds if the firm’s debt is risk-free.', null, null),
  ('fvcs', '1', 'F', 'In a perfect capital market, shareholders who do not tender their shares in a leveraged recapitalization earn a capital gain.', null, null),
  ('fvcs', '1', 'F', 'Homemade leverage requires that investors can borrow at a lower interest rate than the firm.', null, null),
  ('fvcs', '1', 'F', 'In a perfect capital market, the optimal capital structure is the one that minimizes the equity cost of capital.', null, null),
  ('fvcs', '1', 'F', 'Because levered equity is riskier, it must sell for a higher price per euro of expected cash flow than unlevered equity.', null, null),
  ('fvcs', '1', 'MC', 'In perfect capital markets, what is the optimal capital structure to maximize firm value?', array['There is none: capital structure has no effect on firm value.']::text[], array['As much debt as possible, because debt is cheaper than equity.', 'The debt-equity ratio at which the equity cost of capital is lowest.', 'The capital structure that maximizes expected earnings per share.']::text[]),
  ('fvcs', '1', 'MC', 'What happens to the share price and to the expected return on equity when a firm undertakes a leveraged recapitalization in perfect capital markets?', array['The share price is unchanged; the expected return on equity increases.']::text[], array['The share price increases; the expected return on equity increases.', 'The share price is unchanged; the expected return on equity is unchanged.', 'The share price decreases; the expected return on equity increases.']::text[]),
  ('fvcs', '1', 'MC', 'A firm is all-equity financed, but an investor would prefer to hold levered equity. How can she achieve this?', array['Buy the firm’s shares and borrow on her own account (e.g., a margin loan) to finance part of the purchase.']::text[], array['Buy the firm’s shares together with risk-free bonds.', 'Buy equal amounts of the firm’s shares and the market index.', 'She cannot: only the firm can create leverage.']::text[]),
  ('fvcs', '1', 'MC', 'Why does a leveraged recapitalization in a perfect capital market increase expected EPS without increasing the share price?', array['The risk of EPS increases, so shareholders require a higher return that exactly offsets the higher expected EPS.']::text[], array['Because the additional EPS is paid to debt holders.', 'Because the share price only reacts to dividends, not to EPS.', 'Because the number of shares outstanding does not change.']::text[]),
  ('fvcs', '1', 'MC', 'According to MM Proposition I, what is the total market value of a levered firm in a perfect capital market?', array['The market value of the cash flows generated by its assets, the same as the value of the unlevered firm.']::text[], array['The value of the unlevered firm plus the value of its debt.', 'The value of the unlevered firm minus the value of its debt.', 'The present value of its earnings per share times the number of shares.']::text[]),
  ('fvcs', '2', 'T', 'The interest tax shield equals the corporate tax rate multiplied by the interest payments.', null, null),
  ('fvcs', '2', 'T', 'With permanent, risk-free debt and a constant marginal tax rate, the present value of the interest tax shield equals τc × D.', null, null),
  ('fvcs', '2', 'T', 'When a firm maintains a target debt-equity ratio, its levered value can be computed by discounting its free cash flow at the after-tax WACC.', null, null),
  ('fvcs', '2', 'T', 'The repayment of principal is not tax deductible and therefore does not contribute to the interest tax shield.', null, null),
  ('fvcs', '2', 'T', 'When securities are fairly priced, the original shareholders of a firm capture the full benefit of the interest tax shield from an increase in leverage.', null, null),
  ('fvcs', '2', 'T', 'Corporate taxes lower the effective cost of debt financing, which translates into a reduction in the weighted average cost of capital.', null, null),
  ('fvcs', '2', 'T', 'To determine the true tax benefit of leverage, we need to evaluate the combined effect of both corporate and personal taxes.', null, null),
  ('fvcs', '2', 'T', 'If the personal tax rates on interest income and on equity income are equal, the effective tax advantage of debt equals the corporate tax rate.', null, null),
  ('fvcs', '2', 'T', 'A personal tax disadvantage for debt causes the WACC to decline more slowly with leverage than it otherwise would.', null, null),
  ('fvcs', '2', 'T', 'Personal taxes have an indirect effect on the firm’s weighted average cost of capital.', null, null),
  ('fvcs', '2', 'T', 'To receive the full tax benefit of leverage, a firm needs to have taxable earnings.', null, null),
  ('fvcs', '2', 'T', 'From a tax perspective, the optimal level of leverage is the level at which interest equals EBIT.', null, null),
  ('fvcs', '2', 'T', 'Excess interest is costly if debt holders face a personal tax disadvantage relative to equity investors.', null, null),
  ('fvcs', '2', 'T', 'Most investment and growth of U.S. corporations is supported by internally generated funds.', null, null),
  ('fvcs', '2', 'T', 'Firms in growth industries such as biotechnology carry little debt, whereas utilities and airlines have high leverage ratios.', null, null),
  ('fvcs', '2', 'T', 'With corporate taxes as the only market imperfection, a leveraged recapitalization increases both the share price and the expected return on equity.', null, null),
  ('fvcs', '2', 'T', 'In a leveraged recapitalization with corporate taxes, the share price rises when the transaction is announced, not when the shares are repurchased.', null, null),
  ('fvcs', '2', 'T', 'The higher the firm’s leverage, the more the firm exploits the tax advantage of debt, and the lower its WACC, as long as corporate taxes are the only imperfection.', null, null),
  ('fvcs', '2', 'F', 'Because the firm’s free cash flow is computed without considering the firm’s leverage, we account for the benefit of the interest tax shield by calculating the WACC using the before-tax cost of debt.', null, null),
  ('fvcs', '2', 'F', 'In the United States, capital gains from equity have historically been taxed more heavily than interest income.', null, null),
  ('fvcs', '2', 'F', 'With corporate taxes, only the shareholders who keep their shares benefit from the interest tax shield in a leveraged recapitalization.', null, null),
  ('fvcs', '2', 'F', 'With corporate taxes as the only imperfection, a leveraged recapitalization leaves the share price unchanged.', null, null),
  ('fvcs', '2', 'F', 'When equity income is taxed less heavily than interest income, the effective tax advantage of debt exceeds the corporate tax rate.', null, null),
  ('fvcs', '2', 'F', 'The present value of the interest tax shield of permanent, risk-free debt increases with the interest rate on the debt.', null, null),
  ('fvcs', '2', 'F', 'Interest payments that exceed the tax-deductible limit still generate an immediate tax shield for the firm.', null, null),
  ('fvcs', '2', 'F', 'With corporate taxes, the gains from the interest tax shield in a leveraged recapitalization accrue to the debt holders.', null, null),
  ('fvcs', '2', 'F', 'In most years, aggregate net equity issues by U.S. corporations are strongly positive.', null, null),
  ('fvcs', '2', 'F', 'Since 1975, debt has typically financed between 60% and 75% of the value of the average U.S. firm.', null, null),
  ('fvcs', '2', 'F', 'Personal taxes always increase the tax advantage of debt.', null, null),
  ('fvcs', '2', 'F', 'The reduction in the WACC from corporate taxes decreases with the amount of debt financing.', null, null),
  ('fvcs', '2', 'MC', 'Assume corporate taxes are the only market imperfection. If a firm undertakes a leveraged recapitalization, who benefits from the gains from the interest tax shield?', array['The firm’s original equity holders, both those who tender their shares and those who keep them.']::text[], array['Only the shareholders who keep their shares after the repurchase.', 'The debt holders who provide the new debt.', 'Only the shareholders who sell their shares in the repurchase.']::text[]),
  ('fvcs', '2', 'MC', 'In the context of optimal debt policy, what do we understand by excess interest, and when is it costly?', array['Interest expense in excess of the firm’s tax-deductible earnings; it is costly if debt holders face a personal tax disadvantage relative to equity holders.']::text[], array['Interest paid above the risk-free rate; it is costly whenever the firm’s credit rating is below investment grade.', 'Interest on debt in excess of the target debt-equity ratio; it is always costly because it raises the WACC.', 'Interest that exceeds the firm’s dividends; it is costly only if the corporate tax rate exceeds personal tax rates.']::text[]),
  ('fvcs', '2', 'MC', 'Under which condition does the effective tax advantage of debt, τ*, equal the corporate tax rate?', array['When the personal tax rates on interest income and equity income are equal (including when both are zero).']::text[], array['When the personal tax rate on interest income is zero but equity income is taxed.', 'When the corporate tax rate equals the personal tax rate on interest income.', 'Only when the firm’s debt is permanent.']::text[]),
  ('fvcs', '2', 'MC', 'Why is the after-tax cost of debt used in the WACC?', array['Free cash flow is computed as if the firm were unlevered, so the benefit of the interest tax shield is captured by reducing the cost of debt by (1 − τc).']::text[], array['Because debt holders pay personal taxes on their interest income.', 'Because interest payments are made out of after-tax net income.', 'Because the tax shield increases the cost of equity.']::text[]),
  ('fvcs', '2', 'MC', 'Consider a company that mainly targets its interest coverage ratio to manage its capital structure. Focusing on leverage policy, what can it do to increase its interest coverage ratio?', array['Issue equity and use the proceeds to buy back debt.']::text[], array['Issue debt and use the proceeds to repurchase shares.', 'Pay a special dividend financed with new debt.', 'Replace short-term debt with long-term debt of the same amount.']::text[]),
  ('fvcs', '3', 'T', 'With perfect capital markets, the risk of bankruptcy is not a disadvantage of debt.', null, null),
  ('fvcs', '3', 'T', 'In a perfect capital market, bankruptcy shifts the ownership of the firm from equity holders to debt holders without changing the total value available to all investors.', null, null),
  ('fvcs', '3', 'T', 'Economic distress is a significant decline in the value of a firm’s assets, whether or not the firm experiences financial distress due to leverage.', null, null),
  ('fvcs', '3', 'T', 'When securities are fairly priced, the original shareholders of a firm pay the present value of the costs associated with bankruptcy and financial distress.', null, null),
  ('fvcs', '3', 'T', 'Debt holders anticipate the costs of financial distress and therefore pay less for the debt initially.', null, null),
  ('fvcs', '3', 'T', 'The indirect costs of financial distress are often much larger than the direct costs of bankruptcy.', null, null),
  ('fvcs', '3', 'T', 'In a Chapter 11 reorganization, the firm’s existing management is given the opportunity to propose a reorganization plan while continuing to operate the business.', null, null),
  ('fvcs', '3', 'T', 'In a Chapter 7 liquidation, a trustee oversees the liquidation of the firm’s assets, and the firm ceases to exist.', null, null),
  ('fvcs', '3', 'T', 'The probability of financial distress increases with the volatility of a firm’s cash flows and asset values.', null, null),
  ('fvcs', '3', 'T', 'Technology firms are likely to incur high financial distress costs, whereas real estate firms are likely to have low costs of financial distress.', null, null),
  ('fvcs', '3', 'T', 'The present value of financial distress costs will be higher for high-beta firms.', null, null),
  ('fvcs', '3', 'T', 'The trade-off theory can help explain why firms choose debt levels that are too low to fully exploit the interest tax shield.', null, null),
  ('fvcs', '3', 'T', 'The average direct costs of bankruptcy are approximately 3% to 4% of the pre-bankruptcy market value of total assets.', null, null),
  ('fvcs', '3', 'T', 'A firm with access to capital markets need not default as long as the market value of its assets exceeds its liabilities.', null, null),
  ('fvcs', '3', 'T', 'For risky debt, the yield to maturity exceeds the expected return of the debt.', null, null),
  ('fvcs', '3', 'T', 'When estimating indirect costs of financial distress, only losses beyond those that would occur due to economic distress anyway should be counted.', null, null),
  ('fvcs', '3', 'T', 'According to the trade-off theory, the value of a levered firm equals the value without leverage plus the present value of the interest tax shield, less the present value of financial distress costs.', null, null),
  ('fvcs', '3', 'F', 'In a perfect capital market, the decline in firm value when a risky project fails is caused by bankruptcy.', null, null),
  ('fvcs', '3', 'F', 'When debt is fairly priced, the debt holders bear the present value of the financial distress costs.', null, null),
  ('fvcs', '3', 'F', 'A firm must default whenever it lacks the cash to make a debt payment, even if the market value of its assets exceeds its liabilities.', null, null),
  ('fvcs', '3', 'F', 'Chapter 7 liquidation is the most common form of bankruptcy for large corporations.', null, null),
  ('fvcs', '3', 'F', 'Real estate firms typically face higher costs of financial distress than technology firms.', null, null),
  ('fvcs', '3', 'F', 'The direct costs of bankruptcy are usually larger than the indirect costs of financial distress.', null, null),
  ('fvcs', '3', 'F', 'The probability of financial distress decreases with the volatility of a firm’s cash flows.', null, null),
  ('fvcs', '3', 'F', 'In a Chapter 11 reorganization, creditors typically receive more than the full amount they are owed.', null, null),
  ('fvcs', '3', 'F', 'For risky zero-coupon debt, the yield to maturity equals the expected return of the debt.', null, null),
  ('fvcs', '3', 'F', 'According to the trade-off theory, firms with stable cash flows and highly tangible assets should hold relatively little debt.', null, null),
  ('fvcs', '3', 'F', 'The present value of financial distress costs is lower for firms whose cash flows are highly correlated with the market.', null, null),
  ('fvcs', '3', 'F', 'Equity holders care about bankruptcy costs once the firm has defaulted, because these costs reduce their payoff.', null, null),
  ('fvcs', '3', 'MC', 'Who pays for the expected costs of financial distress when securities are fairly priced?', array['The firm’s original shareholders, because debt holders pay less for the debt when it is issued.']::text[], array['The debt holders, because they receive less in default.', 'The firm’s customers and suppliers.', 'Nobody, because the costs only arise in default.']::text[]),
  ('fvcs', '3', 'MC', 'Which of the following is an indirect cost of financial distress?', array['Loss of customers', 'Loss of key employees', 'Fire sales of assets', 'Loss of suppliers']::text[], array['Fees paid to lawyers during the bankruptcy process', 'Fees paid to accountants and consultants hired for the bankruptcy', 'Court fees of the bankruptcy proceedings']::text[]),
  ('fvcs', '3', 'MC', 'Which of the following is a direct cost of bankruptcy?', array['Fees paid to outside experts such as lawyers and consultants', 'Legal and professional fees incurred by creditors', 'Court and administrative fees of the bankruptcy process']::text[], array['Loss of customers who fear the firm will not honor warranties', 'Loss of key employees', 'Delayed or inefficient liquidation']::text[]),
  ('fvcs', '3', 'MC', 'What is the difference between economic distress and financial distress?', array['Economic distress is a significant decline in the value of the firm’s assets regardless of leverage; financial distress means the firm has difficulty meeting its debt obligations.']::text[], array['Economic distress only occurs in recessions; financial distress only in bankruptcy.', 'Economic distress affects only equity holders; financial distress affects only debt holders.', 'There is no difference; both terms describe default on debt.']::text[]),
  ('fvcs', '3', 'MC', 'Consider a company in the death care business. According to the predictions of the trade-off theory, should it in general have a relatively high or low debt-to-value ratio?', array['Relatively high: stable, predictable cash flows and tangible assets imply valuable tax shields and low expected costs of financial distress.']::text[], array['Relatively low: stable cash flows mean the firm has little use for the interest tax shield.', 'Relatively low: tangible assets increase the costs of financial distress.', 'Relatively high: high growth opportunities make debt cheap.']::text[]),
  ('fvcs', '3', 'MC', 'Consider a company in the regulated electricity utility business. According to the predictions of the trade-off theory, should it in general have a relatively high or low debt-to-value ratio?', array['Relatively high: stable, predictable cash flows and tangible assets imply valuable tax shields and low expected costs of financial distress.']::text[], array['Relatively low: stable cash flows mean the firm has little use for the interest tax shield.', 'Relatively low: tangible assets increase the costs of financial distress.', 'Relatively high: high growth opportunities make debt cheap.']::text[]),
  ('fvcs', '3', 'MC', 'Consider a company in the toll-road operator business. According to the predictions of the trade-off theory, should it in general have a relatively high or low debt-to-value ratio?', array['Relatively high: stable, predictable cash flows and tangible assets imply valuable tax shields and low expected costs of financial distress.']::text[], array['Relatively low: stable cash flows mean the firm has little use for the interest tax shield.', 'Relatively low: tangible assets increase the costs of financial distress.', 'Relatively high: high growth opportunities make debt cheap.']::text[]),
  ('fvcs', '3', 'MC', 'Consider a company in the commercial real estate business. According to the predictions of the trade-off theory, should it in general have a relatively high or low debt-to-value ratio?', array['Relatively high: stable, predictable cash flows and tangible assets imply valuable tax shields and low expected costs of financial distress.']::text[], array['Relatively low: stable cash flows mean the firm has little use for the interest tax shield.', 'Relatively low: tangible assets increase the costs of financial distress.', 'Relatively high: high growth opportunities make debt cheap.']::text[]),
  ('fvcs', '3', 'MC', 'Consider a company in the waste management business. According to the predictions of the trade-off theory, should it in general have a relatively high or low debt-to-value ratio?', array['Relatively high: stable, predictable cash flows and tangible assets imply valuable tax shields and low expected costs of financial distress.']::text[], array['Relatively low: stable cash flows mean the firm has little use for the interest tax shield.', 'Relatively low: tangible assets increase the costs of financial distress.', 'Relatively high: high growth opportunities make debt cheap.']::text[]),
  ('fvcs', '3', 'MC', 'Consider a young company in the biotechnology start-up business. According to the predictions of the trade-off theory, should it in general have a relatively high or low debt-to-value ratio?', array['Relatively low: volatile cash flows, intangible assets and dependence on key employees imply high expected costs of financial distress, and low current profits limit tax shields.']::text[], array['Relatively high: growth opportunities can serve as collateral.', 'Relatively high: high R&D spending creates large interest tax shields.', 'Relatively low: tangible assets make financial distress costly.']::text[]),
  ('fvcs', '3', 'MC', 'Consider a young company in the early-stage software business. According to the predictions of the trade-off theory, should it in general have a relatively high or low debt-to-value ratio?', array['Relatively low: volatile cash flows, intangible assets and dependence on key employees imply high expected costs of financial distress, and low current profits limit tax shields.']::text[], array['Relatively high: growth opportunities can serve as collateral.', 'Relatively high: high R&D spending creates large interest tax shields.', 'Relatively low: tangible assets make financial distress costly.']::text[]),
  ('fvcs', '3', 'MC', 'Consider a young company in the AI research business. According to the predictions of the trade-off theory, should it in general have a relatively high or low debt-to-value ratio?', array['Relatively low: volatile cash flows, intangible assets and dependence on key employees imply high expected costs of financial distress, and low current profits limit tax shields.']::text[], array['Relatively high: growth opportunities can serve as collateral.', 'Relatively high: high R&D spending creates large interest tax shields.', 'Relatively low: tangible assets make financial distress costly.']::text[]),
  ('fvcs', '3', 'MC', 'Consider a young company in the video game development business. According to the predictions of the trade-off theory, should it in general have a relatively high or low debt-to-value ratio?', array['Relatively low: volatile cash flows, intangible assets and dependence on key employees imply high expected costs of financial distress, and low current profits limit tax shields.']::text[], array['Relatively high: growth opportunities can serve as collateral.', 'Relatively high: high R&D spending creates large interest tax shields.', 'Relatively low: tangible assets make financial distress costly.']::text[]),
  ('fvcs', '4', 'T', 'When a firm faces financial distress, shareholders can gain at the expense of debt holders by taking a negative-NPV project if it is sufficiently risky.', null, null),
  ('fvcs', '4', 'T', 'Debt overhang can lead equity holders to reject positive-NPV projects.', null, null),
  ('fvcs', '4', 'T', 'Anticipating agency problems, debt holders pay less for the debt when it is issued, which reduces the initial share price.', null, null),
  ('fvcs', '4', 'T', 'With long-term debt, equity holders have more opportunities to profit at the debt holders’ expense before the debt matures.', null, null),
  ('fvcs', '4', 'T', 'Creditors often place restrictions on the actions that the firm can take. Such restrictions are referred to as debt covenants.', null, null),
  ('fvcs', '4', 'T', 'Covenants are often designed to prevent management from exploiting debt holders, so they may help to reduce agency costs.', null, null),
  ('fvcs', '4', 'T', 'Covenants may limit the firm’s ability to pay large dividends or the types of investments that the firm can make.', null, null),
  ('fvcs', '4', 'T', 'Because covenants hinder management flexibility, they may prevent investment in positive-NPV opportunities.', null, null),
  ('fvcs', '4', 'T', 'Relying on short-term debt may increase a firm’s risk of financial distress.', null, null),
  ('fvcs', '4', 'T', 'Financing with debt rather than equity allows the original owners of a firm to maintain a concentrated ownership stake.', null, null),
  ('fvcs', '4', 'T', 'According to the free cash flow hypothesis, leverage increases firm value because it commits the firm to future interest payments, reducing excess cash and wasteful investment.', null, null),
  ('fvcs', '4', 'T', 'When a firm is highly levered, creditors themselves will closely monitor the actions of managers.', null, null),
  ('fvcs', '4', 'T', 'Leverage can reduce management entrenchment because managers are more likely to be fired when a firm faces financial distress.', null, null),
  ('fvcs', '4', 'T', 'A firm in financial distress has an incentive to cash out by paying dividends, even if this reduces total firm value.', null, null),
  ('fvcs', '4', 'T', 'In asset substitution, debt holders lose more than equity holders gain, so the total value of the firm declines.', null, null),
  ('fvcs', '4', 'T', 'A firm with greater leverage may become a fiercer competitor because it cannot risk the possibility of bankruptcy.', null, null),
  ('fvcs', '4', 'T', 'The agency costs of leverage arise when managers maximize the value of equity rather than the value of the firm.', null, null),
  ('fvcs', '4', 'F', 'Agency costs are smallest for long-term debt.', null, null),
  ('fvcs', '4', 'F', 'Asset substitution problems are most severe for firms with low leverage.', null, null),
  ('fvcs', '4', 'F', 'In a debt overhang situation, equity holders are always willing to fund positive-NPV projects.', null, null),
  ('fvcs', '4', 'F', 'Debt covenants reduce agency costs and never impose costs of their own on the firm.', null, null),
  ('fvcs', '4', 'F', 'The free cash flow hypothesis states that wasteful investment is most likely when firms have little cash flow in excess of their positive-NPV investments.', null, null),
  ('fvcs', '4', 'F', 'Issuing new equity instead of debt reduces the agency costs of reduced managerial effort and excessive perks.', null, null),
  ('fvcs', '4', 'F', 'Higher leverage makes managers more entrenched.', null, null),
  ('fvcs', '4', 'F', 'Shareholders of a firm in financial distress prefer safer strategies because they bear losses first.', null, null),
  ('fvcs', '4', 'F', 'Relying on short-term debt eliminates the risk of financial distress.', null, null),
  ('fvcs', '4', 'F', 'A firm with inefficiently high leverage will always choose to reduce its leverage, because doing so increases firm value.', null, null),
  ('fvcs', '4', 'F', 'Agency costs of leverage only arise once a firm has formally filed for bankruptcy.', null, null),
  ('fvcs', '4', 'F', 'In a debt overhang situation, the benefits of a new investment funded by shareholders accrue mainly to shareholders.', null, null),
  ('fvcs', '4', 'MC', 'What is the market imperfection underlying the problem of excessive risk-taking (asset substitution)?', array['Managers maximize value for equity holders, not for all investors.']::text[], array['Managers act in their own interest rather than in the interest of investors.', 'Managers have better information about the firm than outside investors.', 'Interest payments are tax deductible at the corporate level.']::text[]),
  ('fvcs', '4', 'MC', 'What is the market imperfection underlying the concept of agency benefits of debt?', array['Managers act in their own interest, not in the best interest of the investors.']::text[], array['Managers maximize value for equity holders, not for all investors.', 'Debt holders have better information than equity holders.', 'Interest payments are tax deductible at the corporate level.']::text[]),
  ('fvcs', '4', 'MC', 'A firm’s managers are expected to waste part of the firm’s net income on needless perks and pet projects. How could the firm benefit from debt financing?', array['Through the tax benefits of leverage and by reducing wasteful spending, since interest payments reduce the cash managers can waste.']::text[], array['Only through the tax benefits of leverage; debt does not affect managers’ behavior.', 'By increasing the cash available to managers for investment.', 'Debt financing cannot benefit the firm because it increases agency costs.']::text[]),
  ('fvcs', '4', 'MC', 'What is debt overhang?', array['A situation in which equity holders choose not to invest in a positive-NPV project because the firm is in financial distress and the value of the investment would accrue to debt holders.']::text[], array['A situation in which a firm takes on risky negative-NPV projects to benefit shareholders.', 'A situation in which a firm has more debt than its interest tax shield can absorb.', 'A situation in which managers waste free cash flow on unprofitable investments.']::text[]),
  ('fvcs', '4', 'MC', 'How can firms mitigate the agency costs of debt?', array['By using shorter-maturity debt and debt covenants.']::text[], array['By issuing longer-maturity debt.', 'By paying out more cash as dividends.', 'By increasing leverage further.']::text[]),
  ('fvcs', '4', 'MC', 'A firm with inefficiently high leverage could increase total firm value by issuing equity to buy back debt. Why might shareholders oppose this?', array['Because debt holders capture more than the increase in firm value, so equity holders lose.']::text[], array['Because issuing equity always lowers the share price.', 'Because the interest tax shield would increase.', 'Because buying back debt is a negative-NPV transaction for the firm.']::text[]),
  ('fvcs', '4', 'MC', 'An owner-manager can finance an expansion either by borrowing or by selling 20% of the firm to outside investors. If he sells equity, what fraction of the cost of any perks he consumes will he bear himself?', array['80%']::text[], array['20%', '100%', '0%']::text[]),
  ('fvcs', '4', 'MC', 'An owner-manager can finance an expansion either by borrowing or by selling 25% of the firm to outside investors. If he sells equity, what fraction of the cost of any perks he consumes will he bear himself?', array['75%']::text[], array['25%', '100%', '0%']::text[]),
  ('fvcs', '4', 'MC', 'An owner-manager can finance an expansion either by borrowing or by selling 30% of the firm to outside investors. If he sells equity, what fraction of the cost of any perks he consumes will he bear himself?', array['70%']::text[], array['30%', '100%', '0%']::text[]),
  ('fvcs', '4', 'MC', 'An owner-manager can finance an expansion either by borrowing or by selling 40% of the firm to outside investors. If he sells equity, what fraction of the cost of any perks he consumes will he bear himself?', array['60%']::text[], array['40%', '100%', '0%']::text[]),
  ('fvcs', '4', 'MC', 'An owner-manager can finance an expansion either by borrowing or by selling 45% of the firm to outside investors. If he sells equity, what fraction of the cost of any perks he consumes will he bear himself?', array['55%']::text[], array['45%', '100%', '0%']::text[]),
  ('fvcs', '5', 'T', 'Claims in one’s self-interest are credible only if they are supported by actions that would be too costly to take if the claims were untrue.', null, null),
  ('fvcs', '5', 'T', 'A firm can use leverage to signal that it will grow, even if it cannot provide verifiable details about the sources of growth.', null, null),
  ('fvcs', '5', 'T', 'The stock price tends to decline on the announcement of an equity issue.', null, null),
  ('fvcs', '5', 'T', 'The stock price tends to rise prior to the announcement of an equity issue.', null, null),
  ('fvcs', '5', 'T', 'Firms tend to issue equity when information asymmetries are minimized, such as immediately after earnings announcements.', null, null),
  ('fvcs', '5', 'T', 'Managers who perceive the firm’s equity to be underpriced prefer to fund investment with retained earnings or debt rather than equity.', null, null),
  ('fvcs', '5', 'T', 'According to the pecking order hypothesis, managers prefer to fund investments first with retained earnings, then with debt, and with equity only as a last resort.', null, null),
  ('fvcs', '5', 'T', 'The pecking order hypothesis does not provide a clear prediction regarding capital structure, because retained earnings are another form of equity financing.', null, null),
  ('fvcs', '5', 'T', 'According to the pecking order hypothesis, firms with high profitability will typically have low debt-to-equity ratios.', null, null),
  ('fvcs', '5', 'T', 'Mature, low-growth firms with stable cash flows and tangible assets often carry a high debt load.', null, null),
  ('fvcs', '5', 'T', 'Firms with high R&D costs and future growth opportunities typically maintain low debt levels.', null, null),
  ('fvcs', '5', 'T', 'Including agency effects, the value of the levered firm equals VU + PV(interest tax shield) − PV(financial distress costs) − PV(agency costs of debt) + PV(agency benefits of debt).', null, null),
  ('fvcs', '5', 'T', 'Due to the lemons problem, managers who know their firm’s prospects are good may be unwilling to sell new equity.', null, null),
  ('fvcs', '5', 'T', 'The optimal capital structure depends on market imperfections such as taxes, financial distress costs, agency costs and asymmetric information.', null, null),
  ('fvcs', '5', 'T', 'Adverse selection means that when buyers and sellers have different information, the average quality of assets in the market differs from the average quality overall.', null, null),
  ('fvcs', '5', 'F', 'The stock price tends to rise on the announcement of an equity issue.', null, null),
  ('fvcs', '5', 'F', 'According to the pecking order hypothesis, firms prefer issuing equity to issuing debt.', null, null),
  ('fvcs', '5', 'F', 'Under the pecking order hypothesis, a low debt-equity ratio unambiguously indicates low profitability.', null, null),
  ('fvcs', '5', 'F', 'Firms tend to issue equity when information asymmetry between managers and investors is greatest.', null, null),
  ('fvcs', '5', 'F', 'Adverse selection means that the average quality of assets offered for sale equals the average quality of all assets.', null, null),
  ('fvcs', '5', 'F', 'R&D-intensive young firms with risky strategies typically maintain high debt levels.', null, null),
  ('fvcs', '5', 'F', 'Managers can eliminate asymmetric information simply by announcing their expectations for future cash flows.', null, null),
  ('fvcs', '5', 'F', 'Leverage is a credible signal of good prospects only if the debt is so low that it could never cause financial distress.', null, null),
  ('fvcs', '5', 'F', 'Because of the lemons principle, new equity is typically the cheapest source of external funds.', null, null),
  ('fvcs', '5', 'F', 'The stock price tends to fall in the months prior to the announcement of an equity issue.', null, null),
  ('fvcs', '5', 'MC', 'What are the implications of adverse selection and the lemons principle for issuing equity?', array['Investors discount the price they are willing to pay, which makes issuing equity costly; the stock price falls when an issue is announced.']::text[], array['Issuing equity becomes cheaper, because investors compete for new shares.', 'They have no implications, because equity is fairly priced on average.', 'Firms with good prospects will issue more equity than firms with poor prospects.']::text[]),
  ('fvcs', '5', 'MC', 'According to the pecking order hypothesis, what debt-to-equity ratio do highly profitable firms typically have, and why?', array['Low, because they can use retained earnings to fund their investments.']::text[], array['High, because they can easily service debt.', 'High, because they want to exploit the interest tax shield.', 'Low, because their equity is typically overvalued.']::text[]),
  ('fvcs', '5', 'MC', 'What is the credibility principle?', array['Claims in one’s self-interest are credible only if supported by actions that would be too costly to take if the claims were untrue.']::text[], array['Investors believe management’s forecasts as long as they are audited.', 'Firms with credible managers can issue equity at no discount.', 'Debt is always a credible signal regardless of its amount.']::text[]),
  ('fvcs', '5', 'MC', 'Why do firms tend to issue equity immediately after earnings announcements?', array['Because information asymmetries between managers and investors are minimized at that time.']::text[], array['Because the stock price is typically lowest at that time.', 'Because interest rates tend to be highest at that time.', 'Because regulators require it.']::text[]),
  ('fvcs', '5', 'MC', 'Managers believe their equity is underpriced. Which source of financing will they prefer?', array['Retained earnings, then debt; equity only as a last resort.']::text[], array['Equity, then debt, then retained earnings.', 'Debt, then equity, then retained earnings.', 'They are indifferent between all sources.']::text[]),
  ('fvcs', '6', 'T', 'Angel investors are individual investors who buy equity in small private firms.', null, null),
  ('fvcs', '6', 'T', 'Venture capital firms typically charge around 20% of any positive return and an annual management fee of around 2%.', null, null),
  ('fvcs', '6', 'T', 'Private equity firms invest in the equity of existing privately held firms rather than start-ups, often through leveraged buyouts.', null, null),
  ('fvcs', '6', 'T', 'One key difference between private equity and venture capital is the magnitude invested.', null, null),
  ('fvcs', '6', 'T', 'Corporate investors may have strategic objectives in addition to financial returns.', null, null),
  ('fvcs', '6', 'T', 'The pre-money valuation is the value of the prior shares outstanding at the price of the funding round.', null, null),
  ('fvcs', '6', 'T', 'The post-money valuation is the value of the entire firm, old plus new shares, at the funding round price.', null, null),
  ('fvcs', '6', 'T', 'A SPAC is a shell company created solely for the purpose of finding a private target firm and taking it public by merging with it.', null, null),
  ('fvcs', '6', 'T', 'SPACs are not allowed to have a pre-identified target when they are formed.', null, null),
  ('fvcs', '6', 'T', 'SPAC investors have the right to redeem their shares and get their money back prior to the merger without giving up their warrants.', null, null),
  ('fvcs', '6', 'T', 'If a SPAC does not complete a merger before its deadline, typically 18 to 24 months, it is dissolved and the money is returned to investors.', null, null),
  ('fvcs', '6', 'T', 'A PIPE is a private investment in public equity, used by a SPAC to raise additional capital to complete the merger.', null, null),
  ('fvcs', '6', 'T', 'The SPAC process ordering is the same as that employed by venture capital and private equity funds, which raise capital from investors and then find firms to invest in.', null, null),
  ('fvcs', '6', 'T', 'The 20% promote given to a SPAC sponsor is analogous to the fees charged by private equity and venture capital funds.', null, null),
  ('fvcs', '6', 'T', 'If the share price of a SPAC near the closing date is above €10, it is not optimal for investors to redeem their shares.', null, null),
  ('fvcs', '6', 'T', 'For the target, the outcome of a SPAC merger is similar to an IPO, but without the rigorous listing requirements or the long IPO sales process.', null, null),
  ('fvcs', '6', 'T', 'With a SPAC merger, the target faces significant uncertainty about the amount of cash it will raise, because redemptions and warrant exercises are unknown when the deal is signed.', null, null),
  ('fvcs', '6', 'T', 'Institutional investors such as pension funds may invest in private companies directly or indirectly as limited partners in VC or PE funds.', null, null),
  ('fvcs', '6', 'F', 'A SPAC must identify its target firm before its IPO.', null, null),
  ('fvcs', '6', 'F', 'SPAC investors who redeem their shares prior to the merger must give up their warrants.', null, null),
  ('fvcs', '6', 'F', 'The SPAC promote is a cash fee paid by the target firm to the investment bank.', null, null),
  ('fvcs', '6', 'F', 'Venture capital firms typically charge a performance fee of around 2% and an annual management fee of around 20%.', null, null),
  ('fvcs', '6', 'F', 'The pre-money valuation includes the value of the new shares issued in the funding round.', null, null),
  ('fvcs', '6', 'F', 'A SPAC merger gives the target certainty about the amount of cash it will raise at the time the deal is signed.', null, null),
  ('fvcs', '6', 'F', 'Private equity firms mainly invest in early-stage start-ups.', null, null),
  ('fvcs', '6', 'F', 'Angel investors typically provide all the capital a start-up needs until its IPO.', null, null),
  ('fvcs', '6', 'F', 'In 2023, more than 60% of U.S. IPOs were SPACs.', null, null),
  ('fvcs', '6', 'F', 'Warrant holders will typically exercise their warrants when the share price is below the strike price.', null, null),
  ('fvcs', '6', 'F', 'The SPAC process resembles a traditional IPO process in that the sponsor first identifies the company and then assembles investors.', null, null),
  ('fvcs', '6', 'F', 'Venture capital firms are typically organized as corporations that invest only their own capital.', null, null),
  ('fvcs', '6', 'MC', 'What is the SPAC promote?', array['Shares equal to 20% of SPAC ownership that the sponsor receives (conditional on completing an acquisition) in exchange for organizing the SPAC and paying its operating costs.']::text[], array['A cash fee of 20% of the IPO proceeds paid to the underwriters.', 'Warrants given to IPO investors to compensate them for the blank-check risk.', 'The premium PIPE investors pay over the €10 unit price.']::text[]),
  ('fvcs', '6', 'MC', 'What is a PIPE in the context of a SPAC merger?', array['A private investment in public equity: additional shares sold privately to institutional investors to help finance the merger.']::text[], array['A public issue of preferred equity before the SPAC IPO.', 'The warrants issued to the SPAC sponsor.', 'The redemption right of SPAC shareholders.']::text[]),
  ('fvcs', '6', 'MC', 'On which dimensions can the success of a SPAC IPO be assessed?', array['Timing, fees, pricing and uncertainty.']::text[], array['Number of warrants, strike price, sponsor reputation and listing venue.', 'Only the first-day return.', 'Only the size of the PIPE.']::text[]),
  ('fvcs', '6', 'MC', 'Are SPACs more relevant than traditional IPOs?', array['It depends on the year: in 2021 more than 60% of U.S. IPOs were SPACs, whereas in 2023 only around 20% were.']::text[], array['Yes, in every year since 2020 the majority of IPOs were SPACs.', 'No, SPACs have never accounted for more than 10% of IPOs.', 'Yes, because SPACs are not allowed in traditional exchanges.']::text[]),
  ('fvcs', '6', 'MC', 'Which of the following is an exit strategy through which venture investors can realize the return on their investment?', array['An acquisition of the company', 'An initial public offering']::text[], array['A new round of convertible preferred stock', 'A down round at a lower valuation', 'An increase in the employee stock option pool']::text[]),
  ('fvcs', '6', 'MC', 'Why do SPAC investors typically not redeem their shares if the SPAC share price is well above €10 near the closing date?', array['Because redemption only returns €10 per share, less than the shares are worth in the market.']::text[], array['Because redemption would cancel their warrants.', 'Because redemptions are only allowed after the merger.', 'Because the sponsor’s promote would be lost.']::text[]);

delete from public.concept_items where subject_slug = 'fv';
insert into public.concept_items (subject_slug, topic, kind, text, correct, distractors) values
  ('fv', '1', 'T', 'Under the weak form of the efficient market hypothesis, prices reflect all information contained in past prices and trading volume, so technical analysis cannot earn abnormal returns.', null, null),
  ('fv', '1', 'T', 'Under the semi-strong form, prices reflect all publicly available information, so fundamental analysis of public data cannot earn persistent abnormal returns.', null, null),
  ('fv', '1', 'T', 'The strong form of market efficiency is contradicted by the evidence that insiders earn abnormal returns.', null, null),
  ('fv', '1', 'T', 'Event studies typically find that prices react quickly to new public information, which supports semi-strong efficiency.', null, null),
  ('fv', '1', 'T', 'Post-earnings-announcement drift is evidence against the semi-strong form of market efficiency.', null, null),
  ('fv', '1', 'T', 'Momentum is an anomaly that challenges the weak form of market efficiency.', null, null),
  ('fv', '1', 'T', 'Equity value equals firm value minus net debt.', null, null),
  ('fv', '1', 'T', 'Firm (enterprise) value is the value of the whole business, financed by both debt and equity.', null, null),
  ('fv', '1', 'T', 'Firm value can be split into the value of assets in place and the value of growth assets.', null, null),
  ('fv', '1', 'T', 'Debt is a fixed claim with tax-deductible interest and a fixed maturity; equity is a residual claim with no maturity.', null, null),
  ('fv', '1', 'T', 'In a DCF valuation the inputs rest on subjective forecasts, so the resulting value is uncertain.', null, null),
  ('fv', '1', 'T', 'In an event study, the abnormal return is the actual return minus the normal return predicted by a model such as the market model.', null, null),
  ('fv', '1', 'T', 'The cumulative abnormal return adds up the abnormal returns over the event window.', null, null),
  ('fv', '1', 'T', 'Higher liquidity is associated with more efficient prices (Chung and Hrazdil, 2010).', null, null),
  ('fv', '1', 'T', 'Chordia, Roll and Subrahmanyam (2005) find that NYSE prices converge to efficiency within roughly 5 to 60 minutes.', null, null),
  ('fv', '1', 'T', 'Many anomalies weaken once returns are adjusted for risk, trading frictions or data mining.', null, null),
  ('fv', '1', 'T', 'Passive strategies such as index funds tend to deliver strong risk-adjusted returns over the long run because active management rarely beats the market after costs.', null, null),
  ('fv', '1', 'T', 'Stocks with high idiosyncratic volatility have had low subsequent returns (Ang, Hodrick, Xing and Zhang, 2009).', null, null),
  ('fv', '1', 'F', 'Under the weak form of market efficiency, fundamental analysis of financial statements cannot earn abnormal returns, but technical analysis can.', null, null),
  ('fv', '1', 'F', 'The strong form of market efficiency holds in practice, because insider trading is never profitable.', null, null),
  ('fv', '1', 'F', 'Equity value equals firm value plus net debt.', null, null),
  ('fv', '1', 'F', 'Market capitalisation measures the value of the whole business, debt included.', null, null),
  ('fv', '1', 'F', 'If markets are semi-strong efficient, prices react to new public information only after several weeks.', null, null),
  ('fv', '1', 'F', 'Daily stock returns on the NYSE show strong positive autocorrelation, which allows simple trading rules to beat the market.', null, null),
  ('fv', '1', 'F', 'In an event study, the abnormal return is the stock return minus the risk-free rate.', null, null),
  ('fv', '1', 'F', 'Debt holders have a residual claim on the firm’s cash flows and strong influence over management.', null, null),
  ('fv', '1', 'F', 'The existence of anomalies proves that all markets are inefficient.', null, null),
  ('fv', '1', 'F', 'Moeller, Schlingemann and Stulz (2005) show that acquiring-firm shareholders gained on average from acquisitions in 1998–2001.', null, null),
  ('fv', '1', 'F', 'Lunar-phase effects in stock returns are fully explained by differences in volatility and trading volume.', null, null),
  ('fv', '1', 'MC', 'Which form of market efficiency implies that technical analysis cannot earn abnormal returns, but says nothing about fundamental analysis?', array['The weak form']::text[], array['The semi-strong form', 'The strong form', 'None of the forms']::text[]),
  ('fv', '1', 'MC', 'Which information is NOT assumed to be reflected in prices under the semi-strong form of market efficiency?', array['Private information held by insiders']::text[], array['Past prices and trading volume', 'Published financial statements', 'Announced dividends and mergers']::text[]),
  ('fv', '1', 'MC', 'What is the difference between firm value and equity value?', array['Firm value is the value of the whole business to all capital providers; equity value is what remains for shareholders after net debt.']::text[], array['Firm value is the book value of assets; equity value is the market capitalisation.', 'There is no difference when the firm has debt.', 'Equity value includes debt; firm value excludes it.']::text[]),
  ('fv', '1', 'MC', 'What are the main steps of an event study?', array['Define the event window, estimate normal returns with a model, compute abnormal and cumulative abnormal returns, and test them.']::text[], array['Regress the stock return on the risk-free rate and report the R².', 'Compare the share price one year before and after the event without a benchmark.', 'Compute the average market return in the event window.']::text[]),
  ('fv', '1', 'MC', 'What does post-earnings-announcement drift suggest?', array['Prices under-react to earnings news, contradicting semi-strong efficiency.']::text[], array['Prices over-react and reverse immediately, as weak-form efficiency predicts.', 'Insiders trade on private information, contradicting only the strong form.', 'Markets are fully efficient because the drift is predictable.']::text[]),
  ('fv', '1', 'MC', 'Why is it hard to beat the market consistently with DCF valuation if markets are efficient?', array['Prices already reflect publicly available information, and DCF inputs are subjective estimates.']::text[], array['DCF models ignore cash flows.', 'DCF values are always equal to book values.', 'Efficient markets do not use discount rates.']::text[]),
  ('fv', '2', 'T', 'The dividend discount model suits mature firms with a stable dividend policy.', null, null),
  ('fv', '2', 'T', 'The Gordon growth model requires the growth rate to be below the cost of equity.', null, null),
  ('fv', '2', 'T', 'Sustainable growth equals the retention ratio multiplied by the return on equity.', null, null),
  ('fv', '2', 'T', 'Retaining more earnings raises the share price only if the return on equity exceeds the cost of equity.', null, null),
  ('fv', '2', 'T', 'If ROE equals the cost of equity, changing the payout ratio does not change the share price.', null, null),
  ('fv', '2', 'T', 'The H-model assumes growth declines linearly from the high rate to the stable rate, with H equal to half the length of the transition period.', null, null),
  ('fv', '2', 'T', 'FCFF equals EBIT × (1 − t) plus depreciation, minus capital expenditure, minus the increase in net working capital.', null, null),
  ('fv', '2', 'T', 'FCFE is approximately FCFF minus after-tax interest plus net new borrowing.', null, null),
  ('fv', '2', 'T', 'FCFF is discounted at the WACC; FCFE is discounted at the cost of equity.', null, null),
  ('fv', '2', 'T', 'An FCFF valuation suits firms whose leverage is expected to change, because the WACC stays relatively stable while debt is repaid.', null, null),
  ('fv', '2', 'T', 'An FCFE valuation suits firms with a stable debt-equity ratio.', null, null),
  ('fv', '2', 'T', 'The long-run growth rate in the terminal value should not exceed the long-run growth rate of the economy, typically 2–4%.', null, null),
  ('fv', '2', 'T', 'Equity value equals firm value minus the market value of debt plus cash, minus preferred stock and minority interests where present.', null, null),
  ('fv', '2', 'T', 'Preferred stock paying a fixed dividend can be valued as a perpetuity: dividend divided by the required return.', null, null),
  ('fv', '2', 'T', 'The future reversal of a deferred tax liability is a cash outflow that reduces firm value.', null, null),
  ('fv', '2', 'T', 'The terminal value often accounts for more than 70% of a DCF firm value, so its assumptions deserve the most scrutiny.', null, null),
  ('fv', '2', 'T', 'High earnings volatility reduces the predictability of future earnings (Dichev and Tang, 2009).', null, null),
  ('fv', '2', 'F', 'The Gordon growth model can value a firm whose dividends grow faster than its cost of equity forever.', null, null),
  ('fv', '2', 'F', 'Retaining more earnings always increases the share price, because growth rises.', null, null),
  ('fv', '2', 'F', 'FCFE is discounted at the WACC.', null, null),
  ('fv', '2', 'F', 'FCFF is computed after interest payments to debt holders.', null, null),
  ('fv', '2', 'F', 'The dividend discount model is the best choice for firms that do not pay dividends, such as Tesla.', null, null),
  ('fv', '2', 'F', 'Depreciation is subtracted when moving from NOPAT to free cash flow.', null, null),
  ('fv', '2', 'F', 'An increase in net working capital increases free cash flow.', null, null),
  ('fv', '2', 'F', 'Terminal growth rates of 8–10% are appropriate for most mature firms.', null, null),
  ('fv', '2', 'F', 'Equity value equals firm value plus the market value of debt.', null, null),
  ('fv', '2', 'F', 'In the two-stage DDM the transition from high to stable growth is gradual.', null, null),
  ('fv', '2', 'F', 'Deferred tax liabilities can be ignored in a DCF because they never lead to cash payments.', null, null),
  ('fv', '2', 'MC', 'Which model fits a firm with high leverage that it plans to reduce over the coming years?', array['An FCFF model discounted at the WACC']::text[], array['An FCFE model discounted at the cost of equity', 'The Gordon growth model', 'A dividend discount model with constant payout']::text[]),
  ('fv', '2', 'MC', 'Which model fits a mature utility with a long record of stable dividends?', array['The dividend discount model']::text[], array['An FCFF model with a 10-year high-growth phase', 'The H-model with growth falling from 20%', 'No DCF model can value it']::text[]),
  ('fv', '2', 'MC', 'A firm earns an ROE of 8% while its cost of equity is 11%. It increases its retention ratio. What happens to its share price?', array['It falls, because reinvested earnings earn less than shareholders require.']::text[], array['It rises, because growth increases.', 'It stays the same, because value does not depend on payout.', 'It rises, because dividends fall.']::text[]),
  ('fv', '2', 'MC', 'What is the main weakness of the two-stage dividend discount model?', array['The abrupt drop from high to stable growth.']::text[], array['It cannot handle growth above the cost of equity in the first stage.', 'It ignores the terminal value.', 'It requires the firm to pay no dividends.']::text[]),
  ('fv', '2', 'MC', 'Why do DCF models use an explicit forecast period of 3–10 years followed by a terminal value?', array['Cash flows stabilise and forecasting further ahead adds little but uncertainty.']::text[], array['Accounting rules forbid forecasts beyond ten years.', 'The terminal value is always small, so it can be approximated.', 'Discount rates are undefined after ten years.']::text[]),
  ('fv', '2', 'MC', 'How do you get from firm value to the value of common equity?', array['Subtract the market value of debt, add cash, and subtract preferred stock and minority interests.']::text[], array['Add the market value of debt and subtract cash.', 'Multiply firm value by the debt-equity ratio.', 'Subtract the book value of total liabilities, including deferred revenue, and ignore cash.']::text[]),
  ('fv', '3', 'T', 'The geometric average growth rate is never higher than the arithmetic average of the same annual growth rates.', null, null),
  ('fv', '3', 'T', 'The geometric average (CAGR) only depends on the first and the last value of the series.', null, null),
  ('fv', '3', 'T', 'When past earnings are negative, a linear regression EPS = a + b × t with growth b / average EPS can replace year-on-year growth rates.', null, null),
  ('fv', '3', 'T', 'Earnings of firms with highly volatile earnings tend to revert to the mean, so their historical growth predicts future growth poorly.', null, null),
  ('fv', '3', 'T', 'Time-series models such as ARIMA work best for short horizons of up to about a quarter or a year.', null, null),
  ('fv', '3', 'T', 'Analyst forecasts use more information than historical growth, but their accuracy falls with the forecast horizon.', null, null),
  ('fv', '3', 'T', 'Analyst forecasts are less reliable for small, thinly covered or highly volatile firms.', null, null),
  ('fv', '3', 'T', 'All earnings growth comes from two sources: how much a firm reinvests and how well the reinvestment pays off.', null, null),
  ('fv', '3', 'T', 'The reinvestment rate equals net capital expenditure plus the change in working capital, divided by after-tax operating income.', null, null),
  ('fv', '3', 'T', 'Expected growth in operating income equals the reinvestment rate times the return on capital.', null, null),
  ('fv', '3', 'T', 'If the return on capital improves, growth also includes the efficiency gain (ROC_t − ROC_t−1) / ROC_t−1 on existing assets.', null, null),
  ('fv', '3', 'T', 'Expected growth in net income equals the retention ratio times the return on equity.', null, null),
  ('fv', '3', 'T', 'When the return on capital is negative, growth should be forecast through revenue growth and margin improvement.', null, null),
  ('fv', '3', 'T', 'Reinvestment needs fall as firms mature; negative reinvestment can signal a shrinking firm.', null, null),
  ('fv', '3', 'T', 'A return on capital above the cost of capital points to a competitive advantage; how long it lasts depends on how durable that advantage is.', null, null),
  ('fv', '3', 'T', 'Book values can distort the return on capital; R&D, operating leases and other intangibles may have to be capitalised.', null, null),
  ('fv', '3', 'T', 'Revenue growth rates tend to decline as a firm grows larger and its market matures.', null, null),
  ('fv', '3', 'F', 'The arithmetic average growth rate is always lower than the geometric average.', null, null),
  ('fv', '3', 'F', 'Year-on-year growth rates remain meaningful when earnings move from a loss to a profit.', null, null),
  ('fv', '3', 'F', 'Historical growth is a reliable predictor of future growth for firms with very volatile earnings.', null, null),
  ('fv', '3', 'F', 'Analyst forecasts become more accurate the further ahead they look.', null, null),
  ('fv', '3', 'F', 'Expected growth in operating income equals the payout ratio times the return on capital.', null, null),
  ('fv', '3', 'F', 'A firm can grow its operating income forever without reinvesting, as long as its return on capital is high.', null, null),
  ('fv', '3', 'F', 'The return on capital is calculated with the market value of equity in the denominator.', null, null),
  ('fv', '3', 'F', 'When the return on capital is negative, the best growth estimate is the reinvestment rate times the return on capital.', null, null),
  ('fv', '3', 'F', 'Reinvestment needs typically increase as a firm matures.', null, null),
  ('fv', '3', 'F', 'Goodwill from overpaying for acquisitions raises the return on capital.', null, null),
  ('fv', '3', 'MC', 'A firm reinvests 40% of its after-tax operating income at a return on capital of 12.5%. What growth in operating income do you expect?', array['5%']::text[], array['12.5%', '7.5%', '52.5%']::text[]),
  ('fv', '3', 'MC', 'Which approach suits a firm whose earnings were negative in several past years?', array['A linear trend regression of EPS on time, with growth b divided by average EPS']::text[], array['The geometric average of year-on-year growth rates', 'The arithmetic average of year-on-year growth rates', 'Retention ratio times return on equity from the loss years']::text[]),
  ('fv', '3', 'MC', 'What drives fundamental growth in operating income?', array['The reinvestment rate and the return on capital earned on new investment']::text[], array['The payout ratio and the cost of equity', 'Past share-price performance', 'The tax rate and the cost of debt']::text[]),
  ('fv', '3', 'MC', 'Which factors would you consider when forecasting a firm’s short-term growth rate?', array['Industry life cycle and competition, the business model and fundamentals (margins, reinvestment, return on capital), and analyst and management forecasts']::text[], array['Only last year’s growth rate, because markets are efficient', 'Only the long-run growth of the economy', 'The firm’s current share price and dividend yield only']::text[]),
  ('fv', '3', 'MC', 'Which inputs anchor the long-term (terminal) growth rate?', array['The long-term reinvestment rate and return on capital, the industry average, and the growth of the economy (often proxied by the risk-free rate)']::text[], array['The highest growth rate of the last five years', 'The analyst forecast for next year', 'The current return on equity of the firm, whatever its level']::text[]),
  ('fv', '3', 'MC', 'A loss-making start-up is expected to grow fast. How should you forecast its operating income?', array['Forecast revenues and a path for the operating margin towards a sustainable level']::text[], array['Multiply this year’s loss by one plus the historical growth rate', 'Use reinvestment rate × return on capital with the negative ROC', 'Assume operating income stays at this year’s level']::text[]),
  ('fv', '3', 'MC', 'When are analyst forecasts most useful as growth inputs?', array['When recent, high-quality information matters and uncertainty is high, for example in bad times']::text[], array['For horizons of ten years and more', 'For small firms with little analyst coverage', 'When they are older than the firm’s latest results']::text[]),
  ('fv', '4', 'T', 'Only systematic, non-diversifiable risk is rewarded with a higher expected return, because the marginal investor is diversified.', null, null),
  ('fv', '4', 'T', 'Equity cash flows are discounted at the cost of equity, cash flows to the firm at the WACC.', null, null),
  ('fv', '4', 'T', 'Cash flows and discount rates must be in the same currency and both nominal or both real.', null, null),
  ('fv', '4', 'T', 'The risk-free rate is best proxied by a long-term default-free government bond in the currency of the cash flows.', null, null),
  ('fv', '4', 'T', 'A historical equity risk premium depends on the period chosen, the risk-free proxy (bills or bonds) and the choice between arithmetic and geometric averages.', null, null),
  ('fv', '4', 'T', 'An implied equity risk premium is the discount rate that equates the index level with the PV of expected dividends and buybacks, minus the risk-free rate.', null, null),
  ('fv', '4', 'T', 'A regression of a stock’s excess returns on the market’s excess returns gives the levered (equity) beta at the leverage of the estimation period.', null, null),
  ('fv', '4', 'T', 'Regression betas have high standard errors and are backward-looking.', null, null),
  ('fv', '4', 'T', 'Firms with high operating leverage (high fixed costs) have higher unlevered betas.', null, null),
  ('fv', '4', 'T', 'Cyclical firms tend to have higher betas than non-cyclical firms.', null, null),
  ('fv', '4', 'T', 'A bottom-up beta is the value- or revenue-weighted average of the unlevered betas of the firm’s businesses, relevered at the firm’s own debt-to-equity ratio.', null, null),
  ('fv', '4', 'T', 'With taxes and a fixed amount of debt, the levered beta is βU[1 + (1 − t)D/E].', null, null),
  ('fv', '4', 'T', 'Leverage increases the equity beta because it concentrates business risk on fewer equity holders.', null, null),
  ('fv', '4', 'T', 'The cost of debt can be estimated from the yield on traded bonds, from a rating and its default spread, or from a synthetic rating based on interest coverage.', null, null),
  ('fv', '4', 'T', 'The after-tax cost of debt is the pre-tax cost of debt times (1 − t).', null, null),
  ('fv', '4', 'T', 'WACC weights should be based on market values, not book values.', null, null),
  ('fv', '4', 'T', 'Default spreads tend to widen in recessions.', null, null),
  ('fv', '4', 'F', 'Diversifiable risk is rewarded with a higher expected return because investors dislike all volatility.', null, null),
  ('fv', '4', 'F', 'Regression of a firm’s excess returns on the market’s excess returns gives the unlevered beta.', null, null),
  ('fv', '4', 'F', 'The higher the operating leverage, the lower the unlevered beta.', null, null),
  ('fv', '4', 'F', 'Cyclical companies should have lower betas than non-cyclical companies.', null, null),
  ('fv', '4', 'F', 'The best proxy for the risk-free rate in a long-term valuation is a short-term government bill yield.', null, null),
  ('fv', '4', 'F', 'Increasing the debt-to-equity ratio lowers the equity beta.', null, null),
  ('fv', '4', 'F', 'WACC weights should use book values because they are more stable.', null, null),
  ('fv', '4', 'F', 'Nominal cash flows can be discounted at a real discount rate as long as the currency matches.', null, null),
  ('fv', '4', 'F', 'Historical equity risk premiums are forward-looking and are updated with every market move.', null, null),
  ('fv', '4', 'F', 'An interest coverage ratio measures EBIT relative to total debt.', null, null),
  ('fv', '4', 'F', 'Assuming zero distress costs, more debt raises firm value because it lowers the beta of equity.', null, null),
  ('fv', '4', 'MC', 'What does a regression of a company’s excess returns on the market’s excess returns give you?', array['Its levered (equity) beta at its leverage during the estimation period']::text[], array['Its unlevered (asset) beta', 'Its cost of capital', 'Its default spread']::text[]),
  ('fv', '4', 'MC', 'Which firm should have the highest unlevered beta, all else equal?', array['A cyclical firm with high fixed costs']::text[], array['A non-cyclical firm with mostly variable costs', 'A utility with regulated prices', 'A firm with a lot of cash and no debt']::text[]),
  ('fv', '4', 'MC', 'An unrated firm has no traded bonds. How do you estimate its cost of debt?', array['Estimate a synthetic rating from its interest coverage ratio and add the matching default spread to the risk-free rate']::text[], array['Use its coupon rate on bank loans from ten years ago', 'Use the cost of equity', 'Divide interest expense by the book value of total liabilities']::text[]),
  ('fv', '4', 'MC', 'Why may a historical equity premium mislead?', array['It depends on the time period, the risk-free proxy and the averaging method, and has a large standard error']::text[], array['It is always negative', 'It ignores dividends', 'It changes every day with market prices']::text[]),
  ('fv', '4', 'MC', 'Assuming zero distress costs and corporate taxes, what does increasing the D/E ratio do?', array['It raises firm value through the larger present value of interest tax shields']::text[], array['It raises firm value by reducing the beta of equity', 'It leaves value unchanged', 'It lowers firm value because equity becomes riskier']::text[]),
  ('fv', '4', 'MC', 'Which weights belong in the WACC?', array['Market values of debt and equity, at the target capital structure']::text[], array['Book values from the latest balance sheet', 'Equal weights for debt and equity', 'The weights that minimise the WACC regardless of the firm’s plans']::text[]),
  ('fv', '4', 'MC', 'Which statement about a firm that keeps its debt-to-equity ratio constant is correct?', array['Its debt is rebalanced as value changes, so the tax shields are as risky as the assets and βL = βU(1 + D/E) with risk-free debt']::text[], array['Its tax shields are certain and discounted at the risk-free rate', 'Its equity beta equals its asset beta', 'Its WACC rises with every new debt issue']::text[]),
  ('fv', '5', 'T', 'Risk-free rates differ across currencies mainly because expected inflation differs.', null, null),
  ('fv', '5', 'T', 'A local-currency government bond yield includes a default spread when the government can default; subtract it to get the risk-free rate.', null, null),
  ('fv', '5', 'T', 'The default spread of a country can be estimated from dollar or euro bonds (yield minus US Treasury or German Bund yield), from CDS spreads, or from its sovereign rating.', null, null),
  ('fv', '5', 'T', 'A sovereign CDS spread is usually netted against the US CDS spread before it is used as a default spread.', null, null),
  ('fv', '5', 'T', 'Equity markets are riskier than bond markets, so a country’s equity risk premium can scale the default spread by σ_equity / σ_bond.', null, null),
  ('fv', '5', 'T', 'A country’s total equity risk premium can be estimated as the US premium times the ratio of the country’s equity volatility to US equity volatility.', null, null),
  ('fv', '5', 'T', 'In the additive approach the country risk premium is added to the cost of equity independently of beta.', null, null),
  ('fv', '5', 'T', 'In the integrated approach the country risk premium is scaled by beta together with the mature-market premium.', null, null),
  ('fv', '5', 'T', 'A lambda (λ) measures a firm’s exposure to country risk and can be estimated from the share of revenues it earns in the country.', null, null),
  ('fv', '5', 'T', 'In emerging markets, inputs change quickly and sensitivity analysis is especially important.', null, null),
  ('fv', '5', 'T', 'Valuing a firm in an emerging market requires a risk-free rate in the currency of the cash flows and a higher equity risk premium.', null, null),
  ('fv', '5', 'F', 'The yield on a local-currency government bond of an emerging market is always risk-free.', null, null),
  ('fv', '5', 'F', 'The country risk premium is the same for every firm in a country, whatever its revenue exposure.', null, null),
  ('fv', '5', 'F', 'A country’s default spread is the difference between its local-currency bond yield and the US Treasury yield.', null, null),
  ('fv', '5', 'F', 'Equity is less volatile than government bonds in emerging markets, so the country equity premium is below the default spread.', null, null),
  ('fv', '5', 'F', 'In the integrated approach the country risk premium is added without being multiplied by beta.', null, null),
  ('fv', '5', 'F', 'Once a firm is located in an emerging market, its cash flows can be discounted at a US dollar rate even if they are in local currency.', null, null),
  ('fv', '5', 'F', 'Negative interest rates make the discount rate meaningless, so valuation is impossible.', null, null),
  ('fv', '5', 'MC', 'The government of a country has local-currency bonds yielding 12% and euro bonds yielding 6%; German bonds yield 2%. What is the local risk-free rate?', array['8%']::text[], array['12%', '6%', '4%']::text[]),
  ('fv', '5', 'MC', 'Which approach lets firms in the same country carry different amounts of country risk?', array['Country risk as a separate factor with a firm-specific λ']::text[], array['The additive approach', 'Using the local bond yield as the risk-free rate', 'Ignoring country risk']::text[]),
  ('fv', '5', 'MC', 'What adjustments would you make if a firm you value operates in an emerging market instead of the euro area?', array['Use a risk-free rate in the cash flows’ currency net of default risk, add a country risk premium to the equity premium, and reconsider the beta’s exposure to country risk']::text[], array['Keep all euro inputs but lower the terminal growth rate', 'Only raise the tax rate', 'Use book values instead of market values']::text[]),
  ('fv', '5', 'MC', 'Why is the default spread multiplied by σ_equity / σ_bond when estimating a country’s equity risk premium?', array['Equities in the country are riskier than its government bonds, so equity investors require more than the bond default spread']::text[], array['To convert the spread into another currency', 'To remove the effect of inflation', 'Because bonds are riskier than equity']::text[]),
  ('fv', '5', 'MC', 'How can you estimate the default spread of a country without dollar bonds or CDS?', array['Use the typical spread of countries with the same sovereign rating']::text[], array['Set it to zero', 'Use the local inflation rate', 'Use the US equity risk premium']::text[]),
  ('fv', '6', 'T', 'Operating cash is tied to daily operations; excess cash is a nonoperating asset added to the value of operating assets.', null, null),
  ('fv', '6', 'T', 'The simplest way to treat cash is to value operating assets without it (cash flows before interest income, betas of operating assets) and add cash afterwards.', null, null),
  ('fv', '6', 'T', 'If cash is netted against debt, the cost of net debt is (k_d × gross debt − r_f × cash) / (gross debt − cash).', null, null),
  ('fv', '6', 'T', 'Cash in a firm that earns less than its cost of capital may be valued at less than its face value by the market.', null, null),
  ('fv', '6', 'T', 'Cash should only be discounted if managers are expected to misuse it, for example in overpriced acquisitions.', null, null),
  ('fv', '6', 'T', 'Minority holdings are not in consolidated cash flows, so their estimated market value is added to the value of operating assets.', null, null),
  ('fv', '6', 'T', 'For majority-owned subsidiaries, consolidated cash flows include 100% of the subsidiary, so the market value of minority interests is subtracted.', null, null),
  ('fv', '6', 'T', 'Minority interests reported at book value can be converted to market value with the sector price-to-book ratio.', null, null),
  ('fv', '6', 'T', 'Unutilised assets such as vacant land are added at market value; assets that already produce operating cash flows are not.', null, null),
  ('fv', '6', 'T', 'Goodwill is a plug, purchase price minus the fair value of net identifiable assets, not a separable asset.', null, null),
  ('fv', '6', 'T', 'Counting options as shares (fully diluted) overstates dilution because the cash received on exercise is ignored.', null, null),
  ('fv', '6', 'T', 'The treasury stock approach adds the exercise proceeds to equity but ignores the time value of the options.', null, null),
  ('fv', '6', 'T', 'The option-value approach subtracts the value of options from equity before dividing by the shares outstanding.', null, null),
  ('fv', '6', 'T', 'Expected future option grants should be treated as an operating expense that reduces margins and cash flows.', null, null),
  ('fv', '6', 'T', 'Contractual commitments such as long-term licensing obligations can be treated as debt by discounting them at the pre-tax cost of debt.', null, null),
  ('fv', '6', 'T', 'Sensitivity analysis changes one input at a time; scenario analysis combines inputs into best, base and worst cases; simulation draws inputs from distributions.', null, null),
  ('fv', '6', 'T', 'A Hold recommendation means the stock is expected to perform in line with the market.', null, null),
  ('fv', '6', 'F', 'Excess cash should always be valued at a discount because it earns a low return.', null, null),
  ('fv', '6', 'F', 'Minority holdings are already in consolidated cash flows, so they must not be added.', null, null),
  ('fv', '6', 'F', 'The market value of minority interests is added to equity value.', null, null),
  ('fv', '6', 'F', 'The fully diluted approach gives the most accurate value per share because it counts all options.', null, null),
  ('fv', '6', 'F', 'The treasury stock approach captures the time value of options.', null, null),
  ('fv', '6', 'F', 'Out-of-the-money options never affect the value per share.', null, null),
  ('fv', '6', 'F', 'Goodwill is an asset that should always be added to equity value.', null, null),
  ('fv', '6', 'F', 'Cash earning the risk-free rate makes the cost of net debt lower than the cost of gross debt.', null, null),
  ('fv', '6', 'F', 'Factories and other operating assets should be added to the DCF value at their market value.', null, null),
  ('fv', '6', 'F', 'Treating Netflix’s content commitments as debt makes it look less levered.', null, null),
  ('fv', '6', 'MC', 'A firm earns a return on capital of 5% with a cost of capital of 10%. How is its cash likely to be valued by the market?', array['As a wasting asset, worth less than face value']::text[], array['As a neutral asset, at face value', 'As a value creator, above face value', 'At zero, always']::text[]),
  ('fv', '6', 'MC', 'How should a 90%-owned, fully consolidated subsidiary enter the bridge from firm value to equity value?', array['Subtract the market value of the 10% minority interest']::text[], array['Add 90% of the subsidiary’s value', 'Add the minority interest at book value', 'Ignore it, consolidation already handles everything']::text[]),
  ('fv', '6', 'MC', 'Which approach to management options ignores the time value of the options?', array['The treasury stock approach']::text[], array['The option-value approach', 'Ignoring the options entirely', 'Black-Scholes valuation']::text[]),
  ('fv', '6', 'MC', 'How do you value a 25% minority (equity-method) holding carried at book value when no market price exists?', array['Multiply its book value by the sector price-to-book ratio (or the share of earnings by the sector P/E)']::text[], array['Use its book value unchanged', 'Use 25% of the parent’s market value', 'Ignore it']::text[]),
  ('fv', '6', 'MC', 'What does scenario analysis do?', array['It values the firm under a few internally consistent cases, such as best, base and worst']::text[], array['It changes one input at a time and holds the rest constant', 'It draws thousands of input combinations from probability distributions', 'It replaces the DCF with multiples']::text[]),
  ('fv', '6', 'MC', 'How should expected future option grants enter a valuation?', array['As an operating expense that lowers margins and cash flows each year']::text[], array['As additional debt', 'They should be ignored', 'As a reduction of the terminal growth rate only']::text[]),
  ('fv', '6', 'MC', 'How would you approach the valuation of a fast-growing private AI start-up such as OpenAI?', array['Forecast revenues and a path to sustainable margins, model heavy reinvestment, use scenarios or probabilities of failure, and adjust for the claims of different investor classes']::text[], array['Apply the current P/E of mature software firms to this year’s earnings', 'Use a dividend discount model with current dividends', 'Use book value of equity as the valuation']::text[]),
  ('fv', '7', 'T', 'Relative valuation values an asset from the market prices of comparable assets, scaled by a common variable such as earnings or EBITDA.', null, null),
  ('fv', '7', 'T', 'Equity multiples (P/E, P/BV) use an equity value in the numerator and an equity measure in the denominator; enterprise multiples (EV/EBITDA, EV/Sales) use firm measures.', null, null),
  ('fv', '7', 'T', 'Price to EBITDA is not a consistent multiple, because the numerator is equity value and EBITDA belongs to all capital providers.', null, null),
  ('fv', '7', 'T', 'EV/EBITDA is less affected by differences in leverage across firms than P/E.', null, null),
  ('fv', '7', 'T', 'From the Gordon model, the P/E equals payout × (1 + g) / (r − g), so P/E rises with growth and payout and falls with risk.', null, null),
  ('fv', '7', 'T', 'P/BV equals ROE × payout × (1 + g) / (r − g), so it also rises with the return on equity.', null, null),
  ('fv', '7', 'T', 'A company with a high ROE but a high cost of equity can have a low P/E and a high P/B.', null, null),
  ('fv', '7', 'T', 'The PEG ratio divides the P/E by expected EPS growth; around 1 is often read as fairly priced, but PEG still depends on risk and payout.', null, null),
  ('fv', '7', 'T', 'Distributions of multiples are skewed with large outliers, so the median is often more informative than the mean.', null, null),
  ('fv', '7', 'T', 'Forward P/E uses next year’s expected EPS; trailing P/E uses the last twelve months.', null, null),
  ('fv', '7', 'T', 'Multiples reflect market sentiment, so relative valuation inherits market mispricing of a whole sector.', null, null),
  ('fv', '7', 'T', 'For a growth company, intrinsic value can be above or below the relative value.', null, null),
  ('fv', '7', 'T', 'A very high forward P/E, such as 5,000, usually means earnings are close to zero rather than that the firm is overvalued 300 times.', null, null),
  ('fv', '7', 'T', 'Exit multiples applied to a terminal year must be discounted back to today and adjusted for cash and debt.', null, null),
  ('fv', '7', 'F', 'Price to EBITDA is a consistent multiple.', null, null),
  ('fv', '7', 'F', 'Enterprise value to free cash flow to equity is a consistent multiple.', null, null),
  ('fv', '7', 'F', 'A low P/E always means a stock is undervalued.', null, null),
  ('fv', '7', 'F', 'Higher risk leads to higher multiples, all else equal.', null, null),
  ('fv', '7', 'F', 'For growth companies, an intrinsic valuation is always lower than a relative valuation.', null, null),
  ('fv', '7', 'F', 'The best multiple is the one that gives the highest value.', null, null),
  ('fv', '7', 'F', 'P/E ratios of firms with negative earnings are informative and should be averaged with the others.', null, null),
  ('fv', '7', 'F', 'Relative valuation requires more explicit assumptions than a DCF.', null, null),
  ('fv', '7', 'F', 'EV/EBITDA is strongly distorted by differences in leverage across firms.', null, null),
  ('fv', '7', 'F', 'The mean is a better summary of a peer group’s P/E than the median when there are large outliers.', null, null),
  ('fv', '7', 'MC', 'Which of these is NOT a consistent (valid) multiple?', array['Price to EBITDA']::text[], array['Price to book value of equity', 'Enterprise value to EBIT', 'Price to free cash flow to equity']::text[]),
  ('fv', '7', 'MC', 'What kind of company has a low P/E but a high P/B?', array['A company with a high ROE but also a high cost of equity (or low growth)']::text[], array['A company with a low ROE and low risk', 'Any company with negative earnings', 'A company with high growth and low risk']::text[]),
  ('fv', '7', 'MC', 'Which multiple is the most appropriate in a valuation?', array['The one that gives a value closest to intrinsic (fair) value given the firm’s fundamentals']::text[], array['The one that gives the lowest value', 'The one that gives the highest value', 'The one that reproduces the current share price']::text[]),
  ('fv', '7', 'MC', 'Why might the forward P/E of a young, loss-making food company be 5,000 while an established peer trades at 12.7?', array['Its expected earnings are barely positive, so the P/E explodes; it says little about value and growth-based methods are needed']::text[], array['Investors expect it to pay huge dividends next year', 'Its cost of equity is far below its peer’s', 'Its book value is negative, which raises the P/E']::text[]),
  ('fv', '7', 'MC', 'How should you value a young firm with negative earnings and EBITDA, such as a plant-based meat start-up?', array['Use a DCF built on revenue growth and a path to target margins (or revenue multiples), not P/E or dividends']::text[], array['Average its P/E with that of mature peers', 'Use a dividend discount model with current dividends', 'Use book value of equity, since it is negative']::text[]),
  ('fv', '7', 'MC', 'Oil companies trade at five times forward earnings, half their level a decade ago, while oil prices are similar. Which explanation is consistent with valuation theory?', array['Investors expect the energy transition to shorten the life of their cash flows and lower long-run returns, so growth expectations fall and required returns rise']::text[], array['Oil companies have become less risky, so their multiples fall', 'Their earnings are expected to grow faster than before', 'Low interest rates reduce the value of future cash flows']::text[]),
  ('fv', '7', 'MC', 'Which statement about the PEG ratio is correct?', array['It divides the P/E by expected growth and still depends on risk and payout, so equal PEGs do not mean equal value']::text[], array['A PEG below 1 always means a stock is undervalued', 'It does not depend on the growth estimate', 'It uses enterprise value in the numerator']::text[]);

delete from public.concept_items where subject_slug = 'fi';
insert into public.concept_items (subject_slug, topic, kind, text, correct, distractors) values
  ('fi', '1', 'T', 'The CAPM implies that for a mean-variance investor the market should be the optimal risky portfolio in equilibrium.', null, null),
  ('fi', '1', 'T', 'In a CAPM equilibrium, the risk premium of any security depends only on its covariance with the market portfolio.', null, null),
  ('fi', '1', 'T', 'In a CAPM world all investors hold the same portfolio of risky assets, which must therefore be the market portfolio.', null, null),
  ('fi', '1', 'T', 'The market risk premium equals the average coefficient of risk aversion times the variance of the market portfolio.', null, null),
  ('fi', '1', 'T', 'In the CAPM, the beta of a portfolio is the weighted average of the betas of its components.', null, null),
  ('fi', '1', 'T', 'A stock that lies above the SML has a positive alpha and is underpriced.', null, null),
  ('fi', '1', 'T', 'The CML contains the efficient portfolios; the SML contains all correctly priced securities and portfolios, efficient or not.', null, null),
  ('fi', '1', 'T', 'In a CAPM world, the slope of the CAL spanned by a stock equals the Sharpe ratio of the market times the stock’s correlation with the market.', null, null),
  ('fi', '1', 'T', 'Betas can be negative; an asset with a negative beta should earn less than the risk-free rate in the CAPM.', null, null),
  ('fi', '1', 'T', 'The single-index model does not assume that alphas are zero; it is mainly a simplified model of the covariance matrix.', null, null),
  ('fi', '1', 'T', 'Under the single-index model, the covariance between two stocks equals the product of their betas times the variance of the market.', null, null),
  ('fi', '1', 'T', 'The single-index model needs far fewer parameters than full Markowitz optimisation.', null, null),
  ('fi', '1', 'T', 'Roll’s critique states that the true market portfolio is not observable, so tests can only reject the efficiency of a proxy.', null, null),
  ('fi', '1', 'T', 'With borrowing restrictions, the zero-beta CAPM of Black (1972) prices assets relative to the market and its zero-beta companion portfolio.', null, null),
  ('fi', '1', 'T', 'Leverage constraints can explain positive alphas on low-beta stocks and negative alphas on high-beta stocks.', null, null),
  ('fi', '1', 'T', 'In the consumption CAPM, assets that pay more in recessions are worth more and earn lower risk premiums.', null, null),
  ('fi', '1', 'T', 'The ICAPM adds hedging portfolios for extra-market risks such as changes in the risk-free rate or inflation.', null, null),
  ('fi', '1', 'T', 'Empirically, beta has a weak relation with average returns (Black, Jensen and Scholes, 1972; Frazzini and Pedersen, 2014).', null, null),
  ('fi', '1', 'T', 'The cost of capital of a project should reflect the beta of the project, not that of the company undertaking it.', null, null),
  ('fi', '1', 'F', 'In a CAPM world, a portfolio with a beta of 1 can have a higher Sharpe ratio than the market.', null, null),
  ('fi', '1', 'F', 'In the CAPM, a stock with a higher volatility must have a higher expected return.', null, null),
  ('fi', '1', 'F', 'The CAPM requires the single-index model assumption that residuals are uncorrelated across stocks.', null, null),
  ('fi', '1', 'F', 'The CAPM equilibrium allows individual stocks to have non-zero alphas.', null, null),
  ('fi', '1', 'F', 'In a CAPM world, a stock with a higher ROE should have a higher expected return.', null, null),
  ('fi', '1', 'F', 'The risk-free asset is in positive net supply in the CAPM.', null, null),
  ('fi', '1', 'F', 'In a CAPM equilibrium, investors with different risk aversion hold different portfolios of risky assets.', null, null),
  ('fi', '1', 'F', 'The market risk premium is independent of investors’ risk aversion.', null, null),
  ('fi', '1', 'F', 'The consumption CAPM is easy to test because consumption is measured accurately and frequently.', null, null),
  ('fi', '1', 'F', 'An overpriced stock lies above the SML.', null, null),
  ('fi', '1', 'F', 'Empirical tests strongly confirm that beta alone explains the cross-section of average returns.', null, null),
  ('fi', '1', 'MC', 'In a CAPM world, (E[r_A] − r_f)/cov(r_A, r_M) is higher than (E[r_B] − r_f)/cov(r_B, r_M). What should happen?', array['All investors will invest more in A and less in B until the ratios are equal.']::text[], array['Some investors will invest more in A and less in B.', 'All investors will invest more in B and less in A.', 'Nothing, because only total volatility matters.']::text[]),
  ('fi', '1', 'MC', 'What is the main difference between the CAPM and the single-index model?', array['The CAPM is an equilibrium model in which alphas are zero; the single-index model is a statistical model of covariances that allows mispricing.']::text[], array['The single-index model is an equilibrium model; the CAPM is purely statistical.', 'They are identical; both assume residuals are uncorrelated.', 'The CAPM uses several factors; the single-index model uses one.']::text[]),
  ('fi', '1', 'MC', 'A portfolio with a beta of 1 has an expected return higher than the market. What is true?', array['It is underpriced: it has a positive alpha.']::text[], array['It is overpriced.', 'It must have a lower Sharpe ratio than the market.', 'It lies on the SML.']::text[]),
  ('fi', '1', 'MC', 'What does Roll’s critique (1977) imply for tests of the CAPM?', array['Because the true market portfolio is unobservable, tests can only reject the mean-variance efficiency of a proxy such as the S&P 500.']::text[], array['The CAPM is proven false by any test using the S&P 500.', 'Betas cannot be estimated with monthly data.', 'The risk-free rate is unobservable, so the SML has no intercept.']::text[]),
  ('fi', '1', 'MC', 'Why might the SML be flatter than the CAPM predicts?', array['Investors who cannot borrow buy high-beta stocks for their embedded leverage, bidding up their prices (Black, 1972; Frazzini and Pedersen).']::text[], array['Because high-beta stocks have lower idiosyncratic risk.', 'Because the risk-free rate is too low.', 'Because investors are risk-seeking.']::text[]),
  ('fi', '1', 'MC', 'Which assumption is NOT part of the CAPM?', array['Residuals of different stocks are uncorrelated.']::text[], array['Investors are mean-variance optimisers over one period.', 'All investors use the same input list.', 'Investors can borrow and lend at the same risk-free rate.']::text[]),
  ('fi', '2', 'T', 'The APT rests on three ideas: returns follow a factor model, idiosyncratic risk can be diversified away, and arbitrage opportunities do not persist.', null, null),
  ('fi', '2', 'T', 'An arbitrage opportunity is a zero-investment portfolio that earns a riskless profit.', null, null),
  ('fi', '2', 'T', 'The APT applies to well-diversified portfolios, not necessarily to individual stocks.', null, null),
  ('fi', '2', 'T', 'Any two well-diversified portfolios in a one-factor world are perfectly correlated.', null, null),
  ('fi', '2', 'T', 'In the APT, a few investors trading large amounts are enough to eliminate mispricing.', null, null),
  ('fi', '2', 'T', 'In a one-factor world, the APT is a limiting case of the Treynor-Black model when residual risk goes to zero.', null, null),
  ('fi', '2', 'T', 'The APT does not identify which factors are priced.', null, null),
  ('fi', '2', 'T', 'Weak-form efficiency implies that technical analysis has no merit.', null, null),
  ('fi', '2', 'T', 'Momentum and long-term reversal are apparent violations of weak-form efficiency.', null, null),
  ('fi', '2', 'T', 'The post-earnings-announcement drift documented by Ball and Brown (1968) is an apparent violation of semi-strong efficiency.', null, null),
  ('fi', '2', 'T', 'Insiders can trade profitably on their own stock, which contradicts strong-form efficiency.', null, null),
  ('fi', '2', 'T', 'The joint hypothesis problem means that abnormal returns relative to a model do not by themselves reject market efficiency.', null, null),
  ('fi', '2', 'T', 'Grossman and Stiglitz (1980) argue that perfectly efficient markets are a logical contradiction because nobody would pay to gather information.', null, null),
  ('fi', '2', 'T', 'Return predictors are on average 32% weaker after discovery and 58% weaker after publication (McLean and Pontiff, 2015).', null, null),
  ('fi', '2', 'T', 'Momentum and short-term reversal have high turnover and are hard to exploit after trading costs.', null, null),
  ('fi', '2', 'T', 'Book-to-market has low turnover and remains profitable after trading costs.', null, null),
  ('fi', '2', 'T', 'Analyst buy/hold/sell recommendations are poor predictors of returns, but revisions move prices.', null, null),
  ('fi', '2', 'T', 'Dividend ratios, earnings yields and bond spreads have been used to predict aggregate market returns.', null, null),
  ('fi', '2', 'T', 'Even in an efficient market, portfolio management matters for diversification, choosing the risk level and taxes.', null, null),
  ('fi', '2', 'F', 'The APT requires that the market portfolio is the tangency portfolio.', null, null),
  ('fi', '2', 'F', 'The APT requires that all investors are mean-variance optimisers.', null, null),
  ('fi', '2', 'F', 'A well-diversified portfolio with a positive alpha is consistent with the APT.', null, null),
  ('fi', '2', 'F', 'Weak-form efficiency implies that fundamental analysis cannot earn abnormal returns.', null, null),
  ('fi', '2', 'F', 'The size premium is a predictor of aggregate market returns.', null, null),
  ('fi', '2', 'F', 'Momentum is easy to exploit after trading costs because it has low turnover.', null, null),
  ('fi', '2', 'F', 'Mutual fund alphas show strong persistence, so investors should chase past winners.', null, null),
  ('fi', '2', 'F', 'Shiller and Campbell find that stock prices are too stable relative to dividend news.', null, null),
  ('fi', '2', 'F', 'The existence of behavioural biases is incompatible with market efficiency in every case.', null, null),
  ('fi', '2', 'F', 'Limits to arbitrage make mispricing easier to eliminate.', null, null),
  ('fi', '2', 'F', 'Goyal and Welch (2008) find strong real-time predictability of the equity premium.', null, null),
  ('fi', '2', 'MC', 'What are the main implications of the EMH for asset management?', array['Investors should not try to outsmart the market and should prefer low-fee passive funds (or smart-beta funds for other risk dimensions), focusing on risk level, diversification and taxes.']::text[], array['Investors should trade frequently to exploit predictable price patterns.', 'Only fundamental analysis of public data can beat the market.', 'Active managers should hold concentrated portfolios of past winners.']::text[]),
  ('fi', '2', 'MC', 'What is meant by an “efficiently inefficient” market (Pedersen)?', array['Markets are inefficient just enough to compensate professional investors for their costs and risks; too much capital would eliminate the profits.']::text[], array['Markets are fully efficient but prices are noisy.', 'Markets are completely inefficient, so beating them is easy.', 'Only inefficient markets need regulation.']::text[]),
  ('fi', '2', 'MC', 'What is the joint hypothesis problem?', array['A test of market efficiency is also a test of the asset pricing model, so abnormal returns may reflect a wrong model rather than inefficiency.']::text[], array['Two anomalies cannot be tested together.', 'Weak and semi-strong efficiency cannot hold at the same time.', 'Arbitrage requires two securities with the same payoff.']::text[]),
  ('fi', '2', 'MC', 'How do you exploit a well-diversified portfolio with a positive alpha in a one-factor APT world?', array['Buy it and short a mimicking portfolio with the same factor beta; the position earns the alpha without risk.']::text[], array['Short it and buy the market.', 'Buy it and the market in equal amounts.', 'There is nothing to exploit if it is well diversified.']::text[]),
  ('fi', '2', 'MC', 'Which is an example of a limit to arbitrage?', array['Short-sale constraints and short squeezes, as in the GameStop episode.']::text[], array['Low trading costs.', 'High liquidity of large caps.', 'The law of one price.']::text[]),
  ('fi', '3', 'T', 'The dollar-weighted return is the internal rate of return of the investor’s cash flows.', null, null),
  ('fi', '3', 'T', 'The dollar-weighted return is below the time-weighted return when more money is invested in periods with lower returns.', null, null),
  ('fi', '3', 'T', 'Friesen and Sapp (2007) find a performance gap of about 1.56% per year for mutual fund investors because of poor timing.', null, null),
  ('fi', '3', 'T', 'If a portfolio is the investor’s entire risky portfolio, the Sharpe ratio is the right performance measure.', null, null),
  ('fi', '3', 'T', 'If a portfolio is one of many sub-portfolios, the Treynor ratio is the appropriate measure.', null, null),
  ('fi', '3', 'T', 'If a fund is the investor’s only active portfolio combined with an index, the information ratio is the right measure.', null, null),
  ('fi', '3', 'T', 'M² compares the return of the portfolio, levered or delevered to the market’s volatility, with the market return.', null, null),
  ('fi', '3', 'T', 'Taking a time-varying level of risk with a constant conditional Sharpe ratio generally damages measured investment performance.', null, null),
  ('fi', '3', 'T', 'The MRAR is a manipulation-proof performance measure; the Sharpe ratio is not.', null, null),
  ('fi', '3', 'T', 'A skilled manager may need decades of data before her alpha becomes statistically significant.', null, null),
  ('fi', '3', 'T', 'A positive alpha means the test asset can be combined with the factors to increase the maximum Sharpe ratio (Gibbons, Ross and Shanken).', null, null),
  ('fi', '3', 'T', 'In performance attribution, asset allocation contributes Σ (w_P − w_B) r_B and security selection Σ w_P (r_P − r_B).', null, null),
  ('fi', '3', 'T', 'The Treynor-Mazuy and Henriksson-Merton regressions test for market-timing ability.', null, null),
  ('fi', '3', 'T', 'A perfect market timer’s return resembles a free call option on the market.', null, null),
  ('fi', '3', 'T', 'In style analysis, regression weights on asset-class indices are restricted to be non-negative and to sum to one.', null, null),
  ('fi', '3', 'F', 'The Treynor ratio divides expected downside risk by a measure of investor skill and sophistication.', null, null),
  ('fi', '3', 'F', 'Time-weighted returns weight each period by the amount of capital invested.', null, null),
  ('fi', '3', 'F', 'The Sharpe ratio cannot be manipulated by changing leverage over time.', null, null),
  ('fi', '3', 'F', 'The information ratio divides alpha by the total standard deviation of the portfolio.', null, null),
  ('fi', '3', 'F', 'If a fund is one of many sub-portfolios, the Sharpe ratio is the right measure.', null, null),
  ('fi', '3', 'F', 'Three years of monthly data are usually enough to establish that a manager has skill.', null, null),
  ('fi', '3', 'F', 'Sharpe (1992) finds that mutual funds systematically outperform their style benchmarks.', null, null),
  ('fi', '3', 'F', 'A bogey portfolio is the actively managed portfolio being evaluated.', null, null),
  ('fi', '3', 'F', 'Jensen’s alpha can only be computed with the CAPM, never with multifactor models.', null, null),
  ('fi', '3', 'MC', 'What is a manipulation-proof performance measure?', array['A measure that cannot be gamed by changing risk over time without skill, such as the MRAR.']::text[], array['A measure audited by a regulator, such as the Sharpe ratio.', 'A measure that ignores volatility, such as the average return.', 'A measure computed with dollar-weighted returns.']::text[]),
  ('fi', '3', 'MC', 'What is a bogey portfolio?', array['A passive benchmark invested in the same asset classes as the managed portfolio with neutral weights and index returns.']::text[], array['The portfolio with the highest past return in the peer group.', 'The minimum-variance portfolio.', 'A portfolio of the manager’s worst positions.']::text[]),
  ('fi', '3', 'MC', 'Which measure should you use to pick a single active fund to combine with a passive index?', array['The information ratio']::text[], array['The Sharpe ratio', 'The Treynor ratio', 'The average return']::text[]),
  ('fi', '3', 'MC', 'Why is the dollar-weighted return of mutual fund investors often below the fund’s time-weighted return?', array['Investors put in more money before periods of low returns and withdraw before high returns.']::text[], array['Management fees are deducted twice.', 'Dollar-weighted returns ignore dividends.', 'Time-weighted returns include survivorship bias.']::text[]),
  ('fi', '3', 'MC', 'What would the characteristic line of a successful market timer look like?', array['Convex: a steeper slope when the market rises than when it falls.']::text[], array['Concave: a steeper slope when the market falls.', 'Perfectly linear with a slope of one.', 'Flat at the risk-free rate.']::text[]),
  ('fi', '4', 'T', 'In the Treynor-Black model, each stock’s weight in the active portfolio is proportional to its alpha divided by its residual variance.', null, null),
  ('fi', '4', 'T', 'In the Treynor-Black model, the squared Sharpe ratio of the optimal portfolio equals the squared Sharpe ratio of the market plus the squared information ratio of the active portfolio.', null, null),
  ('fi', '4', 'T', 'The straightforward application of the Treynor-Black model often results in extreme weights and portfolios with too much specific risk.', null, null),
  ('fi', '4', 'T', 'Kane, Kim and White find that analyst alpha forecasts have very low accuracy, so alphas should be shrunk by their R².', null, null),
  ('fi', '4', 'T', 'Benchmark risk is the standard deviation of the tracking error between the portfolio and the benchmark.', null, null),
  ('fi', '4', 'T', 'Limiting benchmark risk reduces efficiency if the inputs are correct but can help when they are not.', null, null),
  ('fi', '4', 'T', 'The Black-Litterman model combines a market-equilibrium prior with the manager’s views.', null, null),
  ('fi', '4', 'T', 'In Black-Litterman, the baseline expected returns are those that make observed market weights optimal given the covariance matrix.', null, null),
  ('fi', '4', 'T', 'In Black-Litterman, a high standard deviation of a view means low confidence, and the portfolio stays close to market weights.', null, null),
  ('fi', '4', 'T', 'A Black-Litterman portfolio performs worst when the manager’s views are wrong and confidence is high.', null, null),
  ('fi', '4', 'T', 'The Black-Litterman model is a generalisation of Treynor-Black that allows views on relative performance.', null, null),
  ('fi', '4', 'T', 'The fee a mean-variance investor would pay for active management rises with the number of stocks covered and the squared information ratio.', null, null),
  ('fi', '4', 'T', 'Black-Litterman is better suited to asset allocation; Treynor-Black to security analysis.', null, null),
  ('fi', '4', 'F', 'The Black-Litterman model estimates the covariance matrix of returns from market-implied equilibrium forecasts.', null, null),
  ('fi', '4', 'F', 'In the Treynor-Black model, weights are proportional to alpha divided by total variance.', null, null),
  ('fi', '4', 'F', 'Adjusting alpha forecasts for their precision makes Treynor-Black weights more extreme.', null, null),
  ('fi', '4', 'F', 'In Black-Litterman, a low standard deviation of the view means low confidence in it.', null, null),
  ('fi', '4', 'F', 'A Black-Litterman portfolio performs worst when no views are considered at all.', null, null),
  ('fi', '4', 'F', 'The value of active management is independent of the investor’s risk aversion.', null, null),
  ('fi', '4', 'F', 'Treynor-Black requires that every stock has a positive alpha.', null, null),
  ('fi', '4', 'MC', 'What are the most important steps of the Black-Litterman model?', array['Estimate the covariance matrix from history, infer market-implied baseline returns from market weights, specify views and their confidence, compute posterior expected returns, then optimise.']::text[], array['Estimate alphas for each stock, divide by residual variance and scale to one.', 'Regress fund returns on style indices with non-negative weights.', 'Equal-weight all assets and rebalance monthly.']::text[]),
  ('fi', '4', 'MC', 'Why does Treynor-Black often produce “wild” portfolio weights?', array['Because alpha forecasts are not adjusted for their low precision, so noise is treated as information.']::text[], array['Because it ignores alphas.', 'Because it uses the full covariance matrix.', 'Because it forces weights to be positive.']::text[]),
  ('fi', '4', 'MC', 'Under which conditions will a Black-Litterman portfolio perform worst?', array['The views are incorrect and confidence is high.']::text[], array['The views are correct and confidence is high.', 'The views are incorrect and confidence is low.', 'No views are considered.']::text[]),
  ('fi', '4', 'MC', 'State the assumptions of the single-index model used by Treynor-Black.', array['Returns are α + β·R_M + e, residuals are uncorrelated with the market and with each other, so cov(R_i, R_j) = β_i β_j σ²_M.']::text[], array['All alphas are zero and betas equal one.', 'Returns are normally distributed with equal variances.', 'Residuals are perfectly correlated across stocks.']::text[]),
  ('fi', '5', 'T', 'Michaud (1989) argues that Markowitz optimisation tends to overweight securities more likely to have estimation errors.', null, null),
  ('fi', '5', 'T', 'Jobson and Korkie (1980) find that estimated mean-variance weights are extremely noisy.', null, null),
  ('fi', '5', 'T', 'The imprecision of estimated optimal weights increases with the number of assets and with their correlation.', null, null),
  ('fi', '5', 'T', 'Small changes in inputs can cause large changes in Markowitz weights, which raises turnover and costs.', null, null),
  ('fi', '5', 'T', 'DeMiguel, Garlappi and Uppal (2009) find that no optimised strategy systematically beats the 1/N rule out of sample.', null, null),
  ('fi', '5', 'T', 'Shrinkage moves estimates towards a target, such as equal means, a structured covariance matrix or the 1/N portfolio.', null, null),
  ('fi', '5', 'T', 'Parametric portfolio policies model weights directly as functions of characteristics instead of estimating the return distribution.', null, null),
  ('fi', '5', 'T', 'Parametric portfolio policies reduce dimensionality, reduce estimation error and are computationally simple.', null, null),
  ('fi', '5', 'T', 'Out-of-sample tests use only data available at each point in time to form portfolios.', null, null),
  ('fi', '5', 'T', 'Barroso and Saxena (2021) use past out-of-sample errors to correct optimisation inputs (the Galton correction).', null, null),
  ('fi', '5', 'T', 'Estimates of variances regress less towards the mean than estimates of mean returns, which are mostly noise for individual stocks.', null, null),
  ('fi', '5', 'F', 'Markowitz optimisations tend to produce robust out-of-sample gains in efficiency.', null, null),
  ('fi', '5', 'F', 'Estimation error in Markowitz weights decreases with the number of assets.', null, null),
  ('fi', '5', 'F', 'Parametric portfolio policies require estimating the full covariance matrix of all assets.', null, null),
  ('fi', '5', 'F', 'DeMiguel, Garlappi and Uppal find that sample-based mean-variance portfolios clearly beat 1/N out of sample.', null, null),
  ('fi', '5', 'F', 'Historical sample estimates are unbiased forecasts of out-of-sample values for all inputs.', null, null),
  ('fi', '5', 'F', 'Michaud argues that optimisers underweight securities with extreme estimates.', null, null),
  ('fi', '5', 'MC', 'Briefly, what is the main idea of parametric portfolio policies, and what are their advantages?', array['Weights are modelled as functions of characteristics (size, value, momentum) chosen to maximise utility; this avoids estimating the covariance matrix, reduces dimensionality and estimation error, and is simple and robust.']::text[], array['Weights are set equal to market capitalisation; this minimises turnover.', 'Weights are proportional to alpha over residual variance; this maximises the Sharpe ratio.', 'Weights are chosen to minimise variance only; this ignores expected returns.']::text[]),
  ('fi', '5', 'MC', 'Why do Markowitz-optimised portfolios often disappoint out of sample?', array['Inputs are estimated with large errors and the optimiser amplifies them by overweighting extreme estimates.']::text[], array['Because the efficient frontier does not exist.', 'Because they ignore covariances.', 'Because they always hold the market portfolio.']::text[]),
  ('fi', '5', 'MC', 'What does shrinkage of portfolio weights do?', array['It moves the estimated weights towards a target such as 1/N, the market or the minimum-variance portfolio, trading a little bias for much less variance.']::text[], array['It removes all assets with negative alphas.', 'It increases leverage to raise expected returns.', 'It replaces the covariance matrix with the identity matrix only.']::text[]),
  ('fi', '6', 'T', 'Hedge funds are lightly regulated partnerships with flexible strategies, while mutual funds must disclose their strategy and holdings.', null, null),
  ('fi', '6', 'T', 'Hedge funds typically charge a management fee of 1–2% of assets plus an incentive fee of about 20% of profits.', null, null),
  ('fi', '6', 'T', 'An incentive fee is like a call option on the portfolio, which gives the manager an incentive to take risk.', null, null),
  ('fi', '6', 'T', 'In a fund of funds, investors can pay incentive fees even when the aggregate portfolio loses money.', null, null),
  ('fi', '6', 'T', 'A high-water mark means incentive fees are paid only when cumulative performance exceeds its previous peak.', null, null),
  ('fi', '6', 'T', 'High-water marks give funds with deep losses an incentive to close.', null, null),
  ('fi', '6', 'T', 'Hedge fund databases suffer from survivorship bias and backfill bias.', null, null),
  ('fi', '6', 'T', 'Exposure to an illiquidity premium is one of the possible explanations of the alpha of hedge funds.', null, null),
  ('fi', '6', 'T', 'Simple CAPM regressions tend to overestimate hedge fund alphas because they ignore exposure to lagged market returns.', null, null),
  ('fi', '6', 'T', 'Asness, Krail and Liew (2001) find that hedge funds’ true market exposure is much higher once lagged market returns are included.', null, null),
  ('fi', '6', 'T', 'The risk profile of hedge funds can shift rapidly and substantially, making performance evaluation challenging.', null, null),
  ('fi', '6', 'T', 'Non-linear characteristic lines suggest that hedge funds collectively behave like option writers, exposing them to tail risk.', null, null),
  ('fi', '6', 'T', 'The “Santa effect” is the December spike in reported hedge fund returns, stronger for less liquid funds.', null, null),
  ('fi', '6', 'T', 'A portable alpha strategy hedges market exposure with futures so the expected excess return isolates alpha.', null, null),
  ('fi', '6', 'T', 'Managers in the hedge fund industry may have some skill that allows them to achieve positive risk-adjusted returns.', null, null),
  ('fi', '6', 'T', 'Malkiel and Saha (2005) find that hedge fund performance shows little persistence.', null, null),
  ('fi', '6', 'F', 'Mutual funds usually charge higher fees than hedge funds.', null, null),
  ('fi', '6', 'F', 'Simple CAPM regressions tend to underestimate the alphas of hedge funds because they ignore exposure to lagged market returns.', null, null),
  ('fi', '6', 'F', 'Hedge fund databases have smaller survivorship bias than mutual fund databases.', null, null),
  ('fi', '6', 'F', 'Hedge funds must publicly disclose their portfolio composition, as mutual funds do.', null, null),
  ('fi', '6', 'F', 'Diversifying across many hedge funds always benefits the investor because incentive fees are charged on the aggregate.', null, null),
  ('fi', '6', 'F', 'Collectively, hedge funds show strong market-timing skill.', null, null),
  ('fi', '6', 'F', 'A portable alpha strategy eliminates both market risk and specific risk.', null, null),
  ('fi', '6', 'F', 'Aragon (2007) finds that hedge fund alphas stay significant after controlling for lock-up periods.', null, null),
  ('fi', '6', 'MC', 'What are the main challenges in measuring hedge fund performance?', array['Rapidly changing exposures, tail risks absent from the sample, omitted factors such as liquidity, survivorship and backfill bias, stale prices that understate betas, and possible manipulation (e.g. the Santa effect).']::text[], array['Hedge funds report too frequently, so returns are too noisy.', 'Hedge funds always hold the market, so alpha is zero by construction.', 'Only the high fees matter; risk adjustment is unnecessary.']::text[]),
  ('fi', '6', 'MC', 'Which statement comparing mutual funds and hedge funds is most likely true?', array['Hedge funds follow very flexible strategies, while mutual funds must publicly disclose their strategy and holdings.']::text[], array['Hedge funds follow stable strategies stated in a prospectus, while mutual funds use leverage and options.', 'Mutual funds have lock-up periods and require advance redemption notices.', 'Mutual funds are limited to 100 sophisticated investors.']::text[]),
  ('fi', '6', 'MC', 'What is a portable alpha strategy?', array['Holding a portfolio with alpha and selling index futures to remove its market exposure, so the return is the risk-free rate plus alpha plus specific risk.']::text[], array['Moving a fund to a lower-tax country.', 'Buying index futures to double market exposure.', 'Investing only in risk-free bonds.']::text[]),
  ('fi', '6', 'MC', 'What do Asness, Krail and Liew (2001) conclude?', array['Including lagged market returns (Scholes-Williams) raises hedge fund betas considerably and most alphas turn negative.']::text[], array['Hedge funds have negative betas on lagged market returns.', 'Hedge funds have higher alphas after correcting for stale prices.', 'Stale prices make hedge funds look riskier than they are.']::text[]),
  ('fi', '6', 'MC', 'What is the economic role of hedge funds in an efficiently inefficient market?', array['They make prices more informative, improve capital allocation and monitoring, provide liquidity and diversify investors’ returns.']::text[], array['They have no role because markets are fully efficient.', 'They only transfer wealth from investors to managers.', 'They stabilise prices by holding the market portfolio.']::text[]);

delete from public.concept_items where subject_slug = 'ifd';
insert into public.concept_items (subject_slug, topic, kind, text, correct, distractors) values
  ('ifd', '1', 'T', 'The total cost of an IPO to the original shareholders is the sum of the underpricing and the direct costs such as the underwriting spread.', null, null),
  ('ifd', '1', 'T', 'The underpricing cost of an IPO equals the number of new shares times the difference between the first-day price and the offer price.', null, null),
  ('ifd', '1', 'T', 'In a rights issue in which all rights are exercised or sold, the subscription price does not affect the wealth of existing shareholders.', null, null),
  ('ifd', '1', 'T', 'A lower subscription price in a rights issue means more new shares and a lower share price after the issue, for the same amount raised.', null, null),
  ('ifd', '1', 'T', 'The winner’s curse means that uninformed investors receive a larger allocation of the IPOs that perform badly and a smaller one of those that perform well.', null, null),
  ('ifd', '1', 'T', 'Because of the winner’s curse, the average first-day return overstates the return that uninformed investors actually earn from bidding in every IPO.', null, null),
  ('ifd', '1', 'T', 'IPO underpricing can be seen as compensation that keeps uninformed investors willing to participate.', null, null),
  ('ifd', '1', 'T', 'The underwriting spread is a direct cost of an equity issue, paid out of the gross proceeds.', null, null),
  ('ifd', '1', 'F', 'A rights issue with a deep discount to the market price transfers wealth from existing to new shareholders.', null, null),
  ('ifd', '1', 'F', 'The proceeds of an IPO are the number of new shares times the first-day closing price.', null, null),
  ('ifd', '1', 'F', 'IPO underpricing benefits the original shareholders because the share price rises on the first day.', null, null),
  ('ifd', '1', 'F', 'Uninformed investors who bid in every IPO earn the average first-day return.', null, null),
  ('ifd', '1', 'F', 'The direct costs of an IPO are usually much larger than the underpricing when the first-day return is high.', null, null),
  ('ifd', '1', 'F', 'After a rights issue the share price is unchanged, because the issue raises new money.', null, null),
  ('ifd', '1', 'MC', 'Why are shareholders indifferent between a one-for-five rights issue at a high price and a one-for-one issue at a low price that raise the same amount?', array['Every shareholder receives rights in proportion to her holding, so the lower price only shifts value between her old and new shares; total wealth is unchanged.']::text[], array['Because the share price after the issue is the same under both plans.', 'Because the underwriter guarantees the price.', 'Because new investors buy all the shares.']::text[]),
  ('ifd', '1', 'MC', 'What is the winner’s curse in IPOs?', array['Uninformed investors get full allocations in the IPOs informed investors avoid and are rationed in the good ones, so their expected return is far below the average first-day return.']::text[], array['The underwriter always wins the largest allocation.', 'Investors who win an auction pay less than the asset is worth.', 'Firms that go public always underperform afterwards.']::text[]),
  ('ifd', '1', 'MC', 'What makes up the cost of an IPO to the original shareholders?', array['Underpricing (new shares sold below their first-day value) plus direct costs such as the underwriting spread.']::text[], array['Only the underwriting spread.', 'Only the first-day price rise of the old shares.', 'The dividends paid to new shareholders.']::text[]),
  ('ifd', '2', 'T', 'If a project’s cash flows are uncorrelated with the market, its risky debt is priced by discounting the expected payoff at the risk-free rate.', null, null),
  ('ifd', '2', 'T', 'The yield of a one-year zero-coupon bond is its face value divided by its price, minus one.', null, null),
  ('ifd', '2', 'T', 'The default spread of a bond is its yield minus the risk-free rate.', null, null),
  ('ifd', '2', 'T', 'A higher default spread is associated with a lower credit rating.', null, null),
  ('ifd', '2', 'T', 'When a firm adds a project financed with subordinated debt, the senior bondholders can gain because they have a larger claim in the bad state.', null, null),
  ('ifd', '2', 'T', 'With fairly priced securities, no taxes and no bankruptcy costs, shareholders are equally well off issuing straight or convertible debt.', null, null),
  ('ifd', '2', 'T', 'Bankruptcy costs only reduce the share price if the security issued can actually default.', null, null),
  ('ifd', '2', 'T', 'Convertible bondholders convert when the value of the shares they receive exceeds the principal.', null, null),
  ('ifd', '2', 'T', 'With fairly priced debt in a perfect market, existing shareholders capture the whole NPV of a new project.', null, null),
  ('ifd', '2', 'F', 'The promised yield of a risky bond equals its expected return.', null, null),
  ('ifd', '2', 'F', 'Junior debt is repaid before senior debt in default.', null, null),
  ('ifd', '2', 'F', 'A convertible bond always gives shareholders a higher share price than straight debt in a perfect market.', null, null),
  ('ifd', '2', 'F', 'The face value of risky debt equals the amount raised times one plus the risk-free rate.', null, null),
  ('ifd', '2', 'F', 'Issuing convertible instead of straight debt changes the NPV of the project.', null, null),
  ('ifd', '2', 'F', 'Bankruptcy costs reduce the share price only if the firm issues convertible debt.', null, null),
  ('ifd', '2', 'MC', 'Why is a risky zero-coupon bond discounted at the risk-free rate when the project’s cash flows are uncorrelated with the market?', array['Its payoff then has a beta of zero, so investors require no risk premium; default risk lowers the expected payoff instead.']::text[], array['Because bonds are always risk-free.', 'Because the yield already includes the default spread.', 'Because the face value is certain.']::text[]),
  ('ifd', '2', 'MC', 'How does a new subordinated debt issue that funds a positive-NPV project affect the existing senior bonds?', array['Their value can rise and their rating improve, because the extra cash flow in the bad state goes to them first.']::text[], array['They lose value because the firm has more debt.', 'Nothing changes because they mature at the same time.', 'They become junior to the new debt.']::text[]),
  ('ifd', '2', 'MC', 'Why might bankruptcy costs affect the share price with straight debt but not with a convertible bond?', array['The straight debt defaults in the bad state, the convertible’s lower principal does not; costs only arise where default can happen.']::text[], array['Convertibles are exempt from bankruptcy law.', 'Straight debt is always junior to convertibles.', 'Bankruptcy costs are paid by bondholders only.']::text[]),
  ('ifd', '3', 'T', 'An entrepreneur financed with outside equity keeps only part of the gain from effort, so she exerts high effort for a smaller range of effort costs.', null, null),
  ('ifd', '3', 'T', 'Debt can give stronger effort incentives than outside equity because the entrepreneur keeps all the upside above the face value.', null, null),
  ('ifd', '3', 'T', 'Investors price securities on their beliefs about the entrepreneur’s effort, and the entrepreneur bears the cost if these beliefs are not met in equilibrium.', null, null),
  ('ifd', '3', 'T', 'With asymmetric information, good types find equity more underpriced than debt.', null, null),
  ('ifd', '3', 'T', 'Debt is less information-sensitive than equity, so it is less mispriced when investors cannot tell good firms from bad ones.', null, null),
  ('ifd', '3', 'T', 'In a pooling equilibrium both good and bad types issue debt, because issuing equity would reveal a bad type.', null, null),
  ('ifd', '3', 'T', 'The pecking order theory says firms use internal funds first, then debt, and equity last.', null, null),
  ('ifd', '3', 'T', 'With asymmetric information, the NPV of the financing transaction itself matters for the decision.', null, null),
  ('ifd', '3', 'F', 'Outside equity gives the entrepreneur the same effort incentives as using her own money.', null, null),
  ('ifd', '3', 'F', 'Bad types prefer to issue debt because debt is overpriced for them by more than equity.', null, null),
  ('ifd', '3', 'F', 'Under asymmetric information, a bad type can issue equity at the pooled price without revealing her type.', null, null),
  ('ifd', '3', 'F', 'The pecking order theory predicts that firms prefer issuing equity to debt.', null, null),
  ('ifd', '3', 'F', 'Good types prefer equity because it does not require repayment.', null, null),
  ('ifd', '3', 'F', 'If investors cannot observe effort, debt and equity always lead to the same effort choice.', null, null),
  ('ifd', '3', 'MC', 'Why can debt induce high effort when outside equity cannot?', array['With debt the entrepreneur keeps the whole cash flow above the face value, so she captures more of the gain from effort than with a fixed equity share.']::text[], array['Debt holders monitor effort directly.', 'Debt is cheaper because interest is tax deductible.', 'Equity investors forbid high effort.']::text[]),
  ('ifd', '3', 'MC', 'Which security does a good type prefer to issue when investors cannot tell types apart, and why?', array['Debt, because it is the least information-sensitive and therefore the least underpriced security for a good type.']::text[], array['Equity, because it has no fixed payments.', 'Equity, because it is overpriced for good types.', 'She is indifferent, because both are priced at the pooled value.']::text[]),
  ('ifd', '3', 'MC', 'What is the pecking order theory?', array['Firms finance first with internal funds, then debt, and only last with equity, because more information-sensitive securities are more underpriced.']::text[], array['Firms choose the debt ratio that trades off tax shields and distress costs.', 'Firms always issue equity after their share price has risen.', 'Firms keep a constant leverage ratio.']::text[]),
  ('ifd', '4', 'T', 'A project should be undertaken if the present value of its incremental cash flows is positive.', null, null),
  ('ifd', '4', 'T', 'Sunk costs, such as a completed feasibility study, are irrelevant for the investment decision.', null, null),
  ('ifd', '4', 'T', 'The value of an unused asset that a project would use is an opportunity cost of the project.', null, null),
  ('ifd', '4', 'T', 'Lost sales of an existing product caused by a new product are an incremental cash flow of the new project.', null, null),
  ('ifd', '4', 'T', 'Free cash flow is the cash flow a project would generate if it were all-equity financed.', null, null),
  ('ifd', '4', 'T', 'An increase in net working capital is a cash outflow.', null, null),
  ('ifd', '4', 'T', 'Interest payments and dividends do not enter the free cash flow.', null, null),
  ('ifd', '4', 'T', 'Depreciation is a non-cash expense, but it lowers taxes and so affects free cash flow.', null, null),
  ('ifd', '4', 'T', 'With a predetermined debt schedule, tax shields are discounted at the cost of debt.', null, null),
  ('ifd', '4', 'T', 'With a constant leverage ratio, tax shields are discounted at the unlevered cost of capital.', null, null),
  ('ifd', '4', 'T', 'A project should be discounted at a rate that reflects its own systematic risk, not the firm’s average risk.', null, null),
  ('ifd', '4', 'T', 'A high standard deviation of a project’s cash flows does not imply a high beta if the variability is diversifiable.', null, null),
  ('ifd', '4', 'F', 'A completed market study should be included as a cost when deciding whether to launch the product.', null, null),
  ('ifd', '4', 'F', 'Overhead costs allocated to a project are always incremental cash flows.', null, null),
  ('ifd', '4', 'F', 'Free cash flow is computed from net income, so interest expenses must be deducted.', null, null),
  ('ifd', '4', 'F', 'A decrease in net working capital is a cash outflow.', null, null),
  ('ifd', '4', 'F', 'A firm should discount all its projects at its own cost of equity.', null, null),
  ('ifd', '4', 'F', 'The WACC approach is more flexible than APV when the debt schedule is fixed in advance.', null, null),
  ('ifd', '4', 'F', 'Taxes in the free cash flow are computed on taxable income after interest.', null, null),
  ('ifd', '4', 'F', 'Higher operating leverage lowers a project’s beta.', null, null),
  ('ifd', '4', 'MC', 'Which of the following is relevant to the decision whether to undertake a project?', array['The value of a currently unused machine that the project would use.', 'Additional advertising expenses for the new product.', 'An increase in the sales of an existing product caused by the project.']::text[], array['The cost of a feasibility study completed last month.', 'The part of headquarters’ electricity costs allocated to the project.', 'Dividends paid to shareholders from the project’s profits.']::text[]),
  ('ifd', '4', 'MC', 'When should tax shields be discounted at the cost of debt, and when at the unlevered cost of capital?', array['At r_D when the debt schedule is known in advance; at r_U when debt is adjusted to keep a constant leverage ratio.']::text[], array['Always at r_D, because tax shields come from debt.', 'Always at r_U, because they come from the operations.', 'At the WACC in both cases.']::text[]),
  ('ifd', '4', 'MC', 'How do you find the discount rate for a project in a new line of business?', array['Unlever the equity beta of firms in that business (twin firms), relever it at the project’s capital structure and apply the CAPM.']::text[], array['Use the firm’s own equity beta.', 'Use the average beta of all firms in the market.', 'Use the project’s standard deviation instead of beta.']::text[]),
  ('ifd', '4', 'MC', 'What is free cash flow?', array['EBITDA − τ·EBIT − CapEx − ΔNWC (+ other cash items): the cash the project generates as if all-equity financed.']::text[], array['Net income plus depreciation.', 'EBITDA minus interest and dividends.', 'Revenue minus all expenses on the income statement.']::text[]);

delete from public.concept_items where subject_slug = 'fd';
insert into public.concept_items (subject_slug, topic, kind, text, correct, distractors) values
  ('fd', '1', 'T', 'A derivative is a security whose value derives from an underlying variable, often the price of a traded asset.', null, null),
  ('fd', '1', 'T', 'Hedging, speculation and arbitrage all use derivatives to take or remove an exposure to the underlying variable.', null, null),
  ('fd', '1', 'T', 'A call gives its holder the right, but not the obligation, to buy the underlying at the strike price.', null, null),
  ('fd', '1', 'T', 'The value of a European call on an asset without income is at least max(S − PV(X), 0).', null, null),
  ('fd', '1', 'T', 'A call can never be worth more than the underlying asset.', null, null),
  ('fd', '1', 'T', 'A European put on an asset without income is worth at most the present value of the strike.', null, null),
  ('fd', '1', 'T', 'An American call on an asset that pays no income is never exercised early, so it is worth the same as the European call.', null, null),
  ('fd', '1', 'T', 'An American put on an asset without income may be optimally exercised early when the share price is low enough.', null, null),
  ('fd', '1', 'T', 'Put-call parity for European options without income is c = p + S − PV(X).', null, null),
  ('fd', '1', 'T', 'The time value of a European put deep in the money can be negative.', null, null),
  ('fd', '1', 'T', 'Income paid by the underlying lowers the lower bound of a call and raises the lower bound of a put.', null, null),
  ('fd', '1', 'T', 'For American options without income, S − X ≤ C − P ≤ S − PV(X).', null, null),
  ('fd', '1', 'T', 'It can be optimal to exercise an American call just before the underlying pays a large dividend.', null, null),
  ('fd', '1', 'F', 'A forward contract gives its holder the right, but not the obligation, to buy the underlying.', null, null),
  ('fd', '1', 'F', 'The lower bound of a European call on an asset without income is max(S − X, 0) and cannot be tightened.', null, null),
  ('fd', '1', 'F', 'An American call on a share without dividends should be exercised as soon as it is deep in the money.', null, null),
  ('fd', '1', 'F', 'An American put is worth exactly the same as a European put when the share pays no dividends.', null, null),
  ('fd', '1', 'F', 'A European put can be worth more than its strike price.', null, null),
  ('fd', '1', 'F', 'Put-call parity holds exactly for American options.', null, null),
  ('fd', '1', 'F', 'The time value of an option can never be negative.', null, null),
  ('fd', '1', 'F', 'An exotic option such as a barrier option can always be replicated with forwards and plain-vanilla options.', null, null),
  ('fd', '1', 'MC', 'Why is an American call on a share without dividends never exercised early?', array['Its value is at least S − PV(X), which exceeds the S − X received on exercise: selling the call always beats exercising it.']::text[], array['Because the strike is paid at maturity anyway.', 'Because exercising early is not allowed for calls.', 'Because the share price is expected to rise.']::text[]),
  ('fd', '1', 'MC', 'When is it optimal to exercise an American put immediately?', array['When the interest on the exercise proceeds outweighs the remaining time value, e.g. when (X − S)e^(rT) exceeds X, the most the put can pay at maturity.']::text[], array['Whenever the put is in the money.', 'Never, as for an American call.', 'Only just before a dividend is paid.']::text[]),
  ('fd', '1', 'MC', 'A European call trades below S − PV(X). How do you exploit it?', array['Buy the call, short the share and invest PV(X): positive cash today and a non-negative payoff at maturity.']::text[], array['Sell the call and buy the share.', 'Buy the share and borrow PV(X).', 'Sell the call and the put.']::text[]),
  ('fd', '1', 'MC', 'What is the common feature of hedging, speculation and arbitrage with derivatives?', array['Each takes or offsets an exposure to the underlying variable through the derivative’s payoff.']::text[], array['All three are riskless.', 'All three require holding the underlying asset.', 'All three are only possible with options.']::text[]),
  ('fd', '1', 'MC', 'How does income on the underlying change put-call parity?', array['The present value D of the income is subtracted from the share price: c = p + S − PV(X) − D.']::text[], array['D is added to the strike: c = p + S − PV(X + D).', 'It does not change; income only matters for American options.', 'D is added to the share price.']::text[]),
  ('fd', '2', 'T', 'A bear spread with calls sells a call with a low strike and buys a call with a higher strike; it starts with a cash inflow.', null, null),
  ('fd', '2', 'T', 'A bull spread with puts buys a put with a low strike and sells one with a higher strike; it starts with a cash inflow.', null, null),
  ('fd', '2', 'T', 'A straddle buys a call and a put with the same strike and maturity and bets on high volatility.', null, null),
  ('fd', '2', 'T', 'An inverted straddle starts with a cash inflow and loses without limit when the share moves far in either direction.', null, null),
  ('fd', '2', 'T', 'A butterfly spread with calls buys one call with strike X1, sells two with X2 and buys one with X3; it bets on stability with limited risk.', null, null),
  ('fd', '2', 'T', 'A symmetric butterfly uses a middle strike halfway between the outer strikes.', null, null),
  ('fd', '2', 'T', 'A strangle buys a put and a call with different strikes and is cheaper than a straddle.', null, null),
  ('fd', '2', 'T', 'A calendar spread sells a short-dated call and buys a longer-dated call with the same strike.', null, null),
  ('fd', '2', 'T', 'Payoff diagrams that include the initial cash flow measure that cash flow at the maturity date (its future value).', null, null),
  ('fd', '2', 'T', 'Using options further out of the money shifts a spread’s payoff to other share prices without changing its shape.', null, null),
  ('fd', '2', 'F', 'A bull spread with calls starts with a cash inflow.', null, null),
  ('fd', '2', 'F', 'A straddle profits when the share price stays close to the strike.', null, null),
  ('fd', '2', 'F', 'A butterfly spread exposes the trader to unlimited losses if the share price moves strongly.', null, null),
  ('fd', '2', 'F', 'An inverted strangle starts with a cash outflow.', null, null),
  ('fd', '2', 'F', 'A bear spread with puts sells the put with the higher strike.', null, null),
  ('fd', '2', 'F', 'Taking n butterfly spreads instead of one changes the strikes at which the payoff peaks.', null, null),
  ('fd', '2', 'F', 'A reverse butterfly spread is a bet on stability.', null, null),
  ('fd', '2', 'MC', 'You expect the share price to fall, but only within a limited range. Which strategy fits?', array['A bear spread (with calls or with puts).']::text[], array['A straddle.', 'A butterfly spread.', 'A bull spread with puts.']::text[]),
  ('fd', '2', 'MC', 'You expect high volatility but want to limit your risk. Which strategies fit?', array['A reverse butterfly spread, a strangle or a reverse calendar spread.']::text[], array['An inverted straddle.', 'A bull spread.', 'A covered call.']::text[]),
  ('fd', '2', 'MC', 'How does a butterfly spread compare with an inverted straddle?', array['Both bet on stability, but the butterfly caps the loss when the share moves far, at the price of a lower maximum payoff.']::text[], array['They have the same payoff.', 'The butterfly bets on volatility, the inverted straddle on stability.', 'The inverted straddle has limited risk.']::text[]),
  ('fd', '2', 'MC', 'What does the initial cash flow of a straddle look like?', array['An outflow, c + p: both options are bought.']::text[], array['An inflow, because the options are sold.', 'Zero, because the call and put offset each other.', 'An inflow equal to c − p.']::text[]),
  ('fd', '3', 'T', 'In a one-period binomial model an option can be replicated with m shares and borrowing B, so its value is mS − B.', null, null),
  ('fd', '3', 'T', 'The number of shares in the replicating portfolio, m, is the option’s delta, or hedge ratio.', null, null),
  ('fd', '3', 'T', 'To rule out arbitrage the binomial model needs d < 1 + r < u.', null, null),
  ('fd', '3', 'T', 'The risk-neutral probability π = (1 + r − d)/(u − d) does not depend on the real probability of an up move.', null, null),
  ('fd', '3', 'T', 'The real probability of an up or down move has no effect on the value of an option in the binomial model.', null, null),
  ('fd', '3', 'T', 'With u = e^(σ√Δt), d = 1/u and π = (e^(rΔt) − d)/(u − d), the tree matches the mean and variance of a lognormal price.', null, null),
  ('fd', '3', 'T', 'With a continuous dividend yield q the risk-neutral probability becomes π = (e^((r − q)Δt) − d)/(u − d).', null, null),
  ('fd', '3', 'T', 'In an American put tree each node takes the larger of the discounted expected value and the exercise value X − S.', null, null),
  ('fd', '3', 'T', 'With a discrete dividend one can build a recombining tree for S minus the present value of the dividends and add it back at each node.', null, null),
  ('fd', '3', 'T', 'In a complete market the absence of arbitrage implies a unique equivalent martingale measure.', null, null),
  ('fd', '3', 'T', 'Volatility is estimated as the sample standard deviation of daily log returns times the square root of 252.', null, null),
  ('fd', '3', 'F', 'The value of a call in the binomial model rises with the real probability of an up move.', null, null),
  ('fd', '3', 'F', 'The risk-neutral probability is the probability that investors actually expect for an up move.', null, null),
  ('fd', '3', 'F', 'In the binomial model the expected return of the share must equal the risk-free rate in reality.', null, null),
  ('fd', '3', 'F', 'An American call on a share with a dividend is never exercised early in a binomial tree.', null, null),
  ('fd', '3', 'F', 'The delta of a put in the binomial model is positive.', null, null),
  ('fd', '3', 'F', 'A tree with a discrete dollar dividend always recombines.', null, null),
  ('fd', '3', 'F', 'A higher risk-free rate lowers the value of a call.', null, null),
  ('fd', '3', 'MC', 'What is the interpretation of π in the binomial model?', array['The probability of an up move in a risk-neutral world, in which every asset earns the risk-free rate; it is used to value options, not to forecast.']::text[], array['The real probability of an up move.', 'The probability that the option is exercised.', 'The proportion of the option financed by borrowing.']::text[]),
  ('fd', '3', 'MC', 'How do the deltas of a European call and put with the same strike relate at a node?', array['The put delta equals the call delta minus 1, as put-call parity implies.']::text[], array['They are equal.', 'They add up to zero.', 'The put delta is the call delta plus 1.']::text[]),
  ('fd', '3', 'MC', 'How does the value of a European put react to a longer time to maturity?', array['It can rise or fall: more time adds volatility value but delays receiving the strike.']::text[], array['It always rises.', 'It always falls.', 'It does not change.']::text[]),
  ('fd', '3', 'MC', 'Why does the tree for a share with a known dividend not recombine?', array['Subtracting a fixed amount after an up-then-down move gives a different price than after a down-then-up move.']::text[], array['Because u and d change after the dividend.', 'Because the risk-free rate changes.', 'Because the option can be exercised early.']::text[]),
  ('fd', '4', 'T', 'Under geometric Brownian motion ln S_T is normally distributed with mean ln S0 + (μ − σ²/2)T and variance σ²T.', null, null),
  ('fd', '4', 'T', 'The Black-Scholes value of a call is S N(d1) − X e^(−rT) N(d2).', null, null),
  ('fd', '4', 'T', 'N(d2) is the risk-neutral probability that a call is exercised at maturity.', null, null),
  ('fd', '4', 'T', 'The real-world probability of exercise uses the expected return μ instead of r in d2.', null, null),
  ('fd', '4', 'T', 'The delta of a Black-Scholes call is N(d1).', null, null),
  ('fd', '4', 'T', 'The implied volatility is the volatility that makes the Black-Scholes value equal the market price.', null, null),
  ('fd', '4', 'T', 'For a known dividend, Black-Scholes uses the share price minus the present value of the dividend.', null, null),
  ('fd', '4', 'T', 'For a continuous dividend yield q, Black-Scholes replaces S by S e^(−qT).', null, null),
  ('fd', '4', 'T', 'The expected share price under the lognormal model is S0 e^(μT).', null, null),
  ('fd', '4', 'T', 'The value of an option does not depend on the expected return of the underlying.', null, null),
  ('fd', '4', 'F', 'In Black-Scholes, N(d2) is the real-world probability that the call is exercised.', null, null),
  ('fd', '4', 'F', 'A higher expected return on the share raises the Black-Scholes value of a call.', null, null),
  ('fd', '4', 'F', 'Under geometric Brownian motion the share price itself is normally distributed.', null, null),
  ('fd', '4', 'F', 'The implied volatility always equals the historical volatility.', null, null),
  ('fd', '4', 'F', 'The delta of a Black-Scholes put is N(d1).', null, null),
  ('fd', '4', 'F', 'The median of the lognormal share price is S0 e^(μT).', null, null),
  ('fd', '4', 'MC', 'A call trades above its Black-Scholes value computed with the historical volatility. What does that suggest?', array['The market expects more volatility than history shows: the implied volatility is above the historical estimate.']::text[], array['The call is certainly mispriced and should be sold.', 'The market expects a higher return on the share.', 'The risk-free rate is lower than assumed.']::text[]),
  ('fd', '4', 'MC', 'Why does the real-world probability of exercise differ from the risk-neutral one?', array['Real investors require a risk premium, so the share drifts at μ rather than r; pricing nevertheless uses r.']::text[], array['Because the volatility is different in the two worlds.', 'Because the risk-neutral world has no uncertainty.', 'They are always the same.']::text[]),
  ('fd', '4', 'MC', 'How many shares hedge a short position in one Black-Scholes call?', array['N(d1) shares.']::text[], array['N(d2) shares.', 'One share.', 'N(−d1) shares.']::text[]),
  ('fd', '5', 'T', 'A structured product can be valued by decomposing its payoff into bonds, the underlying and plain-vanilla options.', null, null),
  ('fd', '5', 'T', 'A payoff of max(A, B − S_T) equals a bond paying A plus a put with strike B − A.', null, null),
  ('fd', '5', 'T', 'A product paying K(1 + |R|) consists of a bond paying K plus K/S0 calls and K/S0 puts struck at S0.', null, null),
  ('fd', '5', 'T', 'A guaranteed product with upside is a zero-coupon bond plus call options.', null, null),
  ('fd', '5', 'T', 'The issuer’s margin is the selling price minus the theoretical value of the building blocks.', null, null),
  ('fd', '5', 'T', 'A reverse convertible is a bond minus put options: the investor sells puts in exchange for a higher coupon.', null, null),
  ('fd', '5', 'T', 'Under the risk-neutral measure a commodity’s price grows at r plus storage costs minus the convenience yield.', null, null),
  ('fd', '5', 'T', 'A producer that issues a product paying more when its input price is low hedges its input-cost risk.', null, null),
  ('fd', '5', 'T', 'The participation rate of a capital-protected note falls when volatility rises, because the calls it buys become more expensive.', null, null),
  ('fd', '5', 'F', 'A guaranteed product cannot be decomposed into simpler securities.', null, null),
  ('fd', '5', 'F', 'A reverse convertible protects the investor against a fall in the share price.', null, null),
  ('fd', '5', 'F', 'The participation rate of a capital-protected note rises when volatility rises.', null, null),
  ('fd', '5', 'F', 'The issuer’s margin is the guaranteed amount minus the selling price.', null, null),
  ('fd', '5', 'F', 'A payoff of max(A, B − S_T) contains a call on the underlying.', null, null),
  ('fd', '5', 'MC', 'How do you choose the parameter α of a product paying a guarantee G plus α options so the issuer earns a margin m?', array['Set the price × (1 − m) equal to PV(G) + α × option value and solve for α.']::text[], array['Set α = price/option value.', 'Set α so that the maximum payoff equals the price.', 'Set α = (price − G)/option value without discounting.']::text[]),
  ('fd', '5', 'MC', 'Why would a battery maker issue a product paying max(1000, 1300 − price of lead)?', array['It pays out more when lead is cheap, which is when its own costs are low: the product hedges its exposure to the lead price.']::text[], array['To speculate on rising lead prices.', 'Because the product is always worth 1000.', 'To avoid paying interest.']::text[]),
  ('fd', '5', 'MC', 'What does an investor in a reverse convertible implicitly do?', array['Sells put options on the share to the issuer.']::text[], array['Buys call options on the share.', 'Buys put options on the share.', 'Holds a riskless bond.']::text[]),
  ('fd', '6', 'T', 'The forward price of an asset without income is F0 = S0 e^(rT).', null, null),
  ('fd', '6', 'T', 'With a known income of present value I, the forward price is (S0 − I)e^(rT).', null, null),
  ('fd', '6', 'T', 'The forward price of a currency is S0 e^((r − r_f)T), where r_f is the foreign risk-free rate.', null, null),
  ('fd', '6', 'T', 'A forward contract has zero value when it is entered into at the current forward price.', null, null),
  ('fd', '6', 'T', 'The value of a long forward with delivery price K is (F0 − K)e^(−rT).', null, null),
  ('fd', '6', 'T', 'Futures are settled daily through margin accounts, forwards only at maturity.', null, null),
  ('fd', '6', 'T', 'When the margin account falls below the maintenance margin the investor must top it up to the initial margin.', null, null),
  ('fd', '6', 'T', 'The minimum-variance hedge ratio is ρ σ_S/σ_F.', null, null),
  ('fd', '6', 'T', 'Index futures change the beta of a portfolio: N = (β* − β)V/(F × multiplier).', null, null),
  ('fd', '6', 'T', 'An interest rate swap can be valued as the difference between a fixed-rate bond and a floating-rate bond.', null, null),
  ('fd', '6', 'T', 'Right after a reset date the floating-rate bond in a swap is worth its notional.', null, null),
  ('fd', '6', 'F', 'A forward contract always has zero value until it matures.', null, null),
  ('fd', '6', 'F', 'Futures and forwards with the same delivery date always have different prices when interest rates are constant.', null, null),
  ('fd', '6', 'F', 'A short futures position gains when the futures price rises.', null, null),
  ('fd', '6', 'F', 'The minimum-variance hedge ratio is always 1.', null, null),
  ('fd', '6', 'F', 'At inception an interest rate swap has a large positive value for the fixed-rate payer.', null, null),
  ('fd', '6', 'F', 'The convenience yield raises the forward price of a commodity.', null, null),
  ('fd', '6', 'MC', 'The quoted forward price of a share without dividends is above S e^(rT). What is the arbitrage?', array['Borrow S, buy the share and sell it forward: at maturity deliver the share for the forward price and repay S e^(rT).']::text[], array['Short the share, invest the proceeds and buy forward.', 'Buy the forward and the share.', 'There is no arbitrage with forwards.']::text[]),
  ('fd', '6', 'MC', 'What is the par swap rate?', array['The fixed rate that makes the swap worth zero: (1 − DF_n)/Σ DF_t for annual payments.']::text[], array['The current one-year zero rate.', 'The average of the zero rates.', 'The floating rate at the last reset.']::text[]),
  ('fd', '6', 'MC', 'Why is a futures position marked to market daily?', array['Gains and losses are settled every day through the margin account, which limits the credit risk between the parties.']::text[], array['To change the delivery price every day.', 'Because futures cannot be held to maturity.', 'To pay the exchange’s fees.']::text[]);

delete from public.concept_items where subject_slug = 'pif';
insert into public.concept_items (subject_slug, topic, kind, text, correct, distractors) values
  ('pif', '1', 'T', 'A variable is declared with Dim, short for “dimension”.', null, null),
  ('pif', '1', 'T', 'An assignment such as shares = 10 is read right to left: the value 10 is stored in shares.', null, null),
  ('pif', '1', 'T', 'Long stores whole numbers, Double stores decimal numbers and String stores text.', null, null),
  ('pif', '1', 'T', 'A variable declared without a type, such as Dim total, is a Variant.', null, null),
  ('pif', '1', 'T', 'The & operator concatenates strings, so "Year " & 3 gives "Year 3".', null, null),
  ('pif', '1', 'T', 'A single quote starts a comment: VBA ignores everything after it on that line.', null, null),
  ('pif', '1', 'T', 'Cells(3, 2) refers to row 3, column 2, which is cell B3.', null, null),
  ('pif', '1', 'T', 'Cells(row, col) takes the row first and the column second.', null, null),
  ('pif', '1', 'T', 'Worksheets("Sheet1").Cells(3, 2) always targets Sheet1, whereas Cells(3, 2) alone works on whichever sheet is active.', null, null),
  ('pif', '1', 'T', '.Value is the default property of a cell, so Cells(1, 1) = 5 and Cells(1, 1).Value = 5 do the same.', null, null),
  ('pif', '1', 'T', 'In a For loop, Next increases the loop counter by 1 and the loop repeats until the counter passes the end value.', null, null),
  ('pif', '1', 'T', 'After For i = 1 To 5 … Next has finished, i equals 6.', null, null),
  ('pif', '1', 'T', 'Using the loop counter inside Cells(i, 2) lets the same line read a different row in each iteration.', null, null),
  ('pif', '1', 'T', 'A workbook saved as .xlsx loses its VBA code; macros need the .xlsm format.', null, null),
  ('pif', '1', 'T', 'A wrong sheet name in Worksheets("…") causes the error “Subscript out of range”.', null, null),
  ('pif', '1', 'T', 'Storing text in a Double variable causes a “Type mismatch” error.', null, null),
  ('pif', '1', 'T', 'Sub names cannot contain spaces; underscores such as My_Portfolio are used instead.', null, null),
  ('pif', '1', 'T', 'Assigning 7.6 to a variable declared As Long stores 8, because a Long holds only whole numbers.', null, null),
  ('pif', '1', 'F', 'Cells(3, 2) refers to cell C2.', null, null),
  ('pif', '1', 'F', 'Cells(row, col) takes the column letter first and the row second, as in Cells("B", 3).', null, null),
  ('pif', '1', 'F', 'A variable declared without a type is a String.', null, null),
  ('pif', '1', 'F', 'The + operator is the only way to join two strings in VBA.', null, null),
  ('pif', '1', 'F', 'After For i = 1 To 5 … Next has finished, i equals 5.', null, null),
  ('pif', '1', 'F', 'A file saved as .xlsx keeps its macros as long as the code compiles.', null, null),
  ('pif', '1', 'F', 'Cells(3, 2) without a sheet always refers to Sheet1, whatever sheet is active.', null, null),
  ('pif', '1', 'F', 'Long is the right type for prices and returns such as 150.75 or 0.05.', null, null),
  ('pif', '1', 'F', 'A comment in VBA starts with //.', null, null),
  ('pif', '1', 'F', 'Sub names may contain spaces as long as they are written in quotes.', null, null),
  ('pif', '1', 'F', 'An assignment such as shares = 10 compares shares with 10 and returns True or False.', null, null),
  ('pif', '1', 'F', 'Renaming the worksheet from “Sheet1” to “Portfolio” does not affect code that uses Worksheets("Sheet1").', null, null),
  ('pif', '1', 'MC', 'Which variable type should store the number of shares in a portfolio?', array['Long, because it is a whole number (a count).']::text[], array['Double, because every number in VBA must be a Double.', 'String, because Excel stores numbers as text.', 'Variant, because Long cannot be written to a cell.']::text[]),
  ('pif', '1', 'MC', 'What does Worksheets("Sheet1").Cells(3, 2) = 150.75 do?', array['It writes 150.75 into cell B3 of Sheet1.']::text[], array['It writes 150.75 into cell C2 of Sheet1.', 'It reads the value of B3 into a variable called 150.75.', 'It writes 150.75 into B3 of the active sheet, whatever its name.']::text[]),
  ('pif', '1', 'MC', 'What is the advantage of writing the full reference Worksheets("Sheet1").Cells(…) instead of Cells(…)?', array['It always targets the right sheet, whichever sheet is active.']::text[], array['It runs faster because Excel skips recalculation.', 'It allows text to be stored in the cell.', 'It is required whenever the loop counter is used as the row.']::text[]),
  ('pif', '1', 'MC', 'Why does a For loop combined with Cells(i, 2) save work?', array['The counter i both counts the repetitions and selects a different row each time.']::text[], array['Cells(i, 2) copies the whole column at once, so no loop is needed.', 'The loop stores each value permanently in a separate variable.', 'It avoids declaring any variables.']::text[]),
  ('pif', '2', 'T', 'An array is one variable with several slots, accessed by an index in parentheses.', null, null),
  ('pif', '2', 'T', 'Dim prices(1 To 3) As Double creates three slots: prices(1), prices(2) and prices(3).', null, null),
  ('pif', '2', 'T', 'With a single variable inside a loop only the last value survives; an array keeps every value.', null, null),
  ('pif', '2', 'T', 'An accumulator such as total = total + prices(i) adds one value to the running sum in each iteration.', null, null),
  ('pif', '2', 'T', 'In an If … ElseIf … Else block only one branch runs: the first whose condition is True.', null, null),
  ('pif', '2', 'T', 'ElseIf needs a condition; Else does not, it is the catch-all.', null, null),
  ('pif', '2', 'T', 'The operator <> means “not equal to”.', null, null),
  ('pif', '2', 'T', 'In a trading signal with a “Strong Buy” above 0.10 and a “Buy” above 0.02, the 0.10 check must come first.', null, null),
  ('pif', '2', 'T', 'A breakpoint pauses execution before the marked line is executed.', null, null),
  ('pif', '2', 'T', 'The Locals Window shows every variable’s name, type and current value while the code is paused.', null, null),
  ('pif', '2', 'T', 'Step Into executes the code one line at a time.', null, null),
  ('pif', '2', 'T', 'A breakpoint on the Next line shows the state at the end of each iteration.', null, null),
  ('pif', '2', 'T', 'Referencing prices(3) when the array was declared as prices(1 To 2) causes “Subscript out of range”.', null, null),
  ('pif', '2', 'T', 'An If block without its closing End If causes the compile error “Expected: End If”.', null, null),
  ('pif', '2', 'T', 'To find the maximum, start with max_price = prices(1) and loop from 2, replacing max_price whenever prices(i) is larger.', null, null),
  ('pif', '2', 'T', 'A counter such as senior_count = senior_count + 1 inside an If counts the rows that meet the condition.', null, null),
  ('pif', '2', 'F', 'Dim prices(1 To 3) As Double creates four slots, prices(0) to prices(3).', null, null),
  ('pif', '2', 'F', 'In an If … ElseIf … Else block every branch whose condition is True runs.', null, null),
  ('pif', '2', 'F', 'Else needs a condition, just like ElseIf.', null, null),
  ('pif', '2', 'F', 'The order of the conditions in an If … ElseIf block never matters.', null, null),
  ('pif', '2', 'F', 'A breakpoint pauses execution after the marked line has run.', null, null),
  ('pif', '2', 'F', 'Referencing an array slot beyond its bounds causes a “Type mismatch” error.', null, null),
  ('pif', '2', 'F', 'The operator != means “not equal to” in VBA.', null, null),
  ('pif', '2', 'F', 'After the loop in Sum_Prices, the variable price still holds all three prices.', null, null),
  ('pif', '2', 'F', 'The Locals Window shows the values of cells, not of variables.', null, null),
  ('pif', '2', 'F', 'To find the maximum, start with max_price = 0 and the result is always correct, even if all prices are negative.', null, null),
  ('pif', '2', 'MC', 'Why use an array instead of a single variable inside a loop that reads prices?', array['The array keeps every value; a single variable is overwritten in each iteration.']::text[], array['Arrays run faster because they skip the loop.', 'A single variable cannot hold a Double.', 'Arrays are the only way to compute a sum.']::text[]),
  ('pif', '2', 'MC', 'A Sub tests “If ret > 0.02 Then Buy, ElseIf ret > 0.10 Then Strong Buy”. What happens for ret = 0.15?', array['It shows Buy: the first true branch runs, so Strong Buy is never reached.']::text[], array['It shows Strong Buy, because the larger threshold wins.', 'It shows both Buy and Strong Buy.', 'It stops with a Type mismatch error.']::text[]),
  ('pif', '2', 'MC', 'Where should a breakpoint go to watch the state at the end of each iteration of a loop?', array['On the Next line.']::text[], array['On the Dim line of the array.', 'On the End Sub line.', 'On the line that declares the Sub.']::text[]),
  ('pif', '2', 'MC', 'Dim prices(1 To 2) is declared but the loop runs For i = 1 To 3. What happens?', array['Run-time error “Subscript out of range” when i reaches 3.']::text[], array['The third value is silently dropped.', 'VBA enlarges the array automatically.', 'Compile error “Expected: End If”.']::text[]),
  ('pif', '3', 'T', 'Income tax is progressive: a higher rate applies only to the part of income inside the higher bracket.', null, null),
  ('pif', '3', 'T', 'The tax of a bracket is its width times its rate; total tax is the sum of the bracket taxes up to the income.', null, null),
  ('pif', '3', 'T', 'In the worksheet, column F keeps the cumulative tax, so for an income equal to an upper threshold the tax can be read directly from F.', null, null),
  ('pif', '3', 'T', 'To use the table for any income, overwrite the first upper threshold that is greater than or equal to the income, read the cumulative tax in that row and restore the threshold.', null, null),
  ('pif', '3', 'T', 'The program saves the upper thresholds in an array before overwriting one, so it can restore the table afterwards.', null, null),
  ('pif', '3', 'T', 'In the save loop, upper(i) = Cells(i + 2, 2) maps array slots 1 to 9 to worksheet rows 3 to 11.', null, null),
  ('pif', '3', 'T', 'Exit For stops the loop at the first bracket that contains the income.', null, null),
  ('pif', '3', 'T', 'Without Exit For, the condition income <= upper(i) stays true for the later thresholds, so more rows are overwritten and the wrong tax is returned.', null, null),
  ('pif', '3', 'T', 'Using <= keeps an income equal to a threshold in that row.', null, null),
  ('pif', '3', 'T', 'Negative income is rejected with a message and Exit Sub before any calculation.', null, null),
  ('pif', '3', 'T', 'The program is built in three tested rounds: steps 1 and 5 (input and output), steps 2 and 4 (save and restore), then step 3 (the core loop).', null, null),
  ('pif', '3', 'T', 'Building the safe outer structure first and the core logic last is called non-linear construction.', null, null),
  ('pif', '3', 'T', 'Exit Sub stops the whole Sub immediately; Exit For only leaves the loop.', null, null),
  ('pif', '3', 'T', 'The average tax rate (tax ÷ income) is always below the marginal rate of the income’s bracket, except in the first bracket where they are equal.', null, null),
  ('pif', '3', 'F', 'In a progressive system the top rate applies to the whole income once it exceeds the top threshold.', null, null),
  ('pif', '3', 'F', 'The program overwrites the first upper threshold that is smaller than the income.', null, null),
  ('pif', '3', 'F', 'Without Exit For the loop still returns the right tax, it only runs slightly longer.', null, null),
  ('pif', '3', 'F', 'Restoring the thresholds is optional, because Excel undoes macro changes automatically.', null, null),
  ('pif', '3', 'F', 'The five steps of the program must be written and tested in their numerical order.', null, null),
  ('pif', '3', 'F', 'Exit For stops the whole Sub, so the thresholds are never restored.', null, null),
  ('pif', '3', 'F', 'In the save loop, upper(1) holds the value of cell B1.', null, null),
  ('pif', '3', 'F', 'Negative incomes are allowed, because the table simply returns a negative tax.', null, null),
  ('pif', '3', 'F', 'The tax for an income of 20 000 is 28.5% of 20 000.', null, null),
  ('pif', '3', 'F', 'Exit Sub leaves only the current loop and continues with the next line after Next.', null, null),
  ('pif', '3', 'MC', 'Why does the program save the upper thresholds in an array?', array['So that the overwritten threshold can be restored after the tax is read.']::text[], array['Because WorksheetFunction cannot read cells directly.', 'To sort the thresholds before the calculation.', 'Because arrays compute the tax faster than the worksheet.']::text[]),
  ('pif', '3', 'MC', 'What goes wrong if Exit For is removed from the core loop?', array['Later rows also satisfy income <= upper(i), are overwritten as well, and the tax read last is wrong.']::text[], array['Nothing: the first matching row has already been read.', 'The program never stops.', 'Negative incomes are no longer rejected.']::text[]),
  ('pif', '3', 'MC', 'Which steps are built and tested in round 1?', array['Steps 1 and 5: read and validate the income, and write the output.']::text[], array['Steps 2 and 4: save and restore the thresholds.', 'Step 3: the core tax loop.', 'All five steps at once.']::text[]),
  ('pif', '3', 'MC', 'An income of 30 000 lies in the bracket 26 355 to 38 632 (row 8). Which cells are used?', array['Overwrite B8 with 30 000, read the tax in F8, then restore B8.']::text[], array['Overwrite A8 with 30 000 and read E8.', 'Overwrite B7 and read F7.', 'Write 30 000 into F8 and read B8.']::text[]),
  ('pif', '4', 'T', 'Parameters are variables declared on the Sub line; they let a program take its inputs from outside.', null, null),
  ('pif', '4', 'T', 'Call Sub_Name(arguments) runs another Sub and passes it values.', null, null),
  ('pif', '4', 'T', 'A Sub that takes parameters cannot be started on its own with the Run button; another Sub must call it.', null, null),
  ('pif', '4', 'T', 'In Call Tax_One(25000, 15, 3) the result is written to row 15, column 3, which is cell C15.', null, null),
  ('pif', '4', 'T', 'In batch processing an outer Sub loops over the clients and an inner Sub computes the tax for one client.', null, null),
  ('pif', '4', 'T', 'Separating the workflow (outer Sub) from the computation (inner Sub) is called abstraction: the code has hierarchy.', null, null),
  ('pif', '4', 'T', 'If the number of clients grows, only the outer Sub changes (the n_clients line).', null, null),
  ('pif', '4', 'T', 'If the tax table gets a new bracket, only the inner Sub changes (the array size and the loop bounds).', null, null),
  ('pif', '4', 'T', 'If the client list moves to a different sheet, only the outer Sub changes.', null, null),
  ('pif', '4', 'T', 'The arguments of Call are matched to the parameters by position.', null, null),
  ('pif', '4', 'T', 'After the inner Sub finishes, VBA returns to the outer loop and continues with the next client.', null, null),
  ('pif', '4', 'T', 'Refactoring Income_Tax into Tax_One drops the step that reads the income from a cell and replaces the hardcoded output cell by out_row and out_col.', null, null),
  ('pif', '4', 'F', 'In Call Tax_One(25000, 15, 3) the result is written to cell O3.', null, null),
  ('pif', '4', 'F', 'Arguments of Call are matched to parameters by name, so their order does not matter.', null, null),
  ('pif', '4', 'F', 'The outer Sub of the batch program needs to know the tax brackets.', null, null),
  ('pif', '4', 'F', 'If the tax table gets a new bracket, the outer Sub Tax_Batch has to change.', null, null),
  ('pif', '4', 'F', 'A Sub with parameters is started directly with the Run button, which asks for the values.', null, null),
  ('pif', '4', 'F', 'Calling the inner Sub once per client requires copying its code into the loop.', null, null),
  ('pif', '4', 'F', 'Refactoring Income_Tax into Tax_One changes the save, compute and restore steps.', null, null),
  ('pif', '4', 'F', 'After Call, VBA continues with the line after End Sub of the called procedure, not with the caller.', null, null),
  ('pif', '4', 'MC', 'Tax_Batch reads client_income = Cells(i + 1, 1) and calls Tax_One(client_income, i + 1, 2). Where does the tax of client i = 5 go?', array['Cell B6.']::text[], array['Cell B5.', 'Cell A6.', 'Cell F6.']::text[]),
  ('pif', '4', 'MC', 'Which Sub changes if the client list grows from 20 to 1 000 clients?', array['Tax_Batch, the line n_clients = 20.']::text[], array['Tax_One, the array declaration.', 'Both Subs.', 'Neither: the loop finds the end of the list automatically.']::text[]),
  ('pif', '4', 'MC', 'What is the benefit of passing income and out_row as parameters to Classify?', array['Classify can be reused for any income and output row without changing its code.']::text[], array['It makes Classify run without a worksheet.', 'It removes the need for an If statement.', 'It lets Classify read all incomes at once.']::text[]),
  ('pif', '5', 'T', 'Rnd() returns a uniform random number in [0, 1): it can return 0 but never 1.', null, null),
  ('pif', '5', 'T', 'Rnd() * (b − a) + a scales a uniform draw to the interval [a, b).', null, null),
  ('pif', '5', 'T', 'Each call to Rnd() produces a new draw.', null, null),
  ('pif', '5', 'T', 'WorksheetFunction.NormInv(Rnd(), mean, std) turns a uniform draw into a Normal draw through the inverse Normal CDF.', null, null),
  ('pif', '5', 'T', 'NormInv(0.5, mean, std) returns the mean.', null, null),
  ('pif', '5', 'T', 'With mean 0 and standard deviation 1%, NormInv(0.975, 0, 0.01) is about 0.02 and NormInv(0.025, 0, 0.01) about −0.02.', null, null),
  ('pif', '5', 'T', 'Application.WorksheetFunction is VBA’s gateway to Excel’s function library.', null, null),
  ('pif', '5', 'T', 'Writing .Formula = "=NORM.INV(RAND(), 0, 0.01)" leaves a formula in the cell, which recalculates.', null, null),
  ('pif', '5', 'T', 'WorksheetFunction.NormInv returns a static value: no formula is created in the cell.', null, null),
  ('pif', '5', 'T', 'Function arguments in VBA are separated by commas, even if Excel uses semicolons.', null, null),
  ('pif', '5', 'T', 'Worksheet and Range variables are objects and must be assigned with Set.', null, null),
  ('pif', '5', 'T', 'Leaving out Set when assigning a Worksheet causes run-time error 91.', null, null),
  ('pif', '5', 'T', 'Filling an array in VBA and writing it to a Range in one step is faster than writing cell by cell.', null, null),
  ('pif', '5', 'T', 'An array written to a block of cells must be two-dimensional, rows and columns, even for a single column.', null, null),
  ('pif', '5', 'T', 'NormInv with a probability of exactly 0 causes run-time error 1004.', null, null),
  ('pif', '5', 'T', 'A misspelled function name after WorksheetFunction gives “Sub or Function not defined”.', null, null),
  ('pif', '5', 'T', 'If five assets share the same mean and volatility, any winner in a 40-day sample is luck.', null, null),
  ('pif', '5', 'T', 'Newer Excel function names replace dots by underscores in VBA, as in Norm_Inv and StDev_S.', null, null),
  ('pif', '5', 'F', 'Rnd() returns a uniform random number in [0, 1], so it can return exactly 1.', null, null),
  ('pif', '5', 'F', 'Rnd() * (b − a) + a scales a uniform draw to [b, a + b).', null, null),
  ('pif', '5', 'F', 'NormInv(0.5, mean, std) returns the mean plus one standard deviation.', null, null),
  ('pif', '5', 'F', 'Uniform draws between −2% and 2% cluster around zero, like Normal returns.', null, null),
  ('pif', '5', 'F', 'The .Formula method leaves a static number in the cell.', null, null),
  ('pif', '5', 'F', 'WorksheetFunction.NormInv writes a formula into the cell, which recalculates with every change.', null, null),
  ('pif', '5', 'F', 'Function arguments in VBA must be separated by semicolons if Excel uses semicolons.', null, null),
  ('pif', '5', 'F', 'Worksheet variables are assigned with =, without Set, just like numbers.', null, null),
  ('pif', '5', 'F', 'An array written to a Range may have any size; Excel trims it automatically.', null, null),
  ('pif', '5', 'F', 'A one-column array written to a Range can be declared as returns(1 To 40).', null, null),
  ('pif', '5', 'F', 'Writing 40 values cell by cell is faster than writing them as one array.', null, null),
  ('pif', '5', 'F', 'If one of five identical assets has the highest sample mean over 40 days, it has the highest expected return.', null, null),
  ('pif', '5', 'MC', 'Which expression draws a uniform return between −0.5% and 0.5%?', array['Rnd() * (0.005 - (-0.005)) + (-0.005)']::text[], array['Rnd() * 0.005 - 0.005', 'Rnd() * (-0.005 - 0.005) + 0.005 + 0.01', 'Rnd() + 0.005 - 0.005']::text[]),
  ('pif', '5', 'MC', 'Method 1 (inject a formula string) versus Method 2 (WorksheetFunction): what does the cell contain after each?', array['Method 1 a formula that recalculates, Method 2 a static value.']::text[], array['Both leave a static value.', 'Method 1 a static value, Method 2 a formula.', 'Both leave a formula.']::text[]),
  ('pif', '5', 'MC', 'A Sub stops with run-time error 91 on the line ws = Worksheets("Sheet1"). Why?', array['ws is an object variable and must be assigned with Set.']::text[], array['Sheet1 does not exist.', 'ws was declared As Double.', 'Worksheets needs a number, not a name.']::text[]),
  ('pif', '5', 'MC', 'Why does Normal_Returns declare returns(1 To 40, 1 To 1) instead of returns(1 To 40)?', array['A block of cells always has rows and columns, so the array written to it must be two-dimensional.']::text[], array['NormInv only returns two-dimensional results.', 'The second index stores the random seed.', 'One-dimensional arrays cannot hold Doubles.']::text[]),
  ('pif', '6', 'T', 'Set is used whenever the variable type is an object, such as Worksheet, Range or Workbook.', null, null),
  ('pif', '6', 'T', 'ws.Range(ws.Cells(1, 1), ws.Cells(20, 1)) is the block A1:A20 of the sheet ws.', null, null),
  ('pif', '6', 'T', 'ws.Range(top_left, bottom_right) defines a rectangular block of cells.', null, null),
  ('pif', '6', 'T', 'A Range can be one cell, one column, one row or a rectangular block.', null, null),
  ('pif', '6', 'T', 'Both Cells references inside Range() must belong to the same worksheet.', null, null),
  ('pif', '6', 'T', 'WorksheetFunction.Average and StDev_S accept a Range as input.', null, null),
  ('pif', '6', 'T', 'StDev_S is the sample standard deviation, dividing by n − 1.', null, null),
  ('pif', '6', 'T', 'Covariance_S takes two Range arguments and returns the sample covariance.', null, null),
  ('pif', '6', 'T', 'The covariance of an asset with itself equals its variance, so Covariance_S(col1, col1) = StDev_S(col1)^2.', null, null),
  ('pif', '6', 'T', 'A covariance matrix is symmetric: Cov(i, j) = Cov(j, i).', null, null),
  ('pif', '6', 'T', 'The diagonal of a covariance matrix holds the variances.', null, null),
  ('pif', '6', 'T', 'Independently simulated assets have sample covariances close to, but not exactly, zero.', null, null),
  ('pif', '6', 'T', 'The correlation is the covariance divided by the product of the two standard deviations.', null, null),
  ('pif', '6', 'T', 'Inside Summary_Table the Set line creates a fresh Range in each iteration, sliding one column to the right.', null, null),
  ('pif', '6', 'T', 'A Range built from cells on different worksheets causes run-time error 1004.', null, null),
  ('pif', '6', 'T', 'Passing a number where a Range is expected causes a Type mismatch.', null, null),
  ('pif', '6', 'F', 'StDev_S divides the sum of squared deviations by n.', null, null),
  ('pif', '6', 'F', 'Covariance_S(col1, col1) returns the standard deviation of col1.', null, null),
  ('pif', '6', 'F', 'A covariance matrix is generally not symmetric.', null, null),
  ('pif', '6', 'F', 'The diagonal of a covariance matrix holds the correlations, which are all 1.', null, null),
  ('pif', '6', 'F', 'ws.Range(ws.Cells(1, 1), ws.Cells(20, 1)) is the block A1:T1.', null, null),
  ('pif', '6', 'F', 'A Range variable is assigned with = like a Double; Set is only needed for worksheets.', null, null),
  ('pif', '6', 'F', 'If two assets tend to rise and fall on the same days, their covariance is negative.', null, null),
  ('pif', '6', 'F', 'Independently simulated assets always have a sample covariance of exactly zero.', null, null),
  ('pif', '6', 'F', 'The correlation is the covariance times the product of the two standard deviations.', null, null),
  ('pif', '6', 'F', 'WorksheetFunction.Average only accepts a list of numbers, not a Range.', null, null),
  ('pif', '6', 'MC', 'What does ws.Cells(30 + i, j) = Covariance_S(col_i, col_j) build when i and j both run from 1 to 5?', array['A 5 × 5 covariance matrix in rows 31 to 35, columns A to E.']::text[], array['A 5 × 5 matrix in rows 30 to 34.', 'One row of covariances in row 30.', 'A 25 × 1 column of covariances.']::text[]),
  ('pif', '6', 'MC', 'How can you check that Covariance_S works on your data?', array['Covariance_S(col1, col1) must equal StDev_S(col1)^2.']::text[], array['Covariance_S(col1, col2) must equal 1.', 'Covariance_S(col1, col1) must equal Average(col1).', 'The sum of all covariances must be zero.']::text[]),
  ('pif', '6', 'MC', 'What is the object rule behind “Object variable or With block variable not set”?', array['A Worksheet or Range was assigned without Set.']::text[], array['A Double was assigned with Set.', 'A Range was empty.', 'StDev_S received only one value.']::text[]),
  ('pif', '7', 'T', 'A user-defined function opens with Function and ends with End Function.', null, null),
  ('pif', '7', 'T', 'A function returns its result by assigning a value to the function’s own name, as in regards_function = welcome_msg.', null, null),
  ('pif', '7', 'T', 'A function can have several arguments, one argument or none.', null, null),
  ('pif', '7', 'T', 'The type after the closing parenthesis, as in Function f(x As Double) As Double, is the type of the result.', null, null),
  ('pif', '7', 'T', 'A user-defined function can be called from a Sub or directly from an Excel cell, like a built-in function.', null, null),
  ('pif', '7', 'T', 'A function can return an object, for example Function ThisWB() As Workbook with Set ThisWB = ThisWorkbook.', null, null),
  ('pif', '7', 'T', 'Dim my_array(1 To T, 1 To N) does not work when T and N are variables; declare Dim my_array() and size it with ReDim.', null, null),
  ('pif', '7', 'T', 'ReDim my_array(1 To T, 1 To N) sizes a dynamic array at run time from the function’s inputs.', null, null),
  ('pif', '7', 'T', 'A function that returns an array is declared As Variant.', null, null),
  ('pif', '7', 'T', 'UniformArray(T, N, a, b) fills a T × N array with Rnd() * (b − a) + a, so it holds T × N draws.', null, null),
  ('pif', '7', 'T', 'A function whose name is never assigned returns the default value of its type, such as 0 for a Double.', null, null),
  ('pif', '7', 'T', 'VBA passes arguments by reference by default, so a function that overwrites its argument changes the variable the caller passed in.', null, null),
  ('pif', '7', 'T', 'Passing an undeclared (Variant) variable to an argument declared As String gives a “ByRef argument type mismatch” error.', null, null),
  ('pif', '7', 'T', 'A function that takes arguments cannot be run on its own with the Run button.', null, null),
  ('pif', '7', 'T', 'A Sub performs actions; a Function returns a value.', null, null),
  ('pif', '7', 'F', 'A function returns its result with the keyword Return, as in Return welcome_msg.', null, null),
  ('pif', '7', 'F', 'A user-defined function can only be called from a Sub, never from an Excel cell.', null, null),
  ('pif', '7', 'F', 'Dim my_array(1 To T, 1 To N) works for any variables T and N.', null, null),
  ('pif', '7', 'F', 'A function must have at least one argument.', null, null),
  ('pif', '7', 'F', 'A function that returns an array must be declared As Double.', null, null),
  ('pif', '7', 'F', 'A function whose name is never assigned stops with an error.', null, null),
  ('pif', '7', 'F', 'VBA passes arguments by value by default, so the caller’s variable can never change.', null, null),
  ('pif', '7', 'F', 'ReDim can only be used on arrays declared with fixed bounds such as Dim a(1 To 10).', null, null),
  ('pif', '7', 'F', 'A Function and a Sub are identical except for the keyword.', null, null),
  ('pif', '7', 'F', 'UniformArray(T, N, a, b) returns T + N random draws.', null, null),
  ('pif', '7', 'MC', 'How does a VBA function hand back its result?', array['By assigning the value to the function’s name, e.g. sharpe_ratio = …']::text[], array['With the statement Return value.', 'By writing the value to cell A1.', 'With MsgBox value.']::text[]),
  ('pif', '7', 'MC', 'Why does Dim my_array(1 To T, 1 To N) As Long fail inside UniformArray?', array['The bounds of a fixed array must be constants; a dynamic array Dim my_array() with ReDim is needed.']::text[], array['Long cannot hold random numbers.', 'Arrays cannot have two dimensions.', 'T is a reserved word in VBA.']::text[]),
  ('pif', '7', 'MC', 'What is the right return type for a function that returns a T × N array of draws?', array['Variant']::text[], array['Double', 'Long', 'Range']::text[]),
  ('pif', '7', 'MC', 'What can a user-defined function do that a Sub cannot?', array['Be used in an Excel cell formula and return a value there.']::text[], array['Contain loops.', 'Take arguments.', 'Call WorksheetFunction.']::text[]),
  ('pif', '8', 'T', 'The Sharpe ratio compares the excess return to the volatility: (R − r_f) / σ.', null, null),
  ('pif', '8', 'T', 'With daily returns, the course converts the annual risk-free rate to a daily one with rf_d = rf / 252.', null, null),
  ('pif', '8', 'T', 'The annualised Sharpe ratio from daily data is Sqr(252) × (average daily return − rf_d) / daily standard deviation.', null, null),
  ('pif', '8', 'T', 'sharpe_ratio(returns As Range, rf As Double) passes the returns as a Range to Average and StDev_S.', null, null),
  ('pif', '8', 'T', 'The Sortino ratio divides the excess return by the downside volatility instead of the total volatility.', null, null),
  ('pif', '8', 'T', 'In the course, the downside volatility is the standard deviation of the negative returns only.', null, null),
  ('pif', '8', 'T', 'Investors mostly dislike downside volatility, which the standard deviation does not separate from upside volatility.', null, null),
  ('pif', '8', 'T', 'The standard deviation does not capture skewness and kurtosis.', null, null),
  ('pif', '8', 'T', 'A portfolio with strong negative skewness and high kurtosis can show a higher Sharpe ratio while hiding a fat left tail.', null, null),
  ('pif', '8', 'T', 'Sqr is VBA’s square-root function.', null, null),
  ('pif', '8', 'T', 'Two portfolios can have nearly the same mean and different Sharpe ratios because their standard deviations differ.', null, null),
  ('pif', '8', 'T', 'A UDF such as =sharpe_ratio(A2:A505, H2) can be filled across to rank several funds.', null, null),
  ('pif', '8', 'F', 'The Sharpe ratio divides the excess return by the downside volatility.', null, null),
  ('pif', '8', 'F', 'The annualised Sharpe ratio from daily data multiplies the daily ratio by 252.', null, null),
  ('pif', '8', 'F', 'The Sortino ratio uses the standard deviation of all returns.', null, null),
  ('pif', '8', 'F', 'A higher Sharpe ratio always means a portfolio is less risky in every respect.', null, null),
  ('pif', '8', 'F', 'In the course, the daily risk-free rate is rf × 252.', null, null),
  ('pif', '8', 'F', 'The Sortino ratio ignores the risk-free rate.', null, null),
  ('pif', '8', 'F', 'Kurtosis below zero means fat tails.', null, null),
  ('pif', '8', 'F', 'VBA’s square-root function is Sqrt.', null, null),
  ('pif', '8', 'F', 'The standard deviation fully captures the risk of a negatively skewed portfolio.', null, null),
  ('pif', '8', 'MC', 'Portfolio B has a Sharpe ratio of 0.75, skewness −4.52 and kurtosis 35.33; portfolio A 0.62, 0.12 and 0.07. What is the lesson?', array['B looks better on Sharpe, but its fat left tail is invisible to the standard deviation.']::text[], array['B is better in every respect.', 'A has the fatter tails.', 'Skewness and kurtosis do not matter for performance.']::text[]),
  ('pif', '8', 'MC', 'How does the course annualise the Sharpe ratio from daily returns?', array['Multiply the daily ratio (mean − rf/252) / std by Sqr(252).']::text[], array['Multiply the daily ratio by 252.', 'Divide the daily ratio by Sqr(252).', 'Use the annual rf with the daily mean and std.']::text[]),
  ('pif', '8', 'MC', 'What does the Sortino ratio put in the denominator?', array['The standard deviation of the negative (downside) returns.']::text[], array['The standard deviation of all returns.', 'The variance of all returns.', 'The average negative return.']::text[]);

insert into public.decks (id, subject_slug, owner_id, name, source) values ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'fvcs', null, 'FVCS core concepts', 'official') on conflict (id) do update set name = excluded.name;
insert into public.cards (deck_id, front, back, sort, ext_key) values
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'MM Proposition I (perfect markets)', 'The total value of a firm equals the market value of the cash flows generated by its assets; it does not depend on the capital structure. V<sub>L</sub> = V<sub>U</sub>.', 0, 'l1-mm1'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'MM Proposition II (perfect markets)', 'r<sub>E</sub> = r<sub>U</sub> + (D/E)(r<sub>U</sub> − r<sub>D</sub>). The equity cost of capital rises linearly with the market debt-equity ratio.', 1, 'l1-mm2'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Pretax WACC with perfect markets', 'r<sub>wacc</sub> = E/(E+D)·r<sub>E</sub> + D/(E+D)·r<sub>D</sub> = r<sub>U</sub>, independent of leverage.', 2, 'l1-wacc'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Unlevered beta from equity and debt betas', 'β<sub>U</sub> = E/(E+D)·β<sub>E</sub> + D/(E+D)·β<sub>D</sub>. Levered: β<sub>E</sub> = β<sub>U</sub> + (D/E)(β<sub>U</sub> − β<sub>D</sub>).', 3, 'l1-bu'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Homemade leverage', 'Investors replicate the firm’s leverage on personal account: borrow to buy unlevered equity, or buy debt and equity in proportion to unlever a position. Requires borrowing at the same rate as the firm.', 4, 'l1-homemade'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Why higher expected EPS after a recap does not raise the price', 'EPS becomes riskier, so the required return on equity rises by exactly enough to offset the higher expected EPS (perfect markets).', 5, 'l1-eps'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Leveraged recap in perfect markets: share price and shares repurchased', 'Price unchanged. Shares repurchased = D / P. Equity after = V − D.', 6, 'l1-recap'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Market value balance sheet', 'Assets at market value (including intangibles such as brand, reputation, human capital) equal the market value of debt plus equity.', 7, 'l1-mvbs'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Interest tax shield in one year', 'τ<sub>c</sub> × interest payments.', 8, 'l2-its'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'PV of the interest tax shield of permanent, risk-free debt', 'τ<sub>c</sub> × D (discount τ<sub>c</sub>·r<sub>f</sub>·D as a perpetuity at r<sub>f</sub>).', 9, 'l2-pvits-perm'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Value of the levered firm with corporate taxes', 'V<sub>L</sub> = V<sub>U</sub> + PV(interest tax shield).', 10, 'l2-vl'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'After-tax WACC', 'r<sub>wacc</sub> = E/(E+D)·r<sub>E</sub> + D/(E+D)·r<sub>D</sub>(1 − τ<sub>c</sub>) = r<sub>U</sub> − D/(E+D)·τ<sub>c</sub>·r<sub>D</sub> with a target ratio.', 11, 'l2-wacc'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'PV of the tax shield with a constant debt-equity ratio', 'V<sub>L</sub> = FCF<sub>1</sub>/(r<sub>wacc</sub> − g), V<sub>U</sub> = FCF<sub>1</sub>/(r<sub>U</sub> − g); PV(ITS) = V<sub>L</sub> − V<sub>U</sub>.', 12, 'l2-target'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Recap with corporate taxes: when does the price move, and to what?', 'At the announcement: P<sub>new</sub> = (V<sub>U</sub> + τ<sub>c</sub>D) / shares outstanding. All original shareholders, tendering or not, capture the tax shield.', 13, 'l2-recaptax'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Effective tax advantage of debt τ*', 'τ* = 1 − (1 − τ<sub>c</sub>)(1 − τ<sub>e</sub>) / (1 − τ<sub>i</sub>). Equals τ<sub>c</sub> when τ<sub>i</sub> = τ<sub>e</sub>.', 14, 'l2-taustar'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Excess interest', 'Interest above the firm’s taxable earnings. It gives no corporate tax benefit and is costly when debt holders face a personal tax disadvantage.', 15, 'l2-excess'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Tax-optimal leverage (ignoring other costs)', 'The level at which interest equals EBIT: every euro of EBIT is shielded, no excess interest.', 16, 'l2-optimal'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Levered beta formula on the formula sheet', 'β<sub>L</sub> = β<sub>U</sub>[1 + (1 − τ)(D/E)]. To unlever a comparable: β<sub>U</sub> = β<sub>L</sub> / [1 + (1 − τ)(D/E)].', 17, 'l2-hamada'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Bankruptcy in a perfect capital market', 'Shifts ownership from equity to debt holders; the total value available to investors is unchanged, so bankruptcy risk is no disadvantage of debt.', 18, 'l3-perfect'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Who bears the expected costs of financial distress?', 'The original shareholders: debt holders anticipate the costs and pay less for the debt.', 19, 'l3-who'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Direct costs of bankruptcy (size)', 'Fees for lawyers, accountants, consultants, court; on average about 3–4% of pre-bankruptcy total asset value.', 20, 'l3-direct'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Indirect costs of financial distress', 'Loss of customers, suppliers and key employees, fire sales of assets, delayed liquidation, costs to creditors. Usually larger than direct costs; count only what exceeds pure economic distress.', 21, 'l3-indirect'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Economic vs. financial distress', 'Economic distress: a significant fall in asset value regardless of leverage. Financial distress: difficulty meeting debt obligations.', 22, 'l3-econ'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Trade-off theory', 'V<sub>L</sub> = V<sub>U</sub> + PV(ITS) − PV(financial distress costs). Optimal debt maximizes the net benefit.', 23, 'l3-trade'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Chapter 7 vs. Chapter 11', 'Chapter 7: a trustee liquidates the assets and the firm ceases to exist. Chapter 11: management proposes a reorganization plan while operating the business.', 24, 'l3-ch11'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Risky debt: yield to maturity vs. expected return', 'YTM = F / D − 1 assumes full repayment; it exceeds the expected return, which with zero beta equals r<sub>f</sub>.', 25, 'l3-ytm'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Which firms should carry high leverage under the trade-off theory?', 'Stable cash flows and tangible assets (utilities, real estate, toll roads): valuable tax shields, low expected distress costs. Low leverage for volatile, intangible, R&D-heavy firms.', 26, 'l3-ind'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Asset substitution (excessive risk-taking)', 'Near distress, shareholders gain from risky projects even with negative NPV, because debt holders bear the downside. Firm value falls.', 27, 'l4-assetsub'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Debt overhang (under-investment)', 'Shareholders reject positive-NPV projects they must fund themselves, because most of the gain goes to debt holders.', 28, 'l4-overhang'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Cashing out', 'A distressed firm sells assets below value and pays the cash to shareholders, reducing firm value and the value of the debt.', 29, 'l4-cashout'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Imperfection behind the agency costs of debt', 'Managers maximize the value of equity, not the value of the whole firm.', 30, 'l4-imperfection'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Agency benefits of debt', 'Concentrated ownership, less wasteful investment (free cash flow hypothesis), less entrenchment, creditor monitoring, commitment. Imperfection: managers act in their own interest.', 31, 'l4-benefits'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Free cash flow hypothesis', 'Wasteful spending is likeliest when cash flow exceeds positive-NPV investments; interest commitments reduce the cash managers can waste.', 32, 'l4-fcf'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'How to reduce the agency costs of debt', 'Shorter maturity and debt covenants (which carry their own cost: lost flexibility).', 33, 'l4-mitigate'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Leverage ratchet effect', 'Shareholders resist reducing excess leverage because debt holders capture more than the gain in firm value; they prefer adding more debt.', 34, 'l4-ratchet'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Owner-manager selling a fraction s of the firm: share of perk costs borne', '1 − s. The rest is paid by outside shareholders.', 35, 'l4-perks'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Credibility principle', 'Self-interested claims are credible only if backed by actions that would be too costly if the claims were false.', 36, 'l5-cred'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Leverage as a signal', 'Debt is a credible signal only if it would cause financial distress when prospects are bad, i.e. face value above the low-state value.', 37, 'l5-signal'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Lemons principle', 'When the seller has private information, buyers discount the price; only sellers of below-average assets are happy to sell. Equity issues are costly and the price falls on announcement.', 38, 'l5-lemons'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Pecking order hypothesis', 'Retained earnings first, then debt, equity only as a last resort. Profitable firms tend to have low leverage.', 39, 'l5-pecking'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Timing of equity issues', 'Prices rise before an issue and fall on the announcement; firms issue right after earnings announcements, when asymmetry is smallest.', 40, 'l5-timing'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Cost to current shareholders of financing with underpriced equity', 'Amount needed / (1 − underpricing). With overpriced debt: amount × (1 + charged rate)/(1 + fair rate).', 41, 'l5-cost'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Pre-money valuation', 'Value of the shares outstanding before the round at the round price: old shares × price.', 42, 'l6-pre'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Post-money valuation', '(Old + new shares) × price = pre-money + amount invested.', 43, 'l6-post'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'VC wants fraction s after investing I: new shares and price', 'New shares = old/(1 − s) − old; price = I / new shares.', 44, 'l6-share'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Typical VC fund fees', 'About 2% annual management fee and 20% carried interest on positive returns.', 45, 'l6-fees'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'SPAC', 'Shell company that raises cash in an IPO (units at €10 with shares and warrants) and has 18–24 months to merge with a private target.', 46, 'l6-spac'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'SPAC promote', 'Shares equal to 20% of SPAC ownership given to the sponsor, conditional on a deal, for organizing the SPAC.', 47, 'l6-promote'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'SPAC redemption', 'Before the merger, public holders can redeem shares for €10 and keep their warrants; rational only if the share price is below €10.', 48, 'l6-redeem'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'PIPE', 'Private investment in public equity: shares sold privately to institutions to fund the merger.', 49, 'l6-pipe'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Cashless warrant exercise: new shares', 'Warrants × (P − K) / P.', 50, 'l6-cashless'),
  ('6b1c0f1e-6a43-4f0e-9d3c-0f5c2a9e7f01', 'Effective IPO price in a SPAC merger', 'Gross cash raised / shares issued to non-target shareholders (public, sponsor, PIPE, warrant shares).', 51, 'l6-effprice')
on conflict (deck_id, ext_key) do update set front = excluded.front, back = excluded.back, sort = excluded.sort;

insert into public.decks (id, subject_slug, owner_id, name, source) values ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'fv', null, 'FV lectures 1–7', 'official') on conflict (id) do update set name = excluded.name;
insert into public.cards (deck_id, front, back, sort, ext_key) values
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Weak-form efficiency', 'Prices reflect all past prices and volume. Technical analysis earns no abnormal returns. Challenged by momentum.', 0, 'l1-weak'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Semi-strong-form efficiency', 'Prices reflect all public information. Fundamental analysis earns no persistent abnormal returns. Event studies show fast reactions; post-earnings drift contradicts it.', 1, 'l1-semi'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Strong-form efficiency', 'Prices reflect public and private information, so even insiders cannot beat the market. Rejected: insiders earn abnormal returns.', 2, 'l1-strong'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Three empirical tests of market efficiency', 'Autocorrelation tests, event studies, cross-sectional tests (do size or book-to-market predict returns?).', 3, 'l1-tests'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Firm (enterprise) value', 'Value of the whole business to debt and equity holders: what a buyer pays for the entire firm.', 4, 'l1-ev'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Equity value', 'Residual claim of shareholders = firm value − net debt (− preferred, − minorities). Equals market capitalisation in market terms.', 5, 'l1-eqv'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Two parts of firm value', 'Assets in place (existing investments with current cash flows) + growth assets (value of future investments).', 6, 'l1-assets'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Fundamental DCF equation', 'V<sub>0</sub> = Σ E[CF<sub>n</sub>] / (1 + r)<sup>n</sup>', 7, 'l1-dcf'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Abnormal return (market model)', 'AR<sub>t</sub> = R<sub>t</sub> − (α + β R<sub>m,t</sub>). CAR = sum of ARs over the event window.', 8, 'l1-ar'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Chordia, Roll & Subrahmanyam (2005)', 'NYSE daily returns are not autocorrelated, order imbalances persist; arbitrage restores efficiency within 5–60 minutes.', 9, 'l1-crs'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Moeller, Schlingemann & Stulz (2005)', 'Acquirers lost 12 cents per dollar spent in 1998–2001 ($240bn), driven by a few large deals by highly valued acquirers.', 10, 'l1-msz'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Ang, Hodrick, Xing & Zhang (2009)', 'High idiosyncratic volatility → low future returns; 1.31% per month spread across 23 markets.', 11, 'l1-ahxz'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Yuan, Zheng & Zhu (2006)', 'Returns around full moons are 3–5% p.a. lower than around new moons in 48 countries; not explained by volatility or volume.', 12, 'l1-lunar'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'DDM vs. FCFF vs. FCFE: when to use which', 'DDM: mature firms, stable dividends. FCFF at WACC: whole firm, changing leverage, capital-intensive or growth phases. FCFE at k<sub>e</sub>: stable leverage, focus on equity.', 13, 'l2-which'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Gordon growth model', 'V<sub>0</sub> = D<sub>1</sub> / (k<sub>e</sub> − g), with g &lt; k<sub>e</sub> and g ≤ long-run growth of the economy.', 14, 'l2-gordon'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Sustainable growth', 'g = b × ROE = (1 − payout) × ROE', 15, 'l2-sustain'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Implied cost of equity', 'k<sub>e</sub> = D<sub>1</sub> / P<sub>0</sub> + g', 16, 'l2-implied'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'When does retaining more earnings raise value?', 'Only if ROE > k<sub>e</sub>. At ROE = k<sub>e</sub> nothing changes; below it, investors prefer dividends now.', 17, 'l2-retain'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Two-stage DDM', 'PV of dividends growing at g<sub>s</sub> for n years + D<sub>n</sub>(1 + g<sub>l</sub>) / [(k<sub>e</sub> − g<sub>l</sub>)(1 + k<sub>e</sub>)<sup>n</sup>]. Weakness: abrupt drop in growth.', 18, 'l2-twostage'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'H-model', 'V<sub>0</sub> = [D<sub>0</sub>(1 + g<sub>L</sub>) + D<sub>0</sub> H (g<sub>S</sub> − g<sub>L</sub>)] / (k<sub>e</sub> − g<sub>L</sub>); H = half the transition period, growth falls linearly.', 19, 'l2-h'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'FCFF', 'EBIT(1 − t) + D&amp;A − CapEx − ΔNWC', 20, 'l2-fcff'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'FCFE', 'FCFF − interest × (1 − t) + net new borrowing', 21, 'l2-fcfe'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Terminal value rules', 'TV<sub>T</sub> = CF<sub>T+1</sub> / (r − g); g typically 2–4% and below r; WACC stable in the long run. Check the TV share (often above 70%).', 22, 'l2-tv'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Bridge from firm value to equity value', 'Equity = firm value − market value of debt + cash − preferred stock − minority interests.', 23, 'l2-bridge'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Value of preferred stock', 'Preferred dividend / required return on preferred (a perpetuity).', 24, 'l2-pref'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Deferred tax liability in a DCF', 'Its reversal is a future cash outflow: forecast the payments and subtract their PV from firm value.', 25, 'l2-dtl'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Why 3–10 explicit years plus a terminal value?', 'Cash flows stabilise, uncertainty grows and the value becomes very sensitive to distant forecasts.', 26, 'l2-horizon'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Dichev & Tang (2009)', 'Volatile earnings are harder to forecast; analysts do not fully adjust, so pull volatile earnings towards the mean in projections.', 27, 'l2-dt'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Adjusted present value (APV)', 'V<sub>L</sub> = V<sub>U</sub> + PV(tax shields) − expected distress costs. V<sub>U</sub> at ρ = r<sub>f</sub> + β<sub>U</sub>·MRP. Constant permanent debt: PV(TS) = t·D. Easiest with a known amount of debt.', 28, 'l2-apv'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Arithmetic vs geometric average growth', 'Arithmetic: mean of annual rates. Geometric (CAGR): (end/start)<sup>1/n</sup> − 1. Geometric ≤ arithmetic; n = number of periods.', 29, 'l3-avg'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Growth with negative past earnings', 'Fit EPS<sub>t</sub> = a + b·t; growth ≈ b / average EPS. Or use revenues and absolute changes.', 30, 'l3-negative'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Analyst forecasts: strengths and limits', 'More information, better short-term accuracy. Accuracy falls with the horizon; weak for small, volatile, thinly covered firms; possible bias.', 31, 'l3-analysts'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Reinvestment rate', '(Net CapEx + ΔOWC) / EBIT(1 − t)', 32, 'l3-rir'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Return on capital', 'EBIT(1 − t) / (BV equity + BV debt − cash), start of year.', 33, 'l3-roc'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Fundamental growth', 'Operating income: g = RIR × ROC. Net income: g = retention × ROE.', 34, 'l3-g'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Growth when ROC changes', 'g = RIR × ROC<sub>t</sub> + (ROC<sub>t</sub> − ROC<sub>t−1</sub>) / ROC<sub>t−1</sub>', 35, 'l3-dROC'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Negative return on capital', 'Forecast revenues (market size × share) and a margin path to a sustainable level instead of RIR × ROC.', 36, 'l3-negroc'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Long-term growth anchors', 'Long-run reinvestment and ROIC, the industry average, GDP growth (often proxied by the risk-free rate).', 37, 'l3-ltg'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Which risk is priced?', 'Only systematic (non-diversifiable) risk: the marginal investor is diversified.', 38, 'l4-risk'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Risk-free rate', 'Long-term default-free government bond in the currency of the cash flows; nominal with nominal, real with real.', 39, 'l4-rf'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Historical vs implied equity premium', 'Historical: past returns; depends on period, proxy, averaging; large standard error. Implied: r from index = PV(expected cash flows), minus r<sub>f</sub>.', 40, 'l4-erp'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Implied ERP with constant growth', 'r = D<sub>1</sub>/P<sub>0</sub> + g; ERP = r − r<sub>f</sub>.', 41, 'l4-implied'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Levered beta', 'Constant D/E: β<sub>L</sub> = β<sub>U</sub>(1 + D/E). Fixed debt: β<sub>U</sub>[1 + (1 − t)D/E]. Risky debt: − β<sub>D</sub>(1 − t)D/E.', 42, 'l4-levered'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Regression beta', 'Slope of the stock’s excess returns on the market’s: the LEVERED beta at the estimation period’s leverage. High standard error, backward-looking.', 43, 'l4-regression'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Bottom-up beta', 'Value- (or revenue-) weighted unlevered betas of the businesses, relevered at the firm’s D/E.', 44, 'l4-bottomup'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'What raises the unlevered beta?', 'Cyclical revenues and high operating leverage (fixed costs).', 45, 'l4-drivers'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Total beta (private firm)', 'β<sub>U</sub> / ρ (correlation with the market), relevered at market-value D/E. For an IPO use the ordinary market beta.', 46, 'l4-total'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Synthetic rating', 'Interest coverage = EBIT / interest → rating → default spread; k<sub>d</sub> = r<sub>f</sub> + spread.', 47, 'l4-synthetic'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Market value of book debt', 'I × [1 − (1 + k<sub>d</sub>)<sup>−n</sup>]/k<sub>d</sub> + F/(1 + k<sub>d</sub>)<sup>n</sup>', 48, 'l4-mvdebt'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'WACC', 'E/(D + E)·k<sub>e</sub> + D/(D + E)·k<sub>d</sub>(1 − t), market-value weights.', 49, 'l4-wacc'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Local-currency risk-free rate', 'Local government yield − default spread (dollar/euro bond spread, CDS net of US CDS, or rating spread).', 50, 'l5-rf'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Country risk premium: three approaches', '(1) US ERP + spread. (2) CRP = spread × σ<sub>equity</sub>/σ<sub>bond</sub>. (3) Total = US ERP × σ<sub>country</sub>/σ<sub>US</sub>.', 51, 'l5-crp'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Country risk in k<sub>e</sub>', 'Additive r<sub>f</sub> + CRP + β·ERP; integrated r<sub>f</sub> + β(ERP + CRP); factor r<sub>f</sub> + β·ERP + λ·CRP.', 52, 'l5-ke'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'λ (lambda)', 'A firm’s exposure to country risk: regression, or its share of local revenues relative to the average local firm.', 53, 'l5-lambda'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Operating assets to equity', 'E = V<sub>op</sub> + cash + minority holdings + unutilised assets − minority interests − debt − options.', 54, 'l6-bridge'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Cost of net debt', '(k<sub>d</sub>·D − r<sub>f</sub>·Cash)/(D − Cash). Example: (7%·400 − 5%·200)/200 = 9%.', 55, 'l6-netdebt'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'How is a dollar of cash valued?', 'ROC = cost of capital: neutral (face value). ROC below: wasting asset. ROC above: potential value creator.', 56, 'l6-cashvalue'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Minority holdings vs minority interests', 'Holdings (not consolidated): add at market value (P/B or P/E). Interests (outsiders in consolidated subsidiaries): subtract at market value.', 57, 'l6-holdings'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Options: three approaches', 'Diluted E/(N + n) overstates dilution. Treasury stock (E + nK)/(N + n) ignores time value. Option value (E − n·OV)/N.', 58, 'l6-options'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Goodwill', 'A plug: purchase price − fair value of net identifiable assets. Not an asset to add; overpayment lowers ROC.', 59, 'l6-goodwill'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Contractual commitments', 'Treat as debt: PV at the pre-tax cost of debt. Raises debt, operating income and invested capital (Netflix).', 60, 'l6-commit'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Sensitivity vs scenario vs simulation', 'Sensitivity: one input at a time. Scenario: consistent best/base/worst cases. Monte Carlo: inputs drawn from distributions.', 61, 'l6-whatif'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Consistent multiples', 'Equity value / equity measure (P/E, P/BV, P/FCFE); EV / firm measure (EV/EBITDA, EV/EBIT, EV/Sales, EV/FCFF). Price/EBITDA is invalid.', 62, 'l7-consistent'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Justified P/E', 'payout × (1 + g)/(r − g); forward: payout/(r − g). Up with growth and payout, down with risk.', 63, 'l7-pe'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Justified P/BV', 'ROE × payout × (1 + g)/(r − g). High ROE + high risk → low P/E, high P/B.', 64, 'l7-pb'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'PEG ratio', 'P/E ÷ expected growth (in %). About 1 often read as fair; still depends on risk and payout.', 65, 'l7-peg'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Relative valuation in four steps', 'Define the multiple; describe its distribution; analyse its drivers; apply to the target (median), adjusting for differences.', 66, 'l7-steps'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'From EV/EBITDA to a share price', '(multiple × EBITDA − debt + cash) / shares.', 67, 'l7-ev'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Loss-making firm with an exit multiple', 'Multiple × metric in year n, discounted n years, + cash − debt; × survival probability if failure is possible.', 68, 'l7-exit'),
  ('3d9a7c52-1f0b-4e6a-8c21-5b7e9d0a4f02', 'Limits of relative valuation', 'Sector-wide mispricing and sentiment, dissimilar peers, outliers and negative earnings, snapshot bias. Cross-check with a DCF.', 69, 'l7-limits')
on conflict (deck_id, ext_key) do update set front = excluded.front, back = excluded.back, sort = excluded.sort;

insert into public.decks (id, subject_slug, owner_id, name, source) values ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'fi', null, 'FI core concepts', 'official') on conflict (id) do update set name = excluded.name;
insert into public.cards (deck_id, front, back, sort, ext_key) values
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Security market line (SML)', 'E[r<sub>i</sub>] = r<sub>f</sub> + β<sub>i</sub> (E[r<sub>M</sub>] − r<sub>f</sub>), with β<sub>i</sub> = cov(r<sub>i</sub>, r<sub>M</sub>) / σ²<sub>M</sub>. All correctly priced assets lie on it.', 0, 'l1-sml'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Capital market line (CML)', 'E[r<sub>C</sub>] = r<sub>f</sub> + (E[R<sub>M</sub>]/σ<sub>M</sub>) σ<sub>C</sub>. Combinations of the market and the risk-free asset; the efficient set if the CAPM holds.', 1, 'l1-cml'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'CAL spanned by an asset P in a CAPM world', 'Slope = ρ<sub>PM</sub> × Sharpe ratio of the market.', 2, 'l1-cal'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Market risk premium in equilibrium', 'E[r<sub>M</sub>] − r<sub>f</sub> = Ā σ²<sub>M</sub>, with Ā the average risk aversion (plausibly 2–5).', 3, 'l1-mrp'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'CAPM assumptions', 'Mean-variance investors, one period, same investable universe and input list, same r<sub>f</sub> for lending and borrowing, risk-free asset in zero net supply, no frictions.', 4, 'l1-assump'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Single-index model', 'R<sub>i</sub> = α<sub>i</sub> + β<sub>i</sub>R<sub>M</sub> + e<sub>i</sub>; σ²<sub>i</sub> = β²<sub>i</sub>σ²<sub>M</sub> + σ²(e<sub>i</sub>); cov(R<sub>i</sub>, R<sub>j</sub>) = β<sub>i</sub>β<sub>j</sub>σ²<sub>M</sub>.', 5, 'l1-sim'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Parameters: Markowitz vs. single-index for n = 100', 'Markowitz: 100 means + 100 variances + 4,950 covariances = 5,150. Single index: about 403.', 6, 'l1-params'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Alpha and mispricing', 'α = E[r] − (r<sub>f</sub> + β E[R<sub>M</sub>]): vertical distance to the SML. α &gt; 0 underpriced, α &lt; 0 overpriced.', 7, 'l1-alpha'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Zero-beta CAPM (Black, 1972)', 'E[r<sub>i</sub>] = E[r<sub>Z</sub>] + β<sub>i</sub>(E[r<sub>M</sub>] − E[r<sub>Z</sub>]). With borrowing constraints; flatter SML, positive alphas on low-beta stocks.', 8, 'l1-zb'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Roll’s critique (1977)', 'The true market portfolio (incl. real estate, human capital) is unobservable; only the efficiency of a proxy can be rejected.', 9, 'l1-roll'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Consumption CAPM', 'p<sub>t</sub>u′(c<sub>t</sub>) = βE[x<sub>t+1</sub>u′(c<sub>t+1</sub>)]; SDF m = βu′(c<sub>t+1</sub>)/u′(c<sub>t</sub>). Assets paying in recessions are worth more.', 10, 'l1-ccapm'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'ICAPM (Merton, 1973)', 'Multi-period investors hedge changes in the opportunity set (r<sub>f</sub>, inflation, growth): market plus hedging-portfolio factors.', 11, 'l1-icapm'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'APT: three propositions (Ross, 1976)', 'Returns follow a factor model; enough securities to diversify idiosyncratic risk; no arbitrage in frictionless markets.', 12, 'l2-apt'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Multifactor APT SML', 'E[r<sub>i</sub>] = r<sub>f</sub> + Σ<sub>k</sub> β<sub>ik</sub> RP<sub>k</sub>, for well-diversified portfolios.', 13, 'l2-sml'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Conditional expected return with factor surprises', 'E[r | F] = E[r] + Σ β<sub>k</sub>(F<sub>k</sub> − E[F<sub>k</sub>]).', 14, 'l2-cond'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'APT vs. CAPM', 'APT: only well-diversified portfolios, no market-portfolio or mean-variance assumption, a few large arbitrageurs suffice. CAPM: all assets, market is tangency portfolio, many price-taking investors.', 15, 'l2-capmvsapt'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Fama-French three factors', 'Market excess return, SMB (small minus big), HML (high minus low book-to-market). Carhart adds momentum.', 16, 'l2-ff'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Three forms of the EMH', 'Weak: past prices and volume. Semi-strong: all public information. Strong: all information, including private.', 17, 'l2-emh'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Classic anomalies', 'Momentum (Jegadeesh-Titman), long-term reversal (De Bondt-Thaler), P/E (Basu), size (Banz), book-to-market, January, post-earnings drift (Ball-Brown).', 18, 'l2-anom'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Joint hypothesis problem', 'Abnormal returns relative to a model test efficiency and the model at once; the model may be wrong.', 19, 'l2-joint'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Limits to arbitrage', 'Trading costs, idiosyncratic risk, margin requirements, short-sale constraints, short squeezes. Momentum and short-term reversal are hard to exploit after costs.', 20, 'l2-lta'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Efficiently inefficient markets (Pedersen)', 'Prices are inefficient just enough to reward the costs and risks of the active investors who keep them close to efficient.', 21, 'l2-ei'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Time- vs. dollar-weighted returns', 'Time-weighted: arithmetic or geometric average of period returns. Dollar-weighted: IRR of the investor’s cash flows; weights periods by money invested.', 22, 'l3-dwr'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Sharpe, Treynor, Jensen, IR', 'Sharpe = (r̄<sub>P</sub> − r̄<sub>f</sub>)/σ<sub>P</sub>; Treynor = (r̄<sub>P</sub> − r̄<sub>f</sub>)/β<sub>P</sub>; α = r̄<sub>P</sub> − [r̄<sub>f</sub> + β<sub>P</sub>(r̄<sub>M</sub> − r̄<sub>f</sub>)]; IR = α/σ(e<sub>P</sub>).', 23, 'l3-ratios'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'M² (Modigliani and Modigliani)', 'Lever P to the market’s volatility: M² = r<sub>f</sub> + SR<sub>P</sub>σ<sub>M</sub> − E[r<sub>M</sub>].', 24, 'l3-m2'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Which measure when?', 'Entire risky portfolio: Sharpe (or M²). One of many sub-portfolios: Treynor. Single active portfolio next to an index: information ratio.', 25, 'l3-which'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Months needed for a significant alpha', 't = (α/σ<sub>e</sub>)√N &gt; 1.96 ⇒ N &gt; (1.96 σ<sub>e</sub>/α)². E.g. α = 0.2%, σ<sub>e</sub> = 2% per month ⇒ N &gt; 384.', 26, 'l3-tstat'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Performance attribution', 'r<sub>P</sub> − r<sub>B</sub> = Σ(w<sub>Pi</sub> − w<sub>Bi</sub>)r<sub>Bi</sub> [asset allocation] + Σ w<sub>Pi</sub>(r<sub>Pi</sub> − r<sub>Bi</sub>) [security selection].', 27, 'l3-attrib'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'MRAR', 'Morningstar risk-adjusted return, MRAR(γ) = [(1/T)Σ((1 + r<sub>t</sub>)/(1 + r<sub>f,t</sub>))<sup>−γ</sup>]<sup>−12/γ</sup> − 1. Manipulation-proof (Ingersoll et al.).', 28, 'l3-mrar'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Market-timing regressions', 'Treynor-Mazuy: add c(r<sub>M</sub> − r<sub>f</sub>)². Henriksson-Merton: add c(r<sub>M</sub> − r<sub>f</sub>)D, D = 1 if the market excess return is positive.', 29, 'l3-timing'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Treynor-Black steps', 'w<sub>i</sub>⁰ = α<sub>i</sub>/σ²(e<sub>i</sub>), scale to sum to 1; α<sub>A</sub>, β<sub>A</sub>, σ²(e<sub>A</sub>) = Σw²<sub>i</sub>σ²(e<sub>i</sub>); w<sub>A</sub>⁰ = [α<sub>A</sub>/σ²(e<sub>A</sub>)]/[E(R<sub>M</sub>)/σ²<sub>M</sub>]; w<sub>A</sub>* = w<sub>A</sub>⁰/[1 + (1 − β<sub>A</sub>)w<sub>A</sub>⁰].', 30, 'l4-tb'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Sharpe ratio of the Treynor-Black portfolio', 'SR²<sub>P</sub> = SR²<sub>M</sub> + IR²<sub>A</sub> = SR²<sub>M</sub> + Σ IR²<sub>i</sub>.', 31, 'l4-sr'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Benchmark risk', 'σ(T<sub>E</sub>) = w<sub>A</sub> √[(1 − β<sub>A</sub>)²σ²<sub>M</sub> + σ²(e<sub>A</sub>)].', 32, 'l4-te'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Adjusting alpha for forecast precision', 'Kane, Kim and White: α̃ = R² × α, with R² from regressing realised on forecast alphas (often about 0.001). Shrinks weights towards zero.', 33, 'l4-kkw'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Black-Litterman steps', '1) Σ from history. 2) Baseline returns from market weights (E[R<sub>M</sub>] = Āσ²<sub>M</sub>, CAPM betas). 3) Views Q = P′R + ε. 4) Posterior R* = R<sub>E</sub> + (D/σ²<sub>D</sub>)Σ<sub>F</sub>P with Σ<sub>F</sub> = τΣ, D = Q − Q<sub>E</sub>. 5) Optimise.', 34, 'l4-bl'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Value of active management (Kane, Marcus and Trippi)', 'f = (1/2A) Σ IR²<sub>i</sub>: rises with the number of stocks and forecast precision, falls with risk aversion.', 35, 'l4-fee'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Jobson and Korkie (1980)', 'Estimated mean-variance weights are extremely noisy; imprecision rises with the number of assets and their correlation, falls with sample size.', 36, 'l5-jk'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Michaud (1989): error maximisation', 'Optimisers overweight assets with extreme (likely erroneous) estimates; weights are unstable and counter-intuitive.', 37, 'l5-michaud'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'DeMiguel, Garlappi and Uppal (2009)', 'Out of sample, none of 13 optimised strategies systematically beats 1/N: estimation error outweighs optimal diversification.', 38, 'l5-dgu'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Parametric portfolio policies (Brandt, Santa-Clara and Valkanov, 2009)', 'w<sub>i,t</sub> = θ′x<sub>i,t</sub>/N<sub>t</sub>, θ chosen to maximise utility. Avoids estimating Σ, few parameters, robust, simple.', 39, 'l5-ppp'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Galton correction (Barroso and Saxena, 2021)', 'Use past out-of-sample errors to correct inputs for regression to the mean; sensible weights and realistic risk estimates.', 40, 'l5-galton'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Hedge funds vs. mutual funds', 'Hedge funds: minimal disclosure, ≤100 sophisticated investors, flexible strategies with shorting and leverage, lock-ups, 2-and-20 fees. Mutual funds: regulated, transparent, liquid, fees 0.5–1.5%.', 41, 'l6-vs'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Portable alpha with futures', 'Contracts to sell = (portfolio value × β)/(S<sub>0</sub> × multiplier). Hedge payoff N·mult·S<sub>0</sub>(r<sub>f</sub> − r<sub>M</sub>); hedged value = V(1 + r<sub>f</sub> + α) + V·e.', 42, 'l6-pa'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Incentive fee as a call option', 'Strike = portfolio value × (1 + hurdle). The manager gains from volatility; investors in funds of funds can pay fees while losing money.', 43, 'l6-fees'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'High-water mark', 'Incentive fees only on value above the previous peak; deep losses push funds to close.', 44, 'l6-hwm'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Hedge fund data biases', 'Survivorship bias (about twice that of mutual funds) and backfill bias (Malkiel and Saha, 2005).', 45, 'l6-bias'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Scholes-Williams beta', 'Regress on current and lagged market returns; corrected β = sum of the coefficients. Asness, Krail and Liew: true risk 2–4 times higher, alphas mostly negative.', 46, 'l6-sw'),
  ('8e4f2b19-5c7d-4a3e-9b60-2d1c7f8a5e03', 'Liquidity and hedge fund alpha', 'Aragon (2007): alpha insignificant after controlling for lock-ups. Sadka (2010): high liquidity-risk betas earn about 6% more per year.', 47, 'l6-liq')
on conflict (deck_id, ext_key) do update set front = excluded.front, back = excluded.back, sort = excluded.sort;

insert into public.decks (id, subject_slug, owner_id, name, source) values ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'ifd', null, 'IFD core concepts', 'official') on conflict (id) do update set name = excluded.name;
insert into public.cards (deck_id, front, back, sort, ext_key) values
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'IPO proceeds to the firm', 'New shares × offer price × (1 − underwriting spread).', 0, 'l1-proceeds'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Total cost of an IPO to the original shareholders', 'Underpricing, new shares × (first-day price − offer price), plus direct costs, the underwriting spread. Equivalently: value they would own in a perfect market (post-IPO value − proceeds) minus the actual value of their shares.', 1, 'l1-cost'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'IPO in a perfect market: price and number of new shares', 'Price = (post-IPO value − amount raised) / old shares; new shares = amount raised / that price.', 2, 'l1-perfect'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Share price after a rights issue (all rights exercised)', '(old shares × old price + amount raised) / (old shares + new shares).', 3, 'l1-rights'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Does the subscription price of a rights issue matter to shareholders?', 'No. Rights go to all shareholders pro rata, so a lower price only shifts value between their old and new shares (provided they exercise or sell the rights).', 4, 'l1-rights-ind'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Winner’s curse in IPOs', 'Uninformed bidders are rationed in the good IPOs and get full allocations in the bad ones, so their expected return = Σ p·allocation·return is far below the average first-day return.', 5, 'l1-curse'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Why are IPOs underpriced on average?', 'Among other reasons, to keep uninformed investors participating despite the winner’s curse: they must break even on the shares they actually receive.', 6, 'l1-under'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Price of a risky zero-coupon bond with zero beta', 'B<sub>0</sub> = E[payoff] / (1 + r<sub>f</sub>), where the payoff is min(F, firm value) in each state.', 7, 'l2-price'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Yield and default spread of a one-year zero-coupon bond', 'y = F/B<sub>0</sub> − 1; default spread = y − r<sub>f</sub>. Match it to the rating with the closest typical spread.', 8, 'l2-yield'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Face value of risky debt that raises I', 'Solve E[min(F, V)] / (1 + r) = I. With two states and default in the low one: F = [I(1 + r) − (1 − p)V<sub>L</sub>] / p.', 9, 'l2-face'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Senior and subordinated (junior) debt', 'In default senior debt is paid first; junior debt only gets what is left. New junior debt funding a project can raise the value of existing senior bonds.', 10, 'l2-junior'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Convertible bond payoff at maturity', 'max(min(K, V), x/(n + x) × V): the principal K (or V in default), or the fraction of the firm the x new shares represent.', 11, 'l2-conv'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Conversion ratio of a convertible bond', 'Shares received per bond: x / number of bonds, e.g. per €100 of face value x / (K/100).', 12, 'l2-ratio'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Straight versus convertible debt in a perfect market', 'Both fairly priced, so the share price is the same: (existing value + NPV) / shares. Shareholders are indifferent.', 13, 'l2-same'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'When do bankruptcy costs lower the share price?', 'Only if the security can default. A convertible with a principal below the firm value in every state never triggers them.', 14, 'l2-bankr'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Effort with own cash', 'High effort if κ ≤ E[V | high] − E[V | low]: the entrepreneur bears the whole cost and keeps the whole gain.', 15, 'l3-own'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Effort with outside equity', 'Investors take α = I / E[V | high]; the entrepreneur keeps 1 − α of the gain: high effort if κ ≤ (1 − α)(E[V | high] − E[V | low]).', 16, 'l3-equity'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Effort with debt', 'Face value F from E<sub>high</sub>[min(F, V)] = I; high effort if κ ≤ Σ(p<sub>high</sub> − p<sub>low</sub>) max(V − F, 0). The entrepreneur keeps the whole upside above F.', 17, 'l3-debt'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Incentivizing power of debt', 'For a range of effort costs only debt sustains high effort, because it leaves the entrepreneur residual claimant on the upside.', 18, 'l3-incentive'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Pooled prices under asymmetric information', 'Equity: α = I / average expected value. Debt: F from the average success probability. Good types’ securities are underpriced, bad types’ overpriced.', 19, 'l3-pool'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Information sensitivity', 'Debt’s value depends less on private information than equity’s, so it is less mispriced. Good types prefer debt.', 20, 'l3-sensitive'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Pecking order theory', 'Internal funds first, then debt, then equity. Issuing equity would reveal a bad type, so all types pool on debt.', 21, 'l3-pecking'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'NPV rule', 'NPV = Σ E[CF<sub>t</sub>] / (1 + r)<sup>t</sup>. Undertake the project if NPV > 0; NPV is what you would pay for the right to do the project.', 22, 'l4-npv'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Incremental cash flows', 'CF with the project − CF without it. Exclude sunk costs and allocated costs that do not change; include opportunity costs and externalities (e.g. cannibalisation).', 23, 'l4-incr'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Free cash flow', 'FCF = EBITDA − τ·EBIT − CapEx − ΔNWC + other = EBIT(1 − τ) + Dep − CapEx − ΔNWC + other. No interest, no dividends.', 24, 'l4-fcf'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Net working capital', 'Operating cash + inventory + accounts receivable − accounts payable. An increase is a cash outflow; NWC is recovered at the end of a project.', 25, 'l4-nwc'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'CapEx from the balance sheet', 'Change in non-current assets + depreciation.', 26, 'l4-capex'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'After-tax salvage value', 'Sale price − τ × (sale price − book value).', 27, 'l4-salvage'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Continuation value', 'TV<sub>T</sub> = FCF<sub>T+1</sub> / (r − g), a cash flow at year T, discounted back with (1 + r)<sup>T</sup>.', 28, 'l4-tv'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Twin-firm method', 'Take the equity beta of pure players in the project’s business, unlever it: β<sub>U</sub> = E/V·β<sub>E</sub> + D/V·β<sub>D</sub>, relever at the project’s D′/E′: β<sub>E′</sub> = β<sub>U</sub> + D′/E′(β<sub>U</sub> − β<sub>D′</sub>).', 29, 'l4-twin'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Adjusted present value', 'V<sup>L</sup> = V<sup>U</sup> + PV(debt tax shield) + other financing effects. Tax shield in year t: τ·r<sub>D</sub>·D<sub>t−1</sub>.', 30, 'l4-apv'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'Discount rate for the tax shield', 'r<sub>D</sub> if the debt schedule is predetermined (perpetual debt: PV = τD); r<sub>U</sub> if debt keeps a constant leverage ratio.', 31, 'l4-rdts'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'WACC', 'E′/(D′ + E′)·r<sub>E′</sub> + D′/(D′ + E′)·r<sub>D′</sub>(1 − τ); with constant leverage r<sub>U</sub> − D/V·τ·r<sub>D</sub>. V<sup>L</sup> = Σ FCF / (1 + WACC)<sup>t</sup>.', 32, 'l4-wacc'),
  ('2c7e9a41-8b3d-4f5a-a1c6-7d0e3b9f6a04', 'APV or WACC?', 'Same value in principle. WACC is quick but assumes a constant leverage ratio; APV is more flexible (fixed debt schedules, subsidised loans, distress costs).', 33, 'l4-apvwacc')
on conflict (deck_id, ext_key) do update set front = excluded.front, back = excluded.back, sort = excluded.sort;

insert into public.decks (id, subject_slug, owner_id, name, source) values ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'fd', null, 'FD core concepts', 'official') on conflict (id) do update set name = excluded.name;
insert into public.cards (deck_id, front, back, sort, ext_key) values
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Derivative security', 'A security whose value derives from an underlying variable, often the price of a traded asset (the underlying, or primitive, asset). Used to hedge, speculate and arbitrage.', 0, 'l1-deriv'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Call and put', 'Right, not obligation, to buy (call) or sell (put) the underlying at the strike X on (European) or up to (American) the maturity date T. Payoffs max(S<sub>T</sub> − X, 0) and max(X − S<sub>T</sub>, 0).', 1, 'l1-option'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Intrinsic value and time value', 'Intrinsic value: max(S − X, 0) for a call, max(X − S, 0) for a put. Time value = option price − intrinsic value (can be negative for a European put deep in the money).', 2, 'l1-intrinsic'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Bounds on a European call (no income)', 'max(S − PV(X), 0) ≤ c ≤ S.', 3, 'l1-callbounds'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Bounds on a European put (no income)', 'max(PV(X) − S, 0) ≤ p ≤ PV(X).', 4, 'l1-putbounds'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Put-call parity', 'c = p + S − PV(X) (no income); with income of present value D: c = p + S − PV(X) − D. American options: S − X ≤ C − P ≤ S − PV(X).', 5, 'l1-parity'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Early exercise of an American call (no income)', 'Never optimal: C ≥ S − PV(X) > S − X, so selling beats exercising. Hence C = c.', 6, 'l1-amcall'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Early exercise of an American put (no income)', 'Can be optimal when S is low: exercising and investing (X − S)e<sup>rT</sup> can exceed X, the most the put pays at maturity. Hence P > p.', 7, 'l1-amput'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Bounds with income D (present value)', 'c ≥ S − PV(X) − D, p ≥ PV(X) − S + D. An American call may be exercised just before a large dividend; the incentive to exercise an American put early falls.', 8, 'l1-div'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Exploiting a call below its lower bound', 'Buy the call, short the share, invest PV(X): cash today S − PV(X) − c > 0, payoff at T max(S<sub>T</sub>, X) − S<sub>T</sub> ≥ 0.', 9, 'l1-arb'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Bull spread', 'Calls: buy X1, sell X2 > X1 (outflow). Puts: buy X1, sell X2 (inflow). Bet on a rise within a limited range.', 10, 'l2-bull'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Bear spread', 'Calls: sell X1, buy X2 > X1 (inflow). Puts: sell X1, buy X2 (outflow). Bet on a fall within a limited range.', 11, 'l2-bear'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Straddle and inverted straddle', 'Buy (sell) a call and a put with the same strike: bet on volatility (stability). Choose X close to S<sub>t</sub>. The inverted straddle has unlimited risk.', 12, 'l2-straddle'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Strangle and inverted strangle', 'Buy (sell) a put with X1 and a call with X2 > X1. Cheaper than a straddle; the inverted strangle bets on stability over the range X1 to X2.', 13, 'l2-strangle'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Butterfly spread', 'Buy one option with X1, sell two with X2, buy one with X3 (calls or puts; symmetric if X2 = (X1 + X3)/2). Bet on stability with limited risk; costs money up front.', 14, 'l2-butterfly'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Calendar spread', 'Sell a call maturing at T and buy a call with the same strike maturing at T* > T. Bet on stability; the reverse calendar spread bets on volatility.', 15, 'l2-calendar'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Net payoff of a strategy', 'Payoff at maturity + future value of the initial cash flow, CF<sub>0</sub>e<sup>rT</sup>.', 16, 'l2-fv'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Replicating portfolio (one period)', 'm = (c<sup>u</sup> − c<sup>d</sup>)/(S<sup>u</sup> − S<sup>d</sup>) shares and borrowing B = (mS<sup>u</sup> − c<sup>u</sup>)/(1 + r); c = mS − B. m is the delta (hedge ratio).', 17, 'l3-repl'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Risk-neutral probability', 'π = (1 + r − d)/(u − d), or (e<sup>rΔt</sup> − d)/(u − d) with continuous rates and (e<sup>(r − q)Δt</sup> − d)/(u − d) with a dividend yield q. Requires d < 1 + r < u.', 18, 'l3-pi'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'u and d from volatility', 'u = e<sup>σ√Δt</sup>, d = 1/u = e<sup>−σ√Δt</sup>; they match the mean and variance of the lognormal price over Δt.', 19, 'l3-crr'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'n-period binomial formula', 'c<sub>0</sub> = (1 + r)<sup>−n</sup> Σ<sub>j</sub> C(n, j) π<sup>j</sup>(1 − π)<sup>n−j</sup> max(S<sub>0</sub>u<sup>j</sup>d<sup>n−j</sup> − X, 0).', 20, 'l3-npd'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'American options in a tree', 'At every node take max(value alive, value dead): discounted risk-neutral expectation versus immediate exercise.', 21, 'l3-am'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Tree with a known dividend', 'Build the recombining tree for S* = S − PV(dividends); at each node add back the PV of the dividends still to come.', 22, 'l3-divtree'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Effect of parameters on option values', 'S: call +, put −. X: call −, put +. Volatility: both +. Time: call +, put ±. r: call +, put −. Real up-probability: no effect.', 23, 'l3-effects'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Historical volatility', 'u<sub>t</sub> = ln(S<sub>t</sub>/S<sub>t−1</sub>); σ̂ = sample standard deviation of u<sub>t</sub> × √252 (daily data).', 24, 'l3-vol'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Lognormal model', 'dS = μS dt + σS dz ⇒ ln S<sub>T</sub> ~ N(ln S<sub>0</sub> + (μ − σ²/2)T, σ²T); E[S<sub>T</sub>] = S<sub>0</sub>e<sup>μT</sup>.', 25, 'l4-gbm'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Black-Scholes formulas', 'c = S N(d1) − Xe<sup>−rT</sup>N(d2), p = Xe<sup>−rT</sup>N(−d2) − S N(−d1); d1 = [ln(S/X) + (r + σ²/2)T]/(σ√T), d2 = d1 − σ√T.', 26, 'l4-bs'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'N(d2) and N(d1)', 'N(d2): risk-neutral probability that the call is exercised. N(d1): delta of the call. With μ instead of r in d2: real-world probability of exercise.', 27, 'l4-nd2'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Black-Scholes with income', 'Known dividends: replace S by S − PV(D). Continuous yield q: replace S by Se<sup>−qT</sup> (r − q in d1).', 28, 'l4-div'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Implied volatility', 'The σ that makes the Black-Scholes value equal the market price; found by trial and error. Above historical volatility ⇒ the market expects more risk.', 29, 'l4-iv'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Valuing a structured product', 'Decompose the payoff into zero-coupon bonds, the underlying and plain options; value each; the issuer’s margin = price − value.', 30, 'l5-decomp'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Guarantee G plus α options', 'Price × (1 − margin) = Ge<sup>−rT</sup> + α × option value ⇒ α.', 31, 'l5-guar'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Payoff max(A, B − S<sub>T</sub>)', 'A + max((B − A) − S<sub>T</sub>, 0): a bond paying A plus a put with strike B − A.', 32, 'l5-floor'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Payoff K(1 + |R|)', 'K + (K/S<sub>0</sub>)|S<sub>T</sub> − S<sub>0</sub>|: a bond paying K plus K/S<sub>0</sub> at-the-money straddles.', 33, 'l5-abs'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Reverse convertible', 'Bond paying N(1 + k) minus N/S<sub>0</sub> puts struck at S<sub>0</sub>: the high coupon pays the investor for the puts sold.', 34, 'l5-rev'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Risk-neutral drift of a commodity', 'r + u − y (storage cost u, convenience yield y): value options on it like an asset with yield q = y − u.', 35, 'l5-comm'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Forward price', 'No income: Se<sup>rT</sup>; known income I: (S − I)e<sup>rT</sup>; yield q: Se<sup>(r − q)T</sup>; currency: Se<sup>(r − r<sub>f</sub>)T</sup>; commodity: Se<sup>(r + u − y)T</sup>.', 36, 'l6-fwd'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Value of a forward contract', 'Long: f = (F<sub>0</sub> − K)e<sup>−rT</sup>; zero at inception.', 37, 'l6-value'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Futures margin account', 'Gains and losses settled daily. Below the maintenance margin ⇒ margin call back to the initial margin.', 38, 'l6-margin'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Minimum-variance hedge', 'h* = ρ σ<sub>S</sub>/σ<sub>F</sub>; contracts N* = h* Q<sub>A</sub>/Q<sub>F</sub>. Index futures: N = (β* − β)V/(F × multiplier).', 39, 'l6-hedge'),
  ('5f1d8b37-2e9c-4a6b-b7d4-9c3e0a1f7b05', 'Interest rate swap', 'Receive-fixed value = B<sub>fix</sub> − B<sub>fl</sub>; B<sub>fl</sub> = notional right after a reset. Par rate s = (1 − DF<sub>n</sub>)/Σ DF<sub>t</sub>.', 40, 'l6-swap')
on conflict (deck_id, ext_key) do update set front = excluded.front, back = excluded.back, sort = excluded.sort;

insert into public.decks (id, subject_slug, owner_id, name, source) values ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'pif', null, 'PIF core concepts', 'official') on conflict (id) do update set name = excluded.name;
insert into public.cards (deck_id, front, back, sort, ext_key) values
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Declaring and assigning a variable', '<code>Dim shares As Long</code> creates the box, <code>shares = 10</code> fills it (read right to left). Without a type the variable is a Variant.', 0, 'c1-dim'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Long, Double, String, Variant', 'Long: whole numbers (counts). Double: decimals (prices, rates, returns). String: text in quotes. Variant: anything, the default when no type is given. A decimal stored in a Long is rounded to a whole number.', 1, 'c1-types'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', '& and the comment quote', '<code>&amp;</code> glues strings: <code>"Year " &amp; 3</code> → "Year 3". A single quote <code>''</code> starts a comment.', 2, 'c1-concat'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Cells(row, col)', 'Row first, column second: <code>Cells(3, 2)</code> = B3, <code>Cells(5, 3)</code> = C5. <code>Worksheets("Sheet1").Cells(3, 2)</code> always targets Sheet1; <code>Cells(3, 2)</code> alone uses the active sheet. .Value is the default property.', 3, 'c1-cells'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Writing to and reading from a cell', 'Write: <code>Worksheets("Sheet1").Cells(3, 2) = 150.75</code>. Read: <code>price = Worksheets("Sheet1").Cells(3, 2)</code>. Like copy-paste, but with code.', 4, 'c1-readwrite'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'For / Next loop', '<code>For i = 1 To 5 … Next</code>: Next adds 1 to i until i passes 5, so i = 6 after the loop. Using i in <code>Cells(i, 2)</code> reads a different row each time.', 5, 'c1-for'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Saving a workbook with macros', 'Save as .xlsm (Excel Macro-Enabled Workbook); .xlsx drops the code.', 6, 'c1-xlsm'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Subscript out of range / Type mismatch', 'Subscript out of range: a sheet name or array slot that does not exist. Type mismatch: text in a number variable (or the reverse).', 7, 'c1-errors'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Array', '<code>Dim prices(1 To 3) As Double</code>: one name, three slots prices(1) … prices(3). Unlike a single variable inside a loop, it keeps every value.', 8, 'c2-array'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Accumulator and counter', '<code>total = total + prices(i)</code> builds a running sum; <code>cnt = cnt + 1</code> inside an If counts matching rows. Start them at 0.', 9, 'c2-acc'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Maximum of an array', '<code>max_price = prices(1)</code>, then loop from 2: <code>If prices(i) &gt; max_price Then max_price = prices(i)</code>.', 10, 'c2-max'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'If / ElseIf / Else', 'Conditions are checked top-down; only the first true branch runs, then VBA jumps to End If. ElseIf needs a condition, Else is the catch-all. Put the strictest test (e.g. Strong Buy above 0.10) first.', 11, 'c2-if'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Comparison operators', '= , &gt; , &lt; , <code>&lt;&gt;</code> (not equal), <code>&gt;=</code>, <code>&lt;=</code>.', 12, 'c2-ops'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Breakpoint, Step Into, Locals Window', 'A breakpoint (red dot in the margin) pauses before the line. Step Into runs one line at a time. The Locals Window shows every variable’s name, type and value. In a loop, break on Next.', 13, 'c2-debug'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Expected: End If', 'Compile error: an If block is not closed. Write End If right after If, then fill in the middle.', 14, 'c2-endif'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Progressive income tax', 'Each rate applies only to the part of income inside its bracket. Tax = Σ (bracket width × rate) up to the income. Worksheet: D = B − A, E = D × C / 100, F = cumulative E.', 15, 'c3-prog'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Using the tax table as a compute engine', 'Find the first upper threshold ≥ income, overwrite it with the income, read the cumulative tax F in that row, restore the threshold. 20 000 → overwrite B6, read F6 = 4 273.41; 30 000 → B8, F8 = 7 800.81.', 16, 'c3-trick'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'The five steps of income_tax_main', '1 read and validate income (negative → MsgBox, Exit Sub); 2 save upper thresholds in upper(1 To 9); 3 find row, overwrite, read tax, Exit For; 4 restore thresholds; 5 write the tax.', 17, 'c3-steps'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Building in tested rounds', 'Round 1: steps 1 + 5 (input and output). Round 2: steps 2 + 4 (save and restore). Round 3: step 3 (core). Safe outer structure first, core last: non-linear construction.', 18, 'c3-rounds'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'upper(i) = Cells(i + 2, 2)', 'Maps array slots 1 to 9 to worksheet rows 3 to 11 (column B).', 19, 'c3-map'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Exit For and <=', '<code>If income &lt;= upper(i)</code> keeps an income equal to a threshold in its row. Exit For stops at the first match; without it later rows are overwritten too and the tax is wrong. Exit Sub ends the whole Sub.', 20, 'c3-exit'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Parameterised Sub', '<code>Sub Tax_One(income As Double, out_row As Long, out_col As Long)</code>: inputs come from outside. It cannot be started with Run; another Sub must call it.', 21, 'c4-param'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Call', '<code>Call Tax_One(25000, 15, 3)</code> runs Tax_One with income 25 000 and writes to row 15, column 3 = C15. Arguments match parameters by position.', 22, 'c4-call'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Sub within a Sub (batch processing)', 'Outer Sub Tax_Batch loops over clients and calls the inner Sub Tax_One for each. More clients or a moved list → change the outer Sub; a new bracket → change the inner Sub. This hierarchy is abstraction.', 23, 'c4-batch'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Rnd()', 'Uniform random number in [0, 1): can be 0, never 1; a new draw each call. <code>Rnd() * (b - a) + a</code> scales it to [a, b).', 24, 'c5-rnd'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Normal draws', '<code>Application.WorksheetFunction.NormInv(Rnd(), mean, std)</code> = mean + std × z(p). NormInv(0.5, …) = mean; with std 1%, 0.975 → +0.0196, 0.025 → −0.0196.', 25, 'c5-norminv'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Two ways to call Excel functions', 'Method 1: <code>ws.Cells(3, 1).Formula = "=NORM.INV(RAND(), 0, 0.01)"</code> leaves a formula that recalculates. Method 2: <code>Application.WorksheetFunction.NormInv(…)</code> returns a static value, faster. Commas separate arguments; newer names use underscores (Norm_Inv, StDev_S).', 26, 'c5-methods'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Set for objects', '<code>Dim ws As Worksheet</code>, <code>Set ws = Worksheets("Sheet1")</code>. Worksheets, Ranges and Workbooks are objects and need Set; without it: run-time error 91.', 27, 'c5-set'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Writing an array to a Range in one step', '<code>Dim returns(1 To 40, 1 To 1) As Double</code>, <code>Set ret_range = ws.Range(ws.Cells(3, 1), ws.Cells(42, 1))</code>, fill the array, then <code>ret_range.Value = returns</code>. Two dimensions, same size as the Range.', 28, 'c5-array-range'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Errors in Class 5', 'Sub or Function not defined: misspelled function name after WorksheetFunction. 1004: NormInv got a probability of exactly 0. 91: object assigned without Set.', 29, 'c5-errors'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Range object', '<code>Set col = ws.Range(ws.Cells(1, 1), ws.Cells(20, 1))</code> = A1:A20, from top-left to bottom-right. Both Cells must be on the same sheet (else error 1004).', 30, 'c6-range'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Statistics of a Range', '<code>WorksheetFunction.Average(col)</code>, <code>StDev_S(col)</code> (sample, n − 1), <code>Covariance_S(col1, col2)</code> (sample).', 31, 'c6-stats'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Covariance facts', 'Positive when assets move together, negative when opposite, near zero when unrelated. Cov(i, i) = variance = StDev_S^2. The matrix is symmetric with variances on the diagonal.', 32, 'c6-cov'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Correlation', 'ρ<sub>ij</sub> = Cov(i, j) / (σ<sub>i</sub> × σ<sub>j</sub>).', 33, 'c6-corr'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Covar_Matrix', 'Outer loop i fixes col_i, inner loop j builds col_j; <code>ws.Cells(30 + i, j) = Covariance_S(col_i, col_j)</code> fills rows 31–35, columns A–E.', 34, 'c6-matrix'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Structure of a user-defined function', '<code>Function name(arg As Type) As Type</code> … <code>name = result</code> … <code>End Function</code>. Zero, one or several arguments; the result is assigned to the function’s name.', 35, 'c7-udf'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Using a function', 'From a Sub: <code>x = regards_function("Students")</code>. From a cell: <code>=regards_function(B1)</code>. A function with arguments cannot be run with the Run button.', 36, 'c7-use'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Dynamic arrays', '<code>Dim my_array(1 To T, 1 To N)</code> fails for variables T, N. Use <code>Dim my_array() As Double</code> then <code>ReDim my_array(1 To T, 1 To N)</code>. Return arrays As Variant.', 37, 'c7-redim'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'ByRef by default', 'A variable passed to a function can be changed by it when the function overwrites its parameter. An undeclared (Variant) variable passed to a String parameter: “ByRef argument type mismatch”.', 38, 'c7-byref'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Functions returning objects', '<code>Function ThisWB() As Workbook</code> with <code>Set ThisWB = ThisWorkbook</code>; <code>ThisWB().Name</code> gives the workbook name.', 39, 'c7-object'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'sharpe_ratio from daily returns', 'avg = Average(returns), std = StDev_S(returns), tdays = 252, rf_d = rf / tdays; Sharpe = Sqr(tdays) × (avg − rf_d) / std.', 40, 'c8-sharpe'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Sortino ratio', 'Same numerator; denominator = downside volatility, the StDev_S of the negative returns only. Annualise with Sqr(252).', 41, 'c8-sortino'),
  ('9a2e6c14-7d3b-4f8a-b5e1-3c8d2f6a9b06', 'Skewness and kurtosis problem', 'Std ignores the shape of the distribution. B: mean 14.00%, std 15.99%, skew −4.52, kurtosis 35.33, Sharpe 0.75 beats A (14.14%, 19.57%, 0.12, 0.07, Sharpe 0.62) but hides a fat left tail.', 42, 'c8-moments')
on conflict (deck_id, ext_key) do update set front = excluded.front, back = excluded.back, sort = excluded.sort;
