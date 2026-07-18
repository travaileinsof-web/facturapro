<?php
/**
 * test_email.php - Teste l'envoi SMTP du premier compte configuré
 * Usage : php backend/test_email.php
 * Ou pour un email cible différent : php backend/test_email.php mon@email.com
 */
require 'config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require_once __DIR__ . '/libs/PHPMailer/Exception.php';
require_once __DIR__ . '/libs/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/libs/PHPMailer/SMTP.php';

$pdo = new PDO('sqlite:' . DB_PATH);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Récupérer la configuration SMTP globale
$stmt = $pdo->query("SELECT * FROM PlatformSettings WHERE id = 'global'");
$account = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$account || empty($account['smtpUser']) || empty($account['smtpPass'])) {
    die("❌ Aucune configuration SMTP globale trouvée.\n   → Allez dans le panel SuperAdmin et renseignez votre hôte SMTP, email et mot de passe.\n");
}

$companyName = $account['companyName'] ?? 'FacturaPro';
echo "✅ Configuration globale trouvée : {$companyName}\n";
echo "   SMTP Host : {$account['smtpHost']}\n";
echo "   SMTP Port : {$account['smtpPort']}\n";
echo "   SMTP User : {$account['smtpUser']}\n\n";

// Destinataire du test (l'email du compte lui-même par défaut, ou argument CLI)
$toEmail = $argv[1] ?? $account['smtpUser'];
echo "📧 Envoi d'un email de test vers : $toEmail\n\n";

$mail = new PHPMailer(true);
try {
    $mail->SMTPDebug  = 2; // Affiche les détails de la connexion SMTP
    $mail->isSMTP();
    $mail->Host       = $account['smtpHost'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $account['smtpUser'];
    $mail->Password   = $account['smtpPass'];

    $port = intval($account['smtpPort'] ?: 465);
    $mail->Port       = $port;
    $mail->SMTPSecure = ($port === 587) ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;

    $mail->CharSet = 'UTF-8';
    $mail->setFrom($account['smtpUser'], $account['companyName']);
    $mail->addAddress($toEmail);

    $mail->isHTML(true);
    $mail->Subject = '✅ [FacturaPro] Test d\'envoi SMTP réussi';
    $mail->Body    = "
    <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:8px;'>
        <h2 style='color:#0f172a;'>✅ Votre configuration email fonctionne !</h2>
        <p>Bonjour,</p>
        <p>Si vous recevez cet e-mail, cela signifie que votre configuration SMTP dans <strong>FacturaPro</strong> est correcte et opérationnelle.</p>
        <hr style='border:none;border-top:1px solid #e2e8f0;margin:20px 0;'/>
        <p style='font-size:12px;color:#64748b;'>Envoyé depuis FacturaPro via {$account['smtpHost']}:{$port}</p>
    </div>
    ";
    $mail->AltBody = "Votre configuration SMTP FacturaPro est opérationnelle. Cet email confirme que les relances automatiques fonctionneront correctement.";

    $mail->send();
    echo "\n✅ EMAIL ENVOYÉ AVEC SUCCÈS !\n";
    echo "   Vérifiez votre boîte mail : $toEmail\n";
} catch (Exception $e) {
    echo "\n❌ ÉCHEC DE L'ENVOI :\n";
    echo "   Erreur : {$mail->ErrorInfo}\n\n";
    echo "Solutions possibles :\n";
    echo "   - Gmail : Activez la validation en 2 étapes et générez un 'Mot de passe d'application'\n";
    echo "   - Vérifiez que le port ({$port}) est correct (Gmail: 587 avec STARTTLS, ou 465 avec SSL)\n";
    echo "   - Assurez-vous que votre hébergeur n'a pas bloqué les connexions SMTP sortantes\n";
}
