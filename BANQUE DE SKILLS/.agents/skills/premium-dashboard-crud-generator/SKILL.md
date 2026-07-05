---
name: premium-dashboard-crud-generator
description: "Génère rapidement l'architecture standard pour un module CRUD (Create, Read, Update, Delete) complet dans le Dashboard, connecté à Firestore."
---

# Skill : Générateur d'Architecture CRUD (Dashboard)

**Contexte :**
Le dashboard d'administration est le cœur de contrôle du client. Pour développer rapidement sans perte de qualité, ce skill normalise la création de toute nouvelle entité (ex: "Projets", "Articles", "Membres de l'équipe") en générant les 4 vues nécessaires (Liste, Création, Édition, Visualisation) et la logique d'accès Firestore.

## 1. La Vue Liste (Read - Table)
- Composant Table ultra-propre (ex: `@tanstack/react-table` pour la pagination et le tri).
- La liste doit afficher les états "Skeleton" pendant la récupération des documents.
- Colonne "Actions" obligatoire avec menu déroulant discret (Modifier, Archiver, Supprimer).

## 2. La Vue Édition/Création (Create & Update - Form)
- Utilise le standard défini dans le skill `premium-frontend-forms-validation`.
- En mode "Update", le formulaire doit pré-remplir ses valeurs via `defaultValues` uniquement après la récupération complète de l'entité depuis la base de données.
- Intégrer l'éditeur riche (`premium-dashboard-rich-editor`) si un champ "Contenu" ou "Description" est présent.

## 3. Gestion Firestore Modulaire
Ne jamais mettre les appels `addDoc` ou `getDocs` directement dans le composant React. Créer un service dédié (ex: `/src/services/ProjectService.ts`) :
- `getProjects()`
- `getProjectById(id)`
- `createProject(data)`
- `updateProject(id, data)`
- `deleteProject(id)` -> Privilégier le Soft Delete (passer un boolean `isDeleted: true` plutôt que de détruire la donnée).

## 4. Feedback et Notifications (Toasts)
- Toute action (Création réussie, Erreur réseau) doit déclencher une notification temporaire et élégante (ex: `sonner` ou `react-hot-toast`).
- En cas de création réussie, rediriger automatiquement vers la Vue Liste avec `useRouter().push()`.

## Exécution du Skill
Lorsque l'on demande d'ajouter un module (ex: "Le client veut gérer ses Témoignages") :
1. Créer le Service Firestore pour "Témoignages".
2. Créer le schéma Zod pour la validation.
3. Créer la Page de Liste avec le composant Table.
4. Créer la Page Formulaire (commune pour Création et Édition, changeant de comportement selon la présence d'un ID dans l'URL).
