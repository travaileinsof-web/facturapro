<?php

class PaymentController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    private function generateHmac($clientId, $clientSecret) {
        return hash_hmac('sha256', $clientId, $clientSecret);
    }

    private function getDjomyToken() {
        $clientId = DJOMY_CLIENT_ID;
        $clientSecret = DJOMY_CLIENT_SECRET;
        
        $signature = $this->generateHmac($clientId, $clientSecret);
        $apiKey = $clientId . ':' . $signature;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, DJOMY_API_URL . '/v1/auth');
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(new stdClass()));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'X-API-KEY: ' . $apiKey,
            'X-PARTNER-DOMAIN: 4fe3ac0a5886164174f9b8a1b9bd3ab4e9d753cbc9638b4434264e2535993ffa'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 201 || $httpCode === 200) {
            $data = json_decode($response, true);
            // Based on typical OAuth/API responses
            if (isset($data['data']['token'])) return $data['data']['token'];
            if (isset($data['data']['accessToken'])) return $data['data']['accessToken'];
            if (isset($data['token'])) return $data['token'];
            if (isset($data['access_token'])) return $data['access_token'];
        }
        
        throw new Exception("Erreur authentification Djomy: " . $response);
    }

    public function initPayment($request) {
        global $currentAccount;
        if (!$currentAccount) {
            return ['error' => 'Non autorisé', 'status' => 401];
        }

        $body = $request['body'] ?? [];
        $payerNumber = $body['payerNumber'] ?? '';
        $origin = $body['origin'] ?? 'http://localhost:5173'; // fallback

        if (empty($payerNumber)) {
            return ['error' => 'Numéro de téléphone obligatoire', 'status' => 400];
        }

        $plan = $currentAccount['subscriptionPlan'] ?? 'free';
        $status = $currentAccount['subscriptionStatus'] ?? 'trial';
        if (($plan === 'annuel' || $plan === 'premium') && $status === 'active') {
            return ['error' => 'Abonnement déjà actif', 'status' => 400];
        }

        $accountId = $currentAccount['id'];
        $amount = 500000; // 500 000 GNF
        $reference = 'SUB-' . uniqid() . '-' . time();

        // 1. Enregistrer dans SubscriptionPayment
        $stmt = $this->pdo->prepare("INSERT INTO SubscriptionPayment (id, accountId, reference, amount, status) VALUES (?, ?, ?, ?, ?)");
        $id = uniqid('pay_');
        $stmt->execute([$id, $accountId, $reference, $amount, 'PENDING']);

        // 2. Obtenir le token
        try {
            $token = $this->getDjomyToken();
        } catch (Exception $e) {
            return ['error' => $e->getMessage(), 'status' => 500];
        }

        // 3. Initier le paiement avec redirection
        $clientId = DJOMY_CLIENT_ID;
        $clientSecret = DJOMY_CLIENT_SECRET;
        $signature = $this->generateHmac($clientId, $clientSecret);
        $apiKey = $clientId . ':' . $signature;

        $payload = [
            'amount' => $amount,
            'countryCode' => 'GN',
            'payerNumber' => $payerNumber,
            'description' => 'Abonnement Annuel FacturaPro',
            'merchantPaymentReference' => $reference,
            'returnUrl' => rtrim($origin, '/') . '/dashboard?payment=success&ref=' . $reference,
            'cancelUrl' => rtrim($origin, '/') . '/dashboard?payment=cancel',
            'webhookUrl' => rtrim($origin, '/') . '/api/v1/webhooks/djomy',
            'callbackUrl' => rtrim($origin, '/') . '/api/v1/webhooks/djomy',
            'metadata' => [
                'reference' => $reference,
                'accountId' => $accountId
            ]
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, DJOMY_API_URL . '/v1/payments/gateway');
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
            'X-API-KEY: ' . $apiKey,
            'X-PARTNER-DOMAIN: 4fe3ac0a5886164174f9b8a1b9bd3ab4e9d753cbc9638b4434264e2535993ffa'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 201 || $httpCode === 200) {
            $data = json_decode($response, true);
            // Try to find the paymentUrl in the response payload
            $paymentUrl = $data['data']['paymentUrl'] ?? $data['data']['redirectUrl'] ?? $data['data']['url'] ?? '';
            
            if ($paymentUrl) {
                return ['success' => true, 'paymentUrl' => $paymentUrl];
            } else {
                return ['error' => 'URL de paiement introuvable dans la réponse de Djomy.', 'details' => $data, 'status' => 500];
            }
        }

        return ['error' => 'Erreur lors de la création du paiement Djomy', 'details' => json_decode($response, true) ?? $response, 'status' => $httpCode];
    }

    public function handleWebhook($request) {
        // Lire le payload brut en premier
        $rawPayload = file_get_contents('php://input');
        
        // Obtenir tous les en-têtes
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
        } else {
            $headers = [];
            foreach ($_SERVER as $name => $value) {
                if (substr($name, 0, 5) == 'HTTP_') {
                    $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
                }
            }
        }

        // --- DEBUG LOG START ---
        try {
            $stmtLog = $this->pdo->prepare("INSERT INTO WebhookLog (event_type, reference, payload) VALUES (?, ?, ?)");
            $stmtLog->execute(['debug_webhook', 'all_headers', $rawPayload . ' | HEADERS: ' . json_encode($headers)]);
        } catch (Exception $e) { }
        // --- DEBUG LOG END ---

        // Trouver X-Webhook-Signature
        $signatureHeader = '';
        foreach ($headers as $key => $value) {
            $lowerKey = strtolower($key);
            if (in_array($lowerKey, ['x-webhook-signature', 'djamo-signature', 'x-djamo-signature', 'djomy-signature', 'x-djomy-signature'])) {
                $signatureHeader = $value;
                break;
            }
        }

        if (empty($signatureHeader)) {
            // Pour le débug, on va quand même continuer ou loguer l'erreur
            try {
                $stmtLog = $this->pdo->prepare("INSERT INTO WebhookLog (event_type, reference, payload) VALUES (?, ?, ?)");
                $stmtLog->execute(['error', 'missing_signature', 'Headers: ' . json_encode($headers)]);
            } catch (Exception $e) { }
            return ['error' => 'Signature manquante', 'status' => 401];
        }

        // Format attendu: v1:signature ou juste signature
        if (strpos($signatureHeader, 'v1:') === 0) {
            $providedSignature = substr($signatureHeader, 3);
        } else {
            $providedSignature = $signatureHeader;
        }
        
        // Calcul de la signature avec le secret
        $calculatedSignature = hash_hmac('sha256', $rawPayload, DJOMY_CLIENT_SECRET);
        
        // Comparer
        if (!hash_equals($calculatedSignature, $providedSignature)) {
            try {
                $stmtLog = $this->pdo->prepare("INSERT INTO WebhookLog (event_type, reference, payload) VALUES (?, ?, ?)");
                $stmtLog->execute(['error', 'signature_mismatch', 'Calculated: ' . $calculatedSignature . ' Provided: ' . $providedSignature]);
            } catch (Exception $e) { }
            return ['error' => 'Signature invalide', 'status' => 403];
        }

        $data = json_decode($rawPayload, true);
        if (!$data) {
            return ['error' => 'Payload JSON invalide', 'status' => 400];
        }

        $eventType = $data['eventType'] ?? $data['event'] ?? $data['type'] ?? $data['status'] ?? '';
        $paymentData = $data['data'] ?? $data;
        $metadata = $data['metadata'] ?? $paymentData['metadata'] ?? [];
        $reference = $metadata['reference'] ?? $paymentData['merchantPaymentReference'] ?? $paymentData['reference'] ?? '';

        // Log Webhook
        try {
            $stmtLog = $this->pdo->prepare("INSERT INTO WebhookLog (event_type, reference, payload) VALUES (?, ?, ?)");
            $stmtLog->execute([$eventType, $reference, $rawPayload]);
        } catch (Exception $e) {
            // Ignorer l'erreur de log pour ne pas bloquer le traitement
        }
        
        $isSuccess = in_array(strtolower($eventType), ['payment.success', 'transaction.success', 'success', 'completed', 'successful']);
        
        if ($isSuccess) {
            if ($reference) {
                // Vérifier l'idempotence
                $stmtCheck = $this->pdo->prepare("SELECT status, amount, accountId FROM SubscriptionPayment WHERE reference = ?");
                $stmtCheck->execute([$reference]);
                $paymentInfo = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if ($paymentInfo && $paymentInfo['status'] !== 'COMPLETED') {
                    $expectedAmount = (float) $paymentInfo['amount'];
                    $paidAmount = (float) ($paymentData['amount'] ?? 0);
                    
                    if ($paidAmount < $expectedAmount && $paidAmount > 0) {
                        try {
                            $stmtLog = $this->pdo->prepare("INSERT INTO WebhookLog (event_type, reference, payload) VALUES (?, ?, ?)");
                            $stmtLog->execute(['error', 'amount_mismatch', "Expected: $expectedAmount, Paid: $paidAmount, Payload: $rawPayload"]);
                            $this->pdo->prepare("UPDATE SubscriptionPayment SET status = 'FAILED' WHERE reference = ?")->execute([$reference]);
                        } catch (Exception $e) { }
                        return ['error' => 'Montant paye insuffisant', 'status' => 400];
                    }

                    $stmt = $this->pdo->prepare("UPDATE SubscriptionPayment SET status = 'COMPLETED', djomyTransactionId = ? WHERE reference = ?");
                    $stmt->execute([$paymentData['transactionId'] ?? null, $reference]);

                    $accountId = $paymentInfo['accountId'];
                    $amount = $paymentInfo['amount'];

                    if ($accountId) {
                        // Mettre à jour l'abonnement
                        $stmtCheckExp = $this->pdo->prepare("SELECT subscriptionExpiresAt FROM Account WHERE id = ?");
                        $stmtCheckExp->execute([$accountId]);
                        $currentExp = $stmtCheckExp->fetchColumn();
                        
                        if ($currentExp && strtotime($currentExp) > time()) {
                            // S'il reste du temps, on ajoute 1 an à la date d'expiration actuelle
                            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 year', strtotime($currentExp)));
                        } else {
                            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 year'));
                        }
                        
                        $stmt = $this->pdo->prepare("UPDATE Account SET subscriptionPlan = 'annuel', subscriptionStatus = 'active', subscriptionExpiresAt = ?, lastPaymentDate = CURRENT_TIMESTAMP WHERE id = ?");
                        $stmt->execute([$expiresAt, $accountId]);

                        // Mettre à jour la facture proforma en payée
                        $stmtFindInv = $this->pdo->prepare("SELECT id, invoiceNumber FROM SubscriptionInvoice WHERE accountId = ? AND status = 'proforma' ORDER BY createdAt DESC LIMIT 1");
                        $stmtFindInv->execute([$accountId]);
                        $proforma = $stmtFindInv->fetch();
                        
                        $invoiceId = $proforma ? $proforma['id'] : null;
                        if ($invoiceId) {
                            $this->pdo->prepare("UPDATE SubscriptionInvoice SET status = 'paid' WHERE id = ?")->execute([$invoiceId]);
                        }
                        
                        // Générer un reçu
                        $receiptId = uniqid('sub_rec_');
                        $receiptNumber = 'REC-SUB-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));
                        $stmtRec = $this->pdo->prepare("INSERT INTO SubscriptionReceipt (id, accountId, receiptNumber, subscriptionInvoiceId, amount) VALUES (?, ?, ?, ?, ?)");
                        $stmtRec->execute([$receiptId, $accountId, $receiptNumber, $invoiceId, $amount]);
                        
                        // Fetch Account info for email
                        $stmtAcc = $this->pdo->prepare("SELECT email, firstName FROM Account WHERE id = ?");
                        $stmtAcc->execute([$accountId]);
                        $acc = $stmtAcc->fetch();
                        
                        if ($acc) {
                            require_once __DIR__ . '/../core/SystemMailer.php';
                            SystemMailer::sendPaymentConfirmation($this->pdo, $acc['email'], $acc['firstName'] ?? 'Client', $amount, $receiptNumber);
                        }

                        // Création de la notification In-App
                        try {
                            $notifId = uniqid('notif_');
                            $title = 'Abonnement Premium activé';
                            $message = 'Votre paiement a été reçu avec succès. Votre compte est désormais Premium pour une durée de 1 an.';
                            $stmtNotif = $this->pdo->prepare("INSERT INTO Notification (id, accountId, title, message, type) VALUES (?, ?, ?, ?, 'success')");
                            $stmtNotif->execute([$notifId, $accountId, $title, $message]);
                        } catch (Exception $e) {
                            // Ignorer l'erreur pour ne pas bloquer le processus
                        }
                    }
                }
            }
        } elseif ($eventType === 'payment.failed' || $eventType === 'payment.cancelled') {
            if ($reference) {
                $stmt = $this->pdo->prepare("UPDATE SubscriptionPayment SET status = 'FAILED' WHERE reference = ?");
                $stmt->execute([$reference]);
            }
        }

        // Toujours retourner 200 pour dire à Djomy qu'on a bien reçu le webhook
        return ['success' => true];
    }

    public function syncPayment($request) {
        global $currentAccount;
        if (!$currentAccount) return ['error' => 'Non autorisé', 'status' => 401];

        $reference = $_GET['ref'] ?? '';
        if (!$reference) return ['error' => 'Référence manquante', 'status' => 400];

        $stmtCheck = $this->pdo->prepare("SELECT status, amount, accountId FROM SubscriptionPayment WHERE reference = ?");
        $stmtCheck->execute([$reference]);
        $paymentInfo = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$paymentInfo) return ['error' => 'Paiement introuvable', 'status' => 404];
        if ($paymentInfo['accountId'] !== $currentAccount['id']) return ['error' => 'Accès refusé', 'status' => 403];

        if ($paymentInfo['status'] === 'COMPLETED') {
            return ['success' => true, 'synced' => true];
        }

        // ATTENTION SECURITE : 
        // On ne force PLUS le statut à COMPLETED manuellement ici. 
        // Seul le Webhook officiel de Djomy (qui possède la signature de sécurité) a le droit de passer le statut à COMPLETED.
        // Ce endpoint (syncPayment) sert uniquement au frontend pour "poller" (attendre) que le Webhook ait fait son travail.
        
        return ['success' => false, 'status' => 'PENDING', 'message' => 'En attente de confirmation par le serveur de paiement'];
    }
}
