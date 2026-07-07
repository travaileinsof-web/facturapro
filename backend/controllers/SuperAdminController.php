<?php
class SuperAdminController {
    public static function handle($pdo, $method, $action, $accountId, $body) {
        if ($method === 'GET' && $action === 'stats') {
            $timeframe = $_GET['timeframe'] ?? '1y'; // 24h, 7d, 1m, 3m, 6m, 1y

            $totalAccounts = $pdo->query("SELECT COUNT(*) as c FROM Account")->fetch()['c'];
            $premiumAccounts = $pdo->query("SELECT COUNT(*) as c FROM Account WHERE subscriptionPlan = 'premium' AND subscriptionStatus = 'active'")->fetch()['c'];
            $freeAccounts = $pdo->query("SELECT COUNT(*) as c FROM Account WHERE subscriptionPlan = 'free' OR subscriptionStatus = 'trial'")->fetch()['c'];
            $suspendedAccounts = $pdo->query("SELECT COUNT(*) as c FROM Account WHERE isSuspended = 1")->fetch()['c'];
            $totalRevenue = $pdo->query("SELECT COALESCE(SUM(amount), 0) as r FROM SubscriptionPayment WHERE status = 'COMPLETED'")->fetch()['r'];
            $totalInvoices = $pdo->query("SELECT COUNT(*) as c FROM ProformaInvoice")->fetch()['c'];
            $totalReceipts = $pdo->query("SELECT COUNT(*) as c FROM Receipt")->fetch()['c'];
            $totalClients = $pdo->query("SELECT COUNT(*) as c FROM Client")->fetch()['c'];
            $newThisMonth = $pdo->query("SELECT COUNT(*) as c FROM Account WHERE TO_CHAR(createdAt, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')")->fetch()['c'];
            
            // Taux de conversion (Premium / Total * 100)
            $conversionRate = $totalAccounts > 0 ? round(($premiumAccounts / $totalAccounts) * 100, 2) : 0;

            // ARPU (Average Revenue Per User)
            $arpu = $premiumAccounts > 0 ? round($totalRevenue / $premiumAccounts, 2) : 0;

            // Build MRR and Acquisition curves based on timeframe
            $dateGroupFormat = 'YYYY-MM';
            $limitStr = '1 year';
            if ($timeframe === '24h') { $dateGroupFormat = 'YYYY-MM-DD HH24:00'; $limitStr = '24 hours'; }
            elseif ($timeframe === '7d') { $dateGroupFormat = 'YYYY-MM-DD'; $limitStr = '7 days'; }
            elseif ($timeframe === '1m') { $dateGroupFormat = 'YYYY-MM-DD'; $limitStr = '1 month'; }
            elseif ($timeframe === '3m') { $dateGroupFormat = 'IYYY-IW'; $limitStr = '3 months'; } // par semaine
            elseif ($timeframe === '6m') { $dateGroupFormat = 'YYYY-MM'; $limitStr = '6 months'; }
            else { $dateGroupFormat = 'YYYY-MM'; $limitStr = '1 year'; }

            // MRR Curve
            // PostgreSQL syntax using TO_CHAR
            $mrrQuery = "SELECT TO_CHAR(createdAt, '$dateGroupFormat') as date, SUM(amount) as mrr FROM SubscriptionPayment WHERE status = 'COMPLETED' AND createdAt >= NOW() - INTERVAL '$limitStr' GROUP BY TO_CHAR(createdAt, '$dateGroupFormat') ORDER BY date ASC";
            $mrrCurve = $pdo->query($mrrQuery)->fetchAll(PDO::FETCH_ASSOC);

            // Free vs Paid Curve
            $acqQuery = "
                SELECT 
                    TO_CHAR(createdAt, '$dateGroupFormat') as date, 
                    SUM(CASE WHEN subscriptionPlan = 'free' THEN 1 ELSE 0 END) as freeAccounts,
                    SUM(CASE WHEN subscriptionPlan = 'premium' THEN 1 ELSE 0 END) as paidAccounts
                FROM Account 
                WHERE createdAt >= NOW() - INTERVAL '$limitStr'
                GROUP BY TO_CHAR(createdAt, '$dateGroupFormat') ORDER BY date ASC
            ";
            $acqCurve = $pdo->query($acqQuery)->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "kpis" => [
                    "totalAccounts"    => (int)$totalAccounts,
                    "premiumAccounts"  => (int)$premiumAccounts,
                    "freeAccounts"     => (int)$freeAccounts,
                    "suspendedAccounts"=> (int)$suspendedAccounts,
                    "totalRevenue"     => (float)$totalRevenue,
                    "totalInvoices"    => (int)$totalInvoices,
                    "totalReceipts"    => (int)$totalReceipts,
                    "totalClients"     => (int)$totalClients,
                    "newThisMonth"     => (int)$newThisMonth,
                    "conversionRate"   => $conversionRate,
                    "arpu"             => $arpu
                ],
                "mrrCurve" => $mrrCurve,
                "acquisitionCurve" => $acqCurve
            ]);
            exit;
        }

        if ($method === 'GET' && $action === 'accounts') {
            // Liste des comptes
            $stmt = $pdo->query("SELECT id, email, companyName, firstName, lastName, phone, subscriptionPlan, subscriptionStatus, subscriptionExpiresAt, createdAt, isSuspended FROM Account ORDER BY createdAt DESC");
            $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($accounts);
            exit;
        }

        if ($method === 'GET' && str_starts_with($action, 'accounts/')) {
            // Détails d'un compte
            $targetId = explode('/', $action)[1];
            
            $stmt = $pdo->prepare("SELECT id, email, companyName, firstName, lastName, phone, address, subscriptionPlan, subscriptionStatus, subscriptionExpiresAt, createdAt, isSuspended FROM Account WHERE id = ?");
            $stmt->execute([$targetId]);
            $account = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$account) {
                http_response_code(404); echo json_encode(["error" => "Compte introuvable"]); exit;
            }

            // Quotas
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM Client WHERE accountId = ?");
            $stmt->execute([$targetId]);
            $account['totalClients'] = $stmt->fetch()['total'];

            $stmt = $pdo->prepare("SELECT COUNT(*) as total, SUM(total) as amount FROM ProformaInvoice WHERE accountId = ?");
            $stmt->execute([$targetId]);
            $invStats = $stmt->fetch();
            $account['totalInvoices'] = $invStats['total'];
            $account['totalInvoicedAmount'] = $invStats['amount'] ?? 0;

            // Historique paiements
            $stmt = $pdo->prepare("SELECT * FROM SubscriptionPayment WHERE accountId = ? ORDER BY createdAt DESC");
            $stmt->execute([$targetId]);
            $account['payments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($account);
            exit;
        }

        if ($method === 'PUT' && str_starts_with($action, 'accounts/')) {
            $parts = explode('/', $action);
            $targetId = $parts[1];
            $subAction = $parts[2] ?? '';

            if ($subAction === 'subscription') {
                $plan = $body['plan'] ?? 'free';
                $status = $body['status'] ?? 'trial';
                $expiresAt = $body['expiresAt'] ?? null;
                
                $stmt = $pdo->prepare("UPDATE Account SET subscriptionPlan = ?, subscriptionStatus = ?, subscriptionExpiresAt = ? WHERE id = ?");
                $stmt->execute([$plan, $status, $expiresAt, $targetId]);
                echo json_encode(["success" => true]);
                exit;
            }

            if ($subAction === 'suspend') {
                $isSuspended = $body['isSuspended'] ?? 0;
                $stmt = $pdo->prepare("UPDATE Account SET isSuspended = ? WHERE id = ?");
                $stmt->execute([$isSuspended, $targetId]);
                echo json_encode(["success" => true]);
                exit;
            }
        }
        
        if ($method === 'POST' && str_starts_with($action, 'accounts/') && str_ends_with($action, '/remind')) {
            $targetId = explode('/', $action)[1];
            
            $stmt = $pdo->prepare("SELECT email, firstName FROM Account WHERE id = ?");
            $stmt->execute([$targetId]);
            $account = $stmt->fetch();
            
            if (!$account) {
                http_response_code(404); echo json_encode(["error" => "Compte introuvable"]); exit;
            }
            
            // Get last proforma invoice number
            $stmtInv = $pdo->prepare("SELECT invoiceNumber FROM SubscriptionInvoice WHERE accountId = ? AND status = 'proforma' ORDER BY createdAt DESC LIMIT 1");
            $stmtInv->execute([$targetId]);
            $inv = $stmtInv->fetch();
            
            if ($inv) {
                require_once __DIR__ . '/../core/SystemMailer.php';
                SystemMailer::sendReminderEmail($pdo, $account['email'], $account['firstName'] ?? 'Client', $inv['invoiceNumber']);
                
                try {
                    $pdo->prepare("INSERT INTO AdminLog (action, targetAccountId, details) VALUES (?, ?, ?)")->execute(['REMIND', $targetId, "Admin $accountId sent reminder to $targetId"]);
                } catch (Exception $e) {}
                
                echo json_encode(["success" => true, "message" => "Relance envoyée avec succès."]);
                exit;
            } else {
                http_response_code(400); echo json_encode(["error" => "Aucune facture proforma à relancer pour ce compte."]); exit;
            }
        }
        
        if ($method === 'POST' && str_starts_with($action, 'impersonate/')) {
            $targetId = explode('/', $action)[1];
            
            // On récupère le compte cible pour lui créer un token temporaire s'il n'en a pas,
            // ou on renvoie simplement son token. C'est très sensible.
            $stmt = $pdo->prepare("SELECT id, email, token, companyName, firstName, lastName, subscriptionPlan, subscriptionStatus, subscriptionExpiresAt, createdAt, primaryColor, secondaryColor, accentColor, role FROM Account WHERE id = ?");
            $stmt->execute([$targetId]);
            $targetAccount = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$targetAccount) {
                http_response_code(404); echo json_encode(["error" => "Compte introuvable"]); exit;
            }

            $token = $targetAccount['token'];
            if (!$token) {
                $token = bin2hex(random_bytes(32));
                $pdo->prepare("UPDATE Account SET token = ? WHERE id = ?")->execute([$token, $targetId]);
            }

            // Enregistrer l'action dans AdminLog (audit)
            // On vérifie d'abord si la table AdminLog existe
            try {
                $stmt = $pdo->prepare("INSERT INTO AdminLog (action, targetAccountId, details) VALUES (?, ?, ?)");
                $stmt->execute(['IMPERSONATE', $targetId, "Admin $accountId impersonated account $targetId"]);
            } catch(Exception $e) {
                // Table might not exist yet, ignoring error for now
            }

            echo json_encode([
                "id" => $targetAccount['id'], 
                "name" => trim($targetAccount['firstName'] . " " . $targetAccount['lastName']),
                "email" => $targetAccount['email'], 
                "company" => $targetAccount['companyName'], 
                "token" => $token,
                "subscriptionPlan" => $targetAccount['subscriptionPlan'] ?? 'free',
                "subscriptionStatus" => $targetAccount['subscriptionStatus'] ?? 'trial',
                "createdAt" => $targetAccount['createdAt'],
                "primaryColor" => $targetAccount['primaryColor'] ?? '#B38E36',
                "secondaryColor" => $targetAccount['secondaryColor'],
                "accentColor" => $targetAccount['accentColor'],
                "role" => $targetAccount['role'] ?? 'user'
            ]);
            exit;
        }

        if ($method === 'DELETE' && str_starts_with($action, 'accounts/')) {
            $targetId = explode('/', $action)[1];
            
            try {
                $stmt = $pdo->prepare("INSERT INTO AdminLog (action, targetAccountId, details) VALUES (?, ?, ?)");
                $stmt->execute(['DELETE_ACCOUNT', $targetId, "Admin $accountId deleted account $targetId"]);
            } catch(Exception $e) {}

            $stmt = $pdo->prepare("DELETE FROM Account WHERE id = ?");
            $stmt->execute([$targetId]);

            echo json_encode(["message" => "Compte supprimé avec succès"]);
            exit;
        }

        http_response_code(404);
        echo json_encode(["error" => "Endpoint introuvable"]);
    }
}
