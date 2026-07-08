import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://neondb_owner:npg_S8GTJ7bfBdjx@ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function testInsert() {
  try {
    await client.connect();
    console.log("Connected to Neon DB");
    
    const id = 'test-uuid-' + Date.now();
    const email = 'test' + Date.now() + '@example.com';
    const passwordHash = 'hash';
    const token = 'token-' + Date.now();
    
    await client.query(`
      INSERT INTO Account (id, email, passwordHash, token, companyName, firstName, lastName, phone, subscriptionPlan, subscriptionStatus) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'free', 'trial')
    `, [id, email, passwordHash, token, 'Company', 'First', 'Last', '123456789']);
    
    console.log("Insert into Account successful.");
    
    // Now try SubscriptionInvoice
    const invId = 'inv-uuid-' + Date.now();
    await client.query(`
      INSERT INTO SubscriptionInvoice (id, accountId, invoiceNumber, amount, status) 
      VALUES ($1, $2, $3, $4, 'proforma')
    `, [invId, id, 'INV-123', 1000]);
    
    console.log("Insert into SubscriptionInvoice successful.");
    
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    await client.end();
  }
}

testInsert();
