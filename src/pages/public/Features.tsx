import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar, PublicFooter } from './Layout';
import { usePageSEO } from '../../hooks/usePageSEO';
import { MotionReveal as Reveal } from '../../components/ui/MotionReveal';
import { PageTransition } from '../../components/ui/PageTransition';
import { BlobShape, GridPattern, GeometricShapes, WavesShape } from '../../components/ui/AbstractShapes';

/* ── Badge "Bientôt disponible" ─────────────────────────────────────────── */
function ComingSoonBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)',
      color: 'var(--color-gold)', fontSize: '10px', fontWeight: 600,
      padding: '3px 10px', borderRadius: '2px', letterSpacing: '1px',
      textTransform: 'uppercase', flexShrink: 0
    }}>
      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-gold)', display: 'inline-block' }} />
      Bientôt disponible
    </span>
  );
}

function NewBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.3)',
      color: 'var(--color-gold)', fontSize: '10px', fontWeight: 600,
      padding: '3px 10px', borderRadius: '2px', letterSpacing: '1px',
      textTransform: 'uppercase', flexShrink: 0
    }}>
      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-gold)', display: 'inline-block' }} />
      Nouveau
    </span>
  );
}

/* ── CTA Button ─────────────────────────────────────────────────────────── */
function CtaButton() {
  return (
    <Link to="/register" style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      padding: '13px 28px', background: 'var(--color-gold)', color: '#1A1715',
      borderRadius: '2px', textDecoration: 'none', fontSize: '13px',
      fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
      transition: 'all 0.3s ease', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#E6D5B8'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.3)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--color-gold)'; el.style.transform = 'none'; el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'; }}
    >
      Essayer gratuitement 24h
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </Link>
  );
}

/* ── Check item ─────────────────────────────────────────────────────────── */
function CheckItem({ text }: { text: string }) {
  return (
    <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--color-text)', fontWeight: 300, lineHeight: 1.6 }}>
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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
        padding: '24px 0', background: 'transparent', border: 'none', cursor: 'pointer',
        fontSize: '15px', fontWeight: 500, color: 'var(--color-text)', textAlign: 'left', gap: '12px',
        letterSpacing: '0.5px'
      }}>
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

/* ── Section feature ────────────────────────────────────────────────────── */
function FeatureSection({ id, emoji, badge, title, lead, children, cta = true }: {
  id: string; emoji: string; badge?: React.ReactNode; title: string;
  lead: string; children: React.ReactNode; cta?: boolean;
}) {
  return (
    <section id={id} aria-label={title} style={{ padding: '80px 20px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '80px', alignItems: 'center' }}>
          <Reveal delay={0}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-gold)', letterSpacing: '2px', marginBottom: '16px', opacity: 0.9 }}>{emoji}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 400, color: 'var(--color-text)', letterSpacing: '-0.5px', margin: 0, lineHeight: 1.2, fontFamily: '"Playfair Display", serif' }}>{title}</h2>
                {badge}
              </div>
              <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '40px', fontWeight: 300 }}>{lead}</p>
              {cta && <CtaButton />}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div>{children}</div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ Schema.org ─────────────────────────────────────────────────────── */
const FEATURES_FAQ_JSON = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Puis-je facturer en Francs Guinéens (GNF) avec FacturaPro ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui. FacturaPro est paramétré par défaut en GNF (Francs Guinéens). Vous pouvez aussi choisir FCFA, USD ou EUR dans les paramètres. Le symbole et le séparateur de milliers s'adaptent automatiquement." }
    },
    {
      "@type": "Question",
      "name": "Puis-je ajouter mon logo sur les factures FacturaPro ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui. Vous pouvez importer votre logo dans les paramètres du compte. Il apparaîtra automatiquement sur toutes vos factures et reçus PDF, avec votre signature si vous le souhaitez." }
    },
    {
      "@type": "Question",
      "name": "FacturaPro inclut-il automatiquement le RCCM et le NIF sur les factures ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui. Vous renseignez votre RCCM, NIF et adresse une seule fois dans les paramètres. Ces informations s'affichent automatiquement sur chaque facture générée, en conformité avec la réglementation fiscale guinéenne." }
    },
    {
      "@type": "Question",
      "name": "Comment fonctionne l'envoi de factures par WhatsApp et Email ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Une fois votre facture générée, un bouton permet de partager le PDF directement vers WhatsApp ou de l'envoyer par Email. Vous sélectionnez le contact ou le groupe souhaité, et la facture est envoyée en un clic." }
    },
    {
      "@type": "Question",
      "name": "Quand l'encaissement par Orange Money et Mobile Money sera-t-il disponible ?",
      "acceptedAnswer": { "@type": "Answer", "text": "L'encaissement par Orange Money, MTN Mobile Money, carte Visa et Soutra Money est en cours de développement. Cette fonctionnalité sera disponible prochainement. Inscrivez-vous dès maintenant pour être informé au lancement." }
    }
  ]
};



/* ── Features Page ──────────────────────────────────────────────────────── */
export function Features() {
  usePageSEO({
    title: 'Fonctionnalités FacturaPro – Facturation, WhatsApp, relances et paiement en Guinée',
    description: 'Découvrez toutes les fonctionnalités FacturaPro : création de factures conformes (RCCM, NIF, TVA 18%), envoi WhatsApp, suivi des paiements, relances automatiques par IA, et bientôt l\'encaissement multi-moyens.',
    canonical: 'https://facturapro.com/fonctionnalites',
  });

  return (
    <PageTransition>
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text)', position: 'relative', overflow: 'hidden' }}>
        {/* FAQ Schema.org JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FEATURES_FAQ_JSON) }} />

        <GridPattern opacity={0.3} />
        <BlobShape style={{ top: '-10%', left: '-10%', width: '800px', height: '800px' }} />
        <GeometricShapes opacity={0.5} />

        <PublicNavbar />

        {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '120px 20px 80px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <Reveal delay={0}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', paddingBottom: '8px', marginBottom: '24px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-gold)' }} />
              <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Fonctionnalités</span>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, color: 'var(--color-text)', letterSpacing: '-1px', marginBottom: '24px', fontFamily: '"Playfair Display", serif' }}>
              Tout ce que FacturaPro<br/><span style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>vous permet de faire.</span>
            </h1>
          </Reveal>
          {/* Paragraphe GEO */}
          <Reveal delay={0.2}>
            <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', maxWidth: '700px', margin: '0 auto 24px', lineHeight: 1.8, fontWeight: 300 }}>
              FacturaPro permet aux PME guinéennes de créer des factures conformes (RCCM, NIF, TVA 18%), de les envoyer par WhatsApp, de suivre les paiements et de relancer les clients impayés depuis un seul outil.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-gold)', maxWidth: '560px', margin: '0 auto', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              De Conakry à Kankan, de Labé à Nzérékoré.
            </p>
          </Reveal>
        </div>
      </div>

      {/* ── Section 1 : Factures conformes ───────────────────────────────── */}
      <FeatureSection
        id="factures-conformes"
        emoji="FONCTIONNALITÉ 01"
        title="Créer et envoyer des factures conformes."
        lead="Générez des factures PDF d'une qualité professionnelle, conformes à la réglementation fiscale guinéenne. Votre RCCM, NIF, adresse et la TVA à 18% s'affichent automatiquement sur chaque document."
      >
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px', padding: '40px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <CheckItem text="RCCM et NIF automatiquement intégrés sur chaque facture" />
            <CheckItem text="TVA 18% calculée et affichée conformément à la loi guinéenne" />
            <CheckItem text="Logo, signature numérique et mentions légales inclus" />
            <CheckItem text="Numérotation séquentielle automatique (FP-2026-001, 002…)" />
            <CheckItem text="Export PDF haute qualité, imprimable ou partageable" />
            <CheckItem text="Catalogue de produits et services pour remplissage rapide" />
          </ul>
        </div>
      </FeatureSection>

      {/* ── Section 2 : WhatsApp ─────────────────────────────────────────── */}
      <FeatureSection
        id="envoi-whatsapp"
        emoji="FONCTIONNALITÉ 02"
        title="Envoyer vos factures par WhatsApp ou Email."
        lead="Partagez vos factures PDF directement depuis FacturaPro vers WhatsApp de votre client ou par Email en un seul clic — la méthode de communication préférée des entreprises à Conakry, Kankan, Boké et Kindia."
      >
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px', padding: '40px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <CheckItem text="Boutons de partage WhatsApp et Email intégrés à chaque facture" />
            <CheckItem text="Compatible Android et iPhone, tous opérateurs guinéens" />
            <CheckItem text="Partage vers un contact, un groupe ou votre propre numéro" />
            <CheckItem text="Vos clients reçoivent la facture PDF directement sur leur téléphone" />
            <CheckItem text="Relances clients aussi disponibles par WhatsApp depuis l'outil" />
          </ul>
        </div>
      </FeatureSection>

      {/* ── Section 3 : Suivi paiements ──────────────────────────────────── */}
      <FeatureSection
        id="suivi-paiements"
        emoji="FONCTIONNALITÉ 03"
        title="Suivre les paiements et relancer."
        lead="FacturaPro affiche en temps réel le statut de chaque facture. Identifiez les impayés, consultez l'historique par client et relancez directement depuis l'outil — que vous soyez à Mamou, Labé ou Nzérékoré."
      >
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px', padding: '40px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <CheckItem text="Tableau de bord des impayés mis à jour en temps réel" />
            <CheckItem text="Statuts : Payée, Partielle, En attente, Impayée" />
            <CheckItem text="Historique complet par client avec soldes restants" />
            <CheckItem text="Relance manuelle par WhatsApp depuis la fiche client" />
            <CheckItem text="Reçus de paiement liés aux factures correspondantes" />
            <CheckItem text="Fiche client : total facturé, total encaissé, reste à recouvrer" />
          </ul>
        </div>
      </FeatureSection>

      {/* ── Section 4 : Relances IA ───────────────────────────────────────── */}
      <FeatureSection
        id="relances-ia"
        emoji="FONCTIONNALITÉ 04"
        badge={<NewBadge />}
        title="Relances automatiques par l'IA."
        lead="Bientôt, l'assistant IA intégré à FacturaPro pourra détecter les factures impayées et envoyer des relances automatisées par WhatsApp à vos clients, selon une séquence que vous définissez."
      >
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px', padding: '40px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <CheckItem text="Détection automatique des factures impayées à J+7, J+15, J+30" />
            <CheckItem text="Messages de relance personnalisés en français" />
            <CheckItem text="Envoi par WhatsApp sans intervention manuelle" />
            <CheckItem text="Ton de relance adapté selon l'historique client" />
            <CheckItem text="Notifications dans l'interface quand une relance est envoyée" />
          </ul>
          <div style={{ marginTop: '32px', borderLeft: '1px solid var(--color-gold)', paddingLeft: '16px', fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Fonctionnalité en cours de développement.
          </div>
        </div>
      </FeatureSection>

      {/* ── Section 5 : Encaissement ─────────────────────────────────────── */}
      <FeatureSection
        id="encaissement"
        emoji="FONCTIONNALITÉ 05"
        badge={<ComingSoonBadge />}
        title="Encaisser directement vos factures."
        lead="Bientôt, envoyez un lien de paiement à votre client directement depuis FacturaPro. Il paie par Orange Money, MTN Mobile Money, carte Visa ou Soutra Money sans quitter son téléphone."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { icon: 'OM', name: 'Orange Money', desc: 'Portefeuille mobile dominant en Guinée' },
            { icon: 'MTN', name: 'MTN Mobile Money', desc: 'Couverture dans toutes les régions' },
            { icon: 'VS', name: 'Carte Visa', desc: 'Paiement international' },
            { icon: 'SM', name: 'Soutra Money', desc: '100% guinéen' },
          ].map(m => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px', padding: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--color-gold)' }}>
                {m.icon}
              </div>
              <div>
                <div style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: '14px', letterSpacing: '0.5px' }}>{m.name}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontWeight: 300, marginTop: '4px' }}>{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '24px', borderLeft: '1px solid rgba(212, 175, 55, 0.5)', paddingLeft: '16px', fontSize: '12px', color: 'var(--color-gold)', fontStyle: 'italic' }}>
          Bientôt disponible — Inscrivez-vous pour être informé.
        </div>
      </FeatureSection>

      {/* ── FAQ Technique ────────────────────────────────────────────────── */}
      <section aria-label="FAQ Technique" style={{ padding: '80px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Reveal style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>Technique</div>
            <h2 style={{ fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 400, color: 'var(--color-text)', letterSpacing: '-0.5px', fontFamily: '"Playfair Display", serif' }}>Questions fréquentes.</h2>
          </Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
            <Reveal delay={0}><FaqItem q="Puis-je facturer en Francs Guinéens (GNF) ?" a="Oui. FacturaPro est paramétré par défaut en GNF. Vous pouvez aussi choisir FCFA, USD ou EUR selon vos besoins depuis les paramètres du compte." /></Reveal>
            <Reveal delay={0.1}><FaqItem q="Puis-je personnaliser mes factures avec mon logo ?" a="Oui. Importez votre logo une seule fois dans les paramètres. Il apparaît automatiquement sur toutes vos factures et reçus PDF, avec votre signature si vous le souhaitez." /></Reveal>
            <Reveal delay={0.2}><FaqItem q="Faut-il une application mobile à installer ?" a="Non. FacturaPro fonctionne directement depuis votre navigateur sur téléphone ou ordinateur. Pas d'application à télécharger, pas de mise à jour manuelle." /></Reveal>
            <Reveal delay={0.3}><FaqItem q="Comment le RCCM et le NIF apparaissent-ils sur les factures ?" a="Vous les renseignez une seule fois dans les paramètres du compte. Ils s'affichent automatiquement sur chaque facture générée, en conformité avec la réglementation guinéenne." /></Reveal>
            <Reveal delay={0.4}><FaqItem q="Quand l'encaissement par Orange Money sera-t-il disponible ?" a="L'encaissement par Orange Money, MTN Mobile Money, carte Visa et Soutra Money est en cours de développement. Cette fonctionnalité sera lancée prochainement. Inscrivez-vous pour être informé." /></Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '100px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
        <WavesShape style={{ bottom: '-10%', left: '0', width: '100%', height: '300px' }} opacity={0.15} />
        <GeometricShapes opacity={0.3} />
        <Reveal style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 400, color: 'var(--color-text)', letterSpacing: '-0.5px', marginBottom: '24px', fontFamily: '"Playfair Display", serif' }}>
            Prêt à tester FacturaPro ?
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', marginBottom: '48px', lineHeight: 1.8, fontWeight: 300, maxWidth: '600px', margin: '0 auto 48px' }}>
            Essai gratuit 24h — pas de carte bancaire. Conformité RCCM, NIF et TVA 18% dès le premier jour.
          </p>
          <Reveal delay={0.2}>
            <CtaButton />
          </Reveal>
        </Reveal>
      </div>

      <PublicFooter />
      </div>
    </PageTransition>
  );
}
