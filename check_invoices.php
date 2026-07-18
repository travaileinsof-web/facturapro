<?php
require_once 'backend/config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
} catch (PDOException $e) {
    die("Erreur de connexion : " . $e->getMessage());
}

$stmt = $pdo->query("SELECT id, number, subtotal, total, taxamount as taxAmount, discount, items FROM ProformaInvoice LIMIT 5");
$invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

print_r($invoices);
