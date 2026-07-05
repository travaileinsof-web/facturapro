---
name: premium-agency-qa-review
description: "Processus final et impitoyable de contrôle qualité avant la livraison au client, incluant la checklist de l'excellence."
---

# Skill : Revue de Code et Qualité Finale (QA)

**Contexte :**
C'est la dernière étape avant de livrer le site. C'est l'assurance qualité (QA) humaine et algorithmique. Un seul détail négligé (un lien cassé, un placeholder "lorem ipsum" oublié) ruine la perception de luxe.

## 1. Checklist "Zéro Défaut"
Passer en revue chaque élément de cette liste :
- [ ] Aucun "Lorem Ipsum" ne subsiste sur le site.
- [ ] Toutes les images ont un texte alternatif (`alt="description"`) pour l'accessibilité.
- [ ] Les pages `404` (Non Trouvé) et `500` (Erreur Serveur) sont personnalisées avec le design system.
- [ ] Le score Lighthouse est de 95+ sur le LCP et le CLS.
- [ ] La navigation clavier (touches Tab et Entrée) est fluide, le `focus-visible` est stylisé.
- [ ] Le mode Sombre (Dark Mode) ne présente aucune couleur illisible ou contraste trop faible (si implémenté).
- [ ] Les liens vers les réseaux sociaux pointent vers les bons profils, pas vers `#`.

## 2. Validation Firebase
- [ ] Firebase Security Rules testées et en mode strict (aucun avertissement de base ouverte "allow read, write: if true").
- [ ] Les indexes Firestore manquants ont été générés et déployés.
- [ ] L'environnement de production utilise des clés API différentes de l'environnement de staging.

## 3. Responsive Extrême (Edge cases)
- Tester les résolutions intermédiaires délicates (iPad Pro vertical, Samsung Galaxy Fold).
- S'assurer que le bouton d'ouverture du menu mobile "Hamburger" a une zone de clic (tap target) suffisamment grande (minimum 44x44 pixels, exigence Apple/Google).

## Exécution du Skill
1. Exécuter ce script de vérification comme un agent de QA impitoyable.
2. Soulever chaque point un par un. S'il n'est pas validé, générer une tâche de correction automatique.
3. Si la liste est 100% validée, générer le document de "Delivery" (Livraison) contenant les identifiants finaux et les métriques de succès pour le client.
