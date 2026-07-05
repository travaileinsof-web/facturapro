<?php
$pdo = new PDO('sqlite:C:/Users/GBESSI/Desktop/OFFICIAL_PROJECTS/facturapro/backend/facturapro.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$sql = "CREATE TABLE IF NOT EXISTS SubscriptionPayment (
    id VARCHAR(50) PRIMARY KEY,
    accountId VARCHAR(50),
    amount DECIMAL(10,2),
    currency VARCHAR(10),
    plan VARCHAR(50),
    status VARCHAR(50),
    transactionId VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)";
$pdo->exec($sql);
echo "Table SubscriptionPayment créée avec succès.\n";
