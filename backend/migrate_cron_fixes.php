<?php
/**
 * migrate_cron_fixes.php
 * Ajoute les colonnes manquantes pour le système de relances automatiques.
 */
require 'config.php';
$pdo = new PDO('sqlite:' . DB_PATH);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$migrations = [
    "ALTER TABLE ProformaInvoice ADD COLUMN remindersSent TEXT DEFAULT '[]'",
    "ALTER TABLE Account ADD COLUMN autoRemindersEnabled INTEGER DEFAULT 0",
    "ALTER TABLE Account ADD COLUMN autoReminderDays TEXT DEFAULT '[-5,-3,0]'",
];

foreach ($migrations as $sql) {
    try {
        $pdo->exec($sql);
        echo "✅ OK: $sql\n";
    } catch (Exception $e) {
        echo "⏭️  Déjà présente (ignoré): " . $e->getMessage() . "\n";
    }
}
echo "\nMigration terminée.\n";
