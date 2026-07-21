import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { formatCurrency, formatDate, useAppStore, apiFetch } from '../lib/store';
import { useDebounce } from '../hooks/useDebounce';
import { cn } from '../lib/utils';
import { Client } from '../types';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Skeleton } from './ui/skeleton';
import { Pagination } from './ui/pagination';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from './ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DownloadIcon, FileTextIcon, FilterIcon, MoreVerticalIcon, PlusIcon, PrinterIcon, ArrowUpRight, ArrowDownLeft, Building, Mail, Phone, MapPin, UserPlus, Edit, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from './ui/PageHeader';
import { Plus } from 'lucide-react';
import { ClientDocuments } from './ClientDocuments';
import { Textarea } from './ui/textarea';

import { Field } from './ui/Field';

const clientSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.union([z.literal(''), z.string().email('Adresse email invalide')]).optional(),
  phone: z.string().optional(),
  clientType: z.string().optional(),
  nif: z.string().optional(),
  rccm: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});
type ClientFormData = z.infer<typeof clientSchema>;

export function Clients() {
  const refreshClients = useAppStore(state => state.refreshClients);
  const triggerRefresh = useAppStore(state => state.triggerRefresh);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const openDetails = async (client: Client) => {
    setViewingClient(client);
    try {
      const res = await apiFetch(`/api/clients/${client.id}`);
      if (res.ok) {
        const fullClient = await res.json();
        setViewingClient(fullClient);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { data: clients = [], isLoading, error, refetch } = useQuery<Client[]>({
    queryKey: ['clients', refreshClients, debouncedSearch],
    queryFn: async () => {
      const res = await apiFetch(`/api/clients?q=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${errBody.substring(0, 100)}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    retry: false,
    placeholderData: keepPreviousData,
  });


  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', email: '', phone: '', address: '', city: '', country: '', notes: '', clientType: 'professionnel', nif: '', rccm: '' }
  });

  const openNew = () => {
    setEditingClient(null);
    reset({ name: '', email: '', phone: '', address: '', city: '', country: '', notes: '' });
    setIsModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    reset(client);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
    const method = editingClient ? 'PUT' : 'POST';
    const isNew = !editingClient;
    
    try {
      const loadingToastId = toast.loading(isNew ? 'Création en cours...' : 'Mise à jour...');
      const res = await apiFetch(url, { method, body: JSON.stringify(data) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur lors de la sauvegarde');
      }
      triggerRefresh('clients');
      triggerRefresh('stats');
      refetch();
      setIsModalOpen(false);
      
      toast.dismiss(loadingToastId);
      toast.success(isNew ? 'Client enregistré avec succès !' : 'Client mis à jour', {
        duration: 5000,
        ...(isNew && {
          action: {
            label: 'Créer une facture',
            onClick: () => useAppStore.getState().setCurrentModule('invoices' as any)
          }
        })
      });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmDeleteClient = async () => {
    if(!clientToDelete) return;
    const id = clientToDelete;
    const promise = apiFetch(`/api/clients/${id}`, { method: 'DELETE' }).then(async (res) => {
      if(!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur de suppression");
      }
      triggerRefresh('clients');
      triggerRefresh('stats');
      refetch();
      if(viewingClient?.id === id) setViewingClient(null);
      return true;
    });

    toast.promise(promise, {
      loading: 'Suppression...',
      success: 'Client supprimé',
      error: (err) => err.message
    });
    setClientToDelete(null);
  };

  const totalPages = Math.ceil((clients?.length || 0) / ITEMS_PER_PAGE);
  const paginatedClients = clients?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader 
        title="Clients" 
        description="Gérez votre base de données clients et prospects."
        icon={<UserPlus size={20} />}
        actions={
          <>
            <Input 
              type="text" 
              placeholder="Rechercher un client..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full sm:w-[250px]"
            />
            <button onClick={openNew} className="fp-btn-primary" style={{ whiteSpace: 'nowrap', padding: '0 var(--space-4)' }}>
              <Plus size={16} className="mr-2" /> Nouveau Client
            </button>
          </>
        }
      />

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 0, padding: 'var(--space-4)', color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>
          ❌ Erreur de chargement : {String(error)}<br/>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>
            Token en mémoire : {useAppStore.getState().user?.token?.substring(0, 16) || 'VIDE'}... | 
            Authentifié : {String(useAppStore.getState().isAuthenticated)}
          </span>
        </div>
      )}

      <div className="fp-card overflow-hidden overflow-x-auto">
        <table className="fp-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Contact</th>
              <th>Factures</th>
              <th>Total Payé</th>
              <th>Reste à Payer</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td><Skeleton className="h-4 w-32" /></td>
                  <td><Skeleton className="h-4 w-24" /></td>
                  <td><Skeleton className="h-4 w-16" /></td>
                  <td><Skeleton className="h-4 w-20" /></td>
                  <td><Skeleton className="h-4 w-20" /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </td>
                </tr>
              ))
            ) : clients?.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-4)' }}>
                  <div className="flex flex-col items-center justify-center text-center">
                    <FolderOpen size={48} style={{ color: 'var(--color-primary)', opacity: 0.2, marginBottom: 'var(--space-4)' }} />
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--foreground)', marginBottom: 'var(--space-2)' }}>Aucun client pour l'instant</h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground-muted)', maxWidth: '400px', marginBottom: 'var(--space-5)' }}>
                      Vous n'avez enregistré aucun client. Pour pouvoir générer une facture ou un devis, vous devez d'abord ajouter les coordonnées de votre client.
                    </p>
                    <button onClick={openNew} className="fp-btn-primary">
                      <Plus size={16} className="mr-2" /> Ajouter mon premier client
                    </button>
                  </div>
                </td>
              </tr>
            ) : paginatedClients?.map((client: Client) => {
               return (
              <tr key={client.id}>
                <td style={{ fontWeight: 600 }}>{client.name}</td>
                <td>
                  <div style={{ fontSize: '12px' }}>
                    {client.email && <div>{client.email}</div>}
                    {client.phone && <div style={{ color: 'var(--foreground-muted)' }}>{client.phone}</div>}
                  </div>
                </td>
                <td>{client.invoiceCount || 0}</td>
                <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(client.totalPaid || 0)}</td>
                <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{formatCurrency(client.totalRemaining || 0)}</td>
                <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <button className="text-xs font-semibold bg-[var(--surface)] border border-[var(--border-hover)] text-[var(--foreground)] rounded-md hover:bg-[var(--surface-2)] transition-colors cursor-pointer" style={{ padding: 'var(--space-2) var(--space-3)' }} onClick={() => openDetails(client)}>Fiche détaillée</button>
                      <button className="text-xs font-semibold bg-[var(--surface)] border border-[var(--border-hover)] text-[var(--foreground)] rounded-md hover:bg-[var(--surface-2)] transition-colors cursor-pointer" style={{ padding: 'var(--space-2) var(--space-3)' }} onClick={() => openEdit(client)}>Modifier</button>
                      <button className="text-xs font-semibold bg-transparent border border-red-200 text-[var(--destructive)] rounded-md hover:bg-red-50 transition-colors cursor-pointer" style={{ padding: 'var(--space-2) var(--space-3)' }} onClick={() => setClientToDelete(client.id)}>Supprimer</button>
                    </div>
                 </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
        className="mt-4"
      />

      {/* ── Modal Client : taille md (720px) — design system strict ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent size="md" showCloseButton>
          <DialogHeader 
            icon={editingClient ? Edit : UserPlus} 
            title={editingClient ? "Modifier le Client" : "Nouveau Client"} 
            desc={editingClient ? "Mettez à jour les informations du client." : "Renseignez les informations du client pour pouvoir facturer."} 
          />
          <form 
            className="flex flex-col flex-1 min-h-0"
            onSubmit={handleSubmit(onSubmit)}>
            <DialogBody>
              {/* Grille 2 colonnes — gap: space-4 vertical, space-5 horizontal */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4) var(--space-5)' }}>
                <Field label="Nom de l'entreprise ou du client" required>
                  <Input 
                    className={cn(errors.name && "border-destructive")} 
                    {...register('name')} 
                    placeholder="Ex: Entreprise SA"
                  />
                  {errors.name && <span className="text-destructive text-xs mt-1 block">{errors.name.message as string}</span>}
                </Field>

                <Field label="Adresse Email">
                  <Input 
                    className={cn(errors.email && "border-destructive")} 
                    type="email" 
                    {...register('email')} 
                    placeholder="contact@entreprise.com"
                  />
                  {errors.email && <span className="text-destructive text-xs block" style={{ marginTop: 'var(--space-1)' }}>{errors.email.message as string}</span>}
                </Field>

                <Field label="Numéro de Téléphone">
                  <Input {...register('phone')} placeholder="+33 1 23 45 67 89" />
                </Field>

                <Field label="Type de Client">
                  <select {...register('clientType')} style={{ width: '100%', padding: '4px 8px', background: 'var(--color-bg-page)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-primary)', fontSize: '11px', height: '28px' }}>
                    <option value="professionnel">Professionnel</option>
                    <option value="particulier">Particulier</option>
                    <option value="administration">Administration Publique</option>
                  </select>
                </Field>

                <Field label="NIF (Numéro d'Identification Fiscale)">
                  <Input {...register('nif')} placeholder="Obligatoire pour les pros" />
                </Field>

                <Field label="RCCM (Registre du Commerce)">
                  <Input {...register('rccm')} placeholder="Ex: GN.TCC.2023.B.12345" />
                </Field>

                <Field label="Ville">
                  <Input {...register('city')} placeholder="Paris" />
                </Field>

                <Field label="Adresse postale complète" fullWidth>
                  <Input {...register('address')} placeholder="123 Avenue des Champs-Élysées" />
                </Field>

                <Field label="Pays" fullWidth>
                  <Input {...register('country')} placeholder="France" />
                </Field>

                <Field label="Notes Internes" fullWidth>
                  <Textarea
                    {...register('notes')}
                    placeholder="Exigences spécifiques, conditions de paiement, contacts secondaires..." 
                  />
                </Field>
              </div>
            </DialogBody>
            <div className="text-[var(--color-text-secondary)] text-[var(--text-xs)]" style={{ padding: 'var(--space-3) var(--space-8)' }}>
              Les informations de facturation (SIRET, Numéro TVA) apparaîtront automatiquement sur les factures de ce client si elles sont renseignées.
            </div>
            <DialogFooter>
              <button type="button" className="fp-btn-outline" onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button type="submit" className="fp-btn-primary">{editingClient ? "Mettre à jour" : "Enregistrer le client"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>



      <Dialog open={!!viewingClient} onOpenChange={(open) => !open && setViewingClient(null)}>
        <DialogContent className="sm:max-w-4xl max-w-4xl h-[90vh] flex flex-col p-0">
          <div className="bg-[var(--surface-2)] border-b border-[var(--border)] shrink-0 flex flex-col" style={{ padding: 'var(--space-6)', gap: 'var(--space-5)' }}>
            <div className="flex justify-between items-start">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-bold font-display shadow-sm">
                  {viewingClient?.name?.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-[11px] font-bold tracking-[0.8px] uppercase text-[var(--foreground-muted)] mb-1">Dossier Client</p>
                  <h2 className="text-3xl font-semibold text-[var(--foreground)] tracking-tight font-display">{viewingClient?.name}</h2>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3) var(--space-6)', paddingTop: 'var(--space-2)' }}>
              {viewingClient?.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }} className="text-[13px] text-[var(--foreground-subtle)]">
                  <Mail className="w-4 h-4" />
                  <span>{viewingClient.email}</span>
                </div>
              )}
              {viewingClient?.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }} className="text-[13px] text-[var(--foreground-subtle)]">
                  <Phone className="w-4 h-4" />
                  <span>{viewingClient.phone}</span>
                </div>
              )}
              {(viewingClient?.address || viewingClient?.city || viewingClient?.country) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }} className="text-[13px] text-[var(--foreground-subtle)]">
                  <MapPin className="w-4 h-4" />
                  <span>{[viewingClient.address, viewingClient.city, viewingClient.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {viewingClient?.clientType && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }} className="text-[13px] text-[var(--foreground-subtle)]">
                  <Building className="w-4 h-4" />
                  <span className="capitalize">{viewingClient.clientType}</span>
                </div>
              )}
              {viewingClient?.nif && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }} className="text-[13px] text-[var(--foreground-subtle)]">
                  <FileTextIcon className="w-4 h-4" />
                  <span>NIF: {viewingClient.nif}</span>
                </div>
              )}
              {viewingClient?.rccm && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }} className="text-[13px] text-[var(--foreground-subtle)]">
                  <FileTextIcon className="w-4 h-4" />
                  <span>RCCM: {viewingClient.rccm}</span>
                </div>
              )}
            </div>
            
            {viewingClient?.notes && (
              <div className="mt-1 text-[13px] bg-white p-3 rounded-lg border border-[var(--border)] shadow-sm text-[var(--foreground-muted)]">
                <strong className="text-[var(--foreground)]">Notes Internes :</strong> {viewingClient.notes}
              </div>
            )}
          </div>

          {viewingClient && (
            <div className="flex-1 overflow-y-auto bg-[var(--background)] flex flex-col" style={{ padding: 'var(--space-6)', gap: 'var(--space-8)' }}>

              {/* — KPI Cards — */}
              <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 'var(--space-5)' }}>
                <div className="bg-white rounded-xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col" style={{ padding: 'var(--space-5)', gap: 'var(--space-2)' }}>
                  <p className="text-[12px] font-bold tracking-[0.5px] uppercase text-[var(--foreground-subtle)] flex items-center" style={{ gap: 'var(--space-2)' }}>
                    <div className="w-2 h-2 rounded-full bg-[var(--foreground-muted)]" />
                    Facturé Total
                  </p>
                  <p className="text-3xl font-bold text-[var(--foreground)] font-mono">{formatCurrency(viewingClient.totalInvoiced || 0)}</p>
                </div>
                <div className="bg-white rounded-xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden" style={{ padding: 'var(--space-5)', gap: 'var(--space-2)' }}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--success)]" />
                  <p className="text-[12px] font-bold tracking-[0.5px] uppercase text-[var(--success)] flex items-center" style={{ gap: 'var(--space-2)' }}>
                    Total Encaissé
                  </p>
                  <p className="text-3xl font-bold text-[var(--success)] font-mono">{formatCurrency(viewingClient.totalPaid || 0)}</p>
                </div>
                <div className="bg-white rounded-xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden" style={{ padding: 'var(--space-5)', gap: 'var(--space-2)' }}>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${(viewingClient.totalRemaining || 0) > 0 ? 'bg-[var(--gold)]' : 'bg-[var(--border)]'}`} />
                  <p className={`text-[12px] font-bold tracking-[0.5px] uppercase flex items-center ${(viewingClient.totalRemaining || 0) > 0 ? 'text-[var(--gold)]' : 'text-[var(--foreground-subtle)]'}`} style={{ gap: 'var(--space-2)' }}>
                    Créances (Reste à payer)
                  </p>
                  <p className={`text-3xl font-bold font-mono ${(viewingClient.totalRemaining || 0) > 0 ? 'text-[var(--gold)]' : 'text-[var(--foreground)]'}`}>{formatCurrency(viewingClient.totalRemaining || 0)}</p>
                </div>
              </div>

              {/* — Historique factures — */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="flex items-center justify-between border-b border-[var(--border)]" style={{ paddingBottom: 'var(--space-4)' }}>
                  <h3 className="font-bold text-[14px] text-[var(--foreground)]">Historique des Documents</h3>
                </div>
                {viewingClient.invoices?.length > 0 ? (
                  <div className="bg-white rounded-xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] overflow-hidden">
                    <table className="fp-table w-full">
                      <thead className="bg-[var(--surface-1)]">
                        <tr>
                          <th className="py-4 px-5 text-[12px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">Type</th>
                          <th className="py-4 px-5 text-[12px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">Numéro</th>
                          <th className="py-4 px-5 text-[12px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">Date</th>
                          <th className="py-4 px-5 text-[12px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)] text-right">Total TTC</th>
                          <th className="py-4 px-5 text-[12px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)] text-right">Déjà Payé</th>
                          <th className="py-4 px-5 text-[12px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)] text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(viewingClient.invoices || []).filter((inv: any) => inv.status !== 'brouillon').map((inv: any) => (
                          <React.Fragment key={inv.id}>
                            <tr className="hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border)] last:border-0">
                              <td className="py-4 px-5 font-semibold text-[13px] text-[var(--foreground-muted)] capitalize">{inv.type}</td>
                              <td className="py-4 px-5 font-semibold text-[var(--foreground)]">{inv.number}</td>
                              <td className="py-4 px-5 text-[13px] text-[var(--foreground-muted)]">{formatDate(inv.createdAt)}</td>
                              <td className="py-4 px-5 text-right font-semibold font-mono text-[var(--foreground)]" title={inv.actualTotal ? `Total brut: ${formatCurrency(inv.total)}` : ''}>
                                {formatCurrency(inv.actualTotal || inv.total)}
                              </td>
                              <td className="py-4 px-5 text-right font-semibold font-mono text-[var(--success)]">{formatCurrency(inv.amountPaid || 0)}</td>
                              <td className="py-4 px-5 text-center">
                                <span className={`fp-badge ${inv.status === 'payée' ? 'fp-badge-green' : inv.status === 'partielle' ? 'fp-badge-neutral' : 'fp-badge-neutral'}`}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                            {inv.receipts && inv.receipts.length > 0 && (
                              <tr className="bg-[var(--surface-2)]">
                                <td colSpan={6} className="p-5 pl-8 border-l-[3px] border-[var(--success)]">
                                  <div className="text-[11px] font-bold text-[var(--foreground-subtle)] uppercase tracking-wider mb-3">Historique des Versements :</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                    {(inv.receipts || []).map((rec: any) => (
                                      <div key={rec.id} className="flex justify-between items-center bg-white rounded-md px-5 py-3 border border-[var(--border)] shadow-sm">
                                        <div className="text-[13px] text-[var(--foreground-muted)]">
                                          <span className="font-semibold text-[var(--foreground)]">{rec.number}</span> <span className="mx-2">•</span> {formatDate(rec.paymentDate)}
                                        </div>
                                        <div className="text-[14px] font-bold text-[var(--success)] font-mono">+ {formatCurrency(rec.amount)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-[var(--surface-1)] rounded-xl p-8 text-center border border-[var(--border)] border-dashed">
                    <p className="text-[14px] text-[var(--foreground-muted)]">Aucun document validé pour ce client.</p>
                  </div>
                )}
              </div>

              {/* — GED — */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
                  <h3 className="text-[14px] font-bold tracking-wide uppercase text-[var(--foreground)]">Documents Associés (GED)</h3>
                  <label className="flex items-center text-[13px] font-semibold text-[var(--foreground)] cursor-pointer rounded-lg border border-[var(--border)] bg-white hover:bg-[var(--surface-hover)] transition-colors shadow-sm" style={{ gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4)' }}>
                    <PlusIcon className="w-4 h-4" />
                    Ajouter un document
                    <input type="file" className="hidden" onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const fData = new FormData();
                        fData.append('file', e.target.files[0]);
                        fData.append('entityType', 'client');
                        fData.append('entityId', viewingClient.id);
                        const promise = apiFetch('/api/upload', { method: 'POST', body: fData })
                          .then(r => { if (!r.ok) throw new Error('Erreur upload'); return r.json(); })
                          .then(() => { refetch(); });
                        toast.promise(promise, {
                          loading: 'Téléchargement en cours...',
                          success: 'Document ajouté avec succès',
                          error: 'Erreur lors de l\'ajout du document'
                        });
                        e.target.value = '';
                      }
                    }} />
                  </label>
                </div>
                <div className="bg-white rounded-xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-6">
                  <ClientDocuments clientId={viewingClient.id} />
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <ConfirmDialog
        open={!!clientToDelete}
        onOpenChange={(open) => !open && setClientToDelete(null)}
        title="Supprimer ce client ?"
        description="ATTENTION : Cette action est totalement irréversible. Toutes les données associées (factures, devis, reçus, historiques de relance) seront supprimées en cascade."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={confirmDeleteClient}
      />
    </div>
  );
}
