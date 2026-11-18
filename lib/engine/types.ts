export type Unit = 'm' | 'eur' | 'pct' | 'msh' | 'msh_w' | 'x' | 'k' | 'bn' | 'n' | 'usd' | 'musd';

/** `key` links a part to the step of `Question.calc` that produces its answer. */
export type NumPart = { type: 'num'; prompt: string; ans: number; unit: Unit; alts?: number[]; abs?: number; key?: string };
export type ChoicePart = { type: 'choice'; prompt: string; options: string[]; correct: number; key?: string };
/** `ans` is the computed number behind a numeric multiple-choice answer. */
export type McPart = { type: 'mc'; options: string[]; correct: number; tf?: boolean; key?: string; ans?: number };
export type Part = NumPart | ChoicePart | McPart;

export type Question = {
  /** Generator key, e.g. "L1.project" or "L1.tf". */
  fam: string;
  /** Topic (lecture) id. */
  topic: string;
  html: string;
  parts: Part[];
  pts?: number;
  /** Worked solution (generator HTML), shown when a question has no `calc`. */
  solution?: string;
  /** The worked calculation with this question's numbers, step by step; parts point to their result step by `key`. */
  calc?: CalcStep[];
};

/**
 * One calculator-level step: Markdown with $…$ formulas (lib/rich.ts), the formula, the numbers put in and every
 * intermediate value. `key` marks the step whose result answers the part with the same key; `value` is that result in
 * the part's units (e.g. 12.5 for 12.5%), checked against the answer by the tests.
 */
export type CalcStep = { md: string; key?: string; value?: number };

export type ConceptMc = { q: string; correct: string[]; distractors: string[] };
export type ConceptTopic = { T: string[]; F: string[]; MC: ConceptMc[] };
export type ConceptBank = Record<string, ConceptTopic>;

export type GenCtx = { bank: ConceptBank };

export type TypeDef = {
  key: string;
  name: string;
  topic: string;
  /** Relative draw weight inside its topic before adaptive weighting. */
  weight: number;
  gen: (ctx: GenCtx) => Question;
};

export type Topic = { id: string; name: string; theory?: string };

/** Answer state for one question: string for numeric inputs, index for choices. */
export type Answers = Record<number, string | number | undefined>;
export type PartResult = { ok: boolean; answered: boolean };
export type Graded = { results: PartResult[]; a: number; c: number };
