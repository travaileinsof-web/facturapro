<?php
require_once __DIR__ . '/config.php';

try {
    if (defined('DB_CONNECTION') && DB_CONNECTION === 'mysql') {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    } else {
        $pdo = new PDO("sqlite:" . DB_PATH);
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Migration started...\n";
    
    // Add currency to Account
    try {
        $pdo->exec("ALTER TABLE Account ADD COLUMN currency VARCHAR(10) DEFAULT 'XOF'");
        echo "Added 'currency' to Account.\n";
    } catch (Exception $e) {
        echo "Column 'currency' might already exist: " . $e->getMessage() . "\n";
    }

    // Add category to CatalogItem
    try {
        $pdo->exec("ALTER TABLE CatalogItem ADD COLUMN category VARCHAR(100) DEFAULT 'Général'");
        echo "Added 'category' to CatalogItem.\n";
    } catch (Exception $e) {
        echo "Column 'category' might already exist: " . $e->getMessage() . "\n";
    }
    
    // Add components to CatalogItem
    try {
        $pdo->exec("ALTER TABLE CatalogItem ADD COLUMN components TEXT NULL");
        echo "Added 'components' to CatalogItem.\n";
    } catch (Exception $e) {
        echo "Column 'components' might already exist: " . $e->getMessage() . "\n";
    }

    echo "Migration completed successfully!\n";
} catch (Exception $e) {
    die("Migration failed: " . $e->getMessage() . "\n");
}
