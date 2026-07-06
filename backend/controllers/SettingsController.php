<?php
class SettingsController {
    public static function handle($pdo, $method, $accountId, $body, $currentAccount) {
        if ($method === 'GET') {
            $safeAccount = $currentAccount;
            unset($safeAccount['passwordhash'], $safeAccount['passwordHash'], $safeAccount['token'], $safeAccount['geminikey'], $safeAccount['geminiKey']);
            
            // Map lowercased postgres columns to camelCase
            $camelMap = [
                'companyname' => 'companyName',
                'firstname' => 'firstName',
                'lastname' => 'lastName',
                'taxid' => 'taxId',
                'bankname' => 'bankName',
                'bankaccount' => 'bankAccount',
                'primarycolor' => 'primaryColor',
                'secondarycolor' => 'secondaryColor',
                'accentcolor' => 'accentColor',
                'whatsappmessage' => 'whatsappMessage',
                'smtphost' => 'smtpHost',
                'smtpport' => 'smtpPort',
                'smtpencryption' => 'smtpEncryption',
                'smtpuser' => 'smtpUser',
                'smtppass' => 'smtpPass',
                'autoremindersenabled' => 'autoRemindersEnabled',
                'autoreminderdays' => 'autoReminderDays'
            ];
            $mappedAccount = [];
            foreach ($safeAccount as $key => $value) {
                if (isset($camelMap[$key])) {
                    $mappedAccount[$camelMap[$key]] = $value;
                } else {
                    $mappedAccount[$key] = $value;
                }
            }
            
            echo json_encode($mappedAccount);
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
            
            if (count($updates) > 0) {
                $params[] = $accountId;
                $sql = "UPDATE Account SET " . implode(', ', $updates) . " WHERE id = ?";
                $pdo->prepare($sql)->execute($params);
            }
            
            $stmt = $pdo->prepare("SELECT * FROM Account WHERE id = ?");
            $stmt->execute([$accountId]);
            $updatedAccount = $stmt->fetch();
            
            unset($updatedAccount['passwordhash'], $updatedAccount['passwordHash'], $updatedAccount['geminikey'], $updatedAccount['geminiKey']);
            if (!isset($newToken)) {
                unset($updatedAccount['token']);
            }
            
            $mappedUpdatedAccount = [];
            foreach ($updatedAccount as $key => $value) {
                if (isset($camelMap[$key])) {
                    $mappedUpdatedAccount[$camelMap[$key]] = $value;
                } else {
                    $mappedUpdatedAccount[$key] = $value;
                }
            }
            
            echo json_encode($mappedUpdatedAccount);
        }
    }
}
