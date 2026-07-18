import React from 'react';
import { Dashboard } from './Dashboard';
import { Clients } from './Clients';
import { Catalog } from './Catalog';
import { Invoices } from './Invoices';
import { Receipts } from './Receipts';
import { Expenses } from './Expenses';
import { Reminders } from './Reminders';
import { Settings } from './Settings';
import { Pricing } from './Pricing';
import { Zap } from 'lucide-react';
import { useAppStore } from '../lib/store';

export function ComingSoonOverlay({ featureName }: { featureName: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', padding: 'var(--space-5)' }}>
      <div style={{ width: 64, height: 64, background: 'var(--gold-dim)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-5)' }}>
        <Zap size={28} style={{ color: 'var(--gold)' }} />
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)', marginBottom: 'var(--space-3)' }}>Bientôt disponible</h2>
      <p style={{ color: 'var(--foreground-subtle)', maxWidth: '400px', lineHeight: 1.5, marginBottom: 'var(--space-5)' }}>
        La fonctionnalité <strong style={{ color: 'var(--foreground)' }}>{featureName}</strong> est en cours de développement. 
        Elle sera très bientôt disponible pour enrichir votre expérience sur FacturaPro.
      </p>
    </div>
  );
}

export function ModuleRouter({ animKey }: { animKey: number }) {
  const { currentModule } = useAppStore();

  return (
    <div key={animKey} style={{ opacity: 0, animation: 'fp-fade-up 0.35s ease forwards' }}>
      {currentModule === 'dashboard' && <Dashboard />}
      {currentModule === 'clients'   && <Clients />}
      {currentModule === 'catalog'   && <Catalog />}
      {currentModule === 'invoices'  && <Invoices />}
      {currentModule === 'receipts'  && <Receipts />}
      {currentModule === 'expenses'  && <Expenses />}
      {currentModule === 'reminders' && <Reminders />}
      {currentModule === 'chat'      && <ComingSoonOverlay featureName="Assistant IA" />}
      {currentModule === 'companies' && <ComingSoonOverlay featureName="Multi-Entreprise" />}
      {currentModule === 'settings'  && <Settings />}
      {currentModule === 'pricing'   && <Pricing />}
    </div>
  );
}
