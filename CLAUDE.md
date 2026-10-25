# Notes for working on this repository

Next.js 16 (App Router, `proxy.ts` instead of middleware, async `params`) + Supabase. UI language is English. Read `node_modules/next/dist/docs/` before using Next.js APIs you are unsure about.

## Adding a subject

New subjects are code modules plus seed content. Follow the exam-practice-builder rules: procedural generators only, solutions computed from the same inputs, 2% tolerance, comma and point input, each family and type selectable.

1. Create `subjects/<slug>/`:
   - `generators.ts`: one exported function per question type returning `Question` (use `lib/engine/gen-helpers.ts`: `Q`, `N`, `C`, `chooseParts`, `co`, `rstep` …). Redraw invalid parameter sets in a loop rather than accepting them.
   - `concepts.ts`: `BANK: ConceptBank` with `T` (true statements), `F` (false statements) and `MC` (question, correct variants, distractors) per topic, plus topic names.
   - `cards.ts`: official flashcards with stable `key`s.
   - `FormulaSheet.tsx`: exactly the sheet handed out in the exam.
   - `theory/`: one client component per topic (steps, formulas, a `Lab` with sliders, worked example, `.pitfall` blocks, `<TheoryQuiz topic=… />`), registered in `theory/index.ts`.
   - `index.ts`: the `SubjectModule` (topics, types with weights, `typeKeyOf`, optional `mock` spec with the real paper's structure).
2. Register the module in `subjects/index.ts`.
3. Add the subject, its trimester, bank and deck to `scripts/build-seed.ts`, run `npm run seed:sql`, and run the new content migration (or `supabase/setup.sql`) in Supabase.
4. Extend `tests/engine.test.ts` so every new generator runs a few hundred times with finite answers, then `npm test` and `npm run build`.

## Conventions

- Design: serif (Source Serif 4) for content, IBM Plex Sans for interface text; black on white, thin rules, square corners, green/red only for feedback. No layout shifts: reserve space for feedback and counters, round SVG coordinates so server and client markup match.
- Screens narrower than 1024 px get a notice instead of the app.
- Writes go through RLS as the signed-in user; `record_attempt` updates attempts, type statistics and the review schedule in one call.
- Do not edit `supabase/setup.sql` or the content migration by hand; regenerate them.
