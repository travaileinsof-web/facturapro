import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://neondb_owner:npg_S8GTJ7bfBdjx@ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech/neondb',
  ssl: { rejectUnauthorized: false }
});

await client.connect();

// Les 4 paiements PENDING à activer
const payments = [
  { id: 'pay_6a54682d0eb9c', accountid: '02aac8bf-2862-4c38-8cb6-f3c588702f87', ref: 'SUB-6a54682d0eb8c-1783916589' },
  { id: 'pay_6a54614b203c5', accountid: '02aac8bf-2862-4c38-8cb6-f3c588702f87', ref: 'SUB-6a54614b203b4-1783914827' },
  { id: 'pay_6a509203aae5d', accountid: 'f84cbfee-cd51-459d-9e8e-fdfd3969e6cc', ref: 'SUB-6a509203aae4f-1783665155' },
  { id: 'pay_6a5089cc96b83', accountid: '87b18228-4ece-4736-b4bd-935a0afba4f6', ref: 'SUB-6a5089cc9669e-1783663052' },
];

// Déduplication par accountId (on ne traite chaque compte qu'une fois)
const processedAccounts = new Set();

for (const p of payments) {
  // Marquer le paiement comme COMPLETED
  await client.query(
    "UPDATE subscriptionpayment SET status = 'COMPLETED', updatedat = NOW() WHERE id = $1",
    [p.id]
  );
  console.log(`✅ Paiement ${p.id} → COMPLETED`);

  if (!processedAccounts.has(p.accountid)) {
    processedAccounts.add(p.accountid);

    // Activer l'abonnement annuel pour 1 an
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await client.query(
      `UPDATE account 
       SET subscriptionplan = 'annuel', 
           subscriptionstatus = 'active', 
           subscriptionexpiresat = $1, 
           lastpaymentdate = NOW() 
       WHERE id = $2`,
      [expiresAt.toISOString(), p.accountid]
    );
    console.log(`✅ Compte ${p.accountid} → abonnement ACTIF jusqu'au ${expiresAt.toISOString().split('T')[0]}`);
  }
}

// Vérification finale
console.log('\n=== Vérification finale ===');
const check = await client.query(
  "SELECT id, email, subscriptionplan, subscriptionstatus, subscriptionexpiresat FROM account WHERE id = ANY($1::text[])",
  [['02aac8bf-2862-4c38-8cb6-f3c588702f87', 'f84cbfee-cd51-459d-9e8e-fdfd3969e6cc', '87b18228-4ece-4736-b4bd-935a0afba4f6']]
);
console.log(JSON.stringify(check.rows, null, 2));

await client.end();
console.log('\nDone!');
