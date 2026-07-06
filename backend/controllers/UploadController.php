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

            // Convert image to Base64
            $fileData = file_get_contents($file['tmp_name']);
            $base64 = base64_encode($fileData);
            $publicUrl = 'data:' . $mime . ';base64,' . $base64;

            echo json_encode(["url" => $publicUrl]);
            exit;
        }
    }
}
