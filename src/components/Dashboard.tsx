import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Users, FileText, Banknote, Clock, TrendingUp, TrendingDown, ArrowRight, Minus, CheckCircle, XCircle, LayoutDashboard } from 'lucide-react';
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
  label, value, isCurrency = false, icon: Icon, color = 'var(--gold)',
  trend, delay = 0,
}: {
  label: string; value: number; isCurrency?: boolean;
  icon: any; color?: string; trend?: number; delay?: number;
}) {
  const animated = useCountUp(value, 1000);
  const display = isCurrency ? formatCurrency(animated) : animated.toLocaleString('fr-FR');

  return (
    <div className="fp-kpi-card" style={{ opacity: 0, animation: `fp-fade-up 0.5s ease ${delay}s forwards` }}>
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: color.includes('gold') || color === 'var(--gold)' ? 'var(--gold-glow)' : `${color}22`,
        filter: 'blur(30px)', pointerEvents: 'none',
      }}/>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div className="fp-kpi-label">{label}</div>
        <div style={{ width: '32px', height: '32px', background: color.includes('gold') || color === 'var(--gold)' ? 'var(--gold-dim)' : `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${color.includes('gold') || color === 'var(--gold)' ? 'var(--border-gold)' : `${color}30`}` }}>
          <Icon size={14} style={{ color }}/>
        </div>
      </div>

      <div className="fp-kpi-value">{display}</div>

      {trend !== undefined && (
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
          {trend > 0
            ? <TrendingUp size={11} style={{ color: 'var(--success)' }}/>
            : trend < 0
              ? <TrendingDown size={11} style={{ color: 'var(--destructive)' }}/>
              : <Minus size={11} style={{ color: 'var(--foreground-subtle)' }}/>
          }
          <span style={{ color: trend > 0 ? 'var(--success)' : trend < 0 ? 'var(--destructive)' : 'var(--foreground-subtle)', fontWeight: 600 }}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          <span style={{ color: 'var(--foreground-subtle)' }}>vs mois dernier</span>
        </div>
      )}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────── */
function EmptyList({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--foreground-subtle)' }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }}>
        <rect x="8" y="6" width="24" height="30" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="13" y1="14" x2="27" y2="14" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="13" y1="19" x2="27" y2="19" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="13" y1="24" x2="21" y2="24" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
      <p style={{ fontSize: '13px', fontWeight: 500 }}>Aucun {label} pour l'instant</p>
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


  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  const header = <PageHeader title="Tableau de Bord" description="Vue d'ensemble de vos finances et performances" icon={<LayoutDashboard size={20} />} />;

  /* Skeleton loader */
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {header}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="fp-skeleton" style={{ height: '110px' }}/>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="fp-skeleton" style={{ height: '260px' }}/>
          <div className="fp-skeleton" style={{ height: '260px' }}/>
        </div>
      </div>
    );
  }

  const encaisse  = stats?.encaisse  || 0;
  const creances  = stats?.creances  || 0;
  const potentiel = stats?.potentiel || 0;
  const total     = encaisse + creances + potentiel || 1;
  const encaisseRatio = Math.round((encaisse / total) * 100);
  const creancesRatio = Math.round((creances / total) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {header}

      {/* ── Payment Status Alert ── */}
      {paymentStatus === 'success' && (
        <div style={{ background: 'var(--success-dim, rgba(34,197,94,0.1))', border: '1px solid var(--success, #22c55e)', padding: '16px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fp-fade-up 0.5s ease forwards' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle style={{ color: 'var(--success, #22c55e)' }} size={24}/>
            <div>
              <h4 style={{ color: 'var(--foreground)', fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0' }}>Paiement réussi !</h4>
              <p style={{ color: 'var(--foreground-subtle)', fontSize: '13px', margin: 0 }}>Votre abonnement a été mis à jour avec succès. Merci de votre confiance.</p>
            </div>
          </div>
          <button onClick={() => setSearchParams({})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-subtle)' }}>✕</button>
        </div>
      )}
      {paymentStatus === 'cancel' && (
        <div style={{ background: 'var(--destructive-dim, rgba(239,68,68,0.1))', border: '1px solid var(--destructive, #ef4444)', padding: '16px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fp-fade-up 0.5s ease forwards' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <XCircle style={{ color: 'var(--destructive, #ef4444)' }} size={24}/>
            <div>
              <h4 style={{ color: 'var(--foreground)', fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0' }}>Paiement annulé ou échoué</h4>
              <p style={{ color: 'var(--foreground-subtle)', fontSize: '13px', margin: 0 }}>La transaction n'a pas pu aboutir. Veuillez réessayer ou vérifier votre mode de paiement.</p>
            </div>
          </div>
          <button onClick={() => setSearchParams({})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-subtle)' }}>✕</button>
        </div>
      )}

      {/* ── KPI Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
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
      <div className="fp-card" style={{ padding: '20px', opacity: 0, animation: 'fp-fade-up 0.5s ease 0.3s forwards' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '4px' }}>Répartition du Chiffre d'Affaires</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px' }}>{formatCurrency(total)}</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--foreground-muted)' }}>
            <p><span style={{ color: 'var(--success)' }}>●</span> {encaisseRatio}% encaissé</p>
          </div>
        </div>
        <div style={{ height: '6px', background: 'var(--surface-3)', overflow: 'hidden', display: 'flex', border: '1px solid var(--border)' }}>
          <div style={{ width: `${encaisseRatio}%`, background: 'var(--success)', transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }}/>
          <div style={{ width: `${creancesRatio}%`, background: 'var(--warning)', opacity: 0.8 }}/>
          <div style={{ flex: 1, background: '#8B5CF6', opacity: 0.6 }}/>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '11px', color: 'var(--foreground-subtle)' }}>
          <span><span style={{ color: '#22C55E' }}>●</span> Encaissé : {formatCurrency(encaisse)}</span>
          <span><span style={{ color: 'var(--warning)' }}>●</span> Créances : {formatCurrency(creances)}</span>
          <span><span style={{ color: '#8B5CF6' }}>●</span> Potentiel : {formatCurrency(potentiel)}</span>
        </div>
      </div>

      {/* ── Recent lists ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px' }}>
        {/* Recent invoices */}
        <div className="fp-card" style={{ opacity: 0, animation: 'fp-fade-up 0.5s ease 0.35s forwards' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Factures Récentes</p>
            <span onClick={() => setCurrentModule('invoices')} style={{ fontSize: '11px', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              Voir tout <ArrowRight size={11}/>
            </span>
          </div>
          <div style={{ padding: '8px' }}>
            {!stats?.recentInvoices?.length
              ? <EmptyList label="facture"/>
              : stats.recentInvoices.map((inv: any, i: number) => (
                <div key={inv.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 0, transition: 'background 0.15s',
                  cursor: 'default', borderBottom: '1px solid var(--border)',
                  opacity: 0, animation: `fp-fade-up 0.4s ease ${0.4 + i * 0.05}s forwards`,
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>{inv.number}</p>
                    <p style={{ fontSize: '11px', color: 'var(--foreground-subtle)' }}>{inv.client?.name} · {formatDate(inv.createdAt)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{formatCurrency(inv.total)}</p>
                    <StatusBadge status={inv.status}/>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Recent receipts */}
        <div className="fp-card" style={{ opacity: 0, animation: 'fp-fade-up 0.5s ease 0.4s forwards' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Reçus Récents</p>
            <span onClick={() => setCurrentModule('receipts')} style={{ fontSize: '11px', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              Voir tout <ArrowRight size={11}/>
            </span>
          </div>
          <div style={{ padding: '8px' }}>
            {!stats?.recentReceipts?.length
              ? <EmptyList label="reçu"/>
              : stats.recentReceipts.map((rec: any, i: number) => (
                <div key={rec.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 0, transition: 'background 0.15s',
                  cursor: 'default', borderBottom: '1px solid var(--border)',
                  opacity: 0, animation: `fp-fade-up 0.4s ease ${0.45 + i * 0.05}s forwards`,
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>{rec.number}</p>
                    <p style={{ fontSize: '11px', color: 'var(--foreground-subtle)' }}>{rec.client?.name} · {formatDate(rec.createdAt)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>+{formatCurrency(rec.amount)}</p>
                    <p style={{ fontSize: '10px', color: 'var(--foreground-subtle)', textTransform: 'capitalize', marginTop: '3px' }}>{rec.paymentMethod?.replace('_', ' ')}</p>
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
