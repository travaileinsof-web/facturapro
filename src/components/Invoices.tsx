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
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
    if (res.ok) {
      toast.success(editingInvoice ? 'Facture mise à jour' : 'Facture créée');
      setIsModalOpen(false);
      triggerRefresh('invoices');
      triggerRefresh('stats');
      refetch();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Erreur lors de l'enregistrement de la facture.");
    }
  };

  const deleteInvoice = async (id: string) => {
    if(!confirm("Supprimer cette facture ?")) return;
    const res = await apiFetch(`/api/invoices/${id}`, { method: 'DELETE' });
    if(res.ok) {
       toast.success("Facture supprimée");
       triggerRefresh('invoices');
       triggerRefresh('stats');
       refetch();
    } else {
       const err = await res.json().catch(() => ({}));
       toast.error(err.error || "Erreur de suppression");
    }
  };

  const convertToFacture = async (inv: any, targetType: string) => {
    if(!confirm(`Convertir ce document en ${targetType === 'facture' ? 'Facture' : 'Facture Pro Forma'} ?`)) return;
    const payload = {
      ...inv,
      type: targetType,
      items: safeJSONParse(inv.items)
    };
    const res = await apiFetch(`/api/invoices/${inv.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    if(res.ok) {
       toast.success("Document converti avec succès");
       triggerRefresh('invoices');
       triggerRefresh('stats');
       refetch();
    } else {
       toast.error("Erreur de conversion");
    }
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
        <DialogContent className="sm:max-w-[1400px] w-[95vw] h-[90vh] flex flex-col p-0">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? 'Modifier Document' : 'Nouveau Document'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
            <form id="invoice-form" onSubmit={handleSubmit(onSubmit)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

              {/* — Type de document — */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '10px' }}>Type de document</p>
                <div style={{ display: 'flex', gap: '0px', border: '1px solid var(--border-hover)', width: 'fit-content' }}>
                  {(['facture', 'proforma', 'devis'] as const).map((t) => {
                    const labels: Record<string, string> = { facture: 'Facture', proforma: 'Pro Forma', devis: 'Devis' };
                    const isActive = watch('type') === t;
                    return (
                      <label key={t} style={{ cursor: 'pointer', padding: '8px 20px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.3px', background: isActive ? 'var(--gold)' : 'var(--surface)', color: isActive ? '#000' : 'var(--foreground-muted)', borderRight: t !== 'devis' ? '1px solid var(--border-hover)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="radio" value={t} {...register('type')} style={{ display: 'none' }} />
                        {labels[t]}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* — Client + Date — */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold tracking-wide uppercase text-[var(--foreground-subtle)] mb-1.5">Client *</label>
                  <select {...register('clientId')} className="fp-input w-full">
                    <option value="">— Sélectionner un client —</option>
                    {clients?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wide uppercase text-[var(--foreground-subtle)] mb-1.5">Date d'échéance</label>
                  <input type="date" className="fp-input w-full" {...register('dueDate')} />
                  <p className="text-[10px] text-[var(--foreground-muted)] mt-1">Requis pour les relances automatiques.</p>
                </div>
              </div>

              {/* — Articles — */}
              <div style={{ border: '1px solid var(--border-hover)', background: 'var(--surface-2)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--surface)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', flex: '1 1 0', paddingLeft: '228px' }}>Description</p>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', width: '80px', textAlign: 'right', flexShrink: 0 }}>Qté</p>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', width: '110px', textAlign: 'right', flexShrink: 0 }}>Prix U.</p>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', width: '120px', textAlign: 'right', flexShrink: 0 }}>Total</p>
                  <div style={{ width: '38px', flexShrink: 0 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  {fields.map((field, index) => (
                    <div key={field.id} style={{ display: 'flex', gap: '0px', alignItems: 'stretch', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: '220px', flexShrink: 0, borderRight: '1px solid var(--border)' }}>
                        <select onChange={(e) => handleCatalogSelect(index, e.target.value)} defaultValue="" style={{ width: '100%', height: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--foreground-muted)', fontSize: '12px', fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none' }}>
                          <option value="">Catalogue...</option>
                          {catalogItems?.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1, borderRight: '1px solid var(--border)' }}>
                        <input style={{ width: '100%', height: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none' }} placeholder="Description de l'article ou du service" {...register(`items.${index}.description` as const, { required: true })} />
                      </div>
                      <div style={{ width: '80px', flexShrink: 0, borderRight: '1px solid var(--border)' }}>
                        <input style={{ width: '100%', height: '100%', padding: '10px 10px', background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '13px', textAlign: 'right', fontFamily: 'var(--font-mono)', outline: 'none' }} type="number" placeholder="1" {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} />
                      </div>
                      <div style={{ width: '110px', flexShrink: 0, borderRight: '1px solid var(--border)' }}>
                        <input style={{ width: '100%', height: '100%', padding: '10px 10px', background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '13px', textAlign: 'right', fontFamily: 'var(--font-mono)', outline: 'none' }} type="number" placeholder="0" {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })} />
                      </div>
                      <div style={{ width: '120px', flexShrink: 0, textAlign: 'right', fontWeight: 600, fontSize: '13px', color: 'var(--foreground)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px', borderRight: '1px solid var(--border)' }}>
                        {formatCurrency((isNaN(watchItems[index]?.quantity) ? 0 : watchItems[index]?.quantity || 0) * (isNaN(watchItems[index]?.unitPrice) ? 0 : watchItems[index]?.unitPrice || 0))}
                      </div>
                      <button type="button" style={{ width: '38px', flexShrink: 0, background: 'transparent', border: 'none', color: 'var(--foreground-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--destructive)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--foreground-subtle)')} onClick={() => remove(index)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '12px 20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" style={{ padding: '7px 14px', background: 'transparent', border: '1px solid var(--border-hover)', color: 'var(--foreground-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', letterSpacing: '0.2px' }} onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>
                    <Plus size={12} /> Ajouter une ligne
                  </button>
                  <CurrencyConverter />
                </div>
              </div>

              {/* — Notes + Totaux — */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {editingInvoice && (
                    <div style={{ padding: '12px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Statut actuel</p>
                      <span className={`fp-badge ${editingInvoice.status === 'payée' ? 'fp-badge-green' : editingInvoice.status === 'envoyée' ? 'fp-badge-blue' : 'fp-badge-neutral'}`} style={{ textTransform: 'capitalize' }}>{editingInvoice.status === 'brouillon' ? 'Non entamée' : editingInvoice.status}</span>
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Remarques / Conditions</label>
                    <textarea {...register('notes')} style={{ width: '100%', minHeight: '140px', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)', resize: 'vertical' }} placeholder="Conditions de paiement, mentions légales..." />
                  </div>
                </div>

                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-hover)', padding: '0' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--foreground-subtle)' }}>Récapitulatif</p>
                  </div>
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>Sous-total HT</span>
                      <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--foreground)' }}>{formatCurrency(subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--foreground-muted)', whiteSpace: 'nowrap' }}>TVA (%)</span>
                      <input type="number" style={{ width: '90px', padding: '7px 10px', background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', fontSize: '13px', textAlign: 'right', fontFamily: 'var(--font-mono)' }} {...register('taxRate', { valueAsNumber: true })} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--foreground-muted)', whiteSpace: 'nowrap' }}>Remise</span>
                      <input type="number" style={{ width: '110px', padding: '7px 10px', background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', fontSize: '13px', textAlign: 'right', fontFamily: 'var(--font-mono)' }} {...register('discount', { valueAsNumber: true })} />
                    </div>
                    <div style={{ paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--border-hover)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.6px' }}>Total TTC</span>
                      <span style={{ fontWeight: 800, fontSize: '24px', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              </div>{/* end flex col */}
            </form>
          </div>
          <DialogFooter>
             <button type="button" className="fp-btn-outline" onClick={() => setIsModalOpen(false)}>Annuler</button>
             <button form="invoice-form" type="submit" className="fp-btn-primary">{editingInvoice ? 'Mettre à jour' : 'Enregistrer'}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
