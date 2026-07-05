<?php
class ChatController {
    public static function handle($pdo, $method, $accountId, $body, $currentAccount) {
        if ($method === 'POST') {
            $history = $body['history'] ?? [];
            $userMsg = $body['message'] ?? '';
            
            // Clé globale (A remplacer par votre vraie clé en production)
            $geminiKey = getenv('GEMINI_API_KEY') ?: 'VOTRE_CLE_API_GLOBALE_ICI';
            if (empty($geminiKey) || $geminiKey === 'VOTRE_CLE_API_GLOBALE_ICI') {
                http_response_code(400); 
                echo json_encode(["error" => "Le service IA est momentanément indisponible (Clé globale manquante)."]); 
                exit;
            }

            // --- 1. PREPARE DATA CONTEXT ---
            $stmtC = $pdo->prepare("SELECT id, name, email FROM Client WHERE accountId = ?"); 
            $stmtC->execute([$accountId]);
            $clients = $stmtC->fetchAll(PDO::FETCH_ASSOC);

            $stmtCat = $pdo->prepare("SELECT id, name, unitPrice FROM CatalogItem WHERE accountId = ?"); 
            $stmtCat->execute([$accountId]);
            $catalog = $stmtCat->fetchAll(PDO::FETCH_ASSOC);

            $stmtDoc = $pdo->prepare("SELECT id, number, clientId, status, total, type FROM ProformaInvoice WHERE accountId = ?");
            $stmtDoc->execute([$accountId]);
            $documents = $stmtDoc->fetchAll(PDO::FETCH_ASSOC);

            // System Context definition
            $systemInstruction = "Tu es ARIA, le super assistant IA de FacturaPro. Tu pilotes l'application. 
Tu peux déclencher des actions via tes 'tools'. 
Voici les données actuelles de l'utilisateur pour t'aider à trouver les IDs :
- Clients: " . json_encode($clients) . "
- Catalogue: " . json_encode($catalog) . "
- Documents: " . json_encode($documents) . "
Règles :
1. Si l'utilisateur demande une action, utilise TOUJOURS l'outil correspondant. N'invente pas les IDs, cherche-les dans tes données contextuelles.
2. Si tu exécutes une action 'Client-Side' (ex: open_whatsapp_share), confirme à l'utilisateur que c'est fait.
3. Réponds de manière professionnelle et courte.";

            // --- 2. FORMAT MESSAGES FOR GEMINI ---
            $contents = [];
            foreach($history as $m) {
                // Ignore empty or unsupported messages for simplicity, but map roles
                $role = $m['role'] === 'user' ? 'user' : 'model';
                $contents[] = [
                    "role" => $role,
                    "parts" => [["text" => $m['text']]]
                ];
            }
            if ($userMsg) {
                $contents[] = [
                    "role" => "user",
                    "parts" => [["text" => $userMsg]]
                ];
            }

            // --- 3. DEFINE THE SKILLS (TOOLS) ---
            $tools = [[
                "functionDeclarations" => [
                    [
                        "name" => "create_client",
                        "description" => "Créer un nouveau client dans la base de données.",
                        "parameters" => [
                            "type" => "OBJECT",
                            "properties" => [
                                "name" => ["type" => "STRING", "description" => "Nom du client"],
                                "email" => ["type" => "STRING", "description" => "Email du client"],
                                "phone" => ["type" => "STRING", "description" => "Téléphone du client"]
                            ],
                            "required" => ["name"]
                        ]
                    ],
                    [
                        "name" => "create_document",
                        "description" => "Créer un Devis, une Pro Forma ou une Facture.",
                        "parameters" => [
                            "type" => "OBJECT",
                            "properties" => [
                                "clientId" => ["type" => "STRING", "description" => "ID du client (récupéré depuis le contexte)"],
                                "type" => ["type" => "STRING", "description" => "Type: 'devis', 'proforma' ou 'facture'"],
                                "items" => [
                                    "type" => "ARRAY",
                                    "description" => "Liste des articles. Ex: [{name: 'Site Web', quantity: 1, unitPrice: 500}]",
                                    "items" => [
                                        "type" => "OBJECT",
                                        "properties" => [
                                            "name" => ["type" => "STRING"],
                                            "quantity" => ["type" => "NUMBER"],
                                            "unitPrice" => ["type" => "NUMBER"]
                                        ]
                                    ]
                                ]
                            ],
                            "required" => ["clientId", "type", "items"]
                        ]
                    ],
                    [
                        "name" => "convert_document",
                        "description" => "Convertir un devis en facture ou proforma.",
                        "parameters" => [
                            "type" => "OBJECT",
                            "properties" => [
                                "documentId" => ["type" => "STRING", "description" => "ID du document à convertir"],
                                "targetType" => ["type" => "STRING", "description" => "'proforma' ou 'facture'"]
                            ],
                            "required" => ["documentId", "targetType"]
                        ]
                    ],
                    [
                        "name" => "open_whatsapp_share",
                        "description" => "Ouvrir l'interface WhatsApp pour envoyer un document au client. C'est une action Client-Side.",
                        "parameters" => [
                            "type" => "OBJECT",
                            "properties" => [
                                "documentId" => ["type" => "STRING", "description" => "L'ID du document à partager"]
                            ],
                            "required" => ["documentId"]
                        ]
                    ]
                ]
            ]];

            $requestData = [
                "systemInstruction" => [
                    "parts" => [["text" => $systemInstruction]]
                ],
                "contents" => $contents,
                "tools" => $tools
            ];

            // --- 4. CALL GEMINI API ---
            $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $geminiKey;
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
            
            $response = curl_exec($ch);
            curl_close($ch);
            
            $geminiData = json_decode($response, true);
            
            if (isset($geminiData['error'])) {
                http_response_code(500);
                echo json_encode(["error" => "Erreur Gemini API: " . $geminiData['error']['message']]);
                exit;
            }

            // Analyze response
            $candidate = $geminiData['candidates'][0]['content']['parts'][0] ?? [];
            
            $replyText = "";
            $actionResult = null;
            $clientSideAction = null;

            if (isset($candidate['functionCall'])) {
                $funcName = $candidate['functionCall']['name'];
                $args = $candidate['functionCall']['args'] ?? [];

                // SKILL ROUTER
                if ($funcName === 'create_client') {
                    $newId = Helper::uuid();
                    $stmt = $pdo->prepare("INSERT INTO Client (id, accountId, name, email, phone) VALUES (?, ?, ?, ?, ?)");
                    $stmt->execute([$newId, $accountId, $args['name'], $args['email']??null, $args['phone']??null]);
                    
                    $actionResult = "Client créé avec succès. ID: $newId";
                    $replyText = "J'ai créé le client {$args['name']}.";
                    $clientSideAction = ["type" => "REFETCH", "target" => "clients"];
                }
                else if ($funcName === 'create_document') {
                    $clientId = $args['clientId'];
                    $type = $args['type'];
                    $today = date('Ymd');
                    
                    $prefix = "FAC";
                    if ($type === 'devis') $prefix = "DEV";
                    else if ($type === 'proforma') $prefix = "PRO";

                    $stmt = $pdo->prepare("SELECT number FROM ProformaInvoice WHERE accountId = ? AND number LIKE ? ORDER BY number DESC LIMIT 1");
                    $stmt->execute([$accountId, "$prefix-$today-%"]);
                    $last = $stmt->fetchColumn(); 
                    $seq = $last ? (int)array_pop(explode('-', $last)) + 1 : 1;
                    
                    $newId = Helper::uuid();
                    $num = sprintf("%s-%s-%03d", $prefix, $today, $seq);
                    $items = $args['items'] ?? [];
                    $subtotal = 0; 
                    foreach($items as $it) $subtotal += ($it['quantity'] * $it['unitPrice']);
                    
                    $stmt = $pdo->prepare("INSERT INTO ProformaInvoice (id, accountId, number, clientId, items, subtotal, total, status, type) VALUES (?, ?, ?, ?, ?, ?, ?, 'brouillon', ?)");
                    $stmt->execute([$newId, $accountId, $num, $clientId, json_encode($items), $subtotal, $subtotal, $type]);
                    
                    $actionResult = "Document créé. ID: $newId, Numéro: $num";
                    $replyText = "J'ai créé le $type ($num) pour ce client.";
                    $clientSideAction = ["type" => "REFETCH", "target" => "invoices"];
                }
                else if ($funcName === 'convert_document') {
                    $docId = $args['documentId'];
                    $tType = $args['targetType'];
                    
                    $prefix = $tType === 'facture' ? 'FAC' : 'PRO';
                    $today = date('Ymd');
                    $stmt = $pdo->prepare("SELECT number FROM ProformaInvoice WHERE accountId = ? AND number LIKE ? ORDER BY number DESC LIMIT 1");
                    $stmt->execute([$accountId, "$prefix-$today-%"]);
                    $last = $stmt->fetchColumn(); $seq = $last ? (int)array_pop(explode('-', $last)) + 1 : 1;
                    $newNum = sprintf("%s-%s-%03d", $prefix, $today, $seq);

                    $stmt = $pdo->prepare("UPDATE ProformaInvoice SET type = ?, number = ? WHERE id = ? AND accountId = ?");
                    $stmt->execute([$tType, $newNum, $docId, $accountId]);
                    
                    $replyText = "J'ai converti le document en $tType ($newNum).";
                    $clientSideAction = ["type" => "REFETCH", "target" => "invoices"];
                }
                else if ($funcName === 'open_whatsapp_share') {
                    $replyText = "Je vous prépare le message WhatsApp pour ce document !";
                    $clientSideAction = ["type" => "WHATSAPP_SHARE", "documentId" => $args['documentId']];
                }
                else {
                    $replyText = "Action $funcName non implémentée totalement.";
                }

                // Pour un vrai système agentic complexe, on renverrait $actionResult à Gemini dans une 2e requête curl 
                // pour qu'il génère le texte lui-même. 
                // Ici, pour des raisons de vitesse d'interface, on court-circuite et on répond directement à l'utilisateur.
            } 
            else if (isset($candidate['text'])) {
                $replyText = $candidate['text'];
            }

            echo json_encode(["text" => $replyText, "action" => $clientSideAction]);
        }
    }
}
