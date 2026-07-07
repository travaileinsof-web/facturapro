import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';

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
      <label style={{ display: 'block', fontSize: '13px', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>{label}</label>
      <input
        type={type} placeholder={ph} value={val} required
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a', outline: 'none' }}
        onFocus={e => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
        onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      
      {/* Brand logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '32px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a', letterSpacing: '-0.3px' }}>FacturaPro</span>
      </Link>

      <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', padding: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '6px', textAlign: 'center' }}>
          {tab === 'login' ? 'Bon retour' : 'Créez votre compte'}
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', marginBottom: '32px' }}>
          {tab === 'login' ? 'Entrez vos identifiants pour accéder à votre espace' : 'Démarrez avec FacturaPro en quelques secondes'}
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '13.5px', color: '#ef4444', fontWeight: 500, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Form Login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {field('Adresse email ou Identifiant', 'text', 'vous@entreprise.com', loginData.email, v => setLoginData(p => ({ ...p, email: v })))}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>Mot de passe</label>
                <button type="button" style={{ background: 'none', border: 'none', color: '#059669', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>Mot de passe oublié ?</button>
              </div>
              <input type="password" placeholder="••••••••" value={loginData.password} required onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a', outline: 'none' }}
                onFocus={e => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '12px', background: '#059669', color: '#fff', fontSize: '15px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: loading ? 'wait' : 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#047857' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#059669' }}
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
            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '12px', background: '#059669', color: '#fff', fontSize: '15px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: loading ? 'wait' : 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#047857' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#059669' }}
            >
              {loading ? 'Création en cours...' : 'Créer mon compte'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
          {tab === 'login' ? "Vous n'avez pas de compte ? " : "Vous avez déjà un compte ? "}
          <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }} style={{ background: 'none', border: 'none', color: '#059669', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            {tab === 'login' ? "S'inscrire" : 'Se connecter'}
          </button>
        </div>
      </div>
    </div>
  );
}
