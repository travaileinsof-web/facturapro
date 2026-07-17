import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
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

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
    </AnimatePresence>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  </React.StrictMode>
);
