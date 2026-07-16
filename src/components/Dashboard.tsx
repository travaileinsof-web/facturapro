import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Users, FileText, Banknote, Clock, TrendingUp, TrendingDown, ArrowRight, Minus, CheckCircle, XCircle, LayoutDashboard, Settings as SettingsIcon, Package, PlusCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate, useAppStore, apiFetch } from '../lib/store';
import { PageHeader } from './ui/PageHeader';
import { useSearchParams } from 'react-router-dom';

/* ── Count-up animation hook ─────────────────────────────────────── */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);
  return value;
}

/* ── Status badge ─────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    'payée':    { label: 'Payée',       cls: 'fp-badge-green' },
    'partielle':{ label: 'Partielle',   cls: 'fp-badge-gold' },
    'brouillon':{ label: 'Non entamée', cls: 'fp-badge-neutral' },
    'envoyée':  { label: 'Envoyée',     cls: 'fp-badge-blue' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'fp-badge-neutral' };
  return <span className={`fp-badge ${cls}`}>{label}</span>;
}

/* ── Sparkline SVG ───────────────────────────────────────────────── */
function Sparkline({ values, color = '#C9A84C' }: { values: number[]; color?: string }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 80, h = 28;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── KPI Card ────────────────────────────────────────────────────── */
function KpiCard({
  label, value, isCurrency = false, icon: Icon, color = 'var(--color-primary)',
  trend, delay = 0,
}: {
  label: string; value: number; isCurrency?: boolean;
  icon: any; color?: string; trend?: number; delay?: number;
}) {
  const animated = useCountUp(value, 1000);
  const display = isCurrency ? formatCurrency(animated) : animated.toLocaleString('fr-FR');

  const isPrimary = color.includes('primary') || color === 'var(--color-primary)';

  return (
    <div className="fp-kpi-card" style={{ opacity: 0, animation: `fp-fade-up 0.5s ease ${delay}s forwards` }}>
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: isPrimary ? 'rgba(184, 134, 11, 0.15)' : `${color}22`,
        filter: 'blur(30px)', pointerEvents: 'none',
      }}/>

      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="fp-kpi-label">{label}</div>
        <div className="w-7 h-7 flex items-center justify-center shrink-0 rounded-md" style={{ background: isPrimary ? 'var(--color-primary-subtle)' : `${color}15`, border: `1px solid ${isPrimary ? 'var(--color-border-subtle)' : `${color}30`}` }}>
          <Icon size={14} style={{ color }}/>
        </div>
      </div>

      <div className="fp-kpi-value" style={{ fontSize: '28px' }}>{display}</div>

      {trend !== undefined && (
        <div className="flex items-center text-[12px]" style={{ marginTop: 'var(--space-3)', gap: 'var(--space-2)' }}>
          {trend > 0
            ? <TrendingUp size={12} style={{ color: 'var(--color-success)' }}/>
            : trend < 0
              ? <TrendingDown size={12} style={{ color: 'var(--color-danger)' }}/>
              : <Minus size={12} style={{ color: 'var(--color-text-placeholder)' }}/>
          }
          <span style={{ color: trend > 0 ? 'var(--color-success)' : trend < 0 ? 'var(--color-danger)' : 'var(--color-text-placeholder)', fontWeight: 600 }}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          <span style={{ color: 'var(--color-text-secondary)' }}>vs mois dernier</span>
        </div>
      )}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────── */
function EmptyList({ label }: { label: string }) {
  return (
    <div className="text-center text-[var(--foreground-subtle)]" style={{ padding: 'var(--space-12) var(--space-4)' }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="block opacity-30" style={{ margin: '0 auto var(--space-4)' }}>
        <rect x="8" y="6" width="24" height="30" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="13" y1="14" x2="27" y2="14" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="13" y1="19" x2="27" y2="19" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="13" y1="24" x2="21" y2="24" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
      <p style={{ fontSize: '13px', fontWeight: 500 }}>Aucun {label} pour l'instant</p>
    </div>
  );
}

/* ── Onboarding Widget ───────────────────────────────────────────── */
function OnboardingWidget({ stats, user, setCurrentModule }: { stats: any, user: any, setCurrentModule: any }) {
  if (!stats) return null;
  
  const hasSettings = user?.smtpHost && user?.primaryColor;
  const hasClient = (stats.totalClients || 0) > 0;
  const hasCatalog = (stats.totalCatalogItems || 0) > 0;
  const hasInvoice = (stats.totalInvoices || 0) > 0;
  
  const steps = [
    { id: 'settings', title: 'Configurer les paramètres', desc: 'SMTP et identité visuelle', done: hasSettings, icon: SettingsIcon },
    { id: 'clients', title: 'Ajouter un client', desc: 'Votre premier contact', done: hasClient, icon: Users },
    { id: 'catalog', title: 'Créer un article', desc: 'Produit ou service', done: hasCatalog, icon: Package },
    { id: 'invoices', title: 'Première facture', desc: 'Générer une facture', done: hasInvoice, icon: FileText },
  ];
  
  const progress = steps.filter(s => s.done).length;
  const isComplete = progress === steps.length;
  
  if (isComplete) return null;
  
  return (
    <div className="fp-card" style={{ marginBottom: 'var(--space-6)', overflow: 'hidden' }}>
      <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
          <h3 className="font-semibold" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-primary)' }}>Configuration du compte</h3>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
            {Math.round((progress / steps.length) * 100)}% complété
          </div>
        </div>
        <div style={{ width: '100%', height: '4px', background: 'var(--color-primary-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${(progress / steps.length) * 100}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.5s ease-out', boxShadow: '0 0 8px var(--color-primary)' }} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: 'var(--color-border)' }}>
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div 
              key={step.id} 
              onClick={() => setCurrentModule(step.id)}
              className="flex flex-col relative group cursor-pointer hover:bg-[var(--color-bg-page)] transition-colors"
              style={{ padding: 'var(--space-4)', opacity: step.done ? 0.6 : 1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div 
                  className="flex items-center justify-center rounded-full"
                  style={{ width: '32px', height: '32px', background: step.done ? 'var(--color-success)' : 'var(--color-primary-subtle)', color: step.done ? 'white' : 'var(--color-primary)' }}
                >
                  {step.done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                {!step.done && <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-primary)]" />}
              </div>
              <h4 className="font-semibold text-[var(--foreground)]" style={{ fontSize: 'var(--text-sm)', marginBottom: '4px' }}>
                {i + 1}. {step.title}
              </h4>
              <p className="text-[var(--foreground-muted)] text-[var(--text-xs)] m-0">
                {step.desc}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────── */
export function Dashboard() {
  const refreshStats = useAppStore(state => state.refreshStats);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', refreshStats],
    queryFn: async () => {
      const res = await apiFetch('/api/stats');
      if (!res.ok) return null;
      return res.json();
    },
  });

  const setCurrentModule = useAppStore(state => state.setCurrentModule);
  const user = useAppStore(state => state.user);

  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  const header = <PageHeader title="Tableau de Bord" description="Vue d'ensemble de vos finances et performances" icon={<LayoutDashboard size={20} />} />;

  /* Skeleton loader */
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {header}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--space-4)' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="fp-skeleton" style={{ height: '110px', borderRadius: 'var(--radius-xl)' }}/>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'var(--space-6)' }}>
          <div className="fp-skeleton" style={{ height: '260px' }}/>
          <div className="fp-skeleton" style={{ height: '260px' }}/>
        </div>
      </div>
    );
  }

  const encaisse  = Number(String(stats?.encaisse || 0).replace(/\s/g, '')) || 0;
  const creances  = Number(String(stats?.creances || 0).replace(/\s/g, '')) || 0;
  const potentiel = Number(String(stats?.potentiel || 0).replace(/\s/g, '')) || 0;
  const total     = encaisse + creances + potentiel || 1;
  const encaisseRatio = Math.round((encaisse / total) * 100);
  const creancesRatio = Math.round((creances / total) * 100);

  return (
    <div className="flex flex-col" style={{ gap: 'var(--space-4)' }}>
      {header}

      {/* ── Payment Status Alert ── */}
      {paymentStatus === 'success' && (
        <div className="flex items-center justify-between rounded-lg animate-[fp-fade-up_0.5s_ease_forwards]" style={{ padding: 'var(--space-5)', background: 'var(--success-dim, rgba(34,197,94,0.1))', border: '1px solid var(--success, #22c55e)' }}>
          <div className="flex items-center" style={{ gap: 'var(--space-4)' }}>
            <CheckCircle className="text-[var(--success)]" size={32} />
            <div>
              <h4 className="text-[var(--foreground)] text-base font-semibold" style={{ marginBottom: 'var(--space-1)' }}>Paiement réussi !</h4>
              <p className="text-[var(--foreground-subtle)] text-sm" style={{ margin: 0 }}>Votre abonnement a été mis à jour avec succès. Merci de votre confiance.</p>
            </div>
          </div>
          <button onClick={() => setSearchParams({})} className="bg-transparent border-none cursor-pointer text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-colors">✕</button>
        </div>
      )}
      {paymentStatus === 'cancel' && (
        <div className="flex items-center justify-between rounded-lg animate-[fp-fade-up_0.5s_ease_forwards]" style={{ padding: 'var(--space-5)', background: 'var(--destructive-dim, rgba(239,68,68,0.1))', border: '1px solid var(--destructive, #ef4444)' }}>
          <div className="flex items-center" style={{ gap: 'var(--space-4)' }}>
            <XCircle className="text-[var(--destructive)]" size={32} />
            <div>
              <h4 className="text-[var(--foreground)] text-base font-semibold" style={{ marginBottom: 'var(--space-1)' }}>Paiement annulé ou échoué</h4>
              <p className="text-[var(--foreground-subtle)] text-sm" style={{ margin: 0 }}>La transaction n'a pas pu aboutir. Veuillez réessayer ou vérifier votre mode de paiement.</p>
            </div>
          </div>
          <button onClick={() => setSearchParams({})} className="bg-transparent border-none cursor-pointer text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-colors">✕</button>
        </div>
      )}

      <OnboardingWidget stats={stats} user={user} setCurrentModule={setCurrentModule} />

      {/* ── KPI Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          <KpiCard 
            label="Total Encaissé" 
            value={stats?.encaisse || 0} 
            isCurrency 
            icon={Banknote} 
            color="var(--gold)"
            trend={stats?.encaisseTrend}
            delay={0}
          />
          <KpiCard 
            label="Bénéfice Net" 
            value={stats?.netProfit || 0} 
            isCurrency 
            icon={TrendingUp} 
            color="#22c55e"
            trend={stats?.profitTrend}
            delay={0.1}
          />
          <KpiCard 
            label="Chiffre d'Affaires Potentiel" 
            value={stats?.potentiel || 0} 
            isCurrency 
            icon={TrendingUp}
            color="var(--blue-accent)"
            delay={0.2}
          />
          <KpiCard 
            label="Créances (À recouvrer)" 
            value={stats?.creances || 0} 
            isCurrency 
            icon={Clock}
            color="var(--destructive)"
            delay={0.3}
          />
        </div>

      {/* ── Revenue bar ── */}
      <div className="fp-card opacity-0 animate-[fp-fade-up_0.5s_ease_0.3s_forwards]" style={{ padding: 'var(--space-5)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '4px' }}>Répartition du Chiffre d'Affaires</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px' }}>{formatCurrency(total)}</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--foreground-muted)' }}>
            <p><span style={{ color: 'var(--success)' }}>●</span> {encaisseRatio}% encaissé</p>
          </div>
        </div>
        <div style={{ height: '6px', background: 'var(--surface-3)', overflow: 'hidden', display: 'flex', border: '1px solid var(--border)' }}>
          <div style={{ width: `${encaisseRatio}%`, background: 'var(--success)', transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }}/>
          <div style={{ width: `${creancesRatio}%`, background: 'var(--warning)', opacity: 0.8 }}/>
          <div style={{ flex: 1, background: '#8B5CF6', opacity: 0.6 }}/>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-3)', fontSize: '11px', color: 'var(--foreground-subtle)' }}>
          <span><span style={{ color: '#22C55E' }}>●</span> Encaissé : {formatCurrency(encaisse)}</span>
          <span><span style={{ color: 'var(--warning)' }}>●</span> Créances : {formatCurrency(creances)}</span>
          <span><span style={{ color: '#8B5CF6' }}>●</span> Potentiel : {formatCurrency(potentiel)}</span>
        </div>
      </div>
      {/* ── Recent lists ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'var(--space-4)' }}>
        {/* Recent invoices */}
        <div className="fp-card" style={{ opacity: 0, animation: 'fp-fade-up 0.5s ease 0.35s forwards' }}>
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>Factures Récentes</h3>
            <span onClick={() => setCurrentModule('invoices')} style={{ fontSize: '11px', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontWeight: 600 }}>
              Voir tout <ArrowRight size={11}/>
            </span>
          </div>
          <div style={{ padding: 'var(--space-2)' }}>
            {!stats?.recentInvoices?.length
              ? <EmptyList label="facture"/>
              : stats.recentInvoices.map((inv: any, i: number) => (
                <div key={inv.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px var(--space-3)', borderRadius: 0, transition: 'background 0.15s',
                  cursor: 'default', borderBottom: '1px solid var(--border)',
                  opacity: 0, animation: `fp-fade-up 0.4s ease ${0.4 + i * 0.05}s forwards`,
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>{inv.number}</p>
                    <p style={{ fontSize: '10px', color: 'var(--foreground-subtle)' }}>{inv.client?.name} · {formatDate(inv.createdAt)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{formatCurrency(inv.total)}</p>
                    <StatusBadge status={inv.status}/>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Recent receipts */}
        <div className="fp-card" style={{ opacity: 0, animation: 'fp-fade-up 0.5s ease 0.4s forwards' }}>
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>Reçus Récents</h3>
            <span onClick={() => setCurrentModule('receipts')} style={{ fontSize: '11px', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontWeight: 600 }}>
              Voir tout <ArrowRight size={11}/>
            </span>
          </div>
          <div style={{ padding: 'var(--space-2)' }}>
            {!stats?.recentReceipts?.length
              ? <EmptyList label="reçu"/>
              : stats.recentReceipts.map((rec: any, i: number) => (
                <div key={rec.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px var(--space-3)', borderRadius: 0, transition: 'background 0.15s',
                  cursor: 'default', borderBottom: '1px solid var(--border)',
                  opacity: 0, animation: `fp-fade-up 0.4s ease ${0.45 + i * 0.05}s forwards`,
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>{rec.number}</p>
                    <p style={{ fontSize: '10px', color: 'var(--foreground-subtle)' }}>{rec.client?.name} · {formatDate(rec.createdAt)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>+{formatCurrency(rec.amount)}</p>
                    <p style={{ fontSize: '12px', color: 'var(--foreground-subtle)', textTransform: 'capitalize', marginTop: '3px' }}>{rec.paymentMethod?.replace('_', ' ')}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
