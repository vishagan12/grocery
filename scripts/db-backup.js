/**
 * Cross-platform Supabase PostgreSQL Backup Utility
 * Project: Sri Amman Supermarket
 * Runs weekly pg_dump and manages local backup retention.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
const RETENTION_DAYS = 30;

function runBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetFile = path.join(BACKUP_DIR, `supabase_backup_${timestamp}.dump`);
  const logFile = path.join(BACKUP_DIR, 'backup.log');

  const log = (msg) => {
    const formatted = `[${new Date().toISOString()}] ${msg}\n`;
    process.stdout.write(formatted);
    fs.appendFileSync(logFile, formatted);
  };

  log('Starting Supabase database backup...');

  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl && !process.env.PGHOST) {
    log('ERROR: Neither DATABASE_URL nor PGHOST is set.');
    log('Set DATABASE_URL to your Supabase PostgreSQL connection string (Session/Direct pooler).');
    process.exit(1);
  }

  try {
    const dumpCmd = dbUrl
      ? `pg_dump --clean --if-exists --no-owner --no-privileges -Fc "${dbUrl}" -f "${targetFile}"`
      : `pg_dump --clean --if-exists --no-owner --no-privileges -Fc -f "${targetFile}"`;

    log(`Executing pg_dump...`);
    execSync(dumpCmd, { stdio: 'inherit' });

    const stats = fs.statSync(targetFile);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    log(`Backup created successfully: ${targetFile} (${sizeMb} MB)`);

    // Clean up older dumps
    const now = Date.now();
    const files = fs.readdirSync(BACKUP_DIR);
    for (const file of files) {
      if (file.startsWith('supabase_backup_') && file.endsWith('.dump')) {
        const filePath = path.join(BACKUP_DIR, file);
        const fStat = fs.statSync(filePath);
        const ageDays = (now - fStat.mtimeMs) / (1000 * 60 * 60 * 24);
        if (ageDays > RETENTION_DAYS) {
          fs.unlinkSync(filePath);
          log(`Pruned old backup: ${file}`);
        }
      }
    }
  } catch (err) {
    log(`Backup failed: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  runBackup();
}

module.exports = { runBackup };
