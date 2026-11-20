import { memo } from 'react';
import type { Layer, Step } from '../lib/types';

export interface CanvasStyle {
  highlight: boolean;
  highlightColor: string;
  showGuides: boolean;
  animate: boolean;
  /** Finished-picture mode: hide guides and construction shapes. */
  finished?: boolean;
}

const WIDTH: Record<Layer, number> = { guide: 1.1, shape: 1.7, connector: 1.6, silhouette: 2.7, detail: 2.0, shading: 1.0 };
const CONSTRUCTION: Layer[] = ['guide', 'shape', 'connector'];

interface Props {
  steps: Step[];
  upto: number;
  width: number;
  height: number;
  /** Optional zoom region [x, y, w, h]. */
  frame?: [number, number, number, number];
  style: CanvasStyle;
  /** Multiplies line widths (thumbnails / print use thinner lines). */
  weight?: number;
  className?: string;
  title?: string;
}

/** Renders steps 0..upto. The current step is colour-highlighted; earlier steps are charcoal. */
function StepCanvasImpl({ steps, upto, width, height, frame, style, weight = 1, className, title }: Props) {
  const [fx, fy, fw, fh] = frame ?? [0, 0, width, height];
  const pad = Math.max(fw, fh) * 0.07;
  // Line widths are relative to the visible region so zoomed drawings keep the same on-screen weight.
  const unit = ((Math.max(fw, fh) + pad * 2) / 430) * weight;
  const hideConstruction = !!style.finished && steps.some((st) => st.strokes.some((k) => !CONSTRUCTION.includes(k.layer)));
  const outlineStarted = steps.slice(0, upto).some((s) => s.layers.includes('silhouette'));
  return (
    <svg
      className={className}
      viewBox={`${fx - pad} ${fy - pad} ${fw + pad * 2} ${fh + pad * 2}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={title ?? `Step ${upto + 1} of ${steps.length}`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {steps.slice(0, upto + 1).map((step, i) => {
        const current = i === upto;
        return (
          <g key={`${i}-${current ? 'cur' : 'old'}`} className={current && style.animate ? 'step-current' : undefined}>
            {step.strokes.map((s, j) => {
              if (s.layer === 'guide' && !style.showGuides) return null;
              if (hideConstruction && CONSTRUCTION.includes(s.layer)) return null;
              const isGuide = s.layer === 'guide';
              let color = 'var(--ink)';
              let opacity = 1;
              if (isGuide) { color = 'var(--guide)'; opacity = 0.9; }
              else if (CONSTRUCTION.includes(s.layer) && outlineStarted && !current) { color = 'var(--construction)'; }
              else if (s.layer === 'shading' && !current) opacity = 0.75;
              if (current && style.highlight) { color = style.highlightColor; opacity = 1; }
              const w = (WIDTH[s.layer] + (current && style.highlight ? 0.5 : 0)) * unit * (s.weight ?? 1);
              const draw = current && style.animate && !isGuide;
              return (
                <path
                  key={j}
                  d={s.d}
                  stroke={color}
                  strokeOpacity={opacity}
                  strokeWidth={w}
                  strokeDasharray={isGuide ? `${6 * unit} ${5 * unit}` : draw ? '1 2' : undefined}
                  pathLength={draw ? 1 : undefined}
                  className={draw ? 'draw-in' : current && style.animate ? 'fade-in' : undefined}
                  style={draw ? { animationDelay: `${Math.min(j * 0.06, 1.2)}s` } : undefined}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export const StepCanvas = memo(StepCanvasImpl);
