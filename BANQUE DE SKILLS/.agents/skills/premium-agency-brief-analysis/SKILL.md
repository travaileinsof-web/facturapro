---
name: premium-agency-brief-analysis
description: "Analyse experte d'une demande client pour générer un cahier des charges irréprochable et identifier les pièges techniques avant le développement."
---

# Skill : Analyse du Besoin & Génération du Cahier des Charges

**Contexte :**
Un projet haut de gamme ne démarre jamais sur une simple phrase du client. Avant d'écrire la moindre ligne de code, le besoin doit être disséqué. Ce skill s'assure de l'alignement total entre l'attente du client et la réalité technique.

## 1. Rétro-Ingénierie du Besoin
- Lorsqu'un besoin est exprimé ("Je veux un site pour mon hôtel"), l'IA doit poser les questions implicites :
  - Quel système de réservation utiliserons-nous ?
  - Y a-t-il une gestion multilingue ?
  - Faut-il synchroniser avec des agences (Booking, Airbnb) ?
- Identifier les **risques techniques** dès le premier jour (API tierces indisponibles, coûts Firebase cachés).

## 2. Structure du Cahier des Charges Premium (PRD)
Générer un document complet comprenant :
1. **Vision et Objectifs** : Cible, positionnement (Luxe).
2. **Arborescence du Site (Sitemap)** : Liste exhaustive des pages.
3. **Spécifications Fonctionnelles** : Ce que l'utilisateur peut faire (Auth, Paiement).
4. **Choix Technologiques (La Stack)** : Justification de Next.js, Firebase, Tailwind.
5. **Modèle de Données (Base de Données)** : Schéma JSON initial.
6. **Plan de Test et Déploiement**.

## 3. La Règle du "Out of Scope" (Hors Périmètre)
- Il est aussi important de définir ce que le site *ne fera pas* (V1). 
- Séparer strictement le "Must Have" (Obligatoire pour le lancement) du "Nice to Have" (Options pour une v2).

## Exécution du Skill
1. Dès la soumission d'une demande vague par un utilisateur, ne jamais coder immédiatement.
2. Poser une liste précise de questions de clarification (max 5 questions à la fois).
3. Une fois les réponses obtenues, rédiger le document de Cahier des Charges complet.
4. Attendre l'approbation formelle de l'utilisateur avant d'activer le skill d'Architecture Initiale (`premium-architecture`).
