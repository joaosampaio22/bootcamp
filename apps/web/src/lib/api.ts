export interface HealthResponse {
  status: 'ok';
  service: 'estudo-em-dia-api';
  database: 'up';
}

function isHealthy(value: unknown): value is HealthResponse {
  return typeof value === 'object' && value !== null &&
    'status' in value && value.status === 'ok' &&
    'service' in value && value.service === 'estudo-em-dia-api' &&
    'database' in value && value.database === 'up';
}

export async function getHealth(signal: AbortSignal): Promise<HealthResponse> {
  const response = await fetch('/api/v1/health', {
    signal,
    credentials: 'include',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Serviço indisponível.');
  const data: unknown = await response.json();
  if (!isHealthy(data)) throw new Error('Resposta de saúde inválida.');
  return data;
}
