<?php
require_once __DIR__ . '/config.php';
try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $dateGroupFormat = 'YYYY-MM';
    $limitStr = '1 year';
    $mrrQuery = "SELECT TO_CHAR(createdAt, '$dateGroupFormat') as date, SUM(amount) as mrr FROM SubscriptionPayment WHERE status = 'COMPLETED' AND createdAt >= NOW() - INTERVAL '$limitStr' GROUP BY TO_CHAR(createdAt, '$dateGroupFormat') ORDER BY date ASC";
    $mrrCurve = $pdo->query($mrrQuery)->fetchAll(PDO::FETCH_ASSOC);
    
    print_r($mrrCurve);

    $acqQuery = "
        SELECT 
            TO_CHAR(createdAt, '$dateGroupFormat') as date, 
            SUM(CASE WHEN subscriptionPlan = 'free' THEN 1 ELSE 0 END) as freeAccounts,
            SUM(CASE WHEN subscriptionPlan = 'premium' THEN 1 ELSE 0 END) as paidAccounts
        FROM Account 
        WHERE createdAt >= NOW() - INTERVAL '$limitStr'
        GROUP BY TO_CHAR(createdAt, '$dateGroupFormat') ORDER BY date ASC
    ";
    $acqCurve = $pdo->query($acqQuery)->fetchAll(PDO::FETCH_ASSOC);

    print_r($acqCurve);
    echo "SUCCESS!\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
