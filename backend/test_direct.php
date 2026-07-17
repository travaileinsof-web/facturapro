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
        'email' => 'test_direct_'.time().'@example.com',
        'password' => 'password123',
        'company' => 'Test Direct Co',
        'firstName' => 'Test',
        'lastName' => 'User',
        'phone' => '12345678'
    ];
    
    echo "Calling AuthController...\n";
    AuthController::handle($pdo, 'POST', 'register', $body);
    echo "\nDone\n";
} catch (Throwable $e) {
    echo "Exception caught in test script:\n" . $e->getMessage() . "\n" . $e->getTraceAsString();
}
