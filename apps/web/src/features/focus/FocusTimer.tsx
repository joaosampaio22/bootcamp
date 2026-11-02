import { useEffect, useState } from 'react';
import { formatTime, remainingSeconds } from './focus-time';
import type { FocusSnapshot } from './focus-time';

export function FocusTimer({ session, receivedAt }: { session: FocusSnapshot; receivedAt: number }) {
  const [mark, setMark] = useState(() => performance.now());
  useEffect(() => {
    const interval = setInterval(() => setMark(performance.now()), 500);
    return () => clearInterval(interval);
  }, []);
  const remaining = remainingSeconds(session, mark - receivedAt);
  return <><p className="focus-countdown" role="timer" aria-label="Tempo restante" aria-live="off">{formatTime(remaining)}</p>
    <p className="focus-caption">{session.status === 'PAUSED' ? 'Pausa. O tempo de descanso não conta como estudo.' : remaining === 0 ? 'Tempo previsto encerrado. Conclua quando estiver pronto.' : 'Você pode estudar fora desta página. O tempo continua registrado.'}</p></>;
}
