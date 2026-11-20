import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Eye, KeyRound, Monitor, MonitorOff, PenLine, Plus, Printer, SlidersHorizontal, X } from 'lucide-react';
import { generate, type GenSpec } from './generator';
import { buildSteps } from './lib/steps';
import type { SketchSource } from './lib/types';
import { useStored } from './hooks/useStored';
import { useWakeLock } from './hooks/useWakeLock';
import { StepCanvas } from './components/StepCanvas';
import { ControlsPanel, type Settings } from './components/ControlsPanel';
import { SourceHub, type HubTab } from './components/SourceHub';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Scratchpad } from './components/Scratchpad';
import { PrintSheet } from './components/PrintSheet';
import { readFile } from './components/ImportPanel';

const DEFAULT_SETTINGS: Settings = { level: 3, steps: 8, highlight: true, highlightColor: '#ff6f61', showGuides: true, animate: true };
const DEFAULT_SPEC: GenSpec = { categoryId: 'animals', subjectId: 'cat', seed: 7 };

export default function App() {
  const [settings, setSettings] = useStored<Settings>('hadsi.settings', DEFAULT_SETTINGS);
  const [stored, setStored] = useStored<{ spec: GenSpec }>('hadsi.last', { spec: DEFAULT_SPEC });
  const [source, setSource] = useState<SketchSource>(() => generate(stored.spec));
  const [idx, setIdx] = useState(0);
  const [hub, setHub] = useState<{ tab: HubTab; image?: string | null } | null>(null);
  const [keyOpen, setKeyOpen] = useState(false);
  const [padOpen, setPadOpen] = useState(false);
  const [tuneOpen, setTuneOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const wake = useWakeLock();

  const strokes = useMemo(() => source.strokesFor(settings.level), [source, settings.level]);
  const steps = useMemo(() => buildSteps(strokes, settings.steps), [strokes, settings.steps]);
  const last = Math.max(0, steps.length - 1);
  const cur = Math.min(idx, last);
  const step = steps[cur];

  const go = useCallback((d: number) => setIdx((i) => Math.max(0, Math.min(last, Math.min(i, last) + d))), [last]);

  const startSketch = (s: SketchSource, spec?: GenSpec) => {
    setSource(s);
    setIdx(0);
    setHub(null);
    setPeek(false);
    if (spec) setStored({ spec });
  };

  // Keyboard: ← → Space (Shift+Space = back), Home/End.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (hub || keyOpen) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowRight' || (e.key === ' ' && !e.shiftKey) || e.key === 'PageDown') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft' || (e.key === ' ' && e.shiftKey) || e.key === 'PageUp') { e.preventDefault(); go(-1); }
      else if (e.key === 'Home') setIdx(0);
      else if (e.key === 'End') setIdx(last);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, last, hub, keyOpen]);

  // Clicking a button shouldn't leave it focused, so Space always means "next step".
  useEffect(() => {
    const blur = () => {
      const a = document.activeElement as HTMLElement | null;
      if (a?.tagName === 'BUTTON') a.blur();
    };
    document.addEventListener('pointerup', blur);
    return () => document.removeEventListener('pointerup', blur);
  }, []);

  // Drop an image anywhere to import it.
  useEffect(() => {
    const over = (e: DragEvent) => { if (e.dataTransfer?.types.includes('Files')) e.preventDefault(); };
    const drop = async (e: DragEvent) => {
      const f = e.dataTransfer?.files?.[0];
      if (!f || !f.type.startsWith('image/')) return;
      e.preventDefault();
      setHub({ tab: 'import', image: await readFile(f) });
    };
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    return () => { window.removeEventListener('dragover', over); window.removeEventListener('drop', drop); };
  }, []);

  // Swipe on the stage.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: RPointerEvent) => { if (e.pointerType !== 'mouse') swipe.current = { x: e.clientX, y: e.clientY }; };
  const onUp = (e: RPointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  const finishedStyle = { ...settings, highlight: false, showGuides: false, animate: false, finished: true };
  const reference = (
    <div className="reference">
      <p className="control-label">Finished picture</p>
      <div className="reference-img paper">
        {source.reference ? <img src={source.reference} alt="Cleaned-up reference photo" /> : <StepCanvas steps={steps} upto={last} width={source.width} height={source.height} frame={source.frame} style={finishedStyle} title="Finished drawing" />}
      </div>
    </div>
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="./favicon.svg" alt="" width={32} height={32} />
          <span className="brand-name">Hadsi Sketch</span>
        </div>
        <h1 className="sketch-title" title={source.title}>{source.title}</h1>
        <nav className="actions">
          <button className="btn btn-primary" aria-label="New Sketch" onClick={() => setHub({ tab: 'generate' })}><Plus size={20} /><span className="lbl">New Sketch</span></button>
          <button className="btn tune-btn" aria-label="Tune" onClick={() => setTuneOpen((o) => !o)} aria-expanded={tuneOpen}><SlidersHorizontal size={20} /><span className="lbl">Tune</span></button>
          <button className={`btn ${padOpen ? 'on' : ''}`} aria-label="Scratchpad" onClick={() => setPadOpen((o) => !o)} aria-pressed={padOpen}><PenLine size={20} /><span className="lbl">Scratchpad</span></button>
          <button
            className={`btn ${wake.active ? 'on' : ''}`}
            onClick={wake.toggle}
            aria-pressed={wake.wanted}
            aria-label="Keep screen awake"
            disabled={!wake.supported}
            title={wake.supported ? 'Keep the screen from going to sleep' : 'Keep Awake isn’t supported in this browser'}
          >
            {wake.active ? <Monitor size={20} /> : <MonitorOff size={20} />}
            <span className="lbl">{wake.active ? 'Awake: On' : 'Keep Awake'}</span>
          </button>
          <button className="btn" aria-label="Print step sheet" onClick={() => window.print()}><Printer size={20} /><span className="lbl">Print</span></button>
          <button className="icon-btn" onClick={() => setKeyOpen(true)} aria-label="AI key settings" title="Bring your own AI key"><KeyRound size={20} /></button>
        </nav>
      </header>

      <main className="workspace">
        <section className="stage" onPointerDown={onDown} onPointerUp={onUp} aria-live="polite">
          <div className="stage-paper paper">
            {steps.length ? (
              <StepCanvas
                key={source.id}
                className="stage-svg"
                steps={steps}
                upto={peek ? last : cur}
                width={source.width}
                height={source.height}
                frame={source.frame}
                style={peek ? finishedStyle : settings}
              />
            ) : (
              <p className="empty">Nothing to draw yet – try a higher detail level.</p>
            )}
            <div className="step-badge">
              {peek ? 'Finished picture' : <>Step <b>{cur + 1}</b> of {steps.length}</>}
            </div>
            {!peek && cur === last && steps.length > 0 && <div className="done-badge">🎉 Last step – you did it!</div>}
            <button className={`peek-btn ${peek ? 'on' : ''}`} onClick={() => setPeek((p) => !p)} aria-pressed={peek}>
              {peek ? <X size={18} /> : <Eye size={18} />} {peek ? 'Back to steps' : 'Peek at finished'}
            </button>
          </div>
        </section>

        <aside className={`side ${tuneOpen ? 'open' : ''}`}>
          <div className="side-head">
            <h2>Tune your guide</h2>
            <button className="icon-btn" onClick={() => setTuneOpen(false)} aria-label="Close"><X size={22} /></button>
          </div>
          <ControlsPanel settings={settings} onChange={setSettings} actualSteps={steps.length} reference={reference} />
        </aside>
      </main>

      <footer className="navbar">
        <button className="nav-btn" onClick={() => go(-1)} disabled={cur === 0} aria-label="Previous step">
          <ChevronLeft size={34} /><span className="lbl">Back</span>
        </button>
        <div className="nav-info">
          <div className="dots" aria-hidden>
            {steps.map((_, i) => (
              <button key={i} className={`dot ${i === cur ? 'on' : i < cur ? 'done' : ''}`} onClick={() => setIdx(i)} tabIndex={-1} />
            ))}
          </div>
          <p className="nav-title">{step?.title ?? ''}</p>
          <p className="nav-tip">{step?.tip ?? ''}</p>
        </div>
        <button className="nav-btn nav-next" onClick={() => go(1)} disabled={cur >= last} aria-label="Next step">
          <span className="lbl">Next</span><ChevronRight size={34} />
        </button>
      </footer>

      <Scratchpad open={padOpen} onClose={() => setPadOpen(false)} steps={steps} upto={cur} width={source.width} height={source.height} frame={source.frame} />
      <PrintSheet title={source.title} steps={steps} width={source.width} height={source.height} frame={source.frame} level={settings.level} style={settings} reference={source.reference} />

      {hub && (
        <SourceHub
          tab={hub.tab}
          importImage={hub.image}
          lastSpec={stored.spec}
          onClose={() => setHub(null)}
          onUse={startSketch}
          onOpenKey={() => setKeyOpen(true)}
        />
      )}
      {keyOpen && <ApiKeyModal onClose={() => setKeyOpen(false)} />}
    </div>
  );
}
