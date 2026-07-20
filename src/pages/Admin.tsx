import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Account {
  id: string; email: string; companyName: string; firstName?: string; lastName?: string;
  fullName: string; phone?: string; address?: string; website?: string; taxId?: string;
  subscriptionPlan: string; subscriptionStatus: string; subscriptionExpiresAt?: string;
  subscriptionAmount: number; lastPaymentDate?: string; adminNotes?: string;
  isSuspended: number; createdAt: string;
  totalClients: number; totalInvoices: number; totalReceipts: number; totalRevenue: number;
}
interface Stats {
  totalAccounts: number; trialAccounts: number; activeAccounts: number;
  expiredAccounts: number; suspendedAccounts: number; mensuelAccounts: number;
  annuelAccounts: number; totalRevenuePlatform: number; newAccountsThisMonth: number;
  recentAccounts: Partial<Account>[]; recentLogs: any[];
  premiumAccounts?: number; freeAccounts?: number; totalRevenue?: number;
  totalInvoices?: number; totalClients?: number; newThisMonth?: number;
  conversionRate?: number | string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ADMIN_API = '/api/v1/admin';
const PLANS = { free: 'Essai Gratuit', mensuel: 'Mensuel', annuel: 'Premium' };
const STATUS_LABELS: Record<string, [string, string]> = {
  trial:     ['Essai', '#f59e0b'],
  active:    ['Actif', '#10b981'],
  expired:   ['Expiré', '#ef4444'],
  suspended: ['Suspendu', '#6b7280'],
};
const fmt = (n: number) => new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────
export function Admin() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('admin_token'));
  const [loginStep, setLoginStep] = useState<1 | 2>(1); // Step 1: email+mdp, Step 2: PIN
  const [loginData, setLoginData] = useState({ email: '', password: '', pin: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState<Partial<Account>>({});
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'logs'>('dashboard');
  const [logs, setLogs] = useState<any[]>([]);

  const adminFetch = useCallback(async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(`${ADMIN_API}/${path}`, {
      ...opts,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
    });
    return res.json();
  }, [token]);

  const loadData = useCallback(async () => {
    if (!token) return;
    const [s, a] = await Promise.all([
      adminFetch('stats'),
      adminFetch(`accounts?q=${search}&status=${filterStatus}`)
    ]);
    if (s && !s.error) {
      setStats({
        ...s.kpis,
        recentAccounts: s.recentAccounts || [],
        recentLogs: s.recentLogs || [],
        mrrCurve: s.mrrCurve || [],
        acquisitionCurve: s.acquisitionCurve || []
      });
    }
    if (Array.isArray(a)) setAccounts(a);
  }, [token, adminFetch, search, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Login Step 1 : email + password ──────────────────────────────────────
  const handleLoginStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) { setLoginError('Champs requis.'); return; }
    setLoginStep(2);
    setLoginError('');
  };

  // ── Login Step 2 : PIN ────────────────────────────────────────────────────
  const handleLoginStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(''); setLoginLoading(true);
    try {
      const res = await fetch(`/api/v1/admin_auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginData.email, password: loginData.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Accès refusé');
      sessionStorage.setItem('admin_token', data.token);
      setToken(data.token);
    } catch (err: any) {
      setLoginError(err.message);
    } finally { setLoginLoading(false); }
  };

  const logout = () => { sessionStorage.removeItem('admin_token'); setToken(null); setLoginStep(1); setLoginData({ email: '', password: '', pin: '' }); };

  const openEdit = (acc: Account) => { setSelectedAccount(acc); setEditData({ subscriptionPlan: acc.subscriptionPlan, subscriptionStatus: acc.subscriptionStatus, subscriptionAmount: acc.subscriptionAmount, subscriptionExpiresAt: acc.subscriptionExpiresAt, adminNotes: acc.adminNotes, isSuspended: acc.isSuspended }); setEditModal(true); };

  const saveEdit = async () => {
    if (!selectedAccount) return;
    await adminFetch(`accounts/${selectedAccount.id}`, { method: 'PUT', body: JSON.stringify(editData) });
    setEditModal(false);
    loadData();
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('⚠️ Supprimer définitivement ce compte et TOUTES ses données ?')) return;
    await adminFetch(`accounts/${id}`, { method: 'DELETE' });
    loadData();
  };

  const handleRenewTrial = async (id: string) => {
    if (!confirm('Prolonger l\'essai de 24h supplémentaires ?')) return;
    const res = await adminFetch(`accounts/${id}/renew-trial`, { method: 'POST' });
    if (res.success) alert(res.message);
    setEditModal(false);
    loadData();
  };

  const handleManualUpgrade = async (id: string) => {
    if (!confirm('Activer Premium 1 an et envoyer l\'email de confirmation au client ?')) return;
    const res = await adminFetch(`accounts/${id}/manual-upgrade`, { method: 'POST' });
    if (res.success) alert(res.message);
    setEditModal(false);
    loadData();
  };

  // ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
  if (!token) return (
    <div style={{ minHeight:'100vh', background:'#030712', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:'400px', padding:'40px', background:'#0f1629', border:'1px solid #1e2d4a', borderRadius:'20px', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'56px', height:'56px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'16px', marginBottom:'16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 style={{ color:'#f0f6ff', fontSize:'22px', fontWeight:800, margin:0 }}>Admin FacturaPro</h1>
          <p style={{ color:'#475569', fontSize:'13px', marginTop:'6px' }}>
            {loginStep === 1 ? 'Étape 1/2 — Vos identifiants' : 'Étape 2/2 — Code PIN secret'}
          </p>
        </div>

        {/* Step indicators */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'28px' }}>
          {[1,2].map(s => <div key={s} style={{ flex:1, height:'3px', borderRadius:'2px', background: loginStep >= s ? '#6366f1' : '#1e2d4a' }} />)}
        </div>

        {loginError && <div style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', padding:'12px', color:'#f87171', fontSize:'13px', marginBottom:'20px', textAlign:'center' }}>{loginError}</div>}

        {loginStep === 1 ? (
          <form onSubmit={handleLoginStep1} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <label style={{ color:'#94a3b8', fontSize:'12px', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', display:'block', marginBottom:'8px' }}>Email Admin</label>
              <input type="text" value={loginData.email} onChange={e => setLoginData(d => ({...d, email:e.target.value}))} placeholder="Identifiant admin" required
                style={{ width:'100%', padding:'12px 14px', background:'#0a0f1e', border:'1px solid #1e2d4a', borderRadius:'10px', color:'#f0f6ff', fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ color:'#94a3b8', fontSize:'12px', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', display:'block', marginBottom:'8px' }}>Mot de Passe</label>
              <input type="password" value={loginData.password} onChange={e => setLoginData(d => ({...d, password:e.target.value}))} placeholder="••••••••••••" required
                style={{ width:'100%', padding:'12px 14px', background:'#0a0f1e', border:'1px solid #1e2d4a', borderRadius:'10px', color:'#f0f6ff', fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
            </div>
            <button type="submit" style={{ padding:'13px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:700, fontSize:'15px', borderRadius:'10px', border:'none', cursor:'pointer', marginTop:'8px' }}>
              Continuer →
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginStep2} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'10px', padding:'14px', fontSize:'13px', color:'#a5b4fc' }}>
              🔐 Entrez votre code PIN secret à 6 chiffres. Ce code est différent de votre mot de passe.
            </div>
            <div>
              <label style={{ color:'#94a3b8', fontSize:'12px', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', display:'block', marginBottom:'8px' }}>Code PIN Secret (6 chiffres)</label>
              <input type="password" inputMode="numeric" maxLength={6} value={loginData.pin} onChange={e => setLoginData(d => ({...d, pin:e.target.value}))} placeholder="• • • • • •" required
                style={{ width:'100%', padding:'14px', background:'#0a0f1e', border:'1px solid #6366f1', borderRadius:'10px', color:'#f0f6ff', fontSize:'22px', textAlign:'center', outline:'none', letterSpacing:'8px', boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button type="button" onClick={() => setLoginStep(1)} style={{ flex:1, padding:'13px', background:'#1e2d4a', color:'#94a3b8', fontWeight:600, borderRadius:'10px', border:'none', cursor:'pointer' }}>← Retour</button>
              <button type="submit" disabled={loginLoading} style={{ flex:2, padding:'13px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:700, fontSize:'15px', borderRadius:'10px', border:'none', cursor:'pointer' }}>
                {loginLoading ? 'Vérification...' : '🔓 Accéder au Back Office'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  // ─── DASHBOARD ────────────────────────────────────────────────────────────────
  const statCard = (label: string, value: string | number, color: string, icon: string) => (
    <div style={{ background:'#0f1629', border:'1px solid #1e2d4a', borderRadius:'16px', padding:'24px', flex:1, minWidth:'150px' }}>
      <div style={{ fontSize:'28px', marginBottom:'8px' }}>{icon}</div>
      <div style={{ fontSize:'26px', fontWeight:900, color, lineHeight:1 }}>{value}</div>
      <div style={{ color:'#64748b', fontSize:'12px', fontWeight:600, marginTop:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
    </div>
  );

  const statusBadge = (status: string) => {
    const [label, color] = STATUS_LABELS[status] ?? ['Inconnu', '#6b7280'];
    return <span style={{ background:`${color}22`, color, fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px', border:`1px solid ${color}44` }}>{label}</span>;
  };

  const planBadge = (plan: string) => {
    const colors: Record<string, string> = { free:'#6366f1', mensuel:'#06b6d4', annuel:'#f59e0b' };
    const c = colors[plan] ?? '#6b7280';
    return <span style={{ background:`${c}22`, color:c, fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px', border:`1px solid ${c}44` }}>{PLANS[plan as keyof typeof PLANS] ?? plan}</span>;
  };

  return (
    <div style={{ minHeight:'100vh', background:'#030712', color:'#e2e8f0', fontFamily:'Inter,system-ui,sans-serif', display:'flex', flexDirection:'column' }}>

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{ background:'#0f1629', borderBottom:'1px solid #1e2d4a', padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'36px', height:'36px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <span style={{ fontWeight:900, fontSize:'16px', color:'#f0f6ff', letterSpacing:'-0.3px' }}>FacturaPro <span style={{ color:'#6366f1' }}>Admin</span></span>
        </div>

        <nav style={{ display:'flex', gap:'4px' }}>
          {(['dashboard','accounts','logs'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding:'8px 18px', background: activeTab===tab ? '#6366f1' : 'transparent', color: activeTab===tab ? '#fff' : '#64748b', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:600, textTransform:'capitalize' }}>
              {tab === 'dashboard' ? '📊 Dashboard' : tab === 'accounts' ? '👥 Utilisateurs' : '📋 Logs'}
            </button>
          ))}
        </nav>

        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#10b981', boxShadow:'0 0 0 3px rgba(16,185,129,0.2)' }} />
          <span style={{ color:'#64748b', fontSize:'13px' }}>Connecté</span>
          <button onClick={logout} style={{ padding:'7px 14px', background:'rgba(239,68,68,0.1)', color:'#f87171', borderRadius:'8px', border:'1px solid rgba(239,68,68,0.2)', cursor:'pointer', fontSize:'12px', fontWeight:600 }}>Déconnexion</button>
        </div>
      </header>

      {/* ─── CONTENT ────────────────────────────────────────────────────────── */}
      <main style={{ flex:1, padding:'32px', maxWidth:'1400px', margin:'0 auto', width:'100%', boxSizing:'border-box' }}>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && stats && (
          <div style={{ display:'flex', flexDirection:'column', gap:'28px' }}>
            <div>
              <h2 style={{ color:'#f0f6ff', fontWeight:900, fontSize:'24px', margin:'0 0 4px' }}>Vue d'ensemble</h2>
              <p style={{ color:'#475569', fontSize:'14px', margin:0 }}>{new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
            </div>

            {/* Stats cards */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'16px' }}>
              {statCard('Total Comptes', stats.totalAccounts, '#6366f1', '👥')}
              {statCard('Premium', stats.premiumAccounts, '#10b981', '⭐')}
              {statCard('Gratuit / Essai', stats.freeAccounts, '#f59e0b', '⏳')}
              {statCard('Suspendus', stats.suspendedAccounts, '#ef4444', '🚫')}
              {statCard('Total Revenus', fmt(stats.totalRevenue), '#10b981', '💰')}
              {statCard('Factures Pro', stats.totalInvoices, '#06b6d4', '📄')}
              {statCard('Clients Gérés', stats.totalClients, '#a78bfa', '👥')}
              {statCard('Nouveaux (30j)', stats.newThisMonth, '#f472b6', '🆕')}
              {statCard('Taux Conversion', stats.conversionRate + '%', '#8b5cf6', '📈')}
            </div>

            {/* Recent accounts */}
            <div style={{ background:'#0f1629', border:'1px solid #1e2d4a', borderRadius:'16px', overflow:'hidden' }}>
              <div style={{ padding:'20px 24px', borderBottom:'1px solid #1e2d4a' }}>
                <h3 style={{ color:'#f0f6ff', fontWeight:800, margin:0, fontSize:'16px' }}>🆕 Derniers Inscrits</h3>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#0a0f1e' }}>
                    {['Entreprise', 'Email', 'Plan', 'Statut', 'Inscrit le'].map(h => (
                      <th key={h} style={{ padding:'12px 20px', textAlign:'left', color:'#475569', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAccounts.map((acc, i) => (
                    <tr key={acc.id} style={{ borderTop:'1px solid #1e2d4a', background: i%2===0 ? 'transparent' : '#0a0f1e' }}>
                      <td style={{ padding:'14px 20px', fontWeight:700, color:'#f0f6ff' }}>{acc.companyName}</td>
                      <td style={{ padding:'14px 20px', color:'#94a3b8', fontSize:'13px' }}>{acc.email}</td>
                      <td style={{ padding:'14px 20px' }}>{planBadge(acc.subscriptionPlan ?? 'free')}</td>
                      <td style={{ padding:'14px 20px' }}>{statusBadge(acc.subscriptionStatus ?? 'trial')}</td>
                      <td style={{ padding:'14px 20px', color:'#64748b', fontSize:'13px' }}>{fmtDate(acc.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACCOUNTS TAB */}
        {activeTab === 'accounts' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
              <h2 style={{ color:'#f0f6ff', fontWeight:900, fontSize:'24px', margin:0 }}>Gestion des Utilisateurs</h2>
              <div style={{ display:'flex', gap:'10px' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{ padding:'10px 14px', background:'#0f1629', border:'1px solid #1e2d4a', borderRadius:'10px', color:'#f0f6ff', fontSize:'13px', outline:'none', width:'220px' }} />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding:'10px 14px', background:'#0f1629', border:'1px solid #1e2d4a', borderRadius:'10px', color:'#94a3b8', fontSize:'13px', outline:'none' }}>
                  <option value="">Tous les statuts</option>
                  <option value="trial">Essai</option>
                  <option value="active">Actif</option>
                  <option value="expired">Expiré</option>
                  <option value="suspended">Suspendu</option>
                </select>
                <button onClick={loadData} style={{ padding:'10px 18px', background:'#1e2d4a', color:'#94a3b8', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'13px' }}>↻ Rafraîchir</button>
              </div>
            </div>

            <div style={{ background:'#0f1629', border:'1px solid #1e2d4a', borderRadius:'16px', overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'900px' }}>
                <thead>
                  <tr style={{ background:'#0a0f1e' }}>
                    {['Entreprise / Contact', 'Email', 'Plan', 'Statut', 'Expire le', 'Clients', 'Factures', 'CA Total', 'Inscrit le', 'Actions'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'#475569', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc, i) => (
                    <tr key={acc.id} style={{ borderTop:'1px solid #1e2d4a', background: acc.isSuspended ? 'rgba(239,68,68,0.04)' : i%2===0 ? 'transparent' : '#0a0f1e' }}>
                      <td style={{ padding:'14px 16px' }}>
                        <div style={{ fontWeight:700, color:'#f0f6ff', fontSize:'14px' }}>{acc.companyName}</div>
                        {acc.fullName && <div style={{ color:'#64748b', fontSize:'12px' }}>{acc.fullName}</div>}
                        {acc.phone && <div style={{ color:'#475569', fontSize:'11px' }}>{acc.phone}</div>}
                        {acc.isSuspended === 1 && <span style={{ color:'#ef4444', fontSize:'10px', fontWeight:700 }}>🚫 SUSPENDU</span>}
                      </td>
                      <td style={{ padding:'14px 16px', color:'#94a3b8', fontSize:'13px' }}>{acc.email}</td>
                      <td style={{ padding:'14px 16px' }}>{planBadge(acc.subscriptionPlan)}</td>
                      <td style={{ padding:'14px 16px' }}>{statusBadge(acc.subscriptionStatus)}</td>
                      <td style={{ padding:'14px 16px', color:'#64748b', fontSize:'12px' }}>{fmtDate(acc.subscriptionExpiresAt)}</td>
                      <td style={{ padding:'14px 16px', textAlign:'center', color:'#6366f1', fontWeight:700 }}>{acc.totalClients}</td>
                      <td style={{ padding:'14px 16px', textAlign:'center', color:'#06b6d4', fontWeight:700 }}>{acc.totalInvoices}</td>
                      <td style={{ padding:'14px 16px', color:'#10b981', fontWeight:700, fontSize:'13px', whiteSpace:'nowrap' }}>{fmt(acc.totalRevenue)}</td>
                      <td style={{ padding:'14px 16px', color:'#475569', fontSize:'12px', whiteSpace:'nowrap' }}>{fmtDate(acc.createdAt)}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <div style={{ display:'flex', gap:'6px' }}>
                          <button onClick={() => openEdit(acc)} style={{ padding:'6px 12px', background:'#6366f122', color:'#818cf8', borderRadius:'7px', border:'1px solid #6366f133', cursor:'pointer', fontSize:'12px', fontWeight:600 }}>✏️ Gérer</button>
                          <button onClick={() => deleteAccount(acc.id)} style={{ padding:'6px', background:'#ef444422', color:'#f87171', borderRadius:'7px', border:'1px solid #ef444433', cursor:'pointer', fontSize:'12px' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {accounts.length === 0 && (
                    <tr><td colSpan={10} style={{ padding:'40px', textAlign:'center', color:'#475569' }}>Aucun compte trouvé</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <h2 style={{ color:'#f0f6ff', fontWeight:900, fontSize:'24px', margin:0 }}>Journal d'Activité Admin</h2>
            <div style={{ background:'#0f1629', border:'1px solid #1e2d4a', borderRadius:'16px', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#0a0f1e' }}>
                    {['Action', 'Compte concerné', 'Détails', 'Date'].map(h => (
                      <th key={h} style={{ padding:'12px 20px', textAlign:'left', color:'#475569', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentLogs ?? []).map((log: any, i: number) => (
                    <tr key={log.id} style={{ borderTop:'1px solid #1e2d4a', background: i%2===0 ? 'transparent' : '#0a0f1e' }}>
                      <td style={{ padding:'12px 20px' }}>
                        <span style={{ background:'rgba(99,102,241,0.15)', color:'#818cf8', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'6px', fontFamily:'monospace' }}>{log.action}</span>
                      </td>
                      <td style={{ padding:'12px 20px', color:'#64748b', fontSize:'12px', fontFamily:'monospace' }}>{log.targetAccountId ?? '—'}</td>
                      <td style={{ padding:'12px 20px', color:'#94a3b8', fontSize:'12px', maxWidth:'300px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.details ?? '—'}</td>
                      <td style={{ padding:'12px 20px', color:'#475569', fontSize:'12px', whiteSpace:'nowrap' }}>{new Date(log.createdAt).toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                  {(stats?.recentLogs ?? []).length === 0 && (
                    <tr><td colSpan={4} style={{ padding:'40px', textAlign:'center', color:'#475569' }}>Aucune activité enregistrée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ─── MODAL GESTION COMPTE ───────────────────────────────────────────── */}
      {editModal && selectedAccount && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'20px' }}>
          <div style={{ background:'#0f1629', border:'1px solid #1e2d4a', borderRadius:'20px', padding:'32px', width:'100%', maxWidth:'560px', maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ color:'#f0f6ff', fontWeight:900, fontSize:'20px', margin:'0 0 6px' }}>⚙️ Gérer le compte</h3>
            <p style={{ color:'#475569', fontSize:'13px', margin:'0 0 28px' }}>{selectedAccount.companyName} — {selectedAccount.email}</p>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
              <div>
                <label style={{ color:'#94a3b8', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', display:'block', marginBottom:'8px' }}>Plan</label>
                <select value={editData.subscriptionPlan} onChange={e => setEditData(d => ({...d, subscriptionPlan:e.target.value}))} style={{ width:'100%', padding:'10px', background:'#0a0f1e', border:'1px solid #1e2d4a', borderRadius:'8px', color:'#f0f6ff', fontSize:'13px', outline:'none' }}>
                  <option value="free">Essai Gratuit</option>
                  <option value="mensuel">Mensuel (100 000 GNF)</option>
                  <option value="annuel">Premium (500 000 GNF)</option>
                </select>
              </div>
              <div>
                <label style={{ color:'#94a3b8', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', display:'block', marginBottom:'8px' }}>Statut</label>
                <select value={editData.subscriptionStatus} onChange={e => setEditData(d => ({...d, subscriptionStatus:e.target.value}))} style={{ width:'100%', padding:'10px', background:'#0a0f1e', border:'1px solid #1e2d4a', borderRadius:'8px', color:'#f0f6ff', fontSize:'13px', outline:'none' }}>
                  <option value="trial">Essai (Trial)</option>
                  <option value="active">Actif</option>
                  <option value="expired">Expiré</option>
                  <option value="suspended">Suspendu</option>
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
              <div>
                <label style={{ color:'#94a3b8', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', display:'block', marginBottom:'8px' }}>Montant Payé (GNF)</label>
                <input type="number" value={editData.subscriptionAmount ?? 0} onChange={e => setEditData(d => ({...d, subscriptionAmount:Number(e.target.value)}))} style={{ width:'100%', padding:'10px', background:'#0a0f1e', border:'1px solid #1e2d4a', borderRadius:'8px', color:'#f0f6ff', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ color:'#94a3b8', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', display:'block', marginBottom:'8px' }}>Expire le</label>
                <input type="date" value={editData.subscriptionExpiresAt?.split('T')[0] ?? ''} onChange={e => setEditData(d => ({...d, subscriptionExpiresAt:e.target.value}))} style={{ width:'100%', padding:'10px', background:'#0a0f1e', border:'1px solid #1e2d4a', borderRadius:'8px', color:'#f0f6ff', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ color:'#94a3b8', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', display:'block', marginBottom:'8px' }}>Notes Admin (privées)</label>
              <textarea value={editData.adminNotes ?? ''} onChange={e => setEditData(d => ({...d, adminNotes:e.target.value}))} rows={3} placeholder="Notes visibles uniquement par vous..."
                style={{ width:'100%', padding:'10px', background:'#0a0f1e', border:'1px solid #1e2d4a', borderRadius:'8px', color:'#f0f6ff', fontSize:'13px', outline:'none', resize:'vertical', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:'24px', display:'flex', alignItems:'center', gap:'10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px', padding:'14px' }}>
              <input type="checkbox" id="suspended" checked={editData.isSuspended === 1} onChange={e => setEditData(d => ({...d, isSuspended: e.target.checked ? 1 : 0}))} style={{ width:'16px', height:'16px', accentColor:'#ef4444' }} />
              <label htmlFor="suspended" style={{ color:'#f87171', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>🚫 Suspendre ce compte (bloque l'accès utilisateur)</label>
            </div>

            <div style={{ marginBottom:'24px', display:'flex', gap:'10px', flexWrap:'wrap' }}>
              {selectedAccount.subscriptionPlan === 'free' && (
                <button onClick={() => handleRenewTrial(selectedAccount.id)} style={{ padding:'10px 16px', background:'#f59e0b22', color:'#f59e0b', borderRadius:'8px', border:'1px solid #f59e0b44', cursor:'pointer', fontSize:'13px', fontWeight:600 }}>⏳ Prolonger Essai (24h)</button>
              )}
              {selectedAccount.subscriptionPlan !== 'annuel' && (
                <button onClick={() => handleManualUpgrade(selectedAccount.id)} style={{ padding:'10px 16px', background:'#10b98122', color:'#10b981', borderRadius:'8px', border:'1px solid #10b98144', cursor:'pointer', fontSize:'13px', fontWeight:600 }}>⭐ Activer Premium 1 An</button>
              )}
            </div>

            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={() => setEditModal(false)} style={{ padding:'11px 22px', background:'#1e2d4a', color:'#94a3b8', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:600 }}>Annuler</button>
              <button onClick={saveEdit} style={{ padding:'11px 22px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:700 }}>💾 Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
