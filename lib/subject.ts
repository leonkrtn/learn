import type { ComponentType } from 'react';
import type { ConceptBank, GenCtx, Question, Topic, TypeDef } from './engine/types';

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
  FormulaSheet: ComponentType;
  theory: TheoryPage[];
  answerNote: string;
};

export type { ConceptBank };
