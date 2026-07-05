---
name: premium-art-direction-standards
description: "Règles strictes de Direction Artistique basées sur les standards Awwwards (Wibify, EatNaked, Rideradian). Définit les micro-interactions, la typographie, et le design de luxe."
---

# Skill : Standards de Direction Artistique (Awwwards Level)

**Contexte :**
Ce skill est utilisé par le **Directeur Artistique (Sous-Agent)** pour évaluer et forcer la qualité visuelle du front-end. L'objectif est d'atteindre le standard "Awwwards". Un site standard ou générique sera immédiatement rejeté. 

Si tu construis une interface, tu **DOIS** inclure les éléments suivants :

## 1. La Navigation et le Scroll (Le Fondement)
- **Smooth Scroll Obligatoire** : L'utilisation de `Lenis` (ou équivalent) est non-négociable. Le défilement natif brutal est interdit.
- **Scroll Hijacking Modéré** : Créer des sections qui se fixent (Pinning via `GSAP ScrollTrigger`) pendant que d'autres éléments défilent horizontalement ou s'empilent.
- **Le Curseur** : Désactiver le curseur natif (`cursor: none;`) et implémenter un curseur personnalisé fluide (souvent un petit point + un cercle en retard) qui réagit (grandit ou change de couleur) au survol des liens.

## 2. Typographie & Contrastes (Le Style Luxe)
- **Typographie Géante (Hero Sections)** : Utiliser des polices ultra-modernes (ex: PP Neue Montreal, Clash Display, ou Inter) en taille massive. La fonction CSS `clamp()` doit être utilisée pour la fluidité.
- **Contraste Extrême** : Privilégier les thèmes très sombres (ex: `#050505` ou `#000000`) avec des accents vifs ou pastel très fins, ou l'inverse absolu (Pure White minimaliste).
- **Grain & Bruit** : Ajouter subtilement une texture de grain (Noise/Film grain) en superposition (`mix-blend-mode`) pour donner de la profondeur.

## 3. Les Micro-Interactions (Le "Wow Effect")
- **Boutons Magnétiques** : Les boutons d'appel à l'action (CTA) doivent attirer le curseur lorsqu'il s'en approche.
- **Apparition au Scroll (Reveal)** : Aucun élément ne doit apparaître brutalement. Tout doit être révélé de manière asynchrone (FadeUp, Stagger, lignes de texte qui se masquent (`overflow: hidden`) puis montent).
- **Hover Effects** : Les survols d'images doivent déclencher des effets WebGL fluides (distorsion, wave, displacement) via `Three.js` ou des masques SVG (`clip-path`).

## 4. Les Transitions et le Loading
- **Preloader Cinématique** : L'utilisateur ne doit jamais voir la page charger. Un loader stylisé (0 à 100%, ou un SVG qui se dessine via `DrawSVG`) doit cacher le processus, puis s'effacer avec une transition fluide.
- **Page Transitions** : Ne jamais utiliser les rechargements de page natifs du navigateur. Utiliser des routeurs animés (ex: `Framer Motion` AnimatePresence) pour passer d'une page à l'autre.

## Règle de Rejet (Pour le Directeur Artistique) :
Si le composant proposé ressemble à un simple template Bootstrap ou Tailwind sans âme, tu dois exiger sa réécriture complète. L'UI doit être **"Vivante"**.
