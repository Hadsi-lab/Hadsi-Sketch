import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, SwitchCamera, Timer } from 'lucide-react';
import { PhotoPrep } from './PhotoPrep';
import type { SketchSource } from '../lib/types';

type Facing = 'environment' | 'user';

export function CameraPanel({ onUse }: { onUse: (s: SketchSource) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<Facing>('environment');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [useTimer, setUseTimer] = useState(true);
  const [count, setCount] = useState(0);
  const [shot, setShot] = useState<string | null>(null);
  const [cams, setCams] = useState(0);

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setReady(false);
  }, []);

  const start = useCallback(async (f: Facing) => {
    stop();
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot use the camera. Open the app over https:// in a recent browser, or use “Import Image” instead.');
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: f }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      stream.current = s;
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play().catch(() => {});
      }
      setReady(true);
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCams(devices.filter((d) => d.kind === 'videoinput').length);
    } catch (e) {
      const name = (e as DOMException).name;
      setError(
        name === 'NotAllowedError'
          ? 'Camera permission was blocked. Allow camera access in your browser settings and try again.'
          : name === 'NotFoundError'
            ? 'No camera was found on this device.'
            : 'Could not start the camera. ' + ((e as Error).message ?? ''),
      );
    }
  }, [stop]);

  useEffect(() => {
    if (!shot) start(facing);
    return stop;
  }, [facing, shot, start, stop]);

  const capture = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    setShot(c.toDataURL('image/jpeg', 0.92));
    stop();
  };

  const snap = () => {
    if (!useTimer) return capture();
    let n = 3;
    setCount(n);
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        setCount(0);
        capture();
      } else setCount(n);
    }, 1000);
  };

  if (shot) {
    return (
      <div className="camera">
        <PhotoPrep image={shot} kind="photo" defaultTitle="My Photo Sketch" onUse={onUse} />
        <button className="btn" onClick={() => setShot(null)}><RefreshCw size={18} /> Retake</button>
      </div>
    );
  }

  return (
    <div className="camera">
      <div className="camera-view">
        <video ref={video} playsInline muted className={facing === 'user' ? 'mirror' : ''} />
        {!ready && !error && <div className="spinner" aria-label="Starting camera…" />}
        {count > 0 && <div className="countdown" aria-live="assertive">{count}</div>}
        {error && <p className="error camera-error">{error}</p>}
      </div>
      <div className="camera-controls">
        <label className="toggle"><input type="checkbox" checked={useTimer} onChange={(e) => setUseTimer(e.target.checked)} /><span><Timer size={16} /> 3-second timer</span></label>
        <button className="btn btn-primary btn-big" disabled={!ready || count > 0} onClick={snap}><Camera size={22} /> Take photo</button>
        <button className="btn" onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))} disabled={cams === 1}>
          <SwitchCamera size={18} /> {facing === 'user' ? 'Use back camera' : 'Use front camera'}
        </button>
      </div>
      <p className="hint">Tip: put your pet, toy or object in front of a plain wall or table for the cleanest outline.</p>
    </div>
  );
}
