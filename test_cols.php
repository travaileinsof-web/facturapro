<?php
require 'backend/config.php';
$pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
$stmt = $pdo->query('SELECT * FROM Account LIMIT 1');
print_r($stmt->fetch(PDO::FETCH_ASSOC));
