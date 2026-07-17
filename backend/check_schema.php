<?php
require 'backend/config.php';
try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 1. Verifier colonnes CatalogItem
    $stmt = $pdo->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'catalogitem' ORDER BY ordinal_position");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "CatalogItem columns: " . implode(', ', $cols) . PHP_EOL;
    
    // 2. Verifier colonnes Notification
    $stmt2 = $pdo->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'notification' ORDER BY ordinal_position");
    $cols2 = $stmt2->fetchAll(PDO::FETCH_COLUMN);
    echo "Notification columns: " . implode(', ', $cols2) . PHP_EOL;
    
    // 3. Lister toutes les tables
    $stmt3 = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    $tables = $stmt3->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . implode(', ', $tables) . PHP_EOL;
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
}
