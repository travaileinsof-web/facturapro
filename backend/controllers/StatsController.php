<?php
class StatsController {
    public static function handle($pdo, $method, $accountId) {
        if ($method === 'GET') {
            $totalClients = $pdo->prepare("SELECT COUNT(*) FROM Client WHERE accountId = ?"); $totalClients->execute([$accountId]); $totalClients = $totalClients->fetchColumn();
            $totalInvoices = $pdo->prepare("SELECT COUNT(*) FROM ProformaInvoice WHERE accountId = ?"); $totalInvoices->execute([$accountId]); $totalInvoices = $totalInvoices->fetchColumn();
            $encaisse = $pdo->prepare("SELECT SUM(amount) FROM Receipt WHERE accountId = ?"); $encaisse->execute([$accountId]); $encaisse = $encaisse->fetchColumn() ?: 0;
            
            $expenses = $pdo->prepare("SELECT SUM(amount) FROM Expense WHERE accountId = ?"); $expenses->execute([$accountId]); $expenses = $expenses->fetchColumn() ?: 0;
            $netProfit = $encaisse - $expenses;

            $invs = $pdo->prepare("SELECT * FROM ProformaInvoice WHERE accountId = ? AND type = 'facture'"); $invs->execute([$accountId]); $invs = $invs->fetchAll();
            $potentiel = 0;
            $creances = 0;
            
            foreach($invs as $i) {
                $paid = $pdo->prepare("SELECT SUM(amount) FROM Receipt WHERE proformaInvoiceId=? AND accountId=?");
                $paid->execute([$i['id'], $accountId]);
                $p = $paid->fetchColumn() ?: 0;
                
                if ($p == 0) {
                    $potentiel += $i['total'];
                } elseif ($p < $i['total']) {
                    $creances += ($i['total'] - $p);
                }
            }

            $recentInvoices = $pdo->prepare("SELECT i.*, c.name as clientName FROM ProformaInvoice i JOIN Client c ON i.clientId = c.id WHERE i.accountId = ? ORDER BY i.createdAt DESC LIMIT 5"); $recentInvoices->execute([$accountId]); $recentInvoices = $recentInvoices->fetchAll();
            foreach($recentInvoices as &$ri) { $ri['client'] = ['name' => $ri['clientName']]; }
            
            $recentReceipts = $pdo->prepare("SELECT r.*, c.name as clientName FROM Receipt r JOIN Client c ON r.clientId = c.id WHERE r.accountId = ? ORDER BY r.createdAt DESC LIMIT 5"); $recentReceipts->execute([$accountId]); $recentReceipts = $recentReceipts->fetchAll();
            foreach($recentReceipts as &$rr) { $rr['client'] = ['name' => $rr['clientName']]; }

            echo json_encode([
                "totalClients" => $totalClients, "totalInvoices" => $totalInvoices,
                "encaisse" => $encaisse, "potentiel" => $potentiel, "creances" => $creances,
                "totalExpenses" => $expenses, "netProfit" => $netProfit,
                "recentInvoices" => $recentInvoices, "recentReceipts" => $recentReceipts
            ]);
        }
    }
}
