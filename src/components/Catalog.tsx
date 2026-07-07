import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, useAppStore, apiFetch } from '../lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useForm } from 'react-hook-form';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { PlusIcon, PackageIcon } from 'lucide-react';
import { PageHeader } from './ui/PageHeader';
import { DialogFooter } from './ui/dialog';

export function Catalog() {
  const refreshCatalog = useAppStore(state => state.refreshCatalog);
  const triggerRefresh = useAppStore(state => state.triggerRefresh);
  const currency = useAppStore(state => state.user?.currency) || 'FCFA';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['catalog', refreshCatalog],
    queryFn: async () => {
      const res = await apiFetch(`/api/catalog`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      type: 'service',
      category: 'Général',
      name: '',
      description: '',
      unitPrice: 0
    }
  });

  const openNew = () => {
    setEditingItem(null);
    reset({ type: 'service', category: 'Général', name: '', description: '', unitPrice: 0 });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    reset({
      type: item.type,
      category: item.category || 'Général',
      name: item.name,
      description: item.description || '',
      unitPrice: item.unitPrice
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    const payload = {
      ...data,
      unitPrice: Number(data.unitPrice)
    };

    const url = editingItem ? `/api/catalog/${editingItem.id}` : '/api/catalog';
    const method = editingItem ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
       method,
       body: JSON.stringify(payload)
    });

    if (res.ok) {
      toast.success(editingItem ? 'Élément mis à jour' : 'Élément ajouté');
      setIsModalOpen(false);
      triggerRefresh('catalog');
    } else {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous supprimer cet élément du catalogue ?')) return;
    const res = await apiFetch(`/api/catalog/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Élément supprimé');
      triggerRefresh('catalog');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Catalogue" 
        description="Gérez vos services et produits pré-enregistrés pour une facturation plus rapide."
        actions={
          <button onClick={openNew} className="fp-btn-primary">
            <PlusIcon size={14} className="mr-2" /> Ajouter au Catalogue
          </button>
        }
      />

      <div className="fp-card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
        <table className="fp-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Type</th>
              <th>Nom & Description</th>
              <th>Catégorie</th>
              <th style={{ textAlign: 'right' }}>Prix Unitaire (HT)</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--foreground-muted)' }}>Chargement...</td></tr>
            ) : items?.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '48px' }}>
                  <PackageIcon size={32} style={{ margin: '0 auto 12px', color: 'var(--border-hover)' }} />
                  <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>Votre catalogue est vide</div>
                  <p style={{ color: 'var(--foreground-muted)', fontSize: '13px', marginTop: '4px' }}>Ajoutez vos services pour générer des devis plus rapidement.</p>
                </td>
              </tr>
            ) : (
              items?.map((item: any) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize', background: item.type === 'produit' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)', color: item.type === 'produit' ? 'var(--amber)' : '#4f46e5', border: `1px solid ${item.type === 'produit' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'}` }}>
                      {item.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--foreground-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--foreground-subtle)' }}>{item.category}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="fp-btn-ghost" onClick={() => openEdit(item)}>Modifier</button>
                      <button className="fp-btn-danger" onClick={() => handleDelete(item.id)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl">
          <DialogHeader className="px-8 py-6 bg-[var(--surface-2)] border-b border-[var(--border)]">
            <DialogTitle className="text-xl font-display font-semibold text-[var(--foreground)] tracking-tight">
              {editingItem ? 'Modifier l\'élément' : 'Ajouter au catalogue'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <div className="px-8 py-8 grid gap-y-6 bg-[var(--background)]">
              <div className="grid grid-cols-2 gap-x-6">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--foreground)] mb-2">Type</label>
                  <select {...register('type')} className="fp-input w-full bg-[var(--surface-1)] focus:bg-[var(--background)]">
                    <option value="service">Service</option>
                    <option value="produit">Produit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--foreground)] mb-2">Catégorie</label>
                  <input className="fp-input w-full bg-[var(--surface-1)] focus:bg-[var(--background)]" {...register('category')} placeholder="Ex: Développement, Plomberie..." required />
                </div>
              </div>
              
              <div>
                <label className="block text-[13px] font-semibold text-[var(--foreground)] mb-2">Nom de la prestation / produit <span className="text-[var(--primary)]">*</span></label>
                <input className="fp-input w-full bg-[var(--surface-1)] focus:bg-[var(--background)]" {...register('name')} required placeholder="Ex: Création Site Web Vitrine" />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--foreground)] mb-2">Description détaillée</label>
                <textarea {...register('description')} className="fp-input w-full min-h-[100px] resize-y bg-[var(--surface-1)] focus:bg-[var(--background)]" placeholder="Description qui apparaîtra sur la facture..." />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--foreground)] mb-2">Prix Unitaire par défaut (HT) <span className="text-[var(--primary)]">*</span></label>
                <div className="relative">
                  <input className="fp-input w-full bg-[var(--surface-1)] focus:bg-[var(--background)] pl-8" type="number" step="0.01" {...register('unitPrice')} required />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[var(--foreground-muted)]">{currency}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="px-8 py-4 bg-[var(--surface-2)] border-t border-[var(--border)] flex justify-end gap-3">
              <button type="button" className="fp-btn-outline" onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button type="submit" className="fp-btn-primary">
                {editingItem ? 'Mettre à jour' : 'Ajouter au catalogue'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
