<?php
// Benchmark complet: mesure le temps de chaque etape critique
require 'backend/config.php';

$t0 = microtime(true);

// === TEST 1: Connexion DB ===
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

// Recuperer un vrai accountId
$acc = $pdo->query("SELECT id FROM Account LIMIT 1")->fetch();
$accountId = $acc['id'];
$t2 = microtime(true);
echo "[FETCH_ACCOUNT] " . round(($t2 - $t1) * 1000, 1) . " ms" . PHP_EOL;

// === TEST 2: Requetes Stats (les + lourdes) ===
// 1. Total Encaisse
$stmt = $pdo->prepare("SELECT SUM(amount) FROM Receipt WHERE accountId = ? AND paymentDate >= ? AND paymentDate <= ?");
$stmt->execute([$accountId, date('Y-m-01'), date('Y-m-t')]);
$stmt->fetchColumn();
$t3 = microtime(true);
echo "[STATS_encaisse] " . round(($t3 - $t2) * 1000, 1) . " ms" . PHP_EOL;

// 2. Depenses
$stmt = $pdo->prepare("SELECT SUM(amount) FROM Expense WHERE accountId = ? AND expenseDate >= ? AND expenseDate <= ?");
$stmt->execute([$accountId, date('Y-m-01'), date('Y-m-t')]);
$stmt->fetchColumn();
$t4 = microtime(true);
echo "[STATS_expenses] " . round(($t4 - $t3) * 1000, 1) . " ms" . PHP_EOL;

// 3. Potentiel (requete complexe)
$stmt = $pdo->prepare("
    SELECT SUM(GREATEST(0, (CASE WHEN \"vatWithholdingApplied\" = 1 AND taxAmount > 0 THEN total - (taxAmount / 2.0) ELSE total END))) 
    FROM ProformaInvoice 
    WHERE accountId = ? AND type = 'facture' AND status NOT IN ('brouillon', 'annulée') 
    AND issueDate >= ? AND issueDate <= ?
");
$stmt->execute([$accountId, date('Y-m-01'), date('Y-m-t')]);
$stmt->fetchColumn();
$t5 = microtime(true);
echo "[STATS_potentiel] " . round(($t5 - $t4) * 1000, 1) . " ms" . PHP_EOL;

// 4. Creances (requete avec sous-requete correllee = tres lente)
$stmt = $pdo->prepare("
    SELECT SUM(CASE WHEN paid < total THEN (total - paid) ELSE 0 END) as creances
    FROM (
        SELECT 
            GREATEST(0, (CASE WHEN i.\"vatWithholdingApplied\" = 1 AND i.taxAmount > 0 THEN i.total - (i.taxAmount / 2.0) ELSE i.total END)) as total,
            COALESCE((SELECT SUM(amount) FROM Receipt r WHERE r.proformaInvoiceId = i.id AND r.accountId = ?), 0) as paid
        FROM ProformaInvoice i
        WHERE i.accountId = ? AND i.type = 'facture' AND i.status NOT IN ('brouillon', 'annulée')
    ) t
");
$stmt->execute([$accountId, $accountId]);
$stmt->fetchColumn();
$t6 = microtime(true);
echo "[STATS_creances_correlated_subquery] " . round(($t6 - $t5) * 1000, 1) . " ms" . PHP_EOL;

// 5. Liste clients
$stmt = $pdo->prepare("SELECT * FROM Client WHERE accountId = ? ORDER BY createdAt DESC");
$stmt->execute([$accountId]);
$stmt->fetchAll();
$t7 = microtime(true);
echo "[CLIENTS_list] " . round(($t7 - $t6) * 1000, 1) . " ms" . PHP_EOL;

// 6. Liste catalog
$stmt = $pdo->prepare("SELECT * FROM CatalogItem WHERE accountId = ? ORDER BY createdAt DESC");
$stmt->execute([$accountId]);
$stmt->fetchAll();
$t8 = microtime(true);
echo "[CATALOG_list] " . round(($t8 - $t7) * 1000, 1) . " ms" . PHP_EOL;

// 7. Notifications
$stmt = $pdo->prepare("SELECT * FROM Notification WHERE accountId = ? AND isRead = 0 ORDER BY createdAt DESC");
$stmt->execute([$accountId]);
$stmt->fetchAll();
$t9 = microtime(true);
echo "[NOTIFICATIONS_unread] " . round(($t9 - $t8) * 1000, 1) . " ms" . PHP_EOL;

// === TOTAL ===
$tTotal = microtime(true);
echo PHP_EOL;
echo "=== TOTAL BACKEND TIME: " . round(($tTotal - $t0) * 1000, 1) . " ms ===" . PHP_EOL;
echo "=== DB CONNECTION OVERHEAD: " . round(($t1 - $t0) * 1000, 1) . " ms ===" . PHP_EOL;
