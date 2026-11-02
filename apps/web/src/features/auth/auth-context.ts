import { createContext, useContext } from 'react';
export interface User { id: string; name: string; emailNormalized: string; timeZone: string; isDemo: boolean }
export interface Session { user: User; csrfToken: string }
export interface AuthState {
  session: Session | null; loading: boolean; error: string;
  accept(session: Session): void; retry(): void; logout(): Promise<void>;
  call<T>(path: string, init?: RequestInit): Promise<T>;
  update(user: User): void;
}
export const AuthContext = createContext<AuthState | null>(null);


export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider ausente.');
  return value;
}
