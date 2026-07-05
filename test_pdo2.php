<?php
require 'backend/config.php';
$pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
$pdo->setAttribute(PDO::ATTR_STATEMENT_CLASS, ['MyPDOStatement', []]);
$stmt = $pdo->prepare('SELECT * FROM Account LIMIT 1');
$stmt->execute();
print_r($stmt->fetch(PDO::FETCH_ASSOC));
