<?php
// Migration: Create Company table for multi-company support
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/facturapro.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create Company table
    $pdo->exec("CREATE TABLE IF NOT EXISTS Company (
        id VARCHAR(50) PRIMARY KEY,
        accountId VARCHAR(50) NOT NULL,
        isDefault INTEGER DEFAULT 0,
        name VARCHAR(255) NOT NULL,
        slogan VARCHAR(255) NULL,
        address TEXT NULL,
        phone VARCHAR(50) NULL,
        email VARCHAR(255) NULL,
        website VARCHAR(255) NULL,
        taxId VARCHAR(100) NULL,
        legalForm VARCHAR(50) NULL,
        rccm VARCHAR(100) NULL,
        taxRegime VARCHAR(100) NULL,
        defaultVatRate DECIMAL(5,2) DEFAULT 18.0,
        bankName VARCHAR(255) NULL,
        bankAccount VARCHAR(255) NULL,
        logo TEXT NULL,
        stamp TEXT NULL,
        signature TEXT NULL,
        primaryColor VARCHAR(20) DEFAULT '#0f172a',
        currency VARCHAR(10) DEFAULT 'XOF',
        smtpHost VARCHAR(255) NULL,
        smtpPort VARCHAR(10) NULL,
        smtpUser VARCHAR(255) NULL,
        smtpPass TEXT NULL,
        smtpFrom VARCHAR(255) NULL,
        smtpFromName VARCHAR(255) NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE
    )");

    // Add activeCompanyId to Account if not exists
    try {
        $pdo->exec("ALTER TABLE Account ADD COLUMN activeCompanyId VARCHAR(50) NULL");
        echo "Column activeCompanyId added to Account.\n";
    } catch (Exception $e) {
        echo "Column activeCompanyId already exists (skipping).\n";
    }

    // Add smtpHost/smtpPort to Account if not exists (for backward compat)
    foreach (['smtpHost', 'smtpPort', 'email'] as $col) {
        try {
            $pdo->exec("ALTER TABLE Account ADD COLUMN $col VARCHAR(255) NULL");
            echo "Column $col added to Account.\n";
        } catch (Exception $e) {
            echo "Column $col already exists (skipping).\n";
        }
    }

    // Migrate existing account data into Company if no companies exist
    $accounts = $pdo->query("SELECT * FROM Account")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($accounts as $acc) {
        $existing = $pdo->prepare("SELECT id FROM Company WHERE accountId = ?");
        $existing->execute([$acc['id']]);
        if ($existing->fetch()) {
            echo "Companies already exist for account {$acc['id']}, skipping.\n";
            continue;
        }

        $companyId = bin2hex(random_bytes(8));
        // 21 cols total: id, accountId, isDefault(literal 1), then 18 dynamic = 20 ? placeholders
        $stmt = $pdo->prepare("INSERT INTO Company (id, accountId, isDefault, name, slogan, address, phone, email, website, taxId, bankName, bankAccount, logo, stamp, signature, primaryColor, currency, smtpHost, smtpPort, smtpUser, smtpPass) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $companyId,
            $acc['id'],
            1,
            $acc['companyName'] ?? 'Mon Entreprise',
            $acc['slogan'] ?? null,
            $acc['address'] ?? null,
            $acc['phone'] ?? null,
            $acc['email'] ?? null,
            $acc['website'] ?? null,
            $acc['taxId'] ?? null,
            $acc['bankName'] ?? null,
            $acc['bankAccount'] ?? null,
            $acc['logo'] ?? null,
            $acc['stamp'] ?? null,
            $acc['signature'] ?? null,
            $acc['primaryColor'] ?? '#0f172a',
            $acc['currency'] ?? 'XOF',
            $acc['smtpHost'] ?? null,
            $acc['smtpPort'] ?? null,
            $acc['smtpUser'] ?? null,
            $acc['smtpPass'] ?? null,
        ]);

        // Set as active company
        $pdo->prepare("UPDATE Account SET activeCompanyId = ? WHERE id = ?")
            ->execute([$companyId, $acc['id']]);

        echo "Created default company for account {$acc['id']}.\n";
    }

    echo "\n✅ Migration completed successfully!\n";
} catch (Exception $e) {
    echo "❌ Migration error: " . $e->getMessage() . "\n";
}
