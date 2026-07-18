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
import { ModuleRouter } from './components/ModuleRouter';
import { Pricing } from './components/Pricing';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { cn } from './lib/utils';
import { toast } from 'sonner';
import { TourTutorial } from './components/TourTutorial';
import { ChatbotWidget } from './components/ChatbotWidget';
import DOMPurify from 'dompurify';
import { Sidebar, FPLogo, NAV, getTrialHoursRemaining } from './components/Sidebar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      // PERF: affiche les données en cache immédiatement (pas d'écran blanc entre navigations)
      staleTime: 60 * 1000,        // Considérer les données fraîches pendant 60 secondes
      gcTime: 5 * 60 * 1000,       // Garder en cache mémoire 5 minutes
      refetchOnMount: 'always',    // Mais quand même rafraîchir en arrière-plan au montage
    },
  },
});

/* ─── App Layout ────────────────────────────────────────────────────── */
function AppLayout() {
  const { currentModule, user, logout } = useAppStore();
  const navigate = useNavigate();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

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

  const { tourRunning, setTourRunning } = useAppStore();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (user && user.role !== 'employee') {
      const hasSeenTour = localStorage.getItem('fp_tour_completed');
      if (!hasSeenTour) {
        timeoutId = setTimeout(() => setTourRunning(true), 1000);
      }
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, setTourRunning]);

  const handleTourFinish = () => {
    setTourRunning(false);
    localStorage.setItem('fp_tour_completed', 'true');
  };

  const fetchNotifications = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch('/api/notifications/unread', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : [];
        setNotifications(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
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
      const res = await fetch(`/api/notifications/${id}`, {
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
    if (!user?.token) return;

    // PERF: /api/init = user + notifications en 1 seul round-trip DB
    fetch('/api/init', {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (!data) return;
      // Mettre à jour le user si changements (abonnement, couleurs, etc.)
      if (data.user?.id) {
        useAppStore.getState().login(data.user);
      }
      // Notifications en une fois
      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    })
    .catch(console.error);

    // Check for successful payment redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const ref = params.get('ref');
      const currentUser = useAppStore.getState().user;
      
      if (ref && currentUser?.token) {
        let attempts = 0;
        const checkSync = () => {
          fetch(`/api/v1/payment/sync?ref=${ref}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
          })
          .then(res => res.json())
          .then(data => {
            if (data.synced) {
              toast.success("Paiement validé ! Bienvenue dans la version Premium.");
              window.history.replaceState({}, document.title, window.location.pathname);
              setTimeout(() => window.location.reload(), 1500);
            } else if (attempts < 5) {
              attempts++;
              setTimeout(checkSync, 3000);
            } else {
              toast.info("Paiement en cours de traitement. Vous recevrez un email dès l'activation.");
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(() => {
            if (attempts < 5) { attempts++; setTimeout(checkSync, 3000); }
          });
        };
        checkSync();
      } else {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
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
        
        document.documentElement.style.setProperty('--color-secondary-override', sc);
        document.documentElement.style.setProperty('--color-blue-dim', `rgba(${rgbSc}, 0.1)`);
      }
      
      if (ac) {
        document.documentElement.style.setProperty('--success', ac);
        document.documentElement.style.setProperty('--color-success', ac);
        document.documentElement.style.setProperty('--accent', ac);
        
        document.documentElement.style.setProperty('--color-accent-override', ac);
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
      
      document.documentElement.style.removeProperty('--color-secondary-override');
      document.documentElement.style.removeProperty('--color-blue-dim');

      document.documentElement.style.removeProperty('--success');
      document.documentElement.style.removeProperty('--color-success');
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--color-accent-override');
    }
    
  }, [user?.primaryColor, user?.secondaryColor, user?.accentColor]);

  // Desktop: sidebar always visible (240px margin)
  const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;

  if (isTrial && (trialHours <= 0 || user?.subscriptionStatus === 'trial_expired')) {
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
      <TourTutorial run={tourRunning} onFinish={handleTourFinish} primaryColor={user?.primaryColor || '#B38E36'} />
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
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '16px' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notif.message) }} />
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
        <main style={{ flex: 1, overflow: 'auto', padding: 'clamp(24px, 4vw, 40px)', position: 'relative' }}>
          


          <ModuleRouter animKey={animKey} />

          {/* Floating Chat/Help Orb */}
          <button
            onClick={() => setIsChatbotOpen(!isChatbotOpen)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--gold)] text-[#0A0A0F] shadow-[0_4px_24px_rgba(201,168,76,0.5)] flex items-center justify-center cursor-pointer border-none z-[1000] hover:scale-110 transition-transform duration-300"
            title="Assistant IA & Aide"
          >
            <div className="absolute inset-0 rounded-full border-2 border-[var(--gold)] opacity-50 animate-ping" />
            {isChatbotOpen ? <X size={24} /> : <MessageSquare size={24} />}
          </button>
          
          <ChatbotWidget isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
        </main>
      </div>
      </div>
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
