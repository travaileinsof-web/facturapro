import { useState } from 'react';
import { CheckCircle2, Loader2, X, TrendingUp } from 'lucide-react';
import { useAppStore, apiFetch } from '../lib/store';
import { PageHeader } from './ui/PageHeader';

export function Pricing() {
  const { user } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [phone, setPhone] = useState((user as any)?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const origin = window.location.origin;
      const res = await apiFetch('/api/v1/payment/init', {
        method: 'POST',
        body: JSON.stringify({ payerNumber: phone, origin })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de l'initialisation du paiement.");
      }
      
      const data = await res.json();
      
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("Impossible de générer le lien de paiement.");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
      setLoading(false);
    }
  };

  const plan = {
    name: 'Forfait Unique (Annuel)',
    price: '1 000 GNF',
    period: '/ an',
    description: 'La solution complète pour votre entreprise.',
    features: ['Factures illimitées', 'Clients illimités', 'Logo & signature', 'Export PDF', 'Support prioritaire 24/7', 'Assistant IA (Bientôt)'],
    action: 'Souscrire maintenant',
    color: '#059669',
    bg: '#f0fdf4',
    popular: true
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
      <PageHeader
        title="Abonnement"
        description="Choisissez le forfait qui convient à votre activité."
        icon={<TrendingUp size={20} />}
      />
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px' }}>
          Passez à la vitesse supérieure
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '500px', margin: '0 auto' }}>
          Choisissez le plan qui correspond le mieux à votre activité et professionnalisez votre facturation aujourd'hui.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
        <div style={{ 
          width: '100%',
          maxWidth: '450px',
          background: '#fff', 
          borderRadius: 0, 
          border: '2px solid #059669',
          padding: '32px',
          position: 'relative',
          boxShadow: '0 12px 24px rgba(5, 150, 105, 0.1)'
        }}>
          <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#059669', color: '#fff', padding: '4px 12px', borderRadius: 0, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Le plus avantageux
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{plan.name}</h3>
          <p style={{ fontSize: '14px', color: '#64748b', minHeight: '40px', marginBottom: '20px' }}>{plan.description}</p>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
            <span style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>{plan.price}</span>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>{plan.period}</span>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            style={{ width: '100%', padding: '14px', background: plan.color, color: '#fff', border: 'none', borderRadius: 0, fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginBottom: '32px', transition: 'opacity 0.2s', boxShadow: `0 4px 12px ${plan.color}30` }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {plan.action}
          </button>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {plan.features.map((feat, j) => (
              <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#334155', fontWeight: 500 }}>
                <CheckCircle2 style={{ width: '18px', height: '18px', color: '#059669', flexShrink: 0 }} />
                {feat}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button onClick={() => !loading && setShowModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Paiement de l'abonnement</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Vous serez redirigé vers la plateforme sécurisée Djomy. Veuillez confirmer votre numéro de téléphone.</p>
            
            <form onSubmit={handleSubscribe}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Numéro de téléphone (Format: 00224...)</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  placeholder="00224623707722"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}
                  required
                  disabled={loading}
                />
              </div>

              {error && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px', background: '#fef2f2', padding: '10px', borderRadius: '6px' }}>{error}</div>}

              <button 
                type="submit" 
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
              >
                {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                Procéder au paiement (1 000 GNF)
              </button>
            </form>
            
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Paiement sécurisé par Djomy</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
