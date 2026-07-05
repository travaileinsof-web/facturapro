<?php
class ClientController {
    public static function handle($pdo, $method, $id, $accountId, $body) {
        if ($method === 'GET') {
            $q = $_GET['q'] ?? '';
            if ($q) {
                $stmt = $pdo->prepare("SELECT * FROM Client WHERE accountId = ? AND (name LIKE ? OR email LIKE ? OR phone LIKE ?) ORDER BY createdAt DESC");
                $stmt->execute([$accountId, "%$q%", "%$q%", "%$q%"]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM Client WHERE accountId = ? ORDER BY createdAt DESC");
                $stmt->execute([$accountId]);
            }
            $clients = $stmt->fetchAll();
            foreach($clients as &$c) {
                $st1 = $pdo->prepare("SELECT * FROM ProformaInvoice WHERE clientId = ? AND accountId = ? ORDER BY createdAt DESC");
                $st1->execute([$c['id'], $accountId]);
                $invoices = $st1->fetchAll();
                
                $st2 = $pdo->prepare("SELECT * FROM Receipt WHERE clientId = ? AND accountId = ? ORDER BY createdAt DESC");
                $st2->execute([$c['id'], $accountId]);
                $receipts = $st2->fetchAll();
                
                $totalInvoiced = array_reduce($invoices, function($carry, $inv) { return $carry + (float)$inv['total']; }, 0);
                $totalPaid = array_reduce($receipts, function($carry, $rec) { return $carry + (float)$rec['amount']; }, 0);
                
                // Mettre à jour les factures du client avec le même niveau de détail
                foreach ($invoices as &$inv) {
                    $invReceipts = array_filter($receipts, function($r) use ($inv) { return $r['proformaInvoiceId'] === $inv['id']; });
                    $invPaid = array_reduce($invReceipts, function($carry, $rec) { return $carry + (float)$rec['amount']; }, 0);
                    $inv['amountPaid'] = $invPaid;
                    $inv['amountRemaining'] = max(0, (float)$inv['total'] - $invPaid);
                    if ($invPaid >= (float)$inv['total']) $inv['status'] = 'payée';
                    elseif ($invPaid > 0) $inv['status'] = 'partielle';
                    else $inv['status'] = 'brouillon';
                    $inv['receipts'] = array_values($invReceipts);
                }
                
                $c['invoices'] = array_values($invoices); // re-indexer
                $c['receipts'] = $receipts;
                $c['totalInvoiced'] = $totalInvoiced;
                $c['totalPaid'] = $totalPaid;
                $c['totalRemaining'] = max(0, $totalInvoiced - $totalPaid);
            }
            echo json_encode($clients);
        } elseif ($method === 'POST') {
            $newId = Helper::uuid();
            $stmt = $pdo->prepare("INSERT INTO Client (id, accountId, name, email, phone, address, city, country, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $newId, $accountId, $body['name'], $body['email']??null, $body['phone']??null, 
                $body['address']??null, $body['city']??null, $body['country']??null, $body['notes']??null
            ]);
            $stmt = $pdo->prepare("SELECT * FROM Client WHERE id = ?");
            $stmt->execute([$newId]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'PUT' && $id) {
            $stmt = $pdo->prepare("UPDATE Client SET name=?, email=?, phone=?, address=?, city=?, country=?, notes=? WHERE id=? AND accountId=?");
            $stmt->execute([
                $body['name'], $body['email']??null, $body['phone']??null, 
                $body['address']??null, $body['city']??null, $body['country']??null, $body['notes']??null, $id, $accountId
            ]);
            $stmt = $pdo->prepare("SELECT * FROM Client WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'DELETE' && $id) {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM ProformaInvoice WHERE clientId = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400); echo json_encode(["error" => "Impossible : le client a des factures"]); exit;
            }
            $stmt = $pdo->prepare("DELETE FROM Client WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            echo json_encode(["success" => true]);
        }
    }
}
