<?php
require_once 'backend/config.php';
$pdo = new PDO('sqlite:backend/facturapro.sqlite');

$accountId = '29de6011-d644-4ae2-8483-4e30964ea13c'; // Account from today

$stmt = $pdo->prepare("SELECT * FROM Client WHERE accountId = ? ORDER BY createdAt DESC");
$stmt->execute([$accountId]);
$clients = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach($clients as &$c) {
    $st1 = $pdo->prepare("SELECT * FROM ProformaInvoice WHERE clientId = ? AND accountId = ?");
    $st1->execute([$c['id'], $accountId]);
    $c['invoices'] = $st1->fetchAll(PDO::FETCH_ASSOC);
    $st2 = $pdo->prepare("SELECT * FROM Receipt WHERE clientId = ? AND accountId = ?");
    $st2->execute([$c['id'], $accountId]);
    $c['receipts'] = $st2->fetchAll(PDO::FETCH_ASSOC);
}

echo json_encode($clients);
