<?php
// cron_reminders.php - À exécuter tous les jours via Cron (ex: 08:00 AM)
// Simulation locale: php backend/cron_reminders.php

require_once __DIR__ . '/controllers/Helper.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require_once __DIR__ . '/libs/PHPMailer/Exception.php';
require_once __DIR__ . '/libs/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/libs/PHPMailer/SMTP.php';

require_once __DIR__ . '/config.php';

$pdo = new PDO('sqlite:' . DB_PATH);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec("PRAGMA journal_mode = WAL;");
$pdo->exec("PRAGMA busy_timeout = 5000;");
$pdo->exec("PRAGMA foreign_keys = ON;");

echo "[" . date('Y-m-d H:i:s') . "] Démarrage de la vérification des relances automatiques...\n";

// 1. Récupérer les comptes où l'automatisation est activée
$stmt = $pdo->query("SELECT * FROM Account WHERE autoRemindersEnabled = 1 AND autoReminderDays IS NOT NULL AND autoReminderDays != ''");
$accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($accounts as $account) {
    echo "Traitement du compte : {$account['companyName']} (ID: {$account['id']})\n";
    
    // Convertir "[ -5, -3, 0 ]" en tableau PHP
    $daysStr = trim($account['autoReminderDays']);
    $daysStr = trim($daysStr, "[]");
    $daysArr = explode(',', $daysStr);
    $daysConfig = array_map('intval', array_map('trim', $daysArr));

    if (empty($daysConfig) && $daysStr === "") {
        continue;
    }

    // 2. Récupérer les factures non payées avec une date d'échéance
    $invStmt = $pdo->prepare("SELECT i.*, c.name as clientName, c.phone as clientPhone, c.email as clientEmail 
                              FROM ProformaInvoice i 
                              JOIN Client c ON i.clientId = c.id 
                              WHERE i.accountId = ? AND i.status != 'payée' AND i.dueDate IS NOT NULL AND i.dueDate != ''");
    $invStmt->execute([$account['id']]);
    $invoices = $invStmt->fetchAll(PDO::FETCH_ASSOC);

    $today = new DateTime();
    $today->setTime(0, 0, 0);

    foreach ($invoices as $inv) {
        try {
            $dueDate = new DateTime($inv['dueDate']);
            $dueDate->setTime(0, 0, 0);
        } catch(Exception $e) { continue; }
        
        $interval = $today->diff($dueDate);
        // Si today < dueDate => on est en avance (négatif)
        // Si today > dueDate => on est en retard (positif)
        // $interval->invert vaut 1 si $dueDate est dans le futur par rapport à $today
        // Pour que 5 jours avant corresponde à -5, on fait :
        $diffInDays = $interval->days;
        if ($interval->invert == 1) { // L'échéance est dans le futur
            $diffInDays = -$diffInDays;
        }

        // Est-ce que cette différence de jours est dans la configuration des relances ?
        if (in_array($diffInDays, $daysConfig)) {
            $rawReminders = $inv['remindersSent'] ?? null;
            $remindersSent = [];
            if ($rawReminders && $rawReminders !== 'null') {
                $decoded = json_decode($rawReminders, true);
                if (is_array($decoded)) $remindersSent = $decoded;
            }

            // A-t-on déjà envoyé une relance pour ce jour (-5, 0, etc.) ?
            if (!in_array($diffInDays, $remindersSent)) {
                echo " -> Facture {$inv['number']} : Relance nécessaire pour le jour $diffInDays.\n";
                
                // Préparer le message
                $messageBase = $account['whatsappMessage'] ?: "Bonjour, voici votre facture.";
                $message = $messageBase . "\n\nFacture N° " . $inv['number'] . "\nMontant total : " . number_format($inv['total'], 2, ',', ' ') . " " . ($account['currency'] ?? 'XOF');
                if ($diffInDays < 0) {
                    $message = "⏳ RAPPEL ÉCHÉANCE: J" . $diffInDays . "\n" . $message;
                } elseif ($diffInDays == 0) {
                    $message = "⚠️ C'est le jour de l'échéance pour votre facture.\n" . $message;
                } else {
                    $message = "❗ RAPPEL RETARD PAIEMENT (+" . $diffInDays . " jours)\n" . $message;
                }

                $sentWa = false;
                $sentEmail = false;

                // 1. Envoi WhatsApp
                if (!empty($inv['clientPhone'])) {
                    $url = 'http://localhost:3005/whatsapp-api/send';
                    $data = [
                        'accountId' => $account['id'],
                        'to' => $inv['clientPhone'],
                        'text' => $message
                    ];
                    
                    // TODO: generate PDF and send it as well!
                    
                    $options = [
                        'http' => [
                            'header'  => "Content-Type: application/json\r\n" . 
                                         "x-api-key: fp_wa_secret_2026_xyz\r\n", 
                            'method'  => 'POST',
                            'content' => json_encode($data),
                            'ignore_errors' => true
                        ]
                    ];
                    $context  = stream_context_create($options);
                    $result = @file_get_contents($url, false, $context);
                    if ($result !== false) {
                        $resDecoded = json_decode($result, true);
                        if (isset($resDecoded['success']) && $resDecoded['success']) {
                            $sentWa = true;
                            echo "    [WhatsApp] Relance envoyée à {$inv['clientPhone']}.\n";
                        } else {
                            echo "    [WhatsApp] Erreur : $result\n";
                        }
                    } else {
                        echo "    [WhatsApp] Impossible de joindre le microservice WhatsApp sur le port 3005.\n";
                    }
                }
                // 2. Envoi Email
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

                if ($sentWa || $sentEmail) {
                    // Mettre à jour la base
                    $remindersSent[] = $diffInDays;
                    $upd = $pdo->prepare("UPDATE ProformaInvoice SET remindersSent = ?, lastReminderDate = CURRENT_TIMESTAMP WHERE id = ?");
                    $upd->execute([json_encode($remindersSent), $inv['id']]);
                } else {
                    echo "    Aucun canal disponible (WhatsApp ou Email) pour l'envoi.\n";
                }
            }
        }
    }
}

echo "[" . date('Y-m-d H:i:s') . "] Vérification terminée.\n";
