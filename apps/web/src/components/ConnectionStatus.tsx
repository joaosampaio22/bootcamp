import { useEffect, useState } from 'react';
import { getHealth } from '../lib/api';
import { ArrowIcon } from './ArrowIcon';

type Connection = 'loading' | 'ready' | 'error';

export function ConnectionStatus() {
  const [connection, setConnection] = useState<Connection>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 8000);
    getHealth(controller.signal)
      .then(() => { if (active) setConnection('ready'); })
      .catch(() => { if (active) setConnection('error'); })
      .finally(() => clearTimeout(timeout));

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  function retry() {
    setConnection('loading');
    setAttempt((value) => value + 1);
  }

  return (
    <div className="connection">
      <p role="status" aria-live="polite" className="flex items-center gap-2.5">
        <span aria-hidden="true" className={`status-dot status-dot--${connection}`} />
        {connection === 'loading' && 'Verificando conexão…'}
        {connection === 'ready' && 'Conexão verificada'}
        {connection === 'error' && 'Não foi possível verificar a conexão'}
      </p>
      {connection === 'error' && (
        <button className="retry-button" onClick={retry}>Tentar novamente <ArrowIcon /></button>
      )}
    </div>
  );
}
