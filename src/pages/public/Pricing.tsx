import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar, PublicFooter } from './Layout';

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Header */}
      <div style={{ paddingTop: '120px', paddingBottom: '60px', textAlign: 'center', paddingLeft: '32px', paddingRight: '32px' }}>
        <h1 style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', marginBottom: '16px' }}>Un tarif simple,<br />tout compris.</h1>
        <p style={{ fontSize: '17px', color: '#64748b', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7, marginBottom: '40px' }}>
          La puissance d'un ERP avec la simplicité d'une application moderne. Aucun frais caché.
        </p>

      </div>

      {/* Pricing Card */}
      <div style={{ padding: '0 32px 100px' }}>
        <div style={{ maxWidth: '440px', margin: '0 auto', background: '#fff', borderRadius: '24px', border: '1px solid #059669', padding: '40px', boxShadow: '0 20px 40px rgba(5,150,105,0.08), 0 1px 3px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          {/* Badge */}
          <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', background: '#059669', color: '#fff', padding: '6px 16px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
            L'Offre Unique
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', marginTop: '10px' }}>FacturaPro Business</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Tout ce dont vous avez besoin pour gérer votre entreprise.</p>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '32px' }}>
            <span style={{ fontSize: '42px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px' }}>
              1 000
            </span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#64748b' }}>GNF / an</span>
          </div>

          <Link to="/register" style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '14px', background: '#059669', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: 700, boxShadow: '0 4px 14px rgba(5,150,105,0.25)', transition: 'all 0.15s', marginBottom: '32px' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#047857'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#059669'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
          >
            Commencer l'essai gratuit
          </Link>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {['Assistant IA (ARIA) (Bientôt)', 'Factures et reçus illimités', 'Gestion clients illimitée', 'Multi-devises', 'Exportation PDF HD', 'Base de données privatisée', 'Support technique prioritaire'].map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#334155', fontWeight: 500 }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#059669', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ margin: 'auto' }}><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                {feat}
              </div>
            ))}
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
