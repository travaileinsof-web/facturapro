<?php
// Database Configuration
define('DB_CONNECTION', 'pgsql'); // Changed to pgsql for Neon

// Neon PostgreSQL Configuration
define('DB_HOST', 'ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech');
define('DB_NAME', 'neondb');
define('DB_USER', 'neondb_owner');
define('DB_PASS', 'npg_S8GTJ7bfBdjx');
define('DB_DSN', 'pgsql:host=' . DB_HOST . ';port=5432;dbname=' . DB_NAME . ';sslmode=require;options=endpoint=ep-gentle-lab-at2wepx2');

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
    'remindersettings' => 'reminderSettings'
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
    'annuel'  => ['name' => 'Annuel',        'duration_days' => 365, 'price_gnf' => 1000],
]);

// =============================================================
// SECRET WHATSAPP API
// =============================================================
define('WHATSAPP_API_SECRET', 'fp_wa_secret_2026_xyz');

// =============================================================
// PAIEMENT DJOMY API
// =============================================================
define('DJOMY_CLIENT_ID', 'djomy-client-1783402253216-a94e');
define('DJOMY_CLIENT_SECRET', 's3cr3t-hnmS30UNAtnjfhkx2FeJbd1S7fOJpZWl');
define('DJOMY_API_URL', 'https://api.djomy.africa'); // A ajuster selon l'environnement
