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
