import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

// Determine DB Path
const appDataPath = process.env.APPDATA 
  ? path.join(process.env.APPDATA, 'SISTEMAPOS')
  : path.join(process.env.HOME || '', '.sistemapos');

if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
}

const dbPath = path.join(appDataPath, 'nexus.db');
const db = new Database(dbPath);

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS config (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS sales (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS partners (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS activation (id TEXT PRIMARY KEY, data TEXT);
`);

// Generic API helper
const setupTableApi = (tableName: string) => {
  app.get(`/api/${tableName}`, (req, res) => {
    const rows = db.prepare(`SELECT data FROM ${tableName}`).all();
    res.json(rows.map((row: any) => JSON.parse(row.data)));
  });

  app.post(`/api/${tableName}`, (req, res) => {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const insert = db.prepare(`INSERT OR REPLACE INTO ${tableName} (id, data) VALUES (?, ?)`);
    const transaction = db.transaction((items) => {
      for (const item of items) insert.run(item.id, JSON.stringify(item));
    });
    transaction(items);
    res.json({ success: true });
  });

  app.delete(`/api/${tableName}/:id`, (req, res) => {
    db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  });
  
  app.delete(`/api/${tableName}`, (req, res) => {
    db.prepare(`DELETE FROM ${tableName}`).run();
    res.json({ success: true });
  });
};

['users', 'products', 'categories', 'clients', 'sales', 'expenses', 'partners'].forEach(setupTableApi);

// Config is special (single row)
app.get('/api/config', (req, res) => {
  const row = db.prepare("SELECT data FROM config WHERE id = 'main'").get();
  res.json(row ? JSON.parse((row as any).data) : null);
});

app.post('/api/config', (req, res) => {
  db.prepare("INSERT OR REPLACE INTO config (id, data) VALUES ('main', ?)").run(JSON.stringify(req.body));
  res.json({ success: true });
});

// Activation
app.get('/api/activation', (req, res) => {
  const row = db.prepare("SELECT data FROM activation WHERE id = 'main'").get();
  res.json(row ? JSON.parse((row as any).data) : null);
});

app.post('/api/activation', (req, res) => {
  db.prepare("INSERT OR REPLACE INTO activation (id, data) VALUES ('main', ?)").run(JSON.stringify(req.body));
  res.json({ success: true });
});

// Backup & Restore
app.get('/api/backup', (req, res) => {
  try {
    const backupData: any = {};
    ['config', 'users', 'products', 'categories', 'clients', 'sales', 'expenses', 'partners', 'activation'].forEach(table => {
      const rows = db.prepare(`SELECT data FROM ${table}`).all();
      backupData[table] = rows.map((row: any) => JSON.parse(row.data));
    });
    res.json(backupData);
  } catch (e) {
    res.status(500).json({ error: "Backup failed" });
  }
});

app.post('/api/restore', (req, res) => {
  try {
    const data = req.body;
    const tables = ['config', 'users', 'products', 'categories', 'clients', 'sales', 'expenses', 'partners', 'activation'];
    
    const transaction = db.transaction((data) => {
      tables.forEach(table => {
        db.prepare(`DELETE FROM ${table}`).run();
        if (data[table]) {
          const insert = db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`);
          if (table === 'config' || table === 'activation') {
             insert.run('main', JSON.stringify(data[table]));
          } else {
            data[table].forEach((item: any) => insert.run(item.id, JSON.stringify(item)));
          }
        }
      });
    });
    
    transaction(data);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Restore failed" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database stored in: ${dbPath}`);
  });
}

startServer();
