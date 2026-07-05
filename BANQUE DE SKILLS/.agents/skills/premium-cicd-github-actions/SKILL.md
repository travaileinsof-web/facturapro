---
name: premium-cicd-github-actions
description: "Mise en place d'un pipeline d'intégration et de déploiement continu (CI/CD) vers Firebase Hosting via GitHub Actions, garantissant zéro downtime et une qualité de code validée avant chaque mise en production."
---

# Skill : Déploiement Continu et CI/CD (GitHub Actions)

**Contexte :**
Un flux de travail ultra-premium exclut les déploiements manuels (via `firebase deploy` sur la machine du développeur). Un déploiement manuel est risqué et source d'erreurs. Ce skill configure GitHub Actions pour automatiser les tests, le linting, le build Next.js, et le déploiement sur Firebase Hosting (ainsi que la création de liens de prévisualisation - Preview Channels).

## 1. Principes de Déploiement
- La branche `main` déclenche toujours un déploiement en production.
- Les Pull Requests déclenchent la création d'un "Preview Channel" sur Firebase Hosting. Cela permet au client ou au Lead Tech de valider visuellement le site sur une URL temporaire avant la fusion (Merge).

## 2. Le Workflow de CI (Continuous Integration)
Avant tout build de déploiement, l'Action GitHub doit exécuter les vérifications de qualité :
1. **Linting strict** : `npm run lint` (ESLint Next.js strict). L'action échoue si des warnings critiques sont présents.
2. **Vérification du typage** : `tsc --noEmit`. L'action échoue à la moindre erreur TypeScript.
3. **Tests unitaires** : `npm run test` (Vitest ou Jest).

## 3. Le Workflow de CD (Continuous Deployment)
- Si la CI passe, on passe à l'étape de Build (`npm run build`).
- **Next.js & Firebase** : Configurer Next.js pour utiliser `output: 'export'` si le site est 100% statique, ou utiliser le framework-aware Firebase Hosting pour Next.js (qui gère l'App Router, le SSR et l'Image Optimization automatiquement via Cloud Functions/Cloud Run en arrière-plan).

## 4. Fichier YAML de l'Action (Preview)
Exemple de configuration exigée pour les Pull Requests (`.github/workflows/firebase-hosting-pull-request.yml`) :
```yaml
name: Deploy to Firebase Hosting on PR
'on': pull_request
jobs:
  build_and_preview:
    if: '${{ github.event.pull_request.head.repo.full_name == github.repository }}'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_YOUR_PROJECT }}'
          projectId: your-project-id
```

## 5. Gestion des Secrets
- Protéger les variables d'environnement de production.
- Dans GitHub, configurer les *Environments* et stocker le `.env.production` dans les *Repository Secrets*.
- L'Action GitHub devra générer le fichier `.env` au moment de la compilation.

## Exécution du Skill
1. Demander à l'utilisateur de lier son projet Firebase et d'exécuter `firebase init hosting:github` pour générer automatiquement la base des workflows et le Service Account.
2. Intervenir pour injecter la phase de CI (Lint, Typecheck) avant l'étape de build.
3. Configurer la gestion sécurisée des clés d'API (via GitHub Secrets) pour que le build Next.js se fasse avec les bonnes variables.
