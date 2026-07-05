# Audit de Sécurité Complet - FacturaPro

J'ai procédé à une analyse approfondie et rigoureuse du projet FacturaPro (Front-end React/Vite et Back-end PHP/SQLite). J'ai passé en revue la logique d'authentification, les endpoints d'API, le traitement des fichiers, et le rendu côté client.

Voici les vulnérabilités et failles persistantes qui ont été découvertes.

## 🚨 Vulnérabilités Critiques (Priorité Absolue)

> [!CAUTION]
> **1. Exécution de Code à Distance (RCE) via l'Upload d'Images**
> **Fichier:** `backend/api.php` (Lignes 166-207)
> **Description:** L'endpoint d'upload d'images (logo, signature, tampon) ne vérifie que le type MIME envoyé par le client (`$_FILES['file']['type']`). Un attaquant peut envoyer un script malveillant (ex: `shell.php`) tout en déclarant un type `image/jpeg`. Le backend extrait l'extension d'origine et sauvegarde le fichier sous le format `img_xxx.php` dans le dossier `uploads/`.
> **Conséquence:** Prise de contrôle totale du serveur, accès à toutes les données, et potentiel rebond vers d'autres services.

> [!CAUTION]
> **2. Cross-Site Scripting (XSS) dans la Génération de PDF**
> **Fichier:** `src/lib/pdfTemplate.tsx`
> **Description:** Le générateur de PDF construit le document en insérant des variables brutes (ex: `item.description`, `receipt.notes`, `invoice.client.name`) directement dans une chaîne HTML sans aucun échappement.
> **Conséquence:** Si un utilisateur malveillant entre un script `<script>...</script>` dans la description d'un article ou le nom de l'entreprise, ce script s'exécutera lors de la création du PDF. Le PDF s'ouvrant dans une nouvelle fenêtre avec le même domaine (`window.open('', ...)`), le script peut voler le token d'authentification stocké dans le `localStorage` ou effectuer des actions à l'insu de la victime.

> [!CAUTION]
> **3. Contournement de la Liste Blanche IP (Admin Back-Office)**
> **Fichier:** `backend/admin_api.php` (Lignes 101-110)
> **Description:** La fonction `checkIpWhitelist()` utilise en priorité l'en-tête `$_SERVER['HTTP_X_FORWARDED_FOR']`. Cet en-tête peut être facilement falsifié (spoofé) par n'importe quel client HTTP.
> **Conséquence:** Un attaquant peut se faire passer pour une IP autorisée (ex: `127.0.0.1` ou l'IP de l'admin) et attaquer les failles de force brute sur le code PIN ou le mot de passe, contournant ainsi la couche 3 de sécurité de l'admin.

## ⚠️ Vulnérabilités Élevées

> [!WARNING]
> **4. Fuite de Données Sensibles via l'API Settings**
> **Fichier:** `backend/api.php` (Ligne 217)
> **Description:** L'endpoint `GET /api/settings` renvoie l'intégralité de la ligne de base de données de l'utilisateur, y compris le `passwordHash`, le `token` d'authentification, et potentiellement la clé `openrouterKey`.
> **Conséquence:** Toute faille mineure (comme la XSS mentionnée plus haut) donne un accès immédiat au hash du mot de passe et aux clés d'API privées de l'utilisateur.

> [!WARNING]
> **5. Exposition Potentielle de la Base de Données SQLite**
> **Fichier:** `backend/facturapro.sqlite`
> **Description:** La base de données est stockée directement dans le dossier `backend/`. Si la configuration du serveur web (Nginx/Apache) ou du script de déploiement (comme `vite.config.ts` qui copie le dossier dans `dist/`) ne bloque pas l'accès direct aux fichiers `.sqlite`, la base de données entière peut être téléchargée via l'URL `http://domaine.com/backend/facturapro.sqlite`.
> **Conséquence:** Fuite massive des données de tous les utilisateurs (factures, clients, hachages de mots de passe).

> [!WARNING]
> **6. Changement de Mot de Passe Non Sécurisé**
> **Fichier:** `backend/api.php` (Endpoint PUT `/settings`)
> **Description:** Le mot de passe peut être modifié simplement en envoyant un nouveau mot de passe dans le payload. Le système ne demande pas à l'utilisateur de fournir son **mot de passe actuel** pour confirmer l'action.
> **Conséquence:** En cas d'ordinateur laissé déverrouillé ou d'une attaque CSRF, un attaquant peut modifier le mot de passe et prendre le contrôle définitif du compte.

## 🟡 Risques Moyens et Dette Technique

> [!NOTE]
> **7. Conflit de Back-ends (Code Mort vs Code Actif)**
> **Fichiers:** `server.ts` et `backend/api.php`
> **Description:** Le projet contient un serveur Node.js complet avec Prisma (`server.ts`) qui semble faire la même chose que le code PHP. Cependant, `start.bat` et `vite.config.ts` indiquent que c'est le PHP qui est utilisé. Laisser `server.ts` dans le projet accroît inutilement la surface d'attaque et porte à confusion en cas de maintenance.

> [!NOTE]
> **8. Invalidation Manquante des Sessions**
> Lorsqu'un utilisateur modifie son mot de passe depuis les paramètres, le `token` actuel n'est pas révoqué (dans `api.php`). Si un compte est compromis et que le propriétaire légitime change son mot de passe, l'attaquant conservera son accès tant que son token est valide.

---

## User Review Required

**Ceci est le rapport d'audit demandé. Si vous approuvez, je peux procéder immédiatement à la correction de toutes ces failles.**

Voici le plan d'intervention proposé si vous donnez votre accord :
1. **Corriger la RCE** : Renommer l'extension des fichiers uploadés en forçant l'extension d'après l'analyse MIME stricte de PHP (ex: `finfo_file`), et bloquer l'exécution de scripts dans `/uploads/` avec un `.htaccess`.
2. **Corriger la XSS** : Implémenter une fonction d'échappement HTML stricte dans `store.ts` et l'appliquer à toutes les variables injectées dans `pdfTemplate.tsx`.
3. **Corriger le Bypass IP** : Modifier `admin_api.php` pour utiliser strictement `$_SERVER['REMOTE_ADDR']` (sauf si derrière un proxy configuré de manière fiable et contrôlée).
4. **Boucher la Fuite de Données** : Dans `api.php`, filtrer (unset) les champs `passwordHash` et `token` avant tout `echo json_encode()`.
5. **Protéger le fichier SQLite** : Sécuriser la base de données via `.htaccess` ou en la déplaçant hors du répertoire accessible publiquement.
6. **Mettre à jour la logique de mot de passe** : Ajouter un champ `currentPassword` obligatoire lors d'un changement de mot de passe et invalider l'ancien token.

Souhaitez-vous que je commence les corrections ?
