import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar, PublicFooter } from './Layout';
import { usePageSEO } from '../../hooks/usePageSEO';
import { MotionReveal as Reveal } from '../../components/ui/MotionReveal';
import { PageTransition } from '../../components/ui/PageTransition';
import { BlobShape, GridPattern, GeometricShapes, WavesShape } from '../../components/ui/AbstractShapes';

/* ── Animated counter ───────────────────────────────────────────────────── */
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

/* ── CTA Button ─────────────────────────────────────────────────────────── */
function CtaButton({ label = 'Essayer gratuitement 24h', style = {} }: { label?: string; style?: React.CSSProperties }) {
  return (
    <Link to="/register" style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      padding: '13px 28px', background: 'var(--color-gold)', color: '#1A1715',
      borderRadius: '2px', textDecoration: 'none', fontSize: '13px',
      fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
      transition: 'all 0.3s ease', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', ...style
    }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#E6D5B8'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.3)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--color-gold)'; el.style.transform = 'none'; el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'; }}
    >
      {label}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </Link>
  );
}

/* ── Badge "Bientôt disponible" ──────────────────────────────────────────── */
function ComingSoonBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)',
      color: 'var(--color-gold)', fontSize: '10px', fontWeight: 600,
      padding: '3px 10px', borderRadius: '2px', letterSpacing: '1px',
      textTransform: 'uppercase'
    }}>
      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-gold)', display: 'inline-block' }} />
      Bientôt disponible
    </span>
  );
}

/* ── Section H2 ─────────────────────────────────────────────────────────── */
function HomeSection({ id, emoji, title, badge, children, delay = 0 }: {
  id?: string; emoji: string; title: string; badge?: React.ReactNode; children: React.ReactNode; delay?: number;
}) {
  return (
    <Reveal delay={delay / 1000} direction="up">
      <div id={id} style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px',
        padding: '40px', transition: 'all 0.4s ease', position: 'relative', overflow: 'hidden'
      }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(212, 175, 55, 0.4)'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)'; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}
      >
        <div style={{ fontSize: '28px', marginBottom: '20px', opacity: 0.9 }}>{emoji}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--color-text)', letterSpacing: '0.5px', margin: 0 }}>{title}</h2>
          {badge}
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.8, fontWeight: 300 }}>{children}</div>
      </div>
    </Reveal>
  );
}

/* ── FAQ Accordion ──────────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--color-border)', transition: 'border-color 0.3s' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '24px 0', background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: '15px', fontWeight: 500, color: 'var(--color-text)', textAlign: 'left', gap: '12px',
          letterSpacing: '0.5px'
        }}
      >
        {q}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      <div style={{
        height: open ? 'auto' : 0, overflow: 'hidden', opacity: open ? 1 : 0,
        transition: 'opacity 0.4s ease'
      }}>
        <div style={{ paddingBottom: '24px', fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.8, fontWeight: 300 }}>
          {a}
        </div>
      </div>
    </div>
  );
}


/* ── FAQ Schema.org JSON-LD ─────────────────────────────────────────────── */
const HOME_FAQ_JSON = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Qu'est-ce que FacturaPro et à qui s'adresse-t-il ?",
      "acceptedAnswer": { "@type": "Answer", "text": "FacturaPro est un logiciel de facturation conçu pour les PME en Guinée. Il permet de créer des factures conformes (RCCM, NIF, TVA 18%), de les envoyer par WhatsApp et de suivre les paiements. Il s'adresse aux commerçants, prestataires et entrepreneurs de Conakry, Kankan, Labé, Nzérékoré, Boké, Kindia et Mamou." }
    },
    {
      "@type": "Question",
      "name": "Quelles sont les mentions obligatoires sur une facture en Guinée ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Une facture conforme en Guinée doit mentionner le RCCM (Registre du Commerce et du Crédit Mobilier), le NIF (Numéro d'Identification Fiscale) et l'adresse du vendeur. Pour certaines opérations, la mention de la retenue de 50% de TVA peut aussi être exigée. La TVA applicable est de 18% pour les entreprises assujetties." }
    },
    {
      "@type": "Question",
      "name": "Puis-je envoyer mes factures directement par WhatsApp ou Email depuis FacturaPro ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui. FacturaPro génère vos factures en PDF et vous permet de les partager directement via WhatsApp et par Email en un clic. C'est la méthode préférée des entrepreneurs guinéens pour communiquer avec leurs clients." }
    },
    {
      "@type": "Question",
      "name": "Combien coûte FacturaPro et y a-t-il une période d'essai ?",
      "acceptedAnswer": { "@type": "Answer", "text": "FacturaPro coûte 500 000 GNF par an, sans frais cachés. Vous bénéficiez d'un essai gratuit de 24h sans avoir besoin de carte bancaire pour tester toutes les fonctionnalités." }
    },
    {
      "@type": "Question",
      "name": "FacturaPro fonctionne-t-il sur téléphone mobile ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui, FacturaPro est entièrement accessible depuis votre smartphone. Vous pouvez créer et envoyer des factures depuis votre téléphone à Conakry, Kankan, Labé, Nzérékoré ou partout en Guinée, sans installer d'application." }
    }
  ]
};

/* ── Home Page ──────────────────────────────────────────────────────────── */
export function Home() {

  usePageSEO({
    title: 'FacturaPro – Logiciel de facturation pour PME en Guinée | RCCM, NIF, WhatsApp',
    description: 'Créez et envoyez vos factures conformes (RCCM, NIF, TVA 18%) par WhatsApp depuis votre téléphone. 500 000 GNF/an, essai gratuit 24h. Pour les PME de Conakry à Nzérékoré.',
    canonical: 'https://facturapro.com/',
  });

  return (
    <PageTransition>
      <div className="public-page" style={{ background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text)' }}>
        {/* FAQ Schema.org JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_FAQ_JSON) }} />

        <PublicNavbar />

        {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section aria-label="Présentation FacturaPro" style={{ padding: '120px 20px 80px', borderBottom: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
        <GridPattern opacity={0.3} />
        <BlobShape style={{ top: '-10%', left: '-10%', width: '800px', height: '800px' }} />
        <GeometricShapes opacity={0.6} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '80px', alignItems: 'center' }}>
            {/* Left */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', paddingBottom: '8px', marginBottom: '32px' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-gold)' }} />
                <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Logiciel de facturation guinéen — essai gratuit 24h</span>
              </div>

              {/* H1 SEO */}
              <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.5px', color: 'var(--color-text)', marginBottom: '24px', fontFamily: '"Playfair Display", serif' }}>
                Générez et envoyez vos{' '}
                <span style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>factures conformes</span><br />
                par WhatsApp.
              </h1>

              {/* Paragraphe GEO */}
              <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '24px', fontWeight: 300, maxWidth: '480px' }}>
                FacturaPro est le logiciel de facturation pensé pour les PME guinéennes : créez des factures conformes avec RCCM et NIF, envoyez-les par WhatsApp, suivez vos paiements et relancez vos clients, de Conakry à Nzérékoré.
              </p>

              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '40px', fontWeight: 300 }}>
                Utilisé à <strong>Conakry, Kankan, Labé, Nzérékoré</strong> — 500 000 GNF/an, essai gratuit 24h.
              </p>

              <Reveal delay={200}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
                  <CtaButton />
                  <Link to="/fonctionnalites" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '13px 24px', background: 'transparent', color: 'var(--color-text)',
                    border: '1px solid var(--color-border)', borderRadius: '2px',
                    textDecoration: 'none', fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', transition: 'all 0.3s ease'
                  }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(212, 175, 55, 0.4)'; el.style.color = 'var(--color-gold)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-text)'; }}
                  >
                    Découvrir
                  </Link>
                </div>
              </Reveal>


            </div>

            {/* Right — Dashboard mockup (Minimalist) */}
            <div style={{ animation: 'fp-float 6s ease-in-out infinite' }}>
              <div style={{ background: 'var(--color-surface)', borderRadius: '2px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
                    {[['CA Mensuel', '4 250 000 GNF'], ['Factures', '32 émises'], ['Impayés', '820 000 GNF']].map(([l,v]) => (
                      <div key={l} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>{l}</div>
                        <div style={{ fontSize: '14px', fontWeight: 400, color: 'var(--color-text)', fontFamily: '"Playfair Display", serif' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '2px' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr 100px 80px', gap: '16px' }}>
                      {['Client', 'Montant', 'Statut'].map(h => <div key={h} style={{ fontSize: '9px', fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</div>)}
                    </div>
                    {[['SARL Kadi Invest', '850 000 GNF', 'Payée', 'var(--color-gold)'], ['BNS Group', '1 200 000 GNF', 'En attente', 'var(--color-text-muted)'], ['MinDev Nzérékoré', '450 000 GNF', 'Payée', 'var(--color-gold)']].map(([c,m,s,sc], i) => (
                      <div key={i} style={{ padding: '12px 16px', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none', display: 'grid', gridTemplateColumns: '1fr 100px 80px', gap: '16px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 300, color: 'var(--color-text)' }}>{c}</span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{m}</span>
                        <span style={{ fontSize: '10px', color: sc, letterSpacing: '0.5px' }}>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '16px', border: '1px solid rgba(212, 175, 55, 0.2)', background: 'rgba(212, 175, 55, 0.03)', borderRadius: '2px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-gold)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>ARIA : Facture envoyée — BNS Group</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── 4 SECTIONS H2 ─────────────────────────────────────────────────── */}
      <section aria-label="Fonctionnalités principales" style={{ padding: '80px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>Fonctionnalités</div>
            <h2 style={{ fontSize: '28px', color: 'var(--color-text)', fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>L'excellence opérationnelle.</h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            <HomeSection id="factures-conformes" emoji="I." title="Facturez en 2 minutes" delay={0}>
              <p>Chaque facture FacturaPro inclut automatiquement les mentions obligatoires en Guinée : <strong>RCCM, NIF, adresse</strong> et <strong>TVA à 18%</strong>. Vos clients obtiennent un document PDF d'une qualité professionnelle, avec votre logo et votre signature numérique.</p>
              <ul style={{ marginTop: '24px', paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Mentions RCCM + NIF', 'TVA 18% automatique', 'PDF haute qualité'].map(item => (
                  <li key={item} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-gold)' }} /> {item}
                  </li>
                ))}
              </ul>
            </HomeSection>

            <HomeSection id="envoi-whatsapp" emoji="II." title="WhatsApp et Email" delay={80}>
              <p>Partagez vos factures PDF directement depuis FacturaPro vers WhatsApp de votre client ou par Email en un seul clic. La méthode de communication préférée des entreprises à <strong>Conakry, Kankan, Boké et Kindia</strong>.</p>
              <ul style={{ marginTop: '24px', paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Partage en 1 clic', 'Compatible tous téléphones', 'Emails professionnels'].map(item => (
                  <li key={item} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-gold)' }} /> {item}
                  </li>
                ))}
              </ul>
            </HomeSection>

            <HomeSection id="suivi-paiements" emoji="III." title="Suivez vos paiements" delay={160}>
              <p>FacturaPro affiche en temps réel le statut de chaque facture : payée, partiellement payée ou impayée. Relancez vos clients depuis l'outil, que vous soyez à <strong>Mamou, Labé ou Nzérékoré</strong>.</p>
              <ul style={{ marginTop: '24px', paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Tableau de bord temps réel', 'Historique complet', 'Calcul des soldes'].map(item => (
                  <li key={item} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-gold)' }} /> {item}
                  </li>
                ))}
              </ul>
            </HomeSection>

            <HomeSection id="encaissement" emoji="IV." title="Innovations à venir" badge={<ComingSoonBadge />} delay={240}>
              <p>Bientôt, FacturaPro s'enrichira de nouvelles fonctionnalités exclusives :</p>
              <ul style={{ marginTop: '24px', paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {['Intégration Intelligence Artificielle', 'Relances automatiques', 'Gestion multi-entreprises', 'Liens de paiement directs (Mobile Money)'].map(item => (
                  <li key={item} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-gold)' }} /> {item}
                  </li>
                ))}
              </ul>
              <div style={{ borderLeft: '1px solid var(--color-gold)', paddingLeft: '16px', fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Fonctionnalités en cours de développement.
              </div>
            </HomeSection>
          </div>

          <Reveal style={{ textAlign: 'center', marginTop: '64px' }}>
            <CtaButton />
          </Reveal>
        </div>
      </section>


      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section aria-label="Questions fréquentes" style={{ padding: '80px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Reveal style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>Support</div>
            <h2 style={{ fontSize: '28px', color: 'var(--color-text)', fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>Questions fréquentes.</h2>
          </Reveal>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Reveal delay={0}><FaqItem q="Qu'est-ce que FacturaPro et à qui s'adresse-t-il ?" a="FacturaPro est un logiciel de facturation conçu spécifiquement pour les PME en Guinée. Il permet de créer des factures conformes (RCCM, NIF, TVA 18%) et de les envoyer par WhatsApp ou Email, depuis votre téléphone, à Conakry, Kankan, Labé, Nzérékoré, Boké, Kindia ou Mamou." /></Reveal>
            <Reveal delay={100}><FaqItem q="Quelles sont les mentions obligatoires sur une facture en Guinée ?" a="Une facture conforme en Guinée doit obligatoirement mentionner le RCCM (Registre du Commerce), le NIF (Numéro d'Identification Fiscale) et l'adresse du vendeur. La TVA est de 18% pour les entreprises assujetties (chiffre d'affaires annuel ≥ 1 milliard GNF). FacturaPro intègre automatiquement ces mentions." /></Reveal>
            <Reveal delay={200}><FaqItem q="Combien coûte FacturaPro ?" a="500 000 GNF par an, tout inclus. Vous disposez d'un essai gratuit de 24h pour tester toutes les fonctionnalités sans carte bancaire. C'est le tarif le plus simple du marché pour une PME guinéenne." /></Reveal>
            <Reveal delay={300}><FaqItem q="Puis-je envoyer mes factures par WhatsApp et Email depuis FacturaPro ?" a="Oui, c'est l'une des fonctionnalités principales. Vous générez votre facture PDF et vous pouvez l'envoyer directement sur WhatsApp à votre client ou par Email, sans passer par un autre outil." /></Reveal>
            <Reveal delay={400}><FaqItem q="FacturaPro fonctionne-t-il sur téléphone mobile ?" a="Oui. FacturaPro fonctionne directement depuis votre navigateur sur smartphone. Pas besoin d'installer une application — créez et envoyez vos factures depuis votre téléphone, où que vous soyez en Guinée." /></Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section aria-label="Appel à l'action" style={{ padding: '100px 20px', position: 'relative', overflow: 'hidden' }}>
        {/* Glow effect */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
        <WavesShape style={{ bottom: '-10%', left: '0', width: '100%', height: '300px' }} opacity={0.15} />
        <GeometricShapes opacity={0.3} />
        
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Reveal>
            <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 400, color: 'var(--color-text)', fontFamily: '"Playfair Display", serif', marginBottom: '24px' }}>
              Prêt à facturer comme un pro en Guinée ?
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', marginBottom: '48px', lineHeight: 1.8, fontWeight: 300 }}>
              Rejoignez 500+ PME guinéennes qui font confiance à FacturaPro. <br/>RCCM, NIF, TVA 18% — conformes dès le premier jour.
            </p>
            <Reveal delay={200}>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <CtaButton />
                <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', padding: '13px 28px', background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '2px', textDecoration: 'none', fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', transition: 'all 0.3s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212, 175, 55, 0.4)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-gold)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-text)'; }}
                >
                  Tarifs (500 000 GNF/an)
                </Link>
              </div>
            </Reveal>
          </Reveal>
        </div>
      </section>

      <PublicFooter />
      </div>
    </PageTransition>
  );
}
