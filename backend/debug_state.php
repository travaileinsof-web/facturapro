<?php
/**
 * debug_state.php - Diagnostic de l'état actuel de la base de données
 * Montre les montants réels pour identifier ce qui est en XOF vs GNF
 */
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Devise actuelle du compte
    $accounts = $pdo->query("SELECT id, companyname, currency FROM Account LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

    // 2. État des factures (montants + items JSON)
    $invoices = $pdo->query("SELECT id, number, subtotal, total, items FROM ProformaInvoice ORDER BY createdat DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    
    $invoiceSummary = [];
    foreach ($invoices as $inv) {
        $items = json_decode($inv['items'], true);
        $firstItemPrice = null;
        if (is_array($items) && count($items) > 0) {
            $firstItemPrice = $items[0]['unitPrice'] ?? null;
        }
        $invoiceSummary[] = [
            'number' => $inv['number'],
            'subtotal_column' => (float)$inv['subtotal'],
            'total_column' => (float)$inv['total'],
            'first_item_unitPrice' => $firstItemPrice,
            'items_count' => is_array($items) ? count($items) : 0,
        ];
    }

    // 3. État du catalogue (premiers 5 items)
    $catalog = $pdo->query("SELECT name, unitprice FROM CatalogItem ORDER BY createdat DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

    // 4. État des dépenses (premières 5)
    $expenses = [];
    try {
        $expenses = $pdo->query("SELECT category, amount FROM Expense ORDER BY createdat DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    } catch(Exception $e) { $expenses = ['error' => $e->getMessage()]; }

    // 5. État des reçus (premiers 5)
    $receipts = [];
    try {
        $receipts = $pdo->query("SELECT amount FROM Receipt ORDER BY createdat DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    } catch(Exception $e) { $receipts = ['error' => $e->getMessage()]; }

    echo json_encode([
        'accounts' => $accounts,
        'invoices' => $invoiceSummary,
        'catalog' => $catalog,
        'expenses' => $expenses,
        'receipts' => $receipts,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
