const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_S8GTJ7bfBdjx@ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech:5432/neondb?sslmode=require'
});

async function updateDb() {
  await client.connect();
  
  try {
    await client.query(`ALTER TABLE catalogitem RENAME COLUMN price TO unitprice`);
    console.log("Renamed price to unitprice");
  } catch (e) { console.log(e.message); }

  try {
    await client.query(`ALTER TABLE catalogitem DROP COLUMN stock`);
    console.log("Dropped stock");
  } catch (e) { console.log(e.message); }

  try {
    await client.query(`ALTER TABLE catalogitem ADD COLUMN category VARCHAR(100) DEFAULT 'Général'`);
    console.log("Added category");
  } catch (e) { console.log(e.message); }

  try {
    await client.query(`ALTER TABLE catalogitem ADD COLUMN components TEXT NULL`);
    console.log("Added components");
  } catch (e) { console.log(e.message); }

  await client.end();
}

updateDb().catch(console.error);
