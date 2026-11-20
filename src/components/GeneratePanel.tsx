import { useMemo, useState } from 'react';
import { Dices, KeyRound, Pencil, Sparkles } from 'lucide-react';
import { CATEGORIES, generate, type GenSpec } from '../generator';
import { buildSteps } from '../lib/steps';
import { newSeed } from '../lib/rng';
import { generateAiImage, loadAi } from '../lib/ai';
import type { SketchSource } from '../lib/types';
import { StepCanvas } from './StepCanvas';
import { PhotoPrep } from './PhotoPrep';

const PREVIEW_STYLE = { highlight: false, highlightColor: '#ff6f61', showGuides: false, animate: false, finished: true };

interface Props {
  initial?: GenSpec;
  onUse: (s: SketchSource, spec?: GenSpec) => void;
  onOpenKey: () => void;
}

export function GeneratePanel({ initial, onUse, onOpenKey }: Props) {
  const [catId, setCatId] = useState(initial?.categoryId ?? CATEGORIES[0].id);
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [seed, setSeed] = useState(() => newSeed());
  const cat = CATEGORIES.find((c) => c.id === catId)!;
  const src = useMemo(() => generate({ categoryId: catId, subjectId, seed }), [catId, subjectId, seed]);
  const preview = useMemo(() => buildSteps(src.strokesFor(4), 1), [src]);

  const ai = loadAi();
  const [idea, setIdea] = useState('');
  const [busy, setBusy] = useState(false);
  const [aiErr, setAiErr] = useState('');
  const [aiImg, setAiImg] = useState<string | null>(null);

  const runAi = async () => {
    if (!ai || !idea.trim()) return;
    setBusy(true);
    setAiErr('');
    try {
      setAiImg(await generateAiImage(ai, idea.trim()));
    } catch (e) {
      setAiErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (aiImg) {
    return (
      <div>
        <PhotoPrep image={aiImg} kind="ai" defaultTitle={idea.trim() || 'AI Idea'} onUse={(s) => onUse(s)} />
        <button className="btn" onClick={() => setAiImg(null)}>Back to ideas</button>
      </div>
    );
  }

  return (
    <div className="generate">
      <div className="categories" role="tablist" aria-label="Categories">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={c.id === catId}
            className={`cat ${c.id === catId ? 'on' : ''}`}
            onClick={() => { setCatId(c.id); setSubjectId(undefined); setSeed(newSeed()); }}
          >
            <span className="cat-emoji" aria-hidden>{c.emoji}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      <div className="chips" aria-label="Subject">
        <button className={`chip ${!subjectId ? 'on' : ''}`} onClick={() => { setSubjectId(undefined); setSeed(newSeed()); }}>Surprise me</button>
        {cat.subjects.map((s) => (
          <button key={s.id} className={`chip ${subjectId === s.id ? 'on' : ''}`} onClick={() => { setSubjectId(s.id); setSeed(newSeed()); }}>{s.name}</button>
        ))}
      </div>

      <div className="idea">
        <div className="idea-preview paper">
          <StepCanvas steps={preview} upto={0} width={src.width} height={src.height} frame={src.frame} style={PREVIEW_STYLE} title={src.title} />
        </div>
        <div className="idea-side">
          <p className="idea-label">Today’s drawing idea</p>
          <h3 className="idea-title">{src.title}</h3>
          <button className="btn btn-big" onClick={() => setSeed(newSeed())}><Dices size={22} /> New idea</button>
          <button className="btn btn-primary btn-big" onClick={() => onUse(src, src.spec)}><Pencil size={22} /> Start drawing</button>
        </div>
      </div>

      <details className="ai-box" open={!!ai}>
        <summary><Sparkles size={16} /> AI picture generator (optional)</summary>
        {ai ? (
          <div className="row">
            <input type="text" className="grow" placeholder="Describe an idea, e.g. a hedgehog playing guitar" value={idea} onChange={(e) => setIdea(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runAi()} />
            <button className="btn btn-primary" disabled={busy || !idea.trim()} onClick={runAi}>{busy ? 'Creating…' : 'Generate'}</button>
            <button className="btn" onClick={onOpenKey}><KeyRound size={16} /> Key</button>
          </div>
        ) : (
          <p>
            Built-in ideas never need a key. To connect your own AI image service, <button className="link" onClick={onOpenKey}>add an API key</button>.
          </p>
        )}
        {aiErr && <p className="error">Couldn’t create that picture: {aiErr}</p>}
      </details>
    </div>
  );
}
