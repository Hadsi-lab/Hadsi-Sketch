import { filterForLevel } from '../lib/steps';
import { mulberry32, pick } from '../lib/rng';
import type { SketchSource } from '../lib/types';
import { animals } from './animals';
import { fantasy } from './fantasy';
import { food } from './food';
import { fashion } from './fashion';
import { vehicles } from './vehicles';
import type { Category } from './builder';

export const CATEGORIES: Category[] = [animals, fantasy, food, fashion, vehicles];
export type { Category };

export interface GenSpec { categoryId: string; subjectId?: string; seed: number }

export function generate(spec: GenSpec): SketchSource & { spec: Required<GenSpec> } {
  const cat = CATEGORIES.find((c) => c.id === spec.categoryId) ?? CATEGORIES[0];
  const r = mulberry32(spec.seed);
  const subject = cat.subjects.find((s) => s.id === spec.subjectId) ?? pick(r, cat.subjects);
  const built = subject.build(r);
  return {
    id: `gen-${cat.id}-${subject.id}-${spec.seed}`,
    title: built.title,
    kind: 'generated',
    width: 400,
    height: 400,
    frame: built.frame,
    strokesFor: (level) => filterForLevel(built.strokes, level),
    spec: { categoryId: cat.id, subjectId: subject.id, seed: spec.seed },
  };
}
