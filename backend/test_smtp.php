<?php
require_once __DIR__ . '/config.php';
$pdo = new PDO("sqlite:" . DB_PATH);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $pdo->query("SELECT * FROM Account WHERE email = 'comptable@gmail.com'");
$account = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$account) {
    die("Aucun compte trouvé.\n");
}

if (empty($account['smtpUser']) || empty($account['smtpPass'])) {
    die("SMTP non configuré pour le compte {$account['email']}.\n");
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
    $mail->addAddress($account['email']); // Send to self
    
    $mail->isHTML(true);
    $mail->Subject = 'Test SMTP FacturaPro';
    $mail->Body    = 'Ceci est un email de test pour vérifier la configuration SMTP.';
    
    echo "Tentative d'envoi via {$mail->Host}:{$mail->Port} ({$encryption}) avec l'utilisateur {$mail->Username}...\n";
    $mail->send();
    echo "Succès ! Email envoyé.\n";
} catch (Exception $e) {
    echo "Erreur d'envoi : {$mail->ErrorInfo}\n";
}
