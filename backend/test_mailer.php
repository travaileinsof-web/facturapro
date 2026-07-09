<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/core/SystemMailer.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    if (class_exists('MyPDOStatement')) {
        $pdo->setAttribute(PDO::ATTR_STATEMENT_CLASS, ['MyPDOStatement', []]);
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (Exception $e) {
    die("Database error");
}

echo "Testing SystemMailer...\n";
$result = SystemMailer::sendWelcomeEmail($pdo, 'bessi.georges@gmail.com', 'Georges', 'INV-001');
if ($result) {
    echo "Success!\n";
} else {
    echo "Failed!\n";
}
