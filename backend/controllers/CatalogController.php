<?php
class CatalogController {
    public static function handle($pdo, $method, $id, $accountId, $body) {
        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT * FROM CatalogItem WHERE accountId = ? ORDER BY createdAt DESC");
            $stmt->execute([$accountId]);
            echo json_encode($stmt->fetchAll());
        } elseif ($method === 'POST') {
            $name = Validator::sanitizeString($body['name'] ?? '');
            $desc = Validator::sanitizeString($body['description'] ?? null);
            $type = Validator::sanitizeString($body['type'] ?? 'service');
            $category = Validator::sanitizeString($body['category'] ?? 'Général');
            $comps = isset($body['components']) ? json_encode(Validator::sanitizeArray($body['components'])) : null;

            $newId = Helper::uuid();
            $stmt = $pdo->prepare("INSERT INTO CatalogItem (id, accountId, name, description, type, unitPrice, category, components) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $accountId, $name, $desc, $type, $body['unitPrice']??0, $category, $comps]);
            $stmt = $pdo->prepare("SELECT * FROM CatalogItem WHERE id = ?");
            $stmt->execute([$newId]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'PUT' && $id) {
            $name = Validator::sanitizeString($body['name'] ?? '');
            $desc = Validator::sanitizeString($body['description'] ?? null);
            $type = Validator::sanitizeString($body['type'] ?? 'service');
            $category = Validator::sanitizeString($body['category'] ?? 'Général');
            $comps = isset($body['components']) ? json_encode(Validator::sanitizeArray($body['components'])) : null;

            $stmt = $pdo->prepare("UPDATE CatalogItem SET name=?, description=?, type=?, unitPrice=?, category=?, components=? WHERE id=? AND accountId=?");
            $stmt->execute([$name, $desc, $type, $body['unitPrice']??0, $category, $comps, $id, $accountId]);
            $stmt = $pdo->prepare("SELECT * FROM CatalogItem WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'DELETE' && $id) {
            $stmt = $pdo->prepare("DELETE FROM CatalogItem WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            echo json_encode(["success" => true]);
        }
    }
}
