const { Client } = require('pg');

async function seedAdmin() {
  const connectionString = "postgresql://neondb_owner:npg_S8GTJ7bfBdjx@ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech:5432/neondb?sslmode=require";
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Neon DB');

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('AdminFactura2026!', 10);
    
    // Check if admin exists
    const res = await client.query("SELECT id FROM Account WHERE email = 'admin@facturapro.com'");
    if (res.rows.length > 0) {
      console.log('Admin already exists. Updating role and password...');
      await client.query("UPDATE Account SET role = 'admin', passwordHash = $1 WHERE email = 'admin@facturapro.com'", [passwordHash]);
    } else {
      console.log('Inserting new admin...');
      await client.query(
        "INSERT INTO Account (id, email, passwordHash, companyName, role) VALUES ($1, $2, $3, $4, $5)",
        [
          require('crypto').randomUUID(),
          'admin@facturapro.com',
          passwordHash,
          'Super Admin',
          'admin'
        ]
      );
    }
    
    console.log('Admin user seeded successfully!');
    console.log('Email: admin@facturapro.com');
    console.log('Password: AdminFactura2026!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

seedAdmin();
