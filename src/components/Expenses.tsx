import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate, useAppStore, apiFetch } from '../lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { useForm } from 'react-hook-form';
import { PageHeader } from './ui/PageHeader';
import { Plus, TrendingDown, FileText as FileTextIcon } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader 
        title="Dépenses & Charges" 
        description="Suivez et gérez les dépenses de votre entreprise."
        icon={<TrendingDown size={20} />}
        actions={
          <button onClick={openNew} className="fp-btn-primary">
            <Plus size={16} className="mr-2" /> Enregistrer une Dépense
          </button>
        }
      />

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
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--foreground-muted)' }}>Chargement...</td></tr>
            ) : expenses?.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <div style={{ fontSize: '24px', opacity: 0.5, marginBottom: 'var(--space-2)' }}>💸</div>
                  <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>Aucune dépense enregistrée</div>
                </td>
              </tr>
            ) : (
              expenses?.map((exp: any) => (
                <tr key={exp.id}>
                  <td style={{ fontWeight: 600 }}>{formatDate(exp.expenseDate)}</td>
                  <td>
                    <span style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 0, fontSize: '11px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
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
        <DialogContent className="sm:max-w-[425px]" style={{ padding: 0 }}>
          <DialogHeader 
            icon={FileTextIcon}
            title="Enregistrer une Dépense"
            desc="Remplissez les détails de la dépense."
          />
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto custom-scrollbar flex-1 grid bg-[var(--background)]" style={{ gap: 'var(--space-5)', padding: 'var(--space-6) var(--space-8)' }}>
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[var(--foreground-subtle)]" style={{ marginBottom: 'var(--space-1)' }}>Catégorie</label>
                <select {...register('category')} className="fp-input w-full">
                  <option value="Achats">Achats &amp; Matériel</option>
                  <option value="Salaires">Salaires &amp; Primes</option>
                  <option value="Loyer">Loyer &amp; Utilitaires</option>
                  <option value="Abonnements">Abonnements Logiciels</option>
                  <option value="Marketing">Marketing &amp; Pub</option>
                  <option value="Général">Frais Généraux</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[var(--foreground-subtle)]" style={{ marginBottom: 'var(--space-1)' }}>Montant</label>
                <Input type="number" step="0.01" {...register('amount')} required />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[var(--foreground-subtle)]" style={{ marginBottom: 'var(--space-1)' }}>Date de dépense</label>
                <Input type="date" {...register('expenseDate')} required />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[var(--foreground-subtle)]" style={{ marginBottom: 'var(--space-1)' }}>Description (facultative)</label>
                <Textarea {...register('description')} placeholder="Ex: Achat d'une nouvelle imprimante..." />
              </div>
            </div>
            <DialogFooter>
              <button type="button" className="fp-btn-outline" onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button type="submit" className="fp-btn-primary">Enregistrer</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
