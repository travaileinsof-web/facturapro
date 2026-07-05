<?php
require 'backend/config.php';
try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    
    // Check if admin exists
    $stmt = $pdo->prepare("SELECT * FROM Account WHERE email = 'einsof.infos@gmail.com'");
    $stmt->execute();
    if ($stmt->fetch()) {
        echo "Admin already exists.\n";
    } else {
        $id = bin2hex(random_bytes(16));
        $token = bin2hex(random_bytes(32));
        $hash = password_hash('admin123', PASSWORD_DEFAULT);
        $pdo->prepare("INSERT INTO Account (id, email, passwordHash, token, companyName, firstName, lastName, subscriptionPlan, subscriptionStatus, role) VALUES (?, 'einsof.infos@gmail.com', ?, ?, 'EINSOF DIGIT', 'Super', 'Admin', 'premium', 'active', 'admin')")->execute([$id, $hash, $token]);
        echo "Admin created successfully.\n";
    }
} catch(Exception $e) {
    echo "Error: " . $e->getMessage();
}
