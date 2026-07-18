<?php
require 'backend/config.php';
try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS InvoiceReminderLog (
            id VARCHAR(50) PRIMARY KEY,
            accountId VARCHAR(50) NOT NULL,
            invoiceId VARCHAR(50) NOT NULL,
            method VARCHAR(50) DEFAULT 'email',
            sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE,
            FOREIGN KEY (invoiceId) REFERENCES ProformaInvoice(id) ON DELETE CASCADE
        );
    ");
    echo "Table InvoiceReminderLog created successfully!\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
