<?php
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Checking Neon PostgreSQL database schema...\n";

    // Columns to ensure on Account
    $accountCols = [
        'currency' => "VARCHAR(10) DEFAULT 'XOF'",
        'autoRemindersEnabled' => "INTEGER DEFAULT 0",
        'autoReminderDays' => "VARCHAR(50) DEFAULT '[-5, -3, 0]'"
    ];

    foreach ($accountCols as $col => $def) {
        try {
            $pdo->exec("ALTER TABLE Account ADD COLUMN $col $def");
            echo "Successfully added $col to Account.\n";
        } catch (Exception $e) {
            echo "Notice: $col in Account might already exist.\n";
        }
    }

    // Columns to ensure on Company
    $companyCols = [
        'currency' => "VARCHAR(10) DEFAULT 'XOF'",
        'smtpHost' => "VARCHAR(255) NULL",
        'smtpPort' => "VARCHAR(10) NULL",
        'smtpEncryption' => "VARCHAR(50) DEFAULT 'tls'",
        'smtpUser' => "VARCHAR(255) NULL",
        'smtpPass' => "VARCHAR(255) NULL",
        'smtpFrom' => "VARCHAR(255) NULL",
        'smtpFromName' => "VARCHAR(255) NULL"
    ];

    foreach ($companyCols as $col => $def) {
        try {
            $pdo->exec("ALTER TABLE Company ADD COLUMN $col $def");
            echo "Successfully added $col to Company.\n";
        } catch (Exception $e) {
            echo "Notice: $col in Company might already exist.\n";
        }
    }

    echo "Neon schema patch complete!\n";

} catch (Exception $e) {
    die("Database Connection Error: " . $e->getMessage() . "\n");
}
