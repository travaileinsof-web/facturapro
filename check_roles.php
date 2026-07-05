<?php
$pdo = new PDO('sqlite:C:/Users/GBESSI/Desktop/OFFICIAL_PROJECTS/facturapro/backend/database.sqlite');
$stmt = $pdo->query('SELECT id, email, role FROM Account');
foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
  echo $r['email'] . ' => role: ' . ($r['role'] ?? 'NULL') . PHP_EOL;
}
