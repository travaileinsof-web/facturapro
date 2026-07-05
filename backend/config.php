<?php
// Database Configuration
define('DB_CONNECTION', 'pgsql'); // Changed to pgsql for Neon

// Neon PostgreSQL Configuration
define('DB_HOST', 'ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech');
define('DB_NAME', 'neondb');
define('DB_USER', 'neondb_owner');
define('DB_PASS', 'npg_S8GTJ7bfBdjx');
define('DB_DSN', 'pgsql:host=' . DB_HOST . ';port=5432;dbname=' . DB_NAME . ';sslmode=require;options=endpoint=ep-gentle-lab-at2wepx2');

// SQLite Configuration (Deprecated, kept for legacy variable references if any)
define('DB_PATH', __DIR__ . '/facturapro.sqlite');

// =============================================================
// PLANS D'ABONNEMENT
// =============================================================
define('SUBSCRIPTION_PLANS', [
    'free'    => ['name' => 'Essai Gratuit', 'duration_days' => 1,   'price_gnf' => 0],
    'annuel'  => ['name' => 'Annuel',        'duration_days' => 365, 'price_gnf' => 500000],
]);

// =============================================================
// SECRET WHATSAPP API
// =============================================================
define('WHATSAPP_API_SECRET', 'fp_wa_secret_2026_xyz');

// =============================================================
// PAIEMENT DJOMY API
// =============================================================
define('DJOMY_CLIENT_ID', 'VOTRE_CLIENT_ID_DJOMY');
define('DJOMY_CLIENT_SECRET', 'VOTRE_CLIENT_SECRET_DJOMY');
define('DJOMY_API_URL', 'https://api.djomy.com'); // A ajuster selon l'environnement

