import { LAYER_MIN_LEVEL, LAYER_ORDER, type Layer, type Step, type Stroke } from './types';

export const LEVEL_NAMES = ['Abstract', 'Simple Shapes', 'Stylized', 'Detailed', 'Realistic'];

const LAYER_INFO: Record<Layer, { title: string; tip: string }> = {
  guide: {
    title: 'Light guidelines',
    tip: 'Press very lightly. Draw the box and the centre line so everything ends up the right size and in the right place.',
  },
  shape: {
    title: 'Basic shapes',
    tip: 'Block in the big circles and ovals first. Keep your wrist loose, and draw over a shape a few times until it looks right.',
  },
  connector: {
    title: 'Connect the shapes',
    tip: 'Join the shapes with simple lines and add the smaller parts like ears, legs, tails and handles.',
  },
  silhouette: {
    title: 'Outer outline',
    tip: 'Go around the outside with a confident line. Now you can press a little harder.',
  },
  detail: {
    title: 'Inside details',
    tip: 'Add the features and the inside lines. Start with the biggest ones and move to the smaller ones.',
  },
  shading: {
    title: 'Shading',
    tip: 'Use quick lines that all go the same direction. Add a second layer of lines to make the darkest areas darker.',
  },
};

export function filterForLevel(strokes: Stroke[], level: number): Stroke[] {
  return strokes.filter((s) => {
    const min = s.minLevel ?? LAYER_MIN_LEVEL[s.layer];
    const max = s.maxLevel ?? 5;
    return level >= min && level <= max;
  });
}

interface Group { layers: Layer[]; strokes: Stroke[]; alloc: number }

/**
 * Split strokes into `n` steps. Layers are kept in construction order
 * (guides → shapes → connectors → outline → details → shading). With few steps
 * neighbouring layers are merged; with many steps the busiest layers are split.
 */
export function buildSteps(strokes: Stroke[], n: number): Step[] {
  const groups: Group[] = [];
  for (const layer of LAYER_ORDER) {
    const s = strokes.filter((k) => k.layer === layer);
    if (s.length) groups.push({ layers: [layer], strokes: s, alloc: 1 });
  }
  if (!groups.length) return [];

  while (groups.length > n) {
    let best = 0, bestW = Infinity;
    for (let i = 0; i + 1 < groups.length; i++) {
      const w = groups[i].strokes.length + groups[i + 1].strokes.length;
      if (w < bestW) { bestW = w; best = i; }
    }
    const a = groups[best], b = groups[best + 1];
    groups.splice(best, 2, { layers: [...a.layers, ...b.layers], strokes: [...a.strokes, ...b.strokes], alloc: 1 });
  }

  let remaining = n - groups.length;
  while (remaining > 0) {
    let best = -1, bestRatio = 0;
    groups.forEach((g, i) => {
      if (g.alloc >= g.strokes.length || g.layers[0] === 'guide') return;
      const r = g.strokes.length / g.alloc;
      if (r > bestRatio) { bestRatio = r; best = i; }
    });
    if (best < 0) break;
    groups[best].alloc++;
    remaining--;
  }

  const steps: Step[] = [];
  for (const g of groups) {
    const per = g.strokes.length / g.alloc;
    for (let k = 0; k < g.alloc; k++) {
      const chunk = g.strokes.slice(Math.round(k * per), Math.round((k + 1) * per));
      const layers = g.layers.filter((l) => chunk.some((s) => s.layer === l));
      const main = layers[0] ?? g.layers[0];
      let title = layers.map((l) => LAYER_INFO[l].title).join(' + ');
      if (g.alloc > 1) title += ` (${k + 1} of ${g.alloc})`;
      steps.push({ strokes: chunk, layers, title, tip: LAYER_INFO[main].tip });
    }
  }
  return steps;
}
