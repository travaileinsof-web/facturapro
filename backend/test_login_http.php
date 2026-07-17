<?php
$data = ['email'=>'test_reg_h1@example.com', 'password'=>'password123'];
$options = [
    'http' => [
        'header'  => "Content-Type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    ]
];
$context  = stream_context_create($options);
$result = file_get_contents('http://localhost:8000/api/auth/login', false, $context);
echo "RESPONSE:\n" . $result;
if ($result === FALSE) {
    echo "ERROR";
}
