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
