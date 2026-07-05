const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_S8GTJ7bfBdjx@ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech:5432/neondb?sslmode=require'
});

async function check() {
  await client.connect();
  
  // List tables
  const res = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);
  console.log("Tables in public schema:");
  console.log(res.rows.map(r => r.table_name));

  // Check columns of ProformaInvoice
  try {
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'proformainvoice'
    `);
    console.log("Columns of proformainvoice:");
    console.log(cols.rows.map(c => c.column_name));
  } catch (e) {}

  // Check columns of Receipt
  try {
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'receipt'
    `);
    console.log("Columns of receipt:");
    console.log(cols.rows.map(c => c.column_name));
  } catch (e) {}

  await client.end();
}

check().catch(console.error);
