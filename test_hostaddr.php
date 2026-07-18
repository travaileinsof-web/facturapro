<?php
\ = microtime(true);
try {
    \ = "pgsql:host=ep-gentle-lab-at2wepx2-pooler.us-east-2.aws.neon.tech;hostaddr=\3.23.186.13;port=6432;dbname=facturapro;sslmode=require;options=endpoint=ep-gentle-lab-at2wepx2";
    \ = new PDO(\, 'facturapro_owner', 'E95wTqYcmyJd');
    echo 'Connected in ' . round(microtime(true) - \, 3) . ' seconds' . PHP_EOL;
} catch (Exception \) {
    echo 'Error: ' . \->getMessage() . PHP_EOL;
}
