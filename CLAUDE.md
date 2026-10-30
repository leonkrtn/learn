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

- Design: sharp glass over a graph-paper background (a fixed `body::before` layer). Sidebar and top bar sit flush to the window; surfaces use `--glass-fill`/`--glass-dense`, a hairline `--shadow` and small radii (`--r-lg` 8 px); buttons are rectangular, no pills or soft drop shadows. Only the chrome and top-level surfaces are in the shared `backdrop-filter` list at the top of `app/globals.css`; rows inside a surface are separated by rules, not boxed again. Content goes up to `--content` wide, running text stays at `--measure`. Secondary note actions are icons that appear on hover or focus; loading uses `.skel` placeholders. Schibsted Grotesk (`--display`) for headings, Instrument Sans for text. Chrome and content share one `--gutter`, so edges line up. One blue accent (`--accent`) for primary actions, the active nav item and charts; green/red only for feedback. No stat tiles, no uppercase tracked labels, no decorative badges. The logo is `components/Logo.tsx`, nav icons are `components/Icons.tsx`. No layout shifts: reserve space for feedback and counters, round SVG coordinates so server and client markup match.
- Screens narrower than 1024 px get a notice instead of the app.
- Writes go through RLS as the signed-in user; `record_attempt` updates attempts, type statistics and the review schedule in one call.
- Do not edit `supabase/setup.sql` or the content migration by hand; regenerate them.
- Slides: PDFs live in the private Storage bucket `slides`; only the admin (`public.is_admin()`, email set in `supabase/migrations/20261030000000_slides_cheatsheets.sql`) uploads. Notes (`slide_notes`, read via `slide_notes_view`) are per slide or, with `deck_id` null, per subject. The pdf.js worker is copied to `public/vendor` on install.
- Slide extras: notes may carry a pin (`x`, `y` as fractions of the slide), stars are private per slide (`slide_stars`); `components/Pdf.tsx` has the shared PDF loader, page canvas and fit box.
- The note/cheatsheet editor (`components/TexEditor.tsx`) turns `/cmd` or `\cmd` into the symbol from `lib/texinput.ts` and opens MathLive (`components/FormulaField.tsx`) for formulas, which it stores as `$…$` in the text.
- User text (notes, cheatsheet entries) is rendered only through `lib/rich.ts` (escaped Markdown subset + KaTeX with trust off); never insert it as raw HTML.
