<?php

class NotificationService {
    public static function createNotification($pdo, $accountId, $title, $message, $type = 'info') {
        try {
            $id = uniqid('notif_');
            $stmt = $pdo->prepare("
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

    public static function getUnreadNotifications($pdo, $accountId) {
        try {
            $stmt = $pdo->prepare("
                SELECT * FROM Notification 
                WHERE accountId = ? AND isRead = 0 
                ORDER BY createdAt DESC
            ");
            $stmt->execute([$accountId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("NotificationService::getUnreadNotifications Error: " . $e->getMessage());
            return [];
        }
    }

    public static function getAllNotifications($pdo, $accountId) {
        try {
            $stmt = $pdo->prepare("
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

    public static function markAsRead($pdo, $id, $accountId) {
        try {
            $stmt = $pdo->prepare("
                UPDATE Notification SET isRead = 1 
                WHERE id = ? AND accountId = ?
            ");
            $stmt->execute([$id, $accountId]);
            return true;
        } catch (Exception $e) {
            error_log("NotificationService::markAsRead Error: " . $e->getMessage());
            return false;
        }
    }

    public static function markAllAsRead($pdo, $accountId) {
        try {
            $stmt = $pdo->prepare("
                UPDATE Notification SET isRead = 1 
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
