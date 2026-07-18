<?php
require_once 'backend/config.php';
try { $pdo = new PDO(DB_DSN, DB_USER, DB_PASS); } catch (Exception $e) {}

$expenses = $pdo->query("SELECT id, amount, description FROM Expense WHERE amount = 0")->fetchAll();
$catalog = $pdo->query("SELECT id, name, unitprice FROM CatalogItem WHERE unitprice = 0")->fetchAll();
$receipts = $pdo->query("SELECT id, amount, proformainvoiceid FROM Receipt WHERE amount = 0")->fetchAll();

echo "Expenses à 0: " . count($expenses) . "\n";
echo "Catalog à 0: " . count($catalog) . "\n";
echo "Receipts à 0: " . count($receipts) . "\n";
