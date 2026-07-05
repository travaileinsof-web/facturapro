<?php
$pdo = new PDO('sqlite:backend/facturapro.sqlite');
$stmt = $pdo->query('SELECT primaryColor, secondaryColor, accentColor, logo, signature, stamp FROM Account LIMIT 1');
print_r($stmt->fetch(PDO::FETCH_ASSOC));
