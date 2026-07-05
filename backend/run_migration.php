<?php
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = file_get_contents(__DIR__ . '/database_pg.sql');
    $pdo->exec($sql);
    
    echo "Migration to Neon PostgreSQL completed successfully!\n";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
