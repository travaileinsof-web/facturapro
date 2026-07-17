<?php
// Script: Crée les index manquants sur Neon pour accélérer toutes les requêtes
require 'backend/config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $indexes = [
        // Receipt: filtres fréquents
        "CREATE INDEX IF NOT EXISTS idx_receipt_accountid ON Receipt(accountId)",
        "CREATE INDEX IF NOT EXISTS idx_receipt_accountid_paymentdate ON Receipt(accountId, paymentDate)",
        "CREATE INDEX IF NOT EXISTS idx_receipt_proformainvoiceid ON Receipt(proformaInvoiceId)",
        
        // ProformaInvoice: filtres fréquents  
        "CREATE INDEX IF NOT EXISTS idx_proforma_accountid ON ProformaInvoice(accountId)",
        "CREATE INDEX IF NOT EXISTS idx_proforma_accountid_type_status ON ProformaInvoice(accountId, type, status)",
        "CREATE INDEX IF NOT EXISTS idx_proforma_accountid_issuedate ON ProformaInvoice(accountId, issueDate)",
        "CREATE INDEX IF NOT EXISTS idx_proforma_clientid ON ProformaInvoice(clientId)",
        
        // Client
        "CREATE INDEX IF NOT EXISTS idx_client_accountid ON Client(accountId)",
        
        // CatalogItem
        "CREATE INDEX IF NOT EXISTS idx_catalogitem_accountid ON CatalogItem(accountId)",
        
        // Expense
        "CREATE INDEX IF NOT EXISTS idx_expense_accountid ON Expense(accountId)",
        "CREATE INDEX IF NOT EXISTS idx_expense_accountid_expensedate ON Expense(accountId, expenseDate)",
        
        // Notification
        "CREATE INDEX IF NOT EXISTS idx_notification_accountid_isread ON Notification(accountId, isRead)",
        
        // Account: lookup par token (critique — fait à chaque requête authentifiée)
        "CREATE INDEX IF NOT EXISTS idx_account_token ON Account(token)",
        
        // InvoiceReminderLog
        "CREATE INDEX IF NOT EXISTS idx_reminderlog_accountid ON InvoiceReminderLog(accountId)",
    ];

    foreach ($indexes as $sql) {
        try {
            $pdo->exec($sql);
            $name = preg_match('/idx_\w+/', $sql, $m) ? $m[0] : '?';
            echo "OK: $name" . PHP_EOL;
        } catch (Exception $e) {
            echo "WARN: " . $e->getMessage() . PHP_EOL;
        }
    }

    echo PHP_EOL . "=== Indexes créés avec succès ===" . PHP_EOL;

} catch (Exception $e) {
    echo "ERREUR: " . $e->getMessage() . PHP_EOL;
}
