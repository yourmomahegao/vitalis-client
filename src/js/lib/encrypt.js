const Encrypt = {};
Encrypt.KeyReady = false;
Encrypt.SavedKey = "";
Encrypt.EncryptionKeyCheckData = "KEY_VALID";
Encrypt.EncryptionKeyCheckFilepath = path.join(app.getPath("userData"), ".encryption-key-check");
Encrypt.EncryptionSaltFilepath = path.join(app.getPath("userData"), ".encryption-salt");

Encrypt.getEncryptionSalt = function () {
  if (fs.existsSync(Encrypt.EncryptionSaltFilepath)) {
    return fs.readFileSync(Encrypt.EncryptionSaltFilepath);
  }

  const salt = crypto.randomBytes(16);
  fs.writeFileSync(Encrypt.EncryptionSaltFilepath, salt);
  return salt;
};

const encryptionSalt = Encrypt.getEncryptionSalt();

Encrypt.deriveKey = function (key) {
  return crypto.scryptSync(String(key), encryptionSalt, 32);
};

Encrypt.encryptData = function (key, data) {
  const derivedKey = Encrypt.deriveKey(key);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(String(data), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
};

Encrypt.decryptData = function (key, data) {
  const derivedKey = Encrypt.deriveKey(key);
  const payload = Buffer.from(data, "base64");

  if (payload.length < 28) {
    throw new Error("Invalid encrypted payload");
  }

  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};

Encrypt.isEncryptionKeyExists = async function () {
  try {
    await fsa.access(Encrypt.EncryptionKeyCheckFilepath);
    return true;
  } catch (err) {
    return false;
  }

  return true;
};

Encrypt.saveEncryptionKey = async function (key) {
  let encryptedFileData;
  try {
    encryptedFileData = Encrypt.encryptData(key, Encrypt.EncryptionKeyCheckData);
  } catch (err) {
    return { status: false, message: err.message };
  }

  try {
    await fsa.writeFile(Encrypt.EncryptionKeyCheckFilepath, encryptedFileData, "utf8");
  } catch (err) {
    return { status: false, message: err.message };
  }

  return { status: true, message: null };
};

Encrypt.checkEncryptionKey = async function (key) {
  let fileData;
  try {
    fileData = await fsa.readFile(Encrypt.EncryptionKeyCheckFilepath, "utf8");
  } catch (err) {
    return { status: false, message: err.message };
  }

  let decryptedFileData;
  try {
    decryptedFileData = Encrypt.decryptData(key, fileData);
  } catch (err) {
    return { status: false, message: "Wrong encryption key" };
  }

  if (decryptedFileData !== Encrypt.EncryptionKeyCheckData) {
    return { status: false, message: "Wrong encryption key" };
  }

  return { status: true, message: null };
};

Encrypt.resetEncryptionKey = async function () {
  Encrypt.KeyReady = false;
  Encrypt.SavedKey = "";

  try {
    await fsa.unlink(Encrypt.EncryptionKeyCheckFilepath);
  } catch {}

  try {
    await fsa.unlink(Encrypt.EncryptionSaltFilepath);
  } catch {}
};

$(document).on("encryption-key-present", function () {
  Encrypt.KeyReady = true;
});
