import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://neondb_owner:npg_S8GTJ7bfBdjx@ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function fixPlatformSettings() {
  try {
    await client.connect();
    console.log("Connected to Neon DB");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS PlatformSettings (
          id VARCHAR(50) PRIMARY KEY,
          companyName VARCHAR(255) NULL,
          smtpHost VARCHAR(255) NULL,
          smtpPort VARCHAR(10) NULL,
          smtpEncryption VARCHAR(50) DEFAULT 'tls',
          smtpUser VARCHAR(255) NULL,
          smtpPass VARCHAR(255) NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("PlatformSettings table created.");
    
    // Check if 'global' exists
    const res = await client.query("SELECT COUNT(*) FROM PlatformSettings WHERE id = 'global'");
    if (parseInt(res.rows[0].count) === 0) {
      await client.query("INSERT INTO PlatformSettings (id) VALUES ('global')");
      console.log("Global settings initialized.");
    }
    
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    await client.end();
  }
}

fixPlatformSettings();
