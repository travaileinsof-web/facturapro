import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAppStore, apiFetch } from '../lib/store';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Upload, Loader2, Save, Building2, CreditCard, Lock, Mail, Zap, Palette, ChevronDown, Banknote, FileText, HelpCircle } from 'lucide-react';
import { Joyride, STATUS, Step } from 'react-joyride';
import { PageHeader } from './ui/PageHeader';
import { cn } from '../lib/utils';

/* ── Section wrapper ─────────────────────────────────────────────── */
function Section({ id, title, desc, icon: Icon, children, delay = 0, isMissing = false }: {
  id?: string; title: string; desc?: string; icon: any; children: React.ReactNode; delay?: number; isMissing?: boolean;
}) {
  return (
    <div id={id} className={cn("fp-card animate-[fp-fade-up_0.5s_ease_forwards] opacity-0", isMissing && "fp-missing-section")} style={{ animationDelay: `${delay}s` }}>
      <div style={{ borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'flex-start', padding: 'var(--space-4)', gap: 'var(--space-3)' }}>
        <div style={{ width: '40px', height: '40px', background: 'var(--color-primary-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={20} style={{ color: 'var(--color-primary)' }}/>
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: desc ? '2px' : 0 }}>{title}</p>
          {desc && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>{desc}</p>}
        </div>
      </div>
      <div style={{ padding: 'var(--space-4)' }}>{children}</div>
    </div>
  );
}

/* ── Field wrapper ───────────────────────────────────────────────── */
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', letterSpacing: '0.02em', marginBottom: '6px' }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{hint}</p>}
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
      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', letterSpacing: '0.02em', marginBottom: '6px' }}>{label}</label>
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input type="text" value={value || ''} readOnly style={{ width: '100%', padding: '8px 12px', background: 'var(--color-bg-page)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', cursor: 'not-allowed' }} placeholder="Aucun fichier" />
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading} style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-sm)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', padding: '8px 12px', gap: 'var(--space-2)', opacity: loading ? 0.5 : 1 }}>
          {loading ? <Loader2 size={16} className="fp-spin" /> : <Upload size={16} />} {loading ? 'Envoi...' : 'Parcourir'}
        </button>
      </div>
      {hint && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{hint}</p>}
    </div>
  );
}

export function Settings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const setTourRunning = useAppStore(state => state.setTourRunning);
  
  const [tourRun, setTourRun] = useState(false);

  const tourSteps: Step[] = [
    {
      target: '#tour-profile',
      content: "Renseignez d'abord les informations de votre entreprise (Nom, Adresse, etc.). Elles apparaîtront sur les en-têtes de vos factures et devis.",
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-bank',
      content: "Ajoutez ensuite vos informations bancaires et juridiques (IBAN, NIF, RCCM) pour que vos clients sachent comment vous payer légalement.",
      placement: 'bottom',
    },
    {
      target: '#tour-identity',
      content: "Personnalisez l'apparence de vos documents en téléchargeant votre logo, votre cachet, votre signature et en choisissant votre couleur principale.",
      placement: 'top',
    },
    {
      target: '#tour-automation',
      content: "Choisissez votre devise principale ici. Les réglages d'automatisation des relances se trouvent également dans cette section.",
      placement: 'top',
    },
    {
      target: '#tour-security',
      content: "Modifiez votre mot de passe ici pour sécuriser l'accès à votre compte.",
      placement: 'top',
    },
    {
      target: '#tour-subscription',
      content: "Enfin, consultez l'historique de vos paiements et gérez votre abonnement à FacturaPro.",
      placement: 'top',
    }
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as string)) {
      setTourRun(false);
    }
  };

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
    if (data.password && data.password !== data.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    // Currency is strictly GNF

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
      // ✅ FIX BUG #2 : Le store reçoit la devise mise à jour depuis la réponse du backend
      useAppStore.getState().login({ ...currentUser, ...updated } as any);
      
      setValue('currentPassword', '');
      setValue('password', '');
      setValue('confirmPassword', '');
      refetch();

      toast.success("✅ Paramètres mis à jour avec succès.");
    } else {
      let errorMsg = "Erreur lors de l'enregistrement.";
      try {
        const errData = await res.json();
        if (errData.error) errorMsg = `Erreur serveur : ${errData.error}`;
      } catch {}
      toast.error(errorMsg, { duration: 8000 });
    }
  };


  if (!settings) return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--space-4)' }}>
      {[1,2,3,4].map(i => <div key={i} className="fp-skeleton h-[180px]"/>)}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '4px 8px', background: 'var(--color-bg-page)',
    border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text-primary)', fontSize: '11px', fontFamily: 'var(--font-sans)',
    outline: 'none', transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', appearance: 'none' };

  const isProfileMissing = !settings.companyName;
  const isBankMissing = !settings.taxId;
  const isIdentityMissing = !settings.logo || !settings.primaryColor;


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-[960px] mx-auto" style={{ paddingBottom: 'var(--space-10)' }}>
      {/* @ts-ignore: Suppress react-joyride typing issues */}
      <Joyride
        steps={tourSteps}
        run={tourRun}
        continuous
        scrollToFirstStep
        showProgress
        showSkipButton
        {...{ callback: handleJoyrideCallback } as any}
        styles={{
          options: {
            primaryColor: settings.primaryColor || '#B38E36',
            zIndex: 10000,
          }
        } as any}
        locale={{
          back: 'Précédent',
          close: 'Fermer',
          last: 'Terminer',
          next: 'Suivant',
          skip: 'Passer la visite',
        }}
      />
      <style>{`
        @keyframes pulse-halo {
          0% { box-shadow: 0 0 0 0px var(--color-primary); }
          70% { box-shadow: 0 0 0 6px transparent; }
          100% { box-shadow: 0 0 0 0px transparent; }
        }
        .fp-missing-section {
          border: 1px solid var(--color-primary) !important;
          animation: pulse-halo 2s infinite;
          opacity: 1 !important;
        }
      `}</style>
      <PageHeader
        title="Paramètres"
        description="Configurez votre profil, votre société et vos intégrations."
        icon={<FileText size={20} />}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button type="button" onClick={() => setTourRun(true)} className="fp-btn-outline flex items-center" style={{ gap: 'var(--space-2)' }}>
              <HelpCircle size={15} /> Visite guidée
            </button>
            <button type="submit" className="fp-btn-primary flex items-center" style={{ gap: 'var(--space-2)' }}>
              <Save size={15} /> Enregistrer
            </button>
          </div>
        }
      />
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '700px', gap: 'var(--space-4)' }}>

        {/* Profil Entreprise */}
        <Section id="tour-profile" title="Profil de l'Entreprise" desc="Ces informations apparaitront sur vos factures et devis." icon={Building2} delay={0.1} isMissing={isProfileMissing}>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--space-4)' }}>
            <Field label="Nom de l'entreprise *">
              <input type="text" {...register('companyName')} style={inputStyle} placeholder="Nom officiel" />
            </Field>
            <Field label="Slogan">
              <input type="text" {...register('slogan')} style={inputStyle} placeholder="Votre devise" />
            </Field>
            <div className="col-span-1 md:col-span-2">
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
            <div className="col-span-1 md:col-span-2">
              <Field label="Message WhatsApp par défaut" hint="Pré-rempli lors de l'envoi de factures via WhatsApp.">
                <textarea {...register('whatsappMessage')} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
              </Field>
            </div>
          </div>
        </Section>

        {/* Informations Bancaires */}
        <Section id="tour-bank" title="Banque & Juridique" desc="Pour faciliter les paiements de vos clients." icon={CreditCard} delay={0.15} isMissing={isBankMissing}>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--space-4)' }}>
            <Field label="Nom de la Banque">
              <input type="text" {...register('bankName')} style={inputStyle} placeholder="Ex: Société Générale" />
            </Field>
            <Field label="NIF (Numéro d'Identification Fiscale) *">
              <input type="text" {...register('taxId')} style={inputStyle} placeholder="NIF" />
            </Field>
            <Field label="Forme Juridique">
              <input type="text" {...register('legalForm')} style={inputStyle} placeholder="Ex: SARL, SA, Entreprise Individuelle" />
            </Field>
            <Field label="RCCM (Registre du Commerce)">
              <input type="text" {...register('rccm')} style={inputStyle} placeholder="Ex: GN.TCC.2023.B.12345" />
            </Field>
            <Field label="Régime Fiscal">
              <input type="text" {...register('taxRegime')} style={inputStyle} placeholder="Ex: Réel Simplifié, Assujetti à la TVA" />
            </Field>
            <Field label="Taux de TVA par défaut (%)">
              <input type="number" step="0.01" {...register('defaultVatRate')} style={inputStyle} placeholder="18" />
            </Field>
            <div className="col-span-1 md:col-span-2">
              <Field label="Coordonnées bancaires (IBAN, RIB...)">
                <textarea {...register('bankAccount')} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="IBAN: FR76 ..." />
              </Field>
            </div>
          </div>
        </Section>

        {/* Identité Visuelle */}
        <Section id="tour-identity" title="Identité Visuelle" desc="Personnalisez vos documents. Les images sont automatiquement envoyées au serveur." icon={Palette} delay={0.2} isMissing={isIdentityMissing}>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--space-4)' }}>
            <input type="hidden" {...register('logo')} />
            <input type="hidden" {...register('stamp')} />
            <input type="hidden" {...register('signature')} />
            <ImageUploadField label="Logo" hint="Format JPG ou PNG, max 5MB" value={watch('logo')} onChange={(url) => setValue('logo', url)} onUploading={v => setUploadingField(v ? 'logo' : null)} />
            
            <Field label="Couleur Principale">
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input type="color" value={watch('primaryColor') || '#B38E36'} onChange={(e) => setValue('primaryColor', e.target.value)} className="w-10 h-[38px] p-0 border-none bg-transparent cursor-pointer" />
                <input type="text" {...register('primaryColor')} style={{ ...inputStyle, flex: 1 }} placeholder="#B38E36" />
              </div>
            </Field>
            
            <Field label="Couleur Secondaire">
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input type="color" value={watch('secondaryColor') || '#3A72D6'} onChange={(e) => setValue('secondaryColor', e.target.value)} className="w-10 h-[38px] p-0 border-none bg-transparent cursor-pointer" />
                <input type="text" {...register('secondaryColor')} style={{ ...inputStyle, flex: 1 }} placeholder="#3A72D6" />
              </div>
            </Field>

            <Field label="Couleur d'Accentuation">
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input type="color" value={watch('accentColor') || '#16A34A'} onChange={(e) => setValue('accentColor', e.target.value)} className="w-10 h-[38px] p-0 border-none bg-transparent cursor-pointer" />
                <input type="text" {...register('accentColor')} style={{ ...inputStyle, flex: 1 }} placeholder="#16A34A" />
              </div>
            </Field>

            <ImageUploadField label="Cachet de l'entreprise" value={watch('stamp')} onChange={(url) => setValue('stamp', url)} onUploading={v => setUploadingField(v ? 'stamp' : null)} />
            <ImageUploadField label="Signature électronique" value={watch('signature')} onChange={(url) => setValue('signature', url)} onUploading={v => setUploadingField(v ? 'signature' : null)} />
          </div>
        </Section>



        {/* Automatisation */}
        <Section id="tour-automation" title="Automatisation & Facturation" desc="Configuration des relances et préférences globales." icon={Zap} delay={0.3}>
          <div className="flex flex-col" style={{ gap: 'var(--space-4)' }}>
            <div style={{ display: 'none' }}>
              <Field label="Devise Principale">
                <input type="hidden" {...register('currency')} value="GNF" />
              </Field>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', opacity: 0.6, pointerEvents: 'none', marginTop: 'var(--space-2)', gap: 'var(--space-2)' }}>
              <input type="checkbox" id="autoRemindersEnabled" checked={false} readOnly style={{ width: '16px', height: '16px', cursor: 'not-allowed', accentColor: 'var(--color-primary)' }} />
              <label htmlFor="autoRemindersEnabled" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', cursor: 'not-allowed', color: 'var(--color-text-primary)', margin: 0 }}>Activer les relances automatiques par Email/WhatsApp</label>
              <span style={{ fontSize: '10px', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', fontWeight: 'var(--font-weight-semibold)', padding: '2px var(--space-1)' }}>Bientôt disponible</span>
            </div>
            
            {watch('autoRemindersEnabled') && (
              <Field label="Rythme des relances (jours)" hint="Ex : [-5, -3, 0, 3] = 5j avant, 3j avant, Jour J, 3j après">
                <input type="text" {...register('autoReminderDays')} style={inputStyle} placeholder="[-5, -3, 0]" />
              </Field>
            )}
          </div>
        </Section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
        <Section id="tour-security" title="Sécurité" desc="Modifiez votre mot de passe pour sécuriser votre compte." icon={Lock} delay={0.25}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Field label="Mot de passe actuel">
              <div style={{ position: 'relative' }}>
                <input type={showCurrentPassword ? 'text' : 'password'} {...register('currentPassword')} style={{...inputStyle, paddingRight: '40px'}} placeholder="••••••••" />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Field label="Nouveau mot de passe">
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} {...register('password')} style={{...inputStyle, paddingRight: '40px'}} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirmation">
                <div style={{ position: 'relative' }}>
                  <input type={showConfirmPassword ? 'text' : 'password'} {...register('confirmPassword')} style={{...inputStyle, paddingRight: '40px'}} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '-8px' }}>Laissez vide si vous ne souhaitez pas modifier votre mot de passe.</p>
          </div>
        </Section>

        <Section id="tour-subscription" title="Abonnement & Factures" desc="Gérez votre abonnement FacturaPro et téléchargez vos factures de paiement SaaS." icon={Banknote} delay={0.35}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', margin: 0 }}>Plan Actuel : {settings?.subscriptionPlan?.toUpperCase() || 'FREE'}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', margin: 0 }}>
                  {settings?.subscriptionExpiresAt 
                    ? `Expire le ${new Date(settings.subscriptionExpiresAt).toLocaleDateString('fr-FR')}`
                    : "Aucun abonnement actif"}
                </p>
              </div>
              <button type="button" className="fp-btn-outline text-xs px-3 py-1.5" onClick={() => window.location.href='/pricing'}>
                Gérer l'abonnement
              </button>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-[var(--foreground-muted)]" style={{ marginBottom: 'var(--space-2)' }}>Historique des paiements</p>
              <div className="text-center border border-dashed border-[var(--border)] rounded-md text-[var(--foreground-subtle)]" style={{ padding: 'var(--space-6)' }}>
                <FileText size={24} className="opacity-30 mx-auto" style={{ marginBottom: 'var(--space-2)' }}/>
                <p className="text-xs">Vos factures d'abonnement apparaîtront ici.</p>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ── Save button ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-5)', marginTop: 'var(--space-4)' }}>
        <button type="submit" className="fp-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-6)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
          <Save size={15}/> Enregistrer les modifications
        </button>
      </div>
    </form>
  );
}
