<?php
$start = microtime(true);
try {
    $pdo = new PDO('pgsql:host=3.23.186.13;port=6432;dbname=facturapro;sslmode=require;options=endpoint=ep-gentle-lab-at2wepx2', 'facturapro_owner', 'E95wTqYcmyJd');
    echo 'Connected with IP in ' . round(microtime(true) - $start, 3) . ' seconds' . PHP_EOL;
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . PHP_EOL;
}
