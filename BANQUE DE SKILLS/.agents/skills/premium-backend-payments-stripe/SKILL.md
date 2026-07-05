---
name: premium-backend-payments-stripe
description: "Intègre l'API Stripe pour la gestion des paiements, factures et abonnements, tout en assurant une sécurité absolue via Firebase Cloud Functions."
---

# Skill : Intégration Sécurisée des Paiements (Stripe + Firebase)

**Contexte :**
Sur un site haut de gamme, l'expérience de paiement doit être fluide, inspirer une confiance absolue, et être techniquement infaillible. Ce skill encadre l'intégration de Stripe via les Cloud Functions (backend) pour prévenir toute faille de sécurité ou manipulation des prix.

## 1. Sécurité Absolue : Le Rôle du Backend
**Règle absolue :** Ne *jamais* envoyer de montant d'argent depuis le client frontend vers Stripe. Un attaquant pourrait modifier le payload JavaScript et envoyer un achat à 0.01€.
- Le client appelle une Firebase Cloud Function (`createCheckoutSession`).
- La Cloud Function lit la base de données Firestore sécurisée pour trouver le vrai prix du produit.
- La Cloud Function communique le vrai prix à Stripe, récupère un ID de session, et le renvoie au client.

## 2. L'Expérience Frontend (Stripe Checkout vs Custom Elements)
- **Stripe Checkout** : Plus facile à intégrer, redirige vers une page hébergée par Stripe (très sécurisé et optimisé pour la conversion). Fortement recommandé.
- **Stripe Elements** : Le formulaire est intégré directement sur la page de l'agence. Permet un design 100% sur-mesure (Ultra Premium). Exige l'usage de `@stripe/react-stripe-js`.

## 3. Webhooks (L'Écouteur d'Événements)
Le paiement n'est validé QUE lorsque Stripe confirme la transaction en arrière-plan.
- Créer une Cloud Function de type Webhook (`stripeWebhook`).
- Sécuriser l'endpoint en vérifiant la signature cryptographique envoyée par Stripe (`stripe.webhooks.constructEvent`).
- Réagir aux événements (ex: `checkout.session.completed` -> Mettre à jour Firestore : `isPaid = true`).

## 4. Gestion des Abonnements (SaaS)
Si l'agence vend des abonnements (maintenance, hébergement premium) :
- Modéliser la base de données avec une collection `subscriptions` liée à l'utilisateur.
- Utiliser le portail client de Stripe (`Stripe Customer Portal`) pour permettre au client final de télécharger ses factures ou de changer de carte bancaire sans développer l'interface soi-même.

## Exécution du Skill
1. Installer la librairie Stripe côté serveur (`stripe`) et client (`@stripe/stripe-js`).
2. Créer la fonction de génération de session de paiement sécurisée.
3. Mettre en place l'endpoint Webhook pour écouter les réussites et échecs de paiement.
4. Mettre à jour la base de données Firestore lors de la confirmation asynchrone du webhook.
