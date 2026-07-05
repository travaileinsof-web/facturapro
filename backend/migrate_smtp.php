<?php
$dbPath = __DIR__ . '/facturapro.sqlite';
try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Ajouter les colonnes SMTP
    $queries = [
        "ALTER TABLE Account ADD COLUMN smtpHost TEXT;",
        "ALTER TABLE Account ADD COLUMN smtpPort TEXT;",
        "ALTER TABLE Account ADD COLUMN smtpUser TEXT;",
        "ALTER TABLE Account ADD COLUMN smtpPass TEXT;"
    ];

    foreach ($queries as $sql) {
        try {
            $pdo->exec($sql);
            echo "Succès: $sql\n";
        } catch(Exception $e) {
            echo "Ignoré ou déjà exécuté: " . $e->getMessage() . "\n";
        }
    }
    echo "Migration terminée.\n";
} catch(Exception $e) {
    echo "Erreur fatale: " . $e->getMessage() . "\n";
}
