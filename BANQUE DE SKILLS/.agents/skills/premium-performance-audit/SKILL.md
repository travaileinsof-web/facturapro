---
name: premium-performance-audit
description: "Processus strict d'audit des performances et d'optimisation des Core Web Vitals (LCP, FID, CLS) avant toute mise en production."
---

# Skill : Audit de Performance et Optimisation Extrême

**Contexte :**
Un site ultra-premium n'a pas le droit d'être lent. Un mauvais score de performance détruit l'expérience utilisateur, l'effort SEO et l'image de marque. Ce skill ne se contente pas de mesurer, il donne les directives d'optimisation chirurgicale pour obtenir un score Lighthouse de 95-100 partout.

## 1. Les 3 Piliers (Core Web Vitals)
- **LCP (Largest Contentful Paint)** : Doit être < 2.5 secondes. Souvent impacté par l'image héro ou le chargement de la police principale.
- **INP (Interaction to Next Paint - ex FID)** : Doit être < 200 millisecondes. Souvent impacté par un blocage du thread principal (JS trop lourd, hydratation React massive).
- **CLS (Cumulative Layout Shift)** : Doit être < 0.1. Impacté par les images sans dimensions, les webfonts qui popent, ou les bannières injectées dynamiquement.

## 2. Optimisations Chirurgicales LCP
- Identifier le "LCP Element" (le plus gros bloc visible au chargement). Si c'est une image :
  - Ajouter la balise `<link rel="preload" as="image" href="..." />`.
  - Dans Next.js, s'assurer que `priority={true}` est sur ce composant `<Image />`.
  - Ne **jamais** utiliser le Lazy Loading sur les images de la première ligne de flottaison (above the fold).

## 3. Chasse aux Kilo-octets (JavaScript)
- Next.js (App Router) envoie très peu de JS par défaut (Server Components).
- Analyser les dépendances client lourdes avec `@next/bundle-analyzer`.
- Si une bibliothèque (ex: Three.js ou Lottie) est très lourde, l'importer de manière paresseuse (Lazy Load) uniquement quand le composant entre dans le viewport (en combinant `next/dynamic` et `IntersectionObserver`).

## 4. Chasse aux Kilo-octets (CSS)
- Tailwind gère l'extraction du CSS utilisé (Tree-shaking CSS).
- Veiller à ce qu'aucune police Google Fonts ne soit importée via un `@import` CSS. Utiliser le package `next/font` qui télécharge la police au build et l'inclut directement, supprimant les requêtes externes.

## 5. Audit Lighthouse (Local et CI)
- Effectuer un audit Lighthouse sur la version de **production** (après un `npm run build` && `npm run start`). Ne jamais faire d'audit Lighthouse sur le serveur de développement (`npm run dev`), les résultats sont faussés.
- Optionnel mais premium : Intégrer l'Action GitHub `Lighthouse CI (LHCI)` pour refuser une Pull Request si le score de performance chute de plus de 5%.

## Exécution du Skill
1. Construire l'application en production localement (`build` puis `start`).
2. Exécuter un audit Lighthouse via DevTools.
3. Identifier le LCP Element et appliquer les règles d'optimisation.
4. Analyser le bundle JS pour détecter les composants "Client" trop lourds et proposer un refactoring en Server Component ou en Lazy Loading.
