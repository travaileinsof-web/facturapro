<?php
require_once 'backend/config.php';
$start = microtime(true);
try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    echo 'Connected in ' . round(microtime(true) - $start, 3) . ' seconds' . PHP_EOL;
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . PHP_EOL;
}
