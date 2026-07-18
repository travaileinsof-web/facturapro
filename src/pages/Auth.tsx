import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAppStore } from '../lib/store';
import { PageTransition } from '../components/ui/PageTransition';
import { BlobShape, GridPattern, GeometricShapes, WavesShape } from '../components/ui/AbstractShapes';
import { MotionReveal as Reveal } from '../components/ui/MotionReveal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, LoginData, RegisterData } from '../lib/schemas';

export function Auth({ mode }: { mode: 'login' | 'register' }) {
  const [tab, setTab] = useState<'login' | 'register'>(mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAppStore();

  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema)
  });

  const { register: registerReg, handleSubmit: handleSubmitReg, formState: { errors: regErrors } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema)
  });

  const safeFetch = async (url: string, options: RequestInit) => {
    const res = await fetch(url, options);
    let data: any = {};
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch {
      if (!res.ok) throw new Error(`Erreur serveur (${res.status}). Veuillez réessayer.`);
    }
    if (!res.ok) {
      if (data?.code === 'DB_UNAVAILABLE') {
        throw new Error('⏳ La base de données se réveille. Veuillez réessayer dans 5 secondes.');
      }
      throw new Error(data?.error || `Erreur ${res.status}`);
    }
    return data;
  };

  const handleLogin = async (data: LoginData) => {
    setError(''); setLoading(true);
    try {
      const resData = await safeFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      login(resData);
      navigate('/app');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setError(''); setLoading(true);
    try {
      const resData = await safeFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      login(resData);
      navigate('/app');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, type: string, ph: string, registration: any, err?: string, extra?: any, showToggle?: boolean) => (
    <div {...extra}>
      <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text)', fontWeight: 500, marginBottom: '6px', letterSpacing: '0.5px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type === 'password' && showToggle ? 'text' : type} placeholder={ph} {...registration}
          style={{ width: '100%', padding: '12px 16px', paddingRight: type === 'password' ? '40px' : '16px', borderRadius: '2px', border: err ? '1px solid #ef4444' : '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', background: 'var(--color-surface)', fontWeight: 300, transition: 'all 0.3s ease' }}
          onFocus={e => { e.target.style.borderColor = err ? '#ef4444' : 'var(--color-gold)'; e.target.style.boxShadow = err ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(212, 175, 55, 0.1)'; }}
          onBlur={e => { e.target.style.borderColor = err ? '#ef4444' : 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {showToggle ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {err && <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#ef4444' }}>{err}</span>}
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
          <img src="/logo-dark.png" alt="FacturaPro Logo" style={{ width: '160px', height: 'auto', objectFit: 'contain' }} />
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
          <form onSubmit={handleSubmitLogin(handleLogin)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {field('Adresse email ou Identifiant', 'text', 'vous@entreprise.com', registerLogin('email'), loginErrors.email?.message)}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 500, letterSpacing: '0.5px' }}>Mot de passe</label>
                <button type="button" onClick={() => navigate('/forgot-password')} style={{ background: 'none', border: 'none', color: 'var(--color-gold)', fontSize: '12px', fontWeight: 300, cursor: 'pointer', outline: 'none' }}>Mot de passe oublié ?</button>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...registerLogin('password')}
                  style={{ width: '100%', padding: '12px 16px', paddingRight: '40px', borderRadius: '2px', border: loginErrors.password ? '1px solid #ef4444' : '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', background: 'var(--color-surface)', fontWeight: 300, transition: 'all 0.3s ease' }}
                  onFocus={e => { e.target.style.borderColor = loginErrors.password ? '#ef4444' : 'var(--color-gold)'; e.target.style.boxShadow = loginErrors.password ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(212, 175, 55, 0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = loginErrors.password ? '#ef4444' : 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {loginErrors.password && <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#ef4444' }}>{loginErrors.password.message}</span>}
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
          <form onSubmit={handleSubmitReg(handleRegister)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {field('Prénom', 'text', 'Jean', registerReg('firstName'), regErrors.firstName?.message)}
              {field('Nom', 'text', 'Diallo', registerReg('lastName'), regErrors.lastName?.message)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {field('Email', 'email', 'vous@entreprise.com', registerReg('email'), regErrors.email?.message)}
              {field('Téléphone (WhatsApp)', 'tel', '+224 62X XX XX XX', registerReg('phone'), regErrors.phone?.message)}
            </div>
            {field('Nom de l\'entreprise', 'text', 'Sarl Mon Entreprise', registerReg('company'), regErrors.company?.message)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {field('Mot de passe', 'password', '••••••••', registerReg('password'), regErrors.password?.message, undefined, showPassword)}
              {field('Confirmez', 'password', '••••••••', registerReg('confirm'), regErrors.confirm?.message, undefined, showPassword)}
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

