import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Module = 'dashboard' | 'clients' | 'catalog' | 'invoices' | 'receipts' | 'chat' | 'settings' | 'pricing' | 'expenses' | 'reminders' | 'companies' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  token?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  createdAt?: string;
  currency?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  role?: string;
  smtpHost?: string;
  legalForm?: string;
  rccm?: string;
  taxRegime?: string;
  defaultVatRate?: number;
  taxId?: string;
  bankName?: string;
  bankAccount?: string;
}

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  // Navigation
  currentModule: Module;
  setCurrentModule: (module: Module) => void;
  // Refresh triggers
  refreshClients: number;
  refreshInvoices: number;
  refreshReceipts: number;
  refreshStats: number;
  refreshExpenses: number;
  refreshCatalog: number;
  refreshReminders: number;
  triggerRefresh: (module: 'clients' | 'invoices' | 'receipts' | 'stats' | 'expenses' | 'catalog' | 'reminders') => void;
  tourRunning: boolean;
  setTourRunning: (run: boolean) => void;
  // Stats
  statsPeriod: string;
  setStatsPeriod: (period: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
      currentModule: 'dashboard',
      setCurrentModule: (currentModule) => set({ currentModule }),
      refreshClients: 0,
      refreshInvoices: 0,
      refreshReceipts: 0,
      refreshStats: 0,
      refreshExpenses: 0,
      refreshCatalog: 0,
      refreshReminders: 0,
      tourRunning: false,
      setTourRunning: (run) => set({ tourRunning: run }),
      statsPeriod: 'this_month',
      setStatsPeriod: (statsPeriod) => set({ statsPeriod }),
      triggerRefresh: (module) => set((state) => ({
        [`refresh${module.charAt(0).toUpperCase() + module.slice(1)}`]: (state[`refresh${module.charAt(0).toUpperCase() + module.slice(1)}` as keyof AppState] as number) + 1
      }))
    }),
    { name: 'facturapro-auth', partialize: (s) => ({ isAuthenticated: s.isAuthenticated, user: s.user }) }
  )
);

// ============================================================
// Utilitaire d'appel API avec authentification automatique
// ============================================================
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = useAppStore.getState().user?.token;
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    // Ne pas forcer Content-Type pour FormData — le navigateur le gère (multipart/form-data + boundary)
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401 && url.startsWith('/api/') && !url.includes('/api/auth/')) {
    useAppStore.getState().logout();
  }
  
  return response;
}

// ============================================================
// Formatage de la devise — Version non-réactive (pour PDF, templates string)
// Lit le store au moment de l'appel. Correcte dans les contextes non-React.
// ============================================================
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('GNF', 'GNF');
}

// ============================================================
// Hook React réactif pour la devise courante
// À utiliser dans les composants React pour garantir le re-render
// quand l'utilisateur change de devise dans les paramètres.
// ============================================================
export function useCurrency() {
  const fmt = (amount: number): string => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('GNF', 'GNF');
  };
  
  return { currency: 'GNF', fmt };
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR');
}

export function safeJSONParse(str: string | null | undefined, fallback: any = []) {
  try {
    if (!str) return fallback;
    const parsed = JSON.parse(str);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      // If we expect an array but got an object/primitive, wrap it in an array
      // This prevents "c.map is not a function" errors in the UI
      return parsed && typeof parsed === 'object' ? [parsed] : [];
    }
    return parsed;
  } catch (e) {
    console.error("Erreur parsing JSON:", e);
    return fallback;
  }
}

// Utility to escape HTML and prevent XSS
export function escapeHTML(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getWhatsAppUrl(phone: string, text: string): string {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    return `whatsapp://send?text=${text}` + (phone ? `&phone=${phone}` : '');
  }
  return `https://api.whatsapp.com/send?text=${text}` + (phone ? `&phone=${phone}` : '');
}
