<?php
$pdo = new PDO('sqlite:backend/facturapro.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$hash = password_hash('admin123', PASSWORD_DEFAULT);

$pdo->exec("UPDATE Account SET passwordHash = '$hash', role = 'admin' WHERE email = 'einsof.infos@gmail.com'");
$pdo->exec("UPDATE Account SET passwordHash = '$hash' WHERE email = 'comptable@gmail.com'");

$stmt = $pdo->query("SELECT email, role, companyName FROM Account");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Accounts updated. Users:\n";
print_r($users);






