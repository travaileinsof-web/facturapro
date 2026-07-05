<?php
if (php_sapi_name() === 'cli-server') {
    $path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
    if ($path !== '/api.php' && file_exists(__DIR__ . $path) && is_file(__DIR__ . $path)) {
        return false;
    }
}

$allowed_origins = ['http://localhost:3003', 'http://localhost:5173', 'http://localhost:5174', 'https://facturapro.local'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Autoriser toutes les origines localhost en développement
    if (preg_match('/^http:\/\/localhost(:\d+)?$/', $origin)) {
        header("Access-Control-Allow-Origin: $origin");
    }
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit;
}

require_once 'config.php';
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
require_once __DIR__ . '/controllers/ShareController.php';
require_once __DIR__ . '/controllers/UploadController.php';
require_once __DIR__ . '/controllers/CompanyController.php';
require_once __DIR__ . '/controllers/PaymentController.php';
require_once __DIR__ . '/controllers/SuperAdminController.php';

// Database Connection
try {
    if (defined('DB_CONNECTION') && DB_CONNECTION === 'pgsql') {
        $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $dbExists = true;
    } elseif (defined('DB_CONNECTION') && DB_CONNECTION === 'mysql') {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $dbExists = true; // For MySQL, assume DB exists. Migration/schema creation should be handled externally.
    } else {
        $dbExists = file_exists(DB_PATH);
        $pdo = new PDO("sqlite:" . DB_PATH);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        // Activer le mode WAL pour les accès simultanés multi-utilisateurs
        $pdo->exec("PRAGMA journal_mode = WAL;");
        // Attendre jusqu'à 5 secondes si la DB est verrouillée (évite "Database is locked")
        $pdo->exec("PRAGMA busy_timeout = 5000;");
        // Améliorer les performances de lecture
        $pdo->exec("PRAGMA synchronous = NORMAL;");
        $pdo->exec("PRAGMA cache_size = -64000;"); // 64 MB cache
        $pdo->exec("PRAGMA foreign_keys = ON;");
    }
    
    if (!$dbExists) {
        $schema = file_get_contents(__DIR__ . '/database.sql');
        if ($schema !== false) $pdo->exec($schema);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur BDD SQLite: " . $e->getMessage()]);
    exit;
}

// Lire l'endpoint depuis $_GET['endpoint'] ou depuis REQUEST_URI en fallback
// On retire tout ce qui suit un '?' pour éviter les parasites de query string
$rawEndpoint = '';
if (isset($_GET['endpoint']) && $_GET['endpoint'] !== '') {
    $rawEndpoint = $_GET['endpoint'];
} else {
    // Fallback: lire depuis REQUEST_URI (ex: /api/clients → clients)
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $rawEndpoint = preg_replace('/^\/api\.php/', '', $uri);
    $rawEndpoint = preg_replace('/^\/api\//', '', $rawEndpoint);
    $rawEndpoint = ltrim($rawEndpoint, '/');
}

// Nettoyer: extraire seulement la partie avant tout '?' ou '&' parasite
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
// AUTHENTICATION
// ==========================================
if ($resource === 'auth') {
    AuthController::handle($pdo, $method, $id, $body);
    exit;
}

if ($resource === 'v1' && $id === 'webhooks' && $subAction === 'djomy') {
    $controller = new PaymentController($pdo);
    $response = $controller->handleWebhook(['body' => $body]);
    echo json_encode($response);
    exit;
}

// ==========================================
// MIDDLEWARE: VERIFY TOKEN
// ==========================================
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$token = '';
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (!$token) {
    http_response_code(401); echo json_encode(["error" => "Non autorisé. Token manquant."]); exit;
}

$stmt = $pdo->prepare("SELECT * FROM Account WHERE token = ?");
$stmt->execute([$token]);
$currentAccount = $stmt->fetch();

if (!$currentAccount) {
    http_response_code(401); echo json_encode(["error" => "Token invalide ou expiré."]); exit;
}

$accountId = $currentAccount['id'];
$accountRole = $currentAccount['role'] ?? 'user';

if ($resource === 'admin') {
    if ($accountRole !== 'admin') {
        http_response_code(403); echo json_encode(["error" => "Accès refusé. Privilèges Super Admin requis."]); exit;
    }
    SuperAdminController::handle($pdo, $method, $id . ($subAction ? '/' . $subAction : ''), $accountId, $body);
    exit;
}

// ==========================================
// MIDDLEWARE: ENFORCE TRIAL EXPIRATION
// ==========================================
$isTrial = $currentAccount['subscriptionStatus'] === 'trial' || empty($currentAccount['subscriptionStatus']);
if ($isTrial && $method === 'POST' && in_array($resource, ['invoices', 'receipts'])) {
    $createdAtStr = $currentAccount['createdAt'] ?? date('Y-m-d H:i:s');
    $createdAt = strtotime($createdAtStr);
    $days = (time() - $createdAt) / (60 * 60 * 24);
    if ($days >= 1) {
        http_response_code(403);
        echo json_encode(["error" => "Votre période d'essai est expirée. Veuillez vous abonner pour continuer à créer des documents."]);
        exit;
    }
}

// ==========================================
// API ROUTES (Multi-Tenant)
// ==========================================
try {
    switch ($resource) {
        case 'upload':
            UploadController::handle($method, $accountId);
            break;
        case 'settings':
            SettingsController::handle($pdo, $method, $accountId, $body, $currentAccount);
            break;
        case 'companies':
            CompanyController::handle($pdo, $method, $accountId, $body, $segments);
            break;
        case 'clients':
            ClientController::handle($pdo, $method, $id, $accountId, $body);
            break;
        case 'catalog':
            CatalogController::handle($pdo, $method, $id, $accountId, $body);
            break;
        case 'invoices':
        case 'proforma':
            InvoiceController::handle($pdo, $method, $id, $accountId, $body);
            break;
        case 'receipts':
            ReceiptController::handle($pdo, $method, $id, $accountId, $body);
            break;
        case 'expenses':
            ExpenseController::handle($pdo, $method, $id, $accountId, $body);
            break;
        case 'documents':
            DocumentController::handle($pdo, $method, $id, $accountId, $body);
            break;
        case 'stats':
            StatsController::handle($pdo, $method, $accountId);
            break;
        case 'chat':
            ChatController::handle($pdo, $method, $accountId, $body, $currentAccount);
            break;
        case 'share':
            ShareController::handle($method, $body, $currentAccount);
            break;
        case 'v1':
            if ($id === 'payment' && $subAction === 'init') {
                $controller = new PaymentController($pdo);
                $response = $controller->initPayment(['body' => $body]);
                echo json_encode($response);
                exit;
            }
            break;
        default:
            http_response_code(404);
            echo json_encode(["error" => "Endpoint not found"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
