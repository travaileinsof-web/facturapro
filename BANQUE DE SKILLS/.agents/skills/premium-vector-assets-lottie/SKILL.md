---
name: premium-vector-assets-lottie
description: "Intègre et optimise les assets vectoriels animés (Lottie, Rive, SVGs complexes) pour des micro-interactions visuellement bluffantes mais ultra-légères."
---

# Skill : Intégration d'Assets Vectoriels (Lottie & Rive)

**Contexte :**
Pour des illustrations animées complexes, des icônes réactives, ou des loaders très brandés, le code (GSAP) atteint ses limites de maintenabilité. Ce skill prend le relais en utilisant des formats d'animation vectorielle (Lottie JSON, ou mieux, Rive) qui offrent un rendu parfait (vectoriel) à un coût de performance minimal.

## 1. Choix du Format
- **Lottie (.json)** : Standard de l'industrie, excellent pour exporter depuis After Effects. À utiliser pour des animations linéaires (ex: un loader, une illustration d'erreur).
- **Rive (.riv)** : Format plus récent, ultra-léger et interactif (Machine à états). À privilégier pour les icônes interactives complexes (ex: un bouton play qui réagit au survol, puis au clic).

## 2. Intégration Lottie dans Next.js (Ultra-Premium)
- Ne pas charger le player Lottie complet s'il n'est pas nécessaire, utiliser la version `light` (`lottie-web/build/player/lottie_light`) qui ne supporte que les SVG (largement suffisant et plus léger).
- Dans React, utiliser le hook `lottie-react` (ou construire un wrapper) et charger le fichier JSON de manière dynamique (lazy loading) pour ne pas bloquer le First Contentful Paint (FCP).

```javascript
// Exemple de Lazy Loading d'un Lottie
import dynamic from 'next/dynamic';
const LottiePlayer = dynamic(() => import('lottie-react'), { ssr: false });
```

## 3. Optimisation des Fichiers
- Analyser la taille du fichier Lottie. S'il dépasse 300Ko, l'optimiser via [LottieFiles Optimizer](https://lottiefiles.com/tools/optimize-lottie) ou s'assurer que le designer n'a pas inclus d'images matricielles (PNG/JPG) encodées en base64 dans le JSON.

## 4. Contrôle Interactif (Scroll & Hover)
- Ne pas se contenter du `autoplay: true`.
- Asservir l'animation Lottie au scroll (ex: avec ScrollTrigger de GSAP pilotant la méthode `goToAndStop()` du Lottie).
- Asservir l'animation au hover pour les icônes (ex: `onMouseEnter={() => lottieRef.current.playSegments([0, 60], true)}`).

## 5. Remplacement Dégradé (Fallback)
- Un site ultra-premium ne montre jamais un espace vide le temps que le script Lottie se charge.
- Afficher un SVG statique de la première frame de l'animation en tant que "placeholder" ou fallback.

## Exécution du Skill
1. Récupérer le fichier d'animation du designer.
2. Déterminer si l'animation nécessite de l'interactivité (survol, scroll) ou si elle est autonome.
3. Implémenter l'intégration asynchrone pour préserver le FCP (Core Web Vitals).
4. Créer la logique d'interactivité (machine à état pour Rive, ou gestion des segments pour Lottie).
