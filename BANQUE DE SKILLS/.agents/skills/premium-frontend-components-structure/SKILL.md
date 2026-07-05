---
name: premium-frontend-components-structure
description: "Définit les standards de conception des composants UI : Atomic Design, gestion des états d'erreur, de chargement et de vide (Empty States) avec élégance."
---

# Skill : Structuration Avancée des Composants UI

**Contexte :**
Un site premium est irréprochable dans les moments de latence ou d'absence de données. L'interface ne doit jamais "casser" visuellement. Ce skill encadre la création des composants en imposant la gestion systématique des états extrêmes.

## 1. Composants Squelettes (Skeletons) vs Loaders
- Règle d'or : Ne **jamais** afficher une simple roue de chargement (spinner) au milieu d'un grand écran vide.
- Utiliser des **Skeleton Loaders** animés (effet *shimmer*) qui miment la structure finale de la donnée en cours de chargement.
- Dans Next.js App Router, utiliser le fichier `loading.tsx` qui repose sur React Suspense pour afficher le Skeleton automatiquement.

## 2. Empty States (États Vides) Luxueux
Quand une liste est vide (pas de commandes, pas de résultats de recherche) :
- Ne jamais afficher un texte brut "Aucun résultat".
- L'Empty State doit être l'occasion d'afficher une illustration vectorielle premium (SVG ou Lottie monochrome).
- Proposer systématiquement un bouton "Call to Action" (Ex: "Voir notre catalogue" ou "Créer un nouveau projet").

## 3. Error Boundaries et Fallbacks
- Tout bloc risquant d'échouer (Appel API externe, bloc 3D complexe) doit être encapsulé dans un composant `<ErrorBoundary>`.
- Dans Next.js, utiliser `error.tsx` pour isoler les erreurs à la route concernée.
- Le design de l'erreur doit rester dans le thème du site, en proposant un bouton "Réessayer".

## 4. Composants Polymorphiques
Pour les boutons et la typographie, créer des composants réutilisables polymorphiques (capables d'être rendus sous forme de `<a>`, `<button>` ou `<Link>`).
- Utiliser `class-variance-authority` (cva) pour gérer les variantes (Primary, Outline, Ghost) et la librairie `tailwind-merge` (`twMerge`) pour éviter les conflits de classes CSS.

## Exécution du Skill
Pour chaque nouvelle fonctionnalité demandée :
1. Penser et designer l'état d'attente (Skeleton).
2. Penser et designer l'état d'absence de donnée (Empty State).
3. Développer le composant avec ses variantes (cva).
4. Intégrer les transitions douces (Opacité) entre l'état de chargement et la donnée réelle.
