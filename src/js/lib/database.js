const SQLite = {};

SQLite.DatabasePath = path.join(app.getPath("userData"), "app.db");
SQLite.Database = new Database(SQLite.DatabasePath);
SQLite.Database.pragma("journal_mode = WAL");
SQLite.Database.pragma("busy_timeout = 5000");

SQLite.Database.exec(`CREATE TABLE IF NOT EXISTS vt_servers (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        address TEXT NOT NULL,
                        secret_key TEXT NOT NULL,
                        "schema" TEXT NOT NULL DEFAULT 'http://'
                      );`);

app.on("before-quit", () => {
  SQLite.Database.close();
});
