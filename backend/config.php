<?php
// Database Configuration
$envFile = __DIR__ . '/../.env';
$env = file_exists($envFile) ? parse_ini_file($envFile) : [];

function get_env_var($key, $default = '') {
    global $env;
    if (isset($env[$key])) return $env[$key];
    $val = getenv($key);
    if ($val !== false) return $val;
    if (isset($_ENV[$key])) return $_ENV[$key];
    if (isset($_SERVER[$key])) return $_SERVER[$key];
    return $default;
}

define('DB_CONNECTION', get_env_var('DB_CONNECTION', 'pgsql'));
define('DB_HOST', get_env_var('DB_HOST', 'localhost'));
define('DB_NAME', get_env_var('DB_NAME', 'neondb'));
define('DB_USER', get_env_var('DB_USER', 'neondb_owner'));
define('DB_PASS', get_env_var('DB_PASS', ''));
$endpointId = get_env_var('DB_ENDPOINT_ID', '');

define('DB_DSN', 'pgsql:host=' . DB_HOST . ';port=5432;dbname=' . DB_NAME . ';sslmode=require;connect_timeout=15' . ($endpointId ? ';options=endpoint=' . $endpointId : ''));

define('RESEND_API_KEY', get_env_var('RESEND_API_KEY', 're_XwKBtnrW_2naWuuHHf4SmBPFP5J67HwuK'));

// Fix pour PostgreSQL qui renvoie toutes les colonnes en minuscules
$GLOBALS['camelCaseCols'] = [
    'passwordhash' => 'passwordHash', 'companyname' => 'companyName',
    'firstname' => 'firstName', 'lastname' => 'lastName', 'taxid' => 'taxId',
    'bankname' => 'bankName', 'bankaccount' => 'bankAccount',
    'primarycolor' => 'primaryColor', 'secondarycolor' => 'secondaryColor',
    'accentcolor' => 'accentColor', 'whatsappmessage' => 'whatsappMessage',
    'smtphost' => 'smtpHost', 'smtpport' => 'smtpPort', 'smtpencryption' => 'smtpEncryption',
    'smtpuser' => 'smtpUser', 'smtppass' => 'smtpPass', 'geminikey' => 'geminiKey',
    'openrouterkey' => 'openrouterKey', 'subscriptionplan' => 'subscriptionPlan',
    'subscriptionstatus' => 'subscriptionStatus', 'subscriptionexpiresat' => 'subscriptionExpiresAt',
    'subscriptionamount' => 'subscriptionAmount', 'lastpaymentdate' => 'lastPaymentDate',
    'adminnotes' => 'adminNotes', 'issuspended' => 'isSuspended',
    'createdat' => 'createdAt', 'updatedat' => 'updatedAt', 'accountid' => 'accountId',
    'clientid' => 'clientId', 'invoiceid' => 'invoiceId', 'targetaccountid' => 'targetAccountId',
    'taxrate' => 'taxRate', 'taxamount' => 'taxAmount', 'issuedate' => 'issueDate',
    'duedate' => 'dueDate', 'lastreminderdate' => 'lastReminderDate',
    'djomytransactionid' => 'djomyTransactionId',
    'unitprice' => 'unitPrice', 'proformainvoiceid' => 'proformaInvoiceId',
    'paymentmethod' => 'paymentMethod', 'paymentdate' => 'paymentDate',
    'companyid' => 'companyId', 'expensedate' => 'expenseDate',
    'receipturl' => 'receiptUrl', 'entitytype' => 'entityType',
    'entityid' => 'entityId', 'filename' => 'fileName',
    'fileurl' => 'fileUrl', 'filetype' => 'fileType',
    'filesize' => 'fileSize', 'uploadedat' => 'uploadedAt',
    'clientname' => 'clientName', 'invoicenumber' => 'invoiceNumber',
    'remindertype' => 'reminderType', 'sentat' => 'sentAt',
    'remindersettings' => 'reminderSettings',
    'clienttype' => 'clientType', 'legalform' => 'legalForm',
    'taxregime' => 'taxRegime', 'defaultvatrate' => 'defaultVatRate',
    'validitydate' => 'validityDate', 'paymentterms' => 'paymentTerms',
    'vatwithholdingapplied' => 'vatWithholdingApplied',
    'vatexemptreason' => 'vatExemptReason', 'sourcedocumentid' => 'sourceDocumentId',
    'receivedby' => 'receivedBy'
];

if (!class_exists('MyPDOStatement')) {
    class MyPDOStatement extends PDOStatement {
        protected function __construct() {}
        private function camelize($row) {
            if (!is_array($row)) return $row;
            global $camelCaseCols;
            $newRow = [];
            foreach ($row as $k => $v) {
                $lowerKey = strtolower($k);
                $newRow[isset($camelCaseCols[$lowerKey]) ? $camelCaseCols[$lowerKey] : $k] = $v;
            }
            return $newRow;
        }
        #[\ReturnTypeWillChange]
        public function fetch($mode = PDO::FETCH_ASSOC, $cursorOrientation = PDO::FETCH_ORI_NEXT, $cursorOffset = 0) {
            $row = parent::fetch($mode, $cursorOrientation, $cursorOffset);
            if ($mode === PDO::FETCH_ASSOC && $row) return $this->camelize($row);
            return $row;
        }
        
        #[\ReturnTypeWillChange]
        public function fetchAll($mode = PDO::FETCH_ASSOC, ...$args) {
            $rows = parent::fetchAll($mode, ...$args);
            if ($mode === PDO::FETCH_ASSOC && $rows) return array_map([$this, 'camelize'], $rows);
            return $rows;
        }
    }
}

// =============================================================
// PLANS D'ABONNEMENT
// =============================================================
define('SUBSCRIPTION_PLANS', [
    'free'    => ['name' => 'Essai Gratuit', 'duration_days' => 1,   'price_gnf' => 0],
    'annuel'  => ['name' => 'Annuel',        'duration_days' => 365, 'price_gnf' => 500000],
]);

// =============================================================
// SECRET WHATSAPP API
// =============================================================
define('WHATSAPP_API_SECRET', get_env_var('WHATSAPP_API_SECRET', ''));

// =============================================================
// PAIEMENT DJOMY API
// =============================================================
define('DJOMY_CLIENT_ID', get_env_var('DJOMY_CLIENT_ID', ''));
define('DJOMY_CLIENT_SECRET', get_env_var('DJOMY_CLIENT_SECRET', ''));
define('DJOMY_API_URL', get_env_var('DJOMY_API_URL', 'https://api.djomy.africa'));
