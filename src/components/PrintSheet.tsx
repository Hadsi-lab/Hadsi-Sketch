import type { Step } from '../lib/types';
import { LEVEL_NAMES } from '../lib/steps';
import { StepCanvas, type CanvasStyle } from './StepCanvas';

interface Props {
  title: string;
  steps: Step[];
  width: number;
  height: number;
  frame?: [number, number, number, number];
  level: number;
  style: CanvasStyle;
  reference?: string;
}

/** Hidden on screen; becomes a clean multi-panel reference sheet when printing. */
export function PrintSheet({ title, steps, width, height, frame, level, style, reference }: Props) {
  const printStyle = { ...style, animate: false };
  const finalStyle = { ...style, highlight: false, showGuides: false, animate: false, finished: true };
  return (
    <div className="print-sheet" aria-hidden>
      <header>
        <h1>{title}</h1>
        <p>
          Hadsi Sketch · {steps.length} steps · Detail {level} ({LEVEL_NAMES[level - 1]}) · {new Date().toLocaleDateString()}
        </p>
      </header>
      <div className="print-grid">
        {steps.map((s, i) => (
          <figure key={i} className="print-panel">
            <figcaption><b>{i + 1}</b> {s.title}</figcaption>
            <StepCanvas steps={steps} upto={i} width={width} height={height} frame={frame} style={printStyle} weight={1.3} />
          </figure>
        ))}
        <figure className="print-panel">
          <figcaption><b>★</b> Finished</figcaption>
          {reference ? <img src={reference} alt="" /> : <StepCanvas steps={steps} upto={steps.length - 1} width={width} height={height} frame={frame} style={finalStyle} weight={1.3} />}
        </figure>
      </div>
      <footer>Colored lines = what to draw in that step. Draw guidelines lightly and erase them at the end.</footer>
    </div>
  );
}
