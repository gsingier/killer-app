import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allow environment variable DB_PATH for Docker volume persistence (e.g. /app/data/killer.db)
const defaultDbPath = path.join(__dirname, '..', 'killer.db');
const dbPath = process.env.DB_PATH || defaultDbPath;

// Ensure parent directory exists for DB file
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable Foreign Keys & Write-Ahead Logging for performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    winner_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    pseudo TEXT NOT NULL,
    secret_code TEXT NOT NULL,
    role TEXT DEFAULT 'player',
    is_alive BOOLEAN DEFAULT 1,
    kills_count INTEGER DEFAULT 0,
    socket_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    game_id TEXT,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    is_custom BOOLEAN DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    killer_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    mission_id TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (killer_id) REFERENCES users(id),
    FOREIGN KEY (target_id) REFERENCES users(id),
    FOREIGN KEY (mission_id) REFERENCES missions(id)
  );

  CREATE TABLE IF NOT EXISTS kill_logs (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    killer_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    mission_description TEXT NOT NULL,
    killed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
  );
`);

console.log(`✅ Base de données SQLite initialisée sur ${dbPath}`);

export default db;
