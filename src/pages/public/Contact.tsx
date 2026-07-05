import { useState } from 'react';
import { PublicNavbar, PublicFooter } from './Layout';
import { toast } from 'sonner';

export function Contact() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Votre message a été envoyé. Nous vous contacterons bientôt.');
    setLoading(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Header */}
      <div style={{ paddingTop: '120px', paddingBottom: '60px', textAlign: 'center', paddingLeft: '32px', paddingRight: '32px' }}>
        <h1 style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', marginBottom: '16px' }}>Contactez-nous</h1>
        <p style={{ fontSize: '17px', color: '#64748b', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
          Une question sur nos forfaits, une demande d'assistance ou de partenariat technique ? Notre équipe est prête à vous répondre.
        </p>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 32px 100px', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '48px', alignItems: 'start' }}>
        {/* Contact info */}
        <div>
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>EINSOFT DIGIT</h3>
            <p style={{ fontSize: '14.5px', color: '#475569', marginBottom: '32px', lineHeight: 1.6 }}>L'agence de développement derrière FacturaPro.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Téléphone</div>
                <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 500 }}>+224 624 77 06 18</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Email Support</div>
                <a href="mailto:contacts@einsofdigit.com" style={{ fontSize: '15px', color: '#059669', fontWeight: 500, textDecoration: 'none' }}>contacts@einsofdigit.com</a>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Adresse</div>
                <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 500 }}>Conakry, République de Guinée</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Plateforme web</div>
                <a href="https://einsofdigit.com" target="_blank" rel="noreferrer" style={{ fontSize: '15px', color: '#3b82f6', fontWeight: 500, textDecoration: 'none' }}>einsofdigit.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '40px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Nom complet *</label>
                <input type="text" required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14.5px', color: '#0f172a', outline: 'none' }} 
                  onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Entreprise</label>
                <input type="text" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14.5px', color: '#0f172a', outline: 'none' }} 
                  onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Email professionnel *</label>
                <input type="email" required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14.5px', color: '#0f172a', outline: 'none' }} 
                  onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Téléphone</label>
                <input type="tel" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14.5px', color: '#0f172a', outline: 'none' }} 
                  onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Message *</label>
              <textarea required rows={5} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14.5px', color: '#0f172a', outline: 'none', resize: 'vertical' }} 
                  onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
            </div>

            <button type="submit" disabled={loading} style={{ padding: '14px 28px', background: '#059669', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '15px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', transition: 'background 0.15s', alignSelf: 'flex-start', marginTop: '10px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#047857' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#059669' }}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le message'}
            </button>
          </form>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
