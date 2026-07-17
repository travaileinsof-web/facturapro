<?php
require_once __DIR__ . '/config.php';
$pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
$stmt = $pdo->query("SELECT * FROM Client LIMIT 1");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
print_r($row);
