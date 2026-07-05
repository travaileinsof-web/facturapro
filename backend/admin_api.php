<?php
/**
 * FacturaPro — Admin Back Office API
 * Accès strictement réservé au propriétaire de la plateforme.
 * Protection : 3 couches de sécurité (Email+MDP → PIN → IP whitelist)
 */

require_once __DIR__ . '/config.php';

// =============================================================
// ADMIN CREDENTIALS — NE JAMAIS PARTAGER CE FICHIER
// =============================================================

// COUCHE 1 : Email
define('ADMIN_EMAIL', 'einsof.infos@gmail.com');

// COUCHE 1 : Mot de passe (comparaison sécurisée via hash_equals + sha256 HMAC)
// Le mot de passe est haché avec un secret serveur — performant et sécurisé
define('ADMIN_PASSWORD_SECRET', 'FP_2026_Cortex_Salt_Unique_Never_Share');
define('ADMIN_PASSWORD_HMAC',   hash_hmac('sha256', 'Cortex@2026', 'FP_2026_Cortex_Salt_Unique_Never_Share'));

// COUCHE 2 : PIN SECRET à 6 chiffres
define('ADMIN_SECRET_PIN', '199700');

// COUCHE 3 : WHITELIST IP — seules ces IPs peuvent accéder au back office
define('ADMIN_IP_WHITELIST', [
    '197.149.242.217', // Votre IP fixe mise à jour
    '127.0.0.1',       // Tests locaux IPv4
    '::1',             // Tests locaux IPv6
]);

// Token de session admin (unique à votre installation)
define('ADMIN_TOKEN_SECRET', 'fp_adm_' . sha1('CortexLead_FP2026_' . ADMIN_EMAIL . ADMIN_SECRET_PIN));

// ─── CORS ────────────────────────────────────────────────────────────────────
$allowed_origins = ['http://localhost:5173', 'http://localhost:5174', 'https://facturapro.local'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// ─── DATABASE ─────────────────────────────────────────────────────────────────
try {
    $dbExists = file_exists(DB_PATH);
    $pdo = new PDO('sqlite:' . DB_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec("PRAGMA journal_mode=WAL");
    $pdo->exec("PRAGMA busy_timeout=5000");

    // Initialisation DB si fichier nouveau
    if (!$dbExists) {
        $schema = file_get_contents(__DIR__ . '/database.sql');
        if ($schema !== false) $pdo->exec($schema);
    }

    // Vérifier si la table Account existe avant migrations
    $tableExists = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='Account'")->fetchColumn();
    
    if ($tableExists) {
        // Migrations : ajout des colonnes admin si elles n'existent pas
        $cols = array_column($pdo->query("PRAGMA table_info(Account)")->fetchAll(), 'name');
        $migrations = [
            'subscriptionPlan'      => "ALTER TABLE Account ADD COLUMN subscriptionPlan VARCHAR(50) DEFAULT 'free'",
            'subscriptionStatus'    => "ALTER TABLE Account ADD COLUMN subscriptionStatus VARCHAR(50) DEFAULT 'trial'",
            'subscriptionExpiresAt' => "ALTER TABLE Account ADD COLUMN subscriptionExpiresAt DATETIME NULL",
            'subscriptionAmount'    => "ALTER TABLE Account ADD COLUMN subscriptionAmount DECIMAL(10,2) DEFAULT 0",
            'lastPaymentDate'       => "ALTER TABLE Account ADD COLUMN lastPaymentDate DATETIME NULL",
            'adminNotes'            => "ALTER TABLE Account ADD COLUMN adminNotes TEXT NULL",
            'isSuspended'           => "ALTER TABLE Account ADD COLUMN isSuspended INTEGER DEFAULT 0",
        ];
        foreach ($migrations as $col => $sql) {
            if (!in_array($col, $cols)) {
                try { $pdo->exec($sql); } catch (Exception $e) {} // ignorer si existe déjà d'une autre exécution
            }
        }
    }

    // Table de logs admin
    $pdo->exec("CREATE TABLE IF NOT EXISTS AdminLog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action VARCHAR(255) NOT NULL,
        targetAccountId VARCHAR(50) NULL,
        details TEXT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur base de données : ' . $e->getMessage()]);
    exit;
}

// ─── ROUTING ──────────────────────────────────────────────────────────────────
$method   = $_SERVER['REQUEST_METHOD'];
$endpoint = trim($_GET['endpoint'] ?? '', '/');
$body     = json_decode(file_get_contents('php://input'), true) ?? [];

// ─── COUCHE 3 : VÉRIFICATION IP ───────────────────────────────────────────────
function checkIpWhitelist(): bool {
    $whitelist = ADMIN_IP_WHITELIST;
    if (empty($whitelist)) return true; // Désactivé
    
    // Security: Only use REMOTE_ADDR. Do not trust X-Forwarded-For which can be spoofed by the client.
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? '';
    return in_array($clientIp, $whitelist);
}

// ─── VÉRIFICATION TOKEN ADMIN ─────────────────────────────────────────────────
function verifyAdminToken(): bool {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/', $authHeader, $m)) return false;
    return $m[1] === ADMIN_TOKEN_SECRET;
}

// ─── HELPER LOG ──────────────────────────────────────────────────────────────
function adminLog(PDO $pdo, string $action, ?string $accountId = null, ?string $details = null): void {
    $stmt = $pdo->prepare("INSERT INTO AdminLog (action, targetAccountId, details) VALUES (?, ?, ?)");
    $stmt->execute([$action, $accountId, $details]);
}

// ─── ROUTE : LOGIN ADMIN (unique route sans token) ────────────────────────────
if ($endpoint === 'auth/login' && $method === 'POST') {
    // Couche 3 : IP check
    if (!checkIpWhitelist()) {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé : votre adresse IP n\'est pas autorisée.']);
        exit;
    }

    $email    = trim($body['email']    ?? '');
    $password = trim($body['password'] ?? '');
    $pin      = trim($body['pin']      ?? '');

    // Couche 1 : Email + Mot de passe (comparaison HMAC timing-safe)
    $inputHmac = hash_hmac('sha256', $password, ADMIN_PASSWORD_SECRET);
    if ($email !== ADMIN_EMAIL || !hash_equals(ADMIN_PASSWORD_HMAC, $inputHmac)) {
        http_response_code(401);
        adminLog($pdo, 'LOGIN_FAILED', null, "Tentative échouée depuis l'email: $email");
        echo json_encode(['error' => 'Identifiants incorrects.']);
        exit;
    }

    // Couche 2 : PIN secret
    if (!hash_equals(ADMIN_SECRET_PIN, $pin)) {
        http_response_code(401);
        adminLog($pdo, 'PIN_FAILED', null, "PIN incorrect pour: $email");
        echo json_encode(['error' => 'Code PIN admin incorrect.']);
        exit;
    }

    adminLog($pdo, 'LOGIN_SUCCESS', null, "Connexion admin réussie depuis IP: " . ($_SERVER['REMOTE_ADDR'] ?? '?'));
    echo json_encode([
        'token'   => ADMIN_TOKEN_SECRET,
        'message' => 'Connexion admin réussie'
    ]);
    exit;
}

// ─── TOUTES LES AUTRES ROUTES : TOKEN REQUIS + IP CHECK ──────────────────────
if (!checkIpWhitelist()) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé : adresse IP non autorisée.']);
    exit;
}
if (!verifyAdminToken()) {
    http_response_code(401);
    echo json_encode(['error' => 'Token admin invalide ou expiré.']);
    exit;
}

// ─── ROUTE : LISTE DES COMPTES ────────────────────────────────────────────────
if ($endpoint === 'accounts' && $method === 'GET') {
    $search = $_GET['q'] ?? '';
    $status = $_GET['status'] ?? '';

    $sql = "SELECT 
        a.*,
        (SELECT COUNT(*) FROM Client WHERE accountId = a.id) AS totalClients,
        (SELECT COUNT(*) FROM ProformaInvoice WHERE accountId = a.id) AS totalInvoices,
        (SELECT COUNT(*) FROM Receipt WHERE accountId = a.id) AS totalReceipts,
        (SELECT COALESCE(SUM(amount), 0) FROM Receipt WHERE accountId = a.id) AS totalRevenue
    FROM Account a WHERE 1=1";

    $params = [];
    if ($search) {
        $sql .= " AND (a.email LIKE :q OR a.companyName LIKE :q OR a.firstName LIKE :q OR a.lastName LIKE :q OR a.phone LIKE :q)";
        $params['q'] = "%$search%";
    }
    if ($status) {
        $sql .= " AND a.subscriptionStatus = :status";
        $params['status'] = $status;
    }
    $sql .= " ORDER BY a.createdAt DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $accounts = $stmt->fetchAll();

    // Masquer les données sensibles
    foreach ($accounts as &$acc) {
        unset($acc['passwordHash'], $acc['token'], $acc['logo'], $acc['stamp'], $acc['signature']);
        $acc['fullName'] = trim(($acc['firstName'] ?? '') . ' ' . ($acc['lastName'] ?? ''));
    }

    echo json_encode($accounts);
    exit;
}

// ─── ROUTE : DÉTAIL D'UN COMPTE ───────────────────────────────────────────────
if (preg_match('/^accounts\/([^\/]+)$/', $endpoint, $m) && $method === 'GET') {
    $accountId = $m[1];
    $stmt = $pdo->prepare("SELECT 
        a.*,
        (SELECT COUNT(*) FROM Client WHERE accountId = a.id) AS totalClients,
        (SELECT COUNT(*) FROM ProformaInvoice WHERE accountId = a.id) AS totalInvoices,
        (SELECT COUNT(*) FROM Receipt WHERE accountId = a.id) AS totalReceipts,
        (SELECT COALESCE(SUM(amount), 0) FROM Receipt WHERE accountId = a.id) AS totalRevenue,
        (SELECT COUNT(*) FROM ProformaInvoice WHERE accountId = a.id AND status = 'payee') AS paidInvoices,
        (SELECT COUNT(*) FROM ProformaInvoice WHERE accountId = a.id AND status = 'brouillon') AS draftInvoices
    FROM Account a WHERE a.id = ?");
    $stmt->execute([$accountId]);
    $account = $stmt->fetch();
    if (!$account) { http_response_code(404); echo json_encode(['error' => 'Compte introuvable']); exit; }
    unset($account['passwordHash'], $account['token'], $account['logo'], $account['stamp'], $account['signature']);
    $account['fullName'] = trim(($account['firstName'] ?? '') . ' ' . ($account['lastName'] ?? ''));
    echo json_encode($account);
    exit;
}

// ─── ROUTE : MISE À JOUR ABONNEMENT + ADMIN ACTIONS ──────────────────────────
if (preg_match('/^accounts\/([^\/]+)$/', $endpoint, $m) && $method === 'PUT') {
    $accountId = $m[1];
    $plan      = $body['subscriptionPlan']   ?? null;
    $status    = $body['subscriptionStatus'] ?? null;
    $amount    = $body['subscriptionAmount'] ?? null;
    $notes     = $body['adminNotes']         ?? null;
    $suspended = $body['isSuspended']        ?? null;
    $expiresAt = $body['subscriptionExpiresAt'] ?? null;

    $updates = []; $params = [];
    if ($plan !== null)      { $updates[] = "subscriptionPlan = ?";      $params[] = $plan; }
    if ($status !== null)    { $updates[] = "subscriptionStatus = ?";    $params[] = $status; }
    if ($amount !== null)    { $updates[] = "subscriptionAmount = ?";    $params[] = floatval($amount);
                               $updates[] = "lastPaymentDate = ?";       $params[] = date('Y-m-d H:i:s'); }
    if ($notes !== null)     { $updates[] = "adminNotes = ?";            $params[] = $notes; }
    if ($suspended !== null) { $updates[] = "isSuspended = ?";           $params[] = intval($suspended); }
    if ($expiresAt !== null) { $updates[] = "subscriptionExpiresAt = ?"; $params[] = $expiresAt; }

    if (empty($updates)) { echo json_encode(['error' => 'Aucun champ à mettre à jour']); exit; }

    $params[] = $accountId;
    $stmt = $pdo->prepare("UPDATE Account SET " . implode(', ', $updates) . " WHERE id = ?");
    $stmt->execute($params);

    adminLog($pdo, 'ACCOUNT_UPDATED', $accountId, json_encode($body));

    $stmt = $pdo->prepare("SELECT id, email, companyName, firstName, lastName, subscriptionPlan, subscriptionStatus, subscriptionExpiresAt, subscriptionAmount, lastPaymentDate, adminNotes, isSuspended, createdAt FROM Account WHERE id = ?");
    $stmt->execute([$accountId]);
    echo json_encode($stmt->fetch());
    exit;
}

// ─── ROUTE : RÉINITIALISER MOT DE PASSE D'UN UTILISATEUR ─────────────────────
if (preg_match('/^accounts\/([^\/]+)\/reset-password$/', $endpoint, $m) && $method === 'POST') {
    $accountId   = $m[1];
    $newPassword = $body['newPassword'] ?? '';
    if (strlen($newPassword) < 8) { echo json_encode(['error' => 'Mot de passe trop court (min 8 chars)']); exit; }
    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE Account SET passwordHash = ?, token = NULL WHERE id = ?");
    $stmt->execute([$hash, $accountId]);
    adminLog($pdo, 'PASSWORD_RESET', $accountId, 'Réinitialisation par admin');
    echo json_encode(['success' => true]);
    exit;
}

// ─── ROUTE : SUPPRIMER UN COMPTE ─────────────────────────────────────────────
if (preg_match('/^accounts\/([^\/]+)$/', $endpoint, $m) && $method === 'DELETE') {
    $accountId = $m[1];
    $stmt = $pdo->prepare("DELETE FROM Account WHERE id = ?");
    $stmt->execute([$accountId]);
    adminLog($pdo, 'ACCOUNT_DELETED', $accountId, 'Suppression par admin');
    echo json_encode(['success' => true]);
    exit;
}

// ─── ROUTE : STATISTIQUES GLOBALES ───────────────────────────────────────────
if ($endpoint === 'stats' && $method === 'GET') {
    $stats = [];

    $stats['totalAccounts']  = $pdo->query("SELECT COUNT(*) FROM Account")->fetchColumn();
    $stats['trialAccounts']  = $pdo->query("SELECT COUNT(*) FROM Account WHERE subscriptionStatus = 'trial'")->fetchColumn();
    $stats['activeAccounts'] = $pdo->query("SELECT COUNT(*) FROM Account WHERE subscriptionStatus = 'active'")->fetchColumn();
    $stats['expiredAccounts']= $pdo->query("SELECT COUNT(*) FROM Account WHERE subscriptionStatus = 'expired'")->fetchColumn();
    $stats['suspendedAccounts'] = $pdo->query("SELECT COUNT(*) FROM Account WHERE isSuspended = 1")->fetchColumn();
    $stats['mensuelAccounts']= $pdo->query("SELECT COUNT(*) FROM Account WHERE subscriptionPlan = 'mensuel'")->fetchColumn();
    $stats['annuelAccounts'] = $pdo->query("SELECT COUNT(*) FROM Account WHERE subscriptionPlan = 'annuel'")->fetchColumn();
    $stats['totalRevenuePlatform'] = $pdo->query("SELECT COALESCE(SUM(subscriptionAmount), 0) FROM Account")->fetchColumn();

    // Nouveaux comptes (30 derniers jours)
    $stats['newAccountsThisMonth'] = $pdo->query("SELECT COUNT(*) FROM Account WHERE createdAt >= datetime('now', '-30 days')")->fetchColumn();

    // Derniers comptes créés
    $stmt = $pdo->prepare("SELECT id, email, companyName, firstName, lastName, subscriptionPlan, subscriptionStatus, createdAt FROM Account ORDER BY createdAt DESC LIMIT 5");
    $stmt->execute();
    $stats['recentAccounts'] = $stmt->fetchAll();

    // Logs récents
    $stmt = $pdo->prepare("SELECT * FROM AdminLog ORDER BY createdAt DESC LIMIT 20");
    $stmt->execute();
    $stats['recentLogs'] = $stmt->fetchAll();

    echo json_encode($stats);
    exit;
}

// ─── FALLBACK ─────────────────────────────────────────────────────────────────
http_response_code(404);
echo json_encode(['error' => 'Endpoint admin introuvable : ' . $endpoint]);
