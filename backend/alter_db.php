<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/facturapro.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $pdo->query("PRAGMA table_info(Account)");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

$colNames = array_column($columns, 'name');

$missingCols = [
    'smtpHost' => 'VARCHAR(255) NULL',
    'smtpPort' => 'VARCHAR(10) NULL',
    'smtpEncryption' => "VARCHAR(50) DEFAULT 'tls'",
    'smtpUser' => 'VARCHAR(255) NULL',
    'smtpPass' => 'VARCHAR(255) NULL',
    'currency' => "VARCHAR(10) DEFAULT 'GNF'",
    'autoRemindersEnabled' => 'INTEGER DEFAULT 0',
    'autoReminderDays' => "VARCHAR(50) DEFAULT '[-5, -3, 0]'"
];

foreach ($missingCols as $col => $def) {
    if (!in_array($col, $colNames)) {
        echo "Adding $col to Account...\n";
        $pdo->exec("ALTER TABLE Account ADD COLUMN $col $def");
    }
}

echo "Done.\n";
