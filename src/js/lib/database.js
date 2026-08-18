const SQLite = {};

SQLite.DatabasePath = path.join(app.getPath("userData"), "app.db");
SQLite.Database = new Database(SQLite.DatabasePath);
SQLite.Database.pragma("journal_mode = WAL");
SQLite.Database.pragma("busy_timeout = 5000");

SQLite.Database.exec(`CREATE TABLE IF NOT EXISTS vt_servers (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        icon TEXT NOT NULL,
                        label TEXT NOT NULL,
                        address_encoded TEXT NOT NULL,
                        port_encoded TEXT NOT NULL,
                        secret_key_encoded TEXT NOT NULL,
                        "schema" TEXT NOT NULL DEFAULT 'http://'
                      );`);

SQLite.Database.exec(`CREATE TABLE IF NOT EXISTS vt_servers_tokens (
                        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                        server_id INTEGER NOT NULL UNIQUE,
                        access_token_encoded TEXT NOT NULL,
                        valid_until TEXT NOT NULL,
                        CONSTRAINT vt_servers_tokens_vt_servers_FK FOREIGN KEY (server_id) REFERENCES vt_servers(id)
                      );`);

SQLite.WipeAllData = function () {
  SQLite.Database.exec(`DELETE FROM vt_servers_tokens;`);
  SQLite.Database.exec(`DELETE FROM vt_servers;`);
  SQLite.Database.exec(`DELETE FROM sqlite_sequence WHERE name IN ('vt_servers', 'vt_servers_tokens');`);
};

app.on("before-quit", () => {
  SQLite.Database.close();
});
