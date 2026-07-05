<?php
$pdo = new PDO('sqlite:C:/Users/GBESSI/Desktop/OFFICIAL_PROJECTS/facturapro/backend/database.sqlite');

// Voir tous les comptes
$rows = $pdo->query("SELECT email, role FROM Account")->fetchAll(PDO::FETCH_ASSOC);
echo "=== Comptes existants ===" . PHP_EOL;
foreach ($rows as $r) {
    echo $r['email'] . ' => role: ' . ($r['role'] ?? 'NULL') . PHP_EOL;
}

if (empty($rows)) {
    echo "AUCUN compte trouvé dans la base !" . PHP_EOL;

    // Créer le compte admin
    $id = bin2hex(random_bytes(16));
    $token = bin2hex(random_bytes(32));
    $hash = password_hash('admin123', PASSWORD_DEFAULT);
    $pdo->prepare("INSERT INTO Account (id, email, passwordHash, token, companyName, firstName, lastName, subscriptionPlan, subscriptionStatus, role)
                   VALUES (?, 'einsof.infos@gmail.com', ?, ?, 'EINSOF DIGIT', 'Super', 'Admin', 'premium', 'active', 'admin')")
        ->execute([$id, $hash, $token]);
    echo "Compte admin créé : einsof.infos@gmail.com / admin123" . PHP_EOL;
}
