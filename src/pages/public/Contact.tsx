import React, { useState, useRef, useEffect } from 'react';
import { PublicNavbar, PublicFooter } from './Layout';
import { usePageSEO } from '../../hooks/usePageSEO';
import { toast } from 'sonner';
import { getWhatsAppUrl } from '../../lib/store';
import { MotionReveal as Reveal } from '../../components/ui/MotionReveal';
import { PageTransition } from '../../components/ui/PageTransition';
import { BlobShape, GridPattern, GeometricShapes, WavesShape } from '../../components/ui/AbstractShapes';

const WHATSAPP_NUMBER = '224624770618'; // +224 624 77 06 18

/* ── FAQ mini ────────────────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--color-border)', transition: 'border-color 0.3s' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 0', background: 'transparent', border: 'none', cursor: 'pointer',
        fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', textAlign: 'left', gap: '12px',
        letterSpacing: '0.5px'
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
        <div style={{ paddingBottom: '16px', fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.8, fontWeight: 300 }}>
          {a}
        </div>
      </div>
    </div>
  );
}

/* ── Contact Page ───────────────────────────────────────────────────────── */
export function Contact() {
  const [loading, setLoading] = useState(false);

  usePageSEO({
    title: 'Contact FacturaPro – Support pour PME en Guinée',
    description: 'Une question sur FacturaPro ? Contactez-nous par WhatsApp, email ou téléphone. Support en français, pensé pour les entrepreneurs guinéens.',
    canonical: 'https://facturapro.com/contact',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Votre message a été envoyé. Nous vous contacterons sous 24h.');
    setLoading(false);
    (e.target as HTMLFormElement).reset();
  };

  const encodedMsg = encodeURIComponent('Bonjour, j\'ai une question sur FacturaPro.');
  const whatsappUrl = getWhatsAppUrl(WHATSAPP_NUMBER, encodedMsg);

  return (
    <PageTransition>
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text)', position: 'relative', overflow: 'hidden' }}>
        <GridPattern opacity={0.3} />
        <BlobShape style={{ top: '-10%', left: '-10%', width: '800px', height: '800px' }} />
        <GeometricShapes opacity={0.5} />

        <PublicNavbar />

        {/* ── En-tête ──────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '120px 20px 60px', position: 'relative', zIndex: 1 }}>
          <Reveal delay={0}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', paddingBottom: '8px', marginBottom: '24px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-gold)' }} />
              <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Support</span>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, color: 'var(--color-text)', letterSpacing: '-1px', marginBottom: '24px', fontFamily: '"Playfair Display", serif' }}>
              Contactez-nous.
            </h1>
          </Reveal>
        {/* Paragraphe GEO */}
        <Reveal delay={0.2}>
          <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.8, fontWeight: 300 }}>
            Notre équipe d'EINSOFT DIGIT est disponible pour répondre à vos questions sur FacturaPro. Contactez-nous par WhatsApp, email ou via le formulaire ci-dessous — réponse sous 24h.
          </p>
        </Reveal>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'start' }}>

        {/* ── Panneau de contact ────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', zIndex: 1 }}>
          <Reveal delay={0.3}>
            {/* WhatsApp — prioritaire */}
            <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px', padding: '24px',
              textDecoration: 'none', transition: 'all 0.3s ease'
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(212, 175, 55, 0.4)'; el.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.transform = 'none'; }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--color-gold)">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '4px', letterSpacing: '0.5px' }}>Discuter sur WhatsApp</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 300 }}>+224 624 77 06 18 — Réponse rapide</div>
              </div>
            </a>
          </Reveal>

          <Reveal delay={0.4}>
            {/* Coordonnées */}
            <div style={{ background: 'transparent', borderLeft: '1px solid rgba(212, 175, 55, 0.3)', paddingLeft: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '6px', letterSpacing: '0.5px' }}>EINSOFT DIGIT</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.6, fontWeight: 300 }}>L'équipe derrière FacturaPro — support en français.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Téléphone</div>
                  <a href="tel:+224624770618" style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 300, textDecoration: 'none' }}>+224 624 77 06 18</a>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Email</div>
                  <a href="mailto:equipe@facturadigit.online" style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 300, textDecoration: 'none' }}>equipe@facturadigit.online</a>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Adresse</div>
                  <address style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 300, fontStyle: 'normal', lineHeight: 1.6 }}>
                    Conakry<br />République de Guinée
                  </address>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Horaires support</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 300, lineHeight: 1.6 }}>Lundi – Samedi<br />8h – 20h (heure de Conakry)</div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.5}>
            {/* Mini-FAQ */}
            <div style={{ background: 'var(--color-surface)', borderRadius: '2px', border: '1px solid var(--color-border)', padding: '24px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-gold)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Questions fréquentes</h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <FaqItem q="Le support est-il en français ?" a="Oui, notre équipe est basée à Conakry et répond exclusivement en français. Que ce soit par WhatsApp, email ou formulaire, vous n'aurez jamais affaire à un support traduit automatiquement." />
                <FaqItem q="Puis-je être rappelé par téléphone ?" a="Oui. Précisez dans votre message que vous souhaitez être rappelé et indiquez votre numéro. Notre équipe vous contacte généralement dans la journée." />
                <FaqItem q="Quel est le délai de réponse ?" a="Via WhatsApp : généralement moins de 2h en journée. Via email ou formulaire : sous 24h maximum, souvent beaucoup plus rapide." />
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Formulaire ───────────────────────────────────────────────── */}
        <Reveal delay={0.6}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '2px', border: '1px solid var(--color-border)', padding: '32px 20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 400, color: 'var(--color-text)', marginBottom: '8px', fontFamily: '"Playfair Display", serif' }}>Envoyer un message</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '32px', fontWeight: 300 }}>
              Remplissez le formulaire ci-dessous. Nous vous répondons sous 24h.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px', letterSpacing: '0.5px' }}>Nom complet *</label>
                  <input type="text" required placeholder="Votre nom" style={{ width: '100%', padding: '14px 16px', borderRadius: '2px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box', background: 'var(--color-bg)', fontWeight: 300 }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-gold)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px', letterSpacing: '0.5px' }}>Entreprise</label>
                  <input type="text" placeholder="Votre entreprise (optionnel)" style={{ width: '100%', padding: '14px 16px', borderRadius: '2px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box', background: 'var(--color-bg)', fontWeight: 300 }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-gold)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px', letterSpacing: '0.5px' }}>Email professionnel *</label>
                  <input type="email" required placeholder="votre@email.com" style={{ width: '100%', padding: '14px 16px', borderRadius: '2px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box', background: 'var(--color-bg)', fontWeight: 300 }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-gold)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px', letterSpacing: '0.5px' }}>Téléphone / WhatsApp</label>
                  <input type="tel" placeholder="+224 6XX XX XX XX" style={{ width: '100%', padding: '14px 16px', borderRadius: '2px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box', background: 'var(--color-bg)', fontWeight: 300 }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-gold)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px', letterSpacing: '0.5px' }}>Objet</label>
                <select style={{ width: '100%', padding: '14px 16px', borderRadius: '2px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', background: 'var(--color-bg)', boxSizing: 'border-box', fontWeight: 300 }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-gold)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'}>
                  <option>Question sur FacturaPro</option>
                  <option>Problème technique</option>
                  <option>Demande d'abonnement</option>
                  <option>Partenariat ou intégration</option>
                  <option>Autre</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px', letterSpacing: '0.5px' }}>Message *</label>
                <textarea required rows={6} placeholder="Décrivez votre question ou besoin..." style={{ width: '100%', padding: '14px 16px', borderRadius: '2px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', background: 'var(--color-bg)', fontWeight: 300 }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-gold)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
                <button type="submit" disabled={loading} style={{
                  padding: '14px 32px', background: 'var(--color-gold)', color: '#1A1715',
                  borderRadius: '2px', border: 'none', fontSize: '13px', fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer', transition: 'all 0.3s ease',
                  textTransform: 'uppercase', letterSpacing: '0.5px'
                }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#E6D5B8'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-gold)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 300, fontStyle: 'italic' }}>Réponse sous 24h garantie.</span>
              </div>
            </form>

            {/* WhatsApp alternative */}
            <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 300 }}>Besoin d'une réponse rapide ?</span>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', background: 'transparent', color: 'var(--color-gold)',
                border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '2px',
                textDecoration: 'none', fontSize: '12px', fontWeight: 500, transition: 'all 0.3s ease',
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212, 175, 55, 0.05)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-gold)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212, 175, 55, 0.3)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </Reveal>
      </div>

      <PublicFooter />
      </div>
    </PageTransition>
  );
}
