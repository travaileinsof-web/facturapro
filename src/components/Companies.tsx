import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/store';
import { toast } from 'sonner';
import { Plus, Building2, Mail, ChevronDown, ChevronUp, Star, Trash2, Settings2, Check } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'var(--surface-2)', border: '1px solid rgba(0,0,0,0.12)',
  color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  letterSpacing: '0.5px', textTransform: 'uppercase',
  color: 'var(--foreground-subtle)', marginBottom: '6px',
};

function CompanyForm({
  initial,
  onSave,
  onCancel,
  isNew = false,
}: {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isNew?: boolean;
}) {
  const [form, setForm] = useState<any>(initial || {
    name: '', slogan: '', address: '', phone: '', email: '', website: '',
    taxId: '', bankName: '', bankAccount: '', primaryColor: '#0f172a',
    currency: 'XOF', smtpHost: '', smtpPort: '587', smtpUser: '',
    smtpPass: '', smtpFrom: '', smtpFromName: '',
  });
  const [showSmtp, setShowSmtp] = useState(false);

  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { toast.error('Le nom est requis.'); return; }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Identity */}
      <div>
        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--gold)', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          Identité de l'entreprise
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Nom de l'entreprise *</label>
            <input style={inputStyle} value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Ex: Cabinet DUPONT & Associés" required />
          </div>
          <div>
            <label style={labelStyle}>Slogan</label>
            <input style={inputStyle} value={form.slogan || ''} onChange={e => set('slogan', e.target.value)} placeholder="Votre excellence, notre priorité" />
          </div>
          <div>
            <label style={labelStyle}>NIF / RCCM</label>
            <input style={inputStyle} value={form.taxId || ''} onChange={e => set('taxId', e.target.value)} placeholder="Numéro fiscal" />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Adresse</label>
            <input style={inputStyle} value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="Rue, Ville, Pays" />
          </div>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input style={inputStyle} value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+225 07 00 00 00" />
          </div>
          <div>
            <label style={labelStyle}>Email contact</label>
            <input style={inputStyle} type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="contact@entreprise.com" />
          </div>
          <div>
            <label style={labelStyle}>Site web</label>
            <input style={inputStyle} value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label style={labelStyle}>Devise</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px' }}
              value={form.currency || 'XOF'}
              onChange={e => set('currency', e.target.value)}
            >
              <option value="XOF">XOF — Franc CFA (BCEAO)</option>
              <option value="XAF">XAF — Franc CFA (BEAC)</option>
              <option value="EUR">EUR — Euro</option>
              <option value="USD">USD — Dollar</option>
              <option value="CAD">CAD — Dollar Canadien</option>
              <option value="MAD">MAD — Dirham Marocain</option>
              <option value="GNF">GNF — Franc Guinéen</option>
              <option value="CDF">CDF — Franc Congolais</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Banque</label>
            <input style={inputStyle} value={form.bankName || ''} onChange={e => set('bankName', e.target.value)} placeholder="Ex: Ecobank, UBA..." />
          </div>
          <div>
            <label style={labelStyle}>IBAN / RIB</label>
            <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }} value={form.bankAccount || ''} onChange={e => set('bankAccount', e.target.value)} placeholder="FR76 XXXX XXXX..." />
          </div>
          <div>
            <label style={labelStyle}>Couleur principale</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="color" value={form.primaryColor || '#0f172a'} onChange={e => set('primaryColor', e.target.value)} style={{ width: '42px', height: '38px', padding: '2px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer' }} />
              <input style={{ ...inputStyle, flex: 1, fontFamily: 'var(--font-mono)' }} value={form.primaryColor || ''} onChange={e => set('primaryColor', e.target.value)} placeholder="#0f172a" />
            </div>
          </div>
        </div>
      </div>

      {/* SMTP collapsible */}
      <div>
        <button
          type="button"
          onClick={() => setShowSmtp(!showSmtp)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', background: 'var(--gold-dim)', border: '1px solid var(--border-gold)', color: 'var(--gold)', cursor: 'pointer', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={13} /> Configuration Email SMTP {form.smtpPassSet ? '(configuré ✓)' : ''}
          </span>
          {showSmtp ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showSmtp && (
          <div style={{ padding: '24px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', lineHeight: 1.6, padding: '12px 16px', background: 'rgba(0,0,0,0.03)', borderLeft: '2px solid var(--gold)' }}>
              Configurez un serveur SMTP spécifique pour cette entreprise. Les factures et relances seront envoyées depuis cet email.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={labelStyle}>Hôte SMTP</label>
                <input style={inputStyle} value={form.smtpHost || ''} onChange={e => set('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label style={labelStyle}>Port</label>
                <input style={inputStyle} value={form.smtpPort || '587'} onChange={e => set('smtpPort', e.target.value)} placeholder="587 ou 465" />
              </div>
              <div>
                <label style={labelStyle}>Email expéditeur</label>
                <input style={inputStyle} type="email" value={form.smtpUser || ''} onChange={e => set('smtpUser', e.target.value)} placeholder="factures@entreprise.com" />
              </div>
              <div>
                <label style={labelStyle}>Mot de passe d'application {form.smtpPassSet ? '(configuré)' : ''}</label>
                <input style={inputStyle} type="password" value={form.smtpPass || ''} onChange={e => set('smtpPass', e.target.value)} placeholder={form.smtpPassSet ? '••••••••••••• (laisser vide = inchangé)' : '••••••••••••'} />
              </div>
              <div>
                <label style={labelStyle}>Nom affiché (expéditeur)</label>
                <input style={inputStyle} value={form.smtpFromName || ''} onChange={e => set('smtpFromName', e.target.value)} placeholder="Cabinet DUPONT" />
              </div>
              <div>
                <label style={labelStyle}>Email de réponse (Reply-To)</label>
                <input style={inputStyle} type="email" value={form.smtpFrom || ''} onChange={e => set('smtpFrom', e.target.value)} placeholder="contact@entreprise.com" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', paddingTop: '24px', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
        <button type="button" onClick={onCancel} className="fp-btn-ghost">
          Annuler
        </button>
        <button type="submit" className="fp-btn-primary">
          {isNew ? 'Créer l\'entreprise' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

export function Companies() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: companies = [], refetch } = useQuery<any[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await apiFetch('/api/companies');
      if (!res.ok) throw new Error('Erreur chargement entreprises');
      return res.json();
    },
  });

  const saveCompany = async (id: string, data: any) => {
    const res = await apiFetch(`/api/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (res.ok) { toast.success('Entreprise mise à jour !'); refetch(); setExpanded(null); }
    else { const e = await res.json(); toast.error(e.error || 'Erreur sauvegarde'); }
  };

  const createCompany = async (data: any) => {
    const res = await apiFetch('/api/companies', { method: 'POST', body: JSON.stringify(data) });
    if (res.ok) { toast.success('Entreprise créée !'); refetch(); setCreating(false); }
    else { const e = await res.json(); toast.error(e.error || 'Erreur création'); }
  };

  const setDefault = async (id: string) => {
    const res = await apiFetch(`/api/companies/${id}`, { method: 'PUT', body: JSON.stringify({ setDefault: true }) });
    if (res.ok) { toast.success('Entreprise principale définie !'); refetch(); }
    else { const e = await res.json(); toast.error(e.error || 'Erreur'); }
  };

  const deleteCompany = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    const res = await apiFetch(`/api/companies/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Entreprise supprimée.'); refetch(); }
    else { const e = await res.json(); toast.error(e.error || 'Erreur suppression'); }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>Mes Entreprises</p>
          <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', marginTop: '4px' }}>
            Gérez plusieurs entités. Chaque entreprise a ses propres informations et config email SMTP.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <button
            disabled
            className="fp-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5, cursor: 'not-allowed' }}
          >
            <Plus size={14} /> Nouvelle entreprise
          </button>
          <span style={{ fontSize: '10px', background: 'var(--gold-dim)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Bientôt disponible</span>
        </div>
      </div>

      {/* Create form */}
      {creating && (
        <div style={{ border: '1px solid var(--border-gold)', background: 'var(--gold-dim)', padding: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gold)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={12} /> Nouvelle entreprise
          </p>
          <CompanyForm isNew onSave={createCompany} onCancel={() => setCreating(false)} />
        </div>
      )}

      {/* Company list */}
      {(companies as any[]).map((company: any) => (
        <div key={company.id} style={{ border: `1px solid ${company.isDefault ? 'var(--border-gold)' : 'var(--border)'}`, background: company.isDefault ? 'var(--gold-dim)' : 'var(--surface)' }}>
          {/* Company header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px' }}>
            <div style={{ width: '36px', height: '36px', background: company.isDefault ? 'var(--gold)' : 'var(--surface-2)', border: `1px solid ${company.isDefault ? 'var(--gold)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {company.isDefault
                ? <Star size={15} style={{ color: '#fff' }} />
                : <Building2 size={15} style={{ color: 'var(--foreground-subtle)' }} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--foreground)' }}>{company.name}</p>
                {company.isDefault && (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', background: 'var(--gold)', color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Principal
                  </span>
                )}
                {company.smtpPassSet && (
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', background: 'rgba(16,185,129,0.1)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={9} /> SMTP configuré
                  </span>
                )}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--foreground-muted)', marginTop: '2px' }}>
                {[company.email, company.phone, company.address].filter(Boolean).join(' · ') || 'Aucun contact renseigné'}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              {!company.isDefault && (
                <button
                  onClick={() => setDefault(company.id)}
                  title="Définir comme principale"
                  style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Check size={11} /> Définir principale
                </button>
              )}
              <button
                onClick={() => setExpanded(expanded === company.id ? null : company.id)}
                style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Settings2 size={11} /> Modifier
              </button>
              {!company.isDefault && (
                <button
                  onClick={() => deleteCompany(company.id, company.name)}
                  style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 600, background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--destructive)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Edit form expanded */}
          {expanded === company.id && (
            <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
              <CompanyForm
                initial={company}
                onSave={(data) => saveCompany(company.id, data)}
                onCancel={() => setExpanded(null)}
              />
            </div>
          )}
        </div>
      ))}

      {companies.length === 0 && !creating && (
        <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border)', background: 'var(--surface-2)' }}>
          <Building2 size={32} style={{ color: 'var(--foreground-subtle)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>Aucune entreprise configurée.</p>
          <button onClick={() => setCreating(true)} className="fp-btn-primary" style={{ marginTop: '16px' }}>
            Créer ma première entreprise
          </button>
        </div>
      )}

      {/* Info block */}
      <div style={{ padding: '12px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
        <div style={{ flexShrink: 0, marginTop: '1px' }}>
          <Mail size={13} style={{ color: 'var(--gold)' }} />
        </div>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>Comment fonctionne le multi-entreprises ?</p>
          <p style={{ fontSize: '11px', color: 'var(--foreground-muted)', lineHeight: 1.7 }}>
            L'entreprise <strong>Principale</strong> est utilisée par défaut pour toutes les nouvelles factures et documents.
            Chaque entreprise peut avoir sa propre configuration SMTP — les relances automatiques utilisent le SMTP de l'entreprise associée à la facture.
            Vous pouvez créer jusqu'à <strong>5 entreprises</strong> par compte.
          </p>
        </div>
      </div>
    </div>
  );
}
