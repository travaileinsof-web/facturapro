import pkg from 'pg';
const { Client } = pkg;
const client = new Client({ connectionString: 'postgres://neondb_owner:npg_S8GTJ7bfBdjx@ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require' });
async function run() {
  await client.connect();
  const res = await client.query("SELECT * FROM PlatformSettings WHERE id = 'global'");
  console.log('PlatformSettings:', res.rows[0]);
  
  const accRes = await client.query("SELECT id, email, smtpHost, smtpUser, smtpPass FROM Account WHERE smtpHost IS NOT NULL LIMIT 1");
  console.log('Account settings:', accRes.rows[0]);

  await client.end();
}
run();
