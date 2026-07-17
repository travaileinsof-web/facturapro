<?php
class ClientController {
    public static function handle($pdo, $method, $id, $accountId, $body) {
        if ($method === 'GET') {
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM Client WHERE id = ? AND accountId = ?");
                $stmt->execute([$id, $accountId]);
                $c = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$c) { http_response_code(404); echo json_encode(["error" => "Client introuvable"]); exit; }
                
                $st1 = $pdo->prepare("SELECT * FROM ProformaInvoice WHERE accountId = ? AND clientId = ? ORDER BY createdAt DESC");
                $st1->execute([$accountId, $id]);
                $invoices = $st1->fetchAll(PDO::FETCH_ASSOC);
                
                $st2 = $pdo->prepare("SELECT * FROM Receipt WHERE accountId = ? AND clientId = ? ORDER BY createdAt DESC");
                $st2->execute([$accountId, $id]);
                $receipts = $st2->fetchAll(PDO::FETCH_ASSOC);
                
                $totalInvoiced = array_reduce($invoices, function($carry, $inv) { 
                    if ($inv['type'] !== 'facture' || $inv['status'] === 'brouillon' || $inv['status'] === 'annulée') return $carry;
                    $actual = (float)$inv['total'];
                    if (!empty($inv['vatWithholdingApplied']) && (float)$inv['taxAmount'] > 0) {
                        $actual -= ((float)$inv['taxAmount'] / 2);
                    }
                    return $carry + $actual;
                }, 0);
                $totalPaid = array_reduce($receipts, function($carry, $rec) { return $carry + (float)$rec['amount']; }, 0);
                
                foreach ($invoices as &$inv) {
                    $invReceipts = array_filter($receipts, function($r) use ($inv) { return $r['proformaInvoiceId'] === $inv['id']; });
                    $invPaid = array_reduce($invReceipts, function($carry, $rec) { return $carry + (float)$rec['amount']; }, 0);
                    $inv['amountPaid'] = $invPaid;

                    $actualTotal = (float)$inv['total'];
                    if (!empty($inv['vatWithholdingApplied']) && (float)$inv['taxAmount'] > 0) {
                        $actualTotal -= ((float)$inv['taxAmount'] / 2);
                    }
                    $inv['actualTotal'] = $actualTotal;
                    $inv['amountRemaining'] = max(0, $actualTotal - $invPaid);

                    if (in_array($inv['status'], ['brouillon', 'annulée'])) {
                        $inv['status'] = $inv['status'];
                    } elseif ($invPaid >= $actualTotal) {
                        $inv['status'] = 'payée';
                    } elseif ($invPaid > 0) {
                        $inv['status'] = 'partielle';
                    }
                    $inv['receipts'] = array_values($invReceipts);
                }
                
                $c['invoices'] = array_values($invoices);
                $c['receipts'] = $receipts;
                $c['totalInvoiced'] = $totalInvoiced;
                $c['totalPaid'] = $totalPaid;
                $c['totalRemaining'] = max(0, $totalInvoiced - $totalPaid);
                
                echo json_encode($c);
            } else {
                $q = $_GET['q'] ?? '';
                $sql = "SELECT c.*, 
                            COALESCE(i.invoiceCount, 0) as \"invoiceCount\",
                            COALESCE(i.totalInvoiced, 0) as \"totalInvoiced\",
                            COALESCE(r.totalPaid, 0) as \"totalPaid\",
                            GREATEST(0, COALESCE(i.totalInvoiced, 0) - COALESCE(r.totalPaid, 0)) as \"totalRemaining\"
                        FROM Client c
                        LEFT JOIN (
                            SELECT clientId, 
                                COUNT(id) as invoiceCount,
                                SUM(
                                    CASE WHEN \"vatWithholdingApplied\" = 1 AND taxAmount > 0 
                                    THEN total - (taxAmount / 2.0) 
                                    ELSE total END
                                ) as totalInvoiced
                            FROM ProformaInvoice 
                            WHERE accountId = :acc AND type = 'facture' AND status NOT IN ('brouillon', 'annulée')
                            GROUP BY clientId
                        ) i ON c.id = i.clientId
                        LEFT JOIN (
                            SELECT clientId, SUM(amount) as totalPaid
                            FROM Receipt
                            WHERE accountId = :acc
                            GROUP BY clientId
                        ) r ON c.id = r.clientId
                        WHERE c.accountId = :acc";
                
                if ($q) {
                    $sql .= " AND (c.name ILIKE :q OR c.email ILIKE :q OR c.phone ILIKE :q)";
                }
                $sql .= " ORDER BY c.createdAt DESC";
                
                $stmt = $pdo->prepare($sql);
                $params = [':acc' => $accountId];
                if ($q) $params[':q'] = "%$q%";
                $stmt->execute($params);
                
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
        } elseif ($method === 'POST') {
            $name = substr(Validator::sanitizeString($body['name'] ?? ''), 0, 255);
            if (empty($name)) {
                http_response_code(400); echo json_encode(["error" => "Le nom du client est requis."]); exit;
            }
            $email = substr(Validator::sanitizeEmail($body['email'] ?? null), 0, 255);
            $phone = substr(Validator::sanitizeString($body['phone'] ?? null), 0, 50);
            $address = Validator::sanitizeString($body['address'] ?? null);
            $city = substr(Validator::sanitizeString($body['city'] ?? null), 0, 100);
            $country = substr(Validator::sanitizeString($body['country'] ?? null), 0, 100);
            $notes = Validator::sanitizeString($body['notes'] ?? null);
            $clientType = substr(Validator::sanitizeString($body['clientType'] ?? 'professionnel'), 0, 50);
            $nif = substr(Validator::sanitizeString($body['nif'] ?? null), 0, 100);
            $rccm = substr(Validator::sanitizeString($body['rccm'] ?? null), 0, 100);

            $newId = Helper::uuid();
            $stmt = $pdo->prepare("INSERT INTO Client (id, accountId, name, email, phone, address, city, country, notes, \"clientType\", nif, rccm) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $newId, $accountId, $name, $email, $phone, 
                $address, $city, $country, $notes, $clientType, $nif, $rccm
            ]);
            $stmt = $pdo->prepare("SELECT * FROM Client WHERE id = ? AND accountId = ?");
            $stmt->execute([$newId, $accountId]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'PUT' && $id) {
            $name = substr(Validator::sanitizeString($body['name'] ?? ''), 0, 255);
            if (empty($name)) {
                http_response_code(400); echo json_encode(["error" => "Le nom du client est requis."]); exit;
            }
            $email = substr(Validator::sanitizeEmail($body['email'] ?? null), 0, 255);
            $phone = substr(Validator::sanitizeString($body['phone'] ?? null), 0, 50);
            $address = Validator::sanitizeString($body['address'] ?? null);
            $city = substr(Validator::sanitizeString($body['city'] ?? null), 0, 100);
            $country = substr(Validator::sanitizeString($body['country'] ?? null), 0, 100);
            $notes = Validator::sanitizeString($body['notes'] ?? null);
            $clientType = substr(Validator::sanitizeString($body['clientType'] ?? 'professionnel'), 0, 50);
            $nif = substr(Validator::sanitizeString($body['nif'] ?? null), 0, 100);
            $rccm = substr(Validator::sanitizeString($body['rccm'] ?? null), 0, 100);

            $stmt = $pdo->prepare("UPDATE Client SET name=?, email=?, phone=?, address=?, city=?, country=?, notes=?, \"clientType\"=?, nif=?, rccm=? WHERE id=? AND accountId=?");
            $stmt->execute([
                $name, $email, $phone, $address, $city, $country, 
                $notes, $clientType, $nif, $rccm, $id, $accountId
            ]);
            $stmt = $pdo->prepare("SELECT * FROM Client WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'DELETE' && $id) {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM ProformaInvoice WHERE clientId = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400); echo json_encode(["error" => "Impossible : le client a des factures ou devis liés"]); exit;
            }
            $stmt2 = $pdo->prepare("SELECT COUNT(*) FROM Receipt WHERE clientId = ? AND accountId = ?");
            $stmt2->execute([$id, $accountId]);
            if ($stmt2->fetchColumn() > 0) {
                http_response_code(400); echo json_encode(["error" => "Impossible : le client a des paiements (reçus) liés"]); exit;
            }
            $stmt = $pdo->prepare("DELETE FROM Client WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            echo json_encode(["success" => true]);
        }
    }
}
