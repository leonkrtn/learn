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
