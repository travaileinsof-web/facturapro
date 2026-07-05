---
name: premium-firebase-cloud-functions
description: "Développe des Firebase Cloud Functions performantes (v2) pour déporter la logique métier lourde côté serveur, de manière sécurisée et scalable."
---

# Skill : Firebase Cloud Functions (Logique Métier Premium)

**Contexte :**
La logique complexe (envoi d'emails, compression d'images, paiements, aggrégation de statistiques) ne doit jamais être exécutée sur le client (le navigateur web de l'utilisateur), pour des raisons de sécurité et de performance. Ce skill déploie l'architecture des Cloud Functions Firebase (version 2) pour un site ultra haut de gamme.

## 1. Cloud Functions v2 (Cloud Run)
- Toujours utiliser l'API v2 (`firebase-functions/v2`) qui est basée sur Cloud Run. Elle offre une meilleure concurrence (plusieurs requêtes par instance) et de meilleurs temps de démarrage à froid (Cold Starts).
- Écrire impérativement les fonctions en TypeScript strict.

## 2. Typologie des Fonctions

### A. Les Triggers Firestore (Réactivité)
Déclenchées automatiquement par des événements dans la BDD.
- **`onDocumentCreated`, `onDocumentUpdated`, `onDocumentDeleted`**.
- *Usage Premium* : Aggrégation de données. Quand un commentaire est ajouté, une fonction incrémente le compteur de commentaires du post. Quand un projet est publié, une fonction génère les images miniatures asynchrones.

### B. Les Callable Functions (Actions Directes)
Déclenchées manuellement depuis le Frontend via le SDK Firebase (contrairement aux API HTTP standard, elles gèrent l'Auth et l'App Check toutes seules).
- *Usage Premium* : Déclencher un envoi d'email de devis via SendGrid/Resend, appeler l'API de Stripe pour créer une session de paiement sécurisée.
- *Sécurité* : Valider impérativement `request.auth` dès la première ligne de la fonction.

### C. Les Fonctions Programmées (Cron Jobs)
Exécutées à intervalles réguliers (`onSchedule`).
- *Usage Premium* : Nettoyage des brouillons abandonnés, relance par email (workflows CRM), génération de rapports analytiques nocturnes.

## 3. Optimisation des Cold Starts
- **Import dynamique** : N'importez pas des modules lourds (ex: Stripe, Nodemailer) en haut du fichier globalement. Importez-les dynamiquement à l'intérieur du corps de la fonction si possible, pour accélérer le démarrage de l'instance.
- **Ressources partagées** : Initialiser `admin.initializeApp()` une seule fois globalement.

## 4. Gestion des Erreurs et Logs
- Utiliser `functions.logger` pour logger structuré (Info, Warn, Error). Ne jamais utiliser `console.log()` classique.
- Retourner des erreurs `HttpsError` explicites au client pour les Callable functions (`throw new HttpsError('permission-denied', 'Message')`).

## Exécution du Skill
1. Structurer le dossier `functions/src` de manière modulaire (ne pas tout mettre dans `index.ts`). Ex: `functions/src/triggers`, `functions/src/callable`.
2. Développer la logique métier demandée en v2 avec TypeScript.
3. Tester localement avec la suite d'émulateurs Firebase (Firebase Local Emulator Suite).
4. S'assurer de la bonne gestion des imports dynamiques pour les dépendances lourdes.
