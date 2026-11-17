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
