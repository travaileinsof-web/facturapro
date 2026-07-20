import React, { useState } from 'react';
import { Calculator, Loader2, Copy, Check, ArrowRight, X } from 'lucide-react';
import { useAppStore, formatCurrency } from '../lib/store';
import { toast } from 'sonner';

export function CurrencyConverter() {
  const storeCurrency = useAppStore(s => s.user?.currency) || 'GNF';
  
  const [open, setOpen] = useState(false);
  const [amountInput, setAmountInput] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [rateUsed, setRateUsed] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const currencies = ['EUR', 'USD', 'XOF', 'XAF', 'GNF', 'CAD', 'GBP', 'CHF', 'MAD', 'ZAR'];

  const convert = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const amountVal = Number(amountInput.replace(',', '.'));
    if (!amountInput || isNaN(amountVal)) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      if (!res.ok) throw new Error("Erreur réseau");
      const data = await res.json();
      const rate = data.rates[storeCurrency];
      if (rate) {
        setResult(amountVal * rate);
        setRateUsed(rate);
        setCopied(false);
      } else {
        toast.error(`Impossible de trouver le taux pour ${storeCurrency}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur réseau. Impossible de contacter le service de conversion.");
    }
    setLoading(false);
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(Math.round(result).toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!open) {
    return (
      <button 
        type="button" 
        onClick={() => setOpen(true)} 
        style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
      >
        <Calculator size={14} className="text-[var(--primary)]" /> Convertisseur de devises
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 'var(--space-3)', width: 'fit-content' }}>
      <form onSubmit={convert} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <input 
          type="text" 
          placeholder="Montant..." 
          value={amountInput} 
          onChange={(e) => setAmountInput(e.target.value)}
          style={{ width: '100px', padding: 'var(--space-1) var(--space-2)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '12px', outline: 'none' }}
        />
        <select 
          value={fromCurrency} 
          onChange={(e) => setFromCurrency(e.target.value)}
          style={{ padding: 'var(--space-1) var(--space-2)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '12px', outline: 'none', cursor: 'pointer', borderRadius: '6px' }}
        >
          {currencies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        <ArrowRight size={14} style={{ color: 'var(--foreground-muted)' }} />
        
        <div style={{ padding: 'var(--space-1) var(--space-2)', background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--foreground-subtle)', fontSize: '12px', width: '60px', textAlign: 'center' }}>
          {storeCurrency}
        </div>

        <button 
          type="submit" 
          disabled={loading || !amountInput}
          style={{ padding: 'var(--space-1) var(--space-3)', background: 'var(--foreground)', color: 'var(--surface)', border: 'none', fontSize: '12px', fontWeight: 600, cursor: (loading || !amountInput) ? 'not-allowed' : 'pointer', opacity: (loading || !amountInput) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
        >
          {loading ? <Loader2 size={12} className="fp-spin" /> : <Calculator size={12} />} Calculer
        </button>
      </form>

      {result !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', paddingLeft: 'var(--space-3)', borderLeft: '1px solid var(--border)', minHeight: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
              {formatCurrency(result, storeCurrency)}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--foreground-muted)' }}>
              Taux : {rateUsed}
            </span>
          </div>
          <button 
            type="button" 
            onClick={copyResult}
            title="Copier le montant"
            style={{ padding: 'var(--space-1)', background: 'transparent', border: '1px solid var(--border)', color: copied ? 'var(--green)' : 'var(--foreground-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}

      <button 
        type="button" 
        onClick={() => setOpen(false)}
        style={{ padding: 'var(--space-1)', background: 'transparent', border: 'none', color: 'var(--foreground-muted)', cursor: 'pointer', marginLeft: 'var(--space-2)' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
