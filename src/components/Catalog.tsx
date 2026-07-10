import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, useAppStore, apiFetch } from '../lib/store';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogBody } from './ui/dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PlusIcon, PackageIcon } from 'lucide-react';
import { PageHeader } from './ui/PageHeader';
import { Field } from './ui/Field';

export function Catalog() {
  const triggerRefresh = useAppStore(state => state.triggerRefresh);
  const refreshCatalog = useAppStore(state => state.refreshCatalog);
  const currency = useAppStore(state => state.user?.currency) || 'FCFA';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['catalog', refreshCatalog],
    queryFn: async () => {
      const res = await apiFetch('/api/catalog');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { type: 'service', category: 'Général', name: '', description: '', unitPrice: 0 }
  });

  const openNew = () => {
    setEditingItem(null);
    reset({ type: 'service', category: 'Général', name: '', description: '', unitPrice: 0 });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    reset({ type: item.type, category: item.category || 'Général', name: item.name, description: item.description || '', unitPrice: item.unitPrice });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    const payload = { ...data, unitPrice: Number(data.unitPrice) };
    const url = editingItem ? `/api/catalog/${editingItem.id}` : '/api/catalog';
    const method = editingItem ? 'PUT' : 'POST';
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
    if (res.ok) {
      toast.success(editingItem ? 'Élément mis à jour' : 'Élément ajouté');
      setIsModalOpen(false);
      triggerRefresh('catalog');
    } else {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous supprimer cet élément ?')) return;
    const res = await apiFetch(`/api/catalog/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Élément supprimé'); triggerRefresh('catalog'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader
        title="Catalogue"
        description="Gérez vos services et produits pré-enregistrés pour une facturation plus rapide."
        icon={<PackageIcon size={20} />}
        actions={
          <button onClick={openNew} className="fp-btn-primary">
            <PlusIcon size={14} /> Ajouter au Catalogue
          </button>
        }
      />

      <div className="fp-card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
        <table className="fp-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Type</th>
              <th>Nom &amp; Description</th>
              <th>Catégorie</th>
              <th style={{ textAlign: 'right' }}>Prix Unitaire (HT)</th>
              <th style={{ textAlign: 'right', width: '160px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>Chargement...</td></tr>
            ) : !items || items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <PackageIcon size={32} style={{ margin: '0 auto var(--space-3)', color: 'var(--color-border-default)' }} />
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>Catalogue vide</div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Ajoutez vos services pour les retrouver rapidement à la facturation.</p>
                </td>
              </tr>
            ) : (
              items.map((item: any) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'capitalize', background: item.type === 'produit' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)', color: item.type === 'produit' ? '#B45309' : '#4f46e5', border: `1px solid ${item.type === 'produit' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'}` }}>
                      {item.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{item.category}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
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

      {/* ── Modal Catalogue : taille sm (480px) — design system strict ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent size="sm" showCloseButton>
          <DialogHeader
            icon={PackageIcon}
            title={editingItem ? 'Modifier l\'élément' : 'Ajouter au catalogue'}
            desc="Renseignez les informations de votre produit ou service."
          />
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <DialogBody>
              {/* Grille 2 colonnes : gap vertical space-4 / horizontal space-5 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4) var(--space-5)' }}>
                <Field label="Type">
                  <select {...register('type')}>
                    <option value="service">Service</option>
                    <option value="produit">Produit</option>
                  </select>
                </Field>
                <Field label="Catégorie">
                  <Input {...register('category')} placeholder="Ex: Développement..." />
                </Field>

                {/* Pleine largeur */}
                <Field label="Nom de la prestation / produit" required fullWidth>
                  <Input {...register('name')} required placeholder="Ex: Création Site Web Vitrine" />
                </Field>

                <Field label="Description détaillée" fullWidth>
                  <Textarea {...register('description')} placeholder="Description qui apparaîtra sur la facture..." />
                </Field>

                {/* Champ Prix : préfixe devise séparé visuellement, JAMAIS dans le placeholder */}
                <Field label="Prix Unitaire par défaut (HT)" required fullWidth>
                  <div style={{ position: 'relative', display: 'flex' }}>
                    <span style={{
                      display: 'flex', alignItems: 'center',
                      padding: '0 var(--space-3)',
                      fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-secondary)',
                      background: 'var(--color-border-subtle)',
                      border: '1px solid var(--color-border-default)',
                      borderRight: 'none',
                      borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
                      flexShrink: 0, height: '40px',
                      userSelect: 'none', whiteSpace: 'nowrap',
                    }}>
                      {currency}
                    </span>
                    <input
                      type="number" step="0.01" placeholder="0.00"
                      {...register('unitPrice')}
                      required
                      style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', flex: 1 }}
                    />
                  </div>
                </Field>
              </div>
            </DialogBody>

            <DialogFooter>
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
