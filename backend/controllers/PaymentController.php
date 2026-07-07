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

        $accountId = $currentAccount['id'];
        $amount = 1000; // 1000 GNF
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
            'returnUrl' => rtrim($origin, '/') . '/dashboard?payment=success',
            'cancelUrl' => rtrim($origin, '/') . '/dashboard?payment=cancel',
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

        // Trouver X-Webhook-Signature
        $signatureHeader = '';
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'x-webhook-signature') {
                $signatureHeader = $value;
                break;
            }
        }

        if (empty($signatureHeader)) {
            return ['error' => 'Signature manquante', 'status' => 401];
        }

        // Format attendu: v1:signature
        $parts = explode(':', $signatureHeader);
        if (count($parts) !== 2 || $parts[0] !== 'v1') {
            return ['error' => 'Format de signature invalide', 'status' => 401];
        }
        $providedSignature = $parts[1];

        // Lire le payload brut
        $rawPayload = file_get_contents('php://input');
        
        // Calcul de la signature avec le secret
        $calculatedSignature = hash_hmac('sha256', $rawPayload, DJOMY_CLIENT_SECRET);
        
        // Comparer
        if (!hash_equals($calculatedSignature, $providedSignature)) {
            return ['error' => 'Signature invalide', 'status' => 403];
        }

        $data = json_decode($rawPayload, true);
        if (!$data) {
            return ['error' => 'Payload JSON invalide', 'status' => 400];
        }

        $eventType = $data['eventType'] ?? '';
        $paymentData = $data['data'] ?? [];
        $metadata = $data['metadata'] ?? [];
        $reference = $metadata['reference'] ?? $paymentData['merchantPaymentReference'] ?? '';

        // Log Webhook
        try {
            $stmtLog = $this->pdo->prepare("INSERT INTO WebhookLog (event_type, reference, payload) VALUES (?, ?, ?)");
            $stmtLog->execute([$eventType, $reference, $rawPayload]);
        } catch (Exception $e) {
            // Ignorer l'erreur de log pour ne pas bloquer le traitement
        }
        
        if ($eventType === 'payment.success') {
            if ($reference) {
                // Vérifier l'idempotence
                $stmtCheck = $this->pdo->prepare("SELECT status, amount, accountId FROM SubscriptionPayment WHERE reference = ?");
                $stmtCheck->execute([$reference]);
                $paymentInfo = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if ($paymentInfo && $paymentInfo['status'] !== 'SUCCESS') {
                    $stmt = $this->pdo->prepare("UPDATE SubscriptionPayment SET status = 'SUCCESS', djomyTransactionId = ? WHERE reference = ?");
                    $stmt->execute([$paymentData['transactionId'] ?? null, $reference]);

                    $accountId = $paymentInfo['accountId'];
                    $amount = $paymentInfo['amount'];

                    if ($accountId) {
                        // Mettre à jour l'abonnement
                        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 year'));
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
}
