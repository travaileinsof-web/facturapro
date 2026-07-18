import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { Logo } from '../components/Logo';
import { toast } from 'sonner';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code' | 'reset'>('email');
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        toast.success('Un code de réinitialisation a été envoyé (vérifiez vos spams).');
        setStep('code');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la demande.');
      }
    } catch (err) {
      toast.error('Erreur de connexion serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      if (res.ok) {
        toast.success('Code valide.');
        setStep('reset');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Code invalide ou expiré.');
      }
    } catch (err) {
      toast.error('Erreur de connexion serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password })
      });
      if (res.ok) {
        toast.success('Mot de passe réinitialisé avec succès !');
        navigate('/login');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la réinitialisation.');
      }
    } catch (err) {
      toast.error('Erreur de connexion serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: '"Inter", sans-serif' }}>
        <div style={{ padding: '24px 32px' }} onClick={() => navigate('/')} className="cursor-pointer">
          <img src="/logo-dark.png" alt="FacturaPro Logo" style={{ width: '120px', height: 'auto', objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', paddingBottom: '80px' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 300, color: 'var(--color-gold)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                Mot de passe oublié
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 300 }}>
                {step === 'email' && "Entrez votre email pour recevoir un code de réinitialisation."}
                {step === 'code' && "Entrez le code reçu par email."}
                {step === 'reset' && "Choisissez votre nouveau mot de passe."}
              </p>
            </div>
            
            <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-3xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
              {step === 'email' && (
                <form onSubmit={handleRequestCode}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text)', fontWeight: 500, marginBottom: '6px', letterSpacing: '0.5px' }}>Adresse Email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@entreprise.com"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '2px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', background: 'var(--color-surface)', fontWeight: 300, transition: 'all 0.3s ease' }}
                    />
                  </div>
                  <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: 'var(--color-gold)', color: '#1A1715', fontSize: '13px', fontWeight: 600, borderRadius: '2px', border: 'none', cursor: loading ? 'wait' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {loading ? 'Envoi...' : 'Envoyer le code'}
                  </button>
                </form>
              )}

              {step === 'code' && (
                <form onSubmit={handleVerifyCode}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text)', fontWeight: 500, marginBottom: '6px', letterSpacing: '0.5px' }}>Code de vérification (6 chiffres)</label>
                    <input type="text" required value={code} onChange={e => setCode(e.target.value)} placeholder="123456" maxLength={6}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '2px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', background: 'var(--color-surface)', fontWeight: 300, transition: 'all 0.3s ease', textAlign: 'center', letterSpacing: '4px' }}
                    />
                  </div>
                  <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: 'var(--color-gold)', color: '#1A1715', fontSize: '13px', fontWeight: 600, borderRadius: '2px', border: 'none', cursor: loading ? 'wait' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {loading ? 'Vérification...' : 'Vérifier'}
                  </button>
                </form>
              )}

              {step === 'reset' && (
                <form onSubmit={handleResetPassword}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text)', fontWeight: 500, marginBottom: '6px', letterSpacing: '0.5px' }}>Nouveau mot de passe</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                        style={{ width: '100%', padding: '12px 16px', paddingRight: '40px', borderRadius: '2px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', background: 'var(--color-surface)', fontWeight: 300, transition: 'all 0.3s ease' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text)', fontWeight: 500, marginBottom: '6px', letterSpacing: '0.5px' }}>Confirmez le mot de passe</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showConfirm ? 'text' : 'password'} required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
                        style={{ width: '100%', padding: '12px 16px', paddingRight: '40px', borderRadius: '2px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text)', outline: 'none', background: 'var(--color-surface)', fontWeight: 300, transition: 'all 0.3s ease' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: 'var(--color-gold)', color: '#1A1715', fontSize: '13px', fontWeight: 600, borderRadius: '2px', border: 'none', cursor: loading ? 'wait' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {loading ? 'Enregistrement...' : 'Réinitialiser'}
                  </button>
                </form>
              )}

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button type="button" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: 300, cursor: 'pointer', outline: 'none' }}>
                  Retour à la connexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
