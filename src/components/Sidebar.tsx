import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from './Logo';
import {
  LayoutDashboard, Users, FileText, Receipt as ReceiptIcon,
  MessageSquare, Settings as SettingsIcon, LayoutList, Wallet,
  LogOut, X, AlertTriangle, TrendingUp, Zap,
  ChevronRight, Building2, Info
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { cn } from '../lib/utils';
import { Tooltip } from './ui/tooltip';

export const NAV = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard,  group: 'main' },
  { id: 'clients',   label: 'Clients',          icon: Users,            group: 'main' },
  { id: 'catalog',   label: 'Catalogue',         icon: LayoutList,       group: 'main' },
  { id: 'invoices',  label: 'Factures',          icon: FileText,         group: 'main', info: "Générez vos factures. N'oubliez pas de définir une Date d'échéance pour activer les alertes de retard !" },
  { id: 'receipts',  label: 'Reçus',             icon: ReceiptIcon,      group: 'main', info: "Historique de tous les paiements (acomptes ou totaux) effectués par vos clients." },
  { id: 'expenses',  label: 'Dépenses',          icon: Wallet,           group: 'main', info: "Saisissez ici vos charges pour calculer votre bénéfice net." },
  { id: 'reminders', label: 'Relances',          icon: AlertTriangle,    group: 'main', info: "Retrouvez ici tous les clients ayant un reste à payer, échu ou non." },
  { id: 'chat',      label: 'Assistant IA',      icon: MessageSquare,    group: 'tools' },
  { id: 'companies', label: 'Entreprises',       icon: Building2,        group: 'tools' },
  { id: 'pricing',   label: 'Abonnement',        icon: TrendingUp,       group: 'tools' },
  { id: 'settings',  label: 'Paramètres',        icon: SettingsIcon,     group: 'tools' },
];

export function getTrialHoursRemaining(createdAt?: string) {
  if (!createdAt) return 24;
  const createStr = createdAt.includes('Z') ? createdAt : createdAt.replace(' ', 'T') + 'Z';
  const expireDate = new Date(new Date(createStr).getTime() + 24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60)));
}

export function FPLogo({ size = 26 }: { size?: number }) {
  return <Logo width={size} showText={false} />;
}

export function Sidebar({ open, onClose, isCollapsed, onToggleCollapse }: { open: boolean; onClose: () => void; isCollapsed: boolean; onToggleCollapse: () => void }) {
  const { currentModule, setCurrentModule, user, logout } = useAppStore();
  const navigate = useNavigate();

  const isTrial = user?.subscriptionStatus === 'trial' || user?.subscriptionStatus === 'trial_expired' || !user?.subscriptionStatus;
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
          background: 'rgba(0,0,0,0.5)',
          zIndex: 98, backdropFilter: 'blur(2px)',
        }} className="sidebar-hide" />
      )}

      <aside className={`app-sidebar ${open ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''} border-r-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
        style={{ transform: open ? 'translateX(0)' : undefined, zIndex: 100 }}>

        {/* ── Logo ── */}
        <div className="shrink-0 relative" style={{ padding: 'var(--space-5)' }}>
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
            <Link to="/" className="flex items-center no-underline" style={{ gap: 'var(--space-2)' }}>
              <Logo width={isCollapsed ? 32 : 140} showText={!isCollapsed} />
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
              <button key={item.id} id={`nav-${item.id}`} onClick={() => handleNav(item.id)}
                className={`app-nav-item ${active ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
                style={{ opacity: 0, animation: `fp-fade-up 0.35s ease ${i * 0.035}s forwards`, justifyContent: isCollapsed ? 'center' : 'flex-start', padding: 'var(--space-2) var(--space-4)', gap: 'var(--space-3)', height: '44px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-1)' }}>
                <Icon className="nav-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} strokeWidth={2}/>
                {!isCollapsed && (
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                    <span className="flex items-center gap-1.5">
                      {item.label}
                      {item.info && (
                        <Tooltip content={item.info}>
                          <Info size={14} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-help transition-colors" />
                        </Tooltip>
                      )}
                    </span>
                  </span>
                )}
              </button>
            );
          })}

          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-placeholder)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 var(--space-4)', marginTop: 'var(--space-6)', marginBottom: 'var(--space-2)' }}>Outils</span>
          {toolsItems.map((item, i) => {
            const Icon = item.icon;
            const active = currentModule === item.id;
            const isComingSoon = ['chat', 'companies'].includes(item.id);
            return (
              <button key={item.id} id={`nav-${item.id}`} onClick={() => handleNav(item.id)}
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
