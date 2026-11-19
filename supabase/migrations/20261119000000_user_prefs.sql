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
