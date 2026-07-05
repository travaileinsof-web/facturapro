<?php
class UploadController {
    public static function handle($method, $accountId) {
        if ($method === 'POST') {
            if (empty($_FILES['file'])) {
                http_response_code(400);
                echo json_encode(["error" => "Aucun fichier reçu."]);
                exit;
            }

            $file = $_FILES['file'];
            
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            $allowedMimes = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/gif' => 'gif',
                'image/webp' => 'webp',
                'image/svg+xml' => 'svg',
                'application/pdf' => 'pdf',
                'application/msword' => 'doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx'
            ];

            if (!array_key_exists($mime, $allowedMimes)) {
                http_response_code(400);
                echo json_encode(["error" => "Type de fichier non autorisé. Utilisez JPG, PNG, PDF ou DOCX."]);
                exit;
            }

            $maxSize = 5 * 1024 * 1024; // 5 MB max
            if ($file['size'] > $maxSize) {
                http_response_code(400);
                echo json_encode(["error" => "Fichier trop volumineux (max 5 MB)."]);
                exit;
            }

            $ext = $allowedMimes[$mime];
            $filename = 'file_' . $accountId . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
            $blobToken = getenv('BLOB_READ_WRITE_TOKEN');
            
            if ($blobToken) {
                $fileData = file_get_contents($file['tmp_name']);
                $ch = curl_init('https://blob.vercel-storage.com/' . $filename);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
                curl_setopt($ch, CURLOPT_POSTFIELDS, $fileData);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'authorization: Bearer ' . $blobToken,
                    'x-api-version: 7'
                ]);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if ($httpCode === 200) {
                    $blobData = json_decode($response, true);
                    $publicUrl = $blobData['url'];
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Erreur Vercel Blob: " . $response]);
                    exit;
                }
            } else {
                $uploadDir = __DIR__ . '/../uploads/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                $destination = $uploadDir . $filename;

                if (!move_uploaded_file($file['tmp_name'], $destination)) {
                    http_response_code(500);
                    echo json_encode(["error" => "Erreur lors de la sauvegarde du fichier."]);
                    exit;
                }
                $publicUrl = '/backend/uploads/' . $filename;
            }

            echo json_encode(["url" => $publicUrl]);
            exit;
        }
    }
}
