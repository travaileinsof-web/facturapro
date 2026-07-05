<?php
$db = new PDO('sqlite:backend/database.sqlite');
$sql = file_get_contents('backend/database.sql');
$db->exec($sql);
echo 'Migrated';
