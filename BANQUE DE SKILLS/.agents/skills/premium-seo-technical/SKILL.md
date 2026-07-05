---
name: premium-seo-technical
description: "Configure un SEO technique irréprochable (Schema.org, Balises Open Graph, Next.js Metadata API) pour la domination sur les moteurs de recherche."
---

# Skill : SEO Technique Ultra-Poussé (Next.js)

**Contexte :**
Un site premium doit avoir un score SEO parfait. La technique doit soutenir le contenu avec des balisages sémantiques riches, une génération dynamique des sitemaps, et des méta-données exhaustives.

## 1. Next.js Metadata API
- Utiliser l'API Metadata de Next.js App Router. Éviter d'insérer des balises `<head>` manuelles.
- Exiger la fonction `generateMetadata({ params })` pour chaque page dynamique (ex: un article de blog tiré depuis Firestore).
- La configuration de base (Titre, Description, Open Graph, Twitter Cards) doit être générée dynamiquement et avoir des *fallbacks* (valeurs par défaut) en cas de champs manquants en BDD.

## 2. Données Structurées (JSON-LD Schema.org)
Pour qu'un site se détache dans Google (Rich Snippets), le JSON-LD est vital.
- Créer un composant réutilisable `<SchemaOrg type="Article" data={articleData} />` injectant le script JSON-LD.
- Injecter les schémas `LocalBusiness` ou `Organization` sur la page d'accueil.
- Injecter les schémas `Article`, `Product`, ou `FAQPage` selon le type de page.

## 3. URLs, Redirections et Canonicalisation
- Assurer des URLs "propres" (kebab-case, sans caractères spéciaux).
- Protéger le site du *Duplicate Content* :
  - Ajouter la balise canonique (Canonical URL) dans les Metadata générées, pointant toujours vers l'URL officielle (sans paramètres tracking ?utm).
  - Gérer les trailing slashes (les retirer par défaut via le `next.config.js`).

## 4. Génération de Sitemaps Dynamiques
- Avec Next.js App Router, utiliser le fichier `sitemap.ts`.
- Ce fichier doit se connecter à Firestore pour récupérer dynamiquement les URLs de toutes les pages (articles, catégories, produits), ainsi que leurs dates de dernière modification (`lastModified`).
- Scinder les sitemaps si le site dépasse 50 000 URLs (Next.js gère la génération de sitemap index).

## 5. Fichier robots.txt
- Créer un fichier `robots.ts` pour générer le `robots.txt`.
- Autoriser l'exploration des pages publiques, bloquer impérativement l'accès au `robots.txt` aux sous-chemins du dashboard (ex: `/admin`).

## Exécution du Skill
1. Ajouter la Metadata API globale dans le `layout.tsx` de base.
2. Écrire le fichier dynamique `sitemap.ts` lisant depuis Firestore.
3. Créer le composant générateur de JSON-LD.
4. Effectuer un test de validation avec l'outil de test des résultats enrichis de Google (Rich Results Test).
