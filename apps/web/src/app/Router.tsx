import { Navigate, Route, Routes } from 'react-router-dom';
import { App } from './App';
import { PrivateLayout } from './PrivateLayout';
import { AccessPage } from '../features/auth/AccessPage';
import { ProfilePage } from '../features/auth/ProfilePage';
import { SubjectsPage } from '../features/subjects/SubjectsPage';
import { FocusPage } from '../features/focus/FocusPage';

export function Router() {
  return <Routes><Route path="/" element={<App />} />
    <Route path="/login" element={<AccessPage />} /><Route path="/register" element={<AccessPage register />} />
    <Route path="/app" element={<PrivateLayout />}><Route index element={<Navigate to="focus" replace />} /><Route path="focus" element={<FocusPage />} /><Route path="subjects" element={<SubjectsPage />} /><Route path="settings" element={<ProfilePage />} /></Route>
    <Route path="*" element={<main className="app-loading"><h1>Página não encontrada</h1><a href="/">Voltar ao início</a></main>} />
  </Routes>;
}
