<?php
class AuthController {
    public static function handle($pdo, $method, $id, $body) {
        if ($id === 'register' && $method === 'POST') {
            $email = $body['email'] ?? '';
            $password = $body['password'] ?? '';
            $companyName = $body['company'] ?? '';
            $firstName = $body['firstName'] ?? '';
            $lastName = $body['lastName'] ?? '';
            
            $stmt = $pdo->prepare("SELECT id FROM Account WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                http_response_code(400); echo json_encode(["error" => "Email déjà utilisé."]); exit;
            }

            $accountId = Helper::uuid();
            $token = bin2hex(random_bytes(32));
            $hash = password_hash($password, PASSWORD_DEFAULT);
            
            $stmt = $pdo->prepare("INSERT INTO Account (id, email, passwordHash, token, companyName, firstName, lastName, subscriptionPlan, subscriptionStatus) VALUES (?, ?, ?, ?, ?, ?, ?, 'free', 'trial')");
            $stmt->execute([$accountId, $email, $hash, $token, $companyName, $firstName, $lastName]);
            
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
            $email = $body['email'] ?? '';
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
                    "id" => $acc['id'], "name" => trim($acc['firstname'] . " " . $acc['lastname']),
                    "email" => $acc['email'], "company" => $acc['companyname'], "token" => $token,
                    "subscriptionPlan" => $acc['subscriptionplan'] ?? 'free',
                    "subscriptionStatus" => $acc['subscriptionstatus'] ?? 'trial',
                    "createdAt" => $acc['createdat'],
                    "primaryColor" => $acc['primarycolor'] ?? $acc['primaryColor'] ?? '#B38E36',
                    "secondaryColor" => $acc['secondarycolor'] ?? $acc['secondaryColor'] ?? null,
                    "accentColor" => $acc['accentcolor'] ?? $acc['accentColor'] ?? null,
                    "role" => $acc['role'] ?? 'user'
                ]);
            } else {
                http_response_code(401); echo json_encode(["error" => "Identifiants incorrects."]);
            }
            exit;
        }
    }
}
