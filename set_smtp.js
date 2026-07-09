import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://neondb_owner:npg_S8GTJ7bfBdjx@ep-gentle-lab-at2wepx2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

const smtpUser = process.argv[2];
const smtpPass = process.argv[3];

if (!smtpUser || !smtpPass) {
  console.error("Erreur : Veuillez fournir l'email et le mot de passe SMTP.");
  console.log("Utilisation : node set_smtp.js \"votre_email@gmail.com\" \"votre_mot_de_passe_app\"");
  process.exit(1);
}

async function setSmtp() {
  try {
    await client.connect();
    console.log("Connecté à la base de données Neon.");
    
    await client.query(`
      UPDATE PlatformSettings 
      SET smtpHost = 'smtp.gmail.com', 
          smtpPort = '587', 
          smtpEncryption = 'tls', 
          smtpUser = $1, 
          smtpPass = $2
      WHERE id = 'global'
    `, [smtpUser, smtpPass]);
    
    console.log("✅ Configuration SMTP mise à jour avec succès dans la base de données !");
    console.log("Les e-mails seront désormais envoyés via : " + smtpUser);
  } catch (err) {
    console.error("Erreur DB:", err.message);
  } finally {
    await client.end();
  }
}

setSmtp();
