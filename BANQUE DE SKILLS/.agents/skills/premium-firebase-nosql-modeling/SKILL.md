---
name: premium-firebase-nosql-modeling
description: "Définit les règles strictes de modélisation NoSQL pour Firebase Firestore afin de garantir des lectures rapides, scalables et économiques."
---

# Skill : Modélisation NoSQL Firestore (Ultra-Premium)

**Contexte :**
Firebase Firestore est une base de données NoSQL orientée documents. Les requêtes sont rapides et scalent automatiquement, mais elles sont limitées par la structure des données. Ce skill garantit que la base de données est modélisée pour des performances maximales et une minimisation des coûts (Firebase facture au nombre de lectures).

## 1. Principes Fondamentaux de Firestore
- **Les lectures sont chères, le stockage est gratuit** : Ne pas hésiter à dupliquer des données (dénormalisation) si cela permet de réduire le nombre de requêtes nécessaires pour afficher une page.
- **Règle du document unique** : Un écran = Une requête dans l'idéal. Si le dashboard nécessite des informations d'utilisateurs et de commandes, envisagez de stocker les métadonnées clés dans le même document ou de consolider les données lors de l'écriture (Cloud Functions).
- **Pas de jointures SQL** : Oubliez les jointures classiques. Si vous avez besoin des infos de l'auteur sur un post, stockez `{ authorId, authorName, authorAvatar }` directement dans le document du post.

## 2. Dénormalisation vs Normalisation
- **Dénormalisez** les données qui changent rarement mais sont lues souvent (ex: Nom de l'utilisateur sur un commentaire).
- **Normalisez** (séparez dans une autre collection) les données qui sont énormes, changent tout le temps, ou ne sont pas affichées en même temps (ex: Le contenu d'un article très long vs ses métadonnées dans une liste).

## 3. Stratégies de Collections
- **Collections Racine** (`/users`, `/posts`) : Pour les entités principales de l'application qui doivent être cherchées globalement.
- **Sous-collections** (`/users/{uid}/settings`) : Pour des données fortement liées à un parent et qui pourraient grossir à l'infini. Utile si l'on veut récupérer le parent sans charger toutes les sous-données.
- **Tableaux (Arrays)** : À n'utiliser que pour de petites listes de valeurs (ex: `tags: ['premium', 'seo']`) dont la taille ne dépassera jamais une centaine d'éléments (limite de taille de document: 1MB). Ne JAMAIS y stocker de gros objets. Utilisez `arrayUnion` et `arrayRemove` pour les modifier.

## 4. Aggrégations et Compteurs
- Ne comptez pas les documents côté client en chargeant toute une collection (`docs.length`). C'est extrêmement coûteux et lent.
- **Solution 1 (Cloud Functions)** : Utilisez un document `metadata` (ex: `/stats/global`) et incrémentez/décrémentez avec `FieldValue.increment(1)` via des Triggers Firestore (`onCreate`, `onDelete`).
- **Solution 2 (Count() API)** : Utilisez la nouvelle API `getCountFromServer()` si vous avez juste besoin du chiffre à un instant T (payant, mais beaucoup moins cher que de charger les documents).

## 5. Règle du "Queryability" (Capacité de Requêtage)
- Firestore limite les requêtes (pas de "OR" infini, limitations sur le "IN", filtres sur de multiples champs).
- Créez des champs calculés pour faciliter les recherches. 
- *Exemple* : Pour chercher si un rendez-vous est "passé" ou "à venir", au lieu de faire une requête complexe sur la date, créez un champ booléen `isUpcoming` mis à jour par une fonction cron.

## Exécution du Skill
1. Analyser le besoin métier (Dashboard, Site public).
2. Lister les vues (écrans) exactes que le client/utilisateur va voir.
3. Créer un schéma de données (en format JSON commenté) dans l'artefact de conception.
4. Justifier chaque choix de dénormalisation selon la règle "Lectures optimisées".
