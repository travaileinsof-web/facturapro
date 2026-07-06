import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAppStore, apiFetch } from '../lib/store';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { Eye, EyeOff, Upload, Loader2, Save, Building2, CreditCard, Lock, Mail, Zap, Palette, ChevronDown } from 'lucide-react';

/* ── Section wrapper ─────────────────────────────────────────────── */
function Section({ title, desc, icon: Icon, children, delay = 0 }: {
  title: string; desc?: string; icon: any; children: React.ReactNode; delay?: number;
}) {
  return (
    <div className="fp-card" style={{ opacity: 0, animation: `fp-fade-up 0.5s ease ${delay}s forwards` }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', background: 'var(--gold-dim)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} style={{ color: 'var(--gold)' }}/>
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: desc ? '4px' : 0 }}>{title}</p>
          {desc && <p style={{ fontSize: '12px', color: 'var(--foreground-subtle)', lineHeight: 1.6 }}>{desc}</p>}
        </div>
      </div>
      <div style={{ padding: '32px' }}>{children}</div>
    </div>
  );
}

/* ── Field wrapper ───────────────────────────────────────────────── */
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground-muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.2px' }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: '11px', color: 'var(--foreground-subtle)', marginTop: '4px' }}>{hint}</p>}
    </div>
  );
}

/* ── Image Upload wrapper ─────────────────────────────────────────── */
function ImageUploadField({ label, hint, value, onChange, onUploading }: { label: string; hint?: string; value: string; onChange: (url: string) => void; onUploading: (isUploading: boolean) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    onUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {} // Don't set Content-Type for FormData
      });
      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
        toast.success("Image téléchargée avec succès");
      } else {
        toast.error("Erreur lors de l'upload");
      }
    } catch (err) {
      toast.error("Erreur serveur");
    } finally {
      setLoading(false);
      onUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground-muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.2px' }}>{label}</label>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input type="text" value={value || ''} readOnly style={{ width: '100%', padding: '9px 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 0, color: 'var(--foreground)', fontSize: '13px', cursor: 'not-allowed' }} placeholder="Aucun fichier" />
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading} style={{ padding: '9px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--foreground)' }}>
          {loading ? <Loader2 size={14} className="fp-spin" /> : <Upload size={14} />} {loading ? 'Envoi...' : 'Parcourir'}
        </button>
      </div>
      {hint && <p style={{ fontSize: '11px', color: 'var(--foreground-subtle)', marginTop: '4px' }}>{hint}</p>}
    </div>
  );
}

export function Settings() {
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const { data: settings, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiFetch('/api/settings');
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { register, handleSubmit, watch, setValue } = useForm({ values: settings || {} });

  const onSubmit = async (data: any) => {
    const payload = { 
      ...data,
      logo: watch('logo'),
      stamp: watch('stamp'),
      signature: watch('signature'),
      primaryColor: watch('primaryColor'),
      secondaryColor: watch('secondaryColor'),
      accentColor: watch('accentColor')
    };
    if (!payload.password) delete payload.password;
    const res = await apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(payload) });
    if (res.ok) {
      const updated = await res.json();
      const currentUser = useAppStore.getState().user;
      useAppStore.getState().login({ ...currentUser, ...updated } as any);
      toast.success('Paramètres enregistrés !');
      setValue('currentPassword', '');
      setValue('password', '');
      refetch();
    } else {
      toast.error("Erreur lors de l'enregistrement.");
    }
  };

  if (!settings) return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {[1,2,3,4].map(i => <div key={i} className="fp-skeleton" style={{ height: '180px' }}/>)}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', background: 'var(--surface-2)',
    border: '1px solid var(--border)', borderRadius: '0',
    color: 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-sans)',
    outline: 'none', transition: 'border-color 0.15s',
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', appearance: 'none' };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>

        {/* Security */}
        <Section title="Sécurité du Compte" icon={Lock} delay={0.05}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Field label="Mot de passe actuel (requis pour modifier)">
              <input type={showPassword ? 'text' : 'password'} {...register('currentPassword')} style={inputStyle} placeholder="••••••••"
                onFocus={e => { e.target.style.borderColor='var(--gold)'; e.target.style.boxShadow='0 0 0 3px var(--gold-dim)'; }}
                onBlur={e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none'; }}
              />
            </Field>
            <Field label="Nouveau mot de passe">
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} {...register('password')} style={inputStyle} placeholder="Laisser vide pour ne pas modifier"
                  onFocus={e => { e.target.style.borderColor='var(--gold)'; e.target.style.boxShadow='0 0 0 3px var(--gold-dim)'; }}
                  onBlur={e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none'; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-subtle)', display: 'flex' }}>
                  {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </Field>
          </div>
        </Section>

        {/* Profil Entreprise */}
        <Section title="Profil de l'Entreprise" desc="Ces informations apparaitront sur vos factures et devis." icon={Building2} delay={0.1}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <Field label="Nom de l'entreprise *">
              <input type="text" {...register('companyName')} style={inputStyle} placeholder="Nom officiel" />
            </Field>
            <Field label="Slogan">
              <input type="text" {...register('slogan')} style={inputStyle} placeholder="Votre devise" />
            </Field>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Adresse complète">
                <input type="text" {...register('address')} style={inputStyle} placeholder="123 Rue de la Paix, 75000 Paris" />
              </Field>
            </div>
            <Field label="Téléphone">
              <input type="text" {...register('phone')} style={inputStyle} placeholder="+33 6 00 00 00 00" />
            </Field>
            <Field label="Site Web">
              <input type="text" {...register('website')} style={inputStyle} placeholder="https://monsite.com" />
            </Field>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Message WhatsApp par défaut" hint="Pré-rempli lors de l'envoi de factures via WhatsApp.">
                <textarea {...register('whatsappMessage')} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
              </Field>
            </div>
          </div>
        </Section>

        {/* Informations Bancaires */}
        <Section title="Banque & Juridique" desc="Pour faciliter les paiements de vos clients." icon={CreditCard} delay={0.15}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <Field label="Nom de la Banque">
              <input type="text" {...register('bankName')} style={inputStyle} placeholder="Ex: Société Générale" />
            </Field>
            <Field label="Numéro d'Identification (TVA, SIRET...)">
              <input type="text" {...register('taxId')} style={inputStyle} placeholder="FR00000000" />
            </Field>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Coordonnées bancaires (IBAN, RIB...)">
                <textarea {...register('bankAccount')} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="IBAN: FR76 ..." />
              </Field>
            </div>
          </div>
        </Section>

        {/* Identité Visuelle */}
        <Section title="Identité Visuelle" desc="Personnalisez vos documents. Les images sont automatiquement envoyées au serveur." icon={Palette} delay={0.2}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <input type="hidden" {...register('logo')} />
            <input type="hidden" {...register('stamp')} />
            <input type="hidden" {...register('signature')} />
            <ImageUploadField label="Logo" hint="Format JPG ou PNG, max 5MB" value={watch('logo')} onChange={(url) => setValue('logo', url)} onUploading={v => setUploadingField(v ? 'logo' : null)} />
            
            <Field label="Couleur Principale">
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="color" value={watch('primaryColor') || '#B38E36'} onChange={(e) => setValue('primaryColor', e.target.value)} style={{ width: '40px', height: '38px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                <input type="text" {...register('primaryColor')} style={{ ...inputStyle, flex: 1 }} placeholder="#B38E36" />
              </div>
            </Field>
            
            <Field label="Couleur Secondaire">
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="color" value={watch('secondaryColor') || '#3A72D6'} onChange={(e) => setValue('secondaryColor', e.target.value)} style={{ width: '40px', height: '38px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                <input type="text" {...register('secondaryColor')} style={{ ...inputStyle, flex: 1 }} placeholder="#3A72D6" />
              </div>
            </Field>

            <Field label="Couleur d'Accentuation">
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="color" value={watch('accentColor') || '#16A34A'} onChange={(e) => setValue('accentColor', e.target.value)} style={{ width: '40px', height: '38px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                <input type="text" {...register('accentColor')} style={{ ...inputStyle, flex: 1 }} placeholder="#16A34A" />
              </div>
            </Field>

            <ImageUploadField label="Cachet de l'entreprise" value={watch('stamp')} onChange={(url) => setValue('stamp', url)} onUploading={v => setUploadingField(v ? 'stamp' : null)} />
            <ImageUploadField label="Signature électronique" value={watch('signature')} onChange={(url) => setValue('signature', url)} onUploading={v => setUploadingField(v ? 'signature' : null)} />
          </div>
        </Section>

        {/* Email & SMTP */}
        <Section title="Serveur Email (SMTP)" desc="Configuration pour l'envoi automatique de mails." icon={Mail} delay={0.25}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Hôte SMTP">
                <input type="text" {...register('smtpHost')} style={inputStyle} placeholder="smtp.gmail.com" />
              </Field>
            </div>
            <Field label="Port">
              <input type="text" {...register('smtpPort')} style={inputStyle} placeholder="465 ou 587" />
            </Field>
            <Field label="Chiffrement">
              <select {...register('smtpEncryption')} style={selectStyle}>
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="none">Aucun</option>
              </select>
            </Field>
            <Field label="Nom d'utilisateur (Email)">
              <input type="text" {...register('smtpUser')} style={inputStyle} placeholder="contact@entreprise.com" />
            </Field>
            <Field label="Mot de passe SMTP (ou Mot de passe d'application)">
              <input type="password" {...register('smtpPass')} style={inputStyle} placeholder="••••••••" />
            </Field>
          </div>
          
          <div style={{ marginTop: '24px', padding: '16px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setTutorialOpen(!tutorialOpen)}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14}/> Aide à la configuration (Tutoriel)</h4>
              <ChevronDown size={16} style={{ transform: tutorialOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
            </div>
            {tutorialOpen && (
              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                <p style={{ marginBottom: '10px' }}><strong>À quoi sert le SMTP ?</strong> Le SMTP est le protocole standard d'envoi d'emails. En renseignant ces informations, vous autorisez FacturaPro à expédier des factures directement depuis votre adresse mail professionnelle.</p>
                
                <h5 style={{ fontWeight: 600, color: 'var(--foreground)', marginTop: '16px', marginBottom: '6px' }}>Pour Gmail / Google Workspace :</h5>
                <ul style={{ paddingLeft: '16px', marginBottom: '10px', listStyleType: 'disc' }}>
                  <li><strong>Hôte :</strong> smtp.gmail.com</li>
                  <li><strong>Port :</strong> 465 (SSL) ou 587 (TLS)</li>
                  <li><strong>Mot de passe :</strong> Il ne s'agit <em>pas</em> de votre mot de passe habituel. Vous devez générer un "Mot de passe d'application". (Allez sur votre compte Google &gt; Sécurité &gt; Validation en deux étapes &gt; Mots de passe des applications).</li>
                </ul>

                <h5 style={{ fontWeight: 600, color: 'var(--foreground)', marginTop: '16px', marginBottom: '6px' }}>Pour Hostinger :</h5>
                <ul style={{ paddingLeft: '16px', marginBottom: '10px', listStyleType: 'disc' }}>
                  <li><strong>Hôte :</strong> smtp.hostinger.com</li>
                  <li><strong>Port :</strong> 465 (SSL)</li>
                  <li><strong>Mot de passe :</strong> Le mot de passe de votre boîte mail Hostinger.</li>
                </ul>

                <h5 style={{ fontWeight: 600, color: 'var(--foreground)', marginTop: '16px', marginBottom: '6px' }}>Pour OVH :</h5>
                <ul style={{ paddingLeft: '16px', marginBottom: '10px', listStyleType: 'disc' }}>
                  <li><strong>Hôte :</strong> ssl0.ovh.net</li>
                  <li><strong>Port :</strong> 465 (SSL)</li>
                  <li><strong>Mot de passe :</strong> Le mot de passe de votre boîte mail OVH.</li>
                </ul>
              </div>
            )}
          </div>
        </Section>

        {/* Automatisation */}
        <Section title="Automatisation & Facturation" desc="Configuration des relances et préférences globales." icon={Zap} delay={0.3}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Field label="Devise Principale">
              <select {...register('currency')} style={selectStyle}>
                <option value="XOF">FCFA (XOF)</option>
                <option value="GNF">Franc Guinéen (GNF)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
              </select>
            </Field>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', opacity: 0.6, pointerEvents: 'none' }}>
              <input type="checkbox" id="autoRemindersEnabled" checked={false} readOnly style={{ width: '16px', height: '16px', cursor: 'not-allowed', accentColor: 'var(--gold)' }} />
              <label htmlFor="autoRemindersEnabled" style={{ fontSize: '13px', fontWeight: 500, cursor: 'not-allowed', color: 'var(--foreground)' }}>Activer les relances automatiques par Email/WhatsApp</label>
              <span style={{ fontSize: '10px', background: 'var(--gold-dim)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Bientôt disponible</span>
            </div>
            
            {watch('autoRemindersEnabled') && (
              <Field label="Rythme des relances (jours)" hint="Ex : [-5, -3, 0, 3] = 5j avant, 3j avant, Jour J, 3j après">
                <input type="text" {...register('autoReminderDays')} style={inputStyle} placeholder="[-5, -3, 0]" />
              </Field>
            )}
          </div>
        </Section>

      </div>

      {/* ── Abonnement & Factures ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', margin: '24px auto 0' }}>
        <Section title="Abonnement & Factures" desc="Gérez votre abonnement FacturaPro et téléchargez vos factures de paiement SaaS." icon={Banknote} delay={0.35}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>Plan Actuel : {settings?.subscriptionPlan?.toUpperCase() || 'FREE'}</p>
                <p style={{ fontSize: '12px', color: 'var(--foreground-subtle)', marginTop: '4px' }}>
                  {settings?.subscriptionExpiresAt 
                    ? `Expire le ${new Date(settings.subscriptionExpiresAt).toLocaleDateString('fr-FR')}`
                    : "Aucun abonnement actif"}
                </p>
              </div>
              <button type="button" className="fp-btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => window.location.href='/pricing'}>
                Gérer l'abonnement
              </button>
            </div>
            
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '8px' }}>Historique des paiements</p>
              <div style={{ textAlign: 'center', padding: '24px 16px', border: '1px dashed var(--border)', borderRadius: '6px', color: 'var(--foreground-subtle)' }}>
                <FileText size={24} style={{ opacity: 0.3, margin: '0 auto 8px' }}/>
                <p style={{ fontSize: '12px' }}>Vos factures d'abonnement apparaîtront ici.</p>
              </div>
            </div>
          </div>
        </Section>
      </div>      {/* ── Save button ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid var(--border)', marginTop: '16px' }}>
        <button type="submit" className="fp-btn-primary" style={{ padding: '11px 28px', fontSize: '14px' }}>
          <Save size={15}/> Enregistrer les modifications
        </button>
      </div>
    </form>
  );
}
