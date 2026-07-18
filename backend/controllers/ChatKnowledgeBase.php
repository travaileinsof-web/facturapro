<?php
class ChatKnowledgeBase {
    public static function getIntents() {
        return [
            // ==========================================
            // TABLEAU DE BORD (10)
            // ==========================================
            [
                'id' => 'db_ca_potentiel',
                'keywords' => ['chiffre', 'affaire', 'potentiel', 'represente', 'quoi', 'c\'est'],
                'answer' => "Le chiffre d'affaires potentiel représente le montant cumulé de toutes vos factures émises, qu'elles soient payées ou non."
            ],
            [
                'id' => 'db_creances',
                'keywords' => ['calcul', 'calculees', 'creance', 'creances', 'tableau', 'bord'],
                'answer' => "Les créances (à recouvrer) sont calculées en soustrayant le 'Total Encaissé' (les paiements reçus) du 'Chiffre d'Affaires Potentiel' (le total de vos factures)."
            ],
            [
                'id' => 'db_evolution',
                'keywords' => ['ou', 'voir', 'evolution', 'activite', 'mois', 'precedent'],
                'answer' => "L'évolution de votre activité s'affiche directement sur les cartes du tableau de bord via les pourcentages (ex: +15% ce mois-ci par rapport au mois dernier)."
            ],
            [
                'id' => 'db_graphique_revenus',
                'keywords' => ['lire', 'comprendre', 'graphique', 'repartition', 'revenu', 'revenus'],
                'answer' => "Le graphique de répartition montre la part de vos revenus (encaissés vs créances) pour vous aider à visualiser rapidement votre trésorerie disponible."
            ],
            [
                'id' => 'db_temps_reel',
                'keywords' => ['est-ce', 'tableau', 'bord', 'met', 'jour', 'temps', 'reel'],
                'answer' => "Oui, le tableau de bord se met à jour en temps réel. Dès qu'un reçu est émis ou une facture créée, les chiffres s'actualisent."
            ],
            [
                'id' => 'db_diff_encaisse_ca',
                'keywords' => ['pourquoi', 'total', 'encaisse', 'differe', 'difference', 'global'],
                'answer' => "Le total encaissé ne reflète que l'argent réellement perçu (les reçus). Le chiffre d'affaires global inclut l'argent que vos clients vous doivent encore."
            ],
            [
                'id' => 'db_benefice_net',
                'keywords' => ['comment', 'calcul', 'benefice', 'net', 'interface'],
                'answer' => "Le bénéfice net est calculé en soustrayant la somme de toutes vos dépenses validées de votre Total Encaissé."
            ],
            [
                'id' => 'db_filtre_annee',
                'keywords' => ['filtrer', 'statistique', 'statistiques', 'annee', 'mois'],
                'answer' => "Vous pouvez utiliser les sélecteurs de période (souvent en haut à droite) pour filtrer vos statistiques par mois, trimestre ou année."
            ],
            [
                'id' => 'db_pourcentage_couleur',
                'keywords' => ['signifie', 'pourcentage', 'vert', 'rouge', 'chiffres'],
                'answer' => "Un pourcentage vert indique une augmentation positive (ex: plus de revenus), tandis qu'un rouge indique une baisse ou une augmentation négative (ex: plus de dépenses) par rapport à la période précédente."
            ],
            [
                'id' => 'db_demarrage_rapide',
                'keywords' => ['module', 'demarrage', 'rapide', 'haut', 'quoi'],
                'answer' => "Le module Démarrage rapide est un guide interactif en 4 étapes pour vous aider à configurer votre entreprise, créer vos produits, et envoyer votre première facture."
            ],

            // ==========================================
            // CLIENTS (10)
            // ==========================================
            [
                'id' => 'client_ajouter',
                'keywords' => ['ajouter', 'nouveau', 'creer', 'particulier', 'entreprise', 'faire'],
                'answer' => "Pour ajouter un client, allez dans le menu 'Clients' puis cliquez sur le bouton 'Nouveau Client'. Remplissez ses coordonnées et enregistrez."
            ],
            [
                'id' => 'client_importer',
                'keywords' => ['importer', 'liste', 'existante', 'excel', 'csv'],
                'answer' => "L'importation via CSV/Excel est disponible. Cliquez sur 'Importer' dans le menu Clients, téléchargez le modèle, remplissez-le et uploadez-le."
            ],
            [
                'id' => 'client_modifier',
                'keywords' => ['modifier', 'coordonnee', 'adresse', 'existant'],
                'answer' => "Allez dans la liste de vos clients, cliquez sur l'icône d'édition (crayon) ou ouvrez le dossier du client pour modifier ses informations."
            ],
            [
                'id' => 'client_supprimer',
                'keywords' => ['supprimer', 'definitivement', 'base', 'donnee'],
                'answer' => "Vous pouvez supprimer un client s'il n'a aucune facture liée. S'il a un historique, vous pourrez seulement l'archiver/le désactiver pour des raisons comptables."
            ],
            [
                'id' => 'client_historique',
                'keywords' => ['voir', 'historique', 'toute', 'facture', 'recu', 'specifique'],
                'answer' => "Cliquez sur le nom d'un client dans la liste pour ouvrir sa Fiche Détaillée (Dossier Client) et consulter tout son historique de facturation."
            ],
            [
                'id' => 'client_desactiver',
                'keywords' => ['desactiver', 'travaille', 'plus'],
                'answer' => "Dans la modification du profil client, vous pouvez passer son statut en inactif pour qu'il n'apparaisse plus dans vos suggestions de facturation."
            ],
            [
                'id' => 'client_recherche',
                'keywords' => ['rechercher', 'rapidement', 'numero', 'telephone', 'nom'],
                'answer' => "Utilisez la barre de recherche en haut du menu Clients pour retrouver instantanément un client par son nom, son email ou son téléphone."
            ],
            [
                'id' => 'client_exporter',
                'keywords' => ['exporter', 'base', 'sauvegarde', 'externe'],
                'answer' => "Un bouton 'Exporter' est présent dans le menu Clients pour télécharger toute votre base au format Excel ou CSV."
            ],
            [
                'id' => 'client_limite',
                'keywords' => ['limite', 'nombre', 'creer', 'systeme'],
                'answer' => "Il n'y a aucune limite stricte dans la version Premium, vous pouvez créer autant de clients que votre activité l'exige."
            ],
            [
                'id' => 'client_nif_rccm',
                'keywords' => ['renseigner', 'nif', 'rccm', 'professionnel', 'conformite'],
                'answer' => "Lors de la création ou modification d'un client de type 'Entreprise', des champs dédiés au NIF et au RCCM sont disponibles."
            ],

            // ==========================================
            // CATALOGUE (10)
            // ==========================================
            [
                'id' => 'catalogue_ajouter',
                'keywords' => ['ajouter', 'creer', 'nouvel', 'article', 'service', 'produit', 'faire'],
                'answer' => "Allez dans le menu 'Catalogue', cliquez sur 'Nouvel Article', choisissez s'il s'agit d'un Produit ou d'un Service, et définissez son prix."
            ],
            [
                'id' => 'catalogue_categorie',
                'keywords' => ['regrouper', 'categorie', 'categories'],
                'answer' => "Oui, vous pouvez créer des catégories dans le catalogue et y assigner vos produits pour structurer votre inventaire."
            ],
            [
                'id' => 'catalogue_modifier_prix',
                'keywords' => ['modifier', 'prix', 'vente'],
                'answer' => "Cliquez sur l'article dans votre catalogue puis sur 'Modifier' pour changer son prix de vente par défaut."
            ],
            [
                'id' => 'catalogue_stock',
                'keywords' => ['gerer', 'suivre', 'stock', 'inventaire'],
                'answer' => "Si la gestion de stock est activée pour un produit, FacturaPro déduira automatiquement les quantités à chaque facture payée."
            ],
            [
                'id' => 'catalogue_taxe',
                'keywords' => ['appliquer', 'taxe', 'defaut', 'tva'],
                'answer' => "Dans la fiche de l'article, vous pouvez sélectionner un taux de taxe applicable par défaut qui s'ajoutera automatiquement sur la facture."
            ],
            [
                'id' => 'catalogue_image',
                'keywords' => ['ajouter', 'image', 'vignette', 'photo'],
                'answer' => "L'ajout de photo est possible dans les détails de l'article pour vous aider à mieux identifier visuellement vos produits."
            ],
            [
                'id' => 'catalogue_supprimer',
                'keywords' => ['supprimer', 'archiver', 'vend', 'plus'],
                'answer' => "Sélectionnez l'article puis cliquez sur l'icône corbeille. Si l'article a déjà été facturé, il sera masqué (archivé) mais gardé en mémoire."
            ],
            [
                'id' => 'catalogue_changer_type',
                'keywords' => ['changer', 'type', 'produit', 'service'],
                'answer' => "Vous pouvez basculer le type d'un élément (Produit <-> Service) en modifiant l'article dans le Catalogue."
            ],
            [
                'id' => 'catalogue_importer',
                'keywords' => ['importer', 'plusieurs', 'coup', 'fichier'],
                'answer' => "Utilisez la fonction d'importation CSV du catalogue pour télécharger massivement toute votre liste de prix."
            ],
            [
                'id' => 'catalogue_degressif',
                'keywords' => ['tarif', 'degressif', 'gros', 'prix'],
                'answer' => "Pour les tarifs dégressifs, vous pouvez ajuster manuellement le prix unitaire directement lors de la création de la facture selon la quantité."
            ],

            // ==========================================
            // FACTURES (10)
            // ==========================================
            [
                'id' => 'facture_creer',
                'keywords' => ['creer', 'nouvelle', 'devis', 'proforma', 'faire'],
                'answer' => "Allez dans 'Factures' > 'Nouveau Document', sélectionnez un client, ajoutez vos articles, et cliquez sur 'Enregistrer'. Lors de la création, vous pourrez choisir s'il s'agit d'une Facture ou d'un Devis (Proforma)."
            ],
            [
                'id' => 'facture_diff_proforma',
                'keywords' => ['difference', 'proforma', 'definitive'],
                'answer' => "Une facture proforma est un devis provisoire sans valeur comptable. Une facture définitive a un numéro légal et engage le client à payer."
            ],
            [
                'id' => 'facture_transformer_devis',
                'keywords' => ['transformer', 'devis', 'finale'],
                'answer' => "Ouvrez votre devis (proforma) et utilisez le bouton 'Convertir en facture'. Toutes les informations seront copiées instantanément."
            ],
            [
                'id' => 'facture_modifier',
                'keywords' => ['modifier', 'emise', 'sauvegardee'],
                'answer' => "Une facture au statut 'Brouillon' est modifiable librement. Si elle est 'Envoyée', il est recommandé de l'annuler et d'en recréer une selon les règles comptables."
            ],
            [
                'id' => 'facture_annuler',
                'keywords' => ['annuler', 'partiellement', 'payee'],
                'answer' => "Pour annuler une facture payée, vous devez d'abord annuler les reçus associés. Ensuite, vous pourrez changer son statut."
            ],
            [
                'id' => 'facture_whatsapp',
                'keywords' => ['envoyer', 'message', 'whatsapp'],
                'answer' => "Dans la vue détaillée d'une facture, cliquez sur 'Partager', choisissez WhatsApp, et un message pré-rédigé s'ouvrira avec le lien de votre facture."
            ],
            [
                'id' => 'facture_pdf',
                'keywords' => ['telecharger', 'format', 'pdf', 'imprimer'],
                'answer' => "Ouvrez la facture et cliquez sur le bouton de téléchargement (icône PDF) pour obtenir le fichier sur votre appareil et l'imprimer."
            ],
            [
                'id' => 'facture_remise',
                'keywords' => ['appliquer', 'remise', 'commerciale'],
                'answer' => "Lors de l'édition, vous pouvez appliquer une remise globale en bas de page, ou une remise par ligne sur chaque article."
            ],
            [
                'id' => 'facture_conditions',
                'keywords' => ['ajouter', 'condition', 'paiement', 'echeancier'],
                'answer' => "Utilisez le champ 'Notes' ou 'Conditions' de la facture pour y inscrire vos délais. Un système d'échéancier permet de diviser le paiement."
            ],
            [
                'id' => 'facture_statut_retard',
                'keywords' => ['statut', 'rouge', 'retard'],
                'answer' => "Le statut 'En retard' s'affiche automatiquement lorsque la date d'échéance de la facture est dépassée et que le solde n'est pas réglé à 100%."
            ],

            // ==========================================
            // REÇUS (10)
            // ==========================================
            [
                'id' => 'recu_generer',
                'keywords' => ['generer', 'creer', 'nouveau', 'officiel', 'reception', 'paiement', 'faire'],
                'answer' => "Depuis une facture, cliquez sur 'Ajouter un paiement'. Renseignez le montant reçu et le mode de paiement, le reçu sera généré automatiquement."
            ],
            [
                'id' => 'recu_partiel',
                'keywords' => ['paiement', 'partiel', 'avance'],
                'answer' => "Oui, vous pouvez enregistrer une avance. Le système calculera automatiquement le solde restant à payer sur la facture."
            ],
            [
                'id' => 'recu_liste',
                'keywords' => ['consulter', 'liste', 'recapitulative'],
                'answer' => "Un menu 'Reçus' ou un onglet 'Paiements' vous permet de voir l'historique complet de tous les paiements encaissés."
            ],
            [
                'id' => 'recu_envoyer',
                'keywords' => ['envoyer', 'recu', 'email', 'whatsapp'],
                'answer' => "Tout comme les factures, chaque reçu possède un bouton 'Partager' pour l'envoyer au format PDF via WhatsApp ou Email."
            ],
            [
                'id' => 'recu_statut',
                'keywords' => ['modifie', 'automatiquement', 'statut'],
                'answer' => "Exactement ! Si le reçu couvre la totalité de la facture, celle-ci passera automatiquement au statut 'Payée'."
            ],
            [
                'id' => 'recu_annuler',
                'keywords' => ['annuler', 'supprimer', 'erreur', 'saisie'],
                'answer' => "Si vous avez fait une erreur, vous pouvez supprimer le reçu depuis son historique. La facture liée repassera en 'Impayée' ou 'Partiel'."
            ],
            [
                'id' => 'recu_thermique',
                'keywords' => ['formater', 'imprimante', 'thermique', 'ticket'],
                'answer' => "FacturaPro propose un format d'impression optimisé pour les imprimantes thermiques 80mm dans les options d'impression du reçu."
            ],
            [
                'id' => 'recu_plusieurs_factures',
                'keywords' => ['couvrir', 'plusieurs', 'meme', 'temps'],
                'answer' => "Pour l'instant, un paiement doit être enregistré sur une facture spécifique. Vous répartirez le montant global sur les différentes factures."
            ],
            [
                'id' => 'recu_signature',
                'keywords' => ['signature', 'cachet', 'automatiquement'],
                'answer' => "Si vous avez configuré votre cachet et votre signature dans les Paramètres de l'Entreprise, ils apparaîtront sur tous les reçus."
            ],
            [
                'id' => 'recu_retrouver',
                'keywords' => ['retrouver', 'rapidement', 'numero', 'reference'],
                'answer' => "Utilisez la barre de recherche générale ou celle du module Reçus en tapant le numéro exact (ex: REC-2023-010) pour le retrouver."
            ],

            // ==========================================
            // DEPENSES (10)
            // ==========================================
            [
                'id' => 'depense_enregistrer',
                'keywords' => ['enregistrer', 'creer', 'ajouter', 'nouvelle', 'operationnelle', 'achat', 'faire'],
                'answer' => "Allez dans le menu 'Dépenses', cliquez sur 'Nouvelle Dépense', indiquez le montant, la catégorie, la date et le bénéficiaire."
            ],
            [
                'id' => 'depense_categorie',
                'keywords' => ['classer', 'categorie', 'loyer', 'transport'],
                'answer' => "Oui, un gestionnaire de catégories de dépenses vous permet de classer vos achats (Loyer, Transport, Fournitures, etc.)."
            ],
            [
                'id' => 'depense_justificatif',
                'keywords' => ['lier', 'photo', 'justificatif', 'facture', 'fournisseur'],
                'answer' => "Lors de la création de la dépense, vous pouvez uploader un fichier PDF ou une photo de votre reçu comme pièce justificative."
            ],
            [
                'id' => 'depense_total_mois',
                'keywords' => ['total', 'cumule', 'mois', 'cours'],
                'answer' => "Le total des dépenses est visible en haut du module Dépenses, et il impacte également le graphique de rentabilité de votre tableau de bord."
            ],
            [
                'id' => 'depense_impact_benefice',
                'keywords' => ['impacte', 'directement', 'benefice', 'net'],
                'answer' => "Oui, toute dépense validée est automatiquement déduite de votre Total Encaissé pour calculer avec précision votre Bénéfice Net."
            ],
            [
                'id' => 'depense_modifier',
                'keywords' => ['modifier', 'montant', 'date', 'validee'],
                'answer' => "Vous pouvez éditer une dépense à tout moment pour corriger un montant ou modifier sa date, tant que la période fiscale n'est pas clôturée."
            ],
            [
                'id' => 'depense_filtrer',
                'keywords' => ['filtrer', 'liste', 'fournisseur'],
                'answer' => "Le tableau des dépenses possède des filtres vous permettant d'afficher uniquement les transactions liées à un fournisseur spécifique."
            ],
            [
                'id' => 'depense_recurrente',
                'keywords' => ['programmer', 'recurrente', 'abonnement'],
                'answer' => "Pour les abonnements, vous pouvez utiliser la fonction de duplication ou configurer des dépenses récurrentes si l'option est active dans vos paramètres."
            ],
            [
                'id' => 'depense_exporter',
                'keywords' => ['exporter', 'comptable'],
                'answer' => "Utilisez le bouton 'Exporter' dans le menu Dépenses pour télécharger la liste Excel (avec la TVA) à transmettre à votre cabinet comptable."
            ],
            [
                'id' => 'depense_projet',
                'keywords' => ['attribuer', 'projet', 'rentabilite'],
                'answer' => "FacturaPro permet d'associer des libellés (tags) analytiques à vos factures et dépenses pour suivre la rentabilité d'un projet précis."
            ],

            // ==========================================
            // RELANCES (10)
            // ==========================================
            [
                'id' => 'relance_automatique',
                'keywords' => ['fonctionne', 'systeme', 'automatique', 'impayees'],
                'answer' => "Le système surveille les dates d'échéance. À J+X (selon votre configuration), il génère automatiquement un message de relance à valider."
            ],
            [
                'id' => 'relance_manuelle',
                'keywords' => ['envoyer', 'manuelle', 'immediate'],
                'answer' => "Depuis une facture en retard, cliquez sur 'Action' puis 'Envoyer une relance' pour déclencher immédiatement un message."
            ],
            [
                'id' => 'relance_canal',
                'keywords' => ['sms', 'e-mail', 'whatsapp', 'partent'],
                'answer' => "Les relances s'envoient généralement par e-mail, mais vous pouvez aussi utiliser l'intégration WhatsApp pour alerter le client directement sur son téléphone."
            ],
            [
                'id' => 'relance_texte',
                'keywords' => ['personnaliser', 'texte', 'message'],
                'answer' => "Dans le menu Relances ou Paramètres, vous avez accès à des modèles de texte (Templates) que vous pouvez modifier à votre guise."
            ],
            [
                'id' => 'relance_avertissement',
                'keywords' => ['avertit', 'avant', 'automatique'],
                'answer' => "Oui, le système met les relances 'En attente' dans une file. C'est vous qui cliquez sur 'Envoyer' pour éviter de froisser un client."
            ],
            [
                'id' => 'relance_desactiver',
                'keywords' => ['desactiver', 'temporairement', 'vip'],
                'answer' => "Dans la fiche du client, vous pouvez cocher l'option 'Exclure des relances automatiques' pour vos clients partenaires ou VIP."
            ],
            [
                'id' => 'relance_delai',
                'keywords' => ['quel', 'moment', 'bonne', 'relancer'],
                'answer' => "Dès le lendemain de la date d'échéance, la facture est éligible. Généralement, on effectue une première relance douce à J+3."
            ],
            [
                'id' => 'relance_historique',
                'keywords' => ['historique', 'complet', 'deja'],
                'answer' => "Dans la vue détaillée de la facture, un onglet 'Historique' retrace les dates et heures de chaque relance envoyée."
            ],
            [
                'id' => 'relance_penalite',
                'keywords' => ['definir', 'appliquer', 'penalite', 'retard'],
                'answer' => "Vous pouvez créer une nouvelle facture de frais de retard, ou indiquer le taux légal des pénalités dans le texte de vos relances."
            ],
            [
                'id' => 'relance_groupee',
                'keywords' => ['tous', 'clients', 'retard', 'groupe'],
                'answer' => "Dans le menu Relances, sélectionnez toutes les factures éligibles et cliquez sur 'Relancer la sélection' pour un envoi en masse."
            ],

            // ==========================================
            // ASSISTANT (10)
            // ==========================================
            [
                'id' => 'assistant_fonctionnalite',
                'keywords' => ['fonctionnalite', 'principale', 'integre'],
                'answer' => "L'assistant IA de FacturaPro vous guide dans le logiciel, répond à vos questions techniques, et peut exécuter certaines actions comme créer un brouillon de facture ou envoyer par WhatsApp."
            ],
            [
                'id' => 'assistant_poser',
                'keywords' => ['poser', 'efficacement', 'technique'],
                'answer' => "Ouvrez le widget en bas à droite, écrivez ou dictez votre demande avec des mots simples (ex: 'Comment changer la devise ?')."
            ],
            [
                'id' => 'assistant_action',
                'keywords' => ['executer', 'action', 'place'],
                'answer' => "Oui ! En mode intelligent, vous pouvez dire 'Créer un client nommé Thomas' ou 'Ouvre WhatsApp pour ma dernière facture' et l'IA le fera."
            ],
            [
                'id' => 'assistant_analyser',
                'keywords' => ['analyser', 'vente', 'recommandation'],
                'answer' => "L'assistant peut interroger vos données si l'accès à la base lui est autorisé (version Cloud), pour vous donner les chiffres du mois."
            ],
            [
                'id' => 'assistant_resume',
                'keywords' => ['resume', 'rapide', 'creance'],
                'answer' => "Si la fonction analytique est activée, l'assistant peut vous générer un texte résumant qui vous doit de l'argent."
            ],
            [
                'id' => 'assistant_vocal',
                'keywords' => ['comprend', 'vocalement', 'microphone', 'voix'],
                'answer' => "Absolument. Cliquez sur l'icône du micro dans la barre de saisie, parlez naturellement, et votre voix sera retranscrite en texte."
            ],
            [
                'id' => 'assistant_historique',
                'keywords' => ['conversation', 'enregistree', 'historique'],
                'answer' => "Vos conversations sont locales. Elles disparaissent lorsque vous rafraîchissez la page pour garantir la confidentialité maximale."
            ],
            [
                'id' => 'assistant_incompris',
                'keywords' => ['comprend', 'pas', 'repond', 'cote'],
                'answer' => "Si je ne comprends pas, essayez de reformuler avec des mots-clés simples, ou parcourez manuellement le menu de l'application."
            ],
            [
                'id' => 'assistant_rediger',
                'keywords' => ['rediger', 'corps', 'e-mail', 'professionnel', 'mail'],
                'answer' => "Le Copilot est entraîné pour générer du texte. Vous pouvez lui dire 'Rédige-moi un mail poli pour réclamer un paiement' et copier sa réponse."
            ],
            [
                'id' => 'assistant_reinitialiser',
                'keywords' => ['reinitialiser', 'effacer', 'conversation', 'vider'],
                'answer' => "Fermez simplement la fenêtre du chatbot et rafraîchissez votre page internet (F5) pour vider la mémoire de la conversation locale."
            ],

            // ==========================================
            // ENTREPRISE (10)
            // ==========================================
            [
                'id' => 'entreprise_nom',
                'keywords' => ['modifier', 'nom', 'officiel', 'physique', 'adresse'],
                'answer' => "Allez dans 'Paramètres' > 'Entreprise'. Vous pourrez y changer votre nom officiel, votre adresse et vos numéros de contact."
            ],
            [
                'id' => 'entreprise_logo',
                'keywords' => ['ajouter', 'logo', 'apparaisse'],
                'answer' => "Dans les paramètres Entreprise, cliquez sur la zone d'image pour télécharger votre logo (format PNG ou JPG). Il apparaîtra sur vos PDF."
            ],
            [
                'id' => 'entreprise_gerants',
                'keywords' => ['plusieurs', 'gerants', 'associes', 'employes', 'utilisateurs'],
                'answer' => "La gestion multi-utilisateurs se fait via le module 'Équipe' ou 'Utilisateurs' dans les paramètres, selon votre forfait d'abonnement."
            ],
            [
                'id' => 'entreprise_nif',
                'keywords' => ['renseigner', 'numero', 'identification', 'fiscale', 'siret', 'nif'],
                'answer' => "Les champs juridiques (NIF, RCCM, SIRET) sont disponibles dans l'onglet 'Mentions Légales' des paramètres de votre entreprise."
            ],
            [
                'id' => 'entreprise_banque',
                'keywords' => ['mettre', 'jour', 'bancaires', 'rib', 'iban', 'swift'],
                'answer' => "Dans 'Paramètres' > 'Coordonnées Bancaires', ajoutez vos RIB. Ils s'afficheront en bas de vos factures pour faciliter les virements."
            ],
            [
                'id' => 'entreprise_signature',
                'keywords' => ['signature', 'electronique', 'scannee'],
                'answer' => "Vous pouvez uploader une image PNG transparente de votre signature dans les paramètres Entreprise. Elle sera collée sur vos documents officiels."
            ],
            [
                'id' => 'entreprise_cachet',
                'keywords' => ['cachet', 'officiel', 'appose', 'tampon'],
                'answer' => "Comme pour la signature, une zone d'upload dédiée au cachet commercial est disponible dans les paramètres de personnalisation."
            ],
            [
                'id' => 'entreprise_multi',
                'keywords' => ['gerer', 'plusieurs', 'distinctes', 'seul', 'compte', 'multi'],
                'answer' => "La fonction Multi-Entreprises nécessite un abonnement spécifique. Si activé, vous pourrez switcher d'entreprise via le menu en haut à droite."
            ],
            [
                'id' => 'entreprise_support',
                'keywords' => ['numero', 'telephone', 'support', 'standard'],
                'answer' => "Les informations de contact (Téléphone, Email de contact, Site Web) modifiables dans 'Entreprise' s'affichent dans l'en-tête de vos factures."
            ],
            [
                'id' => 'entreprise_capital',
                'keywords' => ['forme', 'juridique', 'capital', 'social'],
                'answer' => "Le capital social et la forme juridique (SARL, SA, SUARL) s'insèrent dans les mentions légales (footer) via les Paramètres."
            ],

            // ==========================================
            // ABONNEMENT (10)
            // ==========================================
            [
                'id' => 'abonnement_statut',
                'keywords' => ['consulter', 'detail', 'statut', 'plan', 'actuel', 'forfait'],
                'answer' => "Dans les 'Paramètres', naviguez vers l'onglet 'Abonnement' ou 'Facturation' pour voir votre forfait en cours."
            ],
            [
                'id' => 'abonnement_expiration',
                'keywords' => ['savoir', 'quand', 'expirer', 'expiration'],
                'answer' => "La date d'expiration exacte de votre licence et le nombre de jours restants sont affichés bien en évidence dans le module Abonnement."
            ],
            [
                'id' => 'abonnement_premium',
                'keywords' => ['difference', 'basique', 'premium', 'gratuit'],
                'answer' => "L'offre Premium débloque des fonctionnalités avancées : nombre illimité de documents, relances automatiques, multi-utilisateurs et rapports détaillés."
            ],
            [
                'id' => 'abonnement_renouveler',
                'keywords' => ['renouveler', 'prolonger', 'avant'],
                'answer' => "Cliquez sur 'Renouveler mon plan' dans la section Abonnement. Les jours restants se cumuleront avec votre nouvelle période."
            ],
            [
                'id' => 'abonnement_mobile_money',
                'keywords' => ['payer', 'mobile', 'money', 'orange', 'mtn', 'wave'],
                'answer' => "Absolument, FacturaPro intègre les moyens de paiement locaux (Mobile Money) ainsi que les cartes bancaires pour payer votre licence."
            ],
            [
                'id' => 'abonnement_annuel',
                'keywords' => ['passer', 'annuel', 'reduction', 'annee'],
                'answer' => "Lors du renouvellement, choisissez le cycle de facturation 'Annuel'. Vous bénéficierez généralement de 2 mois gratuits (réduction de ~17%)."
            ],
            [
                'id' => 'abonnement_donnees',
                'keywords' => ['donnees', 'expire', 'perte'],
                'answer' => "Vos données ne sont jamais supprimées. Si votre abonnement expire, votre compte passe en 'Lecture seule' : vous pouvez consulter, mais plus créer de nouvelles factures."
            ],
            [
                'id' => 'abonnement_telecharger_facture',
                'keywords' => ['telecharger', 'facture', 'relative', 'paiement'],
                'answer' => "L'historique de vos paiements pour le logiciel FacturaPro se trouve dans 'Abonnement' > 'Mes Factures', d'où vous pouvez les télécharger en PDF."
            ],
            [
                'id' => 'abonnement_support',
                'keywords' => ['inclut', 'prioritaire', 'assistance'],
                'answer' => "Les plans Premium incluent généralement un support prioritaire via chat ou WhatsApp. L'offre gratuite repose sur le centre d'aide."
            ],
            [
                'id' => 'abonnement_annuler',
                'keywords' => ['annuler', 'suspendre', 'frais', 'supplementaires', 'resilier'],
                'answer' => "C'est sans engagement ! Vous pouvez décider de ne pas renouveler à la fin de votre période, sans aucuns frais d'annulation."
            ],

            // ==========================================
            // PARAMETRES (10)
            // ==========================================
            [
                'id' => 'param_devise',
                'keywords' => ['changer', 'devise', 'principale', 'gnf', 'eur', 'usd', 'monnaie'],
                'answer' => "Dans 'Paramètres' > 'Général', sélectionnez votre devise de base. Tous vos documents et statistiques utiliseront cette monnaie."
            ],
            [
                'id' => 'param_theme',
                'keywords' => ['couleur', 'theme', 'marque', 'personnaliser'],
                'answer' => "Allez dans 'Paramètres' > 'Personnalisation' pour choisir la couleur d'accentuation (thème) de l'interface et de vos PDF."
            ],
            [
                'id' => 'param_langue',
                'keywords' => ['langue', 'interface', 'anglais', 'francais'],
                'answer' => "Dans les réglages du profil utilisateur, vous pouvez changer la langue de l'application (Français/Anglais selon disponibilité)."
            ],
            [
                'id' => 'param_smtp',
                'keywords' => ['serveur', 'smtp', 'personnalise', 'e-mails'],
                'answer' => "Les paramètres SMTP sont configurables dans 'Intégrations' ou 'Paramètres Email' pour envoyer vos documents depuis votre propre domaine."
            ],
            [
                'id' => 'param_dark_mode',
                'keywords' => ['activer', 'mode', 'sombre', 'dark', 'permanente', 'nuit'],
                'answer' => "Cliquez sur l'icône de lune dans le menu latéral ou naviguez dans 'Apparence' pour forcer le Dark Mode sur votre profil."
            ],
            [
                'id' => 'param_tva',
                'keywords' => ['taux', 'taxe', 'tva', 'retenue', 'source'],
                'answer' => "Dans 'Paramètres' > 'Facturation', configurez vos taux de taxes par défaut (ex: TVA 18%) qui s'appliqueront à vos futurs articles."
            ],
            [
                'id' => 'param_numerotation',
                'keywords' => ['format', 'numerotation', 'prefixe', 'sequence'],
                'answer' => "Modifiez le préfixe, le format (année, mois) et le prochain numéro de séquence dans l'onglet 'Numérotation' des paramètres de facturation."
            ],
            [
                'id' => 'param_mot_de_passe',
                'keywords' => ['mot', 'passe', 'directement', 'changer'],
                'answer' => "Pour la sécurité, allez dans 'Mon Profil' ou 'Sécurité' pour définir un nouveau mot de passe."
            ],
            [
                'id' => 'param_cgv',
                'keywords' => ['configurer', 'texte', 'conditions', 'generales', 'cgv'],
                'answer' => "Dans 'Paramètres' > 'Modèles', collez vos CGV ou notes de bas de page qui s'inséreront automatiquement sur chaque nouveau devis ou facture."
            ],
            [
                'id' => 'param_footer',
                'keywords' => ['personnaliser', 'pied', 'page', 'footer', 'bas'],
                'answer' => "Le 'Footer Text' se gère dans 'Mentions Légales'. Inscrivez-y votre slogan, RIB ou informations légales ; il s'affichera sur vos PDF."
            ]
        ];
    }
}
