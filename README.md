# learn

Exam practice for university courses: generated calculation questions (new firm and new numbers every time), concept questions, a timed mock exam, flashcards on an FSRS schedule with Anki import, and theory pages with interactive models. Next.js on Vercel, Supabase for accounts and progress.

Subjects:

- **Firm Value and Capital Structure (FVCS)**: 26 calculation types and one concept type per lecture across 6 lectures, a 20-point / 120-minute mock exam, 216 concept items and 52 official flashcards.
- **Firm Valuation (FV)**: lectures 1–2 so far (market efficiency, event studies, DDM, H-model, FCFF/FCFE, terminal value, deferred taxes), 11 calculation types, 69 concept items, 28 flashcards. Lectures 3–8 and a mock exam follow once the slides and exam format are available.
- **Financial Investments (FI)**: 6 lectures (CAPM, APT and EMH, performance evaluation, Treynor-Black and Black-Litterman, estimation error, hedge funds), 24 calculation types, 189 concept items, 48 flashcards, and a mock exam with the structure of the 2020 sample exam (26 questions, 100 marks, 120 minutes).

## Setup

### 1. Supabase (once)

1. Open the project's SQL editor and run `supabase/setup.sql`. It creates the tables, row level security, the RPC functions and the FVCS content. Running it again is safe.
2. Authentication → URL Configuration:
   - **Site URL**: your Vercel URL, e.g. `https://learn-xyz.vercel.app`
   - **Redirect URLs**: add `https://learn-xyz.vercel.app/auth/confirm` and `http://localhost:3000/auth/confirm`
3. Authentication → Providers → Email: password sign-in is on by default. With "Confirm email" enabled, new accounts get a link that lands on `/auth/confirm`.

Trimester and subject names live in the `trimesters` and `subjects` tables (`supabase/migrations/20261025000100_content.sql`). Rename "Trimester 1" there or in `scripts/build-seed.ts`.

### 2. Vercel

Import the GitHub repository as a Next.js project and set two environment variables (Production and Preview):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://oemgdhnbmeyjphddmqql.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the publishable key from Supabase → Settings → API |

Both are public by design (row level security protects the data); the code falls back to the values in `.env.example` if they are missing. Pushes to `main` deploy to production, other branches get preview URLs.

### 3. Local development

```bash
npm install          # also copies the sql.js wasm used by the Anki importer to public/vendor
cp .env.example .env.local
npm run dev
npm test             # parser, tolerance, all generators x400, cycle bag, SQL schema in PGlite
npm run lint         # type check
```

## How it works

- **Grading**: answers within 2% count (floor ±0.05 points for percentages, ±0.011 otherwise). Percentages can be typed as `12.5` or `0.125`; decimal comma and point both work (`12,5`, `(1.234,56)`, `1,234.56`).
- **Practice** draws lectures equally often and, inside a lecture, types with a high recent error rate up to four times as often. The same type never comes twice in a row. Every lecture and every type can be switched on or off in Settings.
- **Cycle** asks every type of one lecture once per round in random order.
- **Review due**: a wrong answer schedules that question type again after 1 day; correct answers on due items push it to 3, 7, 16 and 35 days, then it leaves the queue. Every review uses new numbers.
- **Mock exam** follows the real paper, runs a countdown, submits at zero and survives a page reload on the same device.
- **Flashcards** use FSRS (`ts-fsrs`) with Again/Hard/Good/Easy. Imports: `.apkg` (old and new Anki formats, cloze notes), CSV/TSV. Media is not imported; HTML is sanitised. Imported decks are private.
- **Theory** has one page per lecture with steps, formulas, an interactive model, a worked example, common mistakes and three true/false checks from the concept bank. Wrong answers in practice link to the matching page.

## Layout

```
app/                    routes (dashboard, auth, /s/[slug]/… per subject)
components/             UI (Runner, QuestionView, MockExam, Study, Importer, charts)
lib/engine/             parser, grading, adaptive selection, generator helpers, concept questions
lib/cards/              CSV and Anki parsers, HTML sanitiser
subjects/<slug>/        one module per subject: generators, concept bank, cards, formula sheet, theory
supabase/               migrations and setup.sql (generated: npm run seed:sql)
tests/                  node:test suites
```

Adding a subject is described in `CLAUDE.md`.
