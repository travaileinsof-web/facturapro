import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar, PublicFooter } from './Layout';

/* ── Custom Cursor ────────────────────────────────────────────────────────────── */
function Cursor() {
  const cur = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const pos = { x: 0, y: 0 };
    const ring_pos = { x: 0, y: 0 };
    const move = (e: MouseEvent) => {
      pos.x = e.clientX; pos.y = e.clientY;
      if (cur.current) { cur.current.style.left = `${pos.x}px`; cur.current.style.top = `${pos.y}px`; }
    };
    let raf: number;
    const follow = () => {
      ring_pos.x += (pos.x - ring_pos.x) * 0.14;
      ring_pos.y += (pos.y - ring_pos.y) * 0.14;
      if (ring.current) { ring.current.style.left = `${ring_pos.x}px`; ring.current.style.top = `${ring_pos.y}px`; }
      raf = requestAnimationFrame(follow);
    };
    follow();
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      <div ref={cur} className="pub-cursor" />
      <div ref={ring} className="pub-cursor-ring" />
    </>
  );
}

/* ── Scroll reveal wrapper ───────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const [v, setV] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(20px)', transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

/* ── Animated counter ────────────────────────────────────────────────────────── */
function AnimNum({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; obs.disconnect();
      let s = 0; const dur = 1600;
      const tick = (ts: number) => {
        if (!s) s = ts;
        const p = Math.min((ts - s) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setV(Math.floor(ease * to));
        if (p < 1) requestAnimationFrame(tick); else setV(to);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{prefix}{v.toLocaleString('fr-FR')}{suffix}</span>;
}

/* ── Feature item ──────────────────────────────────────────────────────────── */
function Feature({ icon, title, desc, delay, color }: { icon: React.ReactNode; title: string; desc: string; delay: number; color: string }) {
  return (
    <Reveal delay={delay} style={{ height: '100%' }}>
      <div style={{ padding: '28px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', height: '100%', transition: 'box-shadow 0.25s, border-color 0.25s, transform 0.25s' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; el.style.borderColor = '#bbf7d0'; el.style.transform = 'translateY(-3px)'; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'none'; el.style.borderColor = '#e2e8f0'; el.style.transform = 'none'; }}
      >
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', letterSpacing: '-0.3px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7 }}>{desc}</p>
      </div>
    </Reveal>
  );
}

/* ── SVG Icons ───────────────────────────────────────────────────────────────── */
const IconAI = ({ c }: { c: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.35-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
    <circle cx="7.5" cy="14.5" r="1.5" fill={c} stroke="none"/>
    <circle cx="16.5" cy="14.5" r="1.5" fill={c} stroke="none"/>
  </svg>
);

const IconInvoice = ({ c }: { c: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconReceipt = ({ c }: { c: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);

const IconClients = ({ c }: { c: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconDashboard = ({ c }: { c: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="7" height="9" rx="1"/>
    <rect x="15" y="3" width="7" height="5" rx="1"/>
    <rect x="15" y="12" width="7" height="9" rx="1"/>
    <rect x="2" y="16" width="7" height="5" rx="1"/>
  </svg>
);

const IconCurrency = ({ c }: { c: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/>
    <line x1="12" y1="6" x2="12" y2="8"/>
    <line x1="12" y1="16" x2="12" y2="18"/>
  </svg>
);

/* ── Testimonial ─────────────────────────────────────────────────────────────── */
function Testimonial({ quote, name, role, company, delay }: { quote: string; name: string; role: string; company: string; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div style={{ padding: '28px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
        <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>
          {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#f59e0b', fontSize: '14px' }}>★</span>)}
        </div>
        <p style={{ fontSize: '14.5px', color: '#334155', lineHeight: 1.75, marginBottom: '20px', fontStyle: 'italic' }}>"{quote}"</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{role} · {company}</div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ── Home Page ───────────────────────────────────────────────────────────────── */
export function Home() {
  return (
    <div className="public-page" style={{ background: '#fff', minHeight: '100vh' }}>
      <Cursor />
      <PublicNavbar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: '120px', paddingBottom: '100px', background: 'linear-gradient(160deg, #f8fafc 0%, #f0fdf4 100%)', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            {/* Left */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: '100px', padding: '6px 14px', marginBottom: '28px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', animation: 'fp-pulse-green 2s ease-in-out infinite' }} />
                <span style={{ fontSize: '12.5px', color: '#059669', fontWeight: 600 }}>Plateforme ERP Nouvelle Génération</span>
              </div>

              <h1 style={{ fontSize: 'clamp(36px, 4.5vw, 58px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', color: '#0f172a', marginBottom: '22px' }}>
                Gérez votre<br />
                <span style={{ color: '#059669' }}>facturation</span><br />
                avec précision.
              </h1>

              <p style={{ fontSize: '17px', color: '#475569', lineHeight: 1.75, marginBottom: '36px', maxWidth: '460px' }}>
                FacturaPro centralise vos factures, clients, reçus de paiement et intègre un assistant IA pour automatiser vos tâches quotidiennes.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
                <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 26px', background: '#059669', color: '#fff', borderRadius: '9px', textDecoration: 'none', fontSize: '15px', fontWeight: 600, boxShadow: '0 2px 12px rgba(5,150,105,0.25)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#047857'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#059669'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                >
                  Démarrer gratuitement
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link to="/fonctionnalites" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 26px', background: '#fff', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '9px', textDecoration: 'none', fontSize: '15px', fontWeight: 500, transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#059669'; (e.currentTarget as HTMLElement).style.color = '#059669'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.color = '#334155'; }}
                >
                  Voir les fonctionnalités
                </Link>
              </div>

              {/* Trust indicators */}
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {[['500+', 'Entreprises actives'], ['10 000+', 'Factures émises'], ['4.9/5', 'Note utilisateurs']].map(([v, l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#059669' }}>{v}</span>
                    <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Dashboard screenshot mockup */}
            <div style={{ animation: 'fp-float 5s ease-in-out infinite' }}>
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {/* Window chrome */}
                <div style={{ height: '40px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px' }}>
                  {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
                  <div style={{ flex: 1, height: '14px', background: '#e2e8f0', borderRadius: '4px', margin: '0 16px' }} />
                </div>
                {/* Content */}
                <div style={{ padding: '20px' }}>
                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
                    {[['CA Mensuel', '4 250 000 GNF', '#059669'], ['Factures', '32 émises', '#3b82f6'], ['Impayés', '820 000 GNF', '#f59e0b']].map(([l,v,c]) => (
                      <div key={l} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 12px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Table (simplified) */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 100px 80px', gap: '12px' }}>
                      {['Client', 'Montant', 'Statut'].map(h => <div key={h} style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>)}
                    </div>
                    {[['SARL Kadi Invest', '850 000 GNF', 'Payée', '#059669'], ['BNS Group', '1 200 000 GNF', 'En attente', '#f59e0b'], ['MinDev Guinée', '450 000 GNF', 'Payée', '#059669']].map(([c,m,s,sc], i) => (
                      <div key={i} style={{ padding: '10px 14px', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none', display: 'grid', gridTemplateColumns: '1fr 100px 80px', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>{c}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{m}</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: sc, background: `${sc}14`, borderRadius: '5px', padding: '2px 8px', textAlign: 'center' }}>{s}</span>
                      </div>
                    ))}
                  </div>
                  {/* ARIA bar */}
                  <div style={{ marginTop: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', animation: 'fp-pulse-green 2s ease-in-out infinite' }} />
                    <span style={{ fontSize: '12px', color: '#059669', fontFamily: 'JetBrains Mono, monospace' }}>ARIA : "Facture créée — BNS Group, 1 200 000 GNF"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────── */}
      <section style={{ padding: '64px 32px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '32px' }}>
            {[{ v: 500, suf: '+', label: 'Entreprises actives', desc: 'font leur confiance' },
              { v: 10000, suf: '+', label: 'Factures générées', desc: 'chaque mois' },
              { v: 99, suf: '%', label: 'Satisfaction', desc: 'client garantie' },
              { v: 24, suf: 'h/24', label: 'Support', desc: 'réactif disponible' }].map((s, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                  <div style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 900, color: '#059669', letterSpacing: '-2px', marginBottom: '6px' }}>
                    <AnimNum to={s.v} suffix={s.suf} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>{s.label}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>{s.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES PREVIEW ──────────────────────────── */}
      <section style={{ padding: '96px 32px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Reveal style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-block', padding: '5px 14px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: '#059669', marginBottom: '16px' }}>Fonctionnalités clés</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-1.5px', marginBottom: '14px' }}>Tout ce dont votre entreprise a besoin</h2>
            <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
              FacturaPro réunit en un seul outil les fonctions essentielles pour piloter votre activité.
            </p>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <Feature delay={0}   color="#059669" icon={<IconAI c="#059669" />}       title="Assistant IA ARIA"    desc="Dictez vos instructions en français et laissez ARIA créer vos factures et reçus automatiquement." />
            <Feature delay={80}  color="#3b82f6" icon={<IconInvoice c="#3b82f6" />}  title="Factures Proforma"    desc="Documents professionnels avec votre logo, signature, et numérotation automatique séquentielle." />
            <Feature delay={160} color="#8b5cf6" icon={<IconReceipt c="#8b5cf6" />}  title="Reçus de Paiement"   desc="Enregistrez chaque encaissement et suivez les soldes restants par client en temps réel." />
            <Feature delay={240} color="#f59e0b" icon={<IconClients c="#f59e0b" />}  title="Gestion Clients"     desc="Fiches client complètes avec historique de facturation, contacts et notes personnalisées." />
            <Feature delay={320} color="#0ea5e9" icon={<IconDashboard c="#0ea5e9" />} title="Tableau de Bord"     desc="Visualisez votre chiffre d'affaires, vos impayés et vos statistiques en un coup d'œil." />
            <Feature delay={400} color="#ec4899" icon={<IconCurrency c="#ec4899" />} title="Multi-devises"       desc="GNF, FCFA, USD, EUR — paramétrez librement la devise de votre choix pour chaque document." />
          </div>
          <Reveal style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link to="/fonctionnalites" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#059669', borderRadius: '9px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#dcfce7'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f0fdf4'; }}
            >
              Voir toutes les fonctionnalités
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section style={{ padding: '96px 32px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Reveal style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{ display: 'inline-block', padding: '5px 14px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: '#d97706', marginBottom: '16px' }}>Témoignages</div>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>Ce que disent nos utilisateurs</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <Testimonial delay={0} quote="FacturaPro a transformé notre gestion financière. Les factures PDF sont d'une qualité que je n'avais jamais vue avec un outil local." name="Mariama Bah" role="Directrice" company="SARL Bah & Associés" />
            <Testimonial delay={80} quote="L'assistant ARIA est impressionnant. Je tape une phrase et la facture est créée. C'est un gain de temps considérable." name="Ibrahim Diallo" role="Gérant" company="IDA Commerce" />
            <Testimonial delay={160} quote="Interface propre, rapide, et le support EINSOFT répond toujours dans l'heure. Je recommande à chaque entrepreneur guinéen." name="Fatoumata Camara" role="PDG" company="FTC Consulting" />
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────── */}
      <section style={{ padding: '96px 32px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', marginBottom: '16px' }}>
              Prêt à professionnaliser votre facturation ?
            </h2>
            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.8)', marginBottom: '36px', lineHeight: 1.7 }}>
              Rejoignez 500+ entreprises qui font déjà confiance à FacturaPro. Démarrez aujourd'hui.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', background: '#fff', color: '#059669', borderRadius: '9px', textDecoration: 'none', fontSize: '15px', fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}
              >
                Commencer maintenant
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 32px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '9px', textDecoration: 'none', fontSize: '15px', fontWeight: 600, transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'; }}
              >
                Voir les tarifs
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
