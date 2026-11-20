import { line, mirror, roundRect, type Pt } from '../lib/geometry';
import type { Layer, Stroke } from '../lib/types';
import type { Rng } from '../lib/rng';

interface AddOpts { min?: number; max?: number; w?: number }

/** Collects strokes for a procedural illustration, tagged by construction layer. */
export class SB {
  strokes: Stroke[] = [];
  /** Bounding box from guides(): [x, y, w, h]. */
  frame?: [number, number, number, number];

  add(layer: Layer, d: string | string[], o: AddOpts = {}): this {
    for (const p of Array.isArray(d) ? d : [d]) {
      if (p) this.strokes.push({ d: p, layer, minLevel: o.min, maxLevel: o.max, weight: o.w });
    }
    return this;
  }

  /** Bounding box + centre/proportion lines. */
  guides(x: number, y: number, w: number, h: number, o: { sym?: number; lines?: number[] } = {}): this {
    this.frame = [x, y, w, h];
    this.add('guide', roundRect(x, y, w, h, 6));
    const cx = o.sym ?? x + w / 2;
    this.add('guide', line(cx, y - 12, cx, y + h + 12));
    for (const hy of o.lines ?? []) this.add('guide', line(x - 12, hy, x + w + 12, hy));
    return this;
  }

  shape(...d: string[]) { return this.add('shape', d); }
  conn(...d: string[]) { return this.add('connector', d); }
  sil(...d: string[]) { return this.add('silhouette', d); }
  det(min: number, ...d: string[]) { return this.add('detail', d, { min }); }

  /** Shading hatch: lighter at level 4, denser at level 5. */
  shade(fn: (spacing: number) => string, base = 11): this {
    this.add('shading', fn(base), { min: 4, max: 4 });
    this.add('shading', fn(base * 0.6), { min: 5 });
    return this;
  }
  /** Extra cross-hatch for the darkest areas (level 5 only). */
  cross(fn: (spacing: number) => string, base = 7): this {
    return this.add('shading', fn(base), { min: 5 });
  }
}

export const M = (pts: Pt[], cx = 200) => mirror(pts, cx);
export const mx = (x: number, cx = 200) => 2 * cx - x;

export interface Built { title: string; strokes: Stroke[]; frame?: [number, number, number, number] }

export interface Subject {
  id: string;
  name: string;
  build(r: Rng): Built;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  subjects: Subject[];
}

/** Helper to build a title from optional variant words. */
export const titleOf = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');
