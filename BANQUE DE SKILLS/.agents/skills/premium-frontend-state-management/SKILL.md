---
name: premium-frontend-state-management
description: "Gère l'état global de l'application de façon ultra-performante et légère en utilisant Zustand, en évitant le boilerplate lourd type Redux."
---

# Skill : Gestion d'État Global (Zustand)

**Contexte :**
La gestion d'état (panier e-commerce, préférences utilisateur, état d'ouverture de modales globales) peut vite devenir un cauchemar de performances et de complexité. Pour un projet premium, on bannit les usines à gaz et on utilise Zustand : rapide, léger, et parfait pour Next.js (compatible SSR).

## 1. Pourquoi Zustand ?
- Contrairement à React Context, modifier une valeur dans Zustand ne force pas le re-rendu de *tous* les composants enfants. Seuls les composants qui "écoutent" cette valeur précise sont mis à jour.
- Syntaxe extrêmement concise (pas de reducers, pas de providers).

## 2. Création d'un Store Type
Les stores doivent être typés strictement et segmentés par fonctionnalité (un store pour le UI, un store pour l'utilisateur, etc.).

```typescript
import { create } from 'zustand';

interface UIState {
  isCartOpen: boolean;
  activeModal: string | null;
  toggleCart: () => void;
  openModal: (modalId: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCartOpen: false,
  activeModal: null,
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  openModal: (modalId) => set({ activeModal: modalId }),
}));
```

## 3. Persistance des Données (Local Storage)
Pour les réglages (thème, panier invité), utiliser le middleware de persistance de Zustand pour sauvegarder l'état dans le navigateur.
- *Attention SSR* : Dans Next.js, hydrater l'état persistant uniquement après le premier rendu côté client (useEffect) pour éviter les erreurs d'hydratation (mismatch serveur/client).

## 4. Règle de Performance (Sélection Granulaire)
Dans les composants, ne jamais extraire tout le store. Toujours extraire uniquement la propriété requise pour éviter des rendus inutiles.
- ❌ **Mauvais** : `const store = useUIStore();`
- ✅ **Parfait** : `const isCartOpen = useUIStore((state) => state.isCartOpen);`

## Exécution du Skill
1. Analyser si l'état doit vraiment être global (souvent un simple `useState` local suffit).
2. Si global, créer le store dans `/src/store/nomStore.ts`.
3. Exporter le hook typé.
4. Intégrer l'état de manière asynchrone si une persistance (localStorage) est nécessaire dans l'écosystème Next.js.
