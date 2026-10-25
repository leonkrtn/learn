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

-- Generated by `npm run seed:sql`. Do not edit by hand.

insert into public.trimesters (id, name, sort) values (1, 'Trimester 1', 1) on conflict (id) do nothing;
insert into public.subjects (slug, trimester_id, name, short_name, sort) values ('fvcs', 1, 'Firm Value and Capital Structure', 'FVCS', 1) on conflict (slug) do update set name = excluded.name, short_name = excluded.short_name;

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
