<?php
class SettingsController {
    public static function handle($pdo, $method, $accountId, $body, $currentAccount) {
        if ($method === 'GET') {
            $safeAccount = $currentAccount;
            unset($safeAccount['passwordHash'], $safeAccount['token'], $safeAccount['geminiKey']);
            echo json_encode($safeAccount);
        } elseif ($method === 'PUT') {
            $updates = [];
            $params = [];
            
            if (!empty($body['password'])) {
                if (empty($body['currentPassword']) || !password_verify($body['currentPassword'], $currentAccount['passwordHash'])) {
                    http_response_code(400);
                    echo json_encode(["error" => "Mot de passe actuel incorrect."]);
                    exit;
                }
                $updates[] = "passwordHash = ?";
                $params[] = password_hash($body['password'], PASSWORD_DEFAULT);
                $newToken = bin2hex(random_bytes(32));
                $updates[] = "token = ?";
                $params[] = $newToken;
            }

            foreach (['companyName', 'slogan', 'address', 'phone', 'website', 'taxId', 'bankName', 'bankAccount', 'logo', 'stamp', 'signature', 'primaryColor', 'secondaryColor', 'accentColor', 'whatsappMessage', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpEncryption', 'currency', 'autoRemindersEnabled', 'autoReminderDays'] as $field) {
                if (array_key_exists($field, $body)) {
                    $updates[] = "$field = ?";
                    $params[] = $body[$field];
                }
            }
            file_put_contents(__DIR__ . '/debug_settings.log', print_r($body, true));
            
            if (count($updates) > 0) {
                $params[] = $accountId;
                $sql = "UPDATE Account SET " . implode(', ', $updates) . " WHERE id = ?";
                $pdo->prepare($sql)->execute($params);
            }
            
            $stmt = $pdo->prepare("SELECT * FROM Account WHERE id = ?");
            $stmt->execute([$accountId]);
            $updatedAccount = $stmt->fetch();
            
            unset($updatedAccount['passwordHash'], $updatedAccount['geminiKey']);
            if (!isset($newToken)) {
                unset($updatedAccount['token']);
            }
            
            echo json_encode($updatedAccount);
        }
    }
}
