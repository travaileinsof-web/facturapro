<?php
class Helper {
    public static function uuid() {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    public static function recalculerStatutFacture($pdo, $invoiceId, $accountId) {
        if (!$invoiceId) return;
        
        $stmt = $pdo->prepare("SELECT total FROM ProformaInvoice WHERE id = ? AND accountId = ?");
        $stmt->execute([$invoiceId, $accountId]);
        $invoiceTotal = $stmt->fetchColumn();
        
        if ($invoiceTotal === false) return;

        $stmt = $pdo->prepare("SELECT SUM(amount) as paid FROM Receipt WHERE proformaInvoiceId = ? AND accountId = ?");
        $stmt->execute([$invoiceId, $accountId]);
        $paid = $stmt->fetchColumn() ?: 0;
        
        if ($paid == 0) {
            $status = 'envoyee';
        } elseif ($paid >= $invoiceTotal) {
            $status = 'payee';
        } else {
            $status = 'partiellement_payee';
        }
        
        $stmt = $pdo->prepare("UPDATE ProformaInvoice SET status = ? WHERE id = ? AND accountId = ?");
        $stmt->execute([$status, $invoiceId, $accountId]);
    }
}
