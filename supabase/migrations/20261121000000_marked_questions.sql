-- Questions a user marked while practising, per subject. The stored question is a template: the Marked questions page
-- asks it again with new numbers (same variant and sub-questions). sig identifies the question so it is marked once.
create table if not exists public.marked_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  subject_slug text not null references public.subjects (slug) on delete cascade,
  type_key text not null,
  topic text not null,
  sig text not null check (char_length(sig) between 1 and 64),
  q jsonb not null check (pg_column_size(q) <= 65536),
  created_at timestamptz not null default now(),
  unique (user_id, subject_slug, sig)
);

alter table public.marked_questions enable row level security;
drop policy if exists "own rows" on public.marked_questions;
create policy "own rows" on public.marked_questions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
