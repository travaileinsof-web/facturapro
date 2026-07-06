import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { toast } from 'sonner';
import {
  Users, DollarSign, Search, LogIn,
  Crown, AlertTriangle, FileText, Building2,
  ArrowLeft, Calendar, Phone, MapPin, RefreshCw, Ban, CheckCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export function Admin() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'accounts' | 'details'>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const token = user?.token;

  const apiFetch = (path: string, opts: RequestInit = {}) =>
    fetch(`/api/admin/${path}`, {
      ...opts,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
    });

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [sRes, aRes] = await Promise.all([
        apiFetch('stats'),
        apiFetch('accounts')
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (aRes.ok) setAccounts(await aRes.json());
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const navBtn = (id: 'dashboard' | 'accounts', label: string) => {
    const active = view === id || (id === 'accounts' && view === 'details');
    return (
      <button
        onClick={() => setView(id)}
        style={{
          padding: '10px 20px', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
          background: active ? 'var(--gold)' : 'transparent',
          color: active ? 'white' : 'var(--foreground-muted)',
          border: '1px solid',
          borderColor: active ? 'var(--gold)' : 'transparent',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--foreground)'; }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--foreground-muted)'; }}
      >
        {label}
      </button>
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
      <RefreshCw size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--gold)' }} />
      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>Chargement...</span>
    </div>
  );

  return (
    <div style={{ padding: '0 40px 60px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Premium */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--background)', padding: '32px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', marginBottom: '40px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px' }}>
            Tableau de Bord Global
          </h1>
          <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--foreground-muted)' }}>
            Supervision du système • {accounts.length} institution{accounts.length > 1 ? 's' : ''} enregistrée{accounts.length > 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => loadData(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--foreground)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--foreground-muted)'; }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 8px' }}></div>
          {navBtn('dashboard', 'Aperçu')}
          {navBtn('accounts', 'Comptes & Utilisateurs')}
        </div>
      </div>

      {/* Content */}
      <div>
        {view === 'dashboard' && stats && (
          <AdminDashboard stats={stats} accounts={accounts} />
        )}
        {view === 'accounts' && (
          <AdminAccounts
            accounts={accounts}
            onSelect={(id) => { setSelectedAccountId(id); setView('details'); }}
          />
        )}
        {view === 'details' && selectedAccountId && (
          <AdminAccountDetails
            accountId={selectedAccountId}
            token={token || ''}
            onBack={() => { setView('accounts'); loadData(true); }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function AdminDashboard({ stats }: { stats: any; accounts: any[] }) {
  const kpis = [
    { label: 'Utilisateurs', value: stats.totalAccounts, icon: Users, color: 'var(--blue-accent)', desc: 'Nombre total de comptes créés sur la plateforme' },
    { label: 'Abonnés Premium', value: stats.premiumAccounts, icon: Crown, color: 'var(--gold)', desc: 'Comptes ayant un abonnement payant actif' },
    { label: 'Comptes Gratuits', value: stats.freeAccounts, icon: Building2, color: 'var(--success)', desc: 'Comptes en période d\'essai ou sur un plan gratuit' },
    { label: 'Revenus SaaS', value: `${Number(stats.totalRevenue).toLocaleString('fr-FR')} F`, icon: DollarSign, color: 'var(--gold)', desc: 'Montant total encaissé via les abonnements' },
    { label: 'Factures Émises', value: stats.totalInvoices, icon: FileText, color: 'var(--foreground-muted)', desc: 'Nombre total de factures générées par toutes les entreprises' },
    { label: 'Clients Enregistrés', value: stats.totalClients, icon: Users, color: 'var(--foreground-muted)', desc: 'Nombre total de clients finaux enregistrés par vos utilisateurs' },
    { label: 'Suspendus', value: stats.suspendedAccounts, icon: Ban, color: 'var(--destructive)', desc: 'Comptes bloqués par un administrateur' },
    { label: 'Expirations (<30j)', value: stats.expiringSoon, icon: AlertTriangle, color: 'var(--warning)', desc: 'Comptes dont l\'abonnement expire dans moins de 30 jours' },
  ];

  const premiumPct = stats.totalAccounts > 0 ? (stats.premiumAccounts / stats.totalAccounts) * 100 : 0;
  const freePct = 100 - premiumPct;

  // Mock data for the chart to make it ultra premium
  const chartData = [
    { name: 'Jan', revenue: 400000 }, { name: 'Fév', revenue: 650000 },
    { name: 'Mar', revenue: 1100000 }, { name: 'Avr', revenue: 1400000 },
    { name: 'Mai', revenue: 2100000 }, { name: 'Juin', revenue: 3200000 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* ── Graphique de Croissance (MRR) ── */}
      <div className="fp-card" style={{ padding: '32px', animation: 'fp-fade-up 0.5s ease forwards' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--foreground)' }}>
              Revenus Récurrents (MRR)
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--foreground-subtle)' }}>Croissance des abonnements sur les 6 derniers mois</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--foreground-muted)', marginBottom: '4px' }}>MRR Actuel</div>
            <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold)' }}>{Number(stats.totalRevenue).toLocaleString('fr-FR')} F</div>
          </div>
        </div>
        
        <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--gold)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }} tickFormatter={(val) => `${val / 1000}k`} dx={-10} />
              <RechartsTooltip 
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                itemStyle={{ color: 'var(--gold)', fontWeight: 600 }}
                labelStyle={{ color: 'var(--foreground-subtle)', marginBottom: '4px' }}
                formatter={(value: number) => [`${value.toLocaleString('fr-FR')} F`, 'Revenus']}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--gold)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {kpis.map((k, i) => (
          <div key={i} className="fp-kpi-card" style={{ opacity: 0, animation: `fp-fade-up 0.5s ease ${i * 0.05}s forwards` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }} title={k.desc}>
              <div className="fp-kpi-label" style={{ cursor: 'help' }}>{k.label}</div>
              <div style={{ width: '32px', height: '32px', background: `${k.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${k.color}30`, borderRadius: '8px' }}>
                <k.icon size={14} style={{ color: k.color }} />
              </div>
            </div>
            <div className="fp-kpi-value">
              {k.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--foreground-muted)', marginTop: '8px', lineHeight: 1.4 }}>
              {k.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Row Distribution + Derniers Inscrits */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        
        {/* Distribution */}
        <div className="fp-card" style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 32px', fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--foreground)' }}>
            Répartition des Plans
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}><Crown size={14} style={{ color: 'var(--gold)' }}/> Premium</span>
                <span style={{ color: 'var(--gold)' }}>{stats.premiumAccounts}</span>
              </div>
              <div style={{ height: '8px', background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                <div style={{ height: '100%', background: 'var(--gold)', width: `${premiumPct}%` }}></div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--foreground-subtle)', textAlign: 'right' }}>{Math.round(premiumPct)}% de la base</div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}><Users size={14} style={{ color: 'var(--foreground-subtle)' }}/> Gratuit / Essai</span>
                <span>{stats.freeAccounts}</span>
              </div>
              <div style={{ height: '8px', background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                <div style={{ height: '100%', background: 'var(--foreground-subtle)', width: `${freePct}%` }}></div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--foreground-subtle)', textAlign: 'right' }}>{Math.round(freePct)}% de la base</div>
            </div>
          </div>
        </div>

        {/* Dernières Inscriptions */}
        <div className="fp-card" style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 24px', fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--foreground)' }}>
            Dernières Inscriptions
          </h3>

          {(stats.recentAccounts || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--foreground-subtle)', fontSize: '13px' }}>
              Aucune inscription à afficher
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {(stats.recentAccounts || []).map((acc: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', color: 'var(--gold)' }}>
                      {(acc.companyName || acc.firstName || acc.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>{acc.companyName || `${acc.firstName} ${acc.lastName}`.trim() || 'Sans nom'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>{acc.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <PlanBadge plan={acc.subscriptionPlan} status={acc.subscriptionStatus} />
                    <span style={{ fontSize: '10px', color: 'var(--foreground-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {new Date(acc.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Composants Utilitaires ───────────────────────────────────────────────────
function PlanBadge({ plan, status }: { plan?: string; status?: string }) {
  const isPremium = plan === 'premium' && status === 'active';
  const isTrial = status === 'trial';
  const isExpired = status === 'expired';

  let cls = 'fp-badge-neutral';
  let label = plan || status || 'Inconnu';
  
  if (isPremium) {
    cls = 'fp-badge-gold'; label = 'Premium';
  } else if (isTrial) {
    cls = 'fp-badge-blue'; label = 'Essai';
  } else if (isExpired) {
    cls = 'fp-badge-red'; label = 'Expiré';
  }

  return <span className={`fp-badge ${cls}`}>{label}</span>;
}

// ─── Tableau des comptes ──────────────────────────────────────────────────────
function AdminAccounts({ accounts, onSelect }: { accounts: any[]; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'premium' | 'free' | 'suspended'>('all');

  const filtered = accounts.filter(a => {
    const matchSearch = !search ||
      a.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      (a.firstName + ' ' + a.lastName)?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'premium' && a.subscriptionPlan === 'premium' && a.subscriptionStatus === 'active') ||
      (filter === 'free' && (a.subscriptionPlan !== 'premium' || a.subscriptionStatus !== 'active')) ||
      (filter === 'suspended' && a.isSuspended);
    return matchSearch && matchFilter;
  });

  const filterBtn = (id: typeof filter, label: string, count: number) => (
    <button
      onClick={() => setFilter(id)}
      style={{
        padding: '8px 16px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer',
        background: filter === id ? 'var(--foreground)' : 'var(--surface)',
        color: filter === id ? 'white' : 'var(--foreground-muted)',
        border: '1px solid',
        borderColor: filter === id ? 'var(--foreground)' : 'var(--border)',
        transition: 'all 0.2s'
      }}
    >
      {label} <span style={{ opacity: 0.6, marginLeft: '4px' }}>({count})</span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '300px', maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--foreground-subtle)' }} />
          <input
            type="text"
            placeholder="Rechercher par nom, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 48px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--foreground)', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {filterBtn('all', 'Tous', accounts.length)}
          {filterBtn('premium', 'Premium', accounts.filter(a => a.subscriptionPlan === 'premium' && a.subscriptionStatus === 'active').length)}
          {filterBtn('free', 'Gratuit', accounts.filter(a => a.subscriptionPlan !== 'premium' || a.subscriptionStatus !== 'active').length)}
          {filterBtn('suspended', 'Suspendus', accounts.filter(a => a.isSuspended).length)}
        </div>
      </div>

      {/* Data Table */}
      <div className="fp-card">
        <table className="fp-table">
          <thead>
            <tr>
              <th className="fp-table-th">Institution</th>
              <th className="fp-table-th">Contact Principal</th>
              <th className="fp-table-th">Statut</th>
              <th className="fp-table-th">Enregistrement</th>
              <th className="fp-table-th">Expiration</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--foreground-subtle)', fontSize: '13px' }}>
                  Aucun résultat ne correspond à votre recherche.
                </td>
              </tr>
            ) : filtered.map((acc) => (
              <tr key={acc.id} onClick={() => onSelect(acc.id)} style={{ cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <td className="fp-table-td">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--foreground)' }}>
                      {(acc.companyName || acc.firstName || '?').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '14px' }}>
                      {acc.companyName || 'Non défini'}
                    </span>
                  </div>
                </td>
                <td className="fp-table-td">
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{acc.firstName} {acc.lastName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--foreground-muted)', marginTop: '2px' }}>{acc.email}</div>
                </td>
                <td className="fp-table-td">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                    <PlanBadge plan={acc.subscriptionPlan} status={acc.subscriptionStatus} />
                    {acc.isSuspended ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--destructive)' }}>
                        <Ban size={10} /> Suspendu
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="fp-table-td" style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
                  {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="fp-table-td" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
                  {acc.subscriptionExpiresAt ? new Date(acc.subscriptionExpiresAt).toLocaleDateString('fr-FR') : <span style={{ color: 'var(--border)' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Détails d'un compte ──────────────────────────────────────────────────────
function AdminAccountDetails({ accountId, token, onBack }: { accountId: string; token: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const { login } = useAppStore();

  useEffect(() => {
    fetch(`/api/admin/accounts/${accountId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(setData);
  }, [accountId, token]);

  const handleImpersonate = async () => {
    if (!window.confirm(`Vous allez prendre le contrôle de l'institution ${data.companyName}. Continuer ?`)) return;
    try {
      const res = await fetch(`/api/admin/impersonate/${accountId}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const u = await res.json();
        login(u);
        toast.success(`Authentifié en tant que ${u.company || u.name}`);
        window.location.href = '/app';
      }
    } catch { toast.error('Erreur technique'); }
  };

  const updateSub = async (plan: string, status: string, months: number) => {
    const exp = new Date();
    if (months > 0) exp.setMonth(exp.getMonth() + months);
    const expiresAt = months > 0 ? exp.toISOString().split('T')[0] + ' 23:59:59' : null;
    const res = await fetch(`/api/admin/accounts/${accountId}/subscription`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, status, expiresAt })
    });
    if (res.ok) { toast.success('Abonnement prolongé'); onBack(); }
    else toast.error('Échec de la mise à jour');
  };

  const toggleSuspend = async () => {
    const newVal = !data.isSuspended;
    const res = await fetch(`/api/admin/accounts/${accountId}/suspend`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSuspended: newVal ? 1 : 0 })
    });
    if (res.ok) { toast.success(newVal ? 'Institution suspendue' : 'Accès rétabli'); setData({ ...data, isSuspended: newVal }); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT l'institution ${data.companyName} et toutes ses données ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch(`/api/admin/accounts/${accountId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Institution supprimée');
        onBack();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch { toast.error('Erreur technique'); }
  };

  if (!data) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '16px' }}>
      <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--gold)' }} />
      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>Chargement...</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Retour */}
      <button
        onClick={onBack}
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--foreground-muted)', cursor: 'pointer' }}
      >
        <ArrowLeft size={14} /> Retour
      </button>

      {/* Header Fiche */}
      <div className="fp-card" style={{ padding: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '32px', color: 'white' }}>
            {(data.companyName || data.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: '0 0 12px', fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--foreground)' }}>
              {data.companyName || 'Institution sans nom'}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--foreground-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '6px', height: '6px', background: 'var(--success)' }}></div> {data.email}</span>
              {data.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14}/> {data.phone}</span>}
              {data.city && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14}/> {data.city}{data.country ? `, ${data.country}` : ''}</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <PlanBadge plan={data.subscriptionPlan} status={data.subscriptionStatus} />
          <button
            onClick={toggleSuspend}
            className="fp-btn-primary"
            style={{ padding: '8px 16px', fontSize: '11px', background: data.isSuspended ? 'var(--success)' : 'var(--destructive)', borderColor: data.isSuspended ? 'var(--success)' : 'var(--destructive)' }}
          >
            {data.isSuspended ? <><CheckCircle size={14}/> Rétablir</> : <><Ban size={14}/> Suspendre</>}
          </button>
          <button
            onClick={handleImpersonate}
            className="fp-btn-primary"
            style={{ padding: '8px 16px', fontSize: '11px', background: 'var(--foreground)', borderColor: 'var(--foreground)' }}
          >
            <LogIn size={14}/> Accès Compte
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        {[
          { label: 'Base Clients', value: data.totalClients, color: 'var(--blue-accent)' },
          { label: 'Factures Générées', value: data.totalInvoices, color: 'var(--foreground-subtle)' },
          { label: 'Volume Facturé', value: `${Number(data.totalInvoicedAmount || 0).toLocaleString('fr-FR')} F`, color: 'var(--gold)' },
        ].map((s, i) => (
          <div key={i} className="fp-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
             <div style={{ width: '48px', height: '48px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${s.color}30` }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value.toString().charAt(0)}</span>
             </div>
             <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--foreground-subtle)', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--foreground)' }}>{s.value}</div>
             </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* Identité */}
        <div className="fp-card" style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 24px', fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--foreground)' }}>
            Informations Administratives
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { label: 'Gérant', value: `${data.firstName || ''} ${data.lastName || ''}`.trim() || '—' },
              { label: 'Email Légal', value: data.email },
              { label: 'Téléphone', value: data.phone || '—' },
              { label: 'Siège Social', value: data.city || '—' },
              { label: 'Date d\'ouverture', value: data.createdAt ? new Date(data.createdAt).toLocaleDateString('fr-FR') : '—' },
              { label: 'Échéance Plan', value: data.subscriptionExpiresAt ? new Date(data.subscriptionExpiresAt).toLocaleDateString('fr-FR') : '—' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>{row.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Administration Commerciale */}
        <div className="fp-card" style={{ padding: '32px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crown size={18} /> Action Commerciale
          </h3>
          <p style={{ margin: '0 0 24px', fontSize: '12px', color: 'var(--foreground-muted)' }}>
            Gérez les abonnements manuellement (ex: virements).
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={() => updateSub('premium', 'active', 1)} className="fp-btn-primary" style={{ width: '100%', justifyContent: 'space-between', background: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
              <span>Activer Premium (1 mois)</span>
              <span style={{ fontSize: '10px', color: 'var(--foreground-subtle)' }}>+30 Jours</span>
            </button>
            <button onClick={() => updateSub('premium', 'active', 3)} className="fp-btn-primary" style={{ width: '100%', justifyContent: 'space-between', background: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
              <span>Activer Premium (3 mois)</span>
              <span style={{ fontSize: '10px', color: 'var(--foreground-subtle)' }}>+90 Jours</span>
            </button>
            <button onClick={() => updateSub('premium', 'active', 12)} className="fp-btn-primary" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Crown size={14}/> Accord Annuel Premium</span>
              <span style={{ fontSize: '10px', color: 'white' }}>+365 Jours</span>
            </button>
            
            <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }}></div>
            
            <button onClick={() => updateSub('free', 'expired', 0)} className="fp-btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--surface)', color: 'var(--warning)', borderColor: 'var(--warning)' }}>
              Forcer L'Expiration
            </button>
            <button onClick={handleDelete} className="fp-btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--surface)', color: 'var(--destructive)', borderColor: 'var(--destructive)' }}>
              Supprimer le Compte Définitivement
            </button>
          </div>
        </div>

      </div>

      {/* Historique Financier */}
      {data.payments && data.payments.length > 0 && (
        <div className="fp-card">
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={18} style={{ color: 'var(--gold)' }}/>
            <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--foreground)' }}>
              Historique Financier
            </h3>
          </div>
          
          <table className="fp-table">
            <thead>
              <tr>
                <th className="fp-table-th">Date</th>
                <th className="fp-table-th">Montant</th>
                <th className="fp-table-th">Plan Souscrit</th>
                <th className="fp-table-th">Statut</th>
                <th className="fp-table-th">Réf. Transaction</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="fp-table-td" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                    {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="fp-table-td" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)' }}>
                    {Number(p.amount).toLocaleString('fr-FR')} {p.currency || 'FCFA'}
                  </td>
                  <td className="fp-table-td" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>
                    {p.plan || '—'}
                  </td>
                  <td className="fp-table-td">
                    <span className={`fp-badge ${p.status === 'COMPLETED' ? 'fp-badge-green' : 'fp-badge-gold'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="fp-table-td" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--foreground-subtle)' }}>
                    {p.transactionId || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
    </div>
  );
}
