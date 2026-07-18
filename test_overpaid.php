<?php
require 'backend/config.php';
$p=new PDO(DB_DSN,DB_USER,DB_PASS);
$s=$p->query('SELECT i.number as inv, i.total, SUM(r.amount) as paid FROM ProformaInvoice i JOIN Receipt r ON r.proformaInvoiceId = i.id GROUP BY i.id HAVING SUM(r.amount) > i.total');
var_dump($s->fetchAll(PDO::FETCH_ASSOC));
