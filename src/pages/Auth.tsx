import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { PageTransition } from '../components/ui/PageTransition';
import { BlobShape, GridPattern, GeometricShapes, WavesShape } from '../components/ui/AbstractShapes';
import { MotionReveal as Reveal } from '../components/ui/MotionReveal';

export function Auth({ mode }: { mode: 'login' | 'register' }) {
  const [tab, setTab] = useState<'login' | 'register'>(mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAppStore();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '', password: '', confirm: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginData.email, password: loginData.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de connexion');
      login(data);
      navigate('/app');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (regData.password !== regData.confirm) return setError('Les mots de passe ne correspondent pas.');
    if (regData.password.length < 6) return setError('Minimum 6 caractères requis.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regData.email, password: regData.password,
          phone: regData.phone,
          company: regData.company, firstName: regData.firstName, lastName: regData.lastName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création du compte');
      login(data);
      navigate('/app');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, type: string, ph: string, val: string, onChange: (v: string) => void, extra?: any) => (
    <div {...extra}>
      <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text)', fontWeight: 500, marginBottom: '6px', letterSpacing: '0.5px' }}>{label}</label>
      <input
        type={type} placeholder={ph} value={val} required
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '12px 16px', borderRadius: '2px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', background: 'var(--color-surface)', fontWeight: 300, transition: 'all 0.3s ease' }}
        onFocus={e => { e.target.style.borderColor = 'var(--color-gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );

  return (
    <PageTransition>
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <GridPattern opacity={0.3} />
      <BlobShape style={{ top: '-10%', right: '-10%', width: '800px', height: '800px' }} />
      <WavesShape style={{ bottom: '-10%', left: '0', width: '100%', height: '300px' }} opacity={0.1} />
      <GeometricShapes opacity={0.4} />
      
      {/* Brand logo */}
      <Reveal delay={0}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '2px', background: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#1A1715', fontFamily: '"Playfair Display", serif' }}>F</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: '20px', color: 'var(--color-text)', letterSpacing: '0.5px' }}>FacturaPro</span>
        </Link>
      </Reveal>

      <Reveal delay={0.1} style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'var(--color-surface)', borderRadius: '2px', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: '40px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 400, color: 'var(--color-text)', letterSpacing: '-0.5px', marginBottom: '8px', textAlign: 'center', fontFamily: '"Playfair Display", serif' }}>
            {tab === 'login' ? 'Bon retour' : 'Créez votre compte'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '32px', fontWeight: 300 }}>
            {tab === 'login' ? 'Entrez vos identifiants pour accéder à votre espace' : 'Démarrez avec FacturaPro en quelques secondes'}
          </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '2px', padding: '12px', marginBottom: '24px', fontSize: '13px', color: '#ef4444', fontWeight: 300, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Form Login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {field('Adresse email ou Identifiant', 'text', 'vous@entreprise.com', loginData.email, v => setLoginData(p => ({ ...p, email: v })))}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 500, letterSpacing: '0.5px' }}>Mot de passe</label>
                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--color-gold)', fontSize: '12px', fontWeight: 300, cursor: 'pointer', outline: 'none' }}>Mot de passe oublié ?</button>
              </div>
              <input type="password" placeholder="••••••••" value={loginData.password} required onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '2px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', background: 'var(--color-surface)', fontWeight: 300, transition: 'all 0.3s ease' }}
                onFocus={e => { e.target.style.borderColor = 'var(--color-gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '14px', background: 'var(--color-gold)', color: '#1A1715', fontSize: '13px', fontWeight: 600, borderRadius: '2px', border: 'none', cursor: loading ? 'wait' : 'pointer', transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E6D5B8'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-gold)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
        )}

        {/* Form Register */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {field('Prénom', 'text', 'Jean', regData.firstName, v => setRegData(p => ({ ...p, firstName: v })))}
              {field('Nom', 'text', 'Diallo', regData.lastName, v => setRegData(p => ({ ...p, lastName: v })))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {field('Email', 'email', 'vous@entreprise.com', regData.email, v => setRegData(p => ({ ...p, email: v })))}
              {field('Téléphone (WhatsApp)', 'tel', '+224 62X XX XX XX', regData.phone, v => setRegData(p => ({ ...p, phone: v })))}
            </div>
            {field('Nom de l\'entreprise', 'text', 'Sarl Mon Entreprise', regData.company, v => setRegData(p => ({ ...p, company: v })))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {field('Mot de passe', 'password', '••••••••', regData.password, v => setRegData(p => ({ ...p, password: v })))}
              {field('Confirmez', 'password', '••••••••', regData.confirm, v => setRegData(p => ({ ...p, confirm: v })))}
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '14px', background: 'var(--color-gold)', color: '#1A1715', fontSize: '13px', fontWeight: 600, borderRadius: '2px', border: 'none', cursor: loading ? 'wait' : 'pointer', transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E6D5B8'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-gold)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
            >
              {loading ? 'Création en cours...' : 'Créer mon compte'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 300 }}>
          {tab === 'login' ? "Vous n'avez pas de compte ? " : "Vous avez déjà un compte ? "}
          <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-gold)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', outline: 'none', letterSpacing: '0.5px' }}>
            {tab === 'login' ? "S'inscrire" : 'Se connecter'}
          </button>
        </div>
        </div>
      </Reveal>
    </div>
    </PageTransition>
  );
}
