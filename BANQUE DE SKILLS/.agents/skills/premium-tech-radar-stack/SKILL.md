---
name: premium-tech-radar-stack
description: "Radar technologique officiel de l'agence listant les 167 outils et bibliothèques open-source autorisés pour garantir la qualité ultra-premium."
---

# Skill : Radar Technologique & Stack Ultra-Premium

**Contexte :**
Ce skill est la Bible technologique de l'agence. En tant qu'IA, lors du développement d'une fonctionnalité, je dois **strictement me référer à cette liste** pour choisir une bibliothèque open-source. Il est interdit d'utiliser des bibliothèques obsolètes, peu maintenues ou génériques si une alternative de ce radar existe.

## Règle d'or de l'écosystème
**Si un besoin technique se présente, utiliser l'outil défini ci-dessous.**

## 1. Animations & 3D (Le "Wow Effect")
- **Animations 2D & Timelines** : `GSAP (GreenSock)` (avec `ScrollTrigger`, `MorphSVG`, `SplitText`). Interdiction d'utiliser jQuery ou des librairies d'animation obsolètes.
- **Scroll Fluide** : `Lenis` (Smooth Scroll).
- **Micro-interactions React** : `Framer Motion` ou `react-spring`.
- **Assets Vectoriels** : `lottie-web` (idéalement en lazy load).
- **3D & WebGL** : `Three.js` et son écosystème React (`@react-three/fiber`, `@react-three/drei`, `@react-three/rapier` pour la physique).

## 2. UI/UX & Design System
- **Framework CSS** : `Tailwind CSS` (avec `postcss` et `autoprefixer`).
- **Composants Prêts à l'emploi** : `shadcn/ui` et `Radix UI Primitives` (Accessibilité Headless).
- **Icônes** : `Lucide React`.
- **Variantes de Composants** : `cva` (Class Variance Authority) + `tailwind-merge`.
- **Typographie Fluide** : Utiliser la fonction CSS `clamp()` (ex: `css-clamper`).

## 3. Formulaires & Validation
- **Gestion du Formulaire** : `React Hook Form` (Performance optimale sans re-rendus).
- **Validation du Schéma** : `Zod` (TypeScript-first validation).

## 4. Backend, Base de Données & CMS
- **Stack Principale** : `Firebase` (JavaScript SDK, Admin SDK Node.js, Cloud Firestore, Firebase Auth, Cloud Functions, Storage).
- **Hooks React pour Firebase** : `reactfire`.
- **Sécurité Base de Données** : `Firebase Security Rules`.
- **CMS Headless (Alternative si Firestore n'est pas utilisé)** : `Sanity` ou `Strapi`.
- **Éditeur de texte riche (Dashboard)** : `Tiptap` ou `Lexical` (Meta).

## 5. Performance & Core Web Vitals
- **Analyse et Audit** : `Lighthouse`, `web-vitals`, `Vercel Speed Insights`.
- **Optimisation des Bundles** : `@next/bundle-analyzer`.
- **Traitement d'images serveur** : `Sharp`.
- **Composants natifs** : Utilisation stricte de `next/image` et `next/font`.

## 6. SEO, Accessibilité & Conformité
- **SEO Technique** : `Next.js Metadata API`, `next-sitemap` (pour la génération des Sitemaps).
- **Données Structurées (JSON-LD)** : `schema-dts`.
- **Accessibilité (A11y)** : `axe-core`, `eslint-plugin-jsx-a11y`, `focus-trap`.
- **Consentement (RGPD)** : Gestion stricte des trackers avec `Google Tag Manager` via Consent Mode v2.

## 7. E-Commerce & Paiements
- **Paiements par Carte** : `Stripe.js` et `@stripe/react-stripe-js`.
- **Panier et SaaS** : `Snipcart` ou `Lemon Squeezy JS SDK`.

## 8. Qualité du Code, CI/CD & Déploiement
- **Qualité du code** : `ESLint`, `Prettier`, `TypeScript` (mode strict), `Husky`, `lint-staged`.
- **Tests** : `Vitest` ou `Jest` (Tests unitaires), `Playwright` ou `Cypress` (Tests E2E).
- **Déploiement et DevOps** : `Vercel CLI`, `Firebase Hosting`, `GitHub Actions Toolkit`.
- **Monitoring d'erreurs en production** : `Sentry JavaScript SDK`.

## 9. Sécurité Web Intégrée
- **Headers & Nettoyage** : `Helmet.js`, `DOMPurify` (protection XSS).
- **Rate Limiting** : `rate-limiter-flexible`.
- **Validation** : `Zod` (input validation côté serveur).

## Exécution du Skill
1. **Évaluation d'Architecture** : Avant d'ajouter une nouvelle dépendance `npm`, vérifier systématiquement si une solution approuvée existe dans ce radar.
2. **Implémentation** : Importer et configurer la librairie selon ses propres best-practices documentées sur son GitHub.
3. **Mise à jour** : Considérer ce fichier comme le standard absolu de l'agence. Aucune déviation n'est permise sans justification majeure liée à la sécurité ou à une évolution de l'écosystème.
