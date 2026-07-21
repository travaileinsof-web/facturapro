<?php
class ShareController {
    public static function handle($pdo, $method, $body, $currentAccount) {
        if ($method === 'POST') {
            $type = $body['type'] ?? 'whatsapp';
            $pdfBase64 = $body['pdfBase64'] ?? '';
            $filename = $body['filename'] ?? 'document.pdf';
            
            if (!$pdfBase64) {
                echo json_encode(["error" => "PDF manquant"]);
                exit;
            }
            
            // Correction de l'extraction de la chaîne Base64 générée par jsPDF
            $base64Parts = explode(',', $pdfBase64);
            $base64String = count($base64Parts) > 1 ? $base64Parts[1] : $base64Parts[0];
            
            // FIX CRITIQUE: Remplacer les espaces par des '+' car le transfert HTTP/JSON altère parfois la Base64
            $base64String = str_replace(' ', '+', $base64String);
            $pdfData = base64_decode($base64String);
            
            if ($type === 'whatsapp') {
                $uniqueName = uniqid() . '.pdf';
                $blobToken = getenv('BLOB_READ_WRITE_TOKEN');
                
                if ($blobToken) {
                    $ch = curl_init('https://blob.vercel-storage.com/' . $uniqueName);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $pdfData);
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
                        echo json_encode(["error" => "Erreur upload Vercel Blob: " . $response]);
                        exit;
                    }
                } else {
                    $uploadDir = __DIR__ . '/../uploads/';
                    if (!is_dir($uploadDir)) @mkdir($uploadDir, 0777, true);
                    $filePath = $uploadDir . $uniqueName;
                    $success = @file_put_contents($filePath, $pdfData);
                    
                    if ($success === false) {
                        http_response_code(500);
                        echo json_encode(["error" => "Stockage Vercel Blob non configuré et système de fichiers en lecture seule."]);
                        exit;
                    }
                    
                    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
                    $host = $_SERVER['HTTP_HOST'];
                    $baseDir = dirname($_SERVER['SCRIPT_NAME']);
                    if ($baseDir === '/' || $baseDir === '\\') $baseDir = '';
                    $publicUrl = $protocol . '://' . $host . $baseDir . '/uploads/' . $uniqueName;
                }
                
                echo json_encode(["success" => true, "url" => $publicUrl]);
            } elseif ($type === 'email') {
                $to = $body['to'] ?? '';
                $subject = $body['subject'] ?? 'Votre document';
                $message = $body['message'] ?? 'Veuillez trouver votre document en pièce jointe.';
                $companyName = $currentAccount['companyName'] ?? 'FacturaPro';
                $userEmail = $currentAccount['email'] ?? '';
                
                require_once __DIR__ . '/../core/SystemMailer.php';
                
                // On utilise l'API Resend pour éviter les blocages SMTP
                $attachment = [
                    'filename' => $filename,
                    'content' => $base64String
                ];
                
                $result = SystemMailer::sendDocument($pdo, $to, $subject, nl2br(htmlspecialchars($message)), $attachment, $userEmail);
                
                if ($result['success']) {
                    echo json_encode(["success" => true, "message" => "Email envoyé via API"]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Erreur d'envoi API: " . $result['error']]);
                }
            } else {
                http_response_code(400);        
            }
        }
    }
}
