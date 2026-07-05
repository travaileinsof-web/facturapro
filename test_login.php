<?php
$payload = json_encode(['email' => 'einsof.infos@gmail.com', 'password' => 'admin123']);
$ctx = stream_context_create(['http' => [
    'method' => 'POST',
    'header' => 'Content-Type: application/json',
    'content' => $payload
]]);
$result = @file_get_contents('http://localhost:8000/api/auth/login', false, $ctx);
echo "Réponse API login: " . ($result ?: 'Erreur - serveur inaccessible') . PHP_EOL;
