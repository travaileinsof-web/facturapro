fetch('http://localhost:8000/test_db.php')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
