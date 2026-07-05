<?php
class ReceiptController {
    public static function handle($pdo, $method, $id, $accountId, $body) {
        if ($method === 'GET') {
            if ($id) {
                $sql = "SELECT * FROM Receipt WHERE id = ? AND accountId = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$id, $accountId]);
                $rec = $stmt->fetch();
                if ($rec) {
                    // Fetch full Client
                    $stC = $pdo->prepare("SELECT * FROM Client WHERE id = ?");
                    $stC->execute([$rec['clientId']]);
                    $rec['client'] = $stC->fetch();
                    
                    if (!empty($rec['companyId'])) {
                        $stComp = $pdo->prepare("SELECT * FROM Company WHERE id = ? AND accountId = ?");
                        $stComp->execute([$rec['companyId'], $accountId]);
                        $company = $stComp->fetch(PDO::FETCH_ASSOC);
                        if ($company) {
                            unset($company['smtpPass']); // Mask password
                            $rec['company'] = $company;
                        }
                    }
                    
                    // Fetch full Invoice and compute paid/remaining
                    if ($rec['proformaInvoiceId']) {
                        $stI = $pdo->prepare("SELECT * FROM ProformaInvoice WHERE id = ?");
                        $stI->execute([$rec['proformaInvoiceId']]);
                        $inv = $stI->fetch();
                        if ($inv) {
                            $stR = $pdo->prepare("SELECT SUM(amount) FROM Receipt WHERE proformaInvoiceId = ?");
                            $stR->execute([$inv['id']]);
                            $paid = (float)$stR->fetchColumn();
                            $inv['amountPaid'] = $paid;
                            $inv['amountRemaining'] = max(0, (float)$inv['total'] - $paid);
                            $inv['items'] = json_decode($inv['items'], true);
                            $rec['invoice'] = $inv;
                        }
                    }
                }
                echo json_encode($rec);
            } else {
                $sql = "SELECT r.*, c.name as clientName, i.number as invoiceNumber FROM Receipt r LEFT JOIN Client c ON r.clientId = c.id LEFT JOIN ProformaInvoice i ON r.proformaInvoiceId = i.id WHERE r.accountId = ? ORDER BY r.paymentDate DESC, r.number DESC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$accountId]);
                $receipts = $stmt->fetchAll();
                foreach ($receipts as &$rec) {
                    $rec['client'] = ['id' => $rec['clientId'], 'name' => $rec['clientName']];
                }
                echo json_encode($receipts);
            }
        } elseif ($method === 'POST') {
            $newId = Helper::uuid();
            
            $today = date('Ymd');
            $stmt = $pdo->prepare("SELECT number FROM Receipt WHERE accountId = ? AND number LIKE ? ORDER BY number DESC LIMIT 1");
            $stmt->execute([$accountId, "REC-$today-%"]);
            $last = $stmt->fetchColumn();
            $seq = $last ? (int)array_pop(explode('-', $last)) + 1 : 1;
            $number = sprintf("REC-%s-%03d", $today, $seq);

            $invId = $body['proformaInvoiceId']??null;
            $paymentDate = empty($body['paymentDate']) ? date('Y-m-d H:i:s') : $body['paymentDate'];
            $stmt = $pdo->prepare("INSERT INTO Receipt (id, accountId, number, proformaInvoiceId, clientId, amount, paymentMethod, paymentDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $newId, $accountId, $number, $invId, $body['clientId'], $body['amount'],
                $body['paymentMethod']??null, $paymentDate, $body['notes']??null
            ]);
            
            if ($invId) {
                Helper::recalculerStatutFacture($pdo, $invId, $accountId);
            }
            
            echo json_encode(["id" => $newId]);
        } elseif ($method === 'DELETE' && $id) {
            $stmt = $pdo->prepare("SELECT proformaInvoiceId FROM Receipt WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            $invId = $stmt->fetchColumn();

            $stmt = $pdo->prepare("DELETE FROM Receipt WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            
            if ($invId) {
                Helper::recalculerStatutFacture($pdo, $invId, $accountId);
            }

            echo json_encode(["success" => true]);
        }
    }
}
