<?php
try {
    $pdo = new PDO('sqlite:backend/facturapro.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Add columns if they don't exist
    $pdo->exec("ALTER TABLE Account ADD COLUMN secondaryColor VARCHAR(20) NULL;");
    echo "Column secondaryColor added.\n";
} catch (Exception $e) {
    echo "Error (or column already exists): " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE Account ADD COLUMN accentColor VARCHAR(20) NULL;");
    echo "Column accentColor added.\n";
} catch (Exception $e) {
    echo "Error (or column already exists): " . $e->getMessage() . "\n";
}
