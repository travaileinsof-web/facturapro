import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { Admin } from '../components/Admin';
import { LogOut, ShieldAlert, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SuperAdminPage() {
  const { user, logout } = useAppStore();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const token = user?.token;
    if (!token) {
      setChecking(false);
      setIsAdmin(false);
      return;
    }

    fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) {
          setIsAdmin(true);
          useAppStore.setState(state => ({
            user: state.user ? { ...state.user, role: 'admin' } : state.user
          }));
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setChecking(false));
  }, [user?.token]);

  if (checking) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--background)' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--gold)' }} />
        <p style={{ color: 'var(--foreground-muted)', fontSize: '12px', marginTop: '16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Vérification...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--background)' }}>
        <div className="fp-card" style={{ padding: '40px', maxWidth: '400px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--destructive)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <ShieldAlert size={32} style={{ color: 'white' }} />
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: '20px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--foreground)' }}>Accès Interdit</h1>
          <p style={{ color: 'var(--foreground-muted)', margin: '0 0 32px', fontSize: '13px', lineHeight: 1.5 }}>
            Vous n'avez pas les privilèges super-administrateur requis.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <button onClick={() => navigate('/app')} className="fp-btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--foreground)', borderColor: 'var(--foreground)', color: 'white' }}>
              Retour à l'application
            </button>
            <button onClick={() => { logout(); navigate('/login'); }} className="fp-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--background)' }}>
      {/* Sidebar Placeholder */}
      <div style={{ width: isCollapsed ? '68px' : '228px', flexShrink: 0, position: 'relative', transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        {/* Sidebar Admin - Sharp Editorial */}
        <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
          <div style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: '16px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={20} style={{ color: 'white' }} />
            </div>
            <div className="sidebar-shrink">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--foreground)', fontSize: '15px', letterSpacing: '-0.2px' }}>SUPER ADMIN</div>
              <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '2px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>FacturaPro</div>
            </div>
            
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="pub-nav-desktop" style={{
              position: 'absolute', top: '28px', right: '-12px', width: '24px', height: '24px',
              background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10,
              color: 'var(--foreground-muted)'
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--foreground-muted)')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isCollapsed ? 'rotate(0)' : 'rotate(180deg)', transition: 'transform 0.2s' }}>
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div style={{ padding: '24px 16px', flex: 1 }}>
            {!isCollapsed && (
              <div style={{ fontSize: '10px', color: 'var(--foreground-subtle)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '8px' }}>
                Session Active
              </div>
            )}
            <div style={{ padding: isCollapsed ? '0' : '12px 16px', background: isCollapsed ? 'transparent' : 'var(--surface-2)', border: isCollapsed ? 'none' : '1px solid var(--border)' }}>
              <div className="sidebar-shrink">
                <div style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 600 }}>{user?.name || user?.email}</div>
                <div style={{ fontSize: '11px', color: 'var(--foreground-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{user?.email}</div>
              </div>
              {isCollapsed && (
                <div style={{ width: '32px', height: '32px', background: 'var(--surface-3)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="app-nav-item"
              style={{ border: isCollapsed ? 'none' : '1px solid var(--border)', background: 'transparent', padding: isCollapsed ? '10px 0' : '12px 16px', color: 'var(--foreground-muted)', transition: '0.2s', cursor: 'pointer', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
              title="Se déconnecter"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--destructive)'; (e.currentTarget as HTMLElement).style.borderColor = isCollapsed ? 'transparent' : 'var(--destructive)'; (e.currentTarget as HTMLElement).style.background = isCollapsed ? 'transparent' : '#fff2f2'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--foreground-muted)'; (e.currentTarget as HTMLElement).style.borderColor = isCollapsed ? 'transparent' : 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <LogOut size={16} /> <span className="sidebar-shrink" style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Déconnexion</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Contenu principal */}
      <main className="app-content" style={{ flex: 1, height: '100vh', overflowY: 'auto', background: 'var(--background)' }}>
        <Admin />
      </main>
    </div>
  );
}
