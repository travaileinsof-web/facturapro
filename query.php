<?php
require 'backend/config.php';
$p = new PDO(DB_DSN, DB_USER, DB_PASS);
$p->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$p->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$updates = ['companyName = ?', 'slogan = ?', 'address = ?', 'phone = ?', 'website = ?', 'taxId = ?', '"legalForm" = ?', 'rccm = ?', '"taxRegime" = ?', '"defaultVatRate" = ?', 'bankName = ?', 'bankAccount = ?', 'logo = ?', 'stamp = ?', 'signature = ?', 'primaryColor = ?', 'secondaryColor = ?', 'accentColor = ?', 'whatsappMessage = ?', 'smtpHost = ?', 'smtpPort = ?', 'smtpUser = ?', 'smtpEncryption = ?', 'currency = ?', 'smtpPass = ?'];
$sql = "UPDATE Account SET " . implode(', ', $updates) . " WHERE id = ?";
$p->prepare($sql);
