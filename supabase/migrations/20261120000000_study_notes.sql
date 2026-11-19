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
