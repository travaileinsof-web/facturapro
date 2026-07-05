---
name: premium-frontend-forms-validation
description: "Définit les standards de création de formulaires robustes avec React Hook Form et Zod, garantissant une validation parfaite sans re-rendus inutiles."
---

# Skill : Formulaires Premium (React Hook Form + Zod)

**Contexte :**
Un formulaire sur un site haut de gamme ne doit jamais lagger (chaque frappe de touche doit être instantanée) et les erreurs de saisie doivent être remontées de manière élégante, accessible, et avec des animations douces. Ce skill impose l'usage combiné de React Hook Form (performance) et Zod (validation du schéma).

## 1. Principes Fondamentaux
- **Performance (Uncontrolled Components)** : Utiliser `react-hook-form` pour que les inputs ne déclenchent pas de re-rendu de tout le composant à chaque touche tapée.
- **Validation Typée** : Utiliser `zod` pour définir le schéma du formulaire. Cela garantit une source de vérité unique (Single Source of Truth) entre la validation côté client et le typage TypeScript.

## 2. Implémentation du Schéma (Zod)
```typescript
import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  email: z.string().email({ message: "L'adresse email est invalide" }),
  phone: z.string().optional(),
  message: z.string().min(10, { message: "Le message est trop court" }),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
```

## 3. Gestion des Erreurs et UX
- L'apparition d'un message d'erreur doit être animée (utiliser Framer Motion avec un `AnimatePresence` ou GSAP) pour ne pas casser la mise en page brutalement.
- Les champs en erreur doivent avoir un feedback visuel clair (bordure rouge subtile, icône d'avertissement), mais conserver le style "Luxe".

## 4. Soumission et Accessibilité (A11y)
- Bloquer le bouton de soumission pendant l'envoi (`isSubmitting`) et afficher un spinner de chargement élégant (Lottie ou SVG animé).
- Focus automatique sur le premier champ en erreur si la soumission échoue.
- Lier les messages d'erreur aux inputs via `aria-describedby` et `aria-invalid`.

## Exécution du Skill
1. Créer le fichier de schéma Zod (`schema.ts`).
2. Implémenter le hook `useForm({ resolver: zodResolver(schema) })`.
3. Coder les inputs en utilisant la méthode `register` ou `Controller` (pour les inputs custom complexes comme les Selects stylisés).
4. Ajouter la gestion asynchrone (upload de fichiers ou appel API Firebase) dans le `onSubmit`.
