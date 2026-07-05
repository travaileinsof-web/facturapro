<?php
$pdo = new PDO('sqlite:C:/Users/GBESSI/Desktop/OFFICIAL_PROJECTS/facturapro/backend/database.sqlite');

// 1. Ajouter la colonne role si elle n'existe pas
try {
    $pdo->exec("ALTER TABLE Account ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
    echo "Colonne 'role' ajoutée avec succès." . PHP_EOL;
} catch (Exception $e) {
    echo "Colonne 'role' déjà existante ou erreur: " . $e->getMessage() . PHP_EOL;
}

// 2. Mettre à jour l'admin
$stmt = $pdo->prepare("UPDATE Account SET role = 'admin' WHERE email = ?");
$stmt->execute(['einsof.infos@gmail.com']);
echo "Role admin défini pour einsof.infos@gmail.com — lignes affectées: " . $stmt->rowCount() . PHP_EOL;

// 3. Vérification
$rows = $pdo->query("SELECT email, role FROM Account")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo $r['email'] . ' => ' . ($r['role'] ?? 'NULL') . PHP_EOL;
}
