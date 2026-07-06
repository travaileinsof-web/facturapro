import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/public/Home';
import { Features } from './pages/public/Features';
import { Pricing } from './pages/public/Pricing';
import { About } from './pages/public/About';
import { Contact } from './pages/public/Contact';
import { Auth } from './pages/Auth';
import App from './App';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { useAppStore } from './lib/store';
import './index.css';

// =============================================
// GLOBAL FETCH INTERCEPTOR — Injecte le token
// sur toutes les requêtes /api/ automatiquement
// =============================================
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
  
  if (url.startsWith('/api/')) {
    const token = useAppStore.getState().user?.token;
    if (token) {
      init.headers = {
        ...(init.headers || {}),
        'Authorization': `Bearer ${token}`,
      };
    }
  }
  
  const response = await originalFetch(input, init);
  
  // Déconnexion automatique si token expiré/invalide
  if (response.status === 401 && url.startsWith('/api/') && !url.includes('/api/auth/')) {
    useAppStore.getState().logout();
  }
  
  return response;
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore();
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/fonctionnalites" element={<PublicRoute><Features /></PublicRoute>} />
        <Route path="/tarifs" element={<PublicRoute><Pricing /></PublicRoute>} />
        <Route path="/a-propos" element={<PublicRoute><About /></PublicRoute>} />
        <Route path="/contact" element={<PublicRoute><Contact /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Auth mode="login" /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Auth mode="register" /></PublicRoute>} />
        <Route path="/app" element={<ProtectedRoute><App /></ProtectedRoute>} />
        <Route path="/admin" element={<SuperAdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
