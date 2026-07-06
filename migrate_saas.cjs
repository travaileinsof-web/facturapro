const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_S8GTJ7bfBdjx@ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech:5432/neondb?sslmode=require'
});

async function updateDb() {
  await client.connect();
  
  try {
    await client.query(`
        CREATE TABLE IF NOT EXISTS WebhookLog (
            id SERIAL PRIMARY KEY,
            event_type VARCHAR(100) NULL,
            reference VARCHAR(100) NULL,
            payload TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'success',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("Created WebhookLog table");
  } catch (e) { console.log(e.message); }

  try {
    await client.query(`
        CREATE TABLE IF NOT EXISTS SubscriptionInvoice (
            id VARCHAR(50) PRIMARY KEY,
            accountId VARCHAR(50) NOT NULL,
            invoiceNumber VARCHAR(100) NOT NULL,
            amount DECIMAL(15, 2) NOT NULL,
            pdfUrl TEXT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE
        );
    `);
    console.log("Created SubscriptionInvoice table");
  } catch (e) { console.log(e.message); }

  await client.end();
}

updateDb().catch(console.error);
