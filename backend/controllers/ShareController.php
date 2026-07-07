<?php
class ShareController {
    public static function handle($method, $body, $currentAccount) {
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
            $pdfData = base64_decode($base64String);
            
            if ($type === 'whatsapp') {
                $uniqueName = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9_\.-]/', '', $filename);
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
                
                
                require_once __DIR__ . '/../libs/PHPMailer/Exception.php';
                require_once __DIR__ . '/../libs/PHPMailer/PHPMailer.php';
                require_once __DIR__ . '/../libs/PHPMailer/SMTP.php';
                
                $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
                try {
                    $mail->isSMTP();
                    $mail->CharSet    = 'UTF-8'; // Correction des caractères spéciaux (ex: Reçu)
                    $mail->Host       = $currentAccount['smtpHost'] ?? $currentAccount['smtphost'] ?? 'smtp.gmail.com';
                    $mail->SMTPAuth   = true;
                    
                    $smtpUser = $currentAccount['smtpUser'] ?? $currentAccount['smtpuser'] ?? '';
                    $smtpPass = $currentAccount['smtpPass'] ?? $currentAccount['smtppass'] ?? '';
                    
                    if (empty($smtpUser) || empty($smtpPass)) {
                        http_response_code(400);
                        echo json_encode(["error" => "Configuration email (SMTP) manquante dans vos paramètres."]);
                        exit;
                    }
                    
                    $mail->Username   = $smtpUser; 
                    $mail->Password   = $smtpPass; 
                    
                    $encryptionRaw = $currentAccount['smtpEncryption'] ?? $currentAccount['smtpencryption'] ?? 'tls';
                    $encryption = strtolower($encryptionRaw);
                    if ($encryption === 'ssl') {
                        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
                    } elseif ($encryption === 'none') {
                        $mail->SMTPSecure = false;
                        $mail->SMTPAutoTLS = false;
                    } else {
                        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
                    }
                    
                    $portRaw = $currentAccount['smtpPort'] ?? $currentAccount['smtpport'] ?? 587;
                    $mail->Port       = $portRaw ? (int)$portRaw : 587;
                    
                    $companyName = $currentAccount['companyName'] ?? $currentAccount['companyname'] ?? 'FacturaPro';
                    $mail->setFrom($smtpUser, $companyName);
                    $mail->addAddress($to);
                    
                    $mail->isHTML(true);
                    $mail->Subject = $subject;
                    $mail->Body    = nl2br(htmlspecialchars($message));
                    
                    $mail->addStringAttachment($pdfData, $filename, 'base64', 'application/pdf');
                    
                    $mail->send();
                    echo json_encode(["success" => true, "message" => "Email envoyé"]);
                } catch (Exception $e) {
                    http_response_code(500);
                    $errorMsg = $mail->ErrorInfo;
                    if (stripos($errorMsg, 'Could not authenticate') !== false) {
                        $errorMsg = "Vos identifiants SMTP sont incorrects. Si vous utilisez Gmail, vous devez générer un 'Mot de passe d\'application' et l\'utiliser à la place de votre mot de passe habituel.";
                    }
                    echo json_encode(["error" => $errorMsg]);
                }
            }
        }
    }
}
