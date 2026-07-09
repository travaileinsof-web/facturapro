<?php
class AuthController {
    public static function handle($pdo, $method, $id, $body) {
        if ($id === 'register' && $method === 'POST') {
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
            $stmtInv = $pdo->prepare("INSERT INTO SubscriptionInvoice (id, accountId, invoiceNumber, amount, status) VALUES (?, ?, ?, ?, 'proforma')");
            $stmtInv->execute([$invoiceId, $accountId, $invoiceNumber, 1000]);
            
            // Envoi de l'Email de Bienvenue
            require_once __DIR__ . '/../core/SystemMailer.php';
            SystemMailer::sendWelcomeEmail($pdo, $email, $firstName, $invoiceNumber);
            
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
        }
        
        if ($id === 'login' && $method === 'POST') {
            $email = Validator::sanitizeEmail($body['email'] ?? '');
            $password = $body['password'] ?? '';
            
            $stmt = $pdo->prepare("SELECT * FROM Account WHERE email = ?");
            $stmt->execute([$email]);
            $acc = $stmt->fetch();
            
            if ($acc && password_verify($password, $acc['passwordHash'])) {
                // Réutiliser le token existant s'il est valide, sinon en générer un nouveau
                $token = $acc['token'] ?: bin2hex(random_bytes(32));
                if (!$acc['token']) {
                    $pdo->prepare("UPDATE Account SET token = ? WHERE id = ?")->execute([$token, $acc['id']]);
                }
                echo json_encode([
                    "id" => $acc['id'],
                    "name" => trim(($acc['firstName'] ?? $acc['firstname'] ?? '') . " " . ($acc['lastName'] ?? $acc['lastname'] ?? '')),
                    "email" => $acc['email'],
                    "company" => $acc['companyName'] ?? $acc['companyname'] ?? null,
                    "token" => $token,
                    "subscriptionPlan" => $acc['subscriptionPlan'] ?? $acc['subscriptionplan'] ?? 'free',
                    "subscriptionStatus" => $acc['subscriptionStatus'] ?? $acc['subscriptionstatus'] ?? 'trial',
                    "createdAt" => $acc['createdAt'] ?? $acc['createdat'] ?? null,
                    "primaryColor" => $acc['primaryColor'] ?? $acc['primarycolor'] ?? '#B38E36',
                    "secondaryColor" => $acc['secondaryColor'] ?? $acc['secondarycolor'] ?? null,
                    "accentColor" => $acc['accentColor'] ?? $acc['accentcolor'] ?? null,
                    "role" => $acc['role'] ?? 'user'
                ]);
            } else {
                http_response_code(401); echo json_encode(["error" => "Identifiants incorrects."]);
            }
            exit;
        }
    }
}
