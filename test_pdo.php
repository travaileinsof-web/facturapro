<?php
require 'backend/config.php';

$camelCaseCols = [
    'passwordhash' => 'passwordHash',
    'companyname' => 'companyName',
    'firstname' => 'firstName',
    'lastname' => 'lastName',
    'taxid' => 'taxId',
    'bankname' => 'bankName',
    'bankaccount' => 'bankAccount',
    'primarycolor' => 'primaryColor',
    'secondarycolor' => 'secondaryColor',
    'accentcolor' => 'accentColor',
    'whatsappmessage' => 'whatsappMessage',
    'smtphost' => 'smtpHost',
    'smtpport' => 'smtpPort',
    'smtpencryption' => 'smtpEncryption',
    'smtpuser' => 'smtpUser',
    'smtppass' => 'smtpPass',
    'geminikey' => 'geminiKey',
    'openrouterkey' => 'openrouterKey',
    'subscriptionplan' => 'subscriptionPlan',
    'subscriptionstatus' => 'subscriptionStatus',
    'subscriptionexpiresat' => 'subscriptionExpiresAt',
    'subscriptionamount' => 'subscriptionAmount',
    'lastpaymentdate' => 'lastPaymentDate',
    'adminnotes' => 'adminNotes',
    'issuspended' => 'isSuspended',
    'createdat' => 'createdAt',
    'updatedat' => 'updatedAt',
    'accountid' => 'accountId',
    'clientid' => 'clientId',
    'invoiceid' => 'invoiceId',
    'targetaccountid' => 'targetAccountId',
    'taxrate' => 'taxRate',
    'taxamount' => 'taxAmount',
    'issuedate' => 'issueDate',
    'duedate' => 'dueDate',
    'lastreminderdate' => 'lastReminderDate',
    'djomytransactionid' => 'djomyTransactionId'
];

class MyPDOStatement extends PDOStatement {
    protected function __construct() {}
    
    private function camelize($row) {
        if (!is_array($row)) return $row;
        global $camelCaseCols;
        $newRow = [];
        foreach ($row as $k => $v) {
            $lowerKey = strtolower($k);
            if (isset($camelCaseCols[$lowerKey])) {
                $newRow[$camelCaseCols[$lowerKey]] = $v;
            } else {
                $newRow[$k] = $v;
            }
        }
        return $newRow;
    }

    public function fetch($mode = PDO::FETCH_ASSOC, $cursorOrientation = PDO::FETCH_ORI_NEXT, $cursorOffset = 0) {
        $row = parent::fetch($mode, $cursorOrientation, $cursorOffset);
        if ($mode === PDO::FETCH_ASSOC && $row) {
            return $this->camelize($row);
        }
        return $row;
    }

    public function fetchAll($mode = PDO::FETCH_ASSOC, ...$args) {
        $rows = parent::fetchAll($mode, ...$args);
        if ($mode === PDO::FETCH_ASSOC && $rows) {
            return array_map([$this, 'camelize'], $rows);
        }
        return $rows;
    }
}

$pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
$pdo->setAttribute(PDO::ATTR_STATEMENT_CLASS, ['MyPDOStatement', []]);

$stmt = $pdo->query('SELECT * FROM Account LIMIT 1');
print_r($stmt->fetch(PDO::FETCH_ASSOC));
