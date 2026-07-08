import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://neondb_owner:npg_S8GTJ7bfBdjx@ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function fixDB() {
  try {
    await client.connect();
    
    // Add status to SubscriptionInvoice
    await client.query("ALTER TABLE SubscriptionInvoice ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'proforma'");
    console.log("Column status added to SubscriptionInvoice successfully.");
    
    // Verify columns in Account just in case
    await client.query("ALTER TABLE Account ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'");
    console.log("Column role added to Account successfully (if missing).");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

fixDB();
