<?php
require 'backend/config.php';
require 'backend/controllers/ClientController.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->query("SELECT * FROM Account LIMIT 1");
    $account = $stmt->fetch();
    ClientController::handle($pdo, 'POST', null, $account['id'], ['name' => 'Test', 'clientType' => 'professionnel', 'nif' => '123', 'rccm' => '456']);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
