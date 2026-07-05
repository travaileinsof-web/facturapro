<?php
class ExpenseController {
    public static function handle($pdo, $method, $id, $accountId, $body) {
        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT * FROM Expense WHERE accountId = ? ORDER BY expenseDate DESC");
            $stmt->execute([$accountId]);
            echo json_encode($stmt->fetchAll());
        } elseif ($method === 'POST') {
            $newId = Helper::uuid();
            $expenseDate = empty($body['expenseDate']) ? date('Y-m-d H:i:s') : $body['expenseDate'];
            $stmt = $pdo->prepare("INSERT INTO Expense (id, accountId, category, amount, expenseDate, description, receiptUrl) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $newId, 
                $accountId, 
                $body['category'], 
                $body['amount'], 
                $expenseDate, 
                $body['description'] ?? null, 
                $body['receiptUrl'] ?? null
            ]);
            $stmt = $pdo->prepare("SELECT * FROM Expense WHERE id = ?");
            $stmt->execute([$newId]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'PUT' && $id) {
            $expenseDate = empty($body['expenseDate']) ? date('Y-m-d H:i:s') : $body['expenseDate'];
            $stmt = $pdo->prepare("UPDATE Expense SET category=?, amount=?, expenseDate=?, description=?, receiptUrl=? WHERE id=? AND accountId=?");
            $stmt->execute([
                $body['category'], 
                $body['amount'], 
                $expenseDate, 
                $body['description'] ?? null, 
                $body['receiptUrl'] ?? null,
                $id, 
                $accountId
            ]);
            $stmt = $pdo->prepare("SELECT * FROM Expense WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch());
        } elseif ($method === 'DELETE' && $id) {
            $stmt = $pdo->prepare("DELETE FROM Expense WHERE id = ? AND accountId = ?");
            $stmt->execute([$id, $accountId]);
            echo json_encode(["success" => true]);
        }
    }
}
