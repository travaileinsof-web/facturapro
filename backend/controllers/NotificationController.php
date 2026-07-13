<?php
require_once __DIR__ . '/../core/NotificationService.php';

class NotificationController {
    
    public static function handle($pdo, $method, $id, $accountId, $body) {
        if ($method === 'GET') {
            if ($id === 'unread') {
                $notifications = NotificationService::getUnreadNotifications($accountId);
                echo json_encode($notifications);
                return;
            } else {
                $notifications = NotificationService::getAllNotifications($accountId);
                echo json_encode($notifications);
                return;
            }
        }
        
        if ($method === 'POST' || $method === 'PUT') {
            if ($id === 'read-all') {
                $success = NotificationService::markAllAsRead($accountId);
                if ($success) {
                    echo json_encode(["success" => true]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Erreur lors de la mise à jour"]);
                }
                return;
            } elseif ($id) {
                // ex: /api/notifications/:id/read
                // But typically $id is just the id. Let's assume POST to /api/notifications/:id means mark as read.
                $success = NotificationService::markAsRead($id, $accountId);
                if ($success) {
                    echo json_encode(["success" => true]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Erreur lors de la mise à jour"]);
                }
                return;
            }
        }
        
        http_response_code(405);
        echo json_encode(["error" => "Méthode non autorisée"]);
    }
}

