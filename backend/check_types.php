<?php
require 'backend/config.php';
$pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$stmt = $pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'proformainvoice' ORDER BY ordinal_position");
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo $r['column_name'] . ' => ' . $r['data_type'] . PHP_EOL;
}
