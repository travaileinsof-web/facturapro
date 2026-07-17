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

            // 2. Moteur de Recherche d'Intentions (Scoring par mots-clés)
            $intents = ChatKnowledgeBase::getIntents();
            $bestIntent = null;
            $highestScore = 0;

            foreach ($intents as $intent) {
                $score = 0;
                foreach ($intent['keywords'] as $kw) {
                    $kwClean = strtr(mb_strtolower(trim($kw), 'UTF-8'), $unwanted_array);
                    if (empty($kwClean)) continue;
                    
                    // Match mots entiers uniquement pour éviter les faux positifs
                    if (preg_match('/\b' . preg_quote($kwClean, '/') . '\b/i', $cleanMsg)) {
                        $score++;
                    }
                }
                
                // Si on a un meilleur score, on remplace
                if ($score > $highestScore) {
                    $highestScore = $score;
                    $bestIntent = $intent;
                }
            }

            // 3. Réponse finale (Seuil de pertinence = 1 mot-clé trouvé minimum)
            if ($highestScore > 0 && $bestIntent) {
                $replyText = $bestIntent['answer'];
            }
            elseif (strpos($cleanMsg, 'bonjour') !== false || strpos($cleanMsg, 'salut') !== false || strpos($cleanMsg, 'hello') !== false) {
                $replyText = "Bonjour ! Je suis l'assistant FacturaPro. Posez-moi vos questions, je connais le logiciel sur le bout des doigts !";
            }
            else {
                $replyText = "Je n'ai pas tout à fait compris votre demande. Pourriez-vous reformuler avec des mots plus simples (ex: 'Comment créer une facture ?', 'Où modifier ma devise ?') ?";
            }

            echo json_encode(["text" => $replyText, "action" => $clientSideAction]);
        }
    }
}
