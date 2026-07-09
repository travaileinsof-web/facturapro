<?php
require 'config.php';
$pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Get the first account
$stmt = $pdo->query("SELECT id, email FROM Account LIMIT 1");
$acc = $stmt->fetch();
if ($acc) {
    // Set to expire in 3 days
    $pdo->query("UPDATE Account SET subscriptionExpiresAt = CURRENT_DATE + INTERVAL '3 days' WHERE id = '{$acc['id']}'");
    echo "Updated account {$acc['email']} to expire in 3 days.\n";
    
    // Clear log for this
    $pdo->query("DELETE FROM SubscriptionReminderLog WHERE accountId = '{$acc['id']}'");
    echo "Cleared logs for {$acc['email']}.\n";
} else {
    echo "No accounts found.\n";
}
