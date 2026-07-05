<?php
/**
 * Script de nettoyage des fichiers PDF temporaires
 * Ce script est censé être exécuté via un cron job (ex: 1 fois par jour)
 */

$uploadDir = __DIR__ . '/uploads/';

if (!is_dir($uploadDir)) {
    echo "Le dossier uploads n'existe pas.\n";
    exit;
}

$files = scandir($uploadDir);
$now = time();
$deletedCount = 0;

foreach ($files as $file) {
    if ($file === '.' || $file === '..' || $file === '.htaccess') {
        continue;
    }

    $filePath = $uploadDir . $file;
    
    if (is_file($filePath)) {
        $fileAge = $now - filemtime($filePath);
        
        // 86400 secondes = 24 heures
        if ($fileAge > 86400) {
            unlink($filePath);
            $deletedCount++;
        }
    }
}

echo "Nettoyage terminé. $deletedCount fichier(s) supprimé(s).\n";
