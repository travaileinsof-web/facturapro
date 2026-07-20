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
                $hashedToken = hash('sha256', $token);
                $hash = password_hash($password, PASSWORD_DEFAULT);
                
                $stmt = $pdo->prepare("INSERT INTO Account (id, email, passwordHash, token, companyName, firstName, lastName, phone, subscriptionPlan, subscriptionStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'free', 'trial')");
                $stmt->execute([$accountId, $email, $hash, $hashedToken, $companyName, $firstName, $lastName, $phone]);
                
                // Génération de la Proforma d'abonnement
                $invoiceId = uniqid('inv_');
                $invoiceNumber = 'FA-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));
                $stmtInv = $pdo->prepare("INSERT INTO SubscriptionInvoice (id, accountId, invoiceNumber, amount) VALUES (?, ?, ?, ?)");
                $stmtInv->execute([$invoiceId, $accountId, $invoiceNumber, 500000]);
                
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
                error_log("Registration Error: " . $e->getMessage());
                http_response_code(500);
                $json = json_encode([
                    "error" => "Erreur interne du serveur lors de l'inscription."
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
            $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
            $stmtAttempt = $pdo->prepare("SELECT attempts, last_attempt FROM LoginAttempt WHERE ip = ?");
            $stmtAttempt->execute([$ip]);
            $attempt = $stmtAttempt->fetch();
            
            if ($attempt && $attempt['attempts'] >= 5 && time() - strtotime($attempt['last_attempt']) < 300) {
                http_response_code(429); echo json_encode(["error" => "Trop de tentatives. Veuillez réessayer dans 5 minutes."]); exit;
            }

            $email = Validator::sanitizeEmail($body['email'] ?? '');
            $password = $body['password'] ?? '';
            
            $stmt = $pdo->prepare("SELECT * FROM Account WHERE email = ?");
            $stmt->execute([$email]);
            $acc = $stmt->fetch();
            
            $dbHash = $acc['passwordHash'] ?? $acc['passwordhash'] ?? '';
            if ($acc && password_verify($password, $dbHash)) {
                if ($attempt) {
                    $pdo->prepare("DELETE FROM LoginAttempt WHERE ip = ?")->execute([$ip]);
                }
                // Générer un nouveau token à chaque connexion pour éviter la fixation de session
                $token = bin2hex(random_bytes(32));
                $hashedToken = hash('sha256', $token);
                $pdo->prepare("UPDATE Account SET token = ? WHERE id = ?")->execute([$hashedToken, $acc['id']]);
                
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
                    "role" => $acc['role'] ?? 'user',
                    // ✅ FIX: Inclure la devise pour que le store Zustand soit correct dès la connexion
                    "currency" => $acc['currency'] ?? $acc['currency'] ?? 'GNF'
                ]);
            } else {
                if ($attempt) {
                    $pdo->prepare("UPDATE LoginAttempt SET attempts = attempts + 1, last_attempt = CURRENT_TIMESTAMP WHERE ip = ?")->execute([$ip]);
                } else {
                    $pdo->prepare("INSERT INTO LoginAttempt (ip, attempts, last_attempt) VALUES (?, 1, CURRENT_TIMESTAMP)")->execute([$ip]);
                }
                http_response_code(401); echo json_encode(["error" => "Identifiants incorrects."]);
            }
            exit;
        }

        if ($id === 'forgot-password' && $method === 'POST') {
            $email = Validator::sanitizeEmail($body['email'] ?? '');
            if (!$email) {
                http_response_code(400); echo json_encode(["error" => "Email manquant."]); exit;
            }
            $stmt = $pdo->prepare("SELECT id FROM Account WHERE email = ?");
            $stmt->execute([$email]);
            if (!$stmt->fetch()) {
                // Return success even if email not found to prevent user enumeration
                echo json_encode(["success" => true]); exit;
            }
            
            // Generate 6 digit code
            $code = sprintf("%06d", mt_rand(1, 999999));
            $expires = gmdate('Y-m-d H:i:s', time() + 3600); // 1 hour expiry (UTC)
            
            // Delete previous codes for this email
            $pdo->prepare("DELETE FROM PasswordReset WHERE email = ?")->execute([$email]);
            
            // Insert new code
            $pdo->prepare("INSERT INTO PasswordReset (email, code, expires_at) VALUES (?, ?, ?)")->execute([$email, $code, $expires]);
            
            // Send email
            require_once __DIR__ . '/../core/SystemMailer.php';
            try {
                SystemMailer::sendPasswordResetCode($pdo, $email, $code);
            } catch (\Throwable $e) {
                error_log("Failed to send reset code: " . $e->getMessage());
                // In local without SMTP, you can check your DB to see the code.
            }
            
            echo json_encode(["success" => true]);
            exit;
        }

        if ($id === 'verify-code' && $method === 'POST') {
            $email = Validator::sanitizeEmail($body['email'] ?? '');
            $code = trim($body['code'] ?? '');
            if (!$email || !$code) {
                http_response_code(400); echo json_encode(["error" => "Données manquantes."]); exit;
            }
            
            $stmt = $pdo->prepare("SELECT * FROM PasswordReset WHERE email = ? AND code = ? AND expires_at > CURRENT_TIMESTAMP");
            $stmt->execute([$email, $code]);
            if (!$stmt->fetch()) {
                http_response_code(400); echo json_encode(["error" => "Code invalide ou expiré."]); exit;
            }
            
            echo json_encode(["success" => true]);
            exit;
        }

        if ($id === 'reset-password' && $method === 'POST') {
            $email = Validator::sanitizeEmail($body['email'] ?? '');
            $code = trim($body['code'] ?? '');
            $password = $body['password'] ?? '';
            
            if (!$email || !$code || !$password) {
                http_response_code(400); echo json_encode(["error" => "Données manquantes."]); exit;
            }
            
            $stmt = $pdo->prepare("SELECT * FROM PasswordReset WHERE email = ? AND code = ? AND expires_at > CURRENT_TIMESTAMP");
            $stmt->execute([$email, $code]);
            if (!$stmt->fetch()) {
                http_response_code(400); echo json_encode(["error" => "Code invalide ou expiré."]); exit;
            }
            
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $pdo->prepare("UPDATE Account SET passwordHash = ? WHERE email = ?")->execute([$hash, $email]);
            $pdo->prepare("DELETE FROM PasswordReset WHERE email = ?")->execute([$email]);
            
            echo json_encode(["success" => true]);
            exit;
        }
    }
}
