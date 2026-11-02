import { Route, Routes } from 'react-router-dom';
import { App } from './App';
import { PrivateLayout } from './PrivateLayout';
import { AccessPage } from '../features/auth/AccessPage';
import { ProfilePage } from '../features/auth/ProfilePage';
import { SubjectsPage } from '../features/subjects/SubjectsPage';
import { FocusPage } from '../features/focus/FocusPage';
import { ContentsPage } from '../features/contents/ContentsPage';
import { ContentEditor } from '../features/contents/ContentEditor';
import { ContentDetail } from '../features/contents/ContentDetail';
import { ReturnPointsPage } from '../features/continuity/ReturnPointsPage';
import { ReturnPointEditor } from '../features/continuity/ReturnPointEditor';
import { DashboardPage } from '../features/dashboard/DashboardPage';

export function Router() {
  return <Routes><Route path="/" element={<App />} />
    <Route path="/login" element={<AccessPage />} /><Route path="/register" element={<AccessPage register />} />
    <Route path="/app" element={<PrivateLayout />}><Route index element={<DashboardPage />} /><Route path="focus" element={<FocusPage />} /><Route path="subjects" element={<SubjectsPage />} /><Route path="settings" element={<ProfilePage />} />
      <Route path="contents" element={<ContentsPage />} /><Route path="contents/new" element={<ContentEditor />} /><Route path="contents/:id" element={<ContentDetail />} /><Route path="contents/:id/edit" element={<ContentEditor />} />
      <Route path="continue" element={<ReturnPointsPage />} /><Route path="continue/new" element={<ReturnPointEditor />} /><Route path="continue/:id/edit" element={<ReturnPointEditor />} />
    </Route>
    <Route path="*" element={<main className="app-loading"><h1>Página não encontrada</h1><a href="/">Voltar ao início</a></main>} />
  </Routes>;
}
