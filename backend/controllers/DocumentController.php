<?php
class DocumentController {
    public static function handle($pdo, $method, $id, $accountId, $body) {
        if ($method === 'GET') {
            // GET /api/documents?entityType=client&entityId=123
            $entityType = $_GET['entityType'] ?? null;
            $entityId = $_GET['entityId'] ?? null;
            
            $sql = "SELECT * FROM Document WHERE accountId = ?";
            $params = [$accountId];
            
            if ($entityType && $entityId) {
                $sql .= " AND entityType = ? AND entityId = ?";
                $params[] = $entityType;
                $params[] = $entityId;
            }
            $sql .= " ORDER BY uploadedAt DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode($stmt->fetchAll());
        } elseif ($method === 'POST') {
            $newId = Helper::uuid();
            $stmt = $pdo->prepare("INSERT INTO Document (id, accountId, entityType, entityId, fileName, fileUrl, fileType, fileSize) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $newId, 
                $accountId, 
                $body['entityType'], 
                $body['entityId'], 
                $body['fileName'], 
                $body['fileUrl'], 
                $body['fileType'] ?? null, 
                $body['fileSize'] ?? 0
            ]);
            $stmt = $pdo->prepare("SELECT * FROM Document WHERE id = ?");
            $stmt->execute([$newId]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'DELETE' && $id) {
            $stmt = $pdo->prepare("SELECT fileUrl FROM Document WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            $doc = $stmt->fetch();
            
            if ($doc) {
                // Essayer de supprimer le fichier physique si possible
                $urlParts = explode('/backend/uploads/', $doc['fileUrl']);
                if (count($urlParts) > 1) {
                    $filename = end($urlParts);
                    $filepath = __DIR__ . '/../uploads/' . $filename;
                    if (file_exists($filepath)) {
                        unlink($filepath);
                    }
                }
            }
            
            $stmt = $pdo->prepare("DELETE FROM Document WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            echo json_encode(["success" => true]);
        }
    }
}
