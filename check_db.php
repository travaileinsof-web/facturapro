<?php
$pdo = new PDO('sqlite:backend/facturapro.sqlite');
$stmt = $pdo->query("SELECT email, smtpUser, smtpPass, smtpHost, smtpEncryption FROM Account");
$accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($accounts);
