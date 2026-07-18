<?php
require 'backend/config.php';
$p=new PDO(DB_DSN,DB_USER,DB_PASS);
$s=$p->query("SELECT r.id, r.amount, r.paymentDate, r.notes, r.createdat FROM Receipt r JOIN ProformaInvoice i ON r.proformaInvoiceId = i.id WHERE i.number = 'FAC-20260716-001' AND i.total = 24000");
var_dump($s->fetchAll(PDO::FETCH_ASSOC));
