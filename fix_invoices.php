<?php
require_once 'backend/config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
} catch (PDOException $e) {
    die("Erreur de connexion : " . $e->getMessage());
}

$stmt = $pdo->query("SELECT id, number, subtotal, total, items, taxrate, discount FROM ProformaInvoice");
$invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

$updatedCount = 0;

foreach ($invoices as $inv) {
    $items = json_decode($inv['items'], true);
    
    if (!$items || !is_array($items) || empty($items)) {
        // Si les articles sont vides mais qu'il y a des paiements, on ne met pas le total à 0 si possible.
        // Mais on ne peut pas l'inventer s'il n'y a pas d'articles.
        // Vérifions s'il a des reçus.
        $rStmt = $pdo->prepare("SELECT SUM(amount) as paid FROM Receipt WHERE proformainvoiceid = ?");
        $rStmt->execute([$inv['id']]);
        $paid = $rStmt->fetchColumn();
        if ($paid > 0 && $inv['total'] == 0) {
            // Restore total based on paid amount to avoid 0 total with paid. (Assuming it was fully paid or partly, we at least set total = paid).
            $items = [['description' => 'Article restauré', 'quantity' => 1, 'unitPrice' => (float)$paid, 'total' => (float)$paid]];
            $subtotal = (float)$paid;
            $taxAmount = 0;
            $discount = 0;
            $total = (float)$paid;
            $itemsJson = json_encode($items);
            $upd = $pdo->prepare("UPDATE ProformaInvoice SET items = ?, subtotal = ?, taxamount = ?, discount = ?, total = ? WHERE id = ?");
            $upd->execute([$itemsJson, round($subtotal, 2), round($taxAmount, 2), round($discount, 2), round($total, 2), $inv['id']]);
            $updatedCount++;
            echo "Facture {$inv['id']} (" . ($inv['number'] ?? 'N/A') . ") restaurée avec montant payé : $total\n";
        }
        continue;
    }
    
    $subtotal = 0;
    foreach ($items as &$item) {
        $qty = isset($item['quantity']) ? (float)$item['quantity'] : 1;
        $price = isset($item['unitPrice']) ? (float)$item['unitPrice'] : 0;
        $totalItem = $qty * $price;
        $item['total'] = $totalItem;
        $subtotal += $totalItem;
    }
    unset($item);
    
    $taxRate = isset($inv['taxrate']) ? (float)$inv['taxrate'] : 0;
    $taxAmount = ($subtotal * $taxRate) / 100;
    
    $discountPercentage = 0; // Pas de champ dédié, discount était un montant fixe dans certaines versions ou un champ à part
    // On va juste mettre discount à 0 ou utiliser ce qui était là s'il n'y a pas de pourcentage
    $discount = 0;
    
    $total = $subtotal + $taxAmount - $discount;
    
    $itemsJson = json_encode($items);
    
    $upd = $pdo->prepare("UPDATE ProformaInvoice SET items = ?, subtotal = ?, taxamount = ?, discount = ?, total = ? WHERE id = ?");
    $upd->execute([$itemsJson, round($subtotal, 2), round($taxAmount, 2), round($discount, 2), round($total, 2), $inv['id']]);
    
    echo "Facture {$inv['id']} (" . ($inv['number'] ?? 'N/A') . ") mise à jour : Total $total\n";
    $updatedCount++;
}

echo "\nTerminé. $updatedCount factures corrigées.\n";
