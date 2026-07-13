import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar, PublicFooter } from './Layout';
import { usePageSEO } from '../../hooks/usePageSEO';
import { MotionReveal as Reveal } from '../../components/ui/MotionReveal';
import { PageTransition } from '../../components/ui/PageTransition';
import { BlobShape, GridPattern, GeometricShapes, WavesShape } from '../../components/ui/AbstractShapes';

/* ── Check item ─────────────────────────────────────────────────────────── */
function CheckItem({ text }: { text: string }) {
  return (
    <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--color-text)', fontWeight: 300 }}>
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      {text}
    </li>
  );
}

/* ── FAQ Accordion ──────────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--color-border)', transition: 'border-color 0.3s' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 0', background: 'transparent', border: 'none', cursor: 'pointer',
        fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', textAlign: 'left', gap: '12px', letterSpacing: '0.5px'
      }}>
        {q}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      <div style={{
        height: open ? 'auto' : 0, overflow: 'hidden', opacity: open ? 1 : 0,
        transition: 'opacity 0.4s ease'
      }}>
        <div style={{ paddingBottom: '20px', fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.8, fontWeight: 300 }}>
          {a}
        </div>
      </div>
    </div>
  );
}

/* ── Pricing Schema.org FAQ JSON-LD ─────────────────────────────────────── */
const PRICING_FAQ_JSON = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Combien coûte FacturaPro en Guinée ?",
      "acceptedAnswer": { "@type": "Answer", "text": "FacturaPro coûte 1 000 GNF par an. C'est un tarif fixe, tout inclus, sans frais cachés ni abonnement mensuel. C'est le logiciel de facturation le plus accessible du marché guinéen." }
    },
    {
      "@type": "Question",
      "name": "Y a-t-il un essai gratuit ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui. Vous bénéficiez d'un essai gratuit de 24h dès votre inscription. Aucune carte bancaire n'est requise pour commencer. Vous accédez à toutes les fonctionnalités sans restriction pendant 24h." }
    },
    {
      "@type": "Question",
      "name": "Que comprend l'abonnement annuel FacturaPro ?",
      "acceptedAnswer": { "@type": "Answer", "text": "L'abonnement à 1 000 GNF/an inclut : factures illimitées, reçus de paiement, gestion clients illimitée, envoi par WhatsApp et Email, multi-devises (GNF, FCFA, USD, EUR), export PDF haute qualité, catalogue de services, tableau de bord analytique et support technique." }
    },
    {
      "@type": "Question",
      "name": "Est-il possible de payer en GNF ou en Mobile Money ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui, FacturaPro accepte le paiement en GNF. Les modalités de paiement sont précisées lors de l'inscription. Contactez le support via WhatsApp au +224 624 77 06 18 pour toute question sur le paiement de l'abonnement." }
    },
    {
      "@type": "Question",
      "name": "Puis-je annuler mon abonnement ?",
      "acceptedAnswer": { "@type": "Answer", "text": "L'abonnement FacturaPro est annuel. Il n'y a pas d'engagement mensuel à résilier. À l'échéance, vous choisissez de renouveler ou non. Aucun renouvellement automatique sans votre accord." }
    }
  ]
};

/* ── Pricing Page ───────────────────────────────────────────────────────── */
export function Pricing() {
  usePageSEO({
    title: 'Tarifs FacturaPro – 1 000 GNF/an, essai gratuit 24h | Facturation PME Guinée',
    description: 'Un seul tarif clair : 1 000 GNF par an pour facturer sans limite. Essai gratuit de 24h, sans engagement. Le prix le plus simple du marché en Guinée.',
    canonical: 'https://facturapro.com/tarifs',
  });

  return (
    <PageTransition>
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text)', position: 'relative', overflow: 'hidden' }}>
        {/* FAQ Schema.org JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_FAQ_JSON) }} />
        
        <GridPattern opacity={0.3} />
        <BlobShape style={{ top: '20%', right: '-10%', width: '600px', height: '600px' }} />
        <GeometricShapes opacity={0.5} />

        <PublicNavbar />

        {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div style={{ paddingTop: '160px', paddingBottom: '80px', textAlign: 'center', padding: '160px 32px 80px' }}>
        <Reveal delay={0}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', paddingBottom: '8px', marginBottom: '24px' }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-gold)' }} />
            <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Tarifs</span>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, color: 'var(--color-text)', letterSpacing: '-1px', marginBottom: '24px', fontFamily: '"Playfair Display", serif' }}>
            Un prix simple : 1 000 GNF par an.
          </h1>
        </Reveal>
        {/* Paragraphe GEO */}
        <Reveal delay={0.2}>
          <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', maxWidth: '640px', margin: '0 auto 16px', lineHeight: 1.8, fontWeight: 300 }}>
            FacturaPro coûte 1 000 GNF par an — un tarif fixe, tout inclus, sans frais cachés. Vous bénéficiez d'un essai gratuit de 24h sans carte bancaire pour tester toutes les fonctionnalités.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '500px', margin: '0 auto', fontWeight: 300, fontStyle: 'italic' }}>
            Le logiciel de facturation le plus accessible du marché guinéen. Un seul tarif, toutes les fonctionnalités incluses.
          </p>
        </Reveal>
      </div>

      <div style={{ padding: '0 32px 120px' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>

          {/* ── Carte Tarif ──────────────────────────────────────────────── */}
          <Reveal delay={0.3}>
            <div style={{
              background: 'var(--color-surface)', borderRadius: '2px', border: '1px solid rgba(212, 175, 55, 0.4)',
              padding: '56px 48px', position: 'relative', marginBottom: '48px', overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)', transition: 'all 0.4s ease'
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(212, 175, 55, 0.1)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)'; }}
            >
              <WavesShape style={{ bottom: '0', left: '0', width: '100%', height: '150px' }} opacity={0.1} />
              
              {/* Badge */}
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)',
                background: 'var(--color-gold)', color: '#1A1715', padding: '6px 20px',
                fontSize: '10px', fontWeight: 600, letterSpacing: '1px',
                textTransform: 'uppercase', borderRadius: '2px'
              }}>
                L'Offre Unique — Tout Inclus
              </div>

              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 400, color: 'var(--color-text)', marginBottom: '8px', fontFamily: '"Playfair Display", serif' }}>FacturaPro Business</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '32px', fontWeight: 300, lineHeight: 1.6 }}>
                  Facturez sans limite, envoyez par WhatsApp et Email, gérez vos clients et vos paiements.
                </p>

              {/* Prix */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '56px', fontWeight: 300, color: 'var(--color-gold)', letterSpacing: '-2px', fontFamily: '"Playfair Display", serif' }}>1 000</span>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 400, color: 'var(--color-text)', letterSpacing: '0.5px' }}>GNF</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.5px' }}>par an</div>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '32px', fontWeight: 300 }}>
                Moins de <strong style={{ color: 'var(--color-gold)', fontWeight: 400 }}>100 GNF/mois</strong> · Essai gratuit 24h · Aucun frais caché
              </p>

              {/* CTA */}
              <Link to="/register" style={{
                display: 'flex', justifyContent: 'center', width: '100%',
                padding: '16px', background: 'var(--color-gold)', color: '#1A1715',
                borderRadius: '2px', textDecoration: 'none', fontSize: '14px',
                fontWeight: 600, transition: 'all 0.3s ease', marginBottom: '40px', boxSizing: 'border-box',
                textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#E6D5B8'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.3)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--color-gold)'; el.style.transform = 'none'; el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'; }}
              >
                Démarrer mon essai gratuit 24h
              </Link>

              {/* Section Ce qui est inclus */}
              <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.2)', paddingTop: '32px', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Ce qui est inclus</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <CheckItem text="Factures illimitées (conformes RCCM, NIF, TVA 18%)" />
                  <CheckItem text="Reçus de paiement illimités" />
                  <CheckItem text="Gestion clients illimitée" />
                  <CheckItem text="Envoi par WhatsApp et Email en 1 clic" />
                  <CheckItem text="Multi-devises : GNF, FCFA, USD, EUR" />
                  <CheckItem text="Export PDF haute qualité (logo, signature)" />
                  <CheckItem text="Catalogue de services et produits" />
                  <CheckItem text="Tableau de bord analytique en temps réel" />
                  <CheckItem text="Support technique prioritaire" />
                  <CheckItem text="Relances automatiques IA (bientôt disponible)" />
                  <CheckItem text="Encaissement Orange Money, Visa, Soutra Money (bientôt)" />
                </ul>
              </div>

              {/* Essai gratuit 24h */}
              <div style={{ background: 'rgba(212, 175, 55, 0.03)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '2px', padding: '20px' }}>
                <div style={{ fontWeight: 500, color: 'var(--color-gold)', marginBottom: '8px', fontSize: '13px', letterSpacing: '0.5px' }}>✓ Essai gratuit de 24h — sans carte bancaire</div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.6, fontWeight: 300 }}>
                  Inscrivez-vous et accédez à toutes les fonctionnalités pendant 24h. Si FacturaPro vous convient, vous activez l'abonnement. Sinon, votre compte expire sans aucun frais.
                </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ── Comparatif discret ───────────────────────────────────────── */}
          <Reveal delay={0.4}>
            <div style={{ background: 'transparent', borderLeft: '1px solid rgba(212, 175, 55, 0.3)', paddingLeft: '24px', marginBottom: '64px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '12px', letterSpacing: '0.5px' }}>Pourquoi un tarif annuel fixe ?</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.8, margin: 0, fontWeight: 300 }}>
                Les logiciels internationaux facturent souvent en devise étrangère, par mois, avec des fonctionnalités en option. Chez FacturaPro, <strong style={{ color: 'var(--color-gold)', fontWeight: 400 }}>1 000 GNF par an</strong>, c'est tout. Pas de mensualité, pas de surprises, pas de conversion de devise à la fin du mois.
              </p>
            </div>
          </Reveal>

          {/* ── FAQ Tarifs ───────────────────────────────────────────────── */}
          <div>
            <Reveal style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 400, color: 'var(--color-text)', letterSpacing: '-0.5px', fontFamily: '"Playfair Display", serif' }}>Questions fréquentes sur le prix</h2>
            </Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
              <Reveal delay={0}><FaqItem q="Combien coûte FacturaPro en Guinée ?" a="FacturaPro coûte 1 000 GNF par an — tout inclus. Pas de frais mensuel, pas de fonctionnalité en option. C'est le tarif le plus simple et le plus transparent du marché guinéen." /></Reveal>
              <Reveal delay={0.1}><FaqItem q="Y a-t-il un essai gratuit ?" a="Oui. Vous bénéficiez d'un essai gratuit de 24h dès l'inscription. Aucune carte bancaire requise. Vous accédez à toutes les fonctionnalités sans restriction pendant cette période." /></Reveal>
              <Reveal delay={0.2}><FaqItem q="Que comprend l'abonnement ?" a="Tout : factures illimitées, reçus, gestion clients, envoi par WhatsApp et Email, multi-devises, export PDF, catalogue de services, tableau de bord, et support technique prioritaire. Pas de module en option." /></Reveal>
              <Reveal delay={0.3}><FaqItem q="Puis-je payer en GNF ou Mobile Money ?" a="Oui. Les modalités de paiement de l'abonnement sont en GNF. Contactez notre support WhatsApp au +224 624 77 06 18 pour plus d'informations sur les modes de paiement disponibles." /></Reveal>
              <Reveal delay={0.4}><FaqItem q="L'abonnement se renouvelle-t-il automatiquement ?" a="Non. L'abonnement FacturaPro est annuel et ne se renouvelle pas sans votre accord. À l'échéance, vous êtes notifié et vous choisissez librement de renouveler ou non." /></Reveal>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
      </div>
    </PageTransition>
  );
}
