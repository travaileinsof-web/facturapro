<?php
class InvoiceController {
    public static function handle($pdo, $method, $id, $accountId, $body, $subAction = null) {
        if ($method === 'GET') {
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM ProformaInvoice WHERE id = ? AND accountId = ?");
                $stmt->execute([$id, $accountId]);
                $inv = $stmt->fetch();
                if ($inv) {
                    $st = $pdo->prepare("SELECT * FROM Client WHERE id = ? AND accountId = ?");
                    $st->execute([$inv['clientId'], $accountId]);
                    $inv['client'] = $st->fetch();
                    
                    if (!empty($inv['companyId'])) {
                        $stC = $pdo->prepare("SELECT * FROM Company WHERE id = ? AND accountId = ?");
                        $stC->execute([$inv['companyId'], $accountId]);
                        $company = $stC->fetch(PDO::FETCH_ASSOC);
                        if ($company) {
                            unset($company['smtpPass']); // Mask password
                            $inv['company'] = $company;
                        }
                    }
                    
                    $st2 = $pdo->prepare("SELECT * FROM Receipt WHERE proformaInvoiceId = ? AND accountId = ?");
                    $st2->execute([$inv['id'], $accountId]);
                    $receipts = $st2->fetchAll();
                    $inv['receipts'] = $receipts;
                    
                    $amountPaid = array_reduce($receipts, function($carry, $item) { return $carry + (float)$item['amount']; }, 0);
                    $inv['amountPaid'] = $amountPaid;
                    
                    $actualTotal = (float)$inv['total'];
                    if (!empty($inv['vatWithholdingApplied']) && (float)$inv['taxAmount'] > 0) {
                        $actualTotal -= ((float)$inv['taxAmount'] / 2);
                    }
                    $inv['amountRemaining'] = max(0, $actualTotal - $amountPaid);
                    
                    $inv['amountRemaining'] = max(0, $actualTotal - $amountPaid);
                }
                echo json_encode($inv);
            } else {
                $status = $_GET['status'] ?? 'toutes';
                $sql = "SELECT i.*, c.name as clientName FROM ProformaInvoice i LEFT JOIN Client c ON i.clientId = c.id WHERE i.accountId = :acc";
                
                if ($status === 'impayee') {
                    $sql .= " AND i.status != 'annulée' AND i.type != 'devis' AND (GREATEST(0, (CASE WHEN i.\"vatWithholdingApplied\" = 1 AND i.taxAmount > 0 THEN i.total - (i.taxAmount / 2.0) ELSE i.total END) - COALESCE((SELECT SUM(amount) FROM Receipt WHERE proformaInvoiceId = i.id AND accountId = :acc), 0))) > 0";
                } elseif ($status !== 'toutes') { 
                    $sql .= " AND i.status = :s"; 
                }
                
                $sql .= " ORDER BY i.issueDate DESC, i.number DESC";
                $stmt = $pdo->prepare($sql);
                $params = ['acc' => $accountId];
                if ($status !== 'toutes' && $status !== 'impayee') $params['s'] = $status;
                $stmt->execute($params);
                
                $invs = $stmt->fetchAll();
                foreach ($invs as &$inv) {
                    $inv['client'] = ['id' => $inv['clientId'], 'name' => $inv['clientName']];
                    $st = $pdo->prepare("SELECT * FROM Receipt WHERE proformaInvoiceId = ? AND accountId = ?");
                    $st->execute([$inv['id'], $accountId]);
                    $receipts = $st->fetchAll();
                    $inv['receipts'] = $receipts;
                    
                    $amountPaid = array_reduce($receipts, function($carry, $item) { return $carry + (float)$item['amount']; }, 0);
                    $inv['amountPaid'] = $amountPaid;

                    $actualTotal = (float)$inv['total'];
                    if (!empty($inv['vatWithholdingApplied']) && (float)$inv['taxAmount'] > 0) {
                        $actualTotal -= ((float)$inv['taxAmount'] / 2);
                    }
                    $inv['amountRemaining'] = max(0, $actualTotal - $amountPaid);
                    
                    $inv['amountRemaining'] = max(0, $actualTotal - $amountPaid);
                }
                echo json_encode($invs);
            }
        } elseif ($method === 'POST') {
            if ($id && $subAction === 'remind') {
                $stmt = $pdo->prepare("SELECT id FROM ProformaInvoice WHERE id = ? AND accountId = ?");
                $stmt->execute([$id, $accountId]);
                if (!$stmt->fetch()) {
                    http_response_code(404); echo json_encode(["error" => "Facture introuvable."]); exit;
                }
                
                try {
                    $pdo->beginTransaction();
                    $pdo->prepare("UPDATE ProformaInvoice SET lastReminderDate = CURRENT_TIMESTAMP WHERE id = ?")->execute([$id]);
                    $methodType = Validator::sanitizeString($body['method'] ?? 'email');
                    $logId = Helper::uuid();
                    $pdo->prepare("INSERT INTO InvoiceReminderLog (id, accountId, invoiceId, method) VALUES (?, ?, ?, ?)")
                        ->execute([$logId, $accountId, $id, $methodType]);
                    $pdo->commit();
                    echo json_encode(["success" => true]);
                } catch (Exception $e) {
                    if ($pdo->inTransaction()) $pdo->rollBack();
                    http_response_code(500); echo json_encode(["error" => "Erreur lors de l'enregistrement de la relance."]);
                }
                exit;
            }

            // FIX IDOR: Vérifier que le client appartient bien au compte
            if (empty($body['clientId'])) {
                http_response_code(400); echo json_encode(["error" => "Client manquant."]); exit;
            }
            $stC = $pdo->prepare("SELECT id FROM Client WHERE id = ? AND accountId = ?");
            $stC->execute([$body['clientId'], $accountId]);
            if (!$stC->fetch()) {
                http_response_code(403); echo json_encode(["error" => "Client introuvable ou accès refusé."]); exit;
            }

            $newId = Helper::uuid();
            $type = $body['type'] ?? 'facture';
            if (!in_array($type, ['facture', 'devis', 'proforma'])) $type = 'facture';
            $prefix = $type === 'devis' ? 'DEV' : ($type === 'proforma' ? 'PF' : 'FAC');
            $year = date('Y');
            $stmt = $pdo->prepare("SELECT number FROM ProformaInvoice WHERE accountId = ? AND number LIKE ? ORDER BY number DESC LIMIT 1");
            $stmt->execute([$accountId, "$prefix-$year-%"]);
            $last = $stmt->fetchColumn();
            if ($last) {
                $parts = explode('-', $last);
                $seq = (int)end($parts) + 1;
            } else {
                $seq = 1;
            }
            $number = sprintf("%s-%s-%04d", $prefix, $year, $seq);

            $sanitizedItems = Validator::sanitizeArray($body['items'] ?? []);
            $items = json_encode($sanitizedItems);
            $subtotal = 0;
            foreach ($sanitizedItems as $item) $subtotal += ((float)($item['quantity'] ?? 0) * (float)($item['unitPrice'] ?? 0));
            $taxRate = (float)($body['taxRate'] ?? 0);
            $taxAmount = $subtotal * ($taxRate / 100);
            $discount = (float)($body['discount'] ?? 0);
            $total = $subtotal + $taxAmount - $discount;
            $notes = Validator::sanitizeString($body['notes'] ?? null);
            $type = Validator::sanitizeString($type);

            $dueDate = (empty($body['dueDate']) || !strtotime($body['dueDate'])) ? null : date('Y-m-d H:i:s', strtotime($body['dueDate']));
            $validityDate = (empty($body['validityDate']) || !strtotime($body['validityDate'])) ? null : date('Y-m-d H:i:s', strtotime($body['validityDate']));
            $paymentTerms = substr(Validator::sanitizeString($body['paymentTerms'] ?? null), 0, 250);
            $vatWithholdingApplied = !empty($body['vatWithholdingApplied']) ? 1 : 0;
            $vatExemptReason = substr(Validator::sanitizeString($body['vatExemptReason'] ?? null), 0, 250);
            $sourceDocumentId = !empty($body['sourceDocumentId']) ? substr(Validator::sanitizeString($body['sourceDocumentId']), 0, 50) : null;

            $stmt = $pdo->prepare("INSERT INTO ProformaInvoice (id, accountId, number, clientId, items, subtotal, taxRate, taxAmount, discount, total, status, type, notes, dueDate, \"validityDate\", \"paymentTerms\", \"vatWithholdingApplied\", \"vatExemptReason\", \"sourceDocumentId\") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $newId, $accountId, $number, $body['clientId'], $items, $subtotal, $taxRate, 
                $taxAmount, $discount, $total, 'brouillon', $type, $notes, $dueDate,
                $validityDate, $paymentTerms, $vatWithholdingApplied, $vatExemptReason, $sourceDocumentId
            ]);
            $stmt = $pdo->prepare("SELECT * FROM ProformaInvoice WHERE id = ? AND accountId = ?");
            $stmt->execute([$newId, $accountId]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'PUT' && $id) {
            // FIX IDOR: Vérifier que le client appartient bien au compte
            if (!empty($body['clientId'])) {
                $stC = $pdo->prepare("SELECT id FROM Client WHERE id = ? AND accountId = ?");
                $stC->execute([$body['clientId'], $accountId]);
                if (!$stC->fetch()) {
                    http_response_code(403); echo json_encode(["error" => "Client introuvable ou accès refusé."]); exit;
                }
            }

            $rawItems = $body['items'] ?? [];
            if (is_string($rawItems)) {
                $decoded = json_decode($rawItems, true);
                if (is_array($decoded)) {
                    $rawItems = $decoded;
                } else {
                    $rawItems = [];
                }
            }
            $sanitizedItems = Validator::sanitizeArray(is_array($rawItems) ? $rawItems : []);
            $items = json_encode($sanitizedItems);
            $subtotal = 0;
            foreach ($sanitizedItems as $item) $subtotal += ((float)($item['quantity'] ?? 0) * (float)($item['unitPrice'] ?? 0));
            $taxRate = (float)($body['taxRate'] ?? 0);
            $taxAmount = $subtotal * ($taxRate / 100);
            $discount = (float)($body['discount'] ?? 0);
            $total = $subtotal + $taxAmount - $discount;

            $newType = $body['type'] ?? 'facture';
            if (!in_array($newType, ['facture', 'devis', 'proforma'])) $newType = 'facture';
            
            // On vérifie le statut et le type actuels
            $stCurr = $pdo->prepare("SELECT status, type, number, lastReminderDate FROM ProformaInvoice WHERE id = ? AND accountId = ?");
            $stCurr->execute([$id, $accountId]);
            $curr = $stCurr->fetch();
            $newStatus = $curr['status'] ?: 'brouillon';
            $currType = $curr['type'] ?: 'facture';
            $number = $curr['number'];

            if ($currType !== $newType && isset($body['type'])) {
                $prefix = $newType === 'devis' ? 'DEV' : ($newType === 'proforma' ? 'PF' : 'FAC');
                $year = date('Y');
                $stmt = $pdo->prepare("SELECT number FROM ProformaInvoice WHERE accountId = ? AND number LIKE ? ORDER BY number DESC LIMIT 1");
                $stmt->execute([$accountId, "$prefix-$year-%"]);
                $last = $stmt->fetchColumn();
                if ($last) {
                    $parts = explode('-', $last);
                    $seq = (int)array_pop($parts) + 1;
                } else {
                    $seq = 1;
                }
                $number = sprintf("%s-%s-%04d", $prefix, $year, $seq);
            }

            if (isset($body['status'])) {
                $newStatus = $body['status'];
            }

            $notes = Validator::sanitizeString($body['notes'] ?? null);
            $dueDate = (empty($body['dueDate']) || !strtotime($body['dueDate'])) ? null : date('Y-m-d H:i:s', strtotime($body['dueDate']));
            
            $lastReminderDate = isset($body['lastReminderDate']) ? ((empty($body['lastReminderDate']) || !strtotime($body['lastReminderDate'])) ? null : date('Y-m-d H:i:s', strtotime($body['lastReminderDate']))) : $curr['lastReminderDate'];

            $validityDate = (empty($body['validityDate']) || !strtotime($body['validityDate'])) ? null : date('Y-m-d H:i:s', strtotime($body['validityDate']));
            $paymentTerms = substr(Validator::sanitizeString($body['paymentTerms'] ?? null), 0, 250);
            $vatWithholdingApplied = isset($body['vatWithholdingApplied']) ? ($body['vatWithholdingApplied'] ? 1 : 0) : 0;
            $vatExemptReason = substr(Validator::sanitizeString($body['vatExemptReason'] ?? null), 0, 250);
            $sourceDocumentId = substr(Validator::sanitizeString($body['sourceDocumentId'] ?? null), 0, 50);
            
            $stmt = $pdo->prepare("UPDATE ProformaInvoice SET clientId=?, items=?, subtotal=?, taxRate=?, taxAmount=?, discount=?, total=?, status=?, type=?, number=?, notes=?, dueDate=?, lastReminderDate=?, \"validityDate\"=?, \"paymentTerms\"=?, \"vatWithholdingApplied\"=?, \"vatExemptReason\"=?, \"sourceDocumentId\"=?, updatedAt=CURRENT_TIMESTAMP WHERE id=? AND accountId=?");
            $stmt->execute([
                $body['clientId'], $items, $subtotal, $taxRate, 
                $taxAmount, $discount, $total, $newStatus, $newType, $number, $notes, $dueDate, $lastReminderDate,
                $validityDate, $paymentTerms, $vatWithholdingApplied, $vatExemptReason, $sourceDocumentId,
                $id, $accountId
            ]);

            $stmt = $pdo->prepare("SELECT * FROM ProformaInvoice WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'DELETE' && $id) {
            // Suppression en cascade : Relances de cette facture
            $stmt = $pdo->prepare("DELETE FROM InvoiceReminderLog WHERE invoiceId = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);

            // Suppression en cascade : Reçus de cette facture
            $stmt = $pdo->prepare("DELETE FROM Receipt WHERE proformaInvoiceId = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            $stmt = $pdo->prepare("DELETE FROM ProformaInvoice WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            echo json_encode(["success" => true]);
        }
    }
}
