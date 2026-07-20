import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar, PublicFooter } from './Layout';
import { usePageSEO } from '../../hooks/usePageSEO';
import { MotionReveal as Reveal } from '../../components/ui/MotionReveal';
import { PageTransition } from '../../components/ui/PageTransition';
import { BlobShape, GridPattern, GeometricShapes, WavesShape } from '../../components/ui/AbstractShapes';

/* ── Principle card ─────────────────────────────────────────────────────── */
function Principle({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px', padding: '32px',
      transition: 'border-color 0.4s ease, transform 0.4s ease'
    }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(212, 175, 55, 0.4)'; el.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.transform = 'none'; }}
    >
      <div style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--color-gold)' }}>{icon}</div>
      <h3 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '12px', letterSpacing: '0.5px' }}>{title}</h3>
      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.8, margin: 0, fontWeight: 300 }}>{desc}</p>
    </div>
  );
}

/* ── About Page ─────────────────────────────────────────────────────────── */
export function About() {
  usePageSEO({
    title: 'À propos de FacturaPro – Le logiciel de facturation pensé pour les PME guinéennes',
    description: 'FacturaPro est né pour répondre à un besoin simple : facturer vite, bien, et de façon conforme, sans complexité comptable. Découvrez notre mission pour les PME de Guinée.',
    canonical: 'https://facturapro.com/a-propos',
  });

  return (
    <PageTransition>
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text)', position: 'relative', overflow: 'hidden' }}>
        <GridPattern opacity={0.3} />
        <BlobShape style={{ top: '-5%', right: '-10%', width: '700px', height: '700px' }} />
        <GeometricShapes opacity={0.5} />

        <PublicNavbar />

        {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '120px 20px 80px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <Reveal delay={0}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', paddingBottom: '8px', marginBottom: '24px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-gold)' }} />
              <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1.5px' }}>À propos</span>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, color: 'var(--color-text)', letterSpacing: '-1px', marginBottom: '32px', fontFamily: '"Playfair Display", serif' }}>
              Pourquoi FacturaPro.
            </h1>
          </Reveal>
          {/* Paragraphe GEO */}
          <Reveal delay={0.2}>
            <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.8, fontWeight: 300, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px', padding: '24px', maxWidth: '700px', margin: '0 auto' }}>
              FacturaPro est né d'un constat simple : les PME guinéennes méritent un outil de facturation professionnel, conforme, et adapté à leur réalité — RCCM, NIF, TVA 18%, GNF, WhatsApp, Email — sans la complexité des logiciels internationaux.
            </p>
          </Reveal>
        </div>
      </div>

      {/* ── Contenu principal ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '80px 20px' }}>

        {/* H2 — Notre mission */}
        <section aria-label="Notre mission" style={{ marginBottom: '100px', position: 'relative', zIndex: 1 }}>
          <Reveal delay={0.3}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 400, color: 'var(--color-text)', letterSpacing: '-0.5px', marginBottom: '32px', fontFamily: '"Playfair Display", serif' }}>Notre mission.</h2>
            <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.9, marginBottom: '20px', fontWeight: 300 }}>
              Chez FacturaPro, nous faisons <strong style={{ color: 'var(--color-gold)', fontWeight: 400 }}>une seule chose, mais nous la faisons bien</strong> : permettre aux PME guinéennes de facturer en moins de 2 minutes, d'envoyer leurs factures par WhatsApp et Email, et de suivre leurs paiements depuis leur téléphone.
            </p>
            <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.9, marginBottom: '20px', fontWeight: 300 }}>
              Pas de comptabilité complexe, pas de modules superflus. FacturaPro est pensé pour l'entrepreneur guinéen qui veut professionnaliser sa gestion sans se perdre dans un ERP conçu pour d'autres marchés.
            </p>
            <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.9, fontWeight: 300 }}>
              Nous croyons que la simplicité est le plus grand luxe qu'on puisse offrir à un entrepreneur. C'est pourquoi chaque fonctionnalité de FacturaPro a été conçue pour être utilisable sans formation, depuis un smartphone, partout en Guinée.
            </p>
          </Reveal>
        </section>

        {/* H2 — Pensé pour la Guinée */}
        <section aria-label="Pensé pour la Guinée" style={{ marginBottom: '100px' }}>
          <Reveal>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 400, color: 'var(--color-text)', letterSpacing: '-0.5px', marginBottom: '32px', fontFamily: '"Playfair Display", serif' }}>Pensé pour la Guinée.</h2>
            <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.9, marginBottom: '40px', fontWeight: 300 }}>
              FacturaPro n'est pas un outil générique adapté à la Guinée — il a été <strong style={{ color: 'var(--color-gold)', fontWeight: 400 }}>conçu dès le départ pour les entrepreneurs guinéens</strong>. Chaque détail compte :
            </p>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
            <Reveal delay={0}><Principle icon="📋" title="RCCM et NIF intégrés" desc="Vos informations légales s'affichent automatiquement sur chaque facture. Conformité garantie dès le premier document." /></Reveal>
            <Reveal delay={0.1}><Principle icon="💰" title="TVA à 18% en Guinée" desc="La TVA guinéenne (18%) est calculée automatiquement. Vous restez conforme à la réglementation fiscale de la République de Guinée." /></Reveal>
            <Reveal delay={0.2}><Principle icon="💱" title="Facturation en GNF" desc="Francs Guinéens par défaut. Pas de conversion à faire, pas de taux de change à surveiller. Vous facturez dans votre devise." /></Reveal>
            <Reveal delay={0.3}><Principle icon="💬" title="WhatsApp et Email" desc="Conakry, Kankan, Labé, Nzérékoré, Boké, Kindia, Mamou — WhatsApp est le canal de communication de vos clients. L'Email assure un relais professionnel. FacturaPro offre les deux." /></Reveal>
          </div>
          <Reveal delay={0.4}>
            <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.9, fontWeight: 300 }}>
              Qu'on soit commerçant à <strong style={{ color: 'var(--color-text)', fontWeight: 400 }}>Conakry</strong>, prestataire BTP à <strong style={{ color: 'var(--color-text)', fontWeight: 400 }}>Kankan</strong>, consultant à <strong style={{ color: 'var(--color-text)', fontWeight: 400 }}>Labé</strong> ou entrepreneur dans l'agro-alimentaire à <strong style={{ color: 'var(--color-text)', fontWeight: 400 }}>Nzérékoré</strong> — FacturaPro s'adapte à votre secteur et à votre ville.
            </p>
          </Reveal>
        </section>

        {/* H2 — L'équipe */}
        <section aria-label="L'équipe EINSOFT DIGIT" style={{ marginBottom: '100px' }}>
          <Reveal>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 400, color: 'var(--color-text)', letterSpacing: '-0.5px', marginBottom: '32px', fontFamily: '"Playfair Display", serif' }}>L'équipe — EINSOFT DIGIT.</h2>
            <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.9, marginBottom: '40px', fontWeight: 300 }}>
              Derrière FacturaPro se trouve l'équipe d'<strong style={{ color: 'var(--color-gold)', fontWeight: 400 }}>EINSOFT DIGIT</strong>, une société de développement technologique basée à <strong style={{ color: 'var(--color-text)', fontWeight: 400 }}>Conakry, République de Guinée</strong>. Nous construisons des logiciels sécurisés, performants et intuitifs pour simplifier le quotidien des entrepreneurs locaux.
            </p>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px', padding: '48px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-gold)', marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Nos principes</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  'Excellence du design et de l\'interface utilisateur — nous refusons le "suffisant"',
                  'Confidentialité stricte des données — vos données ne sont pas revendues, jamais',
                  'Support réactif en français — une vraie équipe guinéenne, pas un bot',
                  'Innovation continue par l\'Intelligence Artificielle — pour automatiser ce qui prend du temps',
                  'Prix juste et transparent — 500 000 GNF/an, tout inclus, sans surprise',
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 300, lineHeight: 1.6 }}>
                    <span style={{ color: 'var(--color-gold)', fontSize: '14px', lineHeight: 1, flexShrink: 0, marginTop: '3px' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: '32px', padding: '24px 32px', background: 'transparent', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '2px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.8, fontWeight: 300 }}>
                <strong style={{ color: 'var(--color-text)', fontWeight: 400 }}>EINSOFT DIGIT</strong> — Siège social à Conakry, République de Guinée<br />
                <span style={{ display: 'inline-block', marginTop: '12px' }}>
                  <a href="mailto:equipe@facturadigit.online" style={{ color: 'var(--color-gold)', textDecoration: 'none', borderBottom: '1px solid rgba(212, 175, 55, 0.3)' }}>equipe@facturadigit.online</a> &nbsp;&nbsp;&nbsp;
                  <span style={{ opacity: 0.5 }}>+224 624 77 06 18</span> &nbsp;&nbsp;&nbsp;
                  <a href="https://einsofdigit.com" target="_blank" rel="noreferrer" style={{ color: 'var(--color-gold)', textDecoration: 'none', borderBottom: '1px solid rgba(212, 175, 55, 0.3)' }}>einsofdigit.com</a>
                </span>
              </div>
            </div>
          </Reveal>
        </section>

        {/* CTA discret */}
        <Reveal delay={0.2}>
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--color-surface)', borderRadius: '2px', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
            <WavesShape style={{ bottom: '0', left: '0', width: '100%', height: '200px' }} opacity={0.15} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: '15px', color: 'var(--color-text)', marginBottom: '32px', fontWeight: 300, letterSpacing: '0.5px' }}>
                Vous voulez tester FacturaPro par vous-même ?
              </p>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 32px', background: 'var(--color-gold)', color: '#1A1715',
                borderRadius: '2px', textDecoration: 'none', fontSize: '13px',
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                transition: 'all 0.3s ease', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#E6D5B8'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.3)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--color-gold)'; el.style.transform = 'none'; el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'; }}
              >
                Essayer FacturaPro — gratuit 24h
              </Link>
            </div>
          </div>
        </Reveal>
      </div>

      <PublicFooter />
      </div>
    </PageTransition>
  );
}
