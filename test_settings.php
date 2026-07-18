<?php
require 'backend/config.php';
require 'backend/controllers/SettingsController.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->query("SELECT * FROM Account LIMIT 1");
    $account = $stmt->fetch();
    SettingsController::handle($pdo, 'PUT', $account['id'], ['legalForm' => 'SARL', 'rccm' => 'Test', 'taxRegime' => 'TPS', 'defaultVatRate' => 18], $account);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
