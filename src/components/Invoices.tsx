import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate, useAppStore, safeJSONParse, apiFetch } from '../lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { CurrencyConverter } from './CurrencyConverter';
import { PageHeader } from './ui/PageHeader';
import { Plus, Trash2 } from 'lucide-react';
import { buildInvoiceHTML } from '../lib/pdfTemplate';
import { exportHTMLToPDF, generatePDFBase64 } from '../lib/pdfExport';


export function Invoices() {
  const refreshInvoices = useAppStore(state => state.refreshInvoices);
  const refreshClients = useAppStore(state => state.refreshClients);
  const triggerRefresh = useAppStore(state => state.triggerRefresh);
  const [filterType, setFilterType] = useState('tous');
  const [filterStatus, setFilterStatus] = useState('toutes');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['invoices', refreshInvoices, filterStatus],
    queryFn: async () => {
      const res = await apiFetch(`/api/invoices?status=${filterStatus}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: clients } = useQuery({
    queryKey: ['clientsForInvoice', refreshClients],
    queryFn: async () => {
      const res = await apiFetch(`/api/clients`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { register, control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      clientId: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      taxRate: 0,
      discount: 0,
      notes: '',
      status: 'brouillon',
      type: 'facture',
      dueDate: ''
    }
  });

  const { data: catalogItems } = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const res = await apiFetch('/api/catalog');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { fields, append, remove, insert, update } = useFieldArray({
    control,
    name: 'items'
  });

  const handleCatalogSelect = (index: number, catalogId: string) => {
    const item = catalogItems?.find((i: any) => i.id === catalogId);
    if (item) {
       if (item.type === 'pack') {
           const components = typeof item.components === 'string' ? safeJSONParse(item.components, []) : (item.components || []);
           if (components.length > 0) {
              update(index, { description: components[0].name, quantity: components[0].quantity || 1, unitPrice: components[0].unitPrice || 0 });
              for (let i = 1; i < components.length; i++) {
                 insert(index + i, { description: components[i].name, quantity: components[i].quantity || 1, unitPrice: components[i].unitPrice || 0 });
              }
           } else {
              update(index, { description: item.name, quantity: 1, unitPrice: item.unitPrice });
           }
       } else {
           update(index, { description: item.name, quantity: 1, unitPrice: item.unitPrice });
       }
    }
  };

  const watchItems = watch('items');
  const watchTaxRate = watch('taxRate');
  const watchDiscount = watch('discount');

  let subtotal = 0;
  watchItems?.forEach(item => {
    const qty = isNaN(item.quantity) ? 0 : (item.quantity || 0);
    const price = isNaN(item.unitPrice) ? 0 : (item.unitPrice || 0);
    subtotal += qty * price;
  });
  const taxAmount = subtotal * (isNaN(watchTaxRate) ? 0 : ((watchTaxRate || 0) / 100));
  const total = subtotal + taxAmount - (isNaN(watchDiscount) ? 0 : (watchDiscount || 0));

  const openNew = () => {
    setEditingInvoice(null);
    reset({ clientId: '', items: [{ description: '', quantity: 1, unitPrice: 0 }], taxRate: 0, discount: 0, notes: '', type: 'facture' });
    setIsModalOpen(true);
  };

  const openEdit = (invoice: any) => {
    setEditingInvoice(invoice);
    reset({
      clientId: invoice.clientId,
      items: safeJSONParse(invoice.items),
      taxRate: invoice.taxRate,
      discount: invoice.discount,
      notes: invoice.notes || '',
      status: invoice.status || 'brouillon',
      type: invoice.type || 'facture',
      dueDate: invoice.dueDate || ''
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    if (!data.clientId) {
      toast.error("Veuillez sélectionner un client pour la facture.");
      return;
    }

    const payload = {
      clientId: data.clientId,
      items: data.items,
      subtotal,
      taxRate: Number(data.taxRate),
      taxAmount,
      discount: Number(data.discount),
      total,
      notes: data.notes,
      status: data.status || 'brouillon',
      type: data.type || 'facture',
      dueDate: data.dueDate || null
    };

    const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : '/api/invoices';
    const method = editingInvoice ? 'PUT' : 'POST';
    setIsModalOpen(false); // UI reacts instantly

    const promise = apiFetch(url, { method, body: JSON.stringify(payload) }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de l'enregistrement de la facture.");
      }
      triggerRefresh('invoices');
      triggerRefresh('stats');
      refetch();
      return true;
    });

    toast.promise(promise, {
      loading: 'Enregistrement en cours...',
      success: editingInvoice ? 'Facture mise à jour' : 'Facture créée',
      error: (err) => err.message
    });
  };

  const deleteInvoice = async (id: string) => {
    if(!confirm("Supprimer cette facture ?")) return;
    
    const promise = apiFetch(`/api/invoices/${id}`, { method: 'DELETE' }).then(async (res) => {
      if(!res.ok) throw new Error("Erreur de suppression");
      triggerRefresh('invoices');
      triggerRefresh('stats');
      refetch();
      return true;
    });

    toast.promise(promise, {
      loading: 'Suppression...',
      success: 'Facture supprimée',
      error: 'Erreur de suppression'
    });
  };

  const convertToFacture = async (inv: any, targetType: string) => {
    if(!confirm(`Convertir ce document en ${targetType === 'facture' ? 'Facture' : 'Facture Pro Forma'} ?`)) return;
    const payload = {
      ...inv,
      type: targetType,
      items: safeJSONParse(inv.items)
    };
    
    const promise = apiFetch(`/api/invoices/${inv.id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(async (res) => {
      if(!res.ok) throw new Error("Erreur de conversion");
      triggerRefresh('invoices');
      triggerRefresh('stats');
      refetch();
      return true;
    });

    toast.promise(promise, {
      loading: 'Conversion...',
      success: 'Document converti avec succès',
      error: 'Erreur de conversion'
    });
  };

  const shareViaWhatsApp = async (inv: any) => {
    const toastId = toast.loading("Génération du lien WhatsApp...");
    try {
      const [settingsRes, invRes] = await Promise.all([
        apiFetch('/api/settings'),
        apiFetch(`/api/invoices/${inv.id}`)
      ]);
      const settings = await settingsRes.json();
      const fullInv = await invRes.json();
      
      let phone = fullInv.client?.phone || inv.client?.phone || "";
      if (phone) phone = phone.replace(/[^0-9]/g, '');
      
      const html = buildInvoiceHTML(fullInv, settings);
      const pdfBase64 = await generatePDFBase64(html);
      
      const shareRes = await apiFetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'whatsapp',
          pdfBase64: pdfBase64,
          filename: `Facture_${inv.number}.pdf`
        })
      });
      const shareData = await shareRes.json();
      
      let finalMsg = "";
      
      // Templating
      let baseMsg = settings.whatsappMessage ? settings.whatsappMessage : `Bonjour {client_name},\n\nVoici votre facture {document_number} d'un montant de {amount}.\n\nCordialement, {company_name}`;
      
      baseMsg = baseMsg.replace(/\{client_name\}/g, fullInv.client?.name || inv.client?.name || '');
      baseMsg = baseMsg.replace(/\{document_number\}/g, inv.number || '');
      baseMsg = baseMsg.replace(/\{amount\}/g, formatCurrency(inv.totalTTC) || '');
      baseMsg = baseMsg.replace(/\{company_name\}/g, fullInv.company?.name || settings.companyName || '');
      
      if (!shareRes.ok && shareData.error?.includes("Vercel Blob")) {
        // Fallback: download locally
        const link = document.createElement('a');
        link.href = pdfBase64;
        link.download = `Facture_${inv.number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        finalMsg = `${baseMsg}\n\n(Veuillez joindre manuellement le PDF qui vient d'être téléchargé sur votre appareil)`;
        toast.success("PDF téléchargé. Ajoutez-le dans WhatsApp !", { id: toastId });
      } else if (!shareRes.ok || !shareData.success) {
        throw new Error(shareData.error || "Erreur de lien PDF");
      } else {
        finalMsg = `${baseMsg}\n\n📄 Votre document : ${shareData.url}`;
        toast.success("Redirection vers WhatsApp...", { id: toastId });
      }
      
      const encodedMsg = encodeURIComponent(finalMsg);
      const waUrl = phone ? `https://wa.me/${phone}?text=${encodedMsg}` : `https://wa.me/?text=${encodedMsg}`;
      window.open(waUrl, '_blank');
    } catch (err: any) {
      toast.error(err.message || "Erreur", { id: toastId });
    }
  };

  const shareViaEmail = async (inv: any) => {
    const email = prompt("Adresse email du client :", inv.client?.email || "");
    if (!email) return;
    
    const toastId = toast.loading("Génération et envoi...");
    try {
      const [settingsRes, invRes] = await Promise.all([
        apiFetch('/api/settings'),
        apiFetch(`/api/invoices/${inv.id}`)
      ]);
      const settings = await settingsRes.json();
      const fullInv = await invRes.json();
      const html = buildInvoiceHTML(fullInv, settings);
      const pdfBase64 = await generatePDFBase64(html);
      
      const res = await apiFetch('/api/share', {
        method: 'POST',
        body: JSON.stringify({
          type: 'email',
          to: email,
          subject: `Facture ${inv.number}`,
          message: `Bonjour,\n\nVeuillez trouver ci-joint votre facture ${inv.number} d'un montant de ${formatCurrency(inv.total)}.\n\nCordialement,`,
          filename: `Facture_${inv.number}.pdf`,
          pdfBase64,
          companyId: inv.companyId
        })
      });
      
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success("Email envoyé avec succès !", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Erreur", { id: toastId });
    }
  };

  const downloadPDF = async (inv: any) => {
    // IMPORTANT: window.open() DOIT être appelé AVANT tout await
    // sinon les navigateurs bloquent le popup (politique de sécurité)
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      toast.error('Autorisez les popups pour ce site pour générer le PDF.');
      return;
    }

    const toastId = toast.loading("Génération du PDF en cours...");
    try {
      const [settingsRes, invRes] = await Promise.all([
        apiFetch('/api/settings'),
        apiFetch(`/api/invoices/${inv.id}`)
      ]);
      const settings = await settingsRes.json();
      const fullInv = await invRes.json();
      const html = buildInvoiceHTML(fullInv, settings);

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
      toast.error(e?.message || "Erreur lors de la génération du PDF", { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Factures & Devis" 
        description="Créez, envoyez et suivez vos documents de facturation."
        actions={
          <>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select 
                className="fp-input"
                style={{ width: 'auto', minWidth: '220px' }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="tous">Tous les documents</option>
                <option value="facture">Factures uniquement</option>
                <option value="proforma">Pro Formas uniquement</option>
                <option value="devis">Devis uniquement</option>
              </select>
              <select 
                className="fp-input"
                style={{ width: 'auto', minWidth: '180px' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="toutes">Tous les statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="envoyee">Envoyée</option>
                <option value="partiellement_payee">Partiellement Payée</option>
                <option value="payee">Payée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
            <button onClick={openNew} className="fp-btn-primary">
              Nouvelle Facture
            </button>
          </>
        }
      />

      <div className="fp-card overflow-hidden">
        <table className="fp-table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Client</th>
              <th>Date Emission</th>
              <th>Total TTC</th>
              <th>Déjà Payé</th>
              <th>Reste à Payer</th>
              <th>Statut</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.filter((inv: any) => filterType === 'tous' || inv.type === filterType).map((inv: any) => {
               const paid = (inv.receipts || []).reduce((sum: number, r: any) => sum + r.amount, 0);
               const reste = inv.total - paid;
               return (
              <tr key={inv.id}>
                <td style={{ fontWeight: 600 }}>
                  {inv.number}
                  {inv.type === 'devis' && <span className="fp-badge fp-badge-neutral" style={{ marginLeft: '8px' }}>Devis</span>}
                  {inv.type === 'proforma' && <span className="fp-badge fp-badge-neutral" style={{ marginLeft: '8px', background: '#3b82f6', color: 'white', borderColor: '#2563eb' }}>Pro Forma</span>}
                </td>
                <td>{inv.client?.name}</td>
                <td>{formatDate(inv.createdAt)}</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total)}</td>
                <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(inv.amountPaid || 0)}</td>
                <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{formatCurrency(inv.amountRemaining || 0)}</td>
                <td>
                   <span className={`fp-badge ${
                      inv.status === 'payée' ? 'fp-badge-green' :
                      inv.status === 'partielle' ? 'fp-badge-gold' :
                      inv.status === 'envoyée' ? 'fp-badge-blue' :
                      'fp-badge-neutral'
                    }`}>
                      {inv.status === 'brouillon' ? 'Non entamée' : inv.status}
                    </span>
                </td>
                 <td>
                   <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                     {inv.type === 'devis' && (
                       <>
                         <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => convertToFacture(inv, 'proforma')}>Pro Forma</button>
                         <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => convertToFacture(inv, 'facture')}>Facture</button>
                       </>
                     )}
                     {inv.type === 'proforma' && (
                       <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => convertToFacture(inv, 'facture')}>Facture</button>
                     )}
                     <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => downloadPDF(inv)}>PDF</button>
                     <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid #25D366', color: '#25D366', cursor: 'pointer' }} onClick={() => shareViaWhatsApp(inv)}>WA</button>
                     <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => shareViaEmail(inv)}>@</button>
                     <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => openEdit(inv)}>Modifier</button>
                     <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--destructive)', cursor: 'pointer' }} title={inv.receipts?.length ? "Impossible : Reçus associés" : ""} onClick={() => { if(!inv.receipts?.length) deleteInvoice(inv.id); }}>Sup.</button>
                   </div>
                 </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-5xl max-w-5xl p-0 overflow-hidden border-0 shadow-2xl h-[90vh] flex flex-col bg-[var(--background)]">
          <DialogHeader className="px-8 py-6 bg-[var(--surface-2)] border-b border-[var(--border)] shrink-0">
            <DialogTitle className="text-xl font-display font-semibold text-[var(--foreground)] tracking-tight">
              {editingInvoice ? 'Modifier Document' : 'Nouveau Document'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-8 py-8 bg-[var(--background)]">
            <form id="invoice-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10">

              {/* — Type de document — */}
              <div>
                <label className="block text-[13px] font-semibold text-[var(--foreground)] mb-3">Type de document</label>
                <div className="flex bg-[var(--surface-2)] rounded-lg p-1 w-fit border border-[var(--border)] shadow-sm">
                  {(['facture', 'proforma', 'devis'] as const).map((t) => {
                    const labels: Record<string, string> = { facture: 'Facture', proforma: 'Pro Forma', devis: 'Devis' };
                    const isActive = watch('type') === t;
                    return (
                      <label key={t} className={`cursor-pointer px-6 py-2 text-[13px] font-semibold rounded-md transition-all duration-200 ${isActive ? 'bg-white text-[var(--foreground)] shadow-sm' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}>
                        <input type="radio" value={t} {...register('type')} className="hidden" />
                        {labels[t]}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* — Client + Date — */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--foreground)] mb-2">Client <span className="text-[var(--primary)]">*</span></label>
                  <select {...register('clientId')} className="fp-input w-full bg-white shadow-sm">
                    <option value="">— Sélectionner un client —</option>
                    {clients?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--foreground)] mb-2 flex justify-between items-center">
                    Date d'échéance
                    <span className="text-[11px] font-normal text-[var(--foreground-muted)]">Requis pour relances auto.</span>
                  </label>
                  <input type="date" className="fp-input w-full bg-white shadow-sm" {...register('dueDate')} />
                </div>
              </div>

              {/* — Articles — */}
              <div className="bg-white rounded-xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="grid grid-cols-[250px_1fr_100px_130px_130px_50px] gap-0 border-b border-[var(--border)] bg-[var(--surface-1)]">
                  <div className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">Catalogue</div>
                  <div className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">Description</div>
                  <div className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)] text-right">Qté</div>
                  <div className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)] text-right">Prix U.</div>
                  <div className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)] text-right">Total</div>
                  <div className="px-5 py-4"></div>
                </div>
                <div className="flex flex-col">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[250px_1fr_100px_130px_130px_50px] gap-0 border-b border-[var(--border)] last:border-0 group hover:bg-[var(--surface-hover)] transition-colors">
                      <div className="border-r border-[var(--border)]">
                        <select onChange={(e) => handleCatalogSelect(index, e.target.value)} defaultValue="" className="w-full h-full px-5 py-4 bg-transparent border-none text-[13px] text-[var(--foreground)] outline-none cursor-pointer">
                          <option value="">Sélectionner...</option>
                          {catalogItems?.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="border-r border-[var(--border)]">
                        <input className="w-full h-full px-5 py-4 bg-transparent border-none text-[13px] text-[var(--foreground)] outline-none placeholder-[var(--foreground-muted)]" placeholder="Description de l'article" {...register(`items.${index}.description` as const, { required: true })} />
                      </div>
                      <div className="border-r border-[var(--border)]">
                        <input className="w-full h-full px-5 py-4 bg-transparent border-none text-[13px] text-right font-mono text-[var(--foreground)] outline-none" type="number" placeholder="1" {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} />
                      </div>
                      <div className="border-r border-[var(--border)]">
                        <input className="w-full h-full px-5 py-4 bg-transparent border-none text-[13px] text-right font-mono text-[var(--foreground)] outline-none" type="number" placeholder="0" {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })} />
                      </div>
                      <div className="px-5 py-4 text-right font-semibold text-[14px] text-[var(--foreground)] font-mono flex items-center justify-end border-r border-[var(--border)]">
                        {formatCurrency((isNaN(watchItems[index]?.quantity) ? 0 : watchItems[index]?.quantity || 0) * (isNaN(watchItems[index]?.unitPrice) ? 0 : watchItems[index]?.unitPrice || 0))}
                      </div>
                      <button type="button" className="flex items-center justify-center text-[var(--foreground-subtle)] hover:text-[var(--destructive)] hover:bg-red-50 transition-colors" onClick={() => remove(index)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-4 bg-[var(--surface-1)] border-t border-[var(--border)] flex items-center justify-between">
                  <button type="button" className="flex items-center gap-2 text-[13px] font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors px-3 py-1.5 rounded-md hover:bg-white" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>
                    <Plus size={14} /> Ajouter une ligne
                  </button>
                  <CurrencyConverter />
                </div>
              </div>

              {/* — Notes + Totaux — */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
                <div className="flex flex-col gap-6">
                  {editingInvoice && (
                    <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm px-6 py-4 flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-[var(--foreground)]">Statut actuel du document</p>
                      <span className={`fp-badge ${editingInvoice.status === 'payée' ? 'fp-badge-green' : editingInvoice.status === 'envoyée' ? 'fp-badge-blue' : 'fp-badge-neutral'} capitalize`}>{editingInvoice.status === 'brouillon' ? 'Non entamée' : editingInvoice.status}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="block text-[13px] font-semibold text-[var(--foreground)]">Remarques / Conditions</label>
                    <textarea {...register('notes')} className="fp-input w-full min-h-[140px] resize-y bg-white shadow-sm" placeholder="Conditions de paiement, mentions légales, informations bancaires..." />
                  </div>
                </div>

                <div className="bg-[var(--surface-2)] rounded-xl border border-[var(--border)] overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-1)]">
                    <h3 className="text-[14px] font-bold tracking-wide uppercase text-[var(--foreground)]">Récapitulatif</h3>
                  </div>
                  <div className="p-6 flex flex-col gap-5">
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-medium text-[var(--foreground-subtle)]">Sous-total HT</span>
                      <span className="text-[14px] font-semibold font-mono text-[var(--foreground)]">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[13px] font-medium text-[var(--foreground-subtle)]">TVA (%)</span>
                      <input type="number" className="fp-input w-[100px] text-right font-mono bg-white" {...register('taxRate', { valueAsNumber: true })} />
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[13px] font-medium text-[var(--foreground-subtle)]">Remise globale</span>
                      <div className="relative">
                        <input type="number" className="fp-input w-[120px] text-right font-mono pr-8 bg-white" {...register('discount', { valueAsNumber: true })} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[var(--foreground-muted)]">€</span>
                      </div>
                    </div>
                    <div className="pt-5 mt-2 border-t-2 border-[var(--border)] flex justify-between items-end">
                      <span className="text-[14px] font-bold uppercase tracking-wider text-[var(--foreground)]">Total TTC</span>
                      <span className="text-3xl font-bold font-mono text-[var(--primary)]">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>
          <DialogFooter className="px-8 py-5 bg-[var(--surface-2)] border-t border-[var(--border)] flex justify-end gap-3 shrink-0">
             <button type="button" className="fp-btn-outline" onClick={() => setIsModalOpen(false)}>Annuler</button>
             <button form="invoice-form" type="submit" className="fp-btn-primary px-8">{editingInvoice ? 'Mettre à jour' : 'Enregistrer le document'}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
