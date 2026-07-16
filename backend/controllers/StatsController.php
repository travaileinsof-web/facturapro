<?php
class StatsController {
    public static function handle($pdo, $method, $accountId) {
        if ($method === 'GET') {
            $totalClients = $pdo->prepare("SELECT COUNT(*) FROM Client WHERE accountId = ?"); $totalClients->execute([$accountId]); $totalClients = $totalClients->fetchColumn();
            $totalInvoices = $pdo->prepare("SELECT COUNT(*) FROM ProformaInvoice WHERE accountId = ?"); $totalInvoices->execute([$accountId]); $totalInvoices = $totalInvoices->fetchColumn();
            $totalCatalogItems = $pdo->prepare("SELECT COUNT(*) FROM CatalogItem WHERE accountId = ?"); $totalCatalogItems->execute([$accountId]); $totalCatalogItems = $totalCatalogItems->fetchColumn();
            
            $encaisse = $pdo->prepare("SELECT SUM(amount) FROM Receipt WHERE accountId = ?"); $encaisse->execute([$accountId]); $encaisse = $encaisse->fetchColumn() ?: 0;
            $expenses = $pdo->prepare("SELECT SUM(amount) FROM Expense WHERE accountId = ?"); $expenses->execute([$accountId]); $expenses = $expenses->fetchColumn() ?: 0;
            $netProfit = $encaisse - $expenses;

            // Optimisation : Calcul Potentiel et Créances en une seule requête (excluant brouillons)
            $stmt = $pdo->prepare("
                SELECT 
                    SUM(CASE WHEN paid = 0 THEN total ELSE 0 END) as potentiel,
                    SUM(CASE WHEN paid > 0 AND paid < total THEN (total - paid) ELSE 0 END) as creances
                FROM (
                    SELECT 
                        i.total,
                        COALESCE((SELECT SUM(amount) FROM Receipt r WHERE r.proformaInvoiceId = i.id AND r.accountId = ?), 0) as paid
                    FROM ProformaInvoice i
                    WHERE i.accountId = ? AND i.type = 'facture' AND i.status != 'brouillon'
                ) t
            ");
            $stmt->execute([$accountId, $accountId]);
            $financials = $stmt->fetch(PDO::FETCH_ASSOC);
            $potentiel = $financials['potentiel'] ?: 0;
            $creances = $financials['creances'] ?: 0;

            // Calcul des Tendances (Mois en cours vs Mois précédent)
            $currentMonthStart = date('Y-m-01 00:00:00');
            $prevMonthStart = date('Y-m-01 00:00:00', strtotime('first day of last month'));
            $prevMonthEnd = date('Y-m-t 23:59:59', strtotime('last day of last month'));

            // Encaissement Mois Courant et Précédent
            $stmt = $pdo->prepare("SELECT SUM(amount) FROM Receipt WHERE accountId = ? AND paymentDate >= ?");
            $stmt->execute([$accountId, $currentMonthStart]);
            $encCurrent = $stmt->fetchColumn() ?: 0;

            $stmt = $pdo->prepare("SELECT SUM(amount) FROM Receipt WHERE accountId = ? AND paymentDate >= ? AND paymentDate <= ?");
            $stmt->execute([$accountId, $prevMonthStart, $prevMonthEnd]);
            $encPrev = $stmt->fetchColumn() ?: 0;

            $encaisseTrend = $encPrev > 0 ? round((($encCurrent - $encPrev) / $encPrev) * 100, 1) : ($encCurrent > 0 ? 100 : 0);

            // Bénéfice Mois Courant et Précédent
            $stmt = $pdo->prepare("SELECT SUM(amount) FROM Expense WHERE accountId = ? AND expenseDate >= ?");
            $stmt->execute([$accountId, $currentMonthStart]);
            $expCurrent = $stmt->fetchColumn() ?: 0;

            $stmt = $pdo->prepare("SELECT SUM(amount) FROM Expense WHERE accountId = ? AND expenseDate >= ? AND expenseDate <= ?");
            $stmt->execute([$accountId, $prevMonthStart, $prevMonthEnd]);
            $expPrev = $stmt->fetchColumn() ?: 0;

            $profitCurrent = $encCurrent - $expCurrent;
            $profitPrev = $encPrev - $expPrev;

            if ($profitPrev == 0) {
                $profitTrend = $profitCurrent > 0 ? 100 : ($profitCurrent < 0 ? -100 : 0);
            } else {
                $profitTrend = round((($profitCurrent - $profitPrev) / abs($profitPrev)) * 100, 1);
            }

            // Récentes
            $recentInvoices = $pdo->prepare("SELECT i.*, c.name as clientName FROM ProformaInvoice i JOIN Client c ON i.clientId = c.id WHERE i.accountId = ? ORDER BY i.createdAt DESC LIMIT 5"); $recentInvoices->execute([$accountId]); $recentInvoices = $recentInvoices->fetchAll();
            foreach($recentInvoices as &$ri) { $ri['client'] = ['name' => $ri['clientName']]; }
            
            $recentReceipts = $pdo->prepare("SELECT r.*, c.name as clientName FROM Receipt r JOIN Client c ON r.clientId = c.id WHERE r.accountId = ? ORDER BY r.createdAt DESC LIMIT 5"); $recentReceipts->execute([$accountId]); $recentReceipts = $recentReceipts->fetchAll();
            foreach($recentReceipts as &$rr) { $rr['client'] = ['name' => $rr['clientName']]; }

            echo json_encode([
                "totalClients" => $totalClients, "totalInvoices" => $totalInvoices, "totalCatalogItems" => $totalCatalogItems,
                "encaisse" => $encaisse, "potentiel" => $potentiel, "creances" => $creances,
                "totalExpenses" => $expenses, "netProfit" => $netProfit,
                "encaisseTrend" => $encaisseTrend, "profitTrend" => $profitTrend,
                "recentInvoices" => $recentInvoices, "recentReceipts" => $recentReceipts
            ]);
        }
    }
}
