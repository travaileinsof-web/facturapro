<?php
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $tables = [
        'account' => [
            "legalForm VARCHAR(50) NULL",
            "rccm VARCHAR(100) NULL",
            "taxRegime VARCHAR(100) NULL",
            "defaultVatRate DECIMAL(5,2) DEFAULT 18.0"
        ],
        'client' => [
            "clientType VARCHAR(50) DEFAULT 'professionnel'",
            "nif VARCHAR(100) NULL",
            "rccm VARCHAR(100) NULL"
        ],
        'proformainvoice' => [
            "validityDate TIMESTAMP NULL",
            "paymentTerms TEXT NULL",
            "vatWithholdingApplied INTEGER DEFAULT 0",
            "vatExemptReason TEXT NULL",
            "sourceDocumentId VARCHAR(50) NULL"
        ],
        'receipt' => [
            "receivedBy VARCHAR(255) NULL"
        ]
    ];

    foreach ($tables as $table => $columns) {
        foreach ($columns as $columnDef) {
            $columnName = explode(' ', trim($columnDef))[0];
            try {
                // Check if column exists in Postgres
                $stmt = $pdo->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = :table AND column_name = :column");
                $stmt->execute(['table' => strtolower($table), 'column' => strtolower($columnName)]);
                
                if (!$stmt->fetch()) {
                    $pdo->exec("ALTER TABLE \"$table\" ADD COLUMN \"$columnName\" " . substr($columnDef, strlen($columnName) + 1));
                    echo "Added column $columnName to $table.\n";
                } else {
                    echo "Column $columnName already exists in $table.\n";
                }
            } catch (Exception $e) {
                echo "Error adding $columnName to $table: " . $e->getMessage() . "\n";
            }
        }
    }

    echo "Migration completed successfully.\n";

} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
