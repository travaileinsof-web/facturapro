import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useAppStore, formatCurrency, formatDate, apiFetch, getWhatsAppUrl } from '../lib/store';
import { PageHeader } from './ui/PageHeader';
import { toast } from 'sonner';
import { MessageCircle, Mail, AlertTriangle, Calendar } from 'lucide-react';
import { buildInvoiceHTML } from '../lib/pdfTemplate';
import { generatePDFBase64 } from '../lib/pdfExport';

export function Reminders() {
  const refreshReminders = useAppStore(state => state.refreshReminders);
  const triggerRefresh = useAppStore(state => state.triggerRefresh);

  const { data: pendingInvoices, isLoading, refetch } = useQuery({
    queryKey: ['reminders', refreshReminders],
    queryFn: async () => {
      const res = await apiFetch(`/api/invoices?status=impayee`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    placeholderData: keepPreviousData,
  });

  const sendReminder = async (inv: any, method: 'whatsapp' | 'email') => {
    const toastId = toast.loading(`Envoi de la relance via ${method}...`);
    try {
      const [settingsRes, invRes] = await Promise.all([
        apiFetch('/api/settings'),
        apiFetch(`/api/invoices/${inv.id}`)
      ]);
      const settings = await settingsRes.json();
      const fullInv = await invRes.json();
      const html = buildInvoiceHTML(fullInv, settings);
      const pdfBase64 = await generatePDFBase64(html);
      
      const message = `Bonjour,\n\nSauf erreur de notre part, la facture ${inv.number} d'un reste à payer de ${formatCurrency(inv.amountRemaining)} est toujours en attente de règlement.\n\nMerci de faire le nécessaire dès que possible.\n\nCordialement,`;

      if (method === 'whatsapp') {
        let phone = fullInv.client?.phone || "";
        if (phone) phone = phone.replace(/[^0-9]/g, '');
        if(!phone) throw new Error("Aucun numéro de téléphone pour ce client");
        
        // Obtenir un lien public vers le PDF
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
        let baseMsg = settings.whatsappMessage ? settings.whatsappMessage : `Bonjour {client_name},\n\nSauf erreur de notre part, la facture {document_number} d'un reste à payer de {amount} est toujours en attente de règlement.\n\nMerci de faire le nécessaire dès que possible.\n\nCordialement, {company_name}`;
        
        baseMsg = baseMsg.replace(/\{client_name\}/g, fullInv.client?.name || inv.client?.name || '');
        baseMsg = baseMsg.replace(/\{document_number\}/g, inv.number || '');
        baseMsg = baseMsg.replace(/\{amount\}/g, formatCurrency(inv.amountRemaining) || '');
        baseMsg = baseMsg.replace(/\{company_name\}/g, fullInv.company?.name || settings.companyName || '');
        
        if (!shareRes.ok && shareData.error?.includes("Vercel Blob")) {
          // Fallback: download locally
          const link = document.createElement('a');
          link.href = pdfBase64;
          link.download = `Relance_${inv.number}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          finalMsg = `${baseMsg}\n\n(Veuillez joindre manuellement le PDF qui vient d'être téléchargé sur votre appareil)`;
          toast.success("PDF téléchargé. Ajoutez-le dans WhatsApp !", { id: toastId });
        } else if (!shareRes.ok || !shareData.success) {
          throw new Error(shareData.error || "Erreur de lien PDF");
        } else {
          finalMsg = `${baseMsg}\n\n📄 Votre facture : ${shareData.url}`;
          toast.success("Redirection vers WhatsApp...", { id: toastId });
        }
        
        const encodedMsg = encodeURIComponent(finalMsg);
        const waUrl = getWhatsAppUrl(phone, encodedMsg);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = waUrl;
        } else {
          window.open(waUrl, '_blank');
        }
      } else {
        const email = fullInv.client?.email;
        if(!email) throw new Error("Aucun email pour ce client");
        
        const res = await apiFetch('/api/share', {
          method: 'POST',
          body: JSON.stringify({
            type: 'email',
            to: email,
            subject: `Relance : Facture ${inv.number}`,
            message,
            filename: `Facture_${inv.number}.pdf`,
            pdfBase64,
            companyId: inv.companyId
          })
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      }

      // Mettre à jour lastReminderDate
      await apiFetch(`/api/invoices/${inv.id}/remind`, { 
          method: 'POST', 
          body: JSON.stringify({ method }) 
      });

      toast.success("Relance envoyée avec succès !", { id: toastId });
      triggerRefresh('reminders');
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi", { id: toastId });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader 
        title="Relances & Impayés" 
        description="Gérez vos factures en attente de paiement et relancez vos clients en un clic."
        icon={<AlertTriangle size={20} />}
      />

      <div className="fp-card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
        <table className="fp-table">
          <thead>
            <tr>
              <th>Facture</th>
              <th>Client</th>
              <th>Date émission</th>
              <th style={{ textAlign: 'right' }}>Reste à payer</th>
              <th>Dernière relance</th>
              <th style={{ textAlign: 'right' }}>Relancer via</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--foreground-muted)' }}>Chargement...</td></tr>
            ) : pendingInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <AlertTriangle size={32} style={{ margin: '0 auto var(--space-3)', color: 'var(--emerald)' }} />
                  <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>Aucun retard de paiement</div>
                  <p style={{ color: 'var(--foreground-muted)', fontSize: '13px', marginTop: 'var(--space-1)' }}>Vous n'avez aucune facture en attente de paiement.</p>
                </td>
              </tr>
            ) : (
              (pendingInvoices || []).map((inv: any) => {
                const daysSinceIssue = Math.floor((new Date().getTime() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                const isLate = daysSinceIssue > 30; // On considère en retard après 30 jours
                
                return (
                <tr key={inv.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{inv.number}</div>
                    {isLate && <span style={{ padding: 'var(--space-1)', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(239,68,68,0.1)', color: 'var(--rose)', border: '1px solid rgba(239,68,68,0.2)' }}>En Retard</span>}
                  </td>
                  <td>{inv.client?.name}</td>
                  <td>{formatDate(inv.createdAt)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--amber)' }}>{formatCurrency(inv.amountRemaining || 0)}</td>
                  <td>
                    {inv.lastReminderDate ? (
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--foreground-muted)' }}>
                        <Calendar size={12} style={{ marginRight: 'var(--space-1)' }} />
                        {formatDate(inv.lastReminderDate)}
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--foreground-muted)', fontStyle: 'italic' }}>Jamais relancé</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <button className="fp-btn-ghost" onClick={() => sendReminder(inv, 'whatsapp')}>
                        <MessageCircle size={14} style={{ color: '#25D366' }} /> WhatsApp
                      </button>
                      <button className="fp-btn-ghost" onClick={() => sendReminder(inv, 'email')}>
                        <Mail size={14} style={{ color: '#4f46e5' }} /> Email
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
