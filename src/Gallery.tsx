// Dev-only: visual QA of every generated subject (open /?gallery while running `npm run dev`).
import { CATEGORIES, generate } from './generator';
import { buildSteps } from './lib/steps';
import { StepCanvas } from './components/StepCanvas';

const STYLE = { highlight: false, highlightColor: '#ff6f61', showGuides: false, animate: false, finished: true };

export default function Gallery() {
  const level = Number(new URLSearchParams(location.search).get('level') ?? 5);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, padding: 8, background: '#fff' }}>
      {CATEGORIES.flatMap((c) =>
        c.subjects.flatMap((s) =>
          [1, 2].map((seed) => {
            const src = generate({ categoryId: c.id, subjectId: s.id, seed });
            const steps = buildSteps(src.strokesFor(level), 1);
            return (
              <figure key={`${s.id}${seed}`} style={{ margin: 0, border: '1px solid #ddd' }}>
                <StepCanvas steps={steps} upto={0} width={400} height={400} style={STYLE} />
                <figcaption style={{ fontSize: 11 }}>{src.title}</figcaption>
              </figure>
            );
          }),
        ),
      )}
    </div>
  );
}
