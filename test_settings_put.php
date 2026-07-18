<?php
require 'backend/config.php';
require 'backend/controllers/SettingsController.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $body = [
        'companyName' => 'Test Co Updated',
        'currency' => 'XOF',
        'legalForm' => 'SA',
        'rccm' => 'Test'
    ];
    $accountId = 'f84cbfee-cd51-459d-9e8e-fdfd3969e6cc';
    $stmt = $pdo->prepare("SELECT * FROM Account WHERE id = ?");
    $stmt->execute([$accountId]);
    $currentAccount = $stmt->fetch();
    SettingsController::handle($pdo, 'PUT', $accountId, $body, $currentAccount);
    echo "SUCCESS\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
