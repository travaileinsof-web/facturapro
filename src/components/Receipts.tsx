import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate, useAppStore, safeJSONParse, apiFetch } from '../lib/store';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from './ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Check, ChevronsUpDown, Mail, MessageCircle, DownloadIcon, FileTextIcon, FilterIcon, PlusIcon, PrinterIcon, Receipt, Plus, FolderOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { PageHeader } from './ui/PageHeader';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { buildReceiptHTML } from '../lib/pdfTemplate';
import { exportHTMLToPDF, generatePDFBase64 } from '../lib/pdfExport';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Pagination } from './ui/pagination';
import { Field } from './ui/Field';
import { DatePicker } from './ui/DatePicker';
import { Input } from './ui/input';

export function Receipts() {
  const refreshReceipts = useAppStore(state => state.refreshReceipts);
  const refreshClients = useAppStore(state => state.refreshClients);
  const triggerRefresh = useAppStore(state => state.triggerRefresh);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const { data: receipts, isLoading, refetch } = useQuery({
    queryKey: ['receipts', refreshReceipts],
    queryFn: async () => {
      const res = await apiFetch(`/api/receipts`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: clients } = useQuery({
    queryKey: ['clientsForReceipts', refreshClients],
    queryFn: async () => {
      const res = await apiFetch(`/api/clients`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      clientId: '',
      proformaInvoiceId: '',
      amount: 0,
      paymentMethod: 'virement_bancaire',
      paymentDate: new Date().toLocaleDateString('en-CA'),
      notes: ''
    }
  });

  const watchClientId = watch('clientId');
  // Find the selected client's invoices to filter the dropdown, ignoring the ones completely paid or cancelled
  const selectedClient = clients?.find((c: any) => c.id === watchClientId);
  const availableInvoices = selectedClient?.invoices?.filter((inv: any) => inv.status !== 'payée' && inv.status !== 'annulée' && inv.status !== 'payee' && inv.status !== 'annulee');
  const watchInvoiceId = watch('proformaInvoiceId');
  const selectedInvoice = availableInvoices?.find((i: any) => i.id === watchInvoiceId);
  
  const openNew = () => {
    reset({ clientId: '', proformaInvoiceId: '', amount: 0, paymentMethod: 'virement_bancaire', paymentDate: new Date().toLocaleDateString('en-CA'), notes: '' });
    setIsModalOpen(true);
  };

  const handleInvoiceChange = (e: any) => {
    const invId = e.target.value;
    setValue('proformaInvoiceId', invId);
    if(invId) {
       const inv = availableInvoices?.find((i:any) => i.id === invId);
       if(inv) {
         // remaining is precalculated in the backend ClientController!
         setValue('amount', Math.max(0, inv.amountRemaining || 0));
       }
    }
  };

  const onSubmit = async (data: any) => {
    if (!data.clientId) {
      toast.error("Veuillez sélectionner un client pour le reçu.");
      return;
    }

    const payload = {
      ...data,
      amount: Number(data.amount),
      paymentDate: new Date(data.paymentDate).toISOString()
    };

    const res = await apiFetch('/api/receipts', {
       method: 'POST',
       body: JSON.stringify(payload)
    });

    if (res.ok) {
      toast.success('Reçu créé');
      setIsModalOpen(false);
      triggerRefresh('receipts');
      triggerRefresh('invoices');
      triggerRefresh('reminders');
      triggerRefresh('clients');
      triggerRefresh('stats');
      refetch();
    } else {
       const err = await res.json().catch(() => ({}));
       toast.error(err.error || 'Erreur lors de la création du reçu');
    }
  };

  const confirmDeleteReceipt = async () => {
    if(!receiptToDelete) return;
    const id = receiptToDelete;
    const res = await apiFetch(`/api/receipts/${id}`, { method: 'DELETE' });
    if(res.ok) {
       toast.success("Reçu supprimé");
       triggerRefresh('receipts');
       triggerRefresh('invoices');
       triggerRefresh('reminders');
       triggerRefresh('stats');
       refetch();
    } else {
       const err = await res.json().catch(() => ({}));
       toast.error(err.error || "Erreur de suppression");
    }
    setReceiptToDelete(null);
  };

  const shareViaEmail = async (rec: any) => {
    const email = prompt("Adresse email du client :", rec.client?.email || "");
    if (!email) return;
    
    const toastId = toast.loading("Génération et envoi...");
    try {
      const [settingsRes, recRes] = await Promise.all([
        apiFetch('/api/settings'),
        apiFetch(`/api/receipts/${rec.id}`)
      ]);
      const settings = await settingsRes.json();
      const fullRec = await recRes.json();
      const html = buildReceiptHTML(fullRec, settings);
      const pdfBase64 = await generatePDFBase64(html);
      
      const res = await apiFetch('/api/share', {
        method: 'POST',
        body: JSON.stringify({
          type: 'email',
          to: email,
          subject: `Reçu ${rec.number}`,
          message: `Bonjour,\n\nVeuillez trouver ci-joint votre reçu ${rec.number} d'un montant de ${formatCurrency(rec.amount)}.\n\nCordialement,`,
          filename: `Recu_${rec.number}.pdf`,
          pdfBase64,
          companyId: rec.companyId
        })
      });
      
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success("Email envoyé avec succès !", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Erreur", { id: toastId });
    }
  };

  const shareViaWhatsApp = async (rec: any) => {
    const toastId = toast.loading("Génération du lien WhatsApp...");
    try {
      const [settingsRes, recRes] = await Promise.all([
        apiFetch('/api/settings'),
        apiFetch(`/api/receipts/${rec.id}`)
      ]);
      const settings = await settingsRes.json();
      const fullRec = await recRes.json();
      const html = buildReceiptHTML(fullRec, settings);
      const pdfBase64 = await generatePDFBase64(html);
      
      let phone = fullRec.client?.phone || "";
      if (phone) phone = phone.replace(/[^0-9]/g, '');
      
      // Enregistrer le PDF sur le serveur pour obtenir un lien public
      const shareRes = await apiFetch('/api/share', {
        method: 'POST',
        body: JSON.stringify({
          type: 'whatsapp',
          pdfBase64: pdfBase64,
          filename: `Recu_${rec.number}.pdf`
        })
      });
      const shareData = await shareRes.json();
      
      let finalMsg = "";
      
      const pdfUrl = shareData.url;
      
      // Templating dynamique
      let baseMsg = settings.whatsappMessage ? settings.whatsappMessage : `Bonjour {client_name},\n\nVoici votre reçu *{document_number}* d'un montant de *{amount}*.`;
      
      baseMsg = baseMsg.replace(/\{client_name\}/g, fullRec.client?.name || rec.client?.name || '');
      baseMsg = baseMsg.replace(/\{document_number\}/g, rec.number || '');
      baseMsg = baseMsg.replace(/\{amount\}/g, formatCurrency(rec.amount) || '');
      baseMsg = baseMsg.replace(/\{company_name\}/g, fullRec.company?.name || settings.companyName || '');
      
      if (!shareRes.ok && shareData.error?.includes("Vercel Blob")) {
        // Fallback: download locally
        const link = document.createElement('a');
        link.href = pdfBase64;
        link.download = `Recu_${rec.number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        finalMsg = `${baseMsg}\n\n(Veuillez joindre manuellement le reçu qui vient d'être téléchargé sur votre appareil)`;
        toast.success("PDF téléchargé. Ajoutez-le dans WhatsApp !", { id: toastId });
      } else if (!shareRes.ok || !shareData.success) {
        throw new Error(shareData.error || "Erreur de lien PDF");
      } else {
        finalMsg = `${baseMsg}\n\n📄 Voici votre document : ${shareData.url}`;
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const encodedMsg = encodeURIComponent(finalMsg);
        const waUrl = isMobile 
          ? `whatsapp://send?text=${encodedMsg}` + (phone ? `&phone=${phone}` : '') 
          : (phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMsg}` : `https://api.whatsapp.com/send?text=${encodedMsg}`);
        window.open(waUrl, '_blank');
        toast.success("Redirection vers WhatsApp...", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur", { id: toastId });
    }
  };

  const downloadPDF = async (rec: any) => {

    const toastId = toast.loading("Génération du PDF en cours...");
    try {
      const [settingsRes, recRes] = await Promise.all([
        apiFetch('/api/settings'),
        apiFetch(`/api/receipts/${rec.id}`)
      ]);
      const settings = await settingsRes.json();
      const fullRec = await recRes.json();
      if (!fullRec || !fullRec.id) throw new Error('Reçu introuvable');
      const html = buildReceiptHTML(fullRec, settings);
      
      await exportHTMLToPDF(html, `Recu_${rec.number}`);
      toast.success("Fenêtre d'impression ouverte !", { id: toastId });
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de la génération PDF", { id: toastId });
    }
  };

  const totalPages = Math.ceil((receipts?.length || 0) / ITEMS_PER_PAGE);
  const paginatedReceipts = receipts?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader 
        title="Reçus" 
        description="Gérez les paiements encaissés et éditez les reçus de vos clients."
        icon={<Receipt size={20} />}
        actions={
          <button onClick={openNew} className="fp-btn-primary">
            Nouveau Reçu
          </button>
        }
      />

      <div className="fp-card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
        <table className="fp-table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Client</th>
              <th>Facture Liée</th>
              <th style={{ textAlign: 'right' }}>Montant</th>
              <th>Moyen de Paiement</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--foreground-muted)' }}>Chargement...</td></tr>
            ) : receipts?.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-4)' }}>
                  <div className="flex flex-col items-center justify-center text-center">
                    <FolderOpen size={48} style={{ color: 'var(--color-primary)', opacity: 0.2, marginBottom: 'var(--space-4)' }} />
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--foreground)', marginBottom: 'var(--space-2)' }}>Aucun reçu enregistré</h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground-muted)', maxWidth: '400px', marginBottom: 'var(--space-5)' }}>
                      Les reçus permettent d'attester le paiement partiel ou total d'une facture par vos clients.
                    </p>
                    <button onClick={openNew} className="fp-btn-primary">
                      <Plus size={16} className="mr-2" /> Créer un reçu
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedReceipts?.map((rec: any) => (
                <tr key={rec.id}>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground-subtle)' }}>
                      {rec.number}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{rec.client?.name || 'Client Inconnu'}</td>
                  <td>{rec.invoiceNumber || '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--emerald)' }}>
                    {formatCurrency(rec.amount)}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{rec.paymentMethod?.replace('_', ' ')}</td>
                  <td>{formatDate(rec.paymentDate)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <button className="fp-btn-ghost" onClick={() => downloadPDF(rec)}>Télécharger PDF</button>
                      <button className="fp-btn-ghost" onClick={() => shareViaWhatsApp(rec)}>
                        <MessageCircle size={14} style={{ color: '#25D366' }} /> WhatsApp
                      </button>
                      <button className="fp-btn-ghost" onClick={() => shareViaEmail(rec)}>
                        <Mail size={14} style={{ color: '#4f46e5' }} /> Email
                      </button>
                      <button className="fp-btn-ghost fp-text-rose" onClick={() => setReceiptToDelete(rec.id)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
        className="mt-4"
      />

      {/* ── Modal Reçu : taille md (720px) — design system strict ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent size="md" showCloseButton>
          <DialogHeader
            icon={Receipt}
            title="Nouveau Reçu"
            desc="Enregistrez un paiement reçu de la part d'un client."
          />
          <form id="receipt-form" onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <DialogBody>
              <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 'var(--space-5)' }}>
                <Field label={<>Client <span style={{ color: 'var(--primary)' }}>*</span></>}>
                  <select className="fp-input w-full" {...register('clientId', { required: true })}>
                    <option value="">Sélectionner un client</option>
                    {clients?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>

                <div className="col-span-2">
                  <Field label="Facture associée (Optionnel)">
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCombobox}
                            className="w-full justify-between font-normal fp-input"
                            style={{ height: '42px', borderRadius: 0, border: '1px solid var(--border)' }}
                            disabled={!watchClientId}
                          >
                            {watchInvoiceId
                              ? (() => {
                                  const inv = availableInvoices?.find((i: any) => i.id === watchInvoiceId);
                                  if (!inv) return "-- Aucune / Accueil Libre --";
                                  const items = safeJSONParse(inv.items, []);
                                  const summary = items.length ? (items.length > 1 ? `${items[0].description} (+${items.length - 1})` : items[0].description) : '';
                                  return `${inv.number} ${summary ? `- ${summary}` : ''} (Reste: ${formatCurrency(inv.amountRemaining || 0)})`;
                                })()
                              : "-- Aucune / Accueil Libre --"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        }
                      />
                      <PopoverContent className="w-[500px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher par numéro ou objet..." />
                          <CommandList>
                            <CommandEmpty>Aucune facture trouvée.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                onSelect={() => {
                                  handleInvoiceChange({ target: { value: "" } });
                                  setOpenCombobox(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", watchInvoiceId === "" ? "opacity-100" : "opacity-0")} />
                                -- Aucune / Accueil Libre --
                              </CommandItem>
                              {availableInvoices?.map((inv: any) => {
                                 const items = safeJSONParse(inv.items, []);
                                 const summary = items.length ? (items.length > 1 ? `${items[0].description} et ${items.length - 1} autre(s)` : items[0].description) : '';
                                 
                                 return (
                                   <CommandItem
                                     key={inv.id}
                                     value={`${inv.number} ${summary}`}
                                     onSelect={() => {
                                       handleInvoiceChange({ target: { value: inv.id } });
                                       setOpenCombobox(false);
                                     }}
                                   >
                                     <Check className={cn("mr-2 h-4 w-4", watchInvoiceId === inv.id ? "opacity-100" : "opacity-0")} />
                                     <div className="flex flex-col">
                                       <span className="font-medium">{inv.number} {summary ? `- ${summary}` : ''}</span>
                                       <span className="text-xs text-slate-500">
                                         Montant: {formatCurrency(inv.total)} | Reste à payer : {formatCurrency(inv.amountRemaining || 0)}
                                       </span>
                                     </div>
                                   </CommandItem>
                                 );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </Field>

                  {selectedInvoice && (
                     <div className="text-sm max-h-40 overflow-y-auto" style={{ marginTop: 'var(--space-3)', padding: 'var(--space-4)', border: '1px solid var(--emerald)', background: 'rgba(16,185,129,0.05)' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
                           <p className="font-semibold text-emerald-800" style={{ color: 'var(--emerald)' }}>Aperçu Facture {selectedInvoice.number}</p>
                           <p className="font-medium text-emerald-900" style={{ color: 'var(--emerald)' }}>Reste: {formatCurrency(selectedInvoice.amountRemaining || 0)}</p>
                        </div>
                        <ul className="text-slate-600 list-disc list-inside" style={{ marginTop: 'var(--space-1)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                          {safeJSONParse(selectedInvoice.items).map((it:any, idx: number) => (
                             <li key={idx}>
                                <span className="font-medium text-slate-700">{it.description}</span> (x{it.quantity}) - {formatCurrency(it.unitPrice)}
                             </li>
                          ))}
                        </ul>
                     </div>
                  )}
                </div>
              </div>

              {/* Grille 2 colonnes : amount + date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4) var(--space-5)', marginTop: 'var(--space-5)' }}>
                <Field label="Montant" required>
                  <Input type="number" step="0.01" {...register('amount', { required: true, valueAsNumber: true })} />
                </Field>
                {/* DatePicker unifié — plus jamais d'input type=date natif */}
                <Field label="Date de Paiement" required>
                  <DatePicker
                    value={watch('paymentDate')}
                    onChange={v => setValue('paymentDate', v)}
                    required
                  />
                </Field>
                <Field label="Mode de Paiement" required fullWidth>
                  <select {...register('paymentMethod')}>
                    <option value="virement_bancaire">Virement Bancaire</option>
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </Field>
              </div>

              <div style={{ marginTop: 'var(--space-5)' }}>
                <Field label="Notes Complémentaires">
                  <textarea {...register('notes')} />
                </Field>
              </div>
            </DialogBody>
          </form>
          <DialogFooter>
            <button type="button" className="fp-btn-outline" onClick={() => setIsModalOpen(false)}>Annuler</button>
            <button type="submit" form="receipt-form" className="fp-btn-primary">Enregistrer le Reçu</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!receiptToDelete}
        onOpenChange={(open) => !open && setReceiptToDelete(null)}
        title="Supprimer ce reçu ?"
        description="L'état de la facture liée sera recalculé automatiquement. Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={confirmDeleteReceipt}
      />
    </div>
  );
}
