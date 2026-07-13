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

    public static function computeSubscriptionStatus($account) {
        $plan = $account['subscriptionPlan'] ?? 'free';
        $status = $account['subscriptionStatus'] ?? 'trial';
        
        if (($plan === 'premium' || $plan === 'annuel') && $status === 'active') {
            if (!empty($account['subscriptionExpiresAt']) && strtotime($account['subscriptionExpiresAt']) < time()) {
                return 'expired';
            }
            return 'active';
        }
        
        if ($status === 'trial' || $plan === 'free') {
            $createdAtStr = $account['createdAt'] ?? date('Y-m-d H:i:s');
            $createdAt = strtotime($createdAtStr);
            $days = (time() - $createdAt) / (60 * 60 * 24);
            if ($days >= 1) {
                return 'trial_expired';
            }
            return 'trial';
        }
        
        return $status;
    }
}
