---
name: premium-qa-testing-playwright
description: "Mise en place de tests de bout en bout (E2E) robustes avec Playwright pour s'assurer que les parcours utilisateurs critiques ne cassent jamais."
---

# Skill : Assurance Qualité (Tests E2E avec Playwright)

**Contexte :**
Sur un site à très fort budget, un bug bloquant en production (un formulaire de contact qui ne s'envoie pas, ou un bouton d'achat cassé) est inacceptable. Les tests unitaires (Jest/Vitest) sont utiles, mais insuffisants. Ce skill implémente Playwright pour simuler un vrai navigateur et tester les parcours utilisateurs (User Journeys) de A à Z.

## 1. Principes du Test E2E (End-to-End)
- Ne pas tester des détails triviaux (ex: "est-ce que le titre est bleu ?"). Tester les **flux critiques** : "Un utilisateur peut-il mettre au panier et payer ?", "Le formulaire de demande de devis parvient-il bien à la base de données ?".
- Isoler les tests de la production : Playwright doit tourner contre l'environnement de "Staging" ou en local (avec Firebase Emulator) avant tout déploiement.

## 2. Implémentation Playwright
- Localisateurs robustes : Éviter de cibler par des classes CSS (qui changent). Privilégier les attributs d'accessibilité (Roles, Text, `data-testid`).
```typescript
// Exemple de test premium robuste
test('Soumission de demande de devis', async ({ page }) => {
  await page.goto('/contact');
  
  // Utilisation des rôles d'accessibilité (plus robuste que le ciblage CSS)
  await page.getByRole('textbox', { name: 'Email' }).fill('client@premium.com');
  await page.getByRole('button', { name: 'Envoyer la demande' }).click();
  
  // Vérification de la notification de succès
  await expect(page.getByText('Votre demande a été envoyée')).toBeVisible();
});
```

## 3. Gestion des Animations dans les Tests
- Sur un site ultra-premium avec beaucoup d'animations (GSAP), Playwright peut échouer car il essaie de cliquer sur un élément encore en mouvement.
- **Astuce d'Expert** : Configurer Playwright pour désactiver les animations lors de l'exécution des tests (forcer `prefers-reduced-motion: reduce` ou ajouter une variable d'environnement qui coupe GSAP).

## 4. Tests Visuels (Visual Regression)
- Un design parfait ne doit pas subir de régression visuelle.
- Utiliser la fonction de capture d'écran de Playwright : `expect(await page.screenshot()).toMatchSnapshot('landing-page.png')`.
- Attention : Ces tests sont "flaky" (fragiles). Les utiliser uniquement sur des composants UI critiques isolés (boutons, cartes).

## Exécution du Skill
1. Demander la liste des 3 parcours utilisateurs les plus critiques du projet.
2. Écrire le script Playwright correspondant pour chaque parcours.
3. Intégrer la commande `npx playwright test` dans le pipeline de CI (voir skill `premium-cicd-github-actions`) pour bloquer un déploiement défectueux.
