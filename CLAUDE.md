# Notes for working on this repository

Next.js 16 (App Router, `proxy.ts` instead of middleware, async `params`) + Supabase. UI language is English. Read `node_modules/next/dist/docs/` before using Next.js APIs you are unsure about.

## Adding a subject

New subjects are code modules plus seed content. Follow the exam-practice-builder rules: procedural generators only, solutions computed from the same inputs, 2% tolerance, comma and point input, each family and type selectable.

1. Create `subjects/<slug>/`:
   - `generators.ts`: one exported function per question type returning `Question` (use `lib/engine/gen-helpers.ts`: `Q`, `N`, `C`, `chooseParts`, `co`, `rstep` …). Redraw invalid parameter sets in a loop rather than accepting them. Every generator attaches its worked calculation (see "Worked calculations per part").
   - `concepts.ts`: `BANK: ConceptBank` with `T` (true statements), `F` (false statements) and `MC` (question, correct variants, distractors) per topic, plus topic names.
   - `cards.ts`: official flashcards with stable `key`s.
   - `FormulaSheet.tsx`: exactly the sheet handed out in the exam.
   - `theory/`: one client component per topic (steps, formulas, a `Lab` with sliders, worked example, `.pitfall` blocks, `<TheoryQuiz topic=… />`), registered in `theory/index.ts`.
   - `explain/`: one explanation per question type (see "Question-type explanations" below), merged in `explain/index.ts`.
   - `index.ts`: the `SubjectModule` (topics, types with weights, `typeKeyOf`, optional `mock` spec with the real paper's structure, `explain`).
2. Register the module in `subjects/index.ts`.
3. Add the subject, its trimester, bank and deck to `scripts/build-seed.ts`, run `npm run seed:sql`, and run the new content migration (or `supabase/setup.sql`) in Supabase.
4. Extend `tests/engine.test.ts` so every new generator runs a few hundred times with finite answers, then `npm test` and `npm run build`. `tests/calc.test.ts` and `tests/explain.test.ts` cover new types automatically and fail until the calculation and the explanation exist.

## Worked calculations per part

After checking, a click on an answer field (or choice button) opens a lightbox (`PartDialog` in `components/Explain.tsx`) with the calculation of that part in the question's own numbers: every step up to the part's result, steps of earlier parts collapsed (`lib/calc.ts`). Below the question there is only a short hint; there is no solution block any more.

- Every generator builds it with `calc()` from `lib/engine/gen-helpers.ts`: `k.s(md)` for a step, `k.r(md, key, value)` for the step that yields a part's answer, then `withCalc(Q(…), k.steps)`. Parts get the same key: `N(…, { key })`, `C(…, correct, key)` or `K(part, key)`. Numeric multiple choice passes `calc` to `mcNum` with result key `'ans'`. Text-only multiple choice and concept questions need none.
- Every step: formula, the numbers put in, the intermediates (each power, exponential, N(d), sum), result. Shown values are rounded to two decimals by default, or three or four if the user chooses so under Account → Display (values below 0.1 keep as many significant digits); `tn`, `tp`, `tq` do this centrally. Generators always write English number format; question text, options, solutions and calculation steps pass through `localizeText`/`localizeMd` (`lib/numfmt.ts`) for users who chose the decimal comma, so never format with `toFixed`; units and € go outside `$…$`; dollars as `\\$`. Steps in dependency order, side results (shares, verdicts) last. Use the generator's own variables, never rounded copies.
- `tests/calc.test.ts` generates every type many times and fails when a part lacks its key or result step, when the step's value differs from the answer, or when a step has a formula error or a stray control character (a single backslash in a template literal). Every new generator needs this in the same change.

## Question-type explanations

Every question type in `allTypes(mod)` (lecture and problem-set types, concept types included) needs an explanation in `subjects/<slug>/explain/`. The calculation lightbox shows its idea and common mistakes next to the steps; concept questions show the whole explanation. Whenever you add a question type, add its explanation in the same change; `tests/explain.test.ts` fails for any type without one.

- Write it with the `ex` template from `lib/explain.ts`: sections `@task`, `@idea`, `@steps` (numbered list), `@example`, `@solution` (numbered list), `@answer`, `@pitfalls` (bullet list). Markdown with `$…$` formulas, `| tables |` and `~~~` code blocks; `\`` gives an inline-code backtick, `\$` a literal dollar sign.
- The worked example uses fixed numbers in the exact format of the generated question; compute every number, do not estimate. Keep € amounts outside formulas (KaTeX has no € glyph).
- A problem-set type that practises the same calculation as a lecture type maps to it by key (`'PS2.rating': 'L2.riskyDebt'`); give it its own explanation when the task differs.

## Conventions

- Design: sharp glass over a graph-paper background (a fixed `body::before` layer). Sidebar and top bar sit flush to the window; surfaces use `--glass-fill`/`--glass-dense`, a hairline `--shadow` and small radii (`--r-lg` 8 px); buttons are rectangular, no pills or soft drop shadows. Only the chrome and top-level surfaces are in the shared `backdrop-filter` list at the top of `app/globals.css`; rows inside a surface are separated by rules, not boxed again. Content goes up to `--content` wide, running text stays at `--measure`. Secondary note actions are icons that appear on hover or focus; loading uses `.skel` placeholders. Schibsted Grotesk (`--display`) for headings, Instrument Sans for text. Chrome and content share one `--gutter`, so edges line up. One accent (`--accent` and its tokens, blue by default; users pick another under Account → Display, set as `data-accent` on `<html>`) for primary actions, the active nav item and charts; never hard-code accent colours, in SVG use `style={{ stroke: 'var(--accent)' }}`. Green/red only for feedback. Font sizes are written `calc(Npx * var(--fs))` so the text-size setting scales them. No stat tiles, no uppercase tracked labels, no decorative badges. The logo is `components/Logo.tsx`, nav icons are `components/Icons.tsx`. No layout shifts: reserve space for feedback and counters, round SVG coordinates so server and client markup match.
- Screens narrower than 1024 px get a notice instead of the app.
- Display preferences (text size, accent, decimal separator, decimals) live in `public.user_prefs` and a `learn-prefs` cookie that the root layout reads (`lib/prefs.ts`, `components/Prefs.tsx`). There is no per-subject settings page: question types are chosen on the Practice page (`?pick=1`), new cards per day on the Flashcards page.
- Writes go through RLS as the signed-in user; `record_attempt` updates attempts and type statistics in one call; `study_activity`, `reset_subject_stats` and `reset_all_stats` back the account page.
- Do not edit `supabase/setup.sql` or the content migration by hand; regenerate them.
- Slides: PDFs live in the private Storage bucket `slides`; only the admin (`public.is_admin()`, email set in `supabase/migrations/20261030000000_slides_cheatsheets.sql`) uploads. Notes (`slide_notes`, read via `slide_notes_view`) are per slide or, with `deck_id` null, per subject. The pdf.js worker is copied to `public/vendor` on install.
- Slide extras: notes may carry a pin (`x`, `y` as fractions of the slide), stars are private per slide (`slide_stars`); `components/Pdf.tsx` has the shared PDF loader, page canvas and fit box.
- The note/cheatsheet editor (`components/TexEditor.tsx`) turns `/cmd` or `\cmd` into the symbol from `lib/texinput.ts` and opens MathLive (`components/FormulaField.tsx`) for formulas, which it stores as `$…$` in the text.
- User text (notes, cheatsheet entries) is rendered only through `lib/rich.ts` (escaped Markdown subset + KaTeX with trust off); never insert it as raw HTML.
