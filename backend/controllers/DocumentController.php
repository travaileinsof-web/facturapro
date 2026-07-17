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
            // FIX IDOR: Vérifier que l'entité liée appartient bien à l'utilisateur
            $entityType = $body['entityType'] ?? '';
            $entityId = $body['entityId'] ?? '';
            
            if ($entityType && $entityId) {
                $table = null;
                if ($entityType === 'client') $table = 'Client';
                elseif (in_array($entityType, ['facture', 'devis', 'proforma'])) $table = 'ProformaInvoice';
                elseif ($entityType === 'expense') $table = 'Expense';
                elseif ($entityType === 'company') $table = 'Company';
                
                if ($table) {
                    $stCheck = $pdo->prepare("SELECT id FROM $table WHERE id = ? AND accountId = ?");
                    $stCheck->execute([$entityId, $accountId]);
                    if (!$stCheck->fetch()) {
                        http_response_code(403); echo json_encode(["error" => "Entité introuvable ou accès refusé."]); exit;
                    }
                }
            }

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
                    $filename = basename(end($urlParts));
                    $filepath = __DIR__ . '/../uploads/' . $filename;
                    if (file_exists($filepath) && is_file($filepath)) {
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
