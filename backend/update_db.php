<?php
require_once 'config.php';
try {
    $pdo = new PDO("sqlite:" . DB_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Try to add the column, if it fails it's probably already there
    try {
        $pdo->exec("ALTER TABLE Account ADD COLUMN openrouterKey VARCHAR(255) NULL");
        echo "Column openrouterKey added successfully.\n";
    } catch (Exception $e) {
        echo "Column openrouterKey might already exist or error: " . $e->getMessage() . "\n";
    }
} catch (Exception $e) {
    echo "DB Error: " . $e->getMessage();
}
