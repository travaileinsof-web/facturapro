import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Receipt as ReceiptIcon,
  MessageSquare, Settings as SettingsIcon, LayoutList, Wallet,
  LogOut, Bell, Menu, X, AlertTriangle, TrendingUp, Zap,
  ChevronRight, Building2, ShieldAlert
} from 'lucide-react';
import { useAppStore } from './lib/store';
import { Dashboard }  from './components/Dashboard';
import { Clients }    from './components/Clients';
import { Catalog }    from './components/Catalog';
import { Expenses }   from './components/Expenses';
import { Reminders }  from './components/Reminders';
import { Invoices }   from './components/Invoices';
import { Receipts }   from './components/Receipts';
import { ChatIA }     from './components/ChatIA';
import { Settings }   from './components/Settings';
import { Companies }  from './components/Companies';
import { Pricing }    from './components/Pricing';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { cn } from './lib/utils';
import { toast } from 'sonner';

const queryClient = new QueryClient();

const NAV = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard,  group: 'main' },
  { id: 'clients',   label: 'Clients',          icon: Users,            group: 'main' },
  { id: 'catalog',   label: 'Catalogue',         icon: LayoutList,       group: 'main' },
  { id: 'invoices',  label: 'Factures',          icon: FileText,         group: 'main' },
  { id: 'receipts',  label: 'Reçus',             icon: ReceiptIcon,      group: 'main' },
  { id: 'expenses',  label: 'Dépenses',          icon: Wallet,           group: 'main' },
  { id: 'reminders', label: 'Relances',          icon: AlertTriangle,    group: 'main' },
  { id: 'chat',      label: 'Assistant ARIA',    icon: MessageSquare,    group: 'tools' },
  { id: 'companies', label: 'Entreprises',       icon: Building2,        group: 'tools' },
  { id: 'pricing',   label: 'Abonnement',        icon: TrendingUp,       group: 'tools' },
  { id: 'settings',  label: 'Paramètres',        icon: SettingsIcon,     group: 'tools' },
];

function getTrialHoursRemaining(createdAt?: string) {
  if (!createdAt) return 24;
  const createStr = createdAt.includes('Z') ? createdAt : createdAt.replace(' ', 'T') + 'Z';
  const expireDate = new Date(new Date(createStr).getTime() + 24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60)));
}

/* ─── Logo SVG ─────────────────────────────────────────────────────── */
function FPLogo({ size = 26 }: { size?: number }) {
  return (
    <div 
      className="flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(201,168,76,0.3)]"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #C9A84C 0%, #E2C878 100%)'
      }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none"
        stroke="#0A0A0F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    </div>
  );
}

/* ─── Sidebar ───────────────────────────────────────────────────────── */
function Sidebar({ open, onClose, isCollapsed, onToggleCollapse }: { open: boolean; onClose: () => void; isCollapsed: boolean; onToggleCollapse: () => void }) {
  const { currentModule, setCurrentModule, user, logout } = useAppStore();
  const navigate = useNavigate();

  const isTrial = user?.subscriptionStatus === 'trial' || user?.subscriptionStatus === 'trial_expired' || !user?.subscriptionStatus;
  const isExpired = user?.subscriptionStatus === 'expired';
  const trialHours = getTrialHoursRemaining(user?.createdAt);
  const initials = (user?.name || user?.company || 'U').charAt(0).toUpperCase();

  const handleNav = (id: string) => { setCurrentModule(id as any); onClose(); };

  const mainItems  = NAV.filter(n => n.group === 'main');
  const toolsItems = NAV.filter(n => n.group === 'tools');

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 98, backdropFilter: 'blur(4px)',
        }} className="sidebar-hide" />
      )}

      <aside className={`app-sidebar ${open ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''} border-r-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
        style={{ transform: open ? 'translateX(0)' : undefined }}>

        {/* ── Logo ── */}
        <div className="shrink-0 relative" style={{ padding: 'var(--space-5)' }}>
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
            <Link to="/" className="flex items-center no-underline" style={{ gap: 'var(--space-2)' }}>
              <FPLogo size={isCollapsed ? 32 : 26} />
              <div className="sidebar-shrink">
                <div className="font-display font-bold text-[14px] text-[var(--foreground)] tracking-tight">FacturaPro</div>
                <div className="text-[9px] text-[var(--gold)] font-bold tracking-[1.5px] uppercase opacity-80">Business Suite</div>
              </div>
            </Link>
            {!isCollapsed && (
              <button 
                onClick={onClose} 
                className="sidebar-hide mobile-only flex bg-transparent border-none cursor-pointer text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-colors duration-150"
                style={{ padding: 'var(--space-1)' }}
              >
                <X size={14}/>
              </button>
            )}
          </div>
          <button 
            onClick={onToggleCollapse} 
            className="pub-nav-desktop hover:shadow-sm absolute right-[-12px] top-[22px] w-6 h-6 bg-[var(--surface-1)] border border-[var(--border)] rounded-full flex items-center justify-center cursor-pointer z-10 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            title={isCollapsed ? 'Agrandir' : 'Réduire'}
          >
            <ChevronRight size={14} className={cn("transition-transform duration-200", isCollapsed ? "rotate-0" : "rotate-180")} />
          </button>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-[var(--border)]" style={{ margin: '0 var(--space-4) var(--space-4)' }} />

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto px-2 flex flex-col" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)', gap: 'var(--space-1)' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-placeholder)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 var(--space-4)', marginBottom: 'var(--space-2)' }}>Principal</span>
          {mainItems.map((item, i) => {
            const Icon = item.icon;
            const active = currentModule === item.id;
            return (
              <button key={item.id} onClick={() => handleNav(item.id)}
                className={`app-nav-item ${active ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
                style={{ opacity: 0, animation: `fp-fade-up 0.35s ease ${i * 0.035}s forwards`, justifyContent: isCollapsed ? 'center' : 'flex-start', padding: 'var(--space-2) var(--space-4)', gap: 'var(--space-3)', height: '44px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-1)' }}>
                <Icon className="nav-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} strokeWidth={2}/>
                {!isCollapsed && <span style={{ flex: 1, textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>{item.label}</span>}
              </button>
            );
          })}

          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-placeholder)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 var(--space-4)', marginTop: 'var(--space-6)', marginBottom: 'var(--space-2)' }}>Outils</span>
          {toolsItems.map((item, i) => {
            const Icon = item.icon;
            const active = currentModule === item.id;
            const isComingSoon = ['chat', 'companies'].includes(item.id);
            return (
              <button key={item.id} onClick={() => handleNav(item.id)}
                className={`app-nav-item ${active ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
                style={{ opacity: 0, animation: `fp-fade-up 0.35s ease ${(mainItems.length + i) * 0.035}s forwards`, justifyContent: isCollapsed ? 'center' : 'flex-start', padding: 'var(--space-2) var(--space-4)', gap: 'var(--space-3)', height: '44px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-1)' }}>
                <Icon className="nav-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} strokeWidth={2}/>
                {!isCollapsed && (
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>{item.label}</span>
                    {isComingSoon && <span style={{ background: 'rgba(184,134,11,0.1)', color: 'var(--gold)', border: '1px solid rgba(184,134,11,0.3)', padding: '2px 6px', fontSize: '9px', borderRadius: 'var(--radius-sm)', fontWeight: '800', letterSpacing: '0.5px' }}>BIENTÔT</span>}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── User + Plan footer ── */}
        <div className="sidebar-footer-zone" style={{ padding: 'var(--space-3)', gap: 'var(--space-2)' }}>
          {/* Identité utilisateur */}
          <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
            <div style={{
              width: '28px', height: '28px', flexShrink: 0,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg-page)',
              border: '1px solid var(--color-border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-secondary)',
            }}>
              {initials}
            </div>
            <div className="sidebar-shrink" style={{ minWidth: 0, lineHeight: 1.2 }}>
              <div style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.company || user?.name || 'Utilisateur'}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.company && user?.name && user.name !== user.company ? user.name : user?.email}</div>
            </div>
          </div>

          {/* Trial Banner Ultra-Compact */}
          {isTrial && !isCollapsed && (
            <div style={{ background: 'var(--color-primary-subtle)', border: '1px solid rgba(184,134,11,0.2)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
                  <Zap size={10}/> {trialHours}h restantes
                </div>
                <button
                  onClick={() => setCurrentModule('pricing' as any)}
                  style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold', textDecoration: 'underline' }}
                >
                  S'abonner
                </button>
              </div>
              <div style={{ height: '3px', background: 'var(--color-border-default)', borderRadius: 'var(--radius-full)' }}>
                <div style={{ height: '100%', width: `${Math.round((trialHours / 24) * 100)}%`, background: 'var(--color-primary)', borderRadius: 'var(--radius-full)' }}/>
              </div>
            </div>
          )}

          {/* Déconnexion */}
          <button
            onClick={() => { logout(); navigate('/'); }}
            className={`flex items-center gap-2 w-full ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            style={{ height: '28px', fontSize: '12px', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-sm)', padding: '0 var(--space-2)', transition: 'all 0.15s' }}
            title="Se déconnecter"
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--color-bg-page)'; el.style.color = 'var(--color-danger)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--color-text-secondary)'; }}
          >
            <LogOut size={13}/> <span className="sidebar-shrink">Se déconnecter</span>
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─── App Layout ────────────────────────────────────────────────────── */
function AppLayout() {
  const { currentModule, user, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [prevModule, setPrevModule] = useState(currentModule);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch('/api/v1/notifications', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch('/api/v1/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        toast.success("Toutes les notifications marquées comme lues.");
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user?.token) return;
    try {
      const res = await fetch(`/api/v1/notifications/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [user?.token]);

  useEffect(() => {
    // 1) Sync latest user data from backend (especially for subscription updates after payment)
    if (user?.token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          useAppStore.getState().login(data);
        } else if (data.error === "Token invalide ou expiré.") {
          handleLogout();
        }
      })
      .catch(console.error);
    }

    // 2) Check for successful payment redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      toast.success("Paiement validé ! Bienvenue dans la version Premium.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [animKey, setAnimKey] = useState(0);
  const active = NAV.find(n => n.id === currentModule);

  const isTrial = user?.subscriptionStatus === 'trial' || user?.subscriptionStatus === 'trial_expired' || !user?.subscriptionStatus;
  const isExpired = user?.subscriptionStatus === 'expired';
  const trialHours  = getTrialHoursRemaining(user?.createdAt);
  const initials   = (user?.name || user?.company || 'U').charAt(0).toUpperCase();

  useEffect(() => {
    if (currentModule !== prevModule) {
      setAnimKey(k => k + 1);
      setPrevModule(currentModule);
    }
  }, [currentModule]);

  // Theming dynamically based on primaryColor, secondaryColor, accentColor
  useEffect(() => {
    const pc = user?.primaryColor;
    const sc = user?.secondaryColor;
    const ac = user?.accentColor;
    
    if (pc) {
      // Helper to convert hex to rgb string "r, g, b"
      const hexToRgb = (hex: string) => {
        let c = hex.replace('#', '');
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const num = parseInt(c, 16);
        return `${num >> 16}, ${(num >> 8) & 255}, ${num & 255}`;
      };
      
      const rgb = hexToRgb(pc);
      document.documentElement.style.setProperty('--gold', pc);
      document.documentElement.style.setProperty('--gold-light', pc);
      document.documentElement.style.setProperty('--gold-dim', `rgba(${rgb}, 0.12)`);
      document.documentElement.style.setProperty('--gold-glow', `rgba(${rgb}, 0.15)`);
      document.documentElement.style.setProperty('--primary', pc);
      document.documentElement.style.setProperty('--border-gold', `rgba(${rgb}, 0.25)`);
      document.documentElement.style.setProperty('--ring', pc);

      // Support for Tailwind v4 mapping
      document.documentElement.style.setProperty('--color-gold', pc);
      document.documentElement.style.setProperty('--color-gold-light', pc);
      document.documentElement.style.setProperty('--color-gold-dim', `rgba(${rgb}, 0.12)`);
      document.documentElement.style.setProperty('--color-gold-glow', `rgba(${rgb}, 0.15)`);
      document.documentElement.style.setProperty('--color-primary', pc);
      document.documentElement.style.setProperty('--color-border-gold', `rgba(${rgb}, 0.25)`);
      document.documentElement.style.setProperty('--color-ring', pc);
      
      if (sc) {
        const rgbSc = hexToRgb(sc);
        document.documentElement.style.setProperty('--blue-accent', sc);
        document.documentElement.style.setProperty('--blue-dim', `rgba(${rgbSc}, 0.1)`);
        document.documentElement.style.setProperty('--color-blue-accent', sc);
        document.documentElement.style.setProperty('--secondary', sc);
        
        document.documentElement.style.setProperty('--color-secondary', sc);
        document.documentElement.style.setProperty('--color-blue-dim', `rgba(${rgbSc}, 0.1)`);
      }
      
      if (ac) {
        document.documentElement.style.setProperty('--success', ac);
        document.documentElement.style.setProperty('--color-success', ac);
        document.documentElement.style.setProperty('--accent', ac);
        
        document.documentElement.style.setProperty('--color-accent', ac);
      }
    } else {
      document.documentElement.style.removeProperty('--gold');
      document.documentElement.style.removeProperty('--gold-light');
      document.documentElement.style.removeProperty('--gold-dim');
      document.documentElement.style.removeProperty('--gold-glow');
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--border-gold');
      document.documentElement.style.removeProperty('--ring');
      
      document.documentElement.style.removeProperty('--color-gold');
      document.documentElement.style.removeProperty('--color-gold-light');
      document.documentElement.style.removeProperty('--color-gold-dim');
      document.documentElement.style.removeProperty('--color-gold-glow');
      document.documentElement.style.removeProperty('--color-primary');
      document.documentElement.style.removeProperty('--color-border-gold');
      document.documentElement.style.removeProperty('--color-ring');

      document.documentElement.style.removeProperty('--blue-accent');
      document.documentElement.style.removeProperty('--blue-dim');
      document.documentElement.style.removeProperty('--color-blue-accent');
      document.documentElement.style.removeProperty('--secondary');
      
      document.documentElement.style.removeProperty('--color-secondary');
      document.documentElement.style.removeProperty('--color-blue-dim');

      document.documentElement.style.removeProperty('--success');
      document.documentElement.style.removeProperty('--color-success');
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--color-accent');
    }
    
  }, [user?.primaryColor, user?.secondaryColor, user?.accentColor]);

  // Desktop: sidebar always visible (240px margin)
  const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;

  if (isTrial && trialHours <= 0) {
    return (
      <div className="flex flex-col h-screen bg-[var(--background)] text-[var(--foreground)] overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: 'var(--space-10) var(--space-5)' }}>
          <div className="max-w-[600px] w-full text-center">
            <Zap size={48} className="text-[var(--gold)] mx-auto" style={{ marginBottom: 'var(--space-6)' }} />
            <h1 className="text-[28px] font-bold text-[var(--foreground)]" style={{ marginBottom: 'var(--space-4)' }}>Période d'essai terminée</h1>
            <p className="text-[16px] text-[var(--foreground-subtle)] leading-relaxed" style={{ marginBottom: 'var(--space-10)' }}>
              Votre essai gratuit de 24 heures est arrivé à expiration. Pour continuer à utiliser FacturaPro sans interruption, veuillez activer votre abonnement ci-dessous.
            </p>
            <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-3xl text-left shadow-[0_20px_40px_rgba(0,0,0,0.2)]" style={{ padding: 'var(--space-6)' }}>
              <Pricing />
            </div>
            <button 
              onClick={() => { sessionStorage.removeItem('token'); window.location.href = '/login'; }} 
              className="bg-transparent border-none text-[var(--foreground-muted)] text-[14px] cursor-pointer underline hover:text-[var(--foreground)]"
              style={{ marginTop: 'var(--space-8)' }}
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex flex-col h-screen bg-[var(--background)] text-[var(--foreground)] overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: 'var(--space-10) var(--space-5)' }}>
          <div className="max-w-[600px] w-full text-center">
            <Zap size={48} className="text-[var(--gold)] mx-auto" style={{ marginBottom: 'var(--space-6)' }} />
            <h1 className="text-[28px] font-bold text-[var(--foreground)]" style={{ marginBottom: 'var(--space-4)' }}>Abonnement Expiré</h1>
            <p className="text-[16px] text-[var(--foreground-subtle)] leading-relaxed" style={{ marginBottom: 'var(--space-10)' }}>
              Votre abonnement annuel est arrivé à expiration. Pour continuer à utiliser FacturaPro sans interruption et garder l'accès à toutes vos données, veuillez le renouveler ci-dessous.
            </p>
            <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-3xl text-left shadow-[0_20px_40px_rgba(0,0,0,0.2)]" style={{ padding: 'var(--space-6)' }}>
              <Pricing />
            </div>
            <button 
              onClick={() => { sessionStorage.removeItem('token'); window.location.href = '/login'; }} 
              className="bg-transparent border-none text-[var(--foreground-muted)] text-[14px] cursor-pointer underline hover:text-[var(--foreground)]"
              style={{ marginTop: 'var(--space-8)' }}
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)', color: 'var(--foreground)', overflow: 'hidden' }}>
      {/* Trial banner */}
      {isTrial && trialHours <= 24 && (
        <div 
          className="relative z-[200] border-b flex items-center justify-center backdrop-blur-md bg-gradient-to-r from-[rgba(201,168,76,0.15)] to-[rgba(226,200,120,0.1)]"
          style={{ borderColor: 'var(--color-border-gold)', padding: 'var(--space-3) var(--space-5)', gap: 'var(--space-4)' }}
        >
          <Zap size={13} style={{ color: 'var(--color-primary)' }} className="shrink-0" />
          <span className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
            Il reste <strong style={{ color: 'var(--color-primary)' }}>{trialHours} heure{trialHours !== 1 ? 's' : ''}</strong> à votre essai gratuit.
          </span>
          <button 
            onClick={() => useAppStore.getState().setCurrentModule('pricing' as any)} 
            className="fp-btn-primary"
            style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)', height: 'auto', minHeight: 'unset' }}
          >
            S'abonner
          </button>
        </div>
      )}
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

      {/* Sidebar Placeholder */}
      <div className="sidebar-placeholder" style={{ width: isCollapsed ? '68px' : '228px', flexShrink: 0, position: 'relative', transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
        <style>{`
          @media (min-width: 769px) {
            .app-sidebar { 
              transform: translateX(0) !important; 
              box-shadow: none !important; 
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              height: 100% !important;
            }
          }
        `}</style>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, marginLeft: 0 }}>


        {/* Header */}
        <header className="fp-header" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center min-w-0" style={{ gap: 'var(--space-3)' }}>
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="mobile-only w-[30px] h-[30px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center cursor-pointer shrink-0 transition-colors duration-150 hover:border-[var(--border-hover)]"
            >
              <Menu className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center text-[13px]" style={{ gap: 'var(--space-2)' }}>
              <span className="text-[var(--foreground-subtle)] font-medium">FacturaPro</span>
              <ChevronRight size={11} className="text-[var(--foreground-subtle)]" />
              <span className="text-[var(--foreground)] font-bold" style={{ fontFamily: 'var(--font-display)' }}>{active?.label}</span>
            </div>
          </div>

          {/* Header right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {/* Notification bell */}
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger 
                  style={{
                  width: 'var(--space-8)', height: 'var(--space-8)',
                  background: 'var(--color-bg-card)', border: '1px solid var(--color-border-default)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', transition: 'all 0.2s', borderRadius: 'var(--radius-md)'
                }}
                  className="hover:border-[var(--color-border-focus)] hover:bg-[var(--color-bg-page)]"
                >
                  <Bell style={{ width: 'var(--space-5)', height: 'var(--space-5)', color: 'var(--color-text-secondary)' }}/>
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <div style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', border: '2px solid var(--color-bg-card)' }}/>
                  )}
              </PopoverTrigger>
              <PopoverContent className="w-[var(--space-96)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--color-border-default)] overflow-hidden" style={{ background: 'var(--color-bg-card)', marginTop: 'var(--space-2)', padding: 0 }} align="end" sideOffset={12}>
                <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', margin: 0 }}>Notifications</h4>
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 'var(--font-weight-bold)', letterSpacing: '0.05em', textTransform: 'uppercase', background: 'var(--color-primary-subtle)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                      {notifications.filter(n => !n.isRead).length} Nouvelle(s)
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '350px', overflowY: 'auto', background: 'var(--color-bg-page)' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Aucune notification.</div>
                  ) : notifications.map(notif => (
                    <div key={notif.id} onClick={() => { markAsRead(notif.id); setNotifOpen(false); }} style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)', background: notif.isRead ? 'transparent' : 'var(--color-primary-subtle)', cursor: 'pointer', position: 'relative', paddingLeft: notif.isRead ? 'var(--space-5)' : 'calc(var(--space-5) + 3px)', borderLeft: notif.isRead ? 'none' : '3px solid var(--color-primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-1)' }}>
                        <p style={{ fontSize: 'var(--text-sm)', fontWeight: notif.isRead ? 'var(--font-weight-medium)' : 'var(--font-weight-semibold)', color: notif.isRead ? 'var(--color-text-secondary)' : 'var(--color-text-primary)', margin: 0 }}>{notif.title}</p>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '16px' }} dangerouslySetInnerHTML={{ __html: notif.message }} />
                    </div>
                  ))}
                </div>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <div style={{ padding: 'var(--space-3) var(--space-5)', background: 'var(--color-bg-modal-footer)', borderTop: '1px solid var(--color-border-subtle)', textAlign: 'center' }}>
                    <button style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', padding: 'var(--space-2)' }} onClick={() => { markAllAsRead(); setNotifOpen(false); }}>Marquer tout comme lu</button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* User Dropdown */}
            <Popover open={profileOpen} onOpenChange={setProfileOpen}>
              <PopoverTrigger 
                  style={{
                  width: 'var(--space-8)', height: 'var(--space-8)',
                  background: 'var(--color-primary-subtle)', border: '1px solid var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s', borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)',
                }}
                  className="hover:bg-[var(--color-primary)] hover:text-white"
                >
                  {initials}
              </PopoverTrigger>
              <PopoverContent className="rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border overflow-hidden" style={{ width: '280px', borderColor: 'var(--color-border-default)', background: 'var(--color-bg-card)', marginTop: 'var(--space-2)', padding: 0 }} align="end" sideOffset={12}>
                <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-card)' }}>
                  <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{user?.company || user?.name || 'Utilisateur'}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 'var(--space-1)', margin: 0 }}>{user?.email || 'email@example.com'}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', padding: 'var(--space-2)', gap: 'var(--space-1)', background: 'var(--color-bg-page)' }}>
                  <button 
                    onClick={() => { setProfileOpen(false); useAppStore.getState().setCurrentModule('settings' as any); }}
                    className="hover:bg-[var(--color-bg-card)]"
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', borderRadius: 'var(--radius-sm)' }}
                  >
                    <SettingsIcon size={16} style={{ color: 'var(--color-text-secondary)' }} /> Paramètres du compte
                  </button>
                  <button 
                    onClick={() => { setProfileOpen(false); useAppStore.getState().setCurrentModule('catalog' as any); }}
                    className="hover:bg-[var(--color-bg-card)]"
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', borderRadius: 'var(--radius-sm)' }}
                  >
                    <LayoutList size={16} style={{ color: 'var(--color-text-secondary)' }} /> Mon Catalogue
                  </button>
                </div>
                <div style={{ padding: 'var(--space-2)', borderTop: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-card)' }}>
                  <button 
                    onClick={() => { setProfileOpen(false); handleLogout(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-danger)', background: 'rgba(211, 47, 47, 0.05)', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', borderRadius: 'var(--radius-sm)' }}
                  >
                    <LogOut size={16} /> Déconnexion
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', padding: 'clamp(24px, 4vw, 40px)' }}>

          {/* Module container */}
          <div key={animKey} style={{ opacity: 0, animation: 'fp-fade-up 0.35s ease forwards' }}>
            {currentModule === 'dashboard' && <Dashboard />}
            {currentModule === 'clients'   && <Clients />}
            {currentModule === 'catalog'   && <Catalog />}
            {currentModule === 'invoices'  && <Invoices />}
            {currentModule === 'receipts'  && <Receipts />}
            {currentModule === 'expenses'  && <Expenses />}
            {currentModule === 'reminders' && <Reminders />}
            {currentModule === 'chat'      && <ComingSoonOverlay featureName="Assistant IA (ARIA)" />}
            {currentModule === 'companies' && <ComingSoonOverlay featureName="Multi-Entreprise" />}
            {currentModule === 'settings'  && <Settings />}
            {currentModule === 'pricing'   && <Pricing />}
          </div>
        </main>
      </div>
      </div>
    </div>
  );
}

function ComingSoonOverlay({ featureName }: { featureName: string }) {
  const { setCurrentModule } = useAppStore();
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout />
      <Toaster
        richColors={false}
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            borderRadius: 0,
          },
        }}
      />
    </QueryClientProvider>
  );
}
