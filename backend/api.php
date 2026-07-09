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
    // Fallback safe: si l'origine n'est pas autorisée, on ne la renvoie pas
    header("Access-Control-Allow-Origin: https://facturapro.com");
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
    $dbExists = true;
    
    if (!$dbExists) {
        $schema = file_get_contents(__DIR__ . '/database.sql');
        if ($schema !== false) $pdo->exec($schema);
    }
} catch (PDOException $e) {
    // PREVENT ERROR LEAK
    error_log("DB Connection Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Erreur interne du serveur de base de données."]);
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
if ($resource === 'auth' && in_array($id, ['login', 'register'])) {
    try {
        AuthController::handle($pdo, $method, $id, $body);
    } catch (Throwable $e) {
        error_log("Auth Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => "Erreur interne lors de l'authentification."]);
    }
    exit;
}

if ($resource === 'admin_auth') {
    AdminAuthController::handle($pdo, $method, $id, $body);
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
    $stmt = $pdo->prepare("SELECT * FROM SuperAdmin WHERE token = ?");
    $stmt->execute([$token]);
    $currentAdmin = $stmt->fetch();
    
    if (!$currentAdmin) {
        http_response_code(403); echo json_encode(["error" => "Accès refusé. Token SuperAdmin invalide."]); exit;
    }
    
    if ($id === 'settings') {
        AdminSettingsController::handle($pdo, $method, $body);
        exit;
    }
    
    SuperAdminController::handle($pdo, $method, $id . ($subAction ? '/' . $subAction : ''), $currentAdmin['id'], $body);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM Account WHERE token = ?");
$stmt->execute([$token]);
$currentAccount = $stmt->fetch();

if (!$currentAccount) {
    http_response_code(401); echo json_encode(["error" => "Token invalide ou expiré."]); exit;
}

if ($resource === 'auth' && $id === 'me') {
    echo json_encode([
        "id" => $currentAccount['id'], 
        "name" => trim($currentAccount['firstName'] . " " . $currentAccount['lastName']),
        "email" => $currentAccount['email'], 
        "company" => $currentAccount['companyName'], 
        "token" => $currentAccount['token'],
        "subscriptionPlan" => $currentAccount['subscriptionPlan'] ?? 'free',
        "subscriptionStatus" => $currentAccount['subscriptionStatus'] ?? 'trial',
        "createdAt" => $currentAccount['createdAt'],
        "primaryColor" => $currentAccount['primaryColor'] ?? '#B38E36',
        "secondaryColor" => $currentAccount['secondaryColor'] ?? null,
        "accentColor" => $currentAccount['accentColor'] ?? null,
        "role" => $currentAccount['role'] ?? 'user'
    ]);
    exit;
}

if (!empty($currentAccount['isSuspended'])) {
    http_response_code(403); echo json_encode(["error" => "Votre compte a été suspendu par l'administration."]); exit;
}

$isTrial = $currentAccount['subscriptionStatus'] === 'trial' || empty($currentAccount['subscriptionStatus']);
if ($isTrial && $method === 'POST' && in_array($resource, ['invoices', 'receipts'])) {
    $createdAtStr = $currentAccount['createdAt'] ?? date('Y-m-d H:i:s');
    $createdAt = strtotime($createdAtStr);
    $days = (time() - $createdAt) / (60 * 60 * 24);
    if ($days >= 1) {
        http_response_code(403);
        echo json_encode(["error" => "Votre période d'essai est expirée. Veuillez vous abonner."]);
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
    echo json_encode(["error" => "Erreur interne: " . $e->getMessage() . " on line " . $e->getLine() . " in " . $e->getFile()]);
}
