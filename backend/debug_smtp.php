<?php
require 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$host = 'ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech';
$db   = 'neondb';
$user = 'neondb_owner';
$pass = 'npg_S8GTJ7bfBdjx';

try {
    $dsn = "pgsql:host=$host;port=5432;dbname=$db;sslmode=require";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $stmt = $pdo->query("SELECT * FROM PlatformSettings WHERE id = 'global'");
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$settings || empty($settings['smtpuser'])) {
        die("SMTP User is empty in PlatformSettings.\n");
    }

    echo "Using SMTP Host: " . $settings['smtphost'] . "\n";
    echo "Using SMTP Port: " . $settings['smtpport'] . "\n";
    echo "Using SMTP User: " . $settings['smtpuser'] . "\n";
    echo "Using SMTP Pass: " . ($settings['smtppass'] ? "********" : "EMPTY") . "\n";
    
    $mail = new PHPMailer(true);
    $mail->SMTPDebug = 3; // Enable verbose debug output
    $mail->isSMTP();
    $mail->Host       = $settings['smtphost'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $settings['smtpuser'];
    $mail->Password   = $settings['smtppass'];
    $mail->SMTPSecure = $settings['smtpencryption'] ?? PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $settings['smtpport'];

    $mail->setFrom($settings['smtpuser'], 'FacturaPro Test');
    $mail->addAddress($settings['smtpuser']); 
    
    $mail->isHTML(true);
    $mail->Subject = 'Test Email Facturapro';
    $mail->Body    = 'Ceci est un test de configuration SMTP.';

    $mail->send();
    echo "Message a été envoyé avec succès\n";

} catch (Exception $e) {
    echo "L'email ne peut pas être envoyé. Mailer Error: {$mail->ErrorInfo}\n";
} catch (\PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
