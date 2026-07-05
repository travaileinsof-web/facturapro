import { Link } from 'react-router-dom';
import { PublicNavbar, PublicFooter } from './Layout';

export function About() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Header */}
      <div style={{ paddingTop: '120px', paddingBottom: '80px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '5px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '20px' }}>À Propos de Nous</div>
          <h1 style={{ fontSize: 'clamp(32px,5vw,54px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-2px', marginBottom: '18px' }}>Digitaliser les entreprises africaines.</h1>
          <p style={{ fontSize: '17px', color: '#64748b', lineHeight: 1.75 }}>
            Créé par EINSOFT DIGIT à Conakry, FacturaPro a pour mission de fournir des outils de classe mondiale, adaptés aux réalités économiques et aux besoins des entrepreneurs locaux.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', letterSpacing: '-0.5px' }}>Notre Vision</h2>
        <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.8, marginBottom: '48px' }}>
          La gestion d'entreprise ne devrait pas être un frein à la croissance. Trop souvent, les entreprises locales doivent choisir entre des solutions internationales coûteuses et inadaptées, ou des outils rudimentaires et non professionnels. FacturaPro comble ce vide en offrant un ERP alimenté par l'intelligence artificielle, accessible et ultra-professionnel.
        </p>

        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', letterSpacing: '-0.5px' }}>L'équipe EINSOFT DIGIT</h2>
        <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.8, marginBottom: '24px' }}>
          Derrière FacturaPro se trouve l'équipe de EINSOFT DIGIT, une agence technologique basée en République de Guinée. Nous bâtissons des logiciels sécurisés, performants et intuitifs pour simplifier le quotidien de nos clients.
        </p>

        <div style={{ padding: '32px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '80px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Nos Principes :</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['L\'excellence du design et de l\'interface utilisateur', 'La confidentialité stricte des données de nos clients', 'Un support hautement réactif', 'L\'innovation continue via l\'Intelligence Artificielle'].map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '15px', color: '#475569' }}>
                <span style={{ color: '#059669', fontSize: '18px', lineHeight: 1 }}>•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#0f172a', padding: '80px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, color: '#fff', letterSpacing: '-1px', marginBottom: '16px' }}>Rejoignez l'aventure</h2>
        <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '32px' }}>Donnez à votre entreprise les outils qu'elle mérite.</p>
        <Link to="/register" style={{ display: 'inline-flex', padding: '14px 32px', background: '#059669', color: '#fff', borderRadius: '9px', textDecoration: 'none', fontSize: '15px', fontWeight: 600, transition: 'background 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#047857' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#059669' }}
        >Commencer avec FacturaPro</Link>
      </div>

      <PublicFooter />
    </div>
  );
}
