<?php
require 'config.php';
$pdo = new PDO('sqlite:' . DB_PATH);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== TABLES DISPONIBLES ===\n";
$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $t) {
    echo "  📋 $t\n";
}

echo "\n=== COMPTES ENREGISTRÉS ===\n";
$accounts = $pdo->query("SELECT id, email, companyName, subscriptionStatus, smtpHost, smtpUser, autoRemindersEnabled, createdAt FROM Account")->fetchAll(PDO::FETCH_ASSOC);
if (empty($accounts)) {
    echo "  ⚠️ Aucun compte enregistré.\n";
} else {
    foreach ($accounts as $a) {
        echo "  👤 {$a['companyName']} ({$a['email']})\n";
        echo "     Status : {$a['subscriptionStatus']}\n";
        echo "     SMTP configuré : " . ($a['smtpHost'] ? "✅ {$a['smtpHost']} / {$a['smtpUser']}" : "❌ Non") . "\n";
        echo "     Relances auto : " . ($a['autoRemindersEnabled'] ? "✅ Activées" : "❌ Désactivées") . "\n";
        echo "     Créé le : {$a['createdAt']}\n";
    }
}

echo "\n=== STATISTIQUES ===\n";
echo "  Factures : " . $pdo->query("SELECT COUNT(*) FROM ProformaInvoice")->fetchColumn() . "\n";
echo "  Clients  : " . $pdo->query("SELECT COUNT(*) FROM Client")->fetchColumn() . "\n";
echo "  Reçus    : " . $pdo->query("SELECT COUNT(*) FROM Receipt")->fetchColumn() . "\n";
echo "  Dépenses : " . $pdo->query("SELECT COUNT(*) FROM Expense")->fetchColumn() . "\n";
