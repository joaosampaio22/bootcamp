import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './app/Router';
import { AuthProvider } from './features/auth/AuthContext';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento raiz não encontrado.');

createRoot(root).render(<StrictMode><BrowserRouter><AuthProvider><Router /></AuthProvider></BrowserRouter></StrictMode>);
