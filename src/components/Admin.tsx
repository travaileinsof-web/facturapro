import React, { useState, useEffect } from 'react';
import { useAppStore, formatCurrency, apiFetch } from '../lib/store';
import { toast } from 'sonner';
import {
  Users, DollarSign, Search, LogIn,
  Crown, AlertTriangle, FileText, Building2,
  ArrowLeft, Calendar, Phone, MapPin, RefreshCw, Ban, CheckCircle, Settings, Mail
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { adminStatsSchema, adminAccountsResponseSchema } from '../lib/schemas';

export function Admin() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'accounts' | 'details' | 'settings'>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('1y');

  const token = user?.token;

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [sRes, aRes] = await Promise.all([
        apiFetch(`/api/admin/stats?timeframe=${timeframe}`),
        apiFetch('/api/admin/accounts')
      ]);
      if (sRes.ok) {
        const rawStats = await sRes.json();
        setStats(adminStatsSchema.parse(rawStats));
      }
      if (aRes.ok) {
        const rawAccounts = await aRes.json();
        setAccounts(adminAccountsResponseSchema.parse(rawAccounts));
      }
    } catch (err: any) {
      console.error("Erreur Admin API:", err);
      toast.error('Erreur de chargement ou données invalides');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [timeframe]);

  const navBtn = (id: 'dashboard' | 'accounts' | 'settings', label: string, Icon?: any) => {
    const active = view === id || (id === 'accounts' && view === 'details');
    return (
      <button
        onClick={() => setView(id)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '8px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer',
          background: active ? 'var(--surface)' : 'transparent',
          color: active ? 'var(--gold)' : 'var(--foreground-subtle)',
          border: 'none',
          borderRadius: '24px',
          boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--foreground)'; }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--foreground-subtle)'; }}
      >
        {Icon && <Icon size={14} style={{ marginRight: '6px' }} />}
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
          {view === 'dashboard' && (
            <select 
              value={timeframe} 
              onChange={e => setTimeframe(e.target.value)}
              style={{ padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="24h">Dernières 24h</option>
              <option value="7d">7 derniers jours</option>
              <option value="1m">1 dernier mois</option>
              <option value="3m">3 derniers mois</option>
              <option value="6m">6 derniers mois</option>
              <option value="1y">1 dernière année</option>
            </select>
          )}
          <button
            onClick={() => loadData(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--foreground)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--foreground-muted)'; }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 16px' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', padding: '4px', borderRadius: '32px', border: '1px solid var(--border)' }}>
            {navBtn('dashboard', 'Aperçu')}
            {navBtn('accounts', 'Comptes & Utilisateurs')}
            {navBtn('settings', 'Paramètres', Settings)}
          </div>
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
        {view === 'settings' && (
          <AdminSettings token={token || ''} />
        )}
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function AdminSettings({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    MAIL_HOST: '',
    MAIL_PORT: '465',
    MAIL_USER: '',
    MAIL_PASS: '',
    MAIL_FROM: '',
    MAIL_FROM_NAME: 'FacturaPro',
    REMINDER_SETTINGS: {
      active: false,
      beforeDays: [30, 15, 5, 3],
      dayOf: true,
      afterDays: [3, 5, 15, 30]
    }
  });

  useEffect(() => {
    apiFetch('/api/admin/settings').then(r => r.json()).then(data => {
      setSettings((prev: any) => {
          const newData = { ...prev, ...data };
          if (!newData.REMINDER_SETTINGS) {
              newData.REMINDER_SETTINGS = prev.REMINDER_SETTINGS;
          }
          return newData;
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      if (res.ok) toast.success('Paramètres sauvegardés avec succès.');
      else toast.error('Erreur lors de la sauvegarde.');
    } catch {
      toast.error('Erreur réseau.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: string, type: string = 'text', placeholder: string = '') => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>{label}</label>
      <input
        type={type} placeholder={placeholder} value={settings[key] || ''}
        onChange={e => setSettings({ ...settings, [key]: e.target.value })}
        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--foreground)', outline: 'none' }}
      />
    </div>
  );

  const handleReminderChange = (key: string, value: any) => {
      setSettings({
          ...settings,
          REMINDER_SETTINGS: {
              ...settings.REMINDER_SETTINGS,
              [key]: value
          }
      });
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="fp-card" style={{ padding: '32px' }}>
        <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontFamily: 'var(--font-display)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}>
          <Mail size={18} style={{ color: 'var(--gold)' }} />
          Configuration SMTP / Emails
        </h3>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: '16px' }}>
            {field('Serveur SMTP (Host)', 'MAIL_HOST', 'text', 'ex: mail.hostinger.com')}
            {field('Port', 'MAIL_PORT', 'number')}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>Chiffrement</label>
              <select
                value={settings['MAIL_ENCRYPTION'] || 'tls'}
                onChange={e => setSettings({ ...settings, MAIL_ENCRYPTION: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--foreground)', outline: 'none', appearance: 'none', cursor: 'pointer' }}
              >
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="none">Aucun</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {field('Utilisateur SMTP', 'MAIL_USER', 'text', 'contact@votredomaine.com')}
            {field('Mot de passe SMTP', 'MAIL_PASS', 'password', '•••••••••••• (laisser vide = inchangé)')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {field('Email Expéditeur (From)', 'MAIL_FROM', 'email')}
            {field('Nom Expéditeur', 'MAIL_FROM_NAME', 'text', 'FacturaPro')}
          </div>
          
          <div style={{ height: '1px', background: 'var(--border)', margin: '24px 0' }}></div>
          
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}>
            <Calendar size={18} style={{ color: 'var(--gold)' }} />
            Automatisation des Relances
          </h3>
          
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                  type="checkbox" 
                  checked={settings.REMINDER_SETTINGS?.active || false}
                  onChange={(e) => handleReminderChange('active', e.target.checked)}
                  id="reminderActive"
              />
              <label htmlFor="reminderActive" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                  Activer l'envoi automatique des relances
              </label>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', opacity: settings.REMINDER_SETTINGS?.active ? 1 : 0.5, pointerEvents: settings.REMINDER_SETTINGS?.active ? 'auto' : 'none' }}>
              <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>Jours AVANT expiration (séparés par des virgules)</label>
                  <input
                    type="text" value={settings.REMINDER_SETTINGS?.beforeDays?.join(', ') || ''}
                    onChange={e => handleReminderChange('beforeDays', e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--foreground)', outline: 'none' }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--foreground-muted)', marginTop: '4px' }}>Ex: 30, 15, 5, 3</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>Jours APRÈS expiration (séparés par des virgules)</label>
                  <input
                    type="text" value={settings.REMINDER_SETTINGS?.afterDays?.join(', ') || ''}
                    onChange={e => handleReminderChange('afterDays', e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--foreground)', outline: 'none' }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--foreground-muted)', marginTop: '4px' }}>Ex: 3, 5, 15, 30</div>
              </div>
          </div>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', opacity: settings.REMINDER_SETTINGS?.active ? 1 : 0.5, pointerEvents: settings.REMINDER_SETTINGS?.active ? 'auto' : 'none' }}>
              <input 
                  type="checkbox" 
                  checked={settings.REMINDER_SETTINGS?.dayOf || false}
                  onChange={(e) => handleReminderChange('dayOf', e.target.checked)}
                  id="reminderDayOf"
              />
              <label htmlFor="reminderDayOf" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                  Envoyer un rappel le jour exact de l'expiration (Jour J)
              </label>
          </div>

          <button type="submit" className="fp-btn-primary" disabled={saving} style={{ width: '100%', marginTop: '16px' }}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function AdminDashboard({ stats }: { stats: any; accounts: any[] }) {
  const kpisData = stats?.kpis || {};
  const kpis = [
    { label: 'Utilisateurs', value: kpisData.totalAccounts || 0, icon: Users, color: 'var(--blue-accent)', desc: 'Nombre total de comptes créés sur la plateforme' },
    { label: 'Abonnés Premium', value: kpisData.premiumAccounts || 0, icon: Crown, color: 'var(--gold)', desc: 'Comptes ayant un abonnement payant actif' },
    { label: 'Comptes Gratuits', value: kpisData.freeAccounts || 0, icon: Building2, color: 'var(--success)', desc: 'Comptes en période d\'essai ou sur un plan gratuit' },
    { label: 'Revenus SaaS', value: formatCurrency(Number(kpisData.totalRevenue || 0)), icon: DollarSign, color: 'var(--gold)', desc: 'Montant total encaissé via les abonnements' },
    { label: 'Factures Émises', value: kpisData.totalInvoices || 0, icon: FileText, color: 'var(--foreground-muted)', desc: 'Nombre total de factures générées par toutes les entreprises' },
    { label: 'Conversion', value: `${kpisData.conversionRate || 0}%`, icon: Users, color: 'var(--foreground-muted)', desc: 'Taux de conversion global' },
    { label: 'Suspendus', value: kpisData.suspendedAccounts || 0, icon: Ban, color: 'var(--destructive)', desc: 'Comptes bloqués par un administrateur' },
    { label: 'Expirations (<30j)', value: kpisData.expiringSoon || 0, icon: AlertTriangle, color: 'var(--warning)', desc: 'Comptes dont l\'abonnement expire dans moins de 30 jours' },
  ];

  const premiumPct = kpisData.totalAccounts > 0 ? (kpisData.premiumAccounts / kpisData.totalAccounts) * 100 : 0;
  const freePct = 100 - premiumPct;

  // Utilisation des vraies courbes
  const chartData = stats?.mrrCurve || [];
  const acqData = stats?.acquisitionCurve || [];

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
            <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold)' }}>{Number(kpisData.totalRevenue || 0).toLocaleString('fr-FR')} F</div>
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
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }} tickFormatter={(val) => `${val / 1000}k`} dx={-10} />
              <RechartsTooltip 
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                itemStyle={{ color: 'var(--gold)', fontWeight: 600 }}
                labelStyle={{ color: 'var(--foreground-subtle)', marginBottom: '4px' }}
                formatter={(value: number) => [formatCurrency(value), 'Revenus']}
              />
              <Area type="monotone" dataKey="mrr" stroke="var(--gold)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Graphique d'Acquisition (Gratuit vs Premium) ── */}
      <div className="fp-card" style={{ padding: '32px', animation: 'fp-fade-up 0.5s ease 0.1s forwards' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--foreground)' }}>
              Acquisition & Conversion
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--foreground-subtle)' }}>Comparaison des nouveaux comptes Gratuits vs Premium</p>
          </div>
        </div>
        
        <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={acqData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFree" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--gold)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }} dx={-10} />
              <RechartsTooltip 
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                itemStyle={{ fontWeight: 600 }}
                labelStyle={{ color: 'var(--foreground-subtle)', marginBottom: '4px' }}
              />
              <Area type="monotone" name="Gratuits" dataKey="free" stroke="var(--success)" strokeWidth={2} fillOpacity={1} fill="url(#colorFree)" />
              <Area type="monotone" name="Premium" dataKey="premium" stroke="var(--gold)" strokeWidth={2} fillOpacity={1} fill="url(#colorPremium)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '24px' }}>
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
                <span style={{ color: 'var(--gold)' }}>{kpisData.premiumAccounts}</span>
              </div>
              <div style={{ height: '8px', background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                <div style={{ height: '100%', background: 'var(--gold)', width: `${premiumPct}%` }}></div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--foreground-subtle)', textAlign: 'right' }}>{Math.round(premiumPct)}% de la base</div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}><Users size={14} style={{ color: 'var(--foreground-subtle)' }}/> Gratuit / Essai</span>
                <span>{kpisData.freeAccounts}</span>
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

          {(kpisData.recentAccounts || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--foreground-subtle)', fontSize: '13px' }}>
              Aucune inscription à afficher
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {(kpisData?.recentAccounts || []).map((acc: any, i: number) => (
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
                    <PlanBadge plan={acc.subscriptionPlan} status={acc.subscriptionStatus} computedStatus={acc.computedStatus} />
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
function PlanBadge({ plan, status, computedStatus }: { plan?: string; status?: string; computedStatus?: string }) {
  let cls = 'fp-badge-neutral';
  let label = computedStatus || plan || status || 'Inconnu';
  
  if (computedStatus === 'active') {
    cls = 'fp-badge-gold'; label = 'Forfait Premium';
  } else if (computedStatus === 'expired') {
    cls = 'fp-badge-red'; label = 'Premium Expiré';
  } else if (computedStatus === 'trial') {
    cls = 'fp-badge-blue'; label = 'Compte Essai';
  } else if (computedStatus === 'trial_expired') {
    cls = 'fp-badge-red'; label = 'Essai Expiré';
  } else {
    // Fallback
    const isPremium = plan === 'premium' && status === 'active';
    const isTrial = status === 'trial';
    const isExpired = status === 'expired';
    if (isPremium) {
      cls = 'fp-badge-gold'; label = 'Forfait Premium';
    } else if (isTrial) {
      cls = 'fp-badge-blue'; label = 'Compte Essai';
    } else if (isExpired) {
      cls = 'fp-badge-red'; label = 'Expiré';
    }
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
      (filter === 'premium' && (a.subscriptionPlan === 'premium' || a.subscriptionPlan === 'annuel') && a.subscriptionStatus === 'active') ||
      (filter === 'free' && ((a.subscriptionPlan !== 'premium' && a.subscriptionPlan !== 'annuel') || a.subscriptionStatus !== 'active')) ||
      (filter === 'suspended' && a.isSuspended);
    return matchSearch && matchFilter;
  });

  const filterBtn = (id: typeof filter, label: string, count: number) => (
    <button
      onClick={() => setFilter(id)}
      style={{
        padding: '6px 14px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer',
        background: filter === id ? 'var(--gold)' : 'var(--surface)',
        color: filter === id ? 'white' : 'var(--foreground-muted)',
        border: '1px solid',
        borderColor: filter === id ? 'var(--gold)' : 'var(--border)',
        borderRadius: '20px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
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
          {filterBtn('premium', 'Premium', accounts.filter(a => (a.subscriptionPlan === 'premium' || a.subscriptionPlan === 'annuel') && a.subscriptionStatus === 'active').length)}
          {filterBtn('free', 'Gratuit', accounts.filter(a => (a.subscriptionPlan !== 'premium' && a.subscriptionPlan !== 'annuel') || a.subscriptionStatus !== 'active').length)}
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
            ) : (filtered || []).map((acc) => (
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
                    <PlanBadge plan={acc.subscriptionPlan} status={acc.subscriptionStatus} computedStatus={acc.computedStatus} />
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
    apiFetch(`/api/admin/accounts/${accountId}`).then(r => r.json()).then(setData);
  }, [accountId, token]);

  const handleImpersonate = async () => {
    if (!window.confirm(`Vous allez prendre le contrôle de l'institution ${data.companyName}. Continuer ?`)) return;
    try {
      const res = await apiFetch(`/api/admin/impersonate/${accountId}`, {
        method: 'POST'
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
    const res = await apiFetch(`/api/admin/accounts/${accountId}/subscription`, {
      method: 'PUT',
      body: JSON.stringify({ plan, status, expiresAt })
    });
    if (res.ok) { toast.success('Abonnement prolongé'); onBack(); }
    else toast.error('Échec de la mise à jour');
  };

  const toggleSuspend = async () => {
    const newVal = !data.isSuspended;
    const res = await apiFetch(`/api/admin/accounts/${accountId}/suspend`, {
      method: 'PUT',
      body: JSON.stringify({ isSuspended: newVal ? 1 : 0 })
    });
    if (res.ok) { toast.success(newVal ? 'Institution suspendue' : 'Accès rétabli'); setData({ ...data, isSuspended: newVal }); }
  };

  const handleRemind = async () => {
    if (!window.confirm(`Voulez-vous envoyer un email de relance de paiement (Proforma) à ${data.email} ?`)) return;
    try {
      const res = await apiFetch(`/api/admin/accounts/${accountId}/remind`, {
        method: 'POST'
      });
      if (res.ok) toast.success('Relance envoyée avec succès.');
      else {
        const d = await res.json();
        toast.error(d.error || 'Erreur lors de la relance.');
      }
    } catch {
      toast.error('Erreur réseau.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT l'institution ${data.companyName} et toutes ses données ? Cette action est irréversible.`)) return;
    try {
      const res = await apiFetch(`/api/admin/accounts/${accountId}`, {
        method: 'DELETE'
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
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--foreground-muted)', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--foreground)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--foreground-muted)'; }}
      >
        <ArrowLeft size={14} /> Retour
      </button>

      {/* Header Fiche */}
      <div className="fp-card" style={{ padding: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--gold)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '32px', color: 'white', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
            {(data.companyName || data.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: '0 0 12px', fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--foreground)' }}>
              {data.companyName || 'Institution sans nom'}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--foreground-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%' }}></div> {data.email}</span>
              {data.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14}/> {data.phone}</span>}
              {data.city && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14}/> {data.city}{data.country ? `, ${data.country}` : ''}</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <PlanBadge plan={data.subscriptionPlan} status={data.subscriptionStatus} computedStatus={data.computedStatus} />
          <button
            onClick={toggleSuspend}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'white', background: data.isSuspended ? 'var(--success)' : 'var(--destructive)', border: 'none', borderRadius: '24px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
          >
            {data.isSuspended ? <><CheckCircle size={14}/> Rétablir</> : <><Ban size={14}/> Suspendre</>}
          </button>
          <button
            onClick={handleImpersonate}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'white', background: 'var(--foreground)', border: 'none', borderRadius: '24px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gold)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--foreground)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
          >
            <LogIn size={14}/> Accès Compte
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '24px' }}>
        {[
          { label: 'Base Clients', value: data.totalClients || 0, color: 'var(--blue-accent)' },
          { label: 'Factures Générées', value: data.totalInvoices || 0, color: 'var(--foreground-subtle)' },
          { label: 'Volume Facturé', value: formatCurrency(Number(data.totalInvoicedAmount || 0)), color: 'var(--gold)' },
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
            <button onClick={() => updateSub('premium', 'active', 1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 16px', background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--foreground-muted)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
              <span>Activer Premium (1 mois)</span>
              <span style={{ fontSize: '10px', color: 'var(--foreground-subtle)' }}>+30 Jours</span>
            </button>
            <button onClick={() => updateSub('premium', 'active', 3)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 16px', background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--foreground-muted)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
              <span>Activer Premium (3 mois)</span>
              <span style={{ fontSize: '10px', color: 'var(--foreground-subtle)' }}>+90 Jours</span>
            </button>
            <button onClick={() => updateSub('premium', 'active', 12)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 16px', background: 'var(--gold)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.2)' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(212, 175, 55, 0.3)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.2)'; }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Crown size={14}/> Accord Annuel Premium</span>
              <span style={{ fontSize: '10px', color: 'white', opacity: 0.8 }}>+365 Jours</span>
            </button>
            
            <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }}></div>
            
            <button onClick={() => updateSub('free', 'expired', 0)} style={{ width: '100%', padding: '10px', background: 'var(--surface)', color: 'var(--warning)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245, 166, 35, 0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--warning)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
              Forcer L'Expiration
            </button>
            <button onClick={handleDelete} style={{ width: '100%', padding: '10px', background: 'var(--surface)', color: 'var(--destructive)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(224, 72, 72, 0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--destructive)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
              Supprimer le Compte Définitivement
            </button>
            <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }}></div>
            <button onClick={handleRemind} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', background: 'var(--surface)', color: 'var(--blue-accent)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(74, 144, 226, 0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--blue-accent)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
              <Mail size={14}/> Relancer pour le Paiement (Email)
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
              {(data?.payments || []).map((p: any, i: number) => (
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
