<?php
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    // Add status to SubscriptionInvoice
    $pdo->exec("ALTER TABLE SubscriptionInvoice ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'proforma'");
    echo "Column status added to SubscriptionInvoice successfully.\n";
    
    // Verify columns in Account just in case
    $pdo->exec("ALTER TABLE Account ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'");
    echo "Column role added to Account successfully (if missing).\n";

    echo "Done.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
