---
name: premium-architecture
description: "Met en place l'architecture fondamentale ultra-premium (Next.js App Router, Tailwind, Firebase) pour des performances extrêmes et un code modulaire."
---

# Skill : Architecture Ultra-Premium (Next.js + Firebase + Tailwind)

**Contexte :**
Ce skill est invoqué lors de l'initialisation d'un nouveau projet web ultra haut de gamme. L'objectif est de garantir une base de code parfaite, scalable, extrêmement rapide (performances SEO optimales) et maintenable, en utilisant Next.js (App Router), Tailwind CSS, et Firebase.

## 1. Stack Technologique Imposée
- **Framework React** : Next.js (version 14+, App Router obligatoire).
- **Styling** : Tailwind CSS v3/v4 avec utilitaires pour la fluidité (clamp) et le design ultra-luxe.
- **Backend / BaaS** : Firebase (Auth, Firestore, Storage, Hosting).
- **Gestion d'état** : Zustand (léger, rapide, pas de boilerplate) ou Context API natif.
- **Typage** : TypeScript strict obligatoire.

## 2. Structure de Dossiers (Architecture Modulaire)
Ne jamais utiliser une architecture plate. Utiliser la structure FSD (Feature-Sliced Design) simplifiée ou une architecture par domaine.

Créer l'arborescence suivante à la racine :
```text
/src
  /app           # Next.js App Router (pages, layouts, api routes)
  /components    # Composants partagés
    /ui          # Composants de base (Boutons, Inputs) - style Shadcn
    /layout      # Header, Footer, Navigation
    /animations  # Wrappers d'animation (GSAP, Framer)
  /lib           # Utilitaires (Firebase config, helpers, formatters)
  /hooks         # Custom React hooks (ex: useAuth, useScroll)
  /services      # Appels Firebase (AuthService, FirestoreService)
  /store         # Zustand stores (ex: useUserStore.ts)
  /types         # Interfaces TypeScript globales
  /styles        # Fichiers CSS globaux (globals.css avec Tailwind)
  /constants     # Variables globales, routes, erreurs
```

## 3. Configuration Firebase Optimisée
- Isoler la configuration Firebase dans `/src/lib/firebase/config.ts`.
- S'assurer que Firebase est initialisé une seule fois (pattern Singleton).
- **Règle d'or** : Ne JAMAIS importer le SDK Admin Firebase côté client.
- Exposer des instances claires : `export const auth = getAuth(app); export const db = getFirestore(app);`

## 4. Règles de Performance (Next.js)
1. **Server Components par défaut** : Tout composant dans `/app` doit être un RSC (React Server Component) sauf s'il nécessite de l'interactivité (`useState`, `useEffect`, onClick).
2. **"use client" granulaire** : Ne mettre `"use client"` que sur les feuilles de l'arbre de composants (les boutons, les formulaires, les animations GSAP).
3. **Images** : Toujours utiliser `next/image` (`<Image />`) avec des tailles définies ou `fill` et `sizes` pour éviter le Cumulative Layout Shift (CLS).
4. **Polices** : Utiliser `next/font/google` ou `next/font/local` pour éviter les flashes de texte non stylisé (FOUT/FOIT).

## 5. Directives de Typage (TypeScript)
- `any` est strictement interdit.
- Typer tous les retours de fonctions et les props de composants.
- Pour Firestore, utiliser des *Converters* Firestore (`withConverter`) pour typer automatiquement les documents lus et écrits depuis la base de données.

## Exécution du Skill
Lorsque ce skill est déclenché, l'agent doit :
1. Analyser le projet existant ou créer les dossiers mentionnés.
2. Écrire le fichier `firebase/config.ts` propre.
3. Écrire le `layout.tsx` principal avec la configuration de police optimisée.
4. Confirmer que la base architecturale est en place et prête pour le développement des composants.
