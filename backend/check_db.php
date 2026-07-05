<?php
require_once __DIR__ . '/config.php';

if (defined('DB_CONNECTION') && DB_CONNECTION === 'pgsql') {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    if (class_exists('MyPDOStatement')) {
        $pdo->setAttribute(PDO::ATTR_STATEMENT_CLASS, ['MyPDOStatement', []]);
    }
} else {
    $pdo = new PDO('sqlite:backend/facturapro.sqlite');
}
$stmt = $pdo->query('SELECT primaryColor, secondaryColor, accentColor, logo, signature, stamp FROM Account LIMIT 1');
print_r($stmt->fetch(PDO::FETCH_ASSOC));
