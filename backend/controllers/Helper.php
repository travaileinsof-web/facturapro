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
        
        $stmt = $pdo->prepare("SELECT total, \"vatWithholdingApplied\", taxAmount, status FROM ProformaInvoice WHERE id = ? AND accountId = ?");
        $stmt->execute([$invoiceId, $accountId]);
        $inv = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$inv) return;

        $actualTotal = (float)$inv['total'];
        if (!empty($inv['vatWithholdingApplied']) && (float)$inv['taxAmount'] > 0) {
            $actualTotal -= ((float)$inv['taxAmount'] / 2);
        }

        $stmt = $pdo->prepare("SELECT SUM(amount) as paid FROM Receipt WHERE proformaInvoiceId = ? AND accountId = ?");
        $stmt->execute([$invoiceId, $accountId]);
        $paid = (float)($stmt->fetchColumn() ?: 0);
        
        if ($paid == 0) {
            $currentStatus = $inv['status'];
            $status = ($currentStatus === 'brouillon' || $currentStatus === 'annulée') ? $currentStatus : 'envoyée';
        } elseif ($paid >= $actualTotal) {
            $status = 'payée';
        } else {
            $status = 'partielle';
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

    public static function getExchangeRate($fromCurrency, $toCurrency) {
        $fromCurrency = strtoupper($fromCurrency ?? '');
        $toCurrency = strtoupper($toCurrency ?? '');
        
        if ($fromCurrency === $toCurrency || empty($fromCurrency) || empty($toCurrency)) {
            return 1.0;
        }

        // Base de référence: 1 USD
        $rates = [
            'USD' => 1.0,
            'GNF' => 8500.0, // Franc Guinéen
            'XOF' => 600.0,  // Franc CFA (UEMOA)
            'XAF' => 600.0,  // Franc CFA (CEMAC)
            'EUR' => 0.92,
            'CAD' => 1.35,
            'GBP' => 0.78,
            'MAD' => 10.0,   // Dirham marocain
            'ZAR' => 18.5,   // Rand sud-africain
        ];

        $rateFrom = $rates[$fromCurrency] ?? null;
        $rateTo = $rates[$toCurrency] ?? null;

        if (!$rateFrom || !$rateTo) {
            return 1.0; // Fallback: pas de conversion si devise inconnue
        }

        return $rateTo / $rateFrom;
    }
}
