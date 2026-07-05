---
name: premium-continuous-security-qa
description: "Processus de paranoïa continue : revérifie chaque portion de code (2 à 3 fois) pendant la production pour traquer failles, bugs et dettes techniques avant de valider un composant."
---

# Skill : Paranoïa de Code & QA Sécurité Continu

**Contexte :**
Ce skill incarne le principe : *"Ne laisse nulle place où la main ne passe et repasse"*.
Dans le développement web ultra-premium, il est inacceptable de pousser un code comportant des failles de sécurité, des bugs, ou une architecture bancale.
L'IA doit appeler ou appliquer mentalement ce skill **immédiatement après avoir écrit ou modifié un fichier critique**, avant de considérer la tâche comme terminée.

## Protocole de Triple Vérification

À chaque fois que tu produis un code (Front-end ou Back-end), tu dois effectuer les 3 passes d'analyse suivantes de façon rigoureuse :

### 1. Passe de Sécurité (Sécurité & Failles)
- **Injection & XSS** : Les entrées utilisateur sont-elles toutes "sanitizées" (via `Zod`, `DOMPurify`) ? Y a-t-il un risque de Cross-Site Scripting via une faille de rendu ?
- **Autorisations (Backend/Firebase)** : Le composant vérifie-t-il que l'utilisateur a les droits d'exécuter cette action ? (Firebase Security Rules, Auth tokens).
- **Fuite de données** : Le composant expose-t-il accidentellement des données privées (clés API dans le bundle client, données sensibles dans le JSON renvoyé par l'API) ?

### 2. Passe de Robustesse (Bugs & Edge Cases)
- **Gestion des Erreurs** : Que se passe-t-il si le réseau coupe ? Si l'API renvoie une erreur 500 ? (Vérifier la présence d'Error Boundaries et de toasts d'erreurs UI).
- **Empty States & Loading** : As-tu géré les Skeletons pendant le chargement et les affichages vides si la base de données ne renvoie rien ?
- **Memory Leaks** : Y a-t-il des `useEffect` sans fonctions de nettoyage (cleanup) ? Des écouteurs d'événements GSAP mal détachés lors du démontage du composant ?

### 3. Passe d'Excellence (Performance & Clean Code)
- **Rendus inutiles** : Le code provoque-t-il des re-renders React inutiles ? L'état global (Zustand) est-il consommé proprement via des sélecteurs fins ?
- **Respect du Radar** : As-tu utilisé les outils du `premium-tech-radar-stack` (ex: `next/image` au lieu de `<img>`) ?
- **Simplicité** : Le code est-il trop complexe ? Peut-il être refactorisé de manière plus élégante ?

## Action Obligatoire de Correction
Si l'une de ces 3 passes révèle une vulnérabilité ou une imperfection (même de 5%), **tu dois immédiatement réviser le code**. Ne dis jamais "je corrigerai ça plus tard". Répète le cycle d'édition jusqu'à ce que la portion de code soit impénétrable et parfaite.
