const SQLite = {};

SQLite.encodeData = function (key, data) {
  const derivedKey = crypto.createHash("sha256").update(String(key)).digest();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(String(data), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
};

SQLite.decodeData = function (key, data) {
  const derivedKey = crypto.createHash("sha256").update(String(key)).digest();
  const payload = Buffer.from(data, "base64");

  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};

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

SQLite.Database.exec(`CREATE TABLE IF NOT EXISTS vt_password_check (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        expected TEXT NOT NULL,
                        data TEXT NOT NULL
                      );`);

app.on("before-quit", () => {
  SQLite.Database.close();
});
