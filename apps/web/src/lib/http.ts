export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function request<T>(path: string, init: RequestInit = {}, csrfToken?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/v1' + path, {
      ...init, credentials: 'include', cache: 'no-store',
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}), ...init.headers }
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('Não foi possível conectar. Confira sua conexão e tente novamente.', 0);
  }
  if (!response.ok) {
    let message = 'Não foi possível concluir. Tente novamente.';
    try {
      const data: unknown = await response.json();
      if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'object' && data.error !== null && 'message' in data.error && typeof data.error.message === 'string') message = data.error.message;
    } catch { /* Resposta não JSON: usar mensagem genérica. */ }
    throw new ApiError(message, response.status);
  }
  return response.status === 204 ? undefined as T : await response.json() as T;
}
