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
            'smtppass' => 'smtpPass'
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

            foreach (['companyName', 'slogan', 'address', 'phone', 'website', 'taxId', 'bankName', 'bankAccount', 'logo', 'stamp', 'signature', 'primaryColor', 'secondaryColor', 'accentColor', 'whatsappMessage', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpEncryption', 'currency'] as $field) {
                if (array_key_exists($field, $body)) {
                    $updates[] = "$field = ?";
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

    public static function convertCurrency($pdo, $accountId, $body) {
        $rate = $body['rate'] ?? 1;
        if (!is_numeric($rate) || $rate <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Taux invalide"]);
            exit;
        }

        try {
            $pdo->beginTransaction();

            // CatalogItem
            $pdo->prepare("UPDATE CatalogItem SET price = price * ? WHERE accountId = ?")->execute([$rate, $accountId]);
            
            // ProformaInvoice (subtotal, taxAmount, discount, total)
            $pdo->prepare("UPDATE ProformaInvoice SET subtotal = subtotal * ?, taxAmount = taxAmount * ?, discount = discount * ?, total = total * ? WHERE accountId = ?")
                ->execute([$rate, $rate, $rate, $rate, $accountId]);

            // ProformaInvoice Items (JSON parsing in PHP for safety across dialects)
            $stmt = $pdo->prepare("SELECT id, items FROM ProformaInvoice WHERE accountId = ?");
            $stmt->execute([$accountId]);
            $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $updateItemsStmt = $pdo->prepare("UPDATE ProformaInvoice SET items = ? WHERE id = ? AND accountId = ?");
            foreach ($invoices as $inv) {
                if (!empty($inv['items'])) {
                    $itemsArr = json_decode($inv['items'], true);
                    if (is_array($itemsArr)) {
                        foreach ($itemsArr as &$item) {
                            if (isset($item['unitPrice'])) $item['unitPrice'] = (float)$item['unitPrice'] * $rate;
                            if (isset($item['total'])) $item['total'] = (float)$item['total'] * $rate;
                        }
                        $updateItemsStmt->execute([json_encode($itemsArr), $inv['id'], $accountId]);
                    }
                }
            }

            // Payment
            $pdo->prepare("UPDATE Payment SET amount = amount * ? WHERE accountId = ?")->execute([$rate, $accountId]);
                
            // Receipt
            $pdo->prepare("UPDATE Receipt SET amount = amount * ? WHERE accountId = ?")->execute([$rate, $accountId]);
            
            // Expense
            $pdo->prepare("UPDATE Expense SET amount = amount * ? WHERE accountId = ?")->execute([$rate, $accountId]);

            $pdo->commit();
            echo json_encode(["success" => true, "message" => "Devises mises à jour"]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["error" => "Erreur lors de la conversion : " . $e->getMessage()]);
        }
        exit;
    }
}
