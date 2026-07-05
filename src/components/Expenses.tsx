import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate, useAppStore, apiFetch } from '../lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useForm } from 'react-hook-form';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

export function Expenses() {
  const refreshExpenses = useAppStore(state => state.refreshExpenses);
  const triggerRefresh = useAppStore(state => state.triggerRefresh);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: expenses, isLoading, refetch } = useQuery({
    queryKey: ['expenses', refreshExpenses],
    queryFn: async () => {
      const res = await apiFetch(`/api/expenses`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      category: 'Général',
      amount: 0,
      expenseDate: new Date().toLocaleDateString('en-CA'),
      description: '',
      receiptUrl: ''
    }
  });

  const openNew = () => {
    reset({ category: 'Général', amount: 0, expenseDate: new Date().toLocaleDateString('en-CA'), description: '', receiptUrl: '' });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    if (!data.amount || data.amount <= 0) {
      toast.error("Le montant doit être supérieur à zéro.");
      return;
    }

    const payload = {
      ...data,
      amount: Number(data.amount),
      expenseDate: new Date(data.expenseDate).toISOString()
    };

    const res = await apiFetch('/api/expenses', {
       method: 'POST',
       body: JSON.stringify(payload)
    });

    if (res.ok) {
      toast.success('Dépense enregistrée');
      setIsModalOpen(false);
      triggerRefresh('expenses');
      triggerRefresh('stats');
    } else {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous supprimer cette dépense ?')) return;
    const res = await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Dépense supprimée');
      triggerRefresh('expenses');
      triggerRefresh('stats');
    }
  };

  return (
    <div className="space-y-6">
      <div className="fp-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>Dépenses & Charges</h1>
        <button onClick={openNew} className="fp-btn-primary">
          + Enregistrer une Dépense
        </button>
      </div>

      <div className="fp-card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
        <table className="fp-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Catégorie</th>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Montant</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--foreground-muted)' }}>Chargement...</td></tr>
            ) : expenses?.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '48px' }}>
                  <div style={{ fontSize: '24px', opacity: 0.5, marginBottom: '8px' }}>💸</div>
                  <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>Aucune dépense enregistrée</div>
                </td>
              </tr>
            ) : (
              expenses?.map((exp: any) => (
                <tr key={exp.id}>
                  <td style={{ fontWeight: 600 }}>{formatDate(exp.expenseDate)}</td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: 0, fontSize: '11px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
                      {exp.category}
                    </span>
                  </td>
                  <td style={{ color: 'var(--foreground-muted)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.description || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--destructive)' }}>-{formatCurrency(exp.amount)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="fp-btn-danger" onClick={() => handleDelete(exp.id)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]" style={{ borderRadius: 0, background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.15)', padding: 0 }}>
          <DialogHeader style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
            <DialogTitle style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>Enregistrer une Dépense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Catégorie</label>
              <select {...register('category')} style={{ width: '100%', padding: '10px 36px 10px 12px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)', cursor: 'pointer', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                <option value="Achats">Achats &amp; Matériel</option>
                <option value="Salaires">Salaires &amp; Primes</option>
                <option value="Loyer">Loyer &amp; Utilitaires</option>
                <option value="Abonnements">Abonnements Logiciels</option>
                <option value="Marketing">Marketing &amp; Pub</option>
                <option value="Général">Frais Généraux</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Montant</label>
              <input type="number" step="0.01" {...register('amount')} required style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Date de dépense</label>
              <input type="date" {...register('expenseDate')} required style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Description (facultative)</label>
              <textarea {...register('description')} placeholder="Ex: Achat d'une nouvelle imprimante..." style={{ width: '100%', minHeight: '80px', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)', resize: 'vertical' }} />
            </div>
            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button type="submit" className="fp-btn-primary">Économiser</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
