<?php
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Utils.php';

class NotificationService {
    private static function getDb() {
        return Database::getInstance()->getConnection();
    }

    public static function createNotification($accountId, $title, $message, $type = 'info') {
        try {
            $db = self::getDb();
            $id = Utils::generateId('notif');
            $stmt = $db->prepare("
                INSERT INTO Notification (id, accountId, title, message, type)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$id, $accountId, $title, $message, $type]);
            return true;
        } catch (Exception $e) {
            error_log("NotificationService::createNotification Error: " . $e->getMessage());
            return false;
        }
    }

    public static function getUnreadNotifications($accountId) {
        try {
            $db = self::getDb();
            $stmt = $db->prepare("
                SELECT * FROM Notification 
                WHERE accountId = ? AND isRead = FALSE 
                ORDER BY createdAt DESC
            ");
            $stmt->execute([$accountId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("NotificationService::getUnreadNotifications Error: " . $e->getMessage());
            return [];
        }
    }

    public static function getAllNotifications($accountId) {
        try {
            $db = self::getDb();
            $stmt = $db->prepare("
                SELECT * FROM Notification 
                WHERE accountId = ? 
                ORDER BY createdAt DESC 
                LIMIT 50
            ");
            $stmt->execute([$accountId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("NotificationService::getAllNotifications Error: " . $e->getMessage());
            return [];
        }
    }

    public static function markAsRead($id, $accountId) {
        try {
            $db = self::getDb();
            $stmt = $db->prepare("
                UPDATE Notification SET isRead = TRUE 
                WHERE id = ? AND accountId = ?
            ");
            $stmt->execute([$id, $accountId]);
            return true;
        } catch (Exception $e) {
            error_log("NotificationService::markAsRead Error: " . $e->getMessage());
            return false;
        }
    }

    public static function markAllAsRead($accountId) {
        try {
            $db = self::getDb();
            $stmt = $db->prepare("
                UPDATE Notification SET isRead = TRUE 
                WHERE accountId = ?
            ");
            $stmt->execute([$accountId]);
            return true;
        } catch (Exception $e) {
            error_log("NotificationService::markAllAsRead Error: " . $e->getMessage());
            return false;
        }
    }
}
