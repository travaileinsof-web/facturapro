<?php
$pdo = new PDO('sqlite:C:/Users/GBESSI/Desktop/OFFICIAL_PROJECTS/facturapro/backend/database.sqlite');

// Supprimer le doublon (garder le plus ancien)
$rows = $pdo->query("SELECT id, email, role, createdAt, token FROM Account WHERE email = 'einsof.infos@gmail.com' ORDER BY createdAt ASC")->fetchAll(PDO::FETCH_ASSOC);

echo "Comptes einsof.infos@gmail.com:" . PHP_EOL;
foreach ($rows as $r) {
    echo "  ID: " . $r['id'] . " | Role: " . $r['role'] . " | CreatedAt: " . $r['createdAt'] . " | Token: " . substr($r['token'], 0, 12) . "..." . PHP_EOL;
}

if (count($rows) > 1) {
    // Garder le premier (le plus ancien), supprimer les autres
    $keepId = $rows[0]['id'];
    // S'assurer que le premier a bien le role admin
    $pdo->prepare("UPDATE Account SET role = 'admin' WHERE id = ?")->execute([$keepId]);
    
    for ($i = 1; $i < count($rows); $i++) {
        $pdo->prepare("DELETE FROM Account WHERE id = ?")->execute([$rows[$i]['id']]);
        echo "Supprimé doublon: " . $rows[$i]['id'] . PHP_EOL;
    }
}

// Réinitialiser le mot de passe et le token pour le compte final
$newToken = bin2hex(random_bytes(32));
$newHash = password_hash('admin123', PASSWORD_DEFAULT);
$pdo->prepare("UPDATE Account SET token = ?, passwordHash = ?, role = 'admin' WHERE email = 'einsof.infos@gmail.com'")
    ->execute([$newToken, $newHash]);

echo PHP_EOL . "=== Compte final ===" . PHP_EOL;
$final = $pdo->query("SELECT id, email, role, token FROM Account WHERE email = 'einsof.infos@gmail.com'")->fetch(PDO::FETCH_ASSOC);
echo "Email: " . $final['email'] . PHP_EOL;
echo "Role:  " . $final['role'] . PHP_EOL;
echo "Token: " . substr($final['token'], 0, 20) . "..." . PHP_EOL;
echo PHP_EOL . "Mot de passe réinitialisé à: admin123" . PHP_EOL;
echo "CONNECTE-TOI MAINTENANT avec einsof.infos@gmail.com / admin123" . PHP_EOL;
