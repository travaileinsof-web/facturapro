<?php
class AuthController {
    public static function handle($pdo, $method, $id, $body) {
        if ($id === 'register' && $method === 'POST') {
            try {
                $email = Validator::sanitizeEmail($body['email'] ?? '');
                $password = $body['password'] ?? '';
                $companyName = Validator::sanitizeString($body['company'] ?? '');
                $firstName = Validator::sanitizeString($body['firstName'] ?? '');
                $lastName = Validator::sanitizeString($body['lastName'] ?? '');
                $phone = Validator::sanitizeString($body['phone'] ?? '');
                
                if (empty($phone)) {
                    http_response_code(400); echo json_encode(["error" => "Le numéro de téléphone est obligatoire."]); exit;
                }
                
                $stmt = $pdo->prepare("SELECT id FROM Account WHERE email = ?");
                $stmt->execute([$email]);
                if ($stmt->fetch()) {
                    http_response_code(400); echo json_encode(["error" => "Email déjà utilisé."]); exit;
                }

                $accountId = Helper::uuid();
                $token = bin2hex(random_bytes(32));
                $hash = password_hash($password, PASSWORD_DEFAULT);
                
                $stmt = $pdo->prepare("INSERT INTO Account (id, email, passwordHash, token, companyName, firstName, lastName, phone, subscriptionPlan, subscriptionStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'free', 'trial')");
                $stmt->execute([$accountId, $email, $hash, $token, $companyName, $firstName, $lastName, $phone]);
                
                // Génération de la Proforma d'abonnement
                $invoiceId = uniqid('sub_inv_');
                $invoiceNumber = 'INV-SUB-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));
                $stmtInv = $pdo->prepare("INSERT INTO SubscriptionInvoice (id, accountId, invoiceNumber, amount) VALUES (?, ?, ?, ?)");
                $stmtInv->execute([$invoiceId, $accountId, $invoiceNumber, 1000]);
                
                // Envoi de l'Email de Bienvenue
                require_once __DIR__ . '/../core/SystemMailer.php';
                try {
                    SystemMailer::sendWelcomeEmail($pdo, $email, $firstName, $invoiceNumber);
                } catch (\Throwable $e) {
                    error_log("Failed to send welcome email: " . $e->getMessage());
                }
                
                echo json_encode([
                    "id" => $accountId, "name" => trim("$firstName $lastName"),
                    "email" => $email, "company" => $companyName, "token" => $token,
                    "subscriptionPlan" => "free", "subscriptionStatus" => "trial",
                    "createdAt" => date('Y-m-d H:i:s'),
                    "primaryColor" => "#B38E36",
                    "secondaryColor" => null,
                    "accentColor" => null,
                    "role" => "user"
                ]);
                exit;
            } catch (\Throwable $e) {
                file_put_contents(__DIR__ . '/../error_debug.txt', $e->getMessage() . "\n" . $e->getTraceAsString());
                http_response_code(500);
                $json = json_encode([
                    "error" => "Internal Server Error during registration.",
                    "message" => "An error occurred. Check error_debug.txt for details.",
                    "file" => $e->getFile(),
                    "line" => $e->getLine()
                ]);
                if (!$json) {
                    echo '{"error": "Fatal Error", "message": "Failed to json_encode the error"}';
                } else {
                    echo $json;
                }
                exit;
            }
        }
        
        if ($id === 'login' && $method === 'POST') {
            $email = Validator::sanitizeEmail($body['email'] ?? '');
            $password = $body['password'] ?? '';
            
            $stmt = $pdo->prepare("SELECT * FROM Account WHERE email = ?");
            $stmt->execute([$email]);
            $acc = $stmt->fetch();
            
            if ($acc && password_verify($password, $acc['passwordHash'])) {
                // Générer un nouveau token à chaque connexion pour éviter la fixation de session
                $token = bin2hex(random_bytes(32));
                $pdo->prepare("UPDATE Account SET token = ? WHERE id = ?")->execute([$token, $acc['id']]);
                
                echo json_encode([
                    "id" => $acc['id'],
                    "name" => trim(($acc['firstName'] ?? $acc['firstname'] ?? '') . " " . ($acc['lastName'] ?? $acc['lastname'] ?? '')),
                    "email" => $acc['email'],
                    "company" => $acc['companyName'] ?? $acc['companyname'] ?? null,
                    "token" => $token,
                    "smtpHost" => $acc['smtpHost'] ?? $acc['smtphost'] ?? null,
                    "subscriptionPlan" => $acc['subscriptionPlan'] ?? $acc['subscriptionplan'] ?? 'free',
                    "subscriptionStatus" => $acc['subscriptionStatus'] ?? $acc['subscriptionstatus'] ?? 'trial',
                    "createdAt" => $acc['createdAt'] ?? $acc['createdat'] ?? null,
                    "primaryColor" => $acc['primaryColor'] ?? $acc['primarycolor'] ?? '#B38E36',
                    "secondaryColor" => $acc['secondaryColor'] ?? $acc['secondarycolor'] ?? null,
                    "accentColor" => $acc['accentColor'] ?? $acc['accentcolor'] ?? null,
                    "role" => $acc['role'] ?? 'user'
                ]);
            } else {
                sleep(1); // Ralentir les attaques brute-force
                http_response_code(401); echo json_encode(["error" => "Identifiants incorrects."]);
            }
            exit;
        }
    }
}
