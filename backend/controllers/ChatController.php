<?php
require_once __DIR__ . '/ChatKnowledgeBase.php';

class ChatController {
    public static function handle($pdo, $method, $accountId, $body, $currentAccount) {
        if ($method === 'POST') {
            $history = $body['history'] ?? [];
            $userMsg = $body['message'] ?? '';
            
            // --- MOCK LOCAL AI (Sans API Externe) ---
            $lowerMsg = mb_strtolower(trim($userMsg), 'UTF-8');
            
            // Suppression des accents pour un meilleur matching
            $unwanted_array = array('à'=>'a', 'á'=>'a', 'â'=>'a', 'ã'=>'a', 'ä'=>'a', 'ç'=>'c', 'è'=>'e', 'é'=>'e', 'ê'=>'e', 'ë'=>'e', 'ì'=>'i', 'í'=>'i', 'î'=>'i', 'ï'=>'i', 'ñ'=>'n', 'ò'=>'o', 'ó'=>'o', 'ô'=>'o', 'õ'=>'o', 'ö'=>'o', 'ù'=>'u', 'ú'=>'u', 'û'=>'u', 'ü'=>'u', 'ý'=>'y', 'ÿ'=>'y');
            $cleanMsg = strtr($lowerMsg, $unwanted_array);
            // Suppression de la ponctuation basique
            $cleanMsg = str_replace(['?', '!', '.', ',', '\'', '"', '-'], ' ', $cleanMsg);
            
            $replyText = "";
            $clientSideAction = null;

            // 1. Actions pratiques refusées
            if (preg_match('/^(creer|ajoute|modifier|supprime|envoie|cree|ouvre|fais|faites|creez|ajoutez|modifiez|supprimez|envoyez|ouvrez)\b/i', ltrim($cleanMsg)) ||
                preg_match('/\b(tu peux|peux tu|je veux que tu)\b.*\b(creer|ajoute|modifier|supprime|envoie|cree|ouvre|fais|faites|creez|ajoutez|modifiez|supprimez|envoyez|ouvrez)\b/i', $cleanMsg)) {
                $replyText = "Je ne suis pas habilité à effectuer des actions pratiques à votre place. Mon rôle est uniquement de répondre à vos questions et de vous orienter dans l'application.";
                echo json_encode(["text" => $replyText, "action" => null]);
                return;
            }

            // 2. Moteur de Recherche d'Intentions (Scoring Intelligent)
            $intents = ChatKnowledgeBase::getIntents();
            $bestIntent = null;
            $highestScore = 0;

            // Filtrage des mots vides (stop words) pour ne garder que les mots clés importants
            $stopwords = ['un', 'une', 'le', 'la', 'les', 'des', 'de', 'du', 'je', 'tu', 'il', 'nous', 'vous', 'ils', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'a', 'au', 'aux', 'dans', 'pour', 'par', 'sur', 'avec', 'sans', 'sous', 'et', 'ou', 'donc', 'or', 'ni', 'car', 'avoir', 'etre'];
            $msgWords = array_filter(explode(' ', $cleanMsg));
            $filteredWords = array_diff($msgWords, $stopwords);
            $cleanMsgFiltered = implode(' ', $filteredWords);
            
            // Détection globale des sujets dans le message de l'utilisateur
            $detectedSubjects = [];
            if (preg_match('/\b(client|clients)\b/i', $cleanMsg)) $detectedSubjects['client'] = true;
            if (preg_match('/\b(facture|factures|devis|proforma)\b/i', $cleanMsg)) $detectedSubjects['facture'] = true;
            if (preg_match('/\b(recu|recus|paiement|paiements|encaisser|encaisse)\b/i', $cleanMsg)) $detectedSubjects['recu'] = true;
            if (preg_match('/\b(depense|depenses|achat|achats)\b/i', $cleanMsg)) $detectedSubjects['depense'] = true;
            if (preg_match('/\b(catalogue|produit|produits|service|services|article|articles|stock)\b/i', $cleanMsg)) $detectedSubjects['catalogue'] = true;
            if (preg_match('/\b(tableau|bord|statistique|statistiques|chiffre|ca|revenu|benefice|rentabilite)\b/i', $cleanMsg)) $detectedSubjects['db'] = true;
            if (preg_match('/\b(relance|relances|retard|impaye|impayes)\b/i', $cleanMsg)) $detectedSubjects['relance'] = true;
            if (preg_match('/\b(parametre|parametres|entreprise|logo|signature|cachet|tva)\b/i', $cleanMsg)) $detectedSubjects['parametre'] = true;

            foreach ($intents as $intent) {
                // Application du bonus de Contexte basé sur l'ID de l'intention
                $prefix = explode('_', $intent['id'])[0];
                $subjectBonus = isset($detectedSubjects[$prefix]) ? 50 : 0;

                $keywordMatches = 0;
                $totalKeywords = count($intent['keywords']);

                foreach ($intent['keywords'] as $kw) {
                    $kwClean = strtr(mb_strtolower(trim($kw), 'UTF-8'), $unwanted_array);
                    if (empty($kwClean)) continue;
                    
                    // Match mots entiers sur le message FILTRÉ
                    if (preg_match('/\b' . preg_quote($kwClean, '/') . '\b/i', $cleanMsgFiltered)) {
                        $keywordMatches++;
                    }
                }
                
                $score = 0;
                // On exige au moins 1 mot clé pertinent (hors sujet) pour valider l'intention
                if ($keywordMatches > 0) {
                    // Formule magique : Bonus Contexte + Poids des mots trouvés + Pertinence (Ratio)
                    $score = $subjectBonus + ($keywordMatches * 10) + ($keywordMatches / $totalKeywords);
                }
                
                if ($score > $highestScore) {
                    $highestScore = $score;
                    $bestIntent = $intent;
                }
            }

            // Vérification si l'utilisateur demande une explication globale d'un module
            $explanationWords = ['sert', 'fonctionne', 'fonctionnement', 'expliquer', 'explication', 'savoir', 'partie', 'module', 'quoi', 'utile', 'utilite', 'propos', 'role', 'principe', 'client', 'clients', 'facture', 'factures', 'recu', 'recus', 'paiement', 'paiements', 'depense', 'depenses', 'catalogue', 'produit', 'produits', 'tableau', 'bord', 'relance', 'relances', 'parametre', 'parametres'];
            $wantsExplanation = count(array_intersect($msgWords, $explanationWords)) > 0;

            // 3. Réponse finale
            if ($highestScore >= 10 && $bestIntent) {
                $replyText = $bestIntent['answer'];
            }
            elseif ($highestScore < 10 && $wantsExplanation && count($detectedSubjects) > 0) {
                $explanations = [
                    'client' => "Le module Clients vous permet de centraliser la base de données de vos clients (particuliers ou entreprises). Vous pourrez y suivre l'historique de toutes les factures de chaque client et retrouver leurs coordonnées en un clic.",
                    'facture' => "La section Factures est le cœur de l'application. Elle sert à générer des devis et factures professionnels. Vous pouvez y suivre l'état de chaque document (Brouillon, Envoyé, Payé, En retard) et les envoyer par e-mail ou WhatsApp.",
                    'recu' => "Les Reçus (ou Paiements) servent à enregistrer les encaissements. Quand un client paie une facture, vous générez un reçu. Cela permet de calculer automatiquement votre chiffre d'affaires réellement encaissé.",
                    'depense' => "La partie Dépenses est faite pour enregistrer vos achats opérationnels (fournisseurs, loyer, transport, etc.). Ces dépenses sont déduites de vos revenus pour calculer automatiquement votre bénéfice net sur le Tableau de bord.",
                    'catalogue' => "Le Catalogue (ou Inventaire) est l'endroit où vous enregistrez tous vos produits et services avec leurs prix par défaut. Cela vous fera gagner un temps précieux lors de la création de vos factures !",
                    'db' => "Le Tableau de bord est votre centre de contrôle. Il sert à vous donner une vue d'ensemble en temps réel sur la santé de votre entreprise : chiffre d'affaires, total encaissé, bénéfice net, et créances à recouvrer.",
                    'relance' => "Le module de Relances vous aide à être payé à temps. Il détecte automatiquement les factures en retard et vous permet d'envoyer des rappels de paiement professionnels à vos clients.",
                    'parametre' => "Les Paramètres vous permettent de configurer l'application à votre image : ajout de logo, cachet, signature, personnalisation des couleurs, gestion de la TVA et configuration de votre abonnement."
                ];
                // On prend le premier sujet détecté
                $firstSubject = array_key_first($detectedSubjects);
                $replyText = $explanations[$firstSubject];
            }
            elseif (strpos($cleanMsg, 'bonjour') !== false || strpos($cleanMsg, 'salut') !== false || strpos($cleanMsg, 'hello') !== false || strpos($cleanMsg, 'coucou') !== false) {
                $replyText = "Bonjour ! Je suis l'assistant intelligent de FacturaPro. Posez-moi vos questions, je connais le logiciel sur le bout des doigts !";
            }
            else {
                $replyText = "Je n'ai pas tout à fait compris votre demande ou elle est hors de mes compétences. Pourriez-vous reformuler avec des mots plus simples (ex: 'Créer une facture', 'Ajouter un client') ?";
            }

            echo json_encode(["text" => $replyText, "action" => $clientSideAction]);
        }
    }
}
