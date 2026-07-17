<?php
ini_set('display_errors', '1');
error_reporting(E_ALL);

require_once 'config.php';
require_once __DIR__ . '/core/Validator.php';
require_once __DIR__ . '/controllers/Helper.php';
require_once __DIR__ . '/controllers/AuthController.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $body = [
        'email' => 'test_direct_1784270095@example.com', // wait, need to fetch dynamically from db, or just use what I created
    ];
    
    $stmt = $pdo->query("SELECT email FROM Account ORDER BY createdAt DESC LIMIT 1");
    $email = $stmt->fetchColumn();
    
    $body = [
        'email' => $email,
        'password' => 'password123'
    ];
    
    echo "Calling AuthController for login with $email...\n";
    AuthController::handle($pdo, 'POST', 'login', $body);
    echo "\nDone\n";
} catch (Throwable $e) {
    echo "Exception caught in test script:\n" . $e->getMessage() . "\n" . $e->getTraceAsString();
}
