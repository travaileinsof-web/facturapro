<?php
$pdo = new PDO('sqlite:backend/facturapro.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$queries = [
    "ALTER TABLE ProformaInvoice ADD COLUMN type VARCHAR(50) DEFAULT 'facture'",
    "ALTER TABLE ProformaInvoice ADD COLUMN lastReminderDate DATETIME NULL",
    "ALTER TABLE CatalogItem ADD COLUMN category VARCHAR(100) DEFAULT 'Général'",
    "ALTER TABLE CatalogItem ADD COLUMN components TEXT NULL"
];

foreach ($queries as $q) {
    try {
        $pdo->exec($q);
        echo "Executed: $q\n";
    } catch(Exception $e) {
        echo "Error on $q: " . $e->getMessage() . "\n";
    }
}

$pdo->exec(file_get_contents('backend/database.sql'));
echo "Database script applied\n";
