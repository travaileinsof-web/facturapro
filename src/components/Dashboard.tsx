import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Users, FileText, Banknote, Clock, TrendingUp, TrendingDown, ArrowRight, Minus, Settings as SettingsIcon, Package, AlertCircle, Calendar, Target, AlertTriangle, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { formatCurrency, formatDate, useAppStore, apiFetch } from '../lib/store';
import { PageHeader } from './ui/PageHeader';
import { Tooltip } from './ui/tooltip';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

/* ── Hooks & Utils ───────────────────────────────────────────────── */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);
  return value;
}

function getDatesFromPeriod(period: string) {
  const now = new Date();
  let start = new Date(2000, 0, 1);
  let end = new Date(2100, 0, 1);
  
  switch(period) {
    case 'this_day':
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case 'this_week':
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'this_month':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case 'last_month':
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
      break;
    case 'this_quarter':
      start = startOfQuarter(now);
      end = endOfQuarter(now);
      break;
    case 'this_semester':
      start = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
      end = endOfMonth(new Date(now.getFullYear(), now.getMonth() < 6 ? 5 : 11, 1));
      break;
    case 'this_year':
      start = startOfYear(now);
      end = endOfYear(now);
      break;
    case 'all_time':
    default:
      break;
  }
  
  return {
    startDate: format(start, 'yyyy-MM-dd 00:00:00'),
    endDate: format(end, 'yyyy-MM-dd 23:59:59')
  };
}

/* ── Components ──────────────────────────────────────────────────── */
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

function EmptyList({ label, icon: Icon = Package, actionText, onAction }: { label: string, icon?: any, actionText?: string, onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center text-[var(--foreground-subtle)]" style={{ padding: '40px 20px' }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--surface-2)', color: 'var(--foreground-muted)' }}>
        <Icon size={20} />
      </div>
      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>{label}</p>
      {actionText && (
        <button onClick={onAction} className="mt-4 fp-btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>
          {actionText}
        </button>
      )}
    </div>
  );
}

function KpiCard({
  label, value, isCurrency = false, isPercent = false, icon: Icon, color = 'var(--color-primary)',
  trend, delay = 0, infoText
}: {
  label: string; value: number; isCurrency?: boolean; isPercent?: boolean;
  icon: any; color?: string; trend?: number; delay?: number; infoText?: string;
}) {
  const animated = useCountUp(value, 1000);
  const display = isCurrency ? formatCurrency(animated) : isPercent ? `${animated}%` : animated.toLocaleString('fr-FR');

  return (
    <div className="fp-kpi-card relative overflow-hidden flex flex-col bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl" style={{ padding: '20px', opacity: 0, animation: `fp-fade-up 0.5s ease ${delay}s forwards`, minHeight: '130px' }}>
      <div className="flex items-start justify-between gap-4" style={{ marginBottom: '16px' }}>
        <div className="text-sm font-semibold text-[var(--foreground-subtle)] flex items-center gap-1.5" style={{ flex: 1, lineHeight: '1.4', paddingRight: '8px', wordBreak: 'break-word', maxWidth: 'calc(100% - 48px)' }}>
          {label}
          {infoText && (
            <Tooltip content={infoText}>
              <Info size={14} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-help transition-colors" />
            </Tooltip>
          )}
        </div>
        <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-md" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={16} style={{ color }}/>
        </div>
      </div>
      <div className="mt-auto">
        <div className="font-display font-bold text-[var(--foreground)]" style={{ fontSize: '24px' }}>{display}</div>
        {trend !== undefined && (
          <div className="flex items-center text-[12px]" style={{ marginTop: '8px', gap: '4px' }}>
            {trend > 0 ? <TrendingUp size={12} style={{ color: 'var(--color-success)' }}/>
              : trend < 0 ? <TrendingDown size={12} style={{ color: 'var(--color-danger)' }}/>
              : <Minus size={12} style={{ color: 'var(--color-text-placeholder)' }}/>
            }
            <span style={{ color: trend > 0 ? 'var(--color-success)' : trend < 0 ? 'var(--color-danger)' : 'var(--color-text-placeholder)', fontWeight: 600 }}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function OnboardingWidget({ stats, user, setCurrentModule }: { stats: any, user: any, setCurrentModule: any }) {
  if (!stats) return null;
  const { overview } = stats;
  const hasSettings = user?.primaryColor;
  const hasClient = stats?.setup?.clientCount > 0; 
  const hasCatalog = stats?.setup?.itemCount > 0;
  const hasInvoice = stats?.setup?.invoiceCount > 0;
  
  const steps = [
    { id: 'settings', title: 'Personnaliser', desc: 'Identité visuelle & devise', done: hasSettings, icon: SettingsIcon },
    { id: 'catalog', title: 'Créer le catalogue', desc: 'Ajouter un article', done: hasCatalog, icon: Package },
    { id: 'clients', title: 'Ajouter un client', desc: 'Premier contact', done: hasClient, icon: Users },
    { id: 'invoices', title: 'Facturer', desc: 'Première vente', done: hasInvoice, icon: FileText },
  ];
  
  const progress = steps.filter(s => s.done).length;
  if (progress === steps.length) return null;
  const percentage = Math.round((progress / steps.length) * 100);
  
  return (
    <div className="relative mb-8 rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(201,168,76,0.15)] border border-[var(--gold)]/20 bg-gradient-to-br from-[var(--surface-1)] to-[var(--background)] p-6" style={{ padding: '24px', marginBottom: '32px' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" style={{ marginBottom: '24px' }}>
        <div>
          <h3 className="text-2xl font-bold font-display text-[var(--foreground)] tracking-tight flex items-center gap-3">
            Démarrage Rapide
            <span className="inline-flex items-center rounded-full bg-[var(--gold)]/10 text-[var(--gold)] text-sm font-bold border border-[var(--gold)]/20 px-3 py-1" style={{ padding: '4px 12px', marginLeft: '12px' }}>{percentage}%</span>
          </h3>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm">Complétez ces 4 étapes pour exploiter tout le potentiel de FacturaPro.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ display: 'grid', gap: '16px' }}>
        {steps.map((step) => {
          const Icon = step.icon;
          return (
          <div key={step.id} onClick={() => setCurrentModule(step.id)} className={`relative flex items-center p-4 rounded-xl border cursor-pointer ${step.done ? 'bg-[var(--surface-1)]/50 border-[var(--border)]/50 opacity-70' : 'bg-[var(--surface-1)] border-[var(--gold)]/30 hover:border-[var(--gold)]'}`} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4" style={{ background: step.done ? 'var(--surface-2)' : 'var(--gold-subtle)', color: step.done ? 'var(--foreground-muted)' : 'var(--gold)', flexShrink: 0 }}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">{step.title}</p>
              <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">{step.desc}</p>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────── */
export function Dashboard() {
  const { user, refreshStats, setCurrentModule, statsPeriod, setStatsPeriod } = useAppStore();
  const [activeTab, setActiveTab] = useState<'facturation' | 'depenses'>('facturation');
  
  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard_stats', refreshStats, statsPeriod],
    queryFn: async () => {
      const { startDate, endDate } = getDatesFromPeriod(statsPeriod);
      const res = await apiFetch(`/api/stats?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur API Dashboard');
      }
      return res.json();
    },
    // PERF: garde les données précédentes visibles pendant le refresh (pas d'écran blanc)
    placeholderData: keepPreviousData,
  });

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'];

  const combinedEvolution = useMemo(() => {
    if (!stats) return [];
    
    // FIX PERFORMANCE: Fusion O(N*M) remplacée par une Hash Map O(N)
    const map = new Map<string, { revenu: number, depense: number }>();
    
    (stats.billing?.caEvolution || []).forEach((d: any) => {
      map.set(d.date, { revenu: d.amount, depense: 0 });
    });
    
    (stats.expenses?.evolution || []).forEach((d: any) => {
      if (map.has(d.date)) {
        map.get(d.date)!.depense = d.amount;
      } else {
        map.set(d.date, { revenu: 0, depense: d.amount });
      }
    });

    return Array.from(map.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, values]) => ({ date, ...values }));
  }, [stats]);

  return (
    <div className="max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <PageHeader title="Tableau de bord" description={`Bienvenue, ${user?.name || user?.company || 'Utilisateur'} !`} />
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={statsPeriod}
              onChange={(e) => setStatsPeriod(e.target.value)}
              className="appearance-none bg-[var(--surface-1)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--foreground)] py-2.5 focus:outline-none focus:border-[var(--gold)] shadow-sm cursor-pointer"
              style={{ paddingLeft: '40px', paddingRight: '32px' }}
            >
              <option value="this_day">Aujourd'hui</option>
              <option value="this_week">Cette semaine</option>
              <option value="this_month">Ce mois-ci</option>
              <option value="last_month">Mois dernier</option>
              <option value="this_quarter">Ce trimestre</option>
              <option value="this_semester">Ce semestre</option>
              <option value="this_year">Cette année</option>
              <option value="all_time">Depuis toujours</option>
            </select>
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] pointer-events-none" />
            <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] pointer-events-none rotate-90" />
          </div>
          <button onClick={() => setCurrentModule('invoices')} className="fp-btn-primary flex items-center gap-2 px-4 py-2.5">
            <FileText size={16} /> <span>Nouvelle Facture</span>
          </button>
        </div>
      </div>

      <OnboardingWidget stats={stats} user={user} setCurrentModule={setCurrentModule} />

      {isError && !stats && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Erreur de chargement</h3>
          <p className="text-[var(--foreground-subtle)] max-w-md">Impossible de charger les statistiques. {error instanceof Error ? error.message : ''}</p>
          <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-sm font-medium transition-colors">Réessayer</button>
        </div>
      )}

      {!stats && !isError && (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gold)]"></div></div>
      )}

      {stats ? (
        <div className="flex flex-col gap-8">
          
          {/* SECTION A : VUE D'ENSEMBLE */}
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Vue d'ensemble</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard label="Total Encaissé" value={stats.overview?.encaisse || 0} isCurrency icon={Banknote} color="#10B981" delay={0.1} trend={stats.overview?.encaisseTrend} />
              <KpiCard label="Bénéfice Net" value={stats.overview?.netProfit || 0} isCurrency icon={TrendingUp} color="#3B82F6" delay={0.2} trend={stats.overview?.profitTrend} />
              <KpiCard label="CA Potentiel" value={stats.overview?.potentiel || 0} isCurrency icon={Target} color="var(--gold)" delay={0.3} trend={stats.overview?.potentielTrend} />
              <KpiCard label="Créances" value={stats.overview?.creances || 0} isCurrency icon={Clock} color="#F59E0B" delay={0.4} trend={stats.overview?.creancesTrend} />
              <KpiCard label="Recouvrement" value={stats.overview?.recoveryRate || 0} isPercent icon={CheckCircle2} color="#8B5CF6" delay={0.5} trend={stats.overview?.recoveryRateTrend} />
            </div>
          </div>

          {/* SECTION D : RELANCES / IMPAYÉS (Mise en avant) */}
          <div className="fp-card border-l-4 border-l-red-500 overflow-hidden" style={{ padding: '24px' }}>
            <div className="flex items-center gap-3 mb-6" style={{ marginBottom: '32px' }}>
              <div className="rounded-full bg-red-500/10 flex items-center justify-center" style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '50%' }}>
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">Relances & Impayés</h2>
                <p className="text-sm text-[var(--foreground-subtle)]" style={{ marginTop: '4px' }}>Agissez sur vos factures en retard pour améliorer votre trésorerie.</p>
              </div>
            </div>

            {stats.unpaid.lateCount === 0 && stats.unpaid.partialCount === 0 ? (
              <EmptyList label="Excellente nouvelle ! Vous n'avez aucun retard de paiement. 🎉" icon={CheckCircle2} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ gap: '32px' }}>
                <div className="col-span-1 flex flex-col gap-4" style={{ gap: '24px' }}>
                  <div className="bg-[var(--surface-2)] rounded-xl border border-red-500/20 flex flex-col justify-center" style={{ padding: '24px' }}>
                    <div className="text-sm text-[var(--foreground-subtle)] font-medium mb-2 flex items-center gap-1.5">
                      Factures Échues
                      <Tooltip content="Factures dont la Date d'échéance est explicitement dépassée.">
                        <Info size={14} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-help transition-colors" />
                      </Tooltip>
                    </div>
                    <p className="text-3xl font-bold text-red-500 mb-1">{formatCurrency(stats.unpaid.totalOverdue)}</p>
                    <p className="text-sm text-[var(--foreground-muted)]">{stats.unpaid.lateCount} factures concernées</p>
                  </div>
                  
                  {/* AJOUT : Paiements Partiels */}
                  <div className="bg-[var(--surface-2)] rounded-xl border border-orange-500/20 flex flex-col justify-center" style={{ padding: '24px' }}>
                    <div className="text-sm text-[var(--foreground-subtle)] font-medium mb-2 flex items-center gap-1.5">
                      Paiements Partiels (Reste dû)
                      <Tooltip content="Reste à payer sur les factures qui ont déjà reçu un acompte.">
                        <Info size={14} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-help transition-colors" />
                      </Tooltip>
                    </div>
                    <p className="text-3xl font-bold text-orange-500 mb-1">{formatCurrency(stats.unpaid.partialAmount)}</p>
                    <p className="text-sm text-[var(--foreground-muted)]">{stats.unpaid.partialCount} factures concernées</p>
                  </div>

                  <div className="bg-[var(--surface-2)] rounded-xl border border-[var(--border)] flex flex-col justify-center" style={{ padding: '24px' }}>
                    <div className="text-sm text-[var(--foreground-subtle)] font-medium mb-2 flex items-center gap-1.5">
                      Efficacité des Relances
                      <Tooltip content="Pourcentage de relances envoyées ayant abouti à un paiement.">
                        <Info size={14} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-help transition-colors" />
                      </Tooltip>
                    </div>
                    <p className="text-3xl font-bold text-[var(--foreground)] mb-1">{stats.unpaid.reminderEfficiency}%</p>
                    <p className="text-sm text-[var(--foreground-muted)]">Sur {stats.unpaid.totalReminders} relance(s) envoyée(s)</p>
                  </div>
                </div>

                <div className="col-span-2">
                  <h3 className="text-sm font-bold text-[var(--foreground)] mb-4 flex items-center gap-1.5" style={{ marginBottom: '24px' }}>
                    Top 5 Clients à Relancer
                    <Tooltip content="Classement des clients ayant le plus grand montant de factures échues (Date d'échéance dépassée).">
                      <Info size={14} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-help transition-colors" />
                    </Tooltip>
                  </h3>
                  {stats.unpaid.topLateClients.length === 0 ? (
                    <EmptyList label="Aucun client en retard." />
                  ) : (
                    <div className="space-y-3">
                      {(stats?.unpaid?.topLateClients || []).map((client: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border)]">
                          <div>
                            <p className="text-sm font-bold text-[var(--foreground)]">{client.name}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-red-500">{formatCurrency(client.amount)}</span>
                            <button onClick={() => setCurrentModule('reminders')} className="text-xs font-semibold px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors">
                              Relancer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* TABS : FACTURATION & DÉPENSES */}
          <div className="fp-card overflow-hidden" style={{ marginTop: '40px' }}>
            <div className="flex border-b border-[var(--border)]" style={{ gap: '16px', padding: '16px 16px 0 16px' }}>
              <button 
                onClick={() => setActiveTab('facturation')}
                style={{ padding: '32px 24px', fontSize: '16px', borderRadius: '12px 12px 0 0' }}
                className={`flex-1 font-bold text-center transition-colors ${activeTab === 'facturation' ? 'text-[var(--gold)] border-b-4 border-[var(--gold)] bg-[var(--surface-2)]' : 'text-[var(--foreground-subtle)] hover:bg-[var(--surface-2)] border-b-4 border-transparent'}`}
              >
                Analyse Facturation
              </button>
              <button 
                onClick={() => setActiveTab('depenses')}
                style={{ padding: '32px 24px', fontSize: '16px', borderRadius: '12px 12px 0 0' }}
                className={`flex-1 font-bold text-center transition-colors ${activeTab === 'depenses' ? 'text-[var(--gold)] border-b-4 border-[var(--gold)] bg-[var(--surface-2)]' : 'text-[var(--foreground-subtle)] hover:bg-[var(--surface-2)] border-b-4 border-transparent'}`}
              >
                Analyse Dépenses
              </button>
            </div>

            <div className="p-6" style={{ padding: '24px' }}>
              {activeTab === 'facturation' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '24px' }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ display: 'grid', gap: '16px' }}>
                    <div className="bg-[var(--surface-2)] rounded-xl p-5 border border-[var(--border)]" style={{ padding: '20px' }}>
                      <div className="text-sm text-[var(--foreground-subtle)] mb-1 flex items-center gap-1.5">
                        Nombre de factures
                        <Tooltip content="Total des factures émises sur la période.">
                          <Info size={14} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-help transition-colors" />
                        </Tooltip>
                      </div>
                      <p className="text-2xl font-bold">{stats.billing.nbInvoices}</p>
                    </div>
                    <div className="bg-[var(--surface-2)] rounded-xl p-5 border border-[var(--border)]" style={{ padding: '20px' }}>
                      <div className="text-sm text-[var(--foreground-subtle)] mb-1 flex items-center gap-1.5">
                        Montant moyen
                        <Tooltip content="Valeur moyenne d'une facture sur la période.">
                          <Info size={14} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-help transition-colors" />
                        </Tooltip>
                      </div>
                      <p className="text-2xl font-bold">{formatCurrency(stats.billing.avgInvoice)}</p>
                    </div>
                    <div className="bg-[var(--surface-2)] rounded-xl p-5 border border-[var(--border)]" style={{ padding: '20px' }}>
                      <div className="text-sm text-[var(--foreground-subtle)] mb-1 flex items-center gap-1.5">
                        Délai moyen de paiement
                        <Tooltip content="Nombre de jours moyen entre l'émission d'une facture et son paiement complet.">
                          <Info size={14} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-help transition-colors" />
                        </Tooltip>
                      </div>
                      <p className="text-2xl font-bold">{stats.billing.avgPaymentDelay} jours</p>
                    </div>
                  </div>

                  {/* AJOUT : Répartition Factures Payées / Partielles / Impayées */}
                  {stats.billing.statusCount && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ display: 'grid', gap: '16px' }}>
                      <div className="flex flex-col bg-green-500/10 p-4 rounded-xl border border-green-500/20" style={{ padding: '16px' }}>
                        <div className="text-xs font-semibold text-green-700 uppercase tracking-wide flex items-center gap-1.5">
                          Factures Payées
                          <Tooltip content="Répartition du statut de toutes les factures émises sur la période.">
                            <Info size={14} className="text-green-700/50 hover:text-green-700 cursor-help transition-colors" />
                          </Tooltip>
                        </div>
                        <p className="text-xl font-bold text-green-700 mt-2">{stats.billing.statusCount['payée'] || 0}</p>
                      </div>
                      <div className="flex flex-col bg-orange-500/10 p-4 rounded-xl border border-orange-500/20" style={{ padding: '16px' }}>
                        <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide flex items-center gap-1.5">
                          Partiellement Payées
                          <Tooltip content="Répartition du statut de toutes les factures émises sur la période.">
                            <Info size={14} className="text-orange-700/50 hover:text-orange-700 cursor-help transition-colors" />
                          </Tooltip>
                        </div>
                        <p className="text-xl font-bold text-orange-700 mt-2">{stats.billing.statusCount['partielle'] || 0}</p>
                      </div>
                      <div className="flex flex-col bg-blue-500/10 p-4 rounded-xl border border-blue-500/20" style={{ padding: '16px' }}>
                        <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                          Envoyées / En Attente
                          <Tooltip content="Répartition du statut de toutes les factures émises sur la période.">
                            <Info size={14} className="text-blue-700/50 hover:text-blue-700 cursor-help transition-colors" />
                          </Tooltip>
                        </div>
                        <p className="text-xl font-bold text-blue-700 mt-2">{stats.billing.statusCount['envoyée'] || 0}</p>
                      </div>
                    </div>
                  )}

                  {stats.billing?.caEvolution && stats.billing.caEvolution.length > 0 ? (
                    <div style={{ marginTop: '40px' }}>
                      <h3 className="text-sm font-bold mb-4">Évolution du Chiffre d'Affaires</h3>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats.billing.caEvolution}>
                            <defs>
                              <linearGradient id="colorCa" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--gold)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--foreground-subtle)'}} tickFormatter={(t) => formatDate(t).substring(0, 5)} />
                            <YAxis tick={{fontSize: 12, fill: 'var(--foreground-subtle)'}} width={80} tickFormatter={(val) => new Intl.NumberFormat('fr-FR', {notation: 'compact'}).format(val)} />
                            <RechartsTooltip 
                              contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: '8px' }}
                              labelFormatter={(l) => formatDate(l)}
                              formatter={(v: number) => [formatCurrency(v), 'Chiffre d\'affaires']}
                            />
                            <Area type="monotone" dataKey="amount" stroke="var(--gold)" strokeWidth={3} fillOpacity={1} fill="url(#colorCa)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <EmptyList label="Pas assez de données pour afficher l'évolution" icon={TrendingUp} actionText="Créer une facture" onAction={() => setCurrentModule('invoices')} />
                  )}
                </div>
              )}

              {activeTab === 'depenses' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '24px' }}>
                   <div className="bg-[var(--surface-2)] rounded-xl p-5 mb-6 text-center max-w-sm mx-auto border border-[var(--border)]" style={{ padding: '20px', marginBottom: '24px', marginLeft: 'auto', marginRight: 'auto' }}>
                      <p className="text-sm text-[var(--foreground-subtle)] mb-1">Total des Dépenses</p>
                      <p className="text-3xl font-bold text-red-500">{formatCurrency(stats.expenses?.total || 0)}</p>
                   </div>
                   
                   {/* AJOUT : Courbe comparative revenus vs dépenses dans le temps */}
                   {combinedEvolution.length > 0 && (
                      <div className="mb-8" style={{ marginTop: '40px' }}>
                        <h3 className="text-sm font-bold mb-4">Revenus vs Dépenses</h3>
                        <div className="h-[250px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={combinedEvolution}>
                              <defs>
                                <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorDepense" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                              <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--foreground-subtle)'}} tickFormatter={(t) => formatDate(t).substring(0, 5)} axisLine={false} tickLine={false} />
                              <YAxis tick={{fontSize: 12, fill: 'var(--foreground-subtle)'}} width={60} tickFormatter={(val) => new Intl.NumberFormat('fr-FR', {notation: 'compact'}).format(val)} axisLine={false} tickLine={false} />
                              <RechartsTooltip 
                                contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                labelFormatter={(l) => formatDate(l)}
                                formatter={(v: number, name: string) => [formatCurrency(v), name === 'revenu' ? 'Revenu' : 'Dépense']}
                              />
                              <Area type="monotone" dataKey="revenu" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenu)" />
                              <Area type="monotone" dataKey="depense" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDepense)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                   )}

                   {stats.expenses.byCategory && stats.expenses.byCategory.length > 0 ? (
                     <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                       <div className="h-[250px] w-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={stats.expenses.byCategory} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
                                {(stats?.expenses?.byCategory || []).map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: '8px' }}/>
                            </PieChart>
                          </ResponsiveContainer>
                       </div>
                       <div className="space-y-2">
                         {(stats?.expenses?.byCategory || []).map((entry: any, index: number) => (
                           <div key={index} className="flex items-center gap-3">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                             <span className="text-sm text-[var(--foreground)] w-32">{entry.category}</span>
                             <span className="text-sm font-bold text-[var(--foreground)]">{formatCurrency(entry.total)}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   ) : (
                     <EmptyList label="Aucune dépense enregistrée sur cette période." actionText="Ajouter une dépense" onAction={() => setCurrentModule('expenses')} />
                   )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
