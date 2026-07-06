import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate, useAppStore, apiFetch } from '../lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useForm } from 'react-hook-form';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { PageHeader } from './ui/PageHeader';
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
        <DialogContent className="sm:max-w-2xl max-w-2xl" style={{ borderRadius: 0, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <DialogHeader>
            <DialogTitle className="text-xl">{editingClient ? 'Modifier Client' : 'Nouveau Client'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Nom *</label>
                <input style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)' }} {...register('name', { required: true })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Email</label>
                <input style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)' }} type="email" {...register('email')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Téléphone</label>
                <input style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)' }} {...register('phone')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Ville</label>
                <input style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)' }} {...register('city')} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Adresse</label>
                <input style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)' }} {...register('address')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Pays</label>
                <input style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)' }} {...register('country')} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Notes Internes</label>
              <p style={{ fontSize: '11px', color: 'var(--foreground-muted)', marginBottom: '8px' }}>Services récurrents, conditions tarifaires, préférences du client.</p>
              <textarea
                {...register('notes')}
                style={{ width: '100%', minHeight: '100px', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                placeholder="- Services habituellement demandés...&#10;- Conditions de paiement..." 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
              <button type="button" style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button type="submit" className="fp-btn-primary">Sauvegarder</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingClient} onOpenChange={(open) => !open && setViewingClient(null)}>
        <DialogContent className="sm:max-w-4xl max-w-4xl max-h-[90vh] overflow-y-auto" style={{ borderRadius: 0, background: 'var(--background)', border: '1px solid var(--border)', padding: 0 }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '4px' }}>Dossier Client</p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.3px', fontFamily: 'var(--font-display)' }}>{viewingClient?.name}</p>
          </div>
          {viewingClient && (
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

              {/* — KPI Cards — */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', border: '1px solid var(--border)', background: 'var(--border)' }}>
                <div style={{ background: 'var(--surface)', padding: '20px 22px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '8px' }}>Facturé Total</p>
                  <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(viewingClient.totalInvoiced || 0)}</p>
                </div>
                <div style={{ background: 'var(--surface)', padding: '20px 22px', borderLeft: '3px solid var(--emerald)' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--emerald)', marginBottom: '8px' }}>Total Encaissé</p>
                  <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(viewingClient.totalPaid || 0)}</p>
                </div>
                <div style={{ background: 'var(--surface)', padding: '20px 22px', borderLeft: `3px solid ${(viewingClient.totalRemaining || 0) > 0 ? 'var(--gold)' : 'var(--border)'}` }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: (viewingClient.totalRemaining || 0) > 0 ? 'var(--gold)' : 'var(--foreground-subtle)', marginBottom: '8px' }}>Créances (Reste à payer)</p>
                  <p style={{ fontSize: '28px', fontWeight: 800, color: (viewingClient.totalRemaining || 0) > 0 ? 'var(--gold)' : 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(viewingClient.totalRemaining || 0)}</p>
                </div>
              </div>

              {/* — Historique factures — */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>Historique des Factures</p>
                {viewingClient.invoices?.length > 0 ? (
                  <div className="fp-card" style={{ overflow: 'hidden', overflowX: 'auto', marginTop: '16px' }}>
                    <table className="fp-table">
                      <thead>
                        <tr>
                          <th>Numéro</th>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Total TTC</th>
                          <th style={{ textAlign: 'right' }}>Déjà Payé</th>
                          <th style={{ textAlign: 'center' }}>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingClient.invoices.map((inv: any) => (
                          <React.Fragment key={inv.id}>
                            <tr>
                              <td style={{ fontWeight: 600 }}>{inv.number}</td>
                              <td>{formatDate(inv.createdAt)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(inv.total)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--emerald)' }}>{formatCurrency(inv.amountPaid || 0)}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ padding: '4px 8px', borderRadius: 0, fontSize: '11px', fontWeight: 600, textTransform: 'capitalize', background: inv.status === 'payée' ? 'rgba(16,185,129,0.1)' : inv.status === 'partielle' ? 'rgba(245,158,11,0.1)' : 'rgba(100,116,139,0.1)', color: inv.status === 'payée' ? 'var(--emerald)' : inv.status === 'partielle' ? 'var(--amber)' : 'var(--foreground-muted)', border: `1px solid ${inv.status === 'payée' ? 'rgba(16,185,129,0.2)' : inv.status === 'partielle' ? 'rgba(245,158,11,0.2)' : 'rgba(100,116,139,0.2)'}` }}>
                                  {inv.status === 'brouillon' ? 'Non entamée' : inv.status}
                                </span>
                              </td>
                            </tr>
                            {inv.receipts && inv.receipts.length > 0 && (
                              <tr style={{ background: 'var(--surface-hover)' }}>
                                <td colSpan={5} style={{ padding: '12px 20px', borderLeft: '3px solid var(--emerald)' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Historique des Versements :</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {inv.receipts.map((rec: any) => (
                                      <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '6px 12px', borderRadius: 0, border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
                                          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{rec.number}</span> ({formatDate(rec.paymentDate)})
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--emerald)' }}>+ {formatCurrency(rec.amount)}</div>
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
                  <p style={{ fontSize: '13px', color: 'var(--foreground-muted)', fontStyle: 'italic', padding: '16px 0' }}>Aucune facture pour ce client.</p>
                )}
              </div>

              {/* — GED — */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--foreground-subtle)' }}>Documents Associés (GED)</p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--foreground-muted)', cursor: 'pointer', padding: '6px 12px', border: '1px solid var(--border-hover)', background: 'var(--surface)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Ajouter un document
                    <input type="file" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) { const fData = new FormData(); fData.append('file', e.target.files[0]); fData.append('entityType', 'client'); fData.append('entityId', viewingClient.id); fetch('/api/upload', { method: 'POST', body: fData, headers: { 'Authorization': `Bearer ${localStorage.getItem('facturapro_token')}` } }).then(r => r.json()).then(() => { toast.success('Document ajouté'); }); }}} />
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
