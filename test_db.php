<?php require 'backend/config.php'; $p=new PDO(DB_DSN,DB_USER,DB_PASS); var_dump($p->query('SELECT currency FROM Account LIMIT 1')->fetch()); ?>
