import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate, useAppStore, apiFetch } from '../lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useForm } from 'react-hook-form';
import { DownloadIcon, FileTextIcon, FilterIcon, MoreVerticalIcon, PlusIcon, PrinterIcon, ArrowUpRight, ArrowDownLeft, Building, Mail, Phone, MapPin } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { PageHeader } from './ui/PageHeader';
import { DialogFooter } from './ui/dialog';
import { Plus } from 'lucide-react';
import { ClientDocuments } from './ClientDocuments';

export function Clients() {
  const refreshClients = useAppStore(state => state.refreshClients);
  const triggerRefresh = useAppStore(state => state.triggerRefresh);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [viewingClient, setViewingClient] = useState<any>(null);

  const { data: clients = [], isLoading, error, refetch } = useQuery({

    queryKey: ['clients', refreshClients, search],
    queryFn: async () => {
      const token = useAppStore.getState().user?.token;
      console.log('[Clients] token in store:', token ? token.substring(0, 12) + '...' : 'NULL/EMPTY');
      const res = await apiFetch(`/api/clients?q=${encodeURIComponent(search)}`);
      console.log('[Clients] API response status:', res.status);
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.error('[Clients] API error body:', errBody);
        throw new Error(`HTTP ${res.status}: ${errBody.substring(0, 100)}`);
      }
      const data = await res.json();
      console.log('[Clients] data received:', data);
      return Array.isArray(data) ? data : [];
    },
    retry: false
  });


  const { register, handleSubmit, reset } = useForm();

  const openNew = () => {
    setEditingClient(null);
    reset({ name: '', email: '', phone: '', address: '', city: '', country: '', notes: '' });
    setIsModalOpen(true);
  };

  const openEdit = (client: any) => {
    setEditingClient(client);
    reset(client);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
    const method = editingClient ? 'PUT' : 'POST';
    const res = await apiFetch(url, { method, body: JSON.stringify(data) });
    if (res.ok) {
      toast.success(editingClient ? 'Client mis à jour' : 'Client créé');
      setIsModalOpen(false);
      triggerRefresh('clients');
      triggerRefresh('stats');
      refetch();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || 'Erreur lors de la sauvegarde');
    }
  };

  const deleteClient = async (id: string) => {
    if(!confirm("Supprimer ce client ?")) return;
    const res = await apiFetch(`/api/clients/${id}`, { method: 'DELETE' });
    if(res.ok) {
       toast.success("Client supprimé");
       triggerRefresh('clients');
       triggerRefresh('stats');
       refetch();
    } else {
       const err = await res.json().catch(() => ({}));
       toast.error(err.error || "Erreur de suppression");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Clients" 
        description="Gérez votre base de données clients et prospects."
        actions={
          <>
            <input 
              type="text"
              placeholder="Rechercher un client..." 
              className="fp-input"
              style={{ width: '250px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={openNew} className="fp-btn-primary">
              <Plus size={16} className="mr-2" /> Nouveau Client
            </button>
          </>
        }
      />

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 0, padding: '16px', color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>
          ❌ Erreur de chargement : {String(error)}<br/>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>
            Token en mémoire : {useAppStore.getState().user?.token?.substring(0, 16) || 'VIDE'}... | 
            Authentifié : {String(useAppStore.getState().isAuthenticated)}
          </span>
        </div>
      )}

      <div className="fp-card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
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
            {Array.isArray(clients) && clients.map((client: any) => {
               return (
              <tr key={client.id}>
                <td style={{ fontWeight: 600 }}>{client.name}</td>
                <td>
                  <div style={{ fontSize: '12px' }}>
                    {client.email && <div>{client.email}</div>}
                    {client.phone && <div style={{ color: 'var(--foreground-muted)' }}>{client.phone}</div>}
                  </div>
                </td>
                <td>{(client.invoices || []).length}</td>
                <td style={{ color: 'var(--emerald)', fontWeight: 600 }}>{formatCurrency(client.totalPaid || 0)}</td>
                <td style={{ color: 'var(--amber)', fontWeight: 600 }}>{formatCurrency(client.totalRemaining || 0)}</td>
                <td>
                   <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                     <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => setViewingClient(client)}>Fiche détaillée</button>
                     <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => openEdit(client)}>Modifier</button>
                     <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--destructive)', cursor: (client.invoices || []).length ? 'not-allowed' : 'pointer', opacity: (client.invoices || []).length ? 0.5 : 1 }} title={(client.invoices || []).length ? "Impossible : Factures associées" : ""} onClick={() => { if(!(client.invoices || []).length) deleteClient(client.id); }}>Supprimer</button>
                   </div>
                 </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[var(--foreground-subtle)] mb-1.5">Nom *</label>
                <input className="fp-input w-full" {...register('name', { required: true })} />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[var(--foreground-subtle)] mb-1.5">Email</label>
                <input className="fp-input w-full" type="email" {...register('email')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[var(--foreground-subtle)] mb-1.5">Téléphone</label>
                <input className="fp-input w-full" {...register('phone')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[var(--foreground-subtle)] mb-1.5">Ville</label>
                <input className="fp-input w-full" {...register('city')} />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[var(--foreground-subtle)] mb-1.5">Adresse</label>
                <input className="fp-input w-full" {...register('address')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wide uppercase text-[var(--foreground-subtle)] mb-1.5">Pays</label>
                <input className="fp-input w-full" {...register('country')} />
              </div>
            </div>
            <div className="px-6 pb-6">
              <label className="block text-[11px] font-bold tracking-wide uppercase text-[var(--foreground-subtle)] mb-1.5">Notes Internes</label>
              <p className="text-[11px] text-[var(--foreground-muted)] mb-2">Services récurrents, conditions tarifaires, préférences du client.</p>
              <textarea
                {...register('notes')}
                className="fp-input w-full min-h-[100px] resize-y"
                placeholder="- Services habituellement demandés...&#10;- Conditions de paiement..." 
              />
            </div>
            <DialogFooter>
              <button type="button" className="fp-btn-outline" onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button type="submit" className="fp-btn-primary">Sauvegarder</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingClient} onOpenChange={(open) => !open && setViewingClient(null)}>
        <DialogContent className="sm:max-w-5xl max-w-5xl h-[90vh] flex flex-col p-0">
          <div className="bg-[var(--surface-2)] p-8 border-b border-[var(--border)] shrink-0 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold tracking-[0.6px] uppercase text-[var(--foreground-subtle)] mb-1">Dossier Client</p>
                <h2 className="text-3xl font-bold text-[var(--foreground)] tracking-tight font-display">{viewingClient?.name}</h2>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {viewingClient?.email && (
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                  <Mail className="w-4 h-4 text-[var(--foreground-subtle)]" />
                  <span>{viewingClient.email}</span>
                </div>
              )}
              {viewingClient?.phone && (
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                  <Phone className="w-4 h-4 text-[var(--foreground-subtle)]" />
                  <span>{viewingClient.phone}</span>
                </div>
              )}
              {(viewingClient?.address || viewingClient?.city || viewingClient?.country) && (
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                  <MapPin className="w-4 h-4 text-[var(--foreground-subtle)]" />
                  <span>{[viewingClient.address, viewingClient.city, viewingClient.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {viewingClient && (
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-10 bg-[var(--background)]">

              {/* — KPI Cards — */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[var(--surface-1)] p-6 border border-[var(--border)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-2">
                  <p className="text-[11px] font-bold tracking-[0.7px] uppercase text-[var(--foreground-subtle)]">Facturé Total</p>
                  <p className="text-3xl font-extrabold text-[var(--foreground)] font-mono">{formatCurrency(viewingClient.totalInvoiced || 0)}</p>
                </div>
                <div className="bg-[var(--surface-1)] p-6 border border-[var(--border)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-2 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--emerald)]" />
                  <p className="text-[11px] font-bold tracking-[0.7px] uppercase text-[var(--emerald)]">Total Encaissé</p>
                  <p className="text-3xl font-extrabold text-[var(--emerald)] font-mono">{formatCurrency(viewingClient.totalPaid || 0)}</p>
                </div>
                <div className="bg-[var(--surface-1)] p-6 border border-[var(--border)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-2 relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${(viewingClient.totalRemaining || 0) > 0 ? 'bg-[var(--gold)]' : 'bg-[var(--border)]'}`} />
                  <p className={`text-[11px] font-bold tracking-[0.7px] uppercase ${(viewingClient.totalRemaining || 0) > 0 ? 'text-[var(--gold)]' : 'text-[var(--foreground-subtle)]'}`}>Créances (Reste à payer)</p>
                  <p className={`text-3xl font-extrabold font-mono ${(viewingClient.totalRemaining || 0) > 0 ? 'text-[var(--gold)]' : 'text-[var(--foreground)]'}`}>{formatCurrency(viewingClient.totalRemaining || 0)}</p>
                </div>
              </div>

              {/* — Historique factures — */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[13px] font-bold tracking-[0.6px] uppercase text-[var(--foreground)] border-b border-[var(--border)] pb-3">Historique des Factures</h3>
                {viewingClient.invoices?.length > 0 ? (
                  <div className="fp-card overflow-hidden overflow-x-auto">
                    <table className="fp-table w-full">
                      <thead>
                        <tr>
                          <th>Numéro</th>
                          <th>Date</th>
                          <th className="text-right">Total TTC</th>
                          <th className="text-right">Déjà Payé</th>
                          <th className="text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingClient.invoices.map((inv: any) => (
                          <React.Fragment key={inv.id}>
                            <tr className="hover:bg-[var(--surface-hover)] transition-colors">
                              <td className="font-semibold text-[var(--foreground)]">{inv.number}</td>
                              <td className="text-[var(--foreground-muted)]">{formatDate(inv.createdAt)}</td>
                              <td className="text-right font-semibold font-mono text-[var(--foreground)]">{formatCurrency(inv.total)}</td>
                              <td className="text-right font-semibold font-mono text-[var(--emerald)]">{formatCurrency(inv.amountPaid || 0)}</td>
                              <td className="text-center">
                                <span className={`fp-badge ${inv.status === 'payée' ? 'fp-badge-green' : inv.status === 'partielle' ? 'fp-badge-neutral' : 'fp-badge-neutral'}`}>
                                  {inv.status === 'brouillon' ? 'Non entamée' : inv.status}
                                </span>
                              </td>
                            </tr>
                            {inv.receipts && inv.receipts.length > 0 && (
                              <tr className="bg-[var(--surface-2)]">
                                <td colSpan={5} className="p-4 pl-6 border-l-[3px] border-[var(--emerald)]">
                                  <div className="text-[10px] font-bold text-[var(--foreground-subtle)] uppercase tracking-wider mb-2">Historique des Versements :</div>
                                  <div className="flex flex-col gap-2">
                                    {inv.receipts.map((rec: any) => (
                                      <div key={rec.id} className="flex justify-between items-center bg-[var(--surface-1)] px-4 py-2 border border-[var(--border)] shadow-sm">
                                        <div className="text-xs text-[var(--foreground-muted)]">
                                          <span className="font-semibold text-[var(--foreground)]">{rec.number}</span> ({formatDate(rec.paymentDate)})
                                        </div>
                                        <div className="text-[13px] font-bold text-[var(--emerald)] font-mono">+ {formatCurrency(rec.amount)}</div>
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
                  <p className="text-[13px] text-[var(--foreground-muted)] italic py-4">Aucune facture pour ce client.</p>
                )}
              </div>

              {/* — GED — */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
                  <h3 className="text-[13px] font-bold tracking-[0.6px] uppercase text-[var(--foreground)]">Documents Associés (GED)</h3>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-subtle)] cursor-pointer px-4 py-2 border border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-hover)] transition-colors shadow-sm">
                    <PlusIcon className="w-4 h-4" />
                    Ajouter un document
                    <input type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { const fData = new FormData(); fData.append('file', e.target.files[0]); fData.append('entityType', 'client'); fData.append('entityId', viewingClient.id); fetch('/api/upload', { method: 'POST', body: fData, headers: { 'Authorization': `Bearer ${localStorage.getItem('facturapro_token')}` } }).then(r => r.json()).then(() => { toast.success('Document ajouté'); }); }}} />
                  </label>
                </div>
                <ClientDocuments clientId={viewingClient.id} />
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
