<?php
class AdminAuthController {
    public static function handle($pdo, $method, $id, $body) {
        try {
            if ($id === 'login' && $method === 'POST') {
            $username = $body['username'] ?? '';
            $password = $body['password'] ?? '';
            
            $stmt = $pdo->prepare("SELECT * FROM SuperAdmin WHERE username = ?");
            $stmt->execute([$username]);
            $admin = $stmt->fetch();
            
            if ($admin && password_verify($password, $admin['passwordHash'])) {
                $token = $admin['token'] ?: bin2hex(random_bytes(32));
                if (!$admin['token']) {
                    $pdo->prepare("UPDATE SuperAdmin SET token = ? WHERE id = ?")->execute([$token, $admin['id']]);
                }
                echo json_encode([
                    "id" => $admin['id'],
                    "username" => $admin['username'],
                    "token" => $token,
                    "role" => "superadmin"
                ]);
            } else {
                http_response_code(401); echo json_encode(["error" => "Identifiants administrateur incorrects."]);
            }
            exit;
        }
        
        http_response_code(404); echo json_encode(["error" => "Endpoint introuvable."]); exit;
        } catch (Throwable $e) {
            error_log("Admin Auth Error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(["error" => "Erreur interne de la base de données (Admin)."]);
        }
    }
}
