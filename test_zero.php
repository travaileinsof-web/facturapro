<?php
require 'backend/config.php';
$p=new PDO(DB_DSN,DB_USER,DB_PASS);
$s=$p->query("SELECT id, number, type, total, status, items FROM ProformaInvoice WHERE total = 0");
var_dump($s->fetchAll(PDO::FETCH_ASSOC));
