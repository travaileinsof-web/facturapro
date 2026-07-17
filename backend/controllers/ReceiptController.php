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
                    $stC = $pdo->prepare("SELECT * FROM Client WHERE id = ? AND accountId = ?");
                    $stC->execute([$rec['clientId'], $accountId]);
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
                        $stI = $pdo->prepare("SELECT * FROM ProformaInvoice WHERE id = ? AND accountId = ?");
                        $stI->execute([$rec['proformaInvoiceId'], $accountId]);
                        $inv = $stI->fetch();
                        if ($inv) {
                            $stR = $pdo->prepare("SELECT SUM(amount) FROM Receipt WHERE proformaInvoiceId = ?");
                            $stR->execute([$inv['id']]);
                            $paid = (float)$stR->fetchColumn();
                            $inv['amountPaid'] = $paid;
                            
                            $actualTotal = (float)$inv['total'];
                            if (!empty($inv['vatWithholdingApplied']) && (float)$inv['taxAmount'] > 0) {
                                $actualTotal -= ((float)$inv['taxAmount'] / 2);
                            }
                            $inv['amountRemaining'] = max(0, $actualTotal - $paid);
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
            // FIX IDOR: Vérifier que le client appartient bien au compte
            if (empty($body['clientId'])) {
                http_response_code(400); echo json_encode(["error" => "Client manquant."]); exit;
            }
            $stC = $pdo->prepare("SELECT id FROM Client WHERE id = ? AND accountId = ?");
            $stC->execute([$body['clientId'], $accountId]);
            if (!$stC->fetch()) {
                http_response_code(403); echo json_encode(["error" => "Client introuvable ou accès refusé."]); exit;
            }

            // FIX IDOR: Vérifier que la facture appartient bien au compte
            if (!empty($body['proformaInvoiceId'])) {
                $stI = $pdo->prepare("SELECT id FROM ProformaInvoice WHERE id = ? AND accountId = ?");
                $stI->execute([$body['proformaInvoiceId'], $accountId]);
                if (!$stI->fetch()) {
                    http_response_code(403); echo json_encode(["error" => "Facture introuvable ou accès refusé."]); exit;
                }
            }

            $newId = Helper::uuid();
            
            $year = date('Y');
            $stmt = $pdo->prepare("SELECT number FROM Receipt WHERE accountId = ? AND number LIKE ? ORDER BY number DESC LIMIT 1");
            $stmt->execute([$accountId, "REC-$year-%"]);
            $last = $stmt->fetchColumn();
            if ($last) {
                $parts = explode('-', $last);
                $seq = (int)array_pop($parts) + 1;
            } else {
                $seq = 1;
            }
            $number = sprintf("REC-%s-%04d", $year, $seq);

            $invId = $body['proformaInvoiceId']??null;
            $paymentDate = (empty($body['paymentDate']) || !strtotime($body['paymentDate'])) ? date('Y-m-d H:i:s') : date('Y-m-d H:i:s', strtotime($body['paymentDate']));
            $receivedBy = substr(Validator::sanitizeString($body['receivedBy'] ?? null), 0, 250);
            $paymentMethod = substr(Validator::sanitizeString($body['paymentMethod'] ?? null), 0, 50);
            $amount = (float)($body['amount'] ?? 0);
            
            $stmt = $pdo->prepare("INSERT INTO Receipt (id, accountId, number, proformaInvoiceId, clientId, amount, paymentMethod, paymentDate, notes, \"receivedBy\") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $newId, $accountId, $number, $invId, $body['clientId'], $amount,
                $paymentMethod, $paymentDate, $body['notes']??null, $receivedBy
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
