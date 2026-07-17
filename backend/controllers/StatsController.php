<?php
class StatsController {
    // Cache TTL en secondes (60s = données fraîches mais réponse instantanée)
    private static $CACHE_TTL = 60;

    private static function getCachePath($accountId, $startDate, $endDate) {
        $key = md5($accountId . $startDate . $endDate);
        $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'fp_stats_cache';
        if (!is_dir($dir)) @mkdir($dir, 0755, true);
        return $dir . DIRECTORY_SEPARATOR . $key . '.json';
    }

    public static function handle($pdo, $method, $accountId) {
        if ($method === 'GET') {
            $startDate = $_GET['startDate'] ?? date('Y-m-01 00:00:00');
            $endDate   = $_GET['endDate']   ?? date('Y-m-t 23:59:59');

            // =====================================================
            // CACHE: retourne les données en cache si < 60s
            // =====================================================
            $cachePath = self::getCachePath($accountId, $startDate, $endDate);
            if (file_exists($cachePath) && (time() - filemtime($cachePath)) < self::$CACHE_TTL) {
                $cached = file_get_contents($cachePath);
                if ($cached !== false) {
                    header('X-Cache: HIT');
                    echo $cached;
                    return;
                }
            }
            header('X-Cache: MISS');

            // =====================================================
            // 1. Total Encaissé (période)
            // =====================================================
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM Receipt WHERE accountId = ? AND paymentDate >= ? AND paymentDate <= ?");
            $stmt->execute([$accountId, $startDate, $endDate]);
            $encaisse = round((float)$stmt->fetchColumn());

            // =====================================================
            // 2. Dépenses (période)
            // =====================================================
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM Expense WHERE accountId = ? AND expenseDate >= ? AND expenseDate <= ?");
            $stmt->execute([$accountId, $startDate, $endDate]);
            $expenses = round((float)$stmt->fetchColumn());

            // =====================================================
            // 3. Bénéfice Net
            // =====================================================
            $netProfit = $encaisse - $expenses;

            // =====================================================
            // 4. CA Potentiel + Créances — UNE SEULE REQUETE avec LEFT JOIN
            //    Remplace les 2 sous-requêtes corrélées (O(n)) par un JOIN groupé (O(1))
            // =====================================================
            $stmt = $pdo->prepare("
                SELECT
                    COALESCE(SUM(
                        GREATEST(0, CASE WHEN i.\"vatWithholdingApplied\" = 1 AND i.taxAmount > 0
                            THEN i.total - (i.taxAmount / 2.0)
                            ELSE i.total END)
                    ), 0) AS potentiel,
                    COALESCE(SUM(
                        GREATEST(0,
                            CASE WHEN i.\"vatWithholdingApplied\" = 1 AND i.taxAmount > 0
                                THEN i.total - (i.taxAmount / 2.0)
                                ELSE i.total END
                            - COALESCE(r.paid, 0)
                        )
                    ), 0) AS creances
                FROM ProformaInvoice i
                LEFT JOIN (
                    SELECT proformaInvoiceId, SUM(amount) AS paid
                    FROM Receipt
                    WHERE accountId = ?
                    GROUP BY proformaInvoiceId
                ) r ON r.proformaInvoiceId = i.id
                WHERE i.accountId = ?
                  AND i.type = 'facture'
                  AND i.status NOT IN ('brouillon', 'annulée')
                  AND i.issueDate >= ? AND i.issueDate <= ?
            ");
            $stmt->execute([$accountId, $accountId, $startDate, $endDate]);
            $finRow    = $stmt->fetch(PDO::FETCH_ASSOC);
            $potentiel = round((float)($finRow['potentiel'] ?? 0));

            // Créances globales (tous statuts, pas seulement la période)
            $stmt = $pdo->prepare("
                SELECT COALESCE(SUM(
                    GREATEST(0,
                        CASE WHEN i.\"vatWithholdingApplied\" = 1 AND i.taxAmount > 0
                            THEN i.total - (i.taxAmount / 2.0)
                            ELSE i.total END
                        - COALESCE(r.paid, 0)
                    )
                ), 0) AS creances
                FROM ProformaInvoice i
                LEFT JOIN (
                    SELECT proformaInvoiceId, SUM(amount) AS paid
                    FROM Receipt WHERE accountId = ?
                    GROUP BY proformaInvoiceId
                ) r ON r.proformaInvoiceId = i.id
                WHERE i.accountId = ?
                  AND i.type = 'facture'
                  AND i.status NOT IN ('brouillon', 'annulée')
            ");
            $stmt->execute([$accountId, $accountId]);
            $creances = round((float)$stmt->fetchColumn());

            // =====================================================
            // 5. Taux de Recouvrement
            // =====================================================
            $recoveryRate = $potentiel > 0
                ? round(($encaisse / $potentiel) * 100, 1)
                : ($encaisse > 0 ? 100 : 0);

            // =====================================================
            // 6. Facturation: statuts + nb factures — UNE REQUETE
            // =====================================================
            $stmt = $pdo->prepare("SELECT status, COUNT(id) as count FROM ProformaInvoice WHERE accountId = ? AND type = 'facture' AND issueDate >= ? AND issueDate <= ? AND status NOT IN ('brouillon', 'annulée') GROUP BY status");
            $stmt->execute([$accountId, $startDate, $endDate]);
            $statusData = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $statusCount = ['payée' => 0, 'partielle' => 0, 'envoyée' => 0, 'retard' => 0];
            $nbInvoices  = 0;
            foreach ($statusData as $row) {
                if ($row['status'] === 'payée')         $statusCount['payée']    = (int)$row['count'];
                elseif ($row['status'] === 'partielle') $statusCount['partielle'] = (int)$row['count'];
                else                                    $statusCount['envoyée']  += (int)$row['count'];
                $nbInvoices += (int)$row['count'];
            }
            $avgInvoice = $nbInvoices > 0 ? $potentiel / $nbInvoices : 0;

            // =====================================================
            // 7. Délai moyen de paiement — requete optimisee avec JOIN
            // =====================================================
            $stmt = $pdo->prepare("
                SELECT i.issueDate, r_max.lastPayment
                FROM ProformaInvoice i
                JOIN (
                    SELECT proformaInvoiceId, MAX(paymentDate) as lastPayment
                    FROM Receipt
                    WHERE accountId = ?
                    GROUP BY proformaInvoiceId
                    HAVING MAX(paymentDate) >= ? AND MAX(paymentDate) <= ?
                ) r_max ON i.id = r_max.proformaInvoiceId
                WHERE i.accountId = ? AND i.type = 'facture' AND i.status = 'payée'
            ");
            $stmt->execute([$accountId, $startDate, $endDate, $accountId]);
            $paidInvoicesForDelay = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $totalDelayDays = 0; $delayCount = 0;
            foreach ($paidInvoicesForDelay as $inv) {
                if ($inv['lastpayment'] ?? $inv['lastPayment']) {
                    $issue = new DateTime($inv['issuedate'] ?? $inv['issueDate']);
                    $paid  = new DateTime($inv['lastpayment'] ?? $inv['lastPayment']);
                    $totalDelayDays += $paid->diff($issue)->days;
                    $delayCount++;
                }
            }
            $avgPaymentDelay = $delayCount > 0 ? round($totalDelayDays / $delayCount, 1) : 0;

            // =====================================================
            // 8. Évolution Revenus (Chart)
            // =====================================================
            $stmt = $pdo->prepare("
                SELECT DATE(paymentDate) as date, SUM(amount) as amount
                FROM Receipt
                WHERE accountId = ? AND paymentDate >= ? AND paymentDate <= ?
                GROUP BY DATE(paymentDate) ORDER BY date ASC
            ");
            $stmt->execute([$accountId, $startDate, $endDate]);
            $caEvolution = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // =====================================================
            // 9. Dépenses par catégorie + évolution — 2 requetes simples
            // =====================================================
            $stmt = $pdo->prepare("SELECT category, SUM(amount) as total FROM Expense WHERE accountId = ? AND expenseDate >= ? AND expenseDate <= ? GROUP BY category");
            $stmt->execute([$accountId, $startDate, $endDate]);
            $expensesByCategory = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $pdo->prepare("SELECT DATE(expenseDate) as date, SUM(amount) as amount FROM Expense WHERE accountId = ? AND expenseDate >= ? AND expenseDate <= ? GROUP BY DATE(expenseDate) ORDER BY date ASC");
            $stmt->execute([$accountId, $startDate, $endDate]);
            $expensesEvolution = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // =====================================================
            // 10. Impayés — JOIN au lieu de sous-requêtes corrélées
            // =====================================================
            $now = date('Y-m-d H:i:s');
            $stmt = $pdo->prepare("
                SELECT i.clientId, c.name as clientName,
                    GREATEST(0,
                        CASE WHEN i.\"vatWithholdingApplied\" = 1 AND i.taxAmount > 0
                            THEN i.total - (i.taxAmount / 2.0)
                            ELSE i.total END
                        - COALESCE(r.paid, 0)
                    ) as remaining
                FROM ProformaInvoice i
                JOIN Client c ON i.clientId = c.id
                LEFT JOIN (
                    SELECT proformaInvoiceId, SUM(amount) AS paid
                    FROM Receipt WHERE accountId = ?
                    GROUP BY proformaInvoiceId
                ) r ON r.proformaInvoiceId = i.id
                WHERE i.accountId = ? AND i.type = 'facture'
                  AND i.status NOT IN ('brouillon', 'annulée', 'payée')
                  AND i.dueDate IS NOT NULL AND i.dueDate < ?
            ");
            $stmt->execute([$accountId, $accountId, $now]);
            $lateInvoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $lateCount = 0; $lateAmount = 0; $topLateClients = [];
            foreach ($lateInvoices as $inv) {
                if ($inv['remaining'] > 0) {
                    $lateCount++;
                    $lateAmount += $inv['remaining'];
                    $cid = $inv['clientid'] ?? $inv['clientId'];
                    $cname = $inv['clientname'] ?? $inv['clientName'];
                    if (!isset($topLateClients[$cid])) {
                        $topLateClients[$cid] = ['name' => $cname, 'amount' => 0];
                    }
                    $topLateClients[$cid]['amount'] += $inv['remaining'];
                }
            }
            usort($topLateClients, fn($a, $b) => $b['amount'] <=> $a['amount']);
            $topLateClients = array_slice($topLateClients, 0, 5);

            // =====================================================
            // 11. Factures partielles — JOIN optimisé
            // =====================================================
            $stmt = $pdo->prepare("
                SELECT COUNT(i.id) as count,
                    COALESCE(SUM(
                        GREATEST(0,
                            CASE WHEN i.\"vatWithholdingApplied\" = 1 AND i.taxAmount > 0
                                THEN i.total - (i.taxAmount / 2.0)
                                ELSE i.total END
                            - COALESCE(r.paid, 0)
                        )
                    ), 0) as remaining
                FROM ProformaInvoice i
                LEFT JOIN (
                    SELECT proformaInvoiceId, SUM(amount) AS paid
                    FROM Receipt WHERE accountId = ?
                    GROUP BY proformaInvoiceId
                ) r ON r.proformaInvoiceId = i.id
                WHERE i.accountId = ? AND i.status = 'partielle' AND i.type = 'facture'
            ");
            $stmt->execute([$accountId, $accountId]);
            $partialData  = $stmt->fetch(PDO::FETCH_ASSOC);
            $partialCount  = (int)$partialData['count'];
            $partialAmount = (float)$partialData['remaining'];

            // =====================================================
            // 12. Relances
            // =====================================================
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM InvoiceReminderLog WHERE accountId = ? AND sentAt >= ? AND sentAt <= ?");
            $stmt->execute([$accountId, $startDate, $endDate]);
            $totalReminders = (int)($stmt->fetchColumn() ?: 0);

            $successfulReminders = 0;
            if ($totalReminders > 0) {
                $stmt = $pdo->prepare("
                    SELECT COUNT(DISTINCT l.id)
                    FROM InvoiceReminderLog l
                    JOIN Receipt r ON r.proformaInvoiceId = l.invoiceId
                    WHERE l.accountId = ? AND l.sentAt >= ? AND l.sentAt <= ? AND r.paymentDate > l.sentAt
                ");
                $stmt->execute([$accountId, $startDate, $endDate]);
                $successfulReminders = (int)$stmt->fetchColumn();
            }
            $reminderEfficiency = $totalReminders > 0
                ? round(($successfulReminders / $totalReminders) * 100, 1) : 0;

            // =====================================================
            // 13. Compteurs globaux — 1 requete agregée
            // =====================================================
            $stmt = $pdo->prepare("SELECT COUNT(id) FROM Client WHERE accountId = ?");
            $stmt->execute([$accountId]);
            $clientCount = (int)$stmt->fetchColumn();

            $stmt = $pdo->prepare("SELECT COUNT(id) FROM CatalogItem WHERE accountId = ?");
            $stmt->execute([$accountId]);
            $itemCount = (int)$stmt->fetchColumn();

            echo json_encode([
                "overview" => [
                    "encaisse"     => $encaisse,
                    "expenses"     => $expenses,
                    "netProfit"    => $netProfit,
                    "potentiel"    => $potentiel,
                    "creances"     => $creances,
                    "recoveryRate" => $recoveryRate,
                ],
                "billing" => [
                    "nbInvoices"      => $nbInvoices,
                    "avgInvoice"      => $avgInvoice,
                    "statusCount"     => $statusCount,
                    "avgPaymentDelay" => $avgPaymentDelay,
                    "caEvolution"     => $caEvolution
                ],
                "expenses" => [
                    "total"      => $expenses,
                    "byCategory" => $expensesByCategory,
                    "evolution"  => $expensesEvolution
                ],
                "unpaid" => [
                    "lateCount"         => $lateCount,
                    "lateAmount"        => $lateAmount,
                    "partialCount"      => $partialCount,
                    "partialAmount"     => $partialAmount,
                    "totalOverdue"      => $lateAmount,
                    "topLateClients"    => $topLateClients,
                    "totalReminders"    => $totalReminders,
                    "reminderEfficiency"=> $reminderEfficiency
                ],
                "setup" => [
                    "clientCount"  => $clientCount,
                    "itemCount"    => $itemCount,
                    "invoiceCount" => $nbInvoices
                ]
            ]);

            // Sauvegarder en cache
            if (isset($cachePath)) {
                @file_put_contents($cachePath, ob_get_contents() ?: json_encode([]));
            }
        }
    }
}
