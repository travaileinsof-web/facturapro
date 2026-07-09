<?php
// cron_subscriptions.php - À exécuter tous les jours via Cron (ex: Vercel ou CRON serveur)

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$cronSecret = getenv('CRON_SECRET');
if ($cronSecret && $authHeader !== "Bearer $cronSecret") {
    http_response_code(401);
    die("Unauthorized");
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/core/SystemMailer.php';

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

echo "[" . date('Y-m-d H:i:s') . "] Démarrage de la vérification des relances d'abonnement...\n";

// 1. Récupérer la configuration globale des relances
$stmt = $pdo->query("SELECT reminderSettings FROM PlatformSettings WHERE id = 'global'");
$settingsRow = $stmt->fetch();
if (!$settingsRow || empty($settingsRow['reminderSettings'])) {
    echo "Aucune configuration de relance trouvée ou configurée.\n";
    exit;
}

$reminderSettings = json_decode($settingsRow['reminderSettings'], true);
if (!$reminderSettings || empty($reminderSettings['active'])) {
    echo "Les relances automatiques sont désactivées.\n";
    exit;
}

$beforeDays = $reminderSettings['beforeDays'] ?? [];
$afterDays = $reminderSettings['afterDays'] ?? [];
$dayOf = $reminderSettings['dayOf'] ?? false;

// 2. Récupérer tous les comptes actifs
$accountsStmt = $pdo->query("SELECT * FROM Account");
$accounts = $accountsStmt->fetchAll();

$today = new DateTime();
$today->setTime(0, 0, 0);

foreach ($accounts as $account) {
    if (empty($account['subscriptionExpiresAt'])) continue;
    
    // Déterminer la date d'expiration
    try {
        $expiresAt = new DateTime($account['subscriptionExpiresAt']);
        $expiresAt->setTime(0, 0, 0);
    } catch(Exception $e) { continue; }
    
    // Calculer la différence en jours
    $interval = $today->diff($expiresAt);
    $diffInDays = $interval->days;
    $isPast = $interval->invert == 1; // 1 si today > expiresAt (donc expiré)
    
    $reminderType = null;
    $daysValue = $diffInDays;

    if ($diffInDays == 0 && $dayOf) {
        $reminderType = 'DAY_OF';
    } elseif (!$isPast && in_array($diffInDays, $beforeDays)) {
        $reminderType = 'BEFORE';
    } elseif ($isPast && in_array($diffInDays, $afterDays)) {
        $reminderType = 'AFTER';
    }
    
    if ($reminderType) {
        // Vérifier si cette relance a déjà été envoyée pour ce compte et ce nombre de jours
        $checkStmt = $pdo->prepare("SELECT id FROM SubscriptionReminderLog WHERE accountId = ? AND reminderType = ? AND daysOffset = ?");
        $checkStmt->execute([$account['id'], $reminderType, $daysValue]);
        
        if ($checkStmt->rowCount() == 0) {
            echo "Envoi relance {$reminderType} ({$daysValue} jours) pour {$account['email']}...\n";
            $firstName = trim($account['firstName'] . ' ' . $account['lastName']) ?: $account['companyName'];
            
            $sent = false;
            if ($reminderType === 'BEFORE') {
                $sent = SystemMailer::sendPreExpirationReminder($pdo, $account['email'], $firstName, $daysValue);
            } elseif ($reminderType === 'DAY_OF') {
                $sent = SystemMailer::sendExpirationDayReminder($pdo, $account['email'], $firstName);
            } elseif ($reminderType === 'AFTER') {
                $sent = SystemMailer::sendPostExpirationReminder($pdo, $account['email'], $firstName, $daysValue);
            }
            
            if ($sent) {
                // Enregistrer dans le log
                $logStmt = $pdo->prepare("INSERT INTO SubscriptionReminderLog (accountId, reminderType, daysOffset) VALUES (?, ?, ?)");
                $logStmt->execute([$account['id'], $reminderType, $daysValue]);
                echo " -> Succès.\n";
            } else {
                echo " -> Échec de l'envoi.\n";
            }
        }
    }
}

echo "[" . date('Y-m-d H:i:s') . "] Vérification terminée.\n";
