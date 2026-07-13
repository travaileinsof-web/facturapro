<?php

class Router {
    public static function dispatch($resource, $id, $subAction, $method, $pdo, $currentAccount, $body) {
        $accountId = $currentAccount['id'];
        
        // Multi-Tenant API Routes
        switch ($resource) {
            case 'upload':
                UploadController::handle($method, $accountId);
                break;
            case 'settings':
                if ($id === 'convert-currency' && $method === 'POST') {
                    SettingsController::convertCurrency($pdo, $accountId, $body);
                } else {
                    SettingsController::handle($pdo, $method, $accountId, $body, $currentAccount);
                }
                break;
            case 'companies':
                $segments = [$resource, $id, $subAction];
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
            case 'notifications':
                NotificationController::handle($pdo, $method, $id, $accountId, $body);
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
                    if (isset($response['status']) && is_numeric($response['status'])) {
                        http_response_code((int)$response['status']);
                    } elseif (isset($response['error'])) {
                        http_response_code(500);
                    }
                    echo json_encode($response);
                    exit;
                }
                break;
            case 'debug':
                $stmt = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
                echo json_encode($stmt->fetchAll(PDO::FETCH_COLUMN));
                exit;
            default:
                http_response_code(404);
                echo json_encode(["error" => "Endpoint not found"]);
                break;
        }
    }
}
