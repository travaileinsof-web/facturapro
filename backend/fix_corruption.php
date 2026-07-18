<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Trouver le taux de corruption en analysant toutes les factures
    $stmt = $pdo->query("SELECT * FROM ProformaInvoice WHERE subtotal > 0");
    $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $rate = 1;
    foreach ($invoices as $inv) {
        $items = json_decode($inv['items'], true);
        $originalSubtotal = 0;
        if (is_array($items)) {
            foreach ($items as $item) {
                $originalSubtotal += (isset($item['unitPrice']) ? $item['unitPrice'] : 0) * (isset($item['quantity']) ? $item['quantity'] : 1);
            }
        }
        if ($originalSubtotal > 0) {
            $currentRate = $inv['subtotal'] / $originalSubtotal;
            if (abs($currentRate - 1) > 0.01) {
                $rate = $currentRate;
                break; // On a trouvé une facture corrompue
            }
        }
    }
        
        // S'il y a un décalage (le taux n'est pas 1), on corrige
        if (abs($rate - 1) > 0.01) {
            $pdo->beginTransaction();
            try {
                $pdo->exec("UPDATE ProformaInvoice SET subtotal = subtotal / $rate, taxAmount = taxAmount / $rate, discount = discount / $rate, total = total / $rate");
                $pdo->commit();
                echo json_encode(["status" => "Base de données réparée ! Les montants ont été divisés par $rate pour revenir à la devise d'origine.", "rate_found" => $rate]);
            } catch (Exception $e) {
                $pdo->rollBack();
                echo json_encode(["error" => "Échec de la correction : " . $e->getMessage()]);
            }
            exit;
        } else {
            echo json_encode(["status" => "Aucune corruption détectée, le multiplicateur est de 1 (ou très proche).", "rate" => $rate]);
            exit;
        }
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
