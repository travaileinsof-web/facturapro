<?php
$pdo = new PDO('sqlite:backend/facturapro.sqlite');
$stmt = $pdo->query('SELECT id, email, token, subscriptionStatus, createdAt FROM Account');
$accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach($accounts as $a) {
    echo 'ID: '.$a['id']."\n";
    echo 'Email: '.$a['email']."\n";
    echo 'Token: '.$a['token']."\n";
    echo 'Status: '.$a['subscriptionStatus']."\n";
    echo '---'."\n";
}

// Also test the clients endpoint directly with the real token
echo "\n=== CLIENTS TEST ===\n";
if (!empty($accounts)) {
    $token = $accounts[0]['token'];
    $accountId = $accounts[0]['id'];
    if ($token) {
        // Simulate what the API does
        $stmt2 = $pdo->prepare("SELECT id FROM Account WHERE token = ?");
        $stmt2->execute([$token]);
        $acct = $stmt2->fetch(PDO::FETCH_ASSOC);
        echo "Token valid for account: ".($acct ? $acct['id'] : 'NOT FOUND')."\n";
        
        $stmt3 = $pdo->prepare("SELECT COUNT(*) FROM Client WHERE accountId = ?");
        $stmt3->execute([$accountId]);
        echo "Clients for this account: ".$stmt3->fetchColumn()."\n";
    } else {
        echo "NO TOKEN - user needs to log in!\n";
    }
}
