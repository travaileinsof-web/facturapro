---
name: premium-content-i18n
description: "Met en place l'architecture multilingue parfaite (i18n) dans Next.js, incluant le routing basé sur la langue, les dictionnaires et le SEO international."
---

# Skill : Internationalisation (i18n) et SEO Multilingue

**Contexte :**
Les sites haut de gamme s'adressent souvent à une clientèle internationale. L'internationalisation ne doit pas se faire au détriment des performances ou du SEO (comme c'est le cas avec des plugins de traduction côté client). Ce skill configure un i18n natif, rapide et optimisé SEO dans Next.js.

## 1. Routing Multilingue (App Router)
- Ne pas traduire dynamiquement côté client. Utiliser le système de dossiers multilingues de Next.js App Router (ex: `/app/[lang]/page.tsx`).
- L'URL doit toujours refléter la langue. Ex: `domaine.com/fr/` ou `domaine.com/en/`.
- Configurer le fichier `middleware.ts` pour rediriger automatiquement l'utilisateur vers sa langue préférée (`Accept-Language` header) lors de son arrivée à la racine du site.

## 2. Gestion des Dictionnaires
- Ne pas importer toute la bibliothèque de traduction sur chaque page.
- Créer un dossier `/dictionaries` avec des fichiers JSON (`en.json`, `fr.json`).
- Utiliser une fonction asynchrone `getDictionary(lang)` au niveau du Server Component pour charger uniquement le JSON requis.

## 3. SEO International (La règle des Hreflang)
C'est la partie la plus critique. Si elle est mal faite, Google considèrera les différentes langues comme du contenu dupliqué.
- Dans l'API Metadata de Next.js, utiliser l'attribut `alternates.languages`.
```typescript
export async function generateMetadata({ params: { lang } }) {
  return {
    alternates: {
      canonical: `https://site.com/${lang}`,
      languages: {
        'fr-FR': 'https://site.com/fr',
        'en-US': 'https://site.com/en',
      },
    },
  }
}
```

## 4. Bascule de Langue (Language Switcher)
- Le sélecteur de langue doit être élégant. Privilégier le nom complet de la langue ("English", "Français") plutôt que des drapeaux (un drapeau représente un pays, pas une langue).
- La bascule doit mettre à jour l'URL sans recharger brutalement la fenêtre (utiliser `next/navigation`).

## Exécution du Skill
1. Mettre en place le dossier dynamique `[lang]` à la racine de `/app`.
2. Créer le `middleware.ts` de négociation de langue.
3. Créer la fonction utilitaire de récupération des dictionnaires JSON.
4. Injecter les métadonnées SEO `hreflang` de manière globale via le layout parent.
