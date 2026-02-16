import { useEffect, useMemo, useRef, useState } from 'react';

export function useElapsedTimer(startIso?: string | null, running: boolean = false, offsetMs: number = 0) {
  const [now, setNow] = useState<number>(Date.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running || !startIso) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const loop = () => {
      setNow(Date.now());
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, startIso]);

  const formatted = useMemo(() => {
    const start = startIso ? new Date(startIso).getTime() : null;
    const diffMs = running && start ? Math.max(0, now - start) + offsetMs : offsetMs;
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }, [now, startIso, running, offsetMs]);

  return formatted;
}


