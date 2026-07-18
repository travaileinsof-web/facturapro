<?php
require_once __DIR__ . '/config.php';
$pdo = new PDO("sqlite:" . DB_PATH);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $pdo->query("SELECT * FROM PlatformSettings WHERE id = 'global'");
$account = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$account || empty($account['smtpUser']) || empty($account['smtpPass'])) {
    die("Configuration SMTP globale non trouvée ou incomplète.\n");
}

require_once __DIR__ . '/libs/PHPMailer/Exception.php';
require_once __DIR__ . '/libs/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/libs/PHPMailer/SMTP.php';

$mail = new \PHPMailer\PHPMailer\PHPMailer(true);
try {
    // Enable verbose debug output
    $mail->SMTPDebug = \PHPMailer\PHPMailer\SMTP::DEBUG_SERVER;
    
    $mail->isSMTP();
    $mail->Host       = $account['smtpHost'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $account['smtpUser'];
    $mail->Password   = $account['smtpPass'];
    
    $encryption = strtolower($account['smtpEncryption'] ?? 'tls');
    if ($encryption === 'ssl') {
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($encryption === 'none') {
        $mail->SMTPSecure = false;
        $mail->SMTPAutoTLS = false;
    } else {
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    }
    
    $mail->Port       = $account['smtpPort'] ? (int)$account['smtpPort'] : 587;
    
    $mail->setFrom($account['smtpUser'], 'Test FacturaPro');
    $mail->addAddress($account['smtpUser']); // Send to self
    
    $mail->isHTML(true);
    $mail->Subject = 'Test SMTP FacturaPro';
    $mail->Body    = 'Ceci est un email de test pour vérifier la configuration SMTP.';
    
    echo "Tentative d'envoi via {$mail->Host}:{$mail->Port} ({$encryption}) avec l'utilisateur {$mail->Username}...\n";
    $mail->send();
    echo "Succès ! Email envoyé.\n";
} catch (Exception $e) {
    echo "Erreur d'envoi : {$mail->ErrorInfo}\n";
}
