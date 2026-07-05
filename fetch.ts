const res = await fetch('http://127.0.0.1:3000/api/settings');
const text = await res.text();
console.log(res.status, res.statusText);
console.log(text);
