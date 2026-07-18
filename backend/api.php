<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

if (php_sapi_name() === 'cli-server') {
    $path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
    if ($path !== '/api.php' && file_exists(__DIR__ . $path) && is_file(__DIR__ . $path)) {
        return false;
    }
}

// ==========================================
// CORS SECURISÉ
// ==========================================
$allowedOrigins = [
    'http://localhost:3003',
    'http://localhost:8000',
    'http://localhost:5173',
    'https://facturapro.com'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Si l'origine n'est pas autorisée, on ne renvoie pas d'entête CORS permissive
    if ($origin !== '') {
        http_response_code(403);
        exit;
    }
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit;
}

require_once 'config.php';
require_once __DIR__ . '/core/Validator.php';
require_once __DIR__ . '/core/Router.php';
require_once __DIR__ . '/controllers/Helper.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/SettingsController.php';
require_once __DIR__ . '/controllers/ClientController.php';
require_once __DIR__ . '/controllers/CatalogController.php';
require_once __DIR__ . '/controllers/InvoiceController.php';
require_once __DIR__ . '/controllers/ReceiptController.php';
require_once __DIR__ . '/controllers/ExpenseController.php';
require_once __DIR__ . '/controllers/DocumentController.php';
require_once __DIR__ . '/controllers/StatsController.php';
require_once __DIR__ . '/controllers/ChatController.php';
require_once __DIR__ . '/controllers/NotificationController.php';
require_once __DIR__ . '/controllers/ShareController.php';
require_once __DIR__ . '/controllers/UploadController.php';
require_once __DIR__ . '/controllers/CompanyController.php';
require_once __DIR__ . '/controllers/PaymentController.php';
require_once __DIR__ . '/controllers/SuperAdminController.php';
require_once __DIR__ . '/controllers/AdminSettingsController.php';
require_once __DIR__ . '/controllers/AdminAuthController.php';

// Database Connection
try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    if (class_exists('MyPDOStatement')) {
        $pdo->setAttribute(PDO::ATTR_STATEMENT_CLASS, ['MyPDOStatement', []]);
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // PREVENT ERROR LEAK
    error_log("DB Connection Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Internal Database Server Error."]);
    exit;
}

$rawEndpoint = '';
if (isset($_GET['endpoint']) && $_GET['endpoint'] !== '') {
    $rawEndpoint = $_GET['endpoint'];
} else {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $rawEndpoint = preg_replace('/^\/api\.php/', '', $uri);
    $rawEndpoint = preg_replace('/^\/api\//', '', $rawEndpoint);
    $rawEndpoint = ltrim($rawEndpoint, '/');
}

$requestPath = explode('?', $rawEndpoint)[0];
$requestPath = explode('&', $requestPath)[0];
$requestPath = trim($requestPath, '/');

$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents("php://input"), true) ?: [];

$segments = explode('/', $requestPath);
$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;
$subAction = $segments[2] ?? null;

// ==========================================
// AUTHENTICATION PUBLIC ROUTES
// ==========================================
if ($resource === 'auth' && in_array($id, ['login', 'register', 'forgot-password', 'verify-code', 'reset-password'])) {
    try {
        AuthController::handle($pdo, $method, $id, $body);
    } catch (Throwable $e) {
        error_log("Auth Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => "Internal Error during authentication."]);
    }
    exit;
}

if ($resource === 'admin_auth') {
    AdminAuthController::handle($pdo, $method, $id, $body);
    exit;
}

if (($resource === 'v1' && $id === 'webhooks' && $subAction === 'djomy') || ($resource === 'webhooks' && $id === 'djomy')) {
    $controller = new PaymentController($pdo);
    $response = $controller->handleWebhook(['body' => $body]);
    echo json_encode($response);
    exit;
}

if ($resource === 'fix_corruption' || $resource === 'fix_corruption.php') {
    require_once __DIR__ . '/fix_corruption.php';
    exit;
}
if ($resource === 'fix_invoices' || $resource === 'fix_invoices.php') {
    require_once __DIR__ . '/fix_invoices.php';
    exit;
}
if ($resource === 'reset_to_gnf' || $resource === 'reset_to_gnf.php') {
    require_once __DIR__ . '/reset_to_gnf.php';
    exit;
}
if ($resource === 'debug_state' || $resource === 'debug_state.php') {
    require_once __DIR__ . '/debug_state.php';
    exit;
}
if ($resource === 'migrate_add_currency' || $resource === 'migrate_add_currency.php') {
    require_once __DIR__ . '/migrate_add_currency.php';
    exit;
}

// ==========================================
// MIDDLEWARE: VERIFY TOKEN
// ==========================================
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (empty($authHeader) && function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
}
$token = '';
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (!$token) {
    http_response_code(401); echo json_encode(["error" => "Non autorisé. Token manquant."]); exit;
}

if ($resource === 'admin') {
    $hashedToken = hash('sha256', $token);
    $stmt = $pdo->prepare("SELECT * FROM SuperAdmin WHERE token = ?");
    $stmt->execute([$hashedToken]);
    $currentAdmin = $stmt->fetch();
    
    if (!$currentAdmin) {
        http_response_code(403); echo json_encode(["error" => "Accès refusé. Token SuperAdmin invalide."]); exit;
    }
    
    // FIX SESSION: Déconnexion du SuperAdmin (efface le token en DB)
    if ($id === 'auth' && $subAction === 'logout') {
        $newToken = bin2hex(random_bytes(32));
        $hashedNewToken = hash('sha256', $newToken);
        $pdo->prepare("UPDATE SuperAdmin SET token = ? WHERE id = ?")->execute([$hashedNewToken, $currentAdmin['id']]);
        echo json_encode(["success" => true]);
        exit;
    }
    
    if ($id === 'settings') {
        AdminSettingsController::handle($pdo, $method, $body);
        exit;
    }
    
    SuperAdminController::handle($pdo, $method, $id . ($subAction ? '/' . $subAction : ''), $currentAdmin['id'], $body);
    exit;
}

$hashedToken = hash('sha256', $token);
$stmt = $pdo->prepare("SELECT * FROM Account WHERE token = ?");
$stmt->execute([$hashedToken]);
$currentAccount = $stmt->fetch();

if (!$currentAccount) {
    http_response_code(401); echo json_encode(["error" => "Token invalide ou expiré."]); exit;
}

if ($resource === 'auth' && $id === 'logout') {
    $newToken = bin2hex(random_bytes(32));
    $hashedNewToken = hash('sha256', $newToken);
    $pdo->prepare("UPDATE Account SET token = ? WHERE id = ?")->execute([$hashedNewToken, $currentAccount['id']]);
    echo json_encode(["success" => true]);
    exit;
}

if ($resource === 'auth' && $id === 'me') {
    echo json_encode([
        "id"                 => $currentAccount['id'], 
        "name"               => trim($currentAccount['firstName'] . " " . $currentAccount['lastName']),
        "email"              => $currentAccount['email'], 
        "company"            => $currentAccount['companyName'], 
        "token"              => $token,
        "subscriptionPlan"   => $currentAccount['subscriptionPlan'] ?? 'free',
        "subscriptionStatus" => Helper::computeSubscriptionStatus($currentAccount),
        "createdAt"          => $currentAccount['createdAt'],
        "primaryColor"       => $currentAccount['primaryColor'] ?? '#B38E36',
        "secondaryColor"     => $currentAccount['secondaryColor'] ?? null,
        "accentColor"        => $currentAccount['accentColor'] ?? null,
        "role"               => $currentAccount['role'] ?? 'user',
        // ✅ FIX: Inclure la devise (manquait dans /auth/me)
        "currency"           => $currentAccount['currency'] ?? 'XOF'
    ]);
    exit;
}

// ==========================================
// INIT ENDPOINT: retourne user + notifications
// en une seule connexion DB (optimisation perf)
// ==========================================
if ($resource === 'init' && $method === 'GET') {
    require_once __DIR__ . '/core/NotificationService.php';
    $accountId = $currentAccount['id'];

    // 1. User data (déjà chargé via token lookup — 0 requête supplémentaire)
    $userData = [
        "id"                 => $currentAccount['id'],
        "name"               => trim($currentAccount['firstName'] . " " . $currentAccount['lastName']),
        "email"              => $currentAccount['email'],
        "company"            => $currentAccount['companyName'],
        "token"              => $token,
        "subscriptionPlan"   => $currentAccount['subscriptionPlan'] ?? 'free',
        "subscriptionStatus" => Helper::computeSubscriptionStatus($currentAccount),
        "createdAt"          => $currentAccount['createdAt'],
        "primaryColor"       => $currentAccount['primaryColor'] ?? '#B38E36',
        "secondaryColor"     => $currentAccount['secondaryColor'] ?? null,
        "accentColor"        => $currentAccount['accentColor'] ?? null,
        "role"               => $currentAccount['role'] ?? 'user',
        "smtpHost"           => $currentAccount['smtpHost'] ?? null,
        "legalForm"          => $currentAccount['legalForm'] ?? null,
        "rccm"               => $currentAccount['rccm'] ?? null,
        "taxRegime"          => $currentAccount['taxRegime'] ?? null,
        "defaultVatRate"     => $currentAccount['defaultVatRate'] ?? null,
        "taxId"              => $currentAccount['taxId'] ?? null,
        "bankName"           => $currentAccount['bankName'] ?? null,
        "bankAccount"        => $currentAccount['bankAccount'] ?? null,
        "currency"           => $currentAccount['currency'] ?? 'XOF',
    ];

    // 2. Notifications non lues (1 requête simple avec index)
    $notifications = [];
    try {
        $stmt = $pdo->prepare(
            "SELECT * FROM Notification WHERE accountId = ? AND isRead = 0 ORDER BY createdAt DESC LIMIT 20"
        );
        $stmt->execute([$accountId]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log("Init notifications error: " . $e->getMessage());
    }

    echo json_encode([
        "user"          => $userData,
        "notifications" => $notifications,
        "timestamp"     => time(),
    ]);
    exit;
}

if (!empty($currentAccount['isSuspended'])) {
    http_response_code(403); echo json_encode(["error" => "Votre compte a été suspendu par l'administration."]); exit;
}

$computedStatus = Helper::computeSubscriptionStatus($currentAccount);
if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    if ($computedStatus === 'trial_expired') {
        http_response_code(403);
        echo json_encode(["error" => "Votre période d'essai est expirée. Veuillez vous abonner pour effectuer cette action."]);
        exit;
    }
    if ($computedStatus === 'expired') {
        http_response_code(403);
        echo json_encode(["error" => "Votre abonnement a expiré. Veuillez le renouveler pour effectuer cette action."]);
        exit;
    }
}

// ==========================================
// API ROUTES (DISPATCHER)
// ==========================================
try {
    Router::dispatch($resource, $id, $subAction, $method, $pdo, $currentAccount, $body);
} catch (Throwable $e) {
    // PREVENT ERROR LEAK
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Erreur interne du serveur."]);
}
