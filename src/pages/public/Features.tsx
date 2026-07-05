import { Link } from 'react-router-dom';
import { PublicNavbar, PublicFooter } from './Layout';

const features = [
  { icon: '🤖', title: 'Assistant IA ARIA', desc: 'ARIA est votre assistante intelligente intégrée. Elle connaît vos clients, votre catalogue et peut créer des factures ou reçus sur simple instruction textuelle en français.', detail: ['Création de factures par commande', 'Recherche de clients en temps réel', 'Actions confirmées instantanément'] },
  { icon: '📄', title: 'Factures Proforma', desc: 'Générez des factures d\'une qualité professionnelle exceptionnelle. Vos documents comportent votre logo, signature, numérotation automatique et tous les détails réglementaires.', detail: ['Logo et signature intégrés', 'Numérotation séquentielle', 'Export PDF vectoriel haute qualité'] },
  { icon: '🧾', title: 'Reçus de Paiement', desc: 'Chaque paiement reçu est immédiatement documenté. Les reçus sont liés aux factures correspondantes et les soldes sont mis à jour automatiquement.', detail: ['Liés aux factures sources', 'Mise à jour automatique des soldes', 'Statuts en temps réel'] },
  { icon: '👥', title: 'Gestion des Clients', desc: 'Une base de données client complète avec historique de facturation, total des transactions, soldes en cours et toutes les coordonnées en un seul endroit.', detail: ['Historique complet', 'Soldes en temps réel', 'Recherche et filtres avancés'] },
  { icon: '📊', title: 'Tableau de Bord Analytique', desc: 'Visualisez instantanément votre performance commerciale. CA mensuel, documents récents, nombre de clients actifs, et impayés à suivre.', detail: ['Statistiques en temps réel', 'Documents récents', 'Indicateurs de performance'] },
  { icon: '💱', title: 'Multi-devises', desc: 'Paramétrez librement votre devise dans les paramètres. Franc guinéen, FCFA, Dollar, Euro — l\'outil s\'adapte à votre marché et à vos clients.', detail: ['GNF, FCFA, USD, EUR', 'Changement en un clic', 'Paramétrage centralisé'] },
  { icon: '📁', title: 'Catalogue de Services', desc: 'Créez votre catalogue de produits et services avec tarifs unitaires. Lors de la création de factures, sélectionnez directement depuis votre catalogue.', detail: ['Prix unitaires pré-remplis', 'Catégorisation libre', 'Import rapide dans les factures'] },
  { icon: '🛡️', title: 'Données Sécurisées', desc: 'Vos données restent sur votre propre infrastructure. Pas de cloud externe, pas de partage avec des tiers. Vos informations sont entièrement privées.', detail: ['Stockage local sécurisé', 'Base SQLite chiffrée', 'Aucun accès tiers'] },
];

export function Features() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Page header */}
      <div style={{ paddingTop: '100px', paddingBottom: '64px', background: 'linear-gradient(160deg, #f8fafc, #f0fdf4)', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '5px 14px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: '#059669', marginBottom: '20px' }}>Fonctionnalités</div>
          <h1 style={{ fontSize: 'clamp(32px,5vw,54px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-2px', marginBottom: '18px' }}>Une suite complète<br />pour votre entreprise</h1>
          <p style={{ fontSize: '17px', color: '#64748b', maxWidth: '540px', margin: '0 auto', lineHeight: 1.75 }}>
            FacturaPro réunit toutes les fonctions qu'une entreprise professionnelle a besoin. Voici le détail de chaque module.
          </p>
        </div>
      </div>

      {/* Features grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '80px' }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '28px', transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = '#bbf7d0'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', fontSize: '22px' }}>{f.icon}</div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', letterSpacing: '-0.3px' }}>{f.title}</h2>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.75, marginBottom: '18px' }}>{f.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {f.detail.map((d, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#475569' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
                    </div>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '56px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', marginBottom: '14px' }}>Prêt à tester FacturaPro ?</h2>
          <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '28px', lineHeight: 1.7 }}>Créez votre espace en quelques secondes. Aucune carte bancaire requise pour commencer.</p>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', background: '#059669', color: '#fff', borderRadius: '9px', textDecoration: 'none', fontSize: '15px', fontWeight: 600, boxShadow: '0 2px 12px rgba(5,150,105,0.25)' }}>
            Créer mon espace gratuitement
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
