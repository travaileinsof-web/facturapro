import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://neondb_owner:npg_S8GTJ7bfBdjx@ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech/neondb',
  ssl: { rejectUnauthorized: false }
});

await client.connect();

console.log('=== WebhookLog (10 derniers) ===');
const wh = await client.query('SELECT * FROM webhooklog ORDER BY id DESC LIMIT 10');
console.log(JSON.stringify(wh.rows, null, 2));

console.log('\n=== SubscriptionPayment (10 derniers) ===');
const sp = await client.query('SELECT * FROM subscriptionpayment ORDER BY createdat DESC LIMIT 10');
console.log(JSON.stringify(sp.rows, null, 2));

console.log('\n=== Account subscriptions (5 derniers) ===');
const acc = await client.query('SELECT id, email, subscriptionplan, subscriptionstatus, subscriptionexpiresat, lastpaymentdate FROM account ORDER BY createdat DESC LIMIT 5');
console.log(JSON.stringify(acc.rows, null, 2));

await client.end();
