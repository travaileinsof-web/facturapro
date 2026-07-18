<?php
/**
 * reset_to_gnf.php
 * 
 * Ce script réconcilie l'état de la base de données après les conversions partielles.
 * Il utilise les ITEMS JSON de chaque facture comme source de vérité,
 * et recalcule les totaux des colonnes pour qu'ils correspondent.
 * 
 * Pour les tables sans JSON (CatalogItem, Expense, Receipt), il faut connaître
 * le taux de conversion XOF→GNF qui a été appliqué.
 * 
 * Usage: GET /api/reset_to_gnf.php?mode=check   => vérifie l'état sans modifier
 *        GET /api/reset_to_gnf.php?mode=fix      => applique la réconciliation
 */
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/config.php';

$mode = $_GET['mode'] ?? 'check';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $report = [
        'mode' => $mode,
        'invoice_discrepancies' => [],
        'summary' => []
    ];

    // ──────────────────────────────────────────────────────────────────
    // 1. Analyser les factures : comparer total des items vs total colonne
    // ──────────────────────────────────────────────────────────────────
    $stmt = $pdo->query("SELECT id, items, subtotal, taxRate, taxAmount, discount, total, number FROM ProformaInvoice");
    $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $fixed = 0;
    $mismatches = 0;

    $pdo->beginTransaction();

    foreach ($invoices as $inv) {
        if (empty($inv['items'])) continue;
        $items = json_decode($inv['items'], true);
        if (!is_array($items)) continue;

        // Calculer le sous-total depuis les items JSON
        $calculatedSubtotal = 0;
        foreach ($items as $item) {
            $unitPrice = (float)($item['unitPrice'] ?? 0);
            $qty = (float)($item['quantity'] ?? 1);
            $calculatedSubtotal += round($unitPrice * $qty, 2);
        }

        $storedSubtotal = (float)$inv['subtotal'];
        $diff = abs($calculatedSubtotal - $storedSubtotal);

        if ($diff > 0.5) { // Tolérance de 0.50 pour les arrondis
            $mismatches++;
            $taxRate = (float)($inv['taxRate'] ?? 0);
            $discount = (float)($inv['discount'] ?? 0);
            $newTaxAmount = round(($calculatedSubtotal - $discount) * $taxRate / 100, 2);
            $newTotal = round($calculatedSubtotal - $discount + $newTaxAmount, 2);

            $report['invoice_discrepancies'][] = [
                'id' => $inv['id'],
                'number' => $inv['number'],
                'items_subtotal' => $calculatedSubtotal,
                'stored_subtotal' => $storedSubtotal,
                'diff' => $diff,
                'new_total' => $newTotal
            ];

            if ($mode === 'fix') {
                $pdo->prepare("UPDATE ProformaInvoice SET subtotal = ?, taxAmount = ?, total = ? WHERE id = ?")
                    ->execute([$calculatedSubtotal, $newTaxAmount, $newTotal, $inv['id']]);
                $fixed++;
            }
        }
    }

    if ($mode === 'fix') {
        $pdo->commit();
    } else {
        $pdo->rollBack();
    }

    $report['summary'] = [
        'total_invoices_scanned' => count($invoices),
        'discrepancies_found' => $mismatches,
        'invoices_fixed' => $fixed,
        'message' => $mode === 'fix' 
            ? "✅ $fixed factures réconciliées avec succès. Les totaux correspondent maintenant aux items."
            : "⚠️ $mismatches factures avec incohérence détectées. Appelez avec ?mode=fix pour corriger."
    ];

    echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['error' => $e->getMessage()]);
}
