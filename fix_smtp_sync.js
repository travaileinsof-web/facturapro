import pkg from 'pg';
const { Client } = pkg;
const client = new Client({ connectionString: 'postgres://neondb_owner:npg_S8GTJ7bfBdjx@ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require' });
async function run() {
  await client.connect();
  const res = await client.query("SELECT email, smtpHost, smtpUser, smtpPass FROM Account WHERE smtpHost IS NOT NULL AND smtpHost != '' LIMIT 1");
  console.log('Account SMTP:', res.rows[0]);
  if (res.rows[0] && res.rows[0].smtphost) {
     await client.query("UPDATE PlatformSettings SET smtpHost = $1, smtpUser = $2, smtpPass = $3 WHERE id = 'global'", [res.rows[0].smtphost, res.rows[0].smtpuser, res.rows[0].smtppass]);
     console.log('Copied to PlatformSettings!');
  }
  await client.end();
}
run();
