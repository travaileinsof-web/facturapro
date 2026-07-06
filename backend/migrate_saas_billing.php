<?php
require 'config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Détection du type de BDD
    $isPgsql = strpos(DB_DSN, 'pgsql:') === 0;

    echo "Connexion à la BDD réussie.\n";

    // 1. Table WebhookLog
    $queryWebhook = $isPgsql ? "
        CREATE TABLE IF NOT EXISTS WebhookLog (
            id SERIAL PRIMARY KEY,
            event_type VARCHAR(100) NULL,
            reference VARCHAR(100) NULL,
            payload TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'success',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    " : "
        CREATE TABLE IF NOT EXISTS WebhookLog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type VARCHAR(100) NULL,
            reference VARCHAR(100) NULL,
            payload TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'success',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ";
    
    $pdo->exec($queryWebhook);
    echo "Table WebhookLog créée avec succès.\n";

    // 2. Table SubscriptionInvoice
    $queryInvoice = $isPgsql ? "
        CREATE TABLE IF NOT EXISTS SubscriptionInvoice (
            id VARCHAR(50) PRIMARY KEY,
            accountId VARCHAR(50) NOT NULL,
            invoiceNumber VARCHAR(100) NOT NULL,
            amount DECIMAL(15, 2) NOT NULL,
            pdfUrl TEXT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE
        );
    " : "
        CREATE TABLE IF NOT EXISTS SubscriptionInvoice (
            id VARCHAR(50) PRIMARY KEY,
            accountId VARCHAR(50) NOT NULL,
            invoiceNumber VARCHAR(100) NOT NULL,
            amount DECIMAL(15, 2) NOT NULL,
            pdfUrl TEXT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE
        );
    ";

    $pdo->exec($queryInvoice);
    echo "Table SubscriptionInvoice créée avec succès.\n";

    echo "\nMigration terminée avec succès !\n";

} catch (PDOException $e) {
    die("Erreur de migration : " . $e->getMessage() . "\n");
}
