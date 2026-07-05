import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate, useAppStore, safeJSONParse, apiFetch } from '../lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { buildReceiptHTML } from '../lib/pdfTemplate';
import { exportHTMLToPDF, generatePDFBase64 } from '../lib/pdfExport';

export function Receipts() {
  const refreshReceipts = useAppStore(state => state.refreshReceipts);
  const refreshClients = useAppStore(state => state.refreshClients);
  const triggerRefresh = useAppStore(state => state.triggerRefresh);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);

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
      triggerRefresh('clients');
      triggerRefresh('stats');
      refetch();
    } else {
       const err = await res.json().catch(() => ({}));
       toast.error(err.error || 'Erreur lors de la création du reçu');
    }
  };

  const deleteReceipt = async (id: string) => {
    if(!confirm("Supprimer ce reçu (L'état de la facture liée sera recalculé) ?")) return;
    const res = await apiFetch(`/api/receipts/${id}`, { method: 'DELETE' });
    if(res.ok) {
       toast.success("Reçu supprimé");
       triggerRefresh('receipts');
       triggerRefresh('invoices');
       triggerRefresh('stats');
       refetch();
    } else {
       const err = await res.json().catch(() => ({}));
       toast.error(err.error || "Erreur de suppression");
    }
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
    let phone = rec.client?.phone || "";
    if (phone) phone = phone.replace(/[^0-9]/g, '');
    
    const toastId = toast.loading("Génération du lien WhatsApp...");
    try {
      const [settingsRes, recRes] = await Promise.all([
        fetch('/api/settings'),
        fetch(`/api/receipts/${rec.id}`)
      ]);
      const settings = await settingsRes.json();
      const fullRec = await recRes.json();
      const html = buildReceiptHTML(fullRec, settings);
      const pdfBase64 = await generatePDFBase64(html);
      
      // Enregistrer le PDF sur le serveur pour obtenir un lien public
      const shareRes = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'whatsapp',
          pdfBase64: pdfBase64,
          filename: `Recu_${rec.number}.pdf`
        })
      });
      const shareData = await shareRes.json();
      if (!shareRes.ok || !shareData.success) {
        throw new Error(shareData.error || "Erreur de génération du lien PDF");
      }
      
      const pdfUrl = shareData.url;
      
      // Templating dynamique
      let baseMsg = settings.whatsappMessage ? settings.whatsappMessage : `Bonjour {client_name},\n\nVoici votre reçu *{document_number}* d'un montant de *{amount}*.`;
      
      baseMsg = baseMsg.replace(/\{client_name\}/g, rec.client?.name || '');
      baseMsg = baseMsg.replace(/\{document_number\}/g, rec.number || '');
      baseMsg = baseMsg.replace(/\{amount\}/g, formatCurrency(rec.amount) || '');
      baseMsg = baseMsg.replace(/\{company_name\}/g, fullRec.company?.name || settings.companyName || '');
      
      const finalMsg = `${baseMsg}\n\n📄 Voici votre document : ${pdfUrl}`;
      const encodedMsg = encodeURIComponent(finalMsg);
      
      const waUrl = phone ? `https://wa.me/${phone}?text=${encodedMsg}` : `https://wa.me/?text=${encodedMsg}`;
      window.open(waUrl, '_blank');
      
      toast.success("Redirection vers WhatsApp...", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Erreur", { id: toastId });
    }
  };

  const downloadPDF = async (rec: any) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      toast.error('Autorisez les popups pour ce site pour générer le PDF.');
      return;
    }

    const toastId = toast.loading("Génération du PDF en cours...");
    try {
      const [settingsRes, recRes] = await Promise.all([
        fetch('/api/settings'),
        fetch(`/api/receipts/${rec.id}`)
      ]);
      const settings = await settingsRes.json();
      const fullRec = await recRes.json();
      if (!fullRec || !fullRec.id) throw new Error('Reçu introuvable');
      const html = buildReceiptHTML(fullRec, settings);
      
      printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print { body { margin: 0; } @page { margin: 0; size: A4; } .no-print { display: none !important; } }
  </style>
</head>
<body>
${html}
<div class="no-print" style="text-align:center;padding:20px;background:#f1f5f9;border-top:1px solid #e2e8f0;">
  <p style="color:#64748b;font-size:13px;margin-bottom:12px;">Cliquez sur <strong>Imprimer</strong> et choisissez <strong>"Enregistrer en PDF"</strong> comme destination.</p>
  <button onclick="window.print()" style="background:#0f172a;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">🖨 Imprimer / Sauvegarder en PDF</button>
</div>
</body></html>`);
      printWindow.document.close();
      toast.success("Fenêtre d'impression ouverte !", { id: toastId });
    } catch (e: any) {
      printWindow.close();
      toast.error(e?.message || "Erreur lors de la génération PDF", { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="fp-card" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px' }}>
        <button onClick={openNew} className="fp-btn-primary">
          Nouveau Reçu
        </button>
      </div>

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
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--foreground-muted)' }}>Chargement...</td></tr>
            ) : receipts?.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px' }}>
                  <div style={{ fontSize: '24px', opacity: 0.5, marginBottom: '8px' }}>🧾</div>
                  <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>Aucun reçu enregistré</div>
                </td>
              </tr>
            ) : (
              receipts?.map((rec: any) => (
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
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="fp-btn-ghost" onClick={() => downloadPDF(rec)} title="Générer PDF">
                        PDF
                      </button>
                      <button className="fp-btn-ghost" onClick={() => shareViaEmail(rec)} title="Envoyer par Email">
                        @
                      </button>
                      <button className="fp-btn-danger" onClick={() => deleteReceipt(rec.id)}>
                        Sup.
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-w-2xl" style={{ borderRadius: 0, background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.15)', padding: 0 }}>
          <DialogHeader style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
            <DialogTitle style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>Nouveau Reçu</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Client *</label>
              <select style={{ width: '100%', padding: '10px 36px 10px 12px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)', cursor: 'pointer', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }} {...register('clientId', { required: true })}>
                <option value="">Sélectionner un client</option>
                {clients?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Facture associée (Optionnel)</label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between font-normal h-[42px] fp-input"
                      style={{ border: '1px solid var(--border)', borderRadius: 0, height: '42px' }}
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
                               value={`${inv.number} ${summary}`} // searchable by number and summary
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

              {selectedInvoice && (
                 <div className="mt-3 p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-lg text-sm max-h-40 overflow-y-auto" style={{ borderRadius: 0, border: '1px solid var(--emerald)', background: 'rgba(16,185,129,0.05)' }}>
                    <div className="flex justify-between items-center mb-2">
                       <p className="font-semibold text-emerald-800" style={{ color: 'var(--emerald)' }}>Aperçu Facture {selectedInvoice.number}</p>
                       <p className="font-medium text-emerald-900" style={{ color: 'var(--emerald)' }}>Reste: {formatCurrency(selectedInvoice.amountRemaining || 0)}</p>
                    </div>
                    <ul className="text-slate-600 mt-1 list-disc list-inside space-y-1">
                      {safeJSONParse(selectedInvoice.items).map((it:any, idx: number) => (
                         <li key={idx}>
                            <span className="font-medium text-slate-700">{it.description}</span> (x{it.quantity}) - {formatCurrency(it.unitPrice)}
                         </li>
                      ))}
                    </ul>
                 </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Montant *</label>
                  <input type="number" step="0.01" style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)' }} {...register('amount', { required: true, valueAsNumber: true })} />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Date de Paiement *</label>
                  <input type="date" style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)' }} {...register('paymentDate', { required: true })} />
               </div>
               <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Mode de Paiement *</label>
                  <select style={{ width: '100%', padding: '10px 36px 10px 12px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)', cursor: 'pointer', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }} {...register('paymentMethod')}>
                     <option value="virement_bancaire">Virement Bancaire</option>
                     <option value="especes">Espèces</option>
                     <option value="cheque">Chèque</option>
                     <option value="mobile_money">Mobile Money</option>
                  </select>
               </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Notes Complémentaires</label>
              <textarea {...register('notes')} style={{ width: '100%', minHeight: '80px', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)', resize: 'vertical' }} />
            </div>

            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button type="submit" className="fp-btn-primary">Enregistrer le Reçu</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
