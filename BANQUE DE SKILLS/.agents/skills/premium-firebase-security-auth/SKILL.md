---
name: premium-firebase-security-auth
description: "Configure l'authentification et les règles de sécurité Firestore/Storage avec une rigueur absolue pour bloquer toute vulnérabilité."
---

# Skill : Configuration Sécurité et Auth Firebase (Ultra-Premium)

**Contexte :**
Firebase expose la base de données directement au client. Sans Security Rules robustes, n'importe quel attaquant peut lire, modifier ou supprimer toutes les données. Ce skill met en place une forteresse sécuritaire autour de Firestore et Storage, et gère l'authentification (rôles et permissions).

## 1. Modèle d'Authentification
- Utiliser Firebase Authentication (Email/Password, Google).
- Imposer des Custom Claims (`admin`, `editor`) via Cloud Functions pour la gestion des rôles. 
- *Ne jamais* se fier à un document "users" modifiable côté client pour vérifier le rôle d'un utilisateur dans les Security Rules.

## 2. Principes des Security Rules (Firestore & Storage)
- **Deny by default** : La règle racine doit toujours bloquer l'accès.
  ```javascript
  match /{document=**} {
    allow read, write: if false;
  }
  ```
- **Validation Granulaire** : Les règles doivent valider le *schéma*, le *type*, et le *contenu* des données entrantes (`request.resource.data`).
- **Limitation d'accès (RBAC)** : Vérifier les tokens d'authentification (`request.auth`) et les custom claims (`request.auth.token.admin == true`).

## 3. Rédiger des Fonctions de Sécurité
Dans les Security Rules, utiliser des fonctions pour rendre le code lisible et maintenable :
```javascript
function isAuthenticated() {
  return request.auth != null;
}
function isAdmin() {
  return isAuthenticated() && request.auth.token.admin == true;
}
function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}
function isValidString(text, min, max) {
  return text is string && text.size() >= min && text.size() <= max;
}
```

## 4. Exemple de Règle de Création Ultra-Sécurisée
Si un utilisateur peut créer un commentaire :
```javascript
match /comments/{commentId} {
  allow create: if isAuthenticated()
                // Doit inclure l'ID de l'auteur
                && request.resource.data.authorId == request.auth.uid
                // Valider la taille du texte
                && isValidString(request.resource.data.text, 1, 500)
                // Interdire les champs non autorisés (ex: isApproved)
                && !("isApproved" in request.resource.data);
}
```

## 5. Gestion des Secrets (Environnement)
- Les clés API (Client) peuvent être publiques, elles sont protégées par les Security Rules et l'App Check.
- **App Check** : Implémenter Firebase App Check (reCaptcha Enterprise ou App Attest) pour s'assurer que seules vos applications (web/mobile) peuvent interroger l'API, bloquant ainsi le trafic de scripts automatisés ou de cURL.
- Mettre les clés privées (Service Accounts pour le back-end) dans les secrets (Firebase Secret Manager ou .env local non tracké).

## Exécution du Skill
1. Générer le fichier `firestore.rules` avec le "Deny by Default".
2. Générer le fichier `storage.rules` similaire.
3. Rédiger les règles spécifiques pour chaque collection identifiée dans le cahier des charges, en appliquant une validation stricte du schéma de données.
4. Ajouter la configuration d'initialisation de Firebase App Check dans le code frontend.
