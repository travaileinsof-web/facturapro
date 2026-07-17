<?php
// Test direct du CatalogController avec un vrai accountId
require 'backend/config.php';
require 'backend/core/Validator.php';
require 'backend/controllers/Helper.php';
require 'backend/controllers/CatalogController.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    if (class_exists('MyPDOStatement')) {
        $pdo->setAttribute(PDO::ATTR_STATEMENT_CLASS, ['MyPDOStatement', []]);
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Recuperer un vrai accountId pour le test
    $stmt = $pdo->query("SELECT id, email FROM Account LIMIT 1");
    $acc = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$acc) {
        echo "Aucun compte en base." . PHP_EOL;
        exit;
    }
    
    echo "Test avec accountId: " . $acc['id'] . " (" . $acc['email'] . ")" . PHP_EOL;
    
    // Simuler la requete GET catalog
    $_SERVER['REQUEST_METHOD'] = 'GET';
    ob_start();
    CatalogController::handle($pdo, 'GET', null, $acc['id'], []);
    $output = ob_get_clean();
    
    echo "Reponse catalog: " . $output . PHP_EOL;
    
} catch (Throwable $e) {
    echo "ERREUR: " . $e->getMessage() . PHP_EOL;
    echo "Fichier: " . $e->getFile() . " ligne " . $e->getLine() . PHP_EOL;
    echo $e->getTraceAsString() . PHP_EOL;
}
