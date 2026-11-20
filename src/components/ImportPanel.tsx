import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { PhotoPrep } from './PhotoPrep';
import type { SketchSource } from '../lib/types';

export const readFile = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(f);
  });

const OK = ['image/png', 'image/jpeg', 'image/webp'];

export function ImportPanel({ onUse, initial }: { onUse: (s: SketchSource) => void; initial?: string | null }) {
  const [img, setImg] = useState<string | null>(initial ?? null);
  const [name, setName] = useState('My Picture');
  const [over, setOver] = useState(false);
  const [err, setErr] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const take = async (f?: File | null) => {
    if (!f) return;
    if (!OK.includes(f.type)) { setErr('Please choose a PNG, JPG or WebP image.'); return; }
    setErr('');
    setName(f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 40) || 'My Picture');
    setImg(await readFile(f));
  };

  if (img) {
    return (
      <div>
        <PhotoPrep key={img} image={img} kind="import" defaultTitle={name} onUse={onUse} />
        <button className="btn" onClick={() => setImg(null)}>Choose a different image</button>
      </div>
    );
  }
  return (
    <div
      className={`dropzone ${over ? 'over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setOver(false); take(e.dataTransfer.files[0]); }}
      onClick={() => input.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
    >
      <ImagePlus size={48} aria-hidden />
      <p><strong>Drop an image here</strong> or tap to choose one</p>
      <p className="hint">PNG, JPG or WebP · it never leaves your device</p>
      {err && <p className="error">{err}</p>}
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => take(e.target.files?.[0])} />
    </div>
  );
}
