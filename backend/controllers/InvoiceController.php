<?php
class InvoiceController {
    public static function handle($pdo, $method, $id, $accountId, $body) {
        if ($method === 'GET') {
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM ProformaInvoice WHERE id = ? AND accountId = ?");
                $stmt->execute([$id, $accountId]);
                $inv = $stmt->fetch();
                if ($inv) {
                    $st = $pdo->prepare("SELECT * FROM Client WHERE id = ?");
                    $st->execute([$inv['clientId']]);
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
                    $inv['amountRemaining'] = max(0, (float)$inv['total'] - $amountPaid);
                    
                    // Deduce status dynamically if not fully paid but has receipts
                    if ($amountPaid >= (float)$inv['total']) {
                        $inv['status'] = 'payée';
                    } elseif ($amountPaid > 0) {
                        $inv['status'] = 'partielle';
                    } else {
                        $inv['status'] = 'brouillon'; // Ou 'envoyée' selon l'état d'origine, on simplifie à 'brouillon'
                    }
                }
                echo json_encode($inv);
            } else {
                $status = $_GET['status'] ?? 'toutes';
                $sql = "SELECT i.*, c.name as clientName FROM ProformaInvoice i LEFT JOIN Client c ON i.clientId = c.id WHERE i.accountId = :acc";
                if ($status !== 'toutes') { $sql .= " AND i.status = :s"; }
                $sql .= " ORDER BY i.issueDate DESC, i.number DESC";
                $stmt = $pdo->prepare($sql);
                $params = ['acc' => $accountId];
                if ($status !== 'toutes') $params['s'] = $status;
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
                    $inv['amountRemaining'] = max(0, (float)$inv['total'] - $amountPaid);
                    
                    // Deduce status dynamically if not fully paid but has receipts
                    if ($amountPaid >= (float)$inv['total']) {
                        $inv['status'] = 'payée';
                    } elseif ($amountPaid > 0) {
                        $inv['status'] = 'partielle';
                    } else {
                        $inv['status'] = 'brouillon';
                    }
                }
                echo json_encode($invs);
            }
        } elseif ($method === 'POST') {
            $newId = Helper::uuid();
            $type = $body['type'] ?? 'facture';
            $prefix = $type === 'devis' ? 'DEV' : ($type === 'proforma' ? 'PRO' : 'FAC');
            $today = date('Ymd');
            $stmt = $pdo->prepare("SELECT number FROM ProformaInvoice WHERE accountId = ? AND number LIKE ? ORDER BY number DESC LIMIT 1");
            $stmt->execute([$accountId, "$prefix-$today-%"]);
            $last = $stmt->fetchColumn();
            if ($last) {
                $parts = explode('-', $last);
                $seq = (int)end($parts) + 1;
            } else {
                $seq = 1;
            }
            $number = sprintf("%s-%s-%03d", $prefix, $today, $seq);

            $items = json_encode($body['items'] ?? []);
            $subtotal = 0;
            foreach ($body['items'] as $item) $subtotal += ($item['quantity'] * $item['unitPrice']);
            $taxAmount = $subtotal * (($body['taxRate']??0) / 100);
            $total = $subtotal + $taxAmount - ($body['discount']??0);

            $dueDate = empty($body['dueDate']) ? null : $body['dueDate'];
            $stmt = $pdo->prepare("INSERT INTO ProformaInvoice (id, accountId, number, clientId, items, subtotal, taxRate, taxAmount, discount, total, status, type, notes, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $newId, $accountId, $number, $body['clientId'], $items, $subtotal, $body['taxRate']??0, 
                $taxAmount, $body['discount']??0, $total, 'brouillon', $type, $body['notes']??null, $dueDate
            ]);
            $stmt = $pdo->prepare("SELECT * FROM ProformaInvoice WHERE id = ?");
            $stmt->execute([$newId]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'PUT' && $id) {
            $items = json_encode($body['items'] ?? []);
            $subtotal = 0;
            $decodedItems = is_array($body['items']) ? $body['items'] : [];
            foreach ($decodedItems as $item) $subtotal += ($item['quantity'] * $item['unitPrice']);
            $taxAmount = $subtotal * (($body['taxRate']??0) / 100);
            $total = $subtotal + $taxAmount - ($body['discount']??0);

            $newType = $body['type'] ?? 'facture';
            
            // On vérifie le statut et le type actuels
            $stCurr = $pdo->prepare("SELECT status, type, number FROM ProformaInvoice WHERE id = ? AND accountId = ?");
            $stCurr->execute([$id, $accountId]);
            $curr = $stCurr->fetch();
            $newStatus = $curr['status'] ?: 'brouillon';
            $currType = $curr['type'] ?: 'facture';
            $number = $curr['number'];

            if ($currType !== $newType && isset($body['type'])) {
                $prefix = $newType === 'devis' ? 'DEV' : ($newType === 'proforma' ? 'PRO' : 'FAC');
                $today = date('Ymd');
                $stmt = $pdo->prepare("SELECT number FROM ProformaInvoice WHERE accountId = ? AND number LIKE ? ORDER BY number DESC LIMIT 1");
                $stmt->execute([$accountId, "$prefix-$today-%"]);
                $last = $stmt->fetchColumn();
                if ($last) {
                    $parts = explode('-', $last);
                    $seq = (int)array_pop($parts) + 1;
                } else {
                    $seq = 1;
                }
                $number = sprintf("%s-%s-%03d", $prefix, $today, $seq);
            }

            if (isset($body['status'])) {
                $newStatus = $body['status'];
            }

            $dueDate = empty($body['dueDate']) ? null : $body['dueDate'];
            $stmt = $pdo->prepare("UPDATE ProformaInvoice SET clientId=?, items=?, subtotal=?, taxRate=?, taxAmount=?, discount=?, total=?, status=?, type=?, number=?, notes=?, dueDate=? WHERE id=? AND accountId=?");
            $stmt->execute([
                $body['clientId'], $items, $subtotal, $body['taxRate']??0, 
                $taxAmount, $body['discount']??0, $total, $newStatus, $newType, $number, $body['notes']??null, $dueDate,
                $id, $accountId
            ]);

            $stmt = $pdo->prepare("SELECT * FROM ProformaInvoice WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'DELETE' && $id) {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM Receipt WHERE proformaInvoiceId = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400); echo json_encode(["error" => "Impossible : reçus liés"]); exit;
            }
            $stmt = $pdo->prepare("DELETE FROM ProformaInvoice WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            echo json_encode(["success" => true]);
        }
    }
}
