<?php
require_once 'backend/config.php';
try { $pdo = new PDO(DB_DSN, DB_USER, DB_PASS); } catch (Exception $e) {}

$stmt = $pdo->query("
    SELECT i.id, i.number, i.total, i.items, SUM(r.amount) as paid
    FROM ProformaInvoice i
    JOIN Receipt r ON r.proformainvoiceid = i.id
    GROUP BY i.id
    HAVING i.total < SUM(r.amount) OR i.total = 0
");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
