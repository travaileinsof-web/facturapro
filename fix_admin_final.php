<?php
$pdo = new PDO('sqlite:C:/Users/GBESSI/Desktop/OFFICIAL_PROJECTS/facturapro/backend/database.sqlite');

echo "=== Tous les comptes ===" . PHP_EOL;
$rows = $pdo->query("SELECT id, email, firstName, lastName, role, token FROM Account")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo sprintf("Email: %s | Role: %s | Token: %s... | Name: %s %s",
        $r['email'],
        $r['role'] ?? 'NULL',
        substr($r['token'] ?? '', 0, 10),
        $r['firstName'] ?? '',
        $r['lastName'] ?? ''
    ) . PHP_EOL;
}

echo PHP_EOL . "=== Mise à jour: tous les einsof.infos@gmail.com => admin ===" . PHP_EOL;
$stmt = $pdo->prepare("UPDATE Account SET role = 'admin' WHERE email = ?");
$stmt->execute(['einsof.infos@gmail.com']);
echo "Lignes modifiées: " . $stmt->rowCount() . PHP_EOL;

echo PHP_EOL . "=== Vérification finale ===" . PHP_EOL;
$rows2 = $pdo->query("SELECT email, role FROM Account")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows2 as $r) {
    echo $r['email'] . ' => ' . $r['role'] . PHP_EOL;
}
