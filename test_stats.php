<?php
require 'backend/config.php';
require 'backend/controllers/StatsController.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $_GET['startDate'] = '2026-07-01';
    $_GET['endDate'] = '2026-07-31';
    StatsController::handle($pdo, 'GET', 'f84cbfee-cd51-459d-9e8e-fdfd3969e6cc');
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
