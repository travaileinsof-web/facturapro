<?php
require_once __DIR__ . '/../libs/PHPMailer/Exception.php';
require_once __DIR__ . '/../libs/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../libs/PHPMailer/SMTP.php';

class SystemMailer {
    private static function getMailer($pdo) {
        $stmt = $pdo->query("SELECT * FROM PlatformSettings WHERE id = 'global'");
        $settings = $stmt->fetch();

        if (!$settings || empty($settings['smtpUser']) || empty($settings['smtpPass'])) {
            return null; // SMTP non configuré
        }

        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';
        
        $mail->Host       = $settings['smtpHost'] ?? 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = $settings['smtpUser'];
        $mail->Password   = $settings['smtpPass'];
        
        $encryption = strtolower($settings['smtpEncryption'] ?? 'tls');
        if ($encryption === 'ssl') {
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        } elseif ($encryption === 'none') {
            $mail->SMTPSecure = false;
            $mail->SMTPAutoTLS = false;
        } else {
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        }
        $mail->Port = (int)($settings['smtpPort'] ?? 587);
        
        $companyName = $settings['companyName'] ?? 'FacturaPro';
        $mail->setFrom($settings['smtpUser'], $companyName);
        $mail->isHTML(true);

        return $mail;
    }

    public static function sendWelcomeEmail($pdo, $toEmail, $firstName, $invoiceNumber) {
        $mail = self::getMailer($pdo);
        if (!$mail) return false;

        $stmt = $pdo->query("SELECT * FROM PlatformSettings WHERE id = 'global'");
        $settings = $stmt->fetch();
        $primary = $settings['primaryColor'] ?? '#B38E36';
        $companyName = $settings['companyName'] ?? 'FacturaPro';

        try {
            $mail->addAddress($toEmail);
            $mail->Subject = "Bienvenue sur $companyName - Votre facture Proforma";
            
            $html = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;'>
                    <div style='background-color: $primary; padding: 20px; text-align: center; color: white;'>
                        <h1 style='margin: 0; font-size: 24px;'>$companyName</h1>
                    </div>
                    <div style='padding: 30px;'>
                        <h2 style='color: $primary;'>Bienvenue $firstName !</h2>
                        <p>Nous sommes ravis de vous compter parmi nos utilisateurs. Votre essai gratuit de 24h est maintenant actif. Profitez-en pour découvrir toutes les fonctionnalités de la plateforme.</p>
                        <br>
                        <div style='background-color: #f8fafc; border-left: 4px solid $primary; padding: 15px; margin: 20px 0;'>
                            <h3 style='margin-top: 0;'>Facture Proforma - Abonnement Premium</h3>
                            <p><strong>N° Facture :</strong> $invoiceNumber</p>
                            <p><strong>Description :</strong> Abonnement Annuel Premium (Accès illimité)</p>
                            <p><strong>Montant :</strong> 1000 GNF</p>
                        </div>
                        <p>Pour continuer à utiliser le système sans interruption après votre essai, nous vous invitons à activer votre abonnement en vous connectant à votre espace.</p>
                        <div style='text-align: center; margin-top: 30px;'>
                            <a href='https://facturapro.com/login' style='background-color: $primary; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Accéder à mon espace</a>
                        </div>
                    </div>
                    <div style='background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;'>
                        <p>&copy; " . date('Y') . " $companyName. Tous droits réservés.</p>
                    </div>
                </div>
            ";
            $mail->Body = $html;

            return $mail->send();
        } catch (Exception $e) {
            error_log("Email Welcome error: " . $mail->ErrorInfo);
            return false;
        }
    }

    public static function sendPaymentConfirmation($pdo, $toEmail, $firstName, $amount, $receiptNumber) {
        $mail = self::getMailer($pdo);
        if (!$mail) return false;

        $stmt = $pdo->query("SELECT * FROM PlatformSettings WHERE id = 'global'");
        $settings = $stmt->fetch();
        $primary = $settings['primaryColor'] ?? '#B38E36';
        $companyName = $settings['companyName'] ?? 'FacturaPro';

        try {
            $mail->addAddress($toEmail);
            $mail->Subject = "Confirmation de paiement et Reçu - $companyName";
            
            $html = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;'>
                    <div style='background-color: #10b981; padding: 20px; text-align: center; color: white;'>
                        <h1 style='margin: 0; font-size: 24px;'>Paiement Reçu</h1>
                    </div>
                    <div style='padding: 30px;'>
                        <h2>Bonjour $firstName,</h2>
                        <p>Nous vous confirmons la réception de votre paiement avec succès. Votre compte est désormais <strong>Premium</strong> pour une durée de 1 an !</p>
                        <br>
                        <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 15px; margin: 20px 0;'>
                            <h3 style='margin-top: 0; color: #10b981;'>Reçu Officiel</h3>
                            <p><strong>N° Reçu :</strong> $receiptNumber</p>
                            <p><strong>Description :</strong> Abonnement Annuel Premium</p>
                            <p><strong>Montant Payé :</strong> " . number_format($amount, 0, ',', ' ') . " GNF</p>
                            <p><strong>Date :</strong> " . date('d/m/Y H:i') . "</p>
                        </div>
                        <p>Merci pour votre confiance. Retrouvez tous vos documents et outils dans votre espace de travail.</p>
                        <div style='text-align: center; margin-top: 30px;'>
                            <a href='https://facturapro.com/login' style='background-color: $primary; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Accéder à mon tableau de bord</a>
                        </div>
                    </div>
                </div>
            ";
            $mail->Body = $html;

            return $mail->send();
        } catch (Exception $e) {
            error_log("Email Payment error: " . $mail->ErrorInfo);
            return false;
        }
    }

    public static function sendSubscriptionUpgradeEmail($pdo, $toEmail, $firstName, $plan) {
        $mail = self::getMailer($pdo);
        if (!$mail) return false;

        $stmt = $pdo->query("SELECT * FROM PlatformSettings WHERE id = 'global'");
        $settings = $stmt->fetch();
        $primary = $settings['primaryColor'] ?? '#B38E36';
        $companyName = $settings['companyName'] ?? 'FacturaPro';

        $planName = $plan === 'annuel' ? 'Premium (Annuel)' : ($plan === 'mensuel' ? 'Mensuel' : 'Actif');

        try {
            $mail->addAddress($toEmail);
            $mail->Subject = "Confirmation d'activation de votre abonnement $planName - $companyName";
            
            $html = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;'>
                    <div style='background-color: #10b981; padding: 20px; text-align: center; color: white;'>
                        <h1 style='margin: 0; font-size: 24px;'>Abonnement Activé</h1>
                    </div>
                    <div style='padding: 30px;'>
                        <h2>Bonjour $firstName,</h2>
                        <p>Nous avons le plaisir de vous informer que votre compte a été officiellement activé au statut <strong>$planName</strong> par notre équipe d'administration.</p>
                        <br>
                        <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 15px; margin: 20px 0;'>
                            <h3 style='margin-top: 0; color: #10b981;'>Détails de l'Abonnement</h3>
                            <p><strong>Nouveau Statut :</strong> Actif</p>
                            <p><strong>Formule :</strong> $planName</p>
                            <p><strong>Date d'activation :</strong> " . date('d/m/Y H:i') . "</p>
                        </div>
                        <p>Vous avez désormais accès à l'ensemble des fonctionnalités Premium. Merci pour votre confiance !</p>
                        <div style='text-align: center; margin-top: 30px;'>
                            <a href='https://facturapro.com/login' style='background-color: $primary; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Accéder à mon tableau de bord</a>
                        </div>
                    </div>
                </div>
            ";
            $mail->Body = $html;

            return $mail->send();
        } catch (Exception $e) {
            error_log("Email Subscription Upgrade error: " . $mail->ErrorInfo);
            return false;
        }
    }
    
    public static function sendReminderEmail($pdo, $toEmail, $firstName, $invoiceNumber) {
        $mail = self::getMailer($pdo);
        if (!$mail) return false;

        $stmt = $pdo->query("SELECT * FROM PlatformSettings WHERE id = 'global'");
        $settings = $stmt->fetch();
        $primary = $settings['primaryColor'] ?? '#B38E36';
        $companyName = $settings['companyName'] ?? 'FacturaPro';

        try {
            $mail->addAddress($toEmail);
            $mail->Subject = "N'attendez plus pour passer au niveau supérieur !";
            
            $html = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;'>
                    <div style='background-color: $primary; padding: 20px; text-align: center; color: white;'>
                        <h1 style='margin: 0; font-size: 24px;'>$companyName</h1>
                    </div>
                    <div style='padding: 30px;'>
                        <h2>Bonjour $firstName,</h2>
                        <p>Nous avons remarqué que votre période d'essai touche à sa fin ou est déjà terminée.</p>
                        <p>Ne perdez pas l'accès à vos documents, factures et statistiques. Pensez à régler votre facture proforma <strong>$invoiceNumber</strong> pour débloquer l'accès Premium sans interruption.</p>
                        <div style='text-align: center; margin-top: 30px;'>
                            <a href='https://facturapro.com/login' style='background-color: $primary; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Activer mon abonnement</a>
                        </div>
                    </div>
                </div>
            ";
            $mail->Body = $html;
            return $mail->send();
        } catch (Exception $e) {
            error_log("Email Reminder error: " . $mail->ErrorInfo);
            return false;
        }
    }

    public static function sendPreExpirationReminder($pdo, $toEmail, $firstName, $daysRemaining) {
        $mail = self::getMailer($pdo);
        if (!$mail) return false;

        $stmt = $pdo->query("SELECT * FROM PlatformSettings WHERE id = 'global'");
        $settings = $stmt->fetch();
        $primary = $settings['primaryColor'] ?? '#B38E36';
        $companyName = $settings['companyName'] ?? 'FacturaPro';

        try {
            $mail->addAddress($toEmail);
            $mail->Subject = "Action requise : Votre abonnement expire dans $daysRemaining jour(s)";
            
            $html = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;'>
                    <div style='background-color: $primary; padding: 20px; text-align: center; color: white;'>
                        <h1 style='margin: 0; font-size: 24px;'>$companyName</h1>
                    </div>
                    <div style='padding: 30px;'>
                        <h2>Bonjour $firstName,</h2>
                        <p>Nous vous informons que votre abonnement arrivera à expiration dans <strong>$daysRemaining jour(s)</strong>.</p>
                        <p>Pour continuer à profiter de nos services sans interruption, veuillez procéder au renouvellement de votre abonnement dès que possible.</p>
                        <div style='text-align: center; margin-top: 30px;'>
                            <a href='https://facturapro.com/login' style='background-color: $primary; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Renouveler mon abonnement</a>
                        </div>
                    </div>
                </div>
            ";
            $mail->Body = $html;
            return $mail->send();
        } catch (Exception $e) {
            error_log("Email PreExpiration error: " . $mail->ErrorInfo);
            return false;
        }
    }

    public static function sendExpirationDayReminder($pdo, $toEmail, $firstName) {
        $mail = self::getMailer($pdo);
        if (!$mail) return false;

        $stmt = $pdo->query("SELECT * FROM PlatformSettings WHERE id = 'global'");
        $settings = $stmt->fetch();
        $primary = $settings['primaryColor'] ?? '#B38E36';
        $companyName = $settings['companyName'] ?? 'FacturaPro';

        try {
            $mail->addAddress($toEmail);
            $mail->Subject = "Urgent : Votre abonnement expire aujourd'hui";
            
            $html = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;'>
                    <div style='background-color: #f59e0b; padding: 20px; text-align: center; color: white;'>
                        <h1 style='margin: 0; font-size: 24px;'>$companyName</h1>
                    </div>
                    <div style='padding: 30px;'>
                        <h2>Bonjour $firstName,</h2>
                        <p>C'est le jour J ! Votre abonnement expire <strong>aujourd'hui</strong>.</p>
                        <p>Il est encore temps de renouveler votre forfait pour éviter toute coupure de service.</p>
                        <div style='text-align: center; margin-top: 30px;'>
                            <a href='https://facturapro.com/login' style='background-color: #f59e0b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Renouveler immédiatement</a>
                        </div>
                    </div>
                </div>
            ";
            $mail->Body = $html;
            return $mail->send();
        } catch (Exception $e) {
            error_log("Email ExpirationDay error: " . $mail->ErrorInfo);
            return false;
        }
    }

    public static function sendPostExpirationReminder($pdo, $toEmail, $firstName, $daysExpired) {
        $mail = self::getMailer($pdo);
        if (!$mail) return false;

        $stmt = $pdo->query("SELECT * FROM PlatformSettings WHERE id = 'global'");
        $settings = $stmt->fetch();
        $primary = $settings['primaryColor'] ?? '#B38E36';
        $companyName = $settings['companyName'] ?? 'FacturaPro';

        try {
            $mail->addAddress($toEmail);
            $mail->Subject = "Votre abonnement a expiré il y a $daysExpired jour(s)";
            
            $html = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;'>
                    <div style='background-color: #ef4444; padding: 20px; text-align: center; color: white;'>
                        <h1 style='margin: 0; font-size: 24px;'>$companyName</h1>
                    </div>
                    <div style='padding: 30px;'>
                        <h2>Bonjour $firstName,</h2>
                        <p>Nous avons constaté que votre abonnement a expiré depuis <strong>$daysExpired jour(s)</strong>.</p>
                        <p>Vous n'avez plus accès à certaines fonctionnalités de la plateforme. Vous pouvez réactiver votre compte à tout moment.</p>
                        <div style='text-align: center; margin-top: 30px;'>
                            <a href='https://facturapro.com/login' style='background-color: #ef4444; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Réactiver mon compte</a>
                        </div>
                    </div>
                </div>
            ";
            $mail->Body = $html;
            return $mail->send();
        } catch (Exception $e) {
            error_log("Email PostExpiration error: " . $mail->ErrorInfo);
            return false;
        }
    }
}
