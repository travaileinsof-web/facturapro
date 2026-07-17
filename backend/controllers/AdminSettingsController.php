<?php
class AdminSettingsController {
    public static function handle($pdo, $method, $body) {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM PlatformSettings WHERE id = 'global'");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $settings = [];
            if ($row) {
                $settings = [
                    'MAIL_HOST' => $row['smtpHost'],
                    'MAIL_PORT' => $row['smtpPort'],
                    'MAIL_ENCRYPTION' => $row['smtpEncryption'] ?? 'tls',
                    'MAIL_USER' => $row['smtpUser'],
                    'MAIL_PASS' => '', // Ne pas renvoyer le mot de passe pour la sécurité et éviter l'autofill
                    'MAIL_FROM_NAME' => $row['companyName'],
                    'REMINDER_SETTINGS' => $row['reminderSettings'] ? json_decode($row['reminderSettings'], true) : null
                ];
            }
            echo json_encode($settings);
            exit;
        }

        if ($method === 'POST' || $method === 'PUT') {
            try {
                $smtpHost = $body['MAIL_HOST'] ?? '';
                $smtpPort = $body['MAIL_PORT'] ?? '';
                $smtpEncryption = $body['MAIL_ENCRYPTION'] ?? 'tls';
                $smtpUser = $body['MAIL_USER'] ?? '';
                $companyName = $body['MAIL_FROM_NAME'] ?? '';
                $reminderSettings = isset($body['REMINDER_SETTINGS']) ? json_encode($body['REMINDER_SETTINGS']) : null;
                
                $updates = [
                    "smtpHost = ?", "smtpPort = ?", "smtpEncryption = ?", 
                    "smtpUser = ?", "companyName = ?", "reminderSettings = ?", 
                    "updatedAt = CURRENT_TIMESTAMP"
                ];
                $params = [
                    $smtpHost, $smtpPort, $smtpEncryption, 
                    $smtpUser, $companyName, $reminderSettings
                ];
                
                if (!empty($body['MAIL_PASS'])) {
                    $updates[] = "smtpPass = ?";
                    $params[] = $body['MAIL_PASS'];
                }
                
                $sql = "UPDATE PlatformSettings SET " . implode(', ', $updates) . " WHERE id = 'global'";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                
                echo json_encode(["success" => true, "message" => "Paramètres mis à jour"]);
                exit;
            } catch (Exception $e) {
                error_log("Admin Settings Error: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["error" => "Erreur interne lors de la mise à jour des paramètres."]);
                exit;
            }
        }

        http_response_code(405);
        echo json_encode(["error" => "Méthode non autorisée"]);
        exit;
    }
}
