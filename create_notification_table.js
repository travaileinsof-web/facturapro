import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://neondb_owner:npg_S8GTJ7bfBdjx@ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech/neondb',
  ssl: { rejectUnauthorized: false }
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS Notification (
    id VARCHAR(50) PRIMARY KEY,
    accountId VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE
);
`;

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB. Creating Notification table...");
    await client.query(createTableQuery);
    console.log("Table Notification created successfully.");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    await client.end();
  }
}

run();
