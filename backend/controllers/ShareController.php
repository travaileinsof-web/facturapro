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
            
            $pdfData = base64_decode(preg_replace('#^data:application/pdf;base64,#i', '', $pdfBase64));
            
            if ($type === 'whatsapp') {
                $uploadDir = __DIR__ . '/../uploads/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                $uniqueName = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9_\.-]/', '', $filename);
                $filePath = $uploadDir . $uniqueName;
                file_put_contents($filePath, $pdfData);
                
                // URL builder
                $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
                $host = $_SERVER['HTTP_HOST'];
                $baseDir = dirname($_SERVER['SCRIPT_NAME']);
                if ($baseDir === '/' || $baseDir === '\\') $baseDir = '';
                $publicUrl = $protocol . '://' . $host . $baseDir . '/uploads/' . $uniqueName;
                
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
                    $mail->Host       = $currentAccount['smtpHost'] ?? 'smtp.gmail.com';
                    $mail->SMTPAuth   = true;
                    
                    $smtpUser = $currentAccount['smtpUser'] ?? '';
                    $smtpPass = $currentAccount['smtpPass'] ?? '';
                    
                    if (empty($smtpUser) || empty($smtpPass)) {
                        http_response_code(400);
                        echo json_encode(["error" => "Configuration email (SMTP) manquante dans vos paramètres."]);
                        exit;
                    }
                    
                    $mail->Username   = $smtpUser; 
                    $mail->Password   = $smtpPass; 
                    
                    $encryption = strtolower($currentAccount['smtpEncryption'] ?? 'tls');
                    if ($encryption === 'ssl') {
                        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
                    } elseif ($encryption === 'none') {
                        $mail->SMTPSecure = false;
                        $mail->SMTPAutoTLS = false;
                    } else {
                        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
                    }
                    
                    $mail->Port       = $currentAccount['smtpPort'] ? (int)$currentAccount['smtpPort'] : 587;
                    
                    $mail->setFrom($smtpUser, $currentAccount['companyName'] ?? 'FacturaPro');
                    $mail->addAddress($to);
                    
                    $mail->isHTML(true);
                    $mail->Subject = $subject;
                    $mail->Body    = nl2br(htmlspecialchars($message));
                    
                    $mail->addStringAttachment($pdfData, $filename, 'base64', 'application/pdf');
                    
                    $mail->send();
                    echo json_encode(["success" => true, "message" => "Email envoyé"]);
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(["error" => "Erreur: {$mail->ErrorInfo}"]);
                }
            }
        }
    }
}
