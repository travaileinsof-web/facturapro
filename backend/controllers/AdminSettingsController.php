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
                    'MAIL_USER' => $row['smtpUser'],
                    'MAIL_PASS' => $row['smtpPass'],
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
                $smtpUser = $body['MAIL_USER'] ?? '';
                $smtpPass = $body['MAIL_PASS'] ?? '';
                $companyName = $body['MAIL_FROM_NAME'] ?? '';
                $reminderSettings = isset($body['REMINDER_SETTINGS']) ? json_encode($body['REMINDER_SETTINGS']) : null;
                
                $stmt = $pdo->prepare("UPDATE PlatformSettings SET smtpHost = ?, smtpPort = ?, smtpUser = ?, smtpPass = ?, companyName = ?, reminderSettings = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = 'global'");
                $stmt->execute([$smtpHost, $smtpPort, $smtpUser, $smtpPass, $companyName, $reminderSettings]);
                
                echo json_encode(["success" => true, "message" => "Paramètres mis à jour"]);
                exit;
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["error" => "Erreur lors de la mise à jour des paramètres: " . $e->getMessage()]);
                exit;
            }
        }

        http_response_code(405);
        echo json_encode(["error" => "Méthode non autorisée"]);
        exit;
    }
}
