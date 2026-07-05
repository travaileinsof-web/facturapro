<?php
class CompanyController {
    public static function handle($pdo, $method, $accountId, $body, $segments) {
        $companyId = $segments[1] ?? null;

        if ($method === 'GET') {
            if ($companyId) {
                // GET /api/companies/{id}
                $stmt = $pdo->prepare("SELECT * FROM Company WHERE id = ? AND accountId = ?");
                $stmt->execute([$companyId, $accountId]);
                $company = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$company) { http_response_code(404); echo json_encode(['error' => 'Not found']); return; }
                self::maskPass($company);
                echo json_encode($company);
            } else {
                // GET /api/companies
                $stmt = $pdo->prepare("SELECT * FROM Company WHERE accountId = ? ORDER BY isDefault DESC, createdAt ASC");
                $stmt->execute([$accountId]);
                $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($companies as &$c) self::maskPass($c);
                echo json_encode($companies);
            }
        }

        elseif ($method === 'POST') {
            // POST /api/companies — create new company
            if (empty($body['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Le nom de l\'entreprise est requis.']);
                return;
            }

            // Check limit (max 5 companies per account)
            $count = $pdo->prepare("SELECT COUNT(*) FROM Company WHERE accountId = ?");
            $count->execute([$accountId]);
            if ($count->fetchColumn() >= 5) {
                http_response_code(403);
                echo json_encode(['error' => 'Maximum 5 entreprises par compte.']);
                return;
            }

            $id = bin2hex(random_bytes(8));
            $stmt = $pdo->prepare("INSERT INTO Company (id, accountId, isDefault, name, slogan, address, phone, email, website, taxId, bankName, bankAccount, logo, stamp, signature, primaryColor, currency, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, smtpFromName) VALUES (?,?,0,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $id, $accountId,
                $body['name'],
                $body['slogan'] ?? null,
                $body['address'] ?? null,
                $body['phone'] ?? null,
                $body['email'] ?? null,
                $body['website'] ?? null,
                $body['taxId'] ?? null,
                $body['bankName'] ?? null,
                $body['bankAccount'] ?? null,
                $body['logo'] ?? null,
                $body['stamp'] ?? null,
                $body['signature'] ?? null,
                $body['primaryColor'] ?? '#0f172a',
                $body['currency'] ?? 'XOF',
                $body['smtpHost'] ?? null,
                $body['smtpPort'] ?? null,
                $body['smtpUser'] ?? null,
                !empty($body['smtpPass']) ? $body['smtpPass'] : null,
                $body['smtpFrom'] ?? null,
                $body['smtpFromName'] ?? null,
            ]);

            $stmt2 = $pdo->prepare("SELECT * FROM Company WHERE id = ?");
            $stmt2->execute([$id]);
            $company = $stmt2->fetch(PDO::FETCH_ASSOC);
            self::maskPass($company);
            echo json_encode($company);
        }

        elseif ($method === 'PUT') {
            if (!$companyId) { http_response_code(400); echo json_encode(['error' => 'ID requis']); return; }

            // Check ownership
            $owns = $pdo->prepare("SELECT id FROM Company WHERE id = ? AND accountId = ?");
            $owns->execute([$companyId, $accountId]);
            if (!$owns->fetch()) { http_response_code(403); echo json_encode(['error' => 'Accès refusé']); return; }

            // Handle set-default action
            if (isset($body['setDefault']) && $body['setDefault']) {
                $pdo->prepare("UPDATE Company SET isDefault = 0 WHERE accountId = ?")->execute([$accountId]);
                $pdo->prepare("UPDATE Company SET isDefault = 1 WHERE id = ?")->execute([$companyId]);
                $pdo->prepare("UPDATE Account SET activeCompanyId = ? WHERE id = ?")->execute([$companyId, $accountId]);
                echo json_encode(['success' => true]);
                return;
            }

            $updates = [];
            $params = [];
            $fields = ['name','slogan','address','phone','email','website','taxId','bankName','bankAccount','logo','stamp','signature','primaryColor','currency','smtpHost','smtpPort','smtpUser','smtpFrom','smtpFromName'];
            foreach ($fields as $f) {
                if (array_key_exists($f, $body)) {
                    $updates[] = "$f = ?";
                    $params[] = $body[$f];
                }
            }
            // Only update password if provided and non-empty
            if (!empty($body['smtpPass'])) {
                $updates[] = "smtpPass = ?";
                $params[] = $body['smtpPass'];
            }
            $updates[] = "updatedAt = CURRENT_TIMESTAMP";

            if ($updates) {
                $params[] = $companyId;
                $pdo->prepare("UPDATE Company SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);
            }

            $stmt = $pdo->prepare("SELECT * FROM Company WHERE id = ?");
            $stmt->execute([$companyId]);
            $company = $stmt->fetch(PDO::FETCH_ASSOC);
            self::maskPass($company);
            echo json_encode($company);
        }

        elseif ($method === 'DELETE') {
            if (!$companyId) { http_response_code(400); echo json_encode(['error' => 'ID requis']); return; }

            $owns = $pdo->prepare("SELECT * FROM Company WHERE id = ? AND accountId = ?");
            $owns->execute([$companyId, $accountId]);
            $company = $owns->fetch();
            if (!$company) { http_response_code(403); echo json_encode(['error' => 'Accès refusé']); return; }

            if ($company['isDefault']) {
                http_response_code(400);
                echo json_encode(['error' => 'Impossible de supprimer l\'entreprise par défaut. Définissez une autre comme principale d\'abord.']);
                return;
            }

            $pdo->prepare("DELETE FROM Company WHERE id = ?")->execute([$companyId]);
            echo json_encode(['success' => true]);
        }
    }

    private static function maskPass(&$company) {
        if (!empty($company['smtpPass'])) {
            $company['smtpPassSet'] = true;
            $company['smtpPass'] = '';
        } else {
            $company['smtpPassSet'] = false;
        }
    }
}
