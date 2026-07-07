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
import { Popover, PopoverTrigger, PopoverContent } from './components/ui/popover';
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
    <div style={{
      width: size, height: size,
      background: 'linear-gradient(135deg, #C9A84C 0%, #E2C878 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      boxShadow: '0 0 12px rgba(201,168,76,0.3)',
    }}>
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

  const isTrial = user?.subscriptionStatus === 'trial' || !user?.subscriptionStatus;
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
        <div style={{ padding: '18px 14px 12px', flexShrink: 0, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
              <FPLogo size={isCollapsed ? 32 : 26} />
              <div className="sidebar-shrink">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--foreground)', letterSpacing: '-0.2px' }}>FacturaPro</div>
                <div style={{ fontSize: '9px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.8 }}>Business Suite</div>
              </div>
            </Link>
            {!isCollapsed && (
              <button onClick={onClose} className="sidebar-hide mobile-only" style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '5px',
                color: 'var(--foreground-subtle)',
                display: 'flex', transition: 'color 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--foreground)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--foreground-subtle)'; }}
              ><X size={14}/></button>
            )}
          </div>
          <button onClick={onToggleCollapse} className="pub-nav-desktop hover:shadow-sm" style={{
            position: 'absolute', top: '22px', right: '-12px', width: '24px', height: '24px',
            background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10,
            color: 'var(--foreground-muted)'
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--foreground-muted)')}
            title={isCollapsed ? 'Agrandir' : 'Réduire'}
          >
            <ChevronRight size={14} style={{ transform: isCollapsed ? 'rotate(0)' : 'rotate(180deg)', transition: 'transform 0.2s' }}/>
          </button>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', background: 'var(--border)', margin: '0 16px 16px' }}/>

        {/* ── Nav ── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
          <div style={{ fontSize: '9px', color: 'var(--foreground-subtle)', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '4px 8px 6px' }}>Principal</div>
          {mainItems.map((item, i) => {
            const Icon = item.icon;
            const active = currentModule === item.id;
            return (
              <button key={item.id} onClick={() => handleNav(item.id)}
                className={`app-nav-item ${active ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
                style={{ opacity: 0, animation: `fp-fade-up 0.35s ease ${i * 0.035}s forwards`, display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                <Icon className="nav-icon" style={{ width: '13px', height: '13px', flexShrink: 0, color: active ? 'var(--gold)' : 'var(--foreground-subtle)', transition: 'color 0.15s' }}/>
                {!isCollapsed && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
                {active && !isCollapsed && <div className="nav-dot"/>}
              </button>
            );
          })}

          <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }}/>
          <div style={{ fontSize: '9px', color: 'var(--foreground-subtle)', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '4px 8px 6px' }}>Outils</div>
          {toolsItems.map((item, i) => {
            const Icon = item.icon;
            const active = currentModule === item.id;
            const isPremium = ['chat', 'companies'].includes(item.id);
            return (
              <button key={item.id} onClick={() => handleNav(item.id)}
                className={`app-nav-item ${active ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
                style={{ opacity: 0, animation: `fp-fade-up 0.35s ease ${(mainItems.length + i) * 0.035}s forwards`, display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                <Icon className="nav-icon" style={{ width: '13px', height: '13px', flexShrink: 0, color: active ? 'var(--gold)' : 'var(--foreground-subtle)', transition: 'color 0.15s' }}/>
                {!isCollapsed && (
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left' }}>
                    {item.label}
                    {isPremium && <span style={{ fontSize: '8px', background: 'var(--gold-dim)', color: 'var(--gold)', padding: '2px 4px', borderRadius: '2px', fontWeight: 800 }}>BIENTÔT</span>}
                  </span>
                )}
                {active && !isCollapsed && <div className="nav-dot"/>}
              </button>
            );
          })}
        </nav>

        {/* ── User + Plan ── */}
        <div style={{ padding: '12px 12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {/* User chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px', padding: isCollapsed ? '0' : '8px 10px', background: isCollapsed ? 'transparent' : 'var(--surface-2)', border: isCollapsed ? 'none' : '1px solid var(--border)', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', background: 'var(--gold-dim)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--gold)', flexShrink: 0 }}>
              {initials}
            </div>
            <div className="sidebar-shrink">
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || user?.company || 'Utilisateur'}</div>
              <div style={{ fontSize: '10px', color: 'var(--foreground-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.company}</div>
            </div>
          </div>

          {/* Trial Banner */}
          {isTrial && !isCollapsed && (
            <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid var(--border-gold)', padding: '10px', marginBottom: '8px' }}>
              <div style={{ fontSize: '9px', color: 'var(--gold)', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Zap size={9}/> Essai gratuit
              </div>
              <div style={{ fontSize: '10px', color: 'var(--foreground-muted)', marginBottom: '8px' }}>{trialHours} heure{trialHours !== 1 ? 's' : ''} restante{trialHours !== 1 ? 's' : ''}</div>
              {/* Progress bar */}
              <div style={{ height: '2px', background: 'var(--surface-3)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((trialHours / 24) * 100)}%`, background: 'linear-gradient(90deg, var(--gold), var(--gold-light))', transition: 'width 0.6s ease' }}/>
              </div>
              <button onClick={() => setCurrentModule('pricing' as any)} style={{
                width: '100%', marginTop: '8px', padding: '6px',
                background: 'var(--gold)',
                color: '#0A0A0F', border: 'none',
                borderRadius: 0,
                fontSize: '10px', fontWeight: 800, cursor: 'pointer',
                letterSpacing: '0.5px', textTransform: 'uppercase', transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                S'abonner →
              </button>
            </div>
          )}

          {/* Logout */}
          <button onClick={() => { logout(); navigate('/'); }} style={{
            display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: '7px', width: '100%',
            padding: '8px 10px', background: 'transparent',
            border: isCollapsed ? 'none' : '1px solid var(--border)',
            borderRadius: 0,
            cursor: 'pointer', color: 'var(--foreground-subtle)', fontSize: '11px',
            fontFamily: 'var(--font-sans)', fontWeight: 600, transition: 'all 0.15s',
            letterSpacing: '0.2px',
          }}
            title="Se déconnecter"
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(239,68,68,0.08)'; el.style.color = '#ef4444'; el.style.borderColor = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--foreground-subtle)'; el.style.borderColor = isCollapsed ? 'transparent' : 'var(--border)'; }}
          >
            <LogOut style={{ width: '11px', height: '11px' }}/> <span className="sidebar-shrink">Se déconnecter</span>
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─── App Layout ────────────────────────────────────────────────────── */
function AppLayout() {
  const { currentModule, user } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [prevModule, setPrevModule] = useState(currentModule);
  const [animKey, setAnimKey] = useState(0);
  const active = NAV.find(n => n.id === currentModule);

  const isTrial    = user?.subscriptionStatus === 'trial' || !user?.subscriptionStatus;
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
      
      if (sc) {
        const rgbSc = hexToRgb(sc);
        document.documentElement.style.setProperty('--blue-accent', sc);
        document.documentElement.style.setProperty('--blue-dim', `rgba(${rgbSc}, 0.1)`);
        document.documentElement.style.setProperty('--color-blue-accent', sc);
        document.documentElement.style.setProperty('--secondary', sc);
      }
      
      if (ac) {
        document.documentElement.style.setProperty('--success', ac);
        document.documentElement.style.setProperty('--color-success', ac);
        document.documentElement.style.setProperty('--accent', ac);
      }
    } else {
      document.documentElement.style.removeProperty('--gold');
      document.documentElement.style.removeProperty('--gold-light');
      document.documentElement.style.removeProperty('--gold-dim');
      document.documentElement.style.removeProperty('--gold-glow');
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--border-gold');
      document.documentElement.style.removeProperty('--ring');
      document.documentElement.style.removeProperty('--blue-accent');
      document.documentElement.style.removeProperty('--blue-dim');
      document.documentElement.style.removeProperty('--color-blue-accent');
      document.documentElement.style.removeProperty('--success');
      document.documentElement.style.removeProperty('--color-success');
    }
    
  }, [user?.primaryColor, user?.secondaryColor, user?.accentColor]);

  // Desktop: sidebar always visible (240px margin)
  const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;

  if (isTrial && trialHours <= 0) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--background)', color: 'var(--foreground)', overflowY: 'auto' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
            <Zap size={48} style={{ color: 'var(--gold)', margin: '0 auto 24px' }}/>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px', color: 'var(--foreground)' }}>Période d'essai terminée</h1>
            <p style={{ fontSize: '16px', color: 'var(--foreground-subtle)', marginBottom: '40px', lineHeight: 1.6 }}>
              Votre essai gratuit de 24 heures est arrivé à expiration. Pour continuer à utiliser FacturaPro sans interruption, veuillez activer votre abonnement ci-dessous.
            </p>
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', textAlign: 'left', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <Pricing />
            </div>
            <button onClick={() => { sessionStorage.removeItem('token'); window.location.href = '/login'; }} style={{ marginTop: '32px', background: 'none', border: 'none', color: 'var(--foreground-muted)', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}>
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
        <div style={{ position: 'relative', zIndex: 200, background: 'linear-gradient(90deg, rgba(201,168,76,0.15), rgba(226,200,120,0.1))', borderBottom: '1px solid var(--border-gold)', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', backdropFilter: 'blur(10px)' }}>
          <Zap size={13} style={{ color: 'var(--gold)', flexShrink: 0 }}/>
          <span style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
            Il reste <strong style={{ color: 'var(--gold)' }}>{trialHours} heure{trialHours !== 1 ? 's' : ''}</strong> à votre essai gratuit.
          </span>
          <button onClick={() => useAppStore.getState().setCurrentModule('pricing' as any)} style={{ background: 'var(--gold)', color: '#0A0A0F', border: 'none', borderRadius: 0, padding: '4px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
            S'abonner
          </button>
        </div>
      )}
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: isCollapsed ? '68px' : '228px', flexShrink: 0, position: 'relative', transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
        <style>{`
          @media (min-width: 769px) {
            .app-sidebar { transform: translateX(0) !important; box-shadow: none !important; }
          }
        `}</style>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, marginLeft: 0 }}>

        {/* Header */}
        <header className="fp-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(true)} className="mobile-only" style={{
              width: '30px', height: '30px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              <Menu style={{ width: '14px', height: '14px', color: 'var(--foreground-muted)' }}/>
            </button>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <span style={{ color: 'var(--foreground-subtle)' }}>FacturaPro</span>
              <ChevronRight size={12} style={{ color: 'var(--foreground-subtle)' }}/>
              <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{active?.label}</span>
            </div>
          </div>

          {/* Header right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Notification bell */}
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  style={{
                  width: '32px', height: '32px',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', transition: 'all 0.2s', borderRadius: '8px'
                }}
                  className="hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]"
                >
                  <Bell style={{ width: '14px', height: '14px', color: 'var(--foreground-muted)' }}/>
                  <div style={{ position: 'absolute', top: '7px', right: '7px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)', border: '1.5px solid var(--surface-2)' }}/>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 mr-4 mt-2" align="end">
                <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-1)] flex justify-between items-center">
                  <h4 className="font-semibold text-[13px] text-[var(--foreground)]">Notifications</h4>
                  <span className="text-[11px] text-[var(--gold)] font-medium bg-[var(--gold-dim)] px-2 py-0.5 rounded-full border border-[var(--border-gold)]">3 Nouvelles</span>
                </div>
                <div className="flex flex-col max-h-[300px] overflow-y-auto">
                  <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-hover)] cursor-pointer hover:bg-[var(--surface-2)] transition-colors">
                    <p className="text-[12px] font-medium text-[var(--foreground)] mb-1">Paiement reçu</p>
                    <p className="text-[11px] text-[var(--foreground-muted)] line-clamp-2">Le client <strong>Acme Corp</strong> a réglé la facture #FAC-2026-001 de 1 200,00 $.</p>
                    <p className="text-[10px] text-[var(--foreground-subtle)] mt-2">Il y a 10 minutes</p>
                  </div>
                  <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-hover)] cursor-pointer hover:bg-[var(--surface-2)] transition-colors">
                    <p className="text-[12px] font-medium text-[var(--foreground)] mb-1">Rappel automatique</p>
                    <p className="text-[11px] text-[var(--foreground-muted)] line-clamp-2">Le devis #DEV-2026-014 est en attente d'approbation depuis 7 jours.</p>
                    <p className="text-[10px] text-[var(--foreground-subtle)] mt-2">Il y a 2 heures</p>
                  </div>
                  <div className="p-4 bg-white cursor-pointer hover:bg-[var(--surface-2)] transition-colors">
                    <p className="text-[12px] font-medium text-[var(--foreground)] mb-1">Bienvenue sur FacturaPro</p>
                    <p className="text-[11px] text-[var(--foreground-muted)] line-clamp-2">Votre compte a été configuré avec succès. Explorez votre tableau de bord.</p>
                    <p className="text-[10px] text-[var(--foreground-subtle)] mt-2">Il y a 1 jour</p>
                  </div>
                </div>
                <div className="p-3 bg-[var(--surface-2)] border-t border-[var(--border)] text-center">
                  <button className="text-[12px] font-semibold text-[var(--primary)] hover:underline" onClick={() => toast.success("Toutes les notifications marquées comme lues.")}>Marquer tout comme lu</button>
                </div>
              </PopoverContent>
            </Popover>

            {/* User Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  style={{
                  width: '32px', height: '32px',
                  background: 'var(--gold-dim)', border: '1px solid var(--border-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s', borderRadius: '8px',
                  fontSize: '11px', fontWeight: 800, color: 'var(--gold)',
                }}
                  className="hover:bg-[var(--gold)] hover:text-white"
                >
                  {initials}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 mr-4 mt-2" align="end">
                <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <p className="text-[13px] font-bold text-[var(--foreground)]">{user?.name || 'Utilisateur'}</p>
                  <p className="text-[11px] text-[var(--foreground-muted)] truncate">{user?.email || 'email@example.com'}</p>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <button 
                    onClick={() => { useAppStore.getState().setCurrentModule('settings' as any); document.dispatchEvent(new MouseEvent('click')); }}
                    className="flex items-center gap-3 px-3 py-2 text-[12px] font-medium text-[var(--foreground)] rounded-md hover:bg-[var(--surface-2)] transition-colors w-full text-left"
                  >
                    <SettingsIcon size={14} className="text-[var(--foreground-muted)]" /> Paramètres du compte
                  </button>
                  <button 
                    onClick={() => { useAppStore.getState().setCurrentModule('catalog' as any); document.dispatchEvent(new MouseEvent('click')); }}
                    className="flex items-center gap-3 px-3 py-2 text-[12px] font-medium text-[var(--foreground)] rounded-md hover:bg-[var(--surface-2)] transition-colors w-full text-left"
                  >
                    <LayoutList size={14} className="text-[var(--foreground-muted)]" /> Mon Catalogue
                  </button>
                </div>
                <div className="p-2 border-t border-[var(--border)]">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 text-[12px] font-medium text-red-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors w-full text-left"
                  >
                    <LogOut size={14} /> Déconnexion
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', padding: 'clamp(16px, 2.5vw, 28px)' }}>

          {/* Module container */}
          <div key={animKey} style={{ opacity: 0, animation: 'fp-fade-up 0.35s ease forwards' }}>
            {currentModule === 'dashboard' && <Dashboard />}
            {currentModule === 'clients'   && <Clients />}
            {currentModule === 'catalog'   && <Catalog />}
            {currentModule === 'invoices'  && <Invoices />}
            {currentModule === 'receipts'  && <Receipts />}
            {currentModule === 'expenses'  && <Expenses />}
            {currentModule === 'reminders' && <Reminders />}
            {currentModule === 'chat'      && (user?.subscriptionPlan === 'premium' ? <ChatIA /> : <PremiumOverlay featureName="Assistant IA (ARIA)" />)}
            {currentModule === 'companies' && (user?.subscriptionPlan === 'premium' ? <Companies /> : <PremiumOverlay featureName="Multi-Entreprise" />)}
            {currentModule === 'settings'  && <Settings />}
            {currentModule === 'pricing'   && <Pricing />}
          </div>
        </main>
      </div>
      </div>
    </div>
  );
}

function PremiumOverlay({ featureName }: { featureName: string }) {
  const { setCurrentModule } = useAppStore();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', padding: '20px' }}>
      <div style={{ width: '60px', height: '60px', background: 'var(--gold-dim)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <Zap size={28} style={{ color: 'var(--gold)' }} />
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '10px' }}>Bientôt disponible</h2>
      <p style={{ color: 'var(--foreground-subtle)', maxWidth: '400px', lineHeight: 1.5, marginBottom: '24px' }}>
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
