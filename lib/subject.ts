import type { ComponentType } from 'react';
import type { ConceptBank, GenCtx, Question, Topic, TypeDef } from './engine/types';
import type { ExplainMap } from './explain';

export type MockPart = { title: string; pts: number; note?: string; qs: Question[] };
export type MockExam = { parts: MockPart[] };

export type MockSpec = {
  minutes: number;
  maxPts: number;
  /** Rules shown above the paper, as in the real exam. */
  intro: string[];
  build: (ctx: GenCtx) => MockExam;
  /** Grade equivalent for a score, e.g. "14.2 / 20". */
  grade?: (score: number) => string;
};

export type TheoryPage = {
  slug: string;
  title: string;
  topic: string;
  /** Question type keys whose wrong answers link here. */
  types: string[];
  Component: ComponentType;
};

/** A question type of a problem set; `fromPs` is false for lecture content the problem set leaves out. */
export type PsType = TypeDef & { fromPs: boolean };
export type ProblemSet = {
  id: string; title: string; topic: string; types: PsType[];
  /** Heading prefix, "Problem set 1" by default. */
  label?: string;
  /** Where the `fromPs` types come from, "the problem set" by default. */
  source?: string;
};

/** Entry of a suggested exam cheatsheet: Markdown with $…$ formulas, rendered by lib/rich.ts. `topic` is a lecture id, null for general. */
export type SheetBlock = { topic: string | null; title: string; body: string };

export type SubjectModule = {
  slug: string;
  name: string;
  short: string;
  /** Relative answer tolerance, shown in the settings. */
  tolerance: number;
  topics: Topic[];
  types: TypeDef[];
  /** Maps a generated question's key (e.g. "L1.tf") to the type it counts toward ("L1.concept"). */
  typeKeyOf: (fam: string) => string;
  mock?: MockSpec;
  /** Questions in the format of the problem sets, practised on their own page. */
  problemSets?: ProblemSet[];
  FormulaSheet: ComponentType;
  /** Suggested cheatsheet for the exam (one A4 sheet, front and back), printable or copied entry by entry. */
  cheatsheet?: SheetBlock[];
  theory: TheoryPage[];
  /** One explanation with a worked example for every type in `allTypes`, opened from a wrong answer. */
  explain: ExplainMap;
  answerNote: string;
};

export type { ConceptBank };

/** Lecture types plus problem-set types, for review, statistics and look-ups by key. */
export const allTypes = (m: SubjectModule): TypeDef[] => [...m.types, ...(m.problemSets || []).flatMap(p => p.types)];
