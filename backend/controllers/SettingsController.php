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
            $pdo->beginTransaction();
            try {
                $updates = [];
                $params = [];

                if (!empty($body['password'])) {
                    $hash = $currentAccount['passwordHash'] ?? $currentAccount['passwordhash'] ?? '';
                    if (empty($body['currentPassword']) || !password_verify($body['currentPassword'], $hash)) {
                        $pdo->rollBack();
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



                // Colonnes avec noms insensibles à la casse (PostgreSQL minuscules automatiquement)
                $regularFields = ['companyName', 'slogan', 'address', 'phone', 'website', 'taxId', 'rccm',
                    'bankName', 'bankAccount', 'logo', 'stamp', 'signature',
                    'primaryColor', 'secondaryColor', 'accentColor', 'whatsappMessage'];

                // Colonnes créées avec guillemets → case-sensitive → doivent être quotées dans UPDATE
                $quotedFields = [
                    'legalForm'     => '"legalForm"',
                    'taxRegime'     => '"taxRegime"',
                    'defaultVatRate' => '"defaultVatRate"',
                ];

                $numericFields = ['defaultVatRate'];

                foreach ($regularFields as $field) {
                    if (array_key_exists($field, $body)) {
                        $updates[] = "$field = ?";
                        $params[] = $body[$field];
                    }
                }
                foreach ($quotedFields as $field => $quotedCol) {
                    if (array_key_exists($field, $body)) {
                        $value = $body[$field];
                        if (in_array($field, $numericFields)) {
                            $value = ($value !== null && $value !== '') ? (float)$value : null;
                        }
                        $updates[] = "$quotedCol = ?";
                        $params[] = $value;
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
                    if ($key === 'smtppass') {
                        $mappedUpdatedAccount['smtpPassSet'] = !empty($value);
                        continue;
                    }
                    if (isset($camelMap[$key])) {
                        $mappedUpdatedAccount[$camelMap[$key]] = $value;
                    } else {
                        // currency, slogan, address, phone, website, rccm, etc.
                        // Ces colonnes ont le même nom en DB et en JSON → pas de mapping nécessaire
                        $mappedUpdatedAccount[$key] = $value;
                    }
                }

                // ✅ FIX : S'assurer que la devise est bien présente dans la réponse
                // pour que le store Zustand frontend se mette à jour immédiatement
                if (!isset($mappedUpdatedAccount['currency'])) {
                    $mappedUpdatedAccount['currency'] = $updatedAccount['currency'] ?? 'GNF';
                }

                $pdo->commit();
                echo json_encode($mappedUpdatedAccount);
            } catch (Exception $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                http_response_code(500);
                // On envoie le message d'erreur réel pour faciliter le debug
                echo json_encode(["error" => $e->getMessage(), "detail" => "settings_update_failed"]);
            }
        }
    }
}
