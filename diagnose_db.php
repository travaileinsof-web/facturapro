<?php
$pdo = new PDO('sqlite:C:/Users/GBESSI/Desktop/OFFICIAL_PROJECTS/facturapro/backend/facturapro.sqlite');

echo "=== TABLES EXISTANTES ===" . PHP_EOL;
$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $t) echo "  - $t" . PHP_EOL;

echo PHP_EOL . "=== COMPTES (Account) ===" . PHP_EOL;
$accounts = $pdo->query("SELECT id, email, companyName, firstName, lastName, subscriptionPlan, subscriptionStatus, role, createdAt FROM Account ORDER BY createdAt DESC")->fetchAll(PDO::FETCH_ASSOC);
echo "Total: " . count($accounts) . PHP_EOL;
foreach ($accounts as $a) {
    echo sprintf("  [%s] %s | %s | plan:%s | status:%s | role:%s",
        substr($a['id'], 0, 8),
        $a['email'],
        $a['companyName'] ?? 'N/A',
        $a['subscriptionPlan'] ?? 'NULL',
        $a['subscriptionStatus'] ?? 'NULL',
        $a['role'] ?? 'NULL'
    ) . PHP_EOL;
}

echo PHP_EOL . "=== COLONNES DE Account ===" . PHP_EOL;
$cols = $pdo->query("PRAGMA table_info(Account)")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) echo "  " . $c['name'] . " (" . $c['type'] . ")" . PHP_EOL;

echo PHP_EOL . "=== ProformaInvoice count ===" . PHP_EOL;
try {
    $cnt = $pdo->query("SELECT COUNT(*) as c FROM ProformaInvoice")->fetch()['c'];
    echo "  Total factures: $cnt" . PHP_EOL;
} catch(Exception $e) { echo "  Erreur: " . $e->getMessage() . PHP_EOL; }

echo PHP_EOL . "=== Client count ===" . PHP_EOL;
try {
    $cnt = $pdo->query("SELECT COUNT(*) as c FROM Client")->fetch()['c'];
    echo "  Total clients: $cnt" . PHP_EOL;
} catch(Exception $e) { echo "  Erreur: " . $e->getMessage() . PHP_EOL; }

echo PHP_EOL . "=== SubscriptionPayment ===" . PHP_EOL;
try {
    $cnt = $pdo->query("SELECT COUNT(*) as c FROM SubscriptionPayment")->fetch()['c'];
    echo "  Total paiements: $cnt" . PHP_EOL;
} catch(Exception $e) { echo "  Table SubscriptionPayment absente: " . $e->getMessage() . PHP_EOL; }
