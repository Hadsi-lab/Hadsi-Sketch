export type Layer = 'guide' | 'shape' | 'connector' | 'silhouette' | 'detail' | 'shading';

export const LAYER_ORDER: Layer[] = ['guide', 'shape', 'connector', 'silhouette', 'detail', 'shading'];

/** Default minimum fidelity level at which each layer appears. */
export const LAYER_MIN_LEVEL: Record<Layer, number> = {
  guide: 1,
  shape: 1,
  connector: 2,
  silhouette: 2,
  detail: 3,
  shading: 4,
};

export interface Stroke {
  d: string;
  layer: Layer;
  /** Lowest fidelity level (1–5) that shows this stroke. Defaults per layer. */
  minLevel?: number;
  /** Highest fidelity level that shows this stroke (used for swaps). */
  maxLevel?: number;
  /** Relative line weight multiplier. */
  weight?: number;
}

export type SourceKind = 'generated' | 'photo' | 'import' | 'ai';

export interface SketchSource {
  id: string;
  title: string;
  kind: SourceKind;
  width: number;
  height: number;
  /** Cleaned-up reference image (data URL) for photo-based sketches. */
  reference?: string;
  /** Region of interest [x, y, w, h] to zoom into (defaults to the full canvas). */
  frame?: [number, number, number, number];
  strokesFor(level: number): Stroke[];
}

export interface Step {
  strokes: Stroke[];
  layers: Layer[];
  title: string;
  tip: string;
}
