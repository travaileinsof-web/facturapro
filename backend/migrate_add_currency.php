<?php
/**
 * migrate_add_currency.php
 * Ajoute la colonne `currency` à la table Account si elle n'existe pas déjà.
 */
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $results = [];

    // 1. Ajouter currency à Account si elle n'existe pas
    try {
        $pdo->exec("ALTER TABLE Account ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'XOF'");
        $results[] = "✅ Colonne 'currency' ajoutée à Account (DEFAULT 'XOF')";
    } catch(Exception $e) {
        $results[] = "⚠️ currency: " . $e->getMessage();
    }

    // 2. Vérifier les colonnes actuelles de Account
    $cols = $pdo->query("SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'account' ORDER BY ordinal_position")->fetchAll(PDO::FETCH_ASSOC);

    // 3. Lire l'état actuel (currency + montants)
    $accounts = $pdo->query("SELECT id, companyname, currency FROM Account LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);

    $invoices = $pdo->query("SELECT number, subtotal, total FROM ProformaInvoice ORDER BY createdat DESC LIMIT 6")->fetchAll(PDO::FETCH_ASSOC);

    $catalog = [];
    try {
        $catalog = $pdo->query("SELECT name, unitprice FROM CatalogItem ORDER BY createdat DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    } catch(Exception $e) { $catalog = ['error' => $e->getMessage()]; }

    $expenses = [];
    try {
        $expenses = $pdo->query("SELECT category, amount FROM Expense ORDER BY createdat DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    } catch(Exception $e) { $expenses = ['error' => $e->getMessage()]; }

    echo json_encode([
        'migration_results' => $results,
        'account_columns' => $cols,
        'accounts' => $accounts,
        'invoices' => $invoices,
        'catalog' => $catalog,
        'expenses' => $expenses,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
