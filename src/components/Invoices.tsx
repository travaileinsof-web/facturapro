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
import { PageHeader } from './ui/PageHeader';
import { Plus, Trash2, FileTextIcon } from 'lucide-react';
import { buildInvoiceHTML } from '../lib/pdfTemplate';
import { exportHTMLToPDF, generatePDFBase64 } from '../lib/pdfExport';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Pagination } from './ui/pagination';
import { Textarea } from './ui/textarea';
import { Field } from './ui/Field';


export function Invoices() {
  const refreshInvoices = useAppStore(state => state.refreshInvoices);
  const refreshClients = useAppStore(state => state.refreshClients);
  const triggerRefresh = useAppStore(state => state.triggerRefresh);
  const currency = useAppStore(state => state.user?.currency) || 'FCFA';
  const [filterType, setFilterType] = useState('tous');
  const [filterStatus, setFilterStatus] = useState('toutes');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [invoiceToConvert, setInvoiceToConvert] = useState<{ inv: any, targetType: string } | null>(null);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterStatus]);

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
      triggerRefresh('reminders');
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

  const confirmDeleteInvoice = async () => {
    if(!invoiceToDelete) return;
    const id = invoiceToDelete;
    const promise = apiFetch(`/api/invoices/${id}`, { method: 'DELETE' }).then(async (res) => {
      if(!res.ok) throw new Error("Erreur de suppression");
      triggerRefresh('invoices');
      triggerRefresh('reminders');
      triggerRefresh('stats');
      refetch();
      return true;
    });

    toast.promise(promise, {
      loading: 'Suppression...',
      success: 'Facture supprimée',
      error: 'Erreur de suppression'
    });
    setInvoiceToDelete(null);
  };

  const confirmConvertToFacture = async () => {
    if(!invoiceToConvert) return;
    const { inv, targetType } = invoiceToConvert;
    const payload = {
      ...inv,
      type: targetType,
      items: safeJSONParse(inv.items)
    };
    
    const promise = apiFetch(`/api/invoices/${inv.id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(async (res) => {
      if(!res.ok) throw new Error("Erreur de conversion");
      triggerRefresh('invoices');
      triggerRefresh('reminders');
      triggerRefresh('stats');
      refetch();
      return true;
    });

    toast.promise(promise, {
      loading: 'Conversion...',
      success: 'Document converti avec succès',
      error: 'Erreur de conversion'
    });
    setInvoiceToConvert(null);
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
      baseMsg = baseMsg.replace(/\{amount\}/g, formatCurrency(inv.total) || '');
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

    const toastId = toast.loading("Génération du PDF en cours...");
    try {
      const [settingsRes, invRes] = await Promise.all([
        apiFetch('/api/settings'),
        apiFetch(`/api/invoices/${inv.id}`)
      ]);
      const settings = await settingsRes.json();
      const fullInv = await invRes.json();
      const html = buildInvoiceHTML(fullInv, settings);

      await exportHTMLToPDF(html, `Facture_${inv.number}`);
      toast.success("Fenêtre d'impression ouverte !", { id: toastId });
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de la génération du PDF", { id: toastId });
    }
  };

  const filteredInvoices = invoices?.filter((inv: any) => filterType === 'tous' || inv.type === filterType) || [];
  const totalPages = Math.ceil((filteredInvoices.length || 0) / ITEMS_PER_PAGE);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Factures & Devis" 
        description="Créez, envoyez et suivez vos documents de facturation."
        icon={<FileTextIcon size={20} />}
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
            {isLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Chargement...</td></tr>
            ) : filteredInvoices.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Aucune facture trouvée</td></tr>
            ) : paginatedInvoices.map((inv: any) => {
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
                         <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => setInvoiceToConvert({ inv, targetType: 'proforma' })}>Pro Forma</button>
                         <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => setInvoiceToConvert({ inv, targetType: 'facture' })}>Facture</button>
                       </>
                     )}
                     {inv.type === 'proforma' && (
                       <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => setInvoiceToConvert({ inv, targetType: 'facture' })}>Facture</button>
                     )}
                     <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => downloadPDF(inv)}>PDF</button>
                     <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid #25D366', color: '#25D366', cursor: 'pointer' }} onClick={() => shareViaWhatsApp(inv)}>WA</button>
                     <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => shareViaEmail(inv)}>@</button>
                     <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer' }} onClick={() => openEdit(inv)}>Modifier</button>
                     <button style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--destructive)', cursor: 'pointer' }} title={inv.receipts?.length ? "Impossible : Reçus associés" : ""} onClick={() => { if(!inv.receipts?.length) setInvoiceToDelete(inv.id); }}>Sup.</button>
                   </div>
                 </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
        className="mt-4"
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-5xl max-w-5xl p-0 h-[90vh]">
          <DialogHeader 
            className="shrink-0"
            icon={FileTextIcon}
            title={editingInvoice ? 'Modifier Document' : 'Nouveau Document'}
            desc="Remplissez les détails de la facture, du devis ou du pro forma."
          />
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--background)]">
            <form id="invoice-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
              <div style={{ padding: '40px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* — Type de document — */}
                <div style={{ gridColumn: 'span 2' }}>
                  <Field label="Type de document">
                    <div className="flex gap-5">
                      {(['facture', 'proforma', 'devis'] as const).map((t) => {
                        const labels: Record<string, string> = { facture: 'Facture', proforma: 'Pro Forma', devis: 'Devis' };
                        const isActive = watch('type') === t;
                        return (
                          <label key={t} className={`cursor-pointer px-10 py-4 text-[14px] font-semibold rounded-none border transition-all duration-200 text-center min-w-[140px] ${isActive ? 'bg-[var(--gold-dim)] border-[var(--gold)] text-[var(--gold)] shadow-sm' : 'bg-white border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--foreground-subtle)] hover:text-[var(--foreground)]'}`}>
                            <input type="radio" value={t} {...register('type')} className="hidden" />
                            {labels[t]}
                          </label>
                        );
                      })}
                    </div>
                  </Field>
                </div>

                {/* — Client + Date — */}
                <Field label={<>Client <span style={{ color: 'var(--primary)' }}>*</span></>}>
                  <select {...register('clientId')} className="fp-input w-full bg-white shadow-sm">
                    <option value="">— Sélectionner un client —</option>
                    {clients?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Date d'échéance" hint="Requis pour relances auto.">
                  <input type="date" className="fp-input w-full bg-white shadow-sm" {...register('dueDate')} />
                </Field>
              </div>

              {/* — Articles — */}
              <div className="flex flex-col border-t border-b border-[var(--border)] overflow-hidden bg-white shadow-sm mt-2">
                <div className="grid grid-cols-[250px_1fr_100px_130px_130px_50px] gap-6 bg-[var(--surface-2)] border-b border-[var(--border)] px-8 py-5">
                  <div className="text-[12px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Article / Service</div>
                  <div className="text-[12px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Description</div>
                  <div className="text-[12px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider text-right">Qté</div>
                  <div className="text-[12px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider text-right">Prix Unitaire</div>
                  <div className="text-[12px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider text-right">Total</div>
                  <div></div>
                </div>
                <div className="flex flex-col p-8 gap-6 bg-[var(--surface-1)]">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[250px_1fr_100px_130px_130px_50px] gap-6 items-center bg-white p-4 rounded-none border border-[var(--border)] shadow-sm group hover:border-[var(--border-hover)] transition-colors">
                      <div>
                        <select onChange={(e) => handleCatalogSelect(index, e.target.value)} defaultValue="" className="fp-input w-full bg-[var(--surface)] text-[13px] text-[var(--foreground)] cursor-pointer">
                          <option value="">Sélectionner...</option>
                          {catalogItems?.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input className="fp-input w-full text-[13px] text-[var(--foreground)] placeholder-[var(--foreground-muted)]" placeholder="Description de l'article" {...register(`items.${index}.description` as const, { required: true })} />
                      </div>
                      <div>
                        <input className="fp-input w-full text-[13px] text-right font-mono text-[var(--foreground)]" type="number" placeholder="1" {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} />
                      </div>
                      <div>
                        <input className="fp-input w-full text-[13px] text-right font-mono text-[var(--foreground)]" type="number" placeholder="0" {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })} />
                      </div>
                      <div className="text-right font-semibold text-[14px] text-[var(--foreground)] font-mono flex items-center justify-end">
                        {formatCurrency((isNaN(watchItems[index]?.quantity) ? 0 : watchItems[index]?.quantity || 0) * (isNaN(watchItems[index]?.unitPrice) ? 0 : watchItems[index]?.unitPrice || 0))}
                      </div>
                      <button type="button" className="flex items-center justify-center w-8 h-8 rounded-none text-[var(--foreground-subtle)] hover:text-[var(--destructive)] hover:bg-red-50 transition-colors mx-auto" onClick={() => remove(index)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="px-10 py-8 bg-[var(--surface-1)] border-t border-[var(--border)] flex items-center justify-start">
                  <button type="button" className="flex items-center gap-3 text-[14px] font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors px-6 py-3 border border-dashed border-[var(--primary)] rounded-none hover:bg-blue-50/50" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>
                    <Plus size={18} /> Ajouter une ligne
                  </button>
                </div>
              </div>

              {/* — Notes + Totaux — */}
              <div style={{ padding: '40px 48px' }} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
                <div className="flex flex-col gap-6">
                  {editingInvoice && (
                    <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm px-6 py-4 flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-[var(--foreground)]">Statut actuel du document</p>
                      <span className={`fp-badge ${editingInvoice.status === 'payée' ? 'fp-badge-green' : editingInvoice.status === 'envoyée' ? 'fp-badge-blue' : 'fp-badge-neutral'} capitalize`}>{editingInvoice.status === 'brouillon' ? 'Non entamée' : editingInvoice.status}</span>
                    </div>
                  )}
                  <Field label="Remarques / Conditions">
                    <textarea {...register('notes')} className="fp-input w-full min-h-[140px] resize-y bg-white shadow-sm" placeholder="Conditions de paiement, mentions légales, informations bancaires..." />
                  </Field>
                </div>

                <div className="bg-[var(--surface-2)] rounded-xl border border-[var(--border)] overflow-hidden flex flex-col">
                  <div className="px-8 py-6 border-b border-[var(--border)] bg-[var(--surface-1)]">
                    <h3 className="text-[14px] font-bold tracking-wide uppercase text-[var(--foreground)]">Récapitulatif</h3>
                  </div>
                  <div className="p-10 flex flex-col gap-8">
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] font-medium text-[var(--foreground-subtle)]">Sous-total HT</span>
                      <span className="text-[15px] font-semibold font-mono text-[var(--foreground)]">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[14px] font-medium text-[var(--foreground-subtle)]">TVA (%)</span>
                      <input type="number" className="fp-input w-[120px] text-right font-mono bg-white" style={{ padding: '12px 16px' }} {...register('taxRate', { valueAsNumber: true })} />
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[14px] font-medium text-[var(--foreground-subtle)]">Remise globale</span>
                      <div className="relative">
                        <input type="number" className="fp-input w-[140px] text-right font-mono pr-10 bg-white" style={{ padding: '12px 16px' }} {...register('discount', { valueAsNumber: true })} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[var(--foreground-muted)]">{currency}</span>
                      </div>
                    </div>
                    <div className="pt-8 mt-4 border-t-2 border-[var(--border)] flex justify-between items-end">
                      <span className="text-[15px] font-bold uppercase tracking-wider text-[var(--foreground)]">Total TTC</span>
                      <span className="text-4xl font-bold font-mono text-[var(--primary)]">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>
          <DialogFooter className="shrink-0">
             <button type="button" className="fp-btn-outline" onClick={() => setIsModalOpen(false)}>Annuler</button>
             <button type="submit" form="invoice-form" className="fp-btn-primary">Sauvegarder le document</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ConfirmDialog
        open={!!invoiceToDelete}
        onOpenChange={(open) => !open && setInvoiceToDelete(null)}
        title="Supprimer cette facture ?"
        description="Cette action est irréversible. Les reçus associés pourraient être impactés."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={confirmDeleteInvoice}
      />

      <ConfirmDialog
        open={!!invoiceToConvert}
        onOpenChange={(open) => !open && setInvoiceToConvert(null)}
        title={`Convertir en ${invoiceToConvert?.targetType === 'facture' ? 'Facture' : 'Facture Pro Forma'} ?`}
        description="Le statut de ce document sera mis à jour de façon permanente."
        confirmLabel="Convertir"
        cancelLabel="Annuler"
        variant="primary"
        onConfirm={confirmConvertToFacture}
      />
    </div>
  );
}
