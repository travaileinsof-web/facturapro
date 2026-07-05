---
name: premium-design-system-tailwind
description: "Crée un Design System ultra-premium, fluide et responsive avec Tailwind CSS (gestion avancée de la typographie, des couleurs luxe et des espacements fluidiques)."
---

# Skill : Design System Ultra-Premium (Tailwind CSS)

**Contexte :**
Un site "ultra haut de gamme" se distingue par sa perfection visuelle : espacements irréprochables, typographie adaptative (fluid typography), et palette de couleurs maîtrisée à la perfection. Ce skill configure Tailwind CSS pour atteindre ce niveau d'exigence, en sortant des réglages par défaut "basiques" de Tailwind.

## 1. Typographie Fluide (Fluid Typography)
La typographie ne doit pas sauter brusquement avec des breakpoints (`text-sm md:text-lg`). Elle doit s'agrandir de manière fluide selon la largeur de l'écran (fonction CSS `clamp()`).
- Dans `tailwind.config.ts`, étendre les `fontSize` en utilisant `clamp`.
- Exemple de configuration exigée :
```javascript
fontSize: {
  'fluid-h1': 'clamp(2.5rem, 5vw + 1rem, 5rem)', // Scalable title
  'fluid-h2': 'clamp(2rem, 4vw + 1rem, 4rem)',
  'fluid-p': 'clamp(1rem, 1.5vw + 0.5rem, 1.125rem)',
}
```
- Utiliser systématiquement des polices variables (Variable Fonts) pour un contrôle granulaire du `font-weight`.

## 2. Palette de Couleurs "Luxe"
- Un site premium utilise rarement les couleurs standard de Tailwind (`blue-500`, `red-500`).
- Imposer des variables CSS dans le fichier `globals.css` pour gérer le thème (support du Dark Mode).
- Configuration Tailwind :
```javascript
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  accent: 'hsl(var(--accent))',
}
```

## 3. Espacements Fluides (Fluid Spacing)
Comme pour la typographie, les marges (`margin`) et les remplissages (`padding`) des sections majeures doivent être fluides.
- Étendre le thème pour les paddings de section :
```javascript
spacing: {
  'section-y': 'clamp(4rem, 8vw, 10rem)',
  'section-x': 'clamp(1.5rem, 5vw, 6rem)',
}
```
- Usage : `<section className="py-section-y px-section-x">`

## 4. Micro-interactions et UI "Glassmorphism"
Le luxe implique des finitions parfaites. Intégrer des classes utilitaires pour les effets haut de gamme :
- **Glassmorphism propre** : Flou d'arrière-plan, bordure semi-transparente, ombre diffuse.
- **Transitions douces** : `transition-all duration-500 ease-out`.

## 5. Accessibilité "Invisible" (A11y)
L'élégance ne doit pas casser l'accessibilité.
- S'assurer que les états `:focus-visible` sont stylisés élégamment (ex: un anneau discret plutôt que le focus natif bleu du navigateur).
- Vérifier les contrastes (WCAG AAA) via les variables HSL.

## Exécution du Skill
1. Générer et configurer le fichier `tailwind.config.ts` complet incluant le support des variables HSL, du fluid typography et des espacements.
2. Rédiger le fichier `globals.css` définissant le thème "Luxe" (Dark & Light).
3. S'assurer que les classes utilitaires permettent une construction rapide tout en respectant strictement les règles du design system.
