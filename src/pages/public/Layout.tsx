import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/fonctionnalites', label: 'Fonctionnalités' },
  { to: '/tarifs', label: 'Tarifs' },
  { to: '/a-propos', label: 'À Propos' },
  { to: '/contact', label: 'Contact' },
];

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: scrolled ? '1px solid #e2e8f0' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a', letterSpacing: '-0.4px', lineHeight: 1 }}>FacturaPro</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1, marginTop: '2px' }}>by EINSOFT DIGIT</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="pub-nav-desktop" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {NAV_LINKS.map(link => {
            const active = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to} style={{
                padding: '7px 14px', borderRadius: '8px', textDecoration: 'none',
                fontSize: '14px', fontWeight: active ? 600 : 400,
                color: active ? '#059669' : '#475569',
                background: active ? '#f0fdf4' : 'transparent',
                transition: 'all 0.15s ease',
              }}
                onMouseEnter={e => { if (!active) { (e.target as HTMLElement).style.color = '#0f172a'; (e.target as HTMLElement).style.background = '#f8fafc'; } }}
                onMouseLeave={e => { if (!active) { (e.target as HTMLElement).style.color = '#475569'; (e.target as HTMLElement).style.background = 'transparent'; } }}
              >{link.label}</Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="pub-nav-desktop" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <Link to="/login" style={{ padding: '9px 18px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500, color: '#475569', border: '1px solid #e2e8f0', background: '#fff', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#059669'; (e.currentTarget as HTMLElement).style.color = '#059669'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.color = '#475569'; }}
          >Connexion</Link>
          <Link to="/register" style={{ padding: '9px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, color: '#fff', background: '#059669', boxShadow: '0 1px 4px rgba(5,150,105,0.3)', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#047857'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#059669'; }}
          >Essayer gratuitement</Link>
        </div>

        {/* Mobile hamburger */}
        <button className="pub-nav-mobile" onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#0f172a' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
          </svg>
        </button>
      </div>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="pub-nav-mobile" style={{ borderTop: '1px solid #e2e8f0', background: '#fff', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to} style={{ padding: '12px 16px', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: location.pathname === link.to ? 700 : 400, color: location.pathname === link.to ? '#059669' : '#334155', background: location.pathname === link.to ? '#f0fdf4' : 'transparent' }}>
              {link.label}
            </Link>
          ))}
          <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }} />
          <Link to="/login" style={{ padding: '12px 16px', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: 500, color: '#334155', background: '#f8fafc', textAlign: 'center' }}>Connexion</Link>
          <Link to="/register" style={{ padding: '12px 16px', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: 700, color: '#fff', background: '#059669', textAlign: 'center' }}>Essayer gratuitement</Link>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', paddingTop: '60px', paddingBottom: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px', marginBottom: '48px' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#f1f5f9', letterSpacing: '-0.4px' }}>FacturaPro</span>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#64748b', maxWidth: '280px' }}>
              La solution de facturation professionnelle conçue pour les entreprises africaines. Simple, puissant, intelligent.
            </p>
            <div style={{ marginTop: '20px', fontSize: '13px', color: '#475569' }}>
              <div>Conakry, République de Guinée</div>
              <div style={{ marginTop: '4px' }}>
                <a href="mailto:contacts@einsofdigit.com" style={{ color: '#059669', textDecoration: 'none' }}>contacts@einsofdigit.com</a>
              </div>
              <div style={{ marginTop: '4px' }}>+224 624 77 06 18</div>
            </div>
          </div>

          {/* Produit */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Produit</div>
            {[['Fonctionnalités', '/fonctionnalites'], ['Tarifs', '/tarifs'], ['Connexion', '/login'], ['Inscription', '/register']].map(([l, to]) => (
              <div key={l} style={{ marginBottom: '10px' }}>
                <Link to={to} style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#059669'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = '#64748b'}
                >{l}</Link>
              </div>
            ))}
          </div>

          {/* Entreprise */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Entreprise</div>
            {[['À Propos', '/a-propos'], ['Contact', '/contact'], ['EINSOFT DIGIT', '#']].map(([l, to]) => (
              <div key={l} style={{ marginBottom: '10px' }}>
                {to === '#' ? (
                  <a href="https://einsofdigit.com" target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#059669'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = '#64748b'}
                  >{l}</a>
                ) : (
                  <Link to={to} style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#059669'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = '#64748b'}
                  >{l}</Link>
                )}
              </div>
            ))}
          </div>

          {/* Assistance */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Assistance</div>
            <div style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7 }}>
              <div>Disponible 24h/24</div>
              <div>7j/7</div>
              <div style={{ marginTop: '10px' }}>
                <a href="mailto:contacts@einsofdigit.com" style={{ color: '#059669', textDecoration: 'none' }}>Nous écrire</a>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#334155' }}>
            © {new Date().getFullYear()} FacturaPro — Développé par{' '}
            <a href="https://einsofdigit.com" target="_blank" rel="noreferrer" style={{ color: '#059669', textDecoration: 'none' }}>EINSOFT DIGIT</a>
          </span>
          <span style={{ fontSize: '13px', color: '#334155' }}>Conakry, République de Guinée</span>
        </div>
      </div>
    </footer>
  );
}
