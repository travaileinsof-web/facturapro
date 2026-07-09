<?php
require 'config.php';
$pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
    $pdo->query("ALTER TABLE SubscriptionReminderLog ADD COLUMN daysOffset INT DEFAULT 0");
    echo "Altered table!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
