import type { ReactNode } from 'react';
import { LEVEL_NAMES } from '../lib/steps';
import type { CanvasStyle } from './StepCanvas';
import { Privacy } from './Privacy';

export interface Settings extends CanvasStyle {
  level: number;
  steps: number;
}

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  actualSteps: number;
  reference?: ReactNode;
}

const COLORS = [
  { name: 'Coral', value: '#ff6f61' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Purple', value: '#9b5de5' },
];

export function ControlsPanel({ settings, onChange, actualSteps, reference }: Props) {
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...settings, [k]: v });
  return (
    <div className="controls">
      <section className="control">
        <label htmlFor="fidelity" className="control-label">
          Sketch detail <strong>{settings.level} · {LEVEL_NAMES[settings.level - 1]}</strong>
        </label>
        <input id="fidelity" type="range" min={1} max={5} step={1} value={settings.level} onChange={(e) => set('level', +e.target.value)} />
        <div className="ticks">{LEVEL_NAMES.map((n, i) => <span key={n} className={i + 1 === settings.level ? 'on' : ''}>{i + 1}</span>)}</div>
        <p className="hint">1 = basic shapes only · 5 = realistic with shading</p>
      </section>

      <section className="control">
        <label htmlFor="steps" className="control-label">
          Number of steps <strong>{settings.steps}</strong>
        </label>
        <input id="steps" type="range" min={3} max={15} step={1} value={settings.steps} onChange={(e) => set('steps', +e.target.value)} />
        <div className="ticks"><span>3 · quick warm-up</span><span>15 · tiny steps</span></div>
        {actualSteps < settings.steps && (
          <p className="hint warn">This picture has {actualSteps} steps at this detail level. Turn up the detail to get more steps.</p>
        )}
      </section>

      <section className="control toggles">
        <label className="toggle">
          <input type="checkbox" checked={settings.highlight} onChange={(e) => set('highlight', e.target.checked)} />
          <span>Highlight new lines</span>
        </label>
        {settings.highlight && (
          <div className="swatches" role="radiogroup" aria-label="Highlight colour">
            {COLORS.map((c) => (
              <button
                key={c.value}
                role="radio"
                aria-checked={settings.highlightColor === c.value}
                aria-label={c.name}
                className={`swatch ${settings.highlightColor === c.value ? 'on' : ''}`}
                style={{ background: c.value }}
                onClick={() => set('highlightColor', c.value)}
              />
            ))}
          </div>
        )}
        <label className="toggle">
          <input type="checkbox" checked={settings.showGuides} onChange={(e) => set('showGuides', e.target.checked)} />
          <span>Show guidelines</span>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={settings.animate} onChange={(e) => set('animate', e.target.checked)} />
          <span>Animate new lines</span>
        </label>
      </section>

      {reference && <section className="control">{reference}</section>}

      <section className="control keys">
        <p><kbd>←</kbd> <kbd>→</kbd> or <kbd>Space</kbd> change steps. You can also swipe the picture.</p>
      </section>

      <Privacy compact />
    </div>
  );
}
