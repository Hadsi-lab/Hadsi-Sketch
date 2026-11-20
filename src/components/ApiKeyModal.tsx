import { useState } from 'react';
import { KeyRound, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { DEFAULT_AI, clearAi, loadAi, saveAi } from '../lib/ai';

export function ApiKeyModal({ onClose }: { onClose: () => void }) {
  const [cfg, setCfg] = useState(loadAi() ?? DEFAULT_AI);
  const [saved, setSaved] = useState(!!loadAi());
  return (
    <Modal title="Bring your own AI key (optional)" onClose={onClose}>
      <div className="form">
        <p>
          Hadsi Sketch works fully without this. If a grown-up has an API key for an OpenAI-compatible image generator, add it here to turn typed ideas into
          pictures.
        </p>
        <p className="notice">
          <KeyRound size={16} aria-hidden /> The key is saved only in <strong>this browser’s local storage</strong>. It is sent straight to the service below when you press
          Generate, and never to any Hadsi Sketch server (there isn’t one).
        </p>
        <label className="field">
          <span>Image API endpoint</span>
          <input type="url" value={cfg.endpoint} onChange={(e) => setCfg({ ...cfg, endpoint: e.target.value })} />
        </label>
        <label className="field">
          <span>Model</span>
          <input type="text" value={cfg.model} onChange={(e) => setCfg({ ...cfg, model: e.target.value })} />
        </label>
        <label className="field">
          <span>API key</span>
          <input type="password" autoComplete="off" value={cfg.apiKey} placeholder="sk-…" onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })} />
        </label>
        <div className="row">
          <button className="btn btn-primary" disabled={!cfg.apiKey.trim()} onClick={() => { saveAi({ ...cfg, apiKey: cfg.apiKey.trim() }); setSaved(true); onClose(); }}>
            Save key
          </button>
          {saved && (
            <button className="btn" onClick={() => { clearAi(); setCfg(DEFAULT_AI); setSaved(false); }}>
              <Trash2 size={16} /> Remove key
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
