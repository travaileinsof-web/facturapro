<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query("SELECT * FROM ProformaInvoice");
    $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $fixedCount = 0;
    
    $pdo->beginTransaction();

    foreach ($invoices as $inv) {
        $items = json_decode($inv['items'], true);
        if (!is_array($items)) continue;

        $calculatedSubtotal = 0;
        foreach ($items as $item) {
            $calculatedSubtotal += (isset($item['unitPrice']) ? (float)$item['unitPrice'] : 0) * (isset($item['quantity']) ? (float)$item['quantity'] : 1);
        }

        if ($calculatedSubtotal > 0) {
            $currentSubtotal = (float)$inv['subtotal'];
            
            // Si le sous-total en base est différent de ce qui est calculé depuis les items JSON
            if (abs($currentSubtotal - $calculatedSubtotal) > 0.01) {
                // Le taux de corruption pour cette facture :
                $rate = $currentSubtotal / $calculatedSubtotal;
                
                // On divise les montants par ce taux pour revenir à la normale
                $trueSubtotal = $currentSubtotal / $rate;
                $trueTaxAmount = (float)$inv['taxAmount'] / $rate;
                $trueDiscount = (float)$inv['discount'] / $rate;
                $trueTotal = (float)$inv['total'] / $rate;

                $updateStmt = $pdo->prepare("UPDATE ProformaInvoice SET subtotal = ?, taxAmount = ?, discount = ?, total = ? WHERE id = ?");
                $updateStmt->execute([$trueSubtotal, $trueTaxAmount, $trueDiscount, $trueTotal, $inv['id']]);
                
                $fixedCount++;
            }
        }
    }
    
    $pdo->commit();

    echo json_encode(["status" => "Succès", "message" => "$fixedCount factures ont été recalculées et réparées individuellement !"]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["error" => $e->getMessage()]);
}
