<?php
class CatalogController {
    public static function handle($pdo, $method, $id, $accountId, $body) {
        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT id, accountId, name, description, unitprice as \"unitPrice\", type, category, components, createdAt FROM CatalogItem WHERE accountId = ? ORDER BY createdAt DESC");
            $stmt->execute([$accountId]);
            echo json_encode($stmt->fetchAll());
        } elseif ($method === 'POST') {
            $name = substr(Validator::sanitizeString($body['name'] ?? ''), 0, 255);
            if (empty($name)) {
                http_response_code(400);
                echo json_encode(["error" => "Le nom du produit ou service est requis"]);
                return;
            }
            $desc = Validator::sanitizeString($body['description'] ?? null);
            $type = substr(Validator::sanitizeString($body['type'] ?? 'service'), 0, 20);
            if (!in_array($type, ['service', 'produit'])) $type = 'service';
            $unitPrice = (float)($body['unitPrice'] ?? 0);
            $category = substr(Validator::sanitizeString($body['category'] ?? 'Général'), 0, 100);
            $comps = isset($body['components']) ? json_encode(Validator::sanitizeArray($body['components'])) : null;

            $newId = Helper::uuid();
            $stmt = $pdo->prepare("INSERT INTO CatalogItem (id, accountId, name, description, type, unitprice, category, components) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $accountId, $name, $desc, $type, $unitPrice, $category, $comps]);
            $stmt = $pdo->prepare("SELECT id, accountId, name, description, unitprice as \"unitPrice\", type, category, components, createdAt FROM CatalogItem WHERE id = ? AND accountId = ?");
            $stmt->execute([$newId, $accountId]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'PUT' && $id) {
            $name = substr(Validator::sanitizeString($body['name'] ?? ''), 0, 255);
            if (empty($name)) {
                http_response_code(400);
                echo json_encode(["error" => "Le nom du produit ou service est requis"]);
                return;
            }
            $desc = Validator::sanitizeString($body['description'] ?? null);
            $type = substr(Validator::sanitizeString($body['type'] ?? 'service'), 0, 20);
            if (!in_array($type, ['service', 'produit'])) $type = 'service';
            $unitPrice = (float)($body['unitPrice'] ?? 0);
            $category = substr(Validator::sanitizeString($body['category'] ?? 'Général'), 0, 100);
            $comps = isset($body['components']) ? json_encode(Validator::sanitizeArray($body['components'])) : null;

            $stmt = $pdo->prepare("UPDATE CatalogItem SET name=?, description=?, type=?, unitprice=?, category=?, components=?, updatedAt=CURRENT_TIMESTAMP WHERE id=? AND accountId=?");
            $stmt->execute([$name, $desc, $type, $unitPrice, $category, $comps, $id, $accountId]);
            $stmt = $pdo->prepare("SELECT id, accountId, name, description, unitprice as \"unitPrice\", type, category, components, createdAt FROM CatalogItem WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'DELETE' && $id) {
            $stmt = $pdo->prepare("DELETE FROM CatalogItem WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            echo json_encode(["success" => true]);
        }
    }
}
