---
name: premium-dashboard-rich-editor
description: "Intègre un éditeur de texte riche de type 'Notion' (Block-based) dans le dashboard pour une expérience client luxueuse lors de la création de contenu."
---

# Skill : Éditeur Riche (Type Notion) pour Dashboard

**Contexte :**
Un back-office ultra-premium ne se contente pas d'un simple champ de texte (textarea) ou d'un éditeur WYSIWYG archaïque. L'expérience client (UX) pour rédiger des articles ou éditer les pages doit être aussi fluide et élégante que l'outil Notion. Ce skill met en place un éditeur basé sur des blocs (Block-style editor) adapté à React/Next.js.

## 1. Choix Technologique
- Outil recommandé : **TipTap** (Headless, très paramétrable, basé sur ProseMirror) ou **Editor.js** (orienté blocs purs).
- L'approche "Headless" est obligatoire pour appliquer le Design System (Tailwind) du projet à l'éditeur lui-même, plutôt que de subir un design par défaut imposé par une librairie.

## 2. Fonctionnalités Requises
- Support du Markdown au clavier (taper `#` + Espace crée un titre H1, `-` crée une liste).
- Drag-and-drop de blocs de contenu (textes, images, citations).
- Menu flottant stylisé (Bubble Menu) au sursaut de la sélection, plutôt qu'une barre d'outils fixe et encombrante.

## 3. Gestion des Médias
- Le téléchargement d'images depuis l'éditeur doit être géré en arrière-plan :
  1. Dès le glisser-déposer de l'image, upload immédiat vers Firebase Storage.
  2. Affichage d'un spinner de chargement dans l'éditeur.
  3. Remplacement par l'image finale via son URL Firebase Storage.
- Les images doivent être compressées *avant* l'upload (ex: utilisation de `browser-image-compression`).

## 4. Persistance des Données
- Ne pas sauvegarder du HTML brut dans Firestore si possible (lourd, dangereux).
- Sauvegarder l'état sous forme de JSON structuré (le format natif d'Editor.js ou de TipTap). 
- Cela permet un rendu parfait côté frontend via un composant interpréteur, et protège contre les failles XSS (le HTML est généré par React).

## Exécution du Skill
1. Analyser le besoin en contenu du client (Quels types de blocs lui faut-il ? Textes, Images, Embed Vidéos ?).
2. Mettre en place le composant Éditeur Headless (TipTap).
3. Connecter la logique d'upload Firebase Storage pour la gestion des images in-line.
4. Créer le composant Frontend de "rendu" qui lira le JSON stocké dans Firestore pour générer le code HTML propre et respectueux du SEO sur le site public.
