export type Unit = 'm' | 'eur' | 'pct' | 'msh' | 'msh_w' | 'x' | 'k' | 'bn';

export type NumPart = { type: 'num'; prompt: string; ans: number; unit: Unit; alts?: number[]; abs?: number };
export type ChoicePart = { type: 'choice'; prompt: string; options: string[]; correct: number };
export type McPart = { type: 'mc'; options: string[]; correct: number; tf?: boolean };
export type Part = NumPart | ChoicePart | McPart;

export type Question = {
  /** Generator key, e.g. "L1.project" or "L1.tf". */
  fam: string;
  /** Topic (lecture) id. */
  topic: string;
  html: string;
  parts: Part[];
  pts?: number;
};

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
