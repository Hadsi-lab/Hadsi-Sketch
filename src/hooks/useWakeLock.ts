import { useCallback, useEffect, useRef, useState } from 'react';

interface Sentinel { released?: boolean; release(): Promise<void>; addEventListener(t: 'release', cb: () => void): void }
type WakeNav = Navigator & { wakeLock?: { request(type: 'screen'): Promise<Sentinel> } };

/** Keeps the screen on via the Screen Wake Lock API; re-acquires after tab switches. */
export function useWakeLock() {
  const nav = navigator as WakeNav;
  const supported = typeof navigator !== 'undefined' && !!nav.wakeLock;
  const [wanted, setWanted] = useState(false);
  const [active, setActive] = useState(false);
  const sentinel = useRef<Sentinel | null>(null);

  const acquire = useCallback(async () => {
    if (!nav.wakeLock) return;
    try {
      const s = await nav.wakeLock.request('screen');
      sentinel.current = s;
      setActive(true);
      s.addEventListener('release', () => setActive(false));
    } catch {
      setActive(false);
    }
  }, [nav]);

  useEffect(() => {
    if (wanted) acquire();
    else {
      sentinel.current?.release().catch(() => {});
      sentinel.current = null;
      setActive(false);
    }
  }, [wanted, acquire]);

  useEffect(() => {
    const onVis = () => {
      if (wanted && document.visibilityState === 'visible' && (!sentinel.current || sentinel.current.released)) acquire();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [wanted, acquire]);

  return { supported, wanted, active, toggle: () => setWanted((w) => !w) };
}
