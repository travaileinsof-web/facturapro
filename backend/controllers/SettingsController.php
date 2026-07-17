<?php
class SettingsController {
    public static function handle($pdo, $method, $accountId, $body, $currentAccount) {
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
            'legalform' => 'legalForm',
            'taxregime' => 'taxRegime',
            'defaultvatrate' => 'defaultVatRate'
        ];

        if ($method === 'GET') {
            $mappedAccount = [];
            foreach ($safeAccount as $key => $value) {
                if ($key === 'smtppass') {
                    $mappedAccount['smtpPassSet'] = !empty($value);
                    continue;
                }
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

            // Note : Le changement de devise ne s'applique qu'aux nouvelles factures et données.
            // L'historique financier n'est plus recalculé globalement pour préserver la cohérence légale.

            $strictFields = ['legalForm', 'taxRegime', 'defaultVatRate'];
            foreach (['companyName', 'slogan', 'address', 'phone', 'website', 'taxId', 'legalForm', 'rccm', 'taxRegime', 'defaultVatRate', 'bankName', 'bankAccount', 'logo', 'stamp', 'signature', 'primaryColor', 'secondaryColor', 'accentColor', 'whatsappMessage', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpEncryption', 'currency'] as $field) {
                if (array_key_exists($field, $body)) {
                    if (in_array($field, $strictFields)) {
                        $updates[] = "\"$field\" = ?";
                    } else {
                        $updates[] = "$field = ?";
                    }
                    $params[] = $body[$field];
                }
            }
            
            if (!empty($body['smtpPass'])) {
                $updates[] = "smtpPass = ?";
                $params[] = $body['smtpPass'];
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
                if ($key === 'smtppass') {
                    $mappedUpdatedAccount['smtpPassSet'] = !empty($value);
                    continue;
                }
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
