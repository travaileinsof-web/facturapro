<?php
$data = ['email'=>'test_reg_h1@example.com', 'password'=>'password123', 'company'=>'Test Co', 'firstName'=>'Test', 'lastName'=>'User', 'phone'=>'12345678'];
$options = [
    'http' => [
        'header'  => "Content-Type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    ]
];
$context  = stream_context_create($options);
$result = file_get_contents('http://localhost:8000/api/auth/register', false, $context);
echo "RESPONSE:\n" . $result;
if ($result === FALSE) {
    echo "ERROR";
}
