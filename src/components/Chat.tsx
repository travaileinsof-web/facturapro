import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { buildInvoiceHTML } from '../lib/pdfTemplate';
import { buildReceiptHTML } from '../lib/pdfTemplate';
import { exportHTMLToPDF } from '../lib/pdfExport';
import { formatCurrency, apiFetch, escapeHTML } from '../lib/store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'model';
  text: string;
  action?: any;
  loading?: boolean;
}

const QUICK_PROMPTS = [
  '📋 Lister tous mes clients',
  '💰 Quels sont les impayés ?',
  '📄 Créer une facture',
  '🧾 Créer un reçu de paiement',
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `Bonjour ! Je suis **ARIA**, votre assistante IA opérationnelle FacturaPro. 🚀

Je connais en temps réel tous vos clients, factures, reçus et services. Voici ce que vous pouvez me demander :

- **Créer une facture** : *"Génère une facture pour Moussa Diallo, 3 jours de consulting à 75 000 FCFA"*
- **Enregistrer un paiement** : *"Enregistre un reçu d'acompte de 150 000 FCFA sur la facture FAC-..."*
- **Consulter l'état** : *"Quelles factures sont impayées ?"*
- **Créer un client** : *"Ajoute un client : SARL Kadi, contact 77 000 00 00"*

Comment puis-je vous aider ?`,
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: 'user', text: messageText };
    const history = (messages || []).filter(m => !m.loading).map(m => ({ role: m.role, text: m.text }));

    setMessages(prev => [...prev, userMessage, { role: 'model', text: '', loading: true }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: messageText, history })
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (!res.ok) {
        const errorData = isJson ? await res.json() : null;
        throw new Error(errorData?.error || 'Erreur serveur');
      }

      const data = await res.json();

      const botMessage: Message = {
        role: 'model',
        text: data.text || '',
        action: data.action || null
      };

      setMessages(prev => [...prev.slice(0, -1), botMessage]);

      // Refresh data if action was executed
      if (data.action) {
        queryClient.invalidateQueries();
      }

    } catch (err: any) {
      setMessages(prev => [...prev.slice(0, -1), {
        role: 'model',
        text: `❌ **Erreur** : ${err.message || 'Une erreur est survenue. Réessayez.'}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const downloadActionPDF = async (action: any) => {
    try {
      const settingsRes = await apiFetch('/api/settings');
      const settings = await settingsRes.json();

      if (action.type === 'invoice_created') {
        const invRes = await apiFetch(`/api/invoices/${action.data.id}`);
        const inv = await invRes.json();
        const html = buildInvoiceHTML(inv, settings);
        await exportHTMLToPDF(html, inv.number);
      } else if (action.type === 'receipt_created') {
        const html = buildReceiptHTML(action.data, settings);
        await exportHTMLToPDF(html, action.data.number);
      }
    } catch (e) {
      console.error('PDF error', e);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 140px)',
      background: '#f8fafc',
      borderRadius: '20px',
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(59,130,246,0.4)'
        }}>🤖</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.3px' }}>ARIA</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '1px' }}>
            Assistante IA Opérationnelle · FacturaPro
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 2px rgba(34,197,94,0.3)' }}></div>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>En ligne</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px 28px',
        display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        {(messages || []).map((msg, idx) => (
          <div key={idx} style={{
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            gap: '10px',
          }}>
            {/* Avatar */}
            {msg.role === 'model' && (
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
              }}>🤖</div>
            )}

            <div style={{ maxWidth: '80%' }}>
              {/* Bubble */}
              <div style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg, #1e3a5f, #0f172a)' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#1e293b',
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                fontSize: '13.5px',
                lineHeight: '1.65',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: msg.role === 'model' ? '1px solid #f1f5f9' : 'none',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.loading ? (
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '4px 0' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: '#94a3b8',
                        animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                      }} />
                    ))}
                  </div>
                ) : (
                  <FormattedText text={msg.text} />
                )}
              </div>

              {/* Action Card */}
              {msg.action && (
                <ActionCard action={msg.action} onDownloadPDF={() => downloadActionPDF(msg.action)} />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 28px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => sendMessage(p)} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px',
              padding: '8px 14px', fontSize: '12.5px', color: '#475569', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
              onMouseOver={e => { (e.target as any).style.borderColor = '#3b82f6'; (e.target as any).style.color = '#3b82f6'; }}
              onMouseOut={e => { (e.target as any).style.borderColor = '#e2e8f0'; (e.target as any).style.color = '#475569'; }}
            >{p}</button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div style={{
        padding: '16px 20px',
        background: '#fff',
        borderTop: '1px solid #f1f5f9',
      }}>
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'flex-end',
          background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px',
          padding: '10px 14px', transition: 'border-color 0.2s',
        }}
          onFocusCapture={e => { (e.currentTarget as any).style.borderColor = '#3b82f6'; }}
          onBlurCapture={e => { (e.currentTarget as any).style.borderColor = '#e2e8f0'; }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Génère une facture pour Moussa Diallo, 2 jours de formation à 80 000 FCFA..."
            disabled={isLoading}
            rows={1}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              resize: 'none', outline: 'none', fontSize: '13.5px',
              color: '#1e293b', lineHeight: '1.5',
              fontFamily: 'inherit', maxHeight: '120px',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            style={{
              width: '36px', height: '36px', borderRadius: '10px', border: 'none',
              background: isLoading || !input.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: '#fff', cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', flexShrink: 0, transition: 'all 0.2s',
              boxShadow: isLoading || !input.trim() ? 'none' : '0 4px 12px rgba(59,130,246,0.35)'
            }}
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
          Entrée pour envoyer · Maj+Entrée pour saut de ligne · ARIA a accès à toutes vos données en temps réel
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Formatted Text ───────────────────────────────────────────────────────────

function FormattedText({ text }: { text: string }) {
  // Basic markdown: **bold**, *italic*, code blocks, line breaks
  const safeText = escapeHTML(text);
  const formatted = safeText
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>')
    .replace(/\n/g, '<br/>');
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}

// ─── Action Card ──────────────────────────────────────────────────────────────

function ActionCard({ action, onDownloadPDF }: { action: any; onDownloadPDF: () => void }) {
  if (!action) return null;

  const isInvoice = action.type === 'invoice_created';
  const isReceipt = action.type === 'receipt_created';
  const isClient = action.type === 'client_created';
  const isUpdated = action.type === 'invoice_updated';

  const cardStyle: React.CSSProperties = {
    marginTop: '10px',
    background: '#fff',
    border: `1.5px solid ${isInvoice ? '#3b82f6' : isReceipt ? '#10b981' : isClient ? '#8b5cf6' : '#f59e0b'}`,
    borderRadius: '14px',
    padding: '16px 18px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
  };

  const badgeColors: any = {
    invoice_created: { bg: '#eff6ff', text: '#1d4ed8', label: '📄 Facture Créée' },
    receipt_created: { bg: '#f0fdf4', text: '#15803d', label: '🧾 Reçu Enregistré' },
    client_created: { bg: '#f5f3ff', text: '#6d28d9', label: '👤 Client Ajouté' },
    invoice_updated: { bg: '#fffbeb', text: '#92400e', label: '✏️ Facture Mise à Jour' },
  };
  const badge = badgeColors[action.type] || { bg: '#f1f5f9', text: '#475569', label: '✅ Action Exécutée' };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ background: badge.bg, color: badge.text, fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>
          {badge.label}
        </span>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>✓ Exécuté</span>
      </div>

      {isInvoice && (
        <div style={{ fontSize: '13px', color: '#1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#64748b' }}>N° Facture</span>
            <strong style={{ fontFamily: 'monospace' }}>{action.data.number}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#64748b' }}>Client</span>
            <strong>{action.data.client?.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ color: '#64748b' }}>Montant Total</span>
            <strong style={{ color: '#1d4ed8', fontSize: '15px' }}>{formatCurrency(action.data.total)}</strong>
          </div>
        </div>
      )}

      {isReceipt && (
        <div style={{ fontSize: '13px', color: '#1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#64748b' }}>N° Reçu</span>
            <strong style={{ fontFamily: 'monospace' }}>{action.data.number}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#64748b' }}>Client</span>
            <strong>{action.data.client?.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ color: '#64748b' }}>Montant</span>
            <strong style={{ color: '#15803d', fontSize: '15px' }}>{formatCurrency(action.data.amount)}</strong>
          </div>
          {action.data.invoice && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ color: '#64748b' }}>Réf. Facture</span>
              <strong style={{ fontFamily: 'monospace' }}>{action.data.invoice.number}</strong>
            </div>
          )}
        </div>
      )}

      {isClient && (
        <div style={{ fontSize: '13px', color: '#1e293b', marginBottom: '14px' }}>
          <strong style={{ fontSize: '15px' }}>{action.data.name}</strong>
          {action.data.phone && <div style={{ color: '#64748b', marginTop: '4px' }}>✆ {action.data.phone}</div>}
          {action.data.email && <div style={{ color: '#64748b' }}>✉ {action.data.email}</div>}
        </div>
      )}

      {(isInvoice || isReceipt) && (
        <button onClick={onDownloadPDF} style={{
          width: '100%', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
          color: '#fff', border: 'none', borderRadius: '10px',
          padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'opacity 0.2s'
        }}>
          📄 Télécharger le PDF
        </button>
      )}
    </div>
  );
}
