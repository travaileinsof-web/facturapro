import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../../components/Logo';

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
    <>
      <div className="grain-overlay" />
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(20,18,16,0.95)' : 'rgba(20,18,16,0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid #2A2421' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <Logo width={100} />
          </Link>

          {/* Desktop Nav */}
          <nav className="pub-nav-desktop" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {NAV_LINKS.map(link => {
              const active = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to} style={{
                  padding: '7px 14px', borderRadius: '4px', textDecoration: 'none',
                  fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px',
                  color: active ? '#B38E36' : '#A39B94',
                  background: 'transparent',
                  transition: 'all 0.15s ease',
                }}
                  onMouseEnter={e => { if (!active) { (e.target as HTMLElement).style.color = '#EFEBE3'; } }}
                  onMouseLeave={e => { if (!active) { (e.target as HTMLElement).style.color = '#A39B94'; } }}
                >{link.label}</Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="pub-nav-desktop" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
            <Link to="/login" style={{ padding: '9px 18px', borderRadius: '2px', textDecoration: 'none', fontSize: '13px', fontWeight: 500, color: '#EFEBE3', border: '1px solid #2A2421', background: 'transparent', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#B38E36'; (e.currentTarget as HTMLElement).style.color = '#B38E36'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2A2421'; (e.currentTarget as HTMLElement).style.color = '#EFEBE3'; }}
            >Connexion</Link>
            <Link to="/register" style={{ padding: '9px 20px', borderRadius: '2px', textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: '#141210', background: '#B38E36', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#C9A84C'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#B38E36'; }}
            >Essayer gratuitement 24h</Link>
          </div>

          {/* Mobile hamburger */}
          <button className="pub-nav-mobile" onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: '1px solid #2A2421', borderRadius: '4px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#EFEBE3' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>

        {/* Mobile menu drawer */}
        {menuOpen && (
          <div className="pub-nav-mobile" style={{ borderTop: '1px solid #2A2421', background: '#141210', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: 'calc(100vh - 68px)', overflowY: 'auto' }}>
            {NAV_LINKS.map(link => (
              <Link key={link.to} to={link.to} style={{ padding: '12px 16px', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: location.pathname === link.to ? 600 : 400, color: location.pathname === link.to ? '#B38E36' : '#A39B94', background: location.pathname === link.to ? 'rgba(179,142,54,0.05)' : 'transparent' }}>
                {link.label}
              </Link>
            ))}
            <div style={{ height: '1px', background: '#2A2421', margin: '8px 0' }} />
            <Link to="/login" style={{ padding: '12px 16px', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 500, color: '#EFEBE3', background: '#1C1917', border: '1px solid #2A2421', textAlign: 'center' }}>Connexion</Link>
            <Link to="/register" style={{ padding: '12px 16px', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, color: '#141210', background: '#B38E36', textAlign: 'center', marginTop: '8px' }}>Essayer gratuitement 24h</Link>
          </div>
        )}
      </header>
    </>
  );
}

export function PublicFooter() {
  return (
    <footer style={{ background: '#141210', borderTop: '1px solid #2A2421', color: '#A39B94', paddingTop: '80px', paddingBottom: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '48px' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Logo width={120} />
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.8, color: '#78716C', maxWidth: '280px' }}>
              La solution de facturation professionnelle conçue pour les entreprises africaines. Simple, puissant, élégant.
            </p>
            <div style={{ marginTop: '24px', fontSize: '13px', color: '#A39B94' }}>
              <div>Conakry, République de Guinée</div>
              <div style={{ marginTop: '6px' }}>
                <a href="mailto:equipe@facturadigit.online" style={{ color: '#B38E36', textDecoration: 'none' }}>equipe@facturadigit.online</a>
              </div>
              <div style={{ marginTop: '6px' }}>+224 624 77 06 18</div>
            </div>
          </div>

          {/* Produit */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#EFEBE3', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>Produit</div>
            {[['Fonctionnalités', '/fonctionnalites'], ['Tarifs', '/tarifs'], ['Connexion', '/login'], ['Inscription', '/register']].map(([l, to]) => (
              <div key={l} style={{ marginBottom: '12px' }}>
                <Link to={to} style={{ fontSize: '13px', color: '#78716C', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#B38E36'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = '#78716C'}
                >{l}</Link>
              </div>
            ))}
          </div>

          {/* Entreprise */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#EFEBE3', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>Entreprise</div>
            {[['À Propos', '/a-propos'], ['Contact', '/contact'], ['EINSOFT DIGIT', '#']].map(([l, to]) => (
              <div key={l} style={{ marginBottom: '12px' }}>
                {to === '#' ? (
                  <a href="https://einsofdigit.com" target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#78716C', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#B38E36'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = '#78716C'}
                  >{l}</a>
                ) : (
                  <Link to={to} style={{ fontSize: '13px', color: '#78716C', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#B38E36'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = '#78716C'}
                  >{l}</Link>
                )}
              </div>
            ))}
          </div>

          {/* Assistance */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#EFEBE3', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>Assistance</div>
            <div style={{ fontSize: '13px', color: '#78716C', lineHeight: 1.8 }}>
              <div>Disponible 24h/24</div>
              <div>7j/7</div>
              <div style={{ marginTop: '12px' }}>
                <a href="mailto:equipe@facturadigit.online" style={{ color: '#B38E36', textDecoration: 'none', borderBottom: '1px solid #B38E36', paddingBottom: '2px' }}>Nous écrire</a>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #2A2421', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#78716C' }}>
            © {new Date().getFullYear()} FacturaPro — Par{' '}
            <a href="https://einsofdigit.com" target="_blank" rel="noreferrer" style={{ color: '#EFEBE3', textDecoration: 'none' }}>EINSOFT DIGIT</a>
          </span>
          <span style={{ fontSize: '12px', color: '#78716C', letterSpacing: '0.5px' }}>CONAKRY, RÉPUBLIQUE DE GUINÉE</span>
        </div>
      </div>
    </footer>
  );
}
