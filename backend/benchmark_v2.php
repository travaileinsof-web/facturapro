<?php
// Benchmark v2: après optimisations
require 'backend/config.php';

$t0 = microtime(true);

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $t1 = microtime(true);
    echo "[DB_CONNECT] " . round(($t1 - $t0) * 1000, 1) . " ms" . PHP_EOL;
} catch (Exception $e) {
    echo "ERREUR DB: " . $e->getMessage() . PHP_EOL;
    exit;
}

$acc = $pdo->query("SELECT id FROM Account LIMIT 1")->fetch();
$accountId = $acc['id'];
$t2 = microtime(true);
echo "[FETCH_ACCOUNT_by_token] " . round(($t2 - $t1) * 1000, 1) . " ms" . PHP_EOL;

$startDate = date('Y-m-01 00:00:00');
$endDate   = date('Y-m-t 23:59:59');

// Encaissé
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM Receipt WHERE accountId = ? AND paymentDate >= ? AND paymentDate <= ?");
$stmt->execute([$accountId, $startDate, $endDate]);
$stmt->fetchColumn();
$t3 = microtime(true);
echo "[STATS_encaisse] " . round(($t3 - $t2) * 1000, 1) . " ms" . PHP_EOL;

// Potentiel + Créances en 1 requete JOIN (optimisé)
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
        FROM Receipt WHERE accountId = ? GROUP BY proformaInvoiceId
    ) r ON r.proformaInvoiceId = i.id
    WHERE i.accountId = ? AND i.type = 'facture'
      AND i.status NOT IN ('brouillon', 'annulée')
      AND i.issueDate >= ? AND i.issueDate <= ?
");
$stmt->execute([$accountId, $accountId, $startDate, $endDate]);
$stmt->fetch();
$t4 = microtime(true);
echo "[STATS_potentiel_creances_JOIN] " . round(($t4 - $t3) * 1000, 1) . " ms" . PHP_EOL;

// Clients
$stmt = $pdo->prepare("SELECT * FROM Client WHERE accountId = ? ORDER BY createdAt DESC");
$stmt->execute([$accountId]);
$stmt->fetchAll();
$t5 = microtime(true);
echo "[CLIENTS_list] " . round(($t5 - $t4) * 1000, 1) . " ms" . PHP_EOL;

// Catalog
$stmt = $pdo->prepare("SELECT * FROM CatalogItem WHERE accountId = ? ORDER BY createdAt DESC");
$stmt->execute([$accountId]);
$stmt->fetchAll();
$t6 = microtime(true);
echo "[CATALOG_list] " . round(($t6 - $t5) * 1000, 1) . " ms" . PHP_EOL;

// Notifications
$stmt = $pdo->prepare("SELECT * FROM Notification WHERE accountId = ? AND isRead = false ORDER BY createdAt DESC");
$stmt->execute([$accountId]);
$stmt->fetchAll();
$t7 = microtime(true);
echo "[NOTIFICATIONS_unread] " . round(($t7 - $t6) * 1000, 1) . " ms" . PHP_EOL;

$tTotal = microtime(true);
echo PHP_EOL;
echo "=== TOTAL: " . round(($tTotal - $t0) * 1000, 1) . " ms ===" . PHP_EOL;
echo "=== DB CONNECT: " . round(($t1 - $t0) * 1000, 1) . " ms ===" . PHP_EOL;
