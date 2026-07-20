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
    currency: 'GNF',
  });


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
          <div style={{ display: 'none' }}>
            <label style={labelStyle}>Devise</label>
            <input type="hidden" value="GNF" />
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
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <input type="color" value={form.primaryColor || '#0f172a'} onChange={e => set('primaryColor', e.target.value)} style={{ width: '42px', height: '38px', padding: 'var(--space-1)', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer' }} />
              <input style={{ ...inputStyle, flex: 1, fontFamily: 'var(--font-mono)' }} value={form.primaryColor || ''} onChange={e => set('primaryColor', e.target.value)} placeholder="#0f172a" />
            </div>
          </div>
        </div>
      </div>


      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-4)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border)', marginTop: 'var(--space-2)' }}>
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
    try {
      const res = await apiFetch(`/api/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (res.ok) { 
        toast.success('Entreprise mise à jour !'); 
        refetch(); 
        setExpanded(null); 
      } else { 
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const e = isJson ? await res.json() : null; 
        toast.error(e?.error || 'Erreur sauvegarde'); 
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur réseau de sauvegarde');
    }
  };

  const createCompany = async (data: any) => {
    try {
      const res = await apiFetch('/api/companies', { method: 'POST', body: JSON.stringify(data) });
      if (res.ok) { 
        toast.success('Entreprise créée !'); 
        refetch(); 
        setCreating(false); 
      } else { 
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const e = isJson ? await res.json() : null; 
        toast.error(e?.error || 'Erreur création'); 
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur réseau de création');
    }
  };

  const setDefault = async (id: string) => {
    try {
      const res = await apiFetch(`/api/companies/${id}`, { method: 'PUT', body: JSON.stringify({ setDefault: true }) });
      if (res.ok) { 
        toast.success('Entreprise principale définie !'); 
        refetch(); 
      } else { 
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const e = isJson ? await res.json() : null; 
        toast.error(e?.error || 'Erreur'); 
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur réseau');
    }
  };

  const deleteCompany = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    try {
      const res = await apiFetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (res.ok) { 
        toast.success('Entreprise supprimée.'); 
        refetch(); 
      } else { 
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const e = isJson ? await res.json() : null; 
        toast.error(e?.error || 'Erreur suppression'); 
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur réseau lors de la suppression');
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) 0', borderBottom: '1px solid var(--border)' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>Mes Entreprises</p>
          <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', marginTop: '4px' }}>
            Gérez plusieurs entités. Chaque entreprise a ses propres informations.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-1)' }}>
          <button
            disabled
            className="fp-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', opacity: 0.5, cursor: 'not-allowed' }}
          >
            <Plus size={14} /> Nouvelle entreprise
          </button>
          <span style={{ fontSize: '10px', background: 'var(--gold-dim)', color: 'var(--gold)', padding: 'var(--space-1) var(--space-2)', borderRadius: '4px', fontWeight: 600 }}>Bientôt disponible</span>
        </div>
      </div>

      {/* Create form */}
      {creating && (
        <div style={{ border: '1px solid var(--border-gold)', background: 'var(--gold-dim)', padding: 'var(--space-5)' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={12} /> Nouvelle entreprise
          </p>
          <CompanyForm isNew onSave={createCompany} onCancel={() => setCreating(false)} />
        </div>
      )}

      {/* Company list */}
      {((companies as any[]) || []).map((company: any) => (
        <div key={company.id} style={{ border: `1px solid ${company.isDefault ? 'var(--border-gold)' : 'var(--border)'}`, background: company.isDefault ? 'var(--gold-dim)' : 'var(--surface)' }}>
          {/* Company header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)' }}>
            <div style={{ width: '36px', height: '36px', background: company.isDefault ? 'var(--gold)' : 'var(--surface-2)', border: `1px solid ${company.isDefault ? 'var(--gold)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {company.isDefault
                ? <Star size={15} style={{ color: '#fff' }} />
                : <Building2 size={15} style={{ color: 'var(--foreground-subtle)' }} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--foreground)' }}>{company.name}</p>
                {company.isDefault && (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: 'var(--space-1) var(--space-2)', background: 'var(--gold)', color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Principal
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
                  style={{ padding: 'var(--space-1) var(--space-2)', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Check size={11} /> Définir principale
                </button>
              )}
              <button
                onClick={() => setExpanded(expanded === company.id ? null : company.id)}
                style={{ padding: 'var(--space-1) var(--space-2)', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border-hover)', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Settings2 size={11} /> Modifier
              </button>
              {!company.isDefault && (
                <button
                  onClick={() => deleteCompany(company.id, company.name)}
                  style={{ padding: 'var(--space-1) var(--space-2)', fontSize: '11px', fontWeight: 600, background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--destructive)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Edit form expanded */}
          {expanded === company.id && (
            <div style={{ padding: 'var(--space-5)', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
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
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', border: '1px dashed var(--border)', background: 'var(--surface-2)' }}>
          <Building2 size={32} style={{ color: 'var(--foreground-subtle)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>Aucune entreprise configurée.</p>
          <button onClick={() => setCreating(true)} className="fp-btn-primary" style={{ marginTop: '16px' }}>
            Créer ma première entreprise
          </button>
        </div>
      )}

      {/* Info block */}
      <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', gap: 'var(--space-2)' }}>
        <div style={{ flexShrink: 0, marginTop: '1px' }}>
          <Mail size={13} style={{ color: 'var(--gold)' }} />
        </div>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>Comment fonctionne le multi-entreprises ?</p>
          <p style={{ fontSize: '11px', color: 'var(--foreground-muted)', lineHeight: 1.7 }}>
            L'entreprise <strong>Principale</strong> est utilisée par défaut pour toutes les nouvelles factures et documents.

            Vous pouvez créer jusqu'à <strong>5 entreprises</strong> par compte.
          </p>
        </div>
      </div>
    </div>
  );
}
