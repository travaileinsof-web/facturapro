---
name: premium-cloud-deployments
description: "Méthodes de déploiement et d'hébergement ultra-premium via Netlify CLI et Vercel CLI. Gère également la connectivité avec Firebase."
---

# Skill : Déploiement et Intégration Cloud (Netlify / Vercel / Firebase)

**Contexte :**
Ce skill est invoqué par le **Directeur de Projet** ou le système lors de la phase finale pour déployer le projet sur une architecture cloud ultra-rapide et scalable. 

## 1. Firebase (Backend & Base de données)
Notre environnement est déjà connecté au serveur natif `firebase-mcp-server`.
Pour déployer les bases de données (Firestore Rules), l'Auth et les Cloud Functions, utilise les outils MCP dédiés ou Firebase CLI :
```bash
firebase deploy --only functions,firestore:rules
```

## 2. Déploiement Vercel (Recommandé pour Next.js)
Vercel est l'hôte de choix pour Next.js (Server Components, Edge Functions).
**Exécution :**
1. S'assurer que le Vercel CLI est installé (`npm i -g vercel`).
2. Pour déployer :
```bash
vercel --prod
```
3. Suivre les instructions d'authentification si non connecté. Le site sera automatiquement optimisé sur le CDN global.

## 3. Déploiement Netlify (Alternative)
Netlify est une excellente alternative pour les applications découplées ou les générateurs de sites statiques.
**Exécution :**
1. S'assurer que Netlify CLI est installé (`npm i -g netlify-cli`).
2. Pour déployer :
```bash
netlify deploy --prod
```
3. Suivre les instructions d'authentification.

## Règle de CI/CD
Si le projet inclut GitHub Actions (cf. `premium-cicd-github-actions`), le déploiement doit être automatisé sur les branches `main` (Production) et `develop` (Staging) via les tokens Vercel/Netlify stockés dans les secrets GitHub. Ce skill de déploiement manuel sert pour les prévisualisations directes (Preview Deployments).
