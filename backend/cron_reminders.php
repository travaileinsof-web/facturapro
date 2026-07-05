<?php
// cron_reminders.php - À exécuter tous les jours via Cron Vercel

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$cronSecret = getenv('CRON_SECRET');
if ($cronSecret && $authHeader !== "Bearer $cronSecret") {
    http_response_code(401);
    die("Unauthorized");
}

require_once __DIR__ . '/controllers/Helper.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require_once __DIR__ . '/libs/PHPMailer/Exception.php';
require_once __DIR__ . '/libs/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/libs/PHPMailer/SMTP.php';

require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    if (class_exists('MyPDOStatement')) {
        $pdo->setAttribute(PDO::ATTR_STATEMENT_CLASS, ['MyPDOStatement', []]);
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (Exception $e) {
    die("Database error");
}

echo "[" . date('Y-m-d H:i:s') . "] Démarrage de la vérification des relances automatiques...\n";

// 1. Récupérer les comptes où l'automatisation est activée
$stmt = $pdo->query("SELECT * FROM Account WHERE autoRemindersEnabled = 1 AND autoReminderDays IS NOT NULL AND autoReminderDays != ''");
$accounts = $stmt->fetchAll();

foreach ($accounts as $account) {
    echo "Traitement du compte : {$account['companyName']} (ID: {$account['id']})\n";
    
    $daysStr = trim($account['autoReminderDays']);
    $daysStr = trim($daysStr, "[]");
    $daysArr = explode(',', $daysStr);
    $daysConfig = array_map('intval', array_map('trim', $daysArr));

    if (empty($daysConfig) && $daysStr === "") {
        continue;
    }

    $invStmt = $pdo->prepare("SELECT i.*, c.name as clientName, c.phone as clientPhone, c.email as clientEmail 
                              FROM ProformaInvoice i 
                              JOIN Client c ON i.clientId = c.id 
                              WHERE i.accountId = ? AND i.status != 'payée' AND i.dueDate IS NOT NULL AND i.dueDate != ''");
    $invStmt->execute([$account['id']]);
    $invoices = $invStmt->fetchAll();

    $today = new DateTime();
    $today->setTime(0, 0, 0);

    foreach ($invoices as $inv) {
        try {
            $dueDate = new DateTime($inv['dueDate']);
            $dueDate->setTime(0, 0, 0);
        } catch(Exception $e) { continue; }
        
        $interval = $today->diff($dueDate);
        $diffInDays = $interval->days;
        if ($interval->invert == 1) { 
            $diffInDays = -$diffInDays;
        }

        if (in_array($diffInDays, $daysConfig)) {
            $rawReminders = $inv['remindersSent'] ?? null;
            $remindersSent = [];
            if ($rawReminders && $rawReminders !== 'null') {
                $decoded = json_decode($rawReminders, true);
                if (is_array($decoded)) $remindersSent = $decoded;
            }

            if (!in_array($diffInDays, $remindersSent)) {
                echo " -> Facture {$inv['number']} : Relance nécessaire pour le jour $diffInDays.\n";
                
                $sentEmail = false;

                if (!empty($inv['clientEmail']) && !empty($account['smtpHost']) && !empty($account['smtpUser']) && !empty($account['smtpPass'])) {
                    $mail = new PHPMailer(true);
                    try {
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
                        $mail->addAddress($inv['clientEmail'], $inv['clientName']);

                        $mail->isHTML(true);
                        $subjectPrefix = ($diffInDays < 0) ? "Rappel d'échéance : " : (($diffInDays == 0) ? "Aujourd'hui est la date d'échéance : " : "Retard de paiement : ");
                        $mail->Subject = $subjectPrefix . 'Facture N° ' . $inv['number'];
                        
                        $bodyHtml = "<h2>Bonjour " . htmlspecialchars($inv['clientName']) . ",</h2>";
                        $bodyHtml .= "<p>" . nl2br(htmlspecialchars($account['whatsappMessage'] ?: "Voici un rappel concernant votre facture.")) . "</p>";
                        $bodyHtml .= "<p><strong>Facture N° :</strong> " . $inv['number'] . "<br/>";
                        $bodyHtml .= "<strong>Montant :</strong> " . number_format($inv['total'], 2, ',', ' ') . " " . ($account['currency'] ?? 'XOF') . "<br/>";
                        if ($diffInDays < 0) {
                            $bodyHtml .= "<strong>Échéance dans :</strong> " . abs($diffInDays) . " jours</p>";
                        } elseif ($diffInDays == 0) {
                            $bodyHtml .= "<strong>Échéance :</strong> Aujourd'hui</p>";
                        } else {
                            $bodyHtml .= "<strong>Retard :</strong> " . $diffInDays . " jours</p>";
                        }
                        
                        $mail->Body    = $bodyHtml;
                        $mail->AltBody = strip_tags(str_replace(['<br/>', '<br>'], "\n", $bodyHtml));

                        $mail->send();
                        $sentEmail = true;
                        echo "    [Email] Relance envoyée avec succès à {$inv['clientEmail']} via SMTP.\n";
                    } catch (Exception $e) {
                        echo "    [Email] Erreur lors de l'envoi SMTP : {$mail->ErrorInfo}\n";
                    }
                }

                if ($sentEmail) {
                    $remindersSent[] = $diffInDays;
                    $upd = $pdo->prepare("UPDATE ProformaInvoice SET remindersSent = ?, lastReminderDate = CURRENT_TIMESTAMP WHERE id = ?");
                    $upd->execute([json_encode($remindersSent), $inv['id']]);
                } else {
                    echo "    Aucun canal disponible (Email) pour l'envoi.\n";
                }
            }
        }
    }
}

echo "[" . date('Y-m-d H:i:s') . "] Vérification terminée.\n";
