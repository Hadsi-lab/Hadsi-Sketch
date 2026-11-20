import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { Download, Eraser, Layers, Pencil, Trash2, Undo2, X } from 'lucide-react';
import type { Step } from '../lib/types';
import { StepCanvas } from './StepCanvas';

interface Props {
  open: boolean;
  onClose: () => void;
  steps: Step[];
  upto: number;
  width: number;
  height: number;
  frame?: [number, number, number, number];
}

const INKS = ['#2f3542', '#ff6f61', '#3b82f6', '#16a34a'];
const SIZES = [2, 5, 10];
const TRACE_STYLE = { highlight: true, highlightColor: '#ff6f61', showGuides: true, animate: false };

/** Quick Digital Test: a small drawing surface for trying a stroke or tracing the current step. */
export function Scratchpad({ open, onClose, steps, upto, width, height, frame }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ink, setInk] = useState(INKS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [eraser, setEraser] = useState(false);
  const [trace, setTrace] = useState(true);
  const history = useRef<ImageData[]>([]);
  const last = useRef<{ x: number; y: number; p: number } | null>(null);

  const fit = useCallback(() => {
    const c = canvas.current, w = wrap.current;
    if (!c || !w) return;
    const dpr = window.devicePixelRatio || 1;
    const rw = Math.round(w.clientWidth * dpr), rh = Math.round(w.clientHeight * dpr);
    if (!rw || !rh || (c.width === rw && c.height === rh)) return;
    const copy = document.createElement('canvas');
    copy.width = c.width;
    copy.height = c.height;
    if (c.width && c.height) copy.getContext('2d')!.drawImage(c, 0, 0);
    c.width = rw;
    c.height = rh;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(copy, 0, 0);
    history.current = [];
  }, []);

  useEffect(() => {
    if (!open) return;
    fit();
    const ro = new ResizeObserver(fit);
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [open, fit]);

  const pos = (e: RPointerEvent) => {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height, p: e.pressure || 0.5 };
  };

  const down = (e: RPointerEvent) => {
    const c = canvas.current!;
    c.setPointerCapture(e.pointerId);
    const ctx = c.getContext('2d')!;
    history.current.push(ctx.getImageData(0, 0, c.width, c.height));
    if (history.current.length > 25) history.current.shift();
    last.current = pos(e);
    move(e);
  };

  const move = (e: RPointerEvent) => {
    if (!last.current) return;
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const p = pos(e);
    const pressure = e.pointerType === 'pen' ? 0.4 + p.p * 1.2 : 1;
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = ink;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = (eraser ? size * 4 : size) * dpr * pressure;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x + 0.01, p.y);
    ctx.stroke();
    last.current = p;
  };

  const up = () => { last.current = null; };

  const undo = () => {
    const c = canvas.current!;
    const prev = history.current.pop();
    if (prev) c.getContext('2d')!.putImageData(prev, 0, 0);
  };
  const clear = () => {
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    history.current.push(ctx.getImageData(0, 0, c.width, c.height));
    ctx.clearRect(0, 0, c.width, c.height);
  };
  const save = () => {
    const c = canvas.current!;
    const out = document.createElement('canvas');
    out.width = c.width;
    out.height = c.height;
    const ctx = out.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(c, 0, 0);
    const a = document.createElement('a');
    a.href = out.toDataURL('image/png');
    a.download = 'hadsi-sketch-test.png';
    a.click();
  };

  return (
    <aside className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="Quick digital test">
      <header className="drawer-head">
        <h2>Quick Digital Test</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close scratchpad"><X size={22} /></button>
      </header>
      <div className="drawer-tools">
        <button className={`icon-btn ${!eraser ? 'on' : ''}`} onClick={() => setEraser(false)} aria-label="Pencil" title="Pencil"><Pencil size={20} /></button>
        <button className={`icon-btn ${eraser ? 'on' : ''}`} onClick={() => setEraser(true)} aria-label="Eraser" title="Eraser"><Eraser size={20} /></button>
        <span className="sep" />
        {INKS.map((c) => (
          <button key={c} className={`swatch ${ink === c && !eraser ? 'on' : ''}`} style={{ background: c }} aria-label={`Colour ${c}`} onClick={() => { setInk(c); setEraser(false); }} />
        ))}
        <span className="sep" />
        {SIZES.map((s) => (
          <button key={s} className={`icon-btn size ${size === s ? 'on' : ''}`} onClick={() => setSize(s)} aria-label={`Brush size ${s}`}>
            <span style={{ width: s + 4, height: s + 4 }} />
          </button>
        ))}
        <span className="sep" />
        <button className={`icon-btn ${trace ? 'on' : ''}`} onClick={() => setTrace((t) => !t)} aria-label="Trace current step" title="Show current step underneath"><Layers size={20} /></button>
        <button className="icon-btn" onClick={undo} aria-label="Undo" title="Undo"><Undo2 size={20} /></button>
        <button className="icon-btn" onClick={clear} aria-label="Clear" title="Clear"><Trash2 size={20} /></button>
        <button className="icon-btn" onClick={save} aria-label="Save as PNG" title="Save to this device"><Download size={20} /></button>
      </div>
      <div className="drawer-canvas paper" ref={wrap}>
        {trace && steps.length > 0 && (
          <div className="trace-under">
            <StepCanvas steps={steps} upto={upto} width={width} height={height} frame={frame} style={TRACE_STYLE} />
          </div>
        )}
        <canvas ref={canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} />
      </div>
    </aside>
  );
}
