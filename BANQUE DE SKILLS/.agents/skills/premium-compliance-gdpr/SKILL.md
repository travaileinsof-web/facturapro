---
name: premium-compliance-gdpr
description: "Garantit la conformité légale absolue du projet (RGPD, gestion des cookies Consent Mode v2, politiques de confidentialité) avec une intégration invisible pour l'UX."
---

# Skill : Conformité RGPD et Consent Mode v2

**Contexte :**
La conformité légale (RGPD en Europe) est une exigence de base pour les agences web. L'amateurisme sur la gestion des données expose le client final à des amendes. Ce skill assure que le site respecte strictement la loi, tout en gardant un design de bannière de cookies élégant, sans casser l'UX premium.

## 1. Consent Mode v2 (Google)
- Google exige désormais le Consent Mode v2 pour collecter des données analytiques ou publicitaires (Google Analytics 4, Google Ads).
- Avant que l'utilisateur ne donne son accord, le script de tracking doit être chargé, mais les cookies doivent être bloqués (ping anonyme uniquement).
- Ne jamais charger un script externe (Pixel Facebook, Hotjar, Google Analytics) sans avoir reçu l'accord explicite (`ad_storage='granted'`, `analytics_storage='granted'`).

## 2. Le Design de la Bannière (Axe UX/UI)
- Bannières agressives "Plein Écran" à proscrire sauf exigence client stricte.
- Préférer un "Toast" élégant (modale flottante en bas de l'écran).
- La loi exige que le bouton "Tout Refuser" soit aussi accessible (même taille, même visibilité) que le bouton "Tout Accepter". Ne pas cacher le bouton de refus.
- Proposer un bouton "Personnaliser" pour le choix granulaire.

## 3. Pages Légales Obligatoires
Générer et inclure systématiquement dans le footer :
- Mentions Légales (Hébergeur, Coordonnées de l'entreprise).
- Politique de Confidentialité (Quelles données sont collectées ? Où sont-elles stockées ? Combien de temps ?).
- CGU/CGV (Si vente en ligne).

## 4. Droit à l'Oubli et Sécurité des Données
- Le client final a le droit de demander l'effacement de ses données.
- Préparer une architecture (Cloud Functions Firestore) permettant de chercher et supprimer toutes les traces d'un email (comptes, factures, logs).

## Exécution du Skill
1. Sélectionner une librairie de gestion de cookies robuste (ex: Axeptio, Cookiebot, ou un script maison sur-mesure validé).
2. Configurer le Google Tag Manager (GTM) avec le Consent Mode v2 activé par défaut à `denied`.
3. Assurer que le design de la bannière s'intègre parfaitement au Design System.
4. Générer l'arborescence des pages légales obligatoires.
