import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { analyze, loadImage, photoSource, type Analysis } from '../vision/trace';
import type { SketchSource } from '../lib/types';

interface Props {
  image: string; // data URL
  kind: 'photo' | 'import' | 'ai';
  defaultTitle: string;
  onUse: (s: SketchSource) => void;
}

/** Shows original vs. cleaned-up image and lets her tweak cleanup before starting. */
export function PhotoPrep({ image, kind, defaultTitle, onUse }: Props) {
  const [removeBackground, setRemoveBackground] = useState(true);
  const [boostContrast, setBoostContrast] = useState(true);
  const [title, setTitle] = useState(defaultTitle);
  const [a, setA] = useState<Analysis | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    setA(null);
    loadImage(image)
      .then((img) => {
        // Let the spinner paint before the (synchronous) analysis runs.
        setTimeout(() => alive && setA(analyze(img, { removeBackground, boostContrast })), 30);
      })
      .catch((e) => setErr(String(e.message ?? e)));
    return () => { alive = false; };
  }, [image, removeBackground, boostContrast]);

  if (err) return <p className="error">{err}</p>;
  return (
    <div className="prep">
      <div className="prep-images">
        <figure>
          <img src={image} alt="Original" />
          <figcaption>Original</figcaption>
        </figure>
        <figure>
          {a ? <img src={a.cleaned} alt="Cleaned up" /> : <div className="spinner" aria-label="Working…" />}
          <figcaption>
            Cleaned up
            {a && removeBackground && !a.maskValid && <span className="hint"> · background too busy to remove, using the whole photo</span>}
          </figcaption>
        </figure>
      </div>
      <div className="prep-options">
        <label className="toggle"><input type="checkbox" checked={removeBackground} onChange={(e) => setRemoveBackground(e.target.checked)} /><span>Remove background</span></label>
        <label className="toggle"><input type="checkbox" checked={boostContrast} onChange={(e) => setBoostContrast(e.target.checked)} /><span>Boost contrast</span></label>
        <label className="field">
          <span>Name your sketch</span>
          <input type="text" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
        </label>
      </div>
      <button className="btn btn-primary btn-big" disabled={!a} onClick={() => a && onUse(photoSource(a, title.trim() || defaultTitle, kind))}>
        <Pencil size={20} /> Turn into steps
      </button>
    </div>
  );
}
