---
name: premium-animations-gsap
description: "Chorégraphie des animations ultra-premium en utilisant GSAP, Framer Motion ou des API WebGL, avec une gestion experte du scroll fluide (Lenis) et du nettoyage de la mémoire."
---

# Skill : Chorégraphie d'Animation Avancée (GSAP & Scroll Fluide)

**Contexte :**
L'effet "Waouh" d'un site ultra-premium provient de la chorégraphie de ses animations (rythme, inertie, easing) et non d'animations basiques (comme de simples "fade-in"). Ce skill exige l'usage d'outils professionnels pour l'animation complexe, spécifiquement GSAP (GreenSock) associé à du scroll fluide (Lenis ou Locomotive Scroll).

## 1. Moteur d'Animation et Easing
- **Outil** : Toujours privilégier **GSAP** pour les animations de scroll (ScrollTrigger), les timelines complexes et le WebGL. Utiliser **Framer Motion** uniquement pour les micro-interactions simples ou les transitions de page dans l'App Router.
- **Easing personnalisé** : Ne jamais utiliser `ease: "linear"` ou `ease: "power1.out"` sans y réfléchir. Le luxe s'exprime par des easings exponentiels ou élastiques parfaitement dosés.
  ```javascript
  // Exemple d'un Easing "Luxe" pour l'apparition d'un titre
  gsap.from(".title-luxe", {
    y: 100,
    opacity: 0,
    duration: 1.5,
    ease: "power4.out", // Ou "expo.out" pour une sensation de légèreté
    stagger: 0.05
  });
  ```

## 2. Scroll Fluide (Lenis)
Le scroll natif du navigateur est souvent perçu comme "haché" sur un site luxueux.
- Intégrer `@studio-freight/lenis` ou équivalent à la racine de l'application (`layout.tsx`).
- Le configurer avec une inertie très douce mais réactive.
- Synchroniser le Ticker de GSAP avec celui de Lenis pour éviter les saccades lors du déclenchement des animations au scroll.

## 3. Performance (La Règle d'Or de l'Animation)
- **N'animer QUE `transform` (x, y, scale, rotate) et `opacity`**. N'animez JAMAIS `width`, `height`, `top`, `left`, ou `box-shadow`, car cela déclenche un *Layout recalculation* et tue les performances (chute des FPS).
- Utiliser la propriété `will-change` (via CSS ou GSAP `willChange: "transform"`) *uniquement* sur les éléments lourds et l'enlever à la fin de l'animation.

## 4. Gestion de la Mémoire (React + GSAP)
Dans Next.js/React, GSAP doit être utilisé avec le hook `@gsap/react` (`useGSAP()`).
- Le hook s'occupe du nettoyage (cleanup) lors du démontage du composant (unmount). C'est crucial pour éviter les fuites de mémoire.
  ```javascript
  useGSAP(() => {
    // Les animations GSAP ici
    gsap.to(".box", { x: 100 });
  }, { scope: containerRef }); // Toujours scoper les sélecteurs
  ```

## 5. Micro-interactions (Hover)
- Les survols de boutons (hovers) doivent utiliser des pseudo-éléments (::before/::after) transformés, ou des effets "magnétiques" (où le bouton suit légèrement le curseur de la souris).
- Exemple d'effet magnétique : Calculer la position X/Y de la souris par rapport au centre du bouton et faire un `gsap.to(button, {x: deltaX * 0.2, y: deltaY * 0.2})`.

## Exécution du Skill
1. Analyser la maquette ou la demande pour identifier les éléments à animer.
2. Concevoir la "timeline" mentale de l'animation avant de coder.
3. Implémenter en respectant le principe "Hardware Accelerated Only" (transform/opacity).
4. S'assurer de la synchronisation parfaite avec le Scroll fluide et valider qu'il n'y a aucune fuite mémoire au changement de page.
