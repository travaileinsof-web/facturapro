import React, { useState } from 'react';
import { Calculator, Loader2, Copy, Check, ArrowRight, X } from 'lucide-react';
import { useAppStore, formatCurrency } from '../lib/store';

export function CurrencyConverter() {
  const storeCurrency = useAppStore(s => s.user?.currency) || 'XOF';
  
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | ''>('');
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [rateUsed, setRateUsed] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const currencies = ['EUR', 'USD', 'XOF', 'CAD', 'GBP', 'CHF'];

  const convert = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!amount) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const data = await res.json();
      const rate = data.rates[storeCurrency];
      if (rate) {
        setResult(Number(amount) * rate);
        setRateUsed(rate);
        setCopied(false);
      }
    } catch (e) {
      console.error(e);
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
        style={{ padding: '7px 14px', background: 'var(--surface-2)', border: '1px dashed var(--border-hover)', color: 'var(--foreground-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', letterSpacing: '0.2px' }}
      >
        <Calculator size={12} /> Convertisseur de devises
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '12px', width: 'fit-content' }}>
      <form onSubmit={convert} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input 
          type="number" 
          placeholder="Montant..." 
          value={amount} 
          onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
          style={{ width: '100px', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '12px', outline: 'none' }}
        />
        <select 
          value={fromCurrency} 
          onChange={(e) => setFromCurrency(e.target.value)}
          style={{ padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
        >
          {currencies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        <ArrowRight size={14} style={{ color: 'var(--foreground-muted)' }} />
        
        <div style={{ padding: '6px 10px', background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--foreground-subtle)', fontSize: '12px', width: '60px', textAlign: 'center' }}>
          {storeCurrency}
        </div>

        <button 
          type="submit" 
          disabled={loading || !amount}
          style={{ padding: '6px 14px', background: 'var(--foreground)', color: 'var(--surface)', border: 'none', fontSize: '12px', fontWeight: 600, cursor: (loading || !amount) ? 'not-allowed' : 'pointer', opacity: (loading || !amount) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {loading ? <Loader2 size={12} className="fp-spin" /> : <Calculator size={12} />} Calculer
        </button>
      </form>

      {result !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '12px', borderLeft: '1px solid var(--border)', minHeight: '30px' }}>
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
            style={{ padding: '6px', background: 'transparent', border: '1px solid var(--border)', color: copied ? 'var(--green)' : 'var(--foreground-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}

      <button 
        type="button" 
        onClick={() => setOpen(false)}
        style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--foreground-muted)', cursor: 'pointer', marginLeft: '8px' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
