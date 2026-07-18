<?php
$ch = curl_init('http://localhost:8000/api/auth/register');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['email'=>'test_reg_5@example.com', 'password'=>'password123', 'company'=>'Test Co', 'firstName'=>'Test', 'lastName'=>'User', 'phone'=>'12345678']));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
echo "RESPONSE:\n";
echo $res;
if(curl_errno($ch)) echo "\nCURL ERROR: " . curl_error($ch);
curl_close($ch);
