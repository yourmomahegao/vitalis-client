var Servers = [];

$(document).ready(function () {
  const $serverChapter = $('.chapter-container[data-chapter-name="servers"]');
  const $serversContainer = $serverChapter.find(".servers-container");
  const $noServersContainer = $serverChapter.find(".no-servers-container");

  const $addServerButton = $(".chapter-container .chapter-sub-container .chapter-actions .chapter-action.add-server-button");
  const $addServerCustomWindow = $(".add-server-custom-window");
  const $addServerContainer = $(".add-server-container");
  const $addServerActions = $addServerContainer.find(".add-server-actions");
  const $addServerMessage = $addServerContainer.find(".add-server-message");
  const $addServerApplyButton = $addServerActions.find("#add-server-apply");
  const $addServerTestConnection = $addServerActions.find("#add-server-test-connection");

  const $addServerFields = $(".add-server-fields");
  const $addServerFieldIconSelector = $addServerFields.find(".icon-selector");
  const $addServerIconPreview = $addServerFieldIconSelector.find("#icon-preview");
  const $addServerIcon = $addServerFieldIconSelector.find("#icon");
  const $addServerFieldLabel = $addServerFields.find("#label");
  const $addServerFieldAddress = $addServerFields.find("#address");
  const $addServerFieldPort = $addServerFields.find("#port");
  const $addServerFieldSecretKey = $addServerFields.find("#secret-key");
  const $addServerFieldSchema = $addServerFields.find("#schema");

  const defaultServerIconPath = "./../src/icons/server-default.svg";
  let serversInitialized = false;

  async function Base64ToServerIcon(base64Data, quality = 80) {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const cleanBuffer = Buffer.from(cleanBase64, "base64");

    const image = await sharp(cleanBuffer);
    const cleanOutputBuffer = await image.resize(128, 128, { fit: "inside" }).webp({ quality }).toBuffer();
    const outputBuffer = `data:image/webp;base64,${cleanOutputBuffer.toString("base64")}`;
    return outputBuffer.toString("base64");
  }

  async function GetImageDimensions(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = source;
    });
  }

  function ShowAddServerWindow() {
    $addServerCustomWindow.removeClass("hidden");
  }

  function HideAddServerWindow() {
    $addServerCustomWindow.addClass("hidden");
  }

  function ResetAddServerContainer() {
    $addServerFieldLabel.val("");
    $addServerFieldAddress.val("");
    $addServerFieldPort.val("");
    $addServerFieldSecretKey.val("");
    $addServerFieldSchema.find("option:first-child").prop("selected", true);
    $addServerMessage.text("");
    $addServerMessage.attr("data-test-status", true);
    $addServerMessage.addClass("hidden");
    $addServerIconPreview.attr("src", defaultServerIconPath);
  }

  function UpdateAddServerMessage(status, message) {
    $addServerMessage.text(message);
    $addServerMessage.attr("data-test-status", status);
    $addServerMessage.removeClass("hidden");
  }

  async function TestServerConnection(address, port, secretKey, schema) {
    const path = `/worker/status/`;
    const url = `${schema}${address}:${port}${path}`;

    let response = null;
    try {
      response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(1000),
      });
    } catch {}

    if (response == null) {
      return { status: false, message: "Couldn't send a request to the server" };
    }

    let data = null;
    try {
      data = await response.json();
    } catch {}

    if (data == null) {
      return { status: false, message: "Failed to receive response data from the server" };
    }

    if (data.status != true) {
      return { status: false, message: "Server responded, but reported it isn't ready" };
    }

    const keyCheckPath = `/auth/secret/check/`;
    const keyCheckUrl = `${schema}${address}:${port}${keyCheckPath}`;

    response = null;
    try {
      const requestData = new FormData();
      requestData.append("secret_key", secretKey);

      response = await fetch(keyCheckUrl, {
        method: "POST",
        body: requestData,
        signal: AbortSignal.timeout(1000),
      });
    } catch {}

    if (response == null) {
      return { status: false, message: "The server cannot identify the secret key" };
    }

    data = null;
    try {
      data = await response.json();
    } catch {}

    if (data.status != true) {
      return { status: false, message: "Secret key is invalid" };
    }

    return { status: true, message: "The server is ready to work" };
  }

  async function SaveServer(icon, label, address, port, secretKey, schema) {
    let addressEncoded;
    let portEncoded;
    let secretKeyEncoded;

    try {
      addressEncoded = Encrypt.encryptData(Encrypt.SavedKey, address);
      portEncoded = Encrypt.encryptData(Encrypt.SavedKey, port);
      secretKeyEncoded = Encrypt.encryptData(Encrypt.SavedKey, secretKey);
    } catch {
      return { status: false, message: "Failed to encode server parameters", data: {} };
    }

    let serverInsertData;
    try {
      const serverInsertQuery = SQLite.Database.prepare(`INSERT INTO vt_servers (icon, label, address_encoded, port_encoded, secret_key_encoded, schema) 
                                                VALUES (?, ?, ?, ?, ?, ?) 
                                                RETURNING *`);

      serverInsertData = serverInsertQuery.all(icon, label, addressEncoded, portEncoded, secretKeyEncoded, schema);
      serverInsertData = serverInsertData[0];
    } catch {
      return { status: false, message: "Couldn't save server to the database", data: {} };
    }

    serverInsertData.address = Encrypt.decryptData(Encrypt.SavedKey, addressEncoded);
    serverInsertData.port = Encrypt.decryptData(Encrypt.SavedKey, portEncoded);
    serverInsertData.secretKey = Encrypt.decryptData(Encrypt.SavedKey, secretKeyEncoded);

    return { status: true, message: "Server was successfully added to the database", data: serverInsertData };
  }

  async function GetAllServers() {
    const serversGetAllQuery = SQLite.Database.prepare(`SELECT * 
                                                        FROM vt_servers
                                                        ORDER BY id DESC;`);

    let serversData = [];

    try {
      serversData = serversGetAllQuery.all();

      for (const serverIndex in serversData) {
        const serverData = serversData[serverIndex];
        serversData[serverIndex].address = Encrypt.decryptData(Encrypt.SavedKey, addressEncoded);
        serversData[serverIndex].port = Encrypt.decryptData(Encrypt.SavedKey, portEncoded);
        serversData[serverIndex].secretKey = Encrypt.decryptData(Encrypt.SavedKey, secretKeyEncoded);
      }
    } catch {}

    return serversData;
  }

  function UpdateNoServers() {
    const serversAmount = $serversContainer.find(".server-container").length;
    if (serversAmount == 0) {
      $noServersContainer.removeClass("hidden");
      $serversContainer.addClass("hidden");
    } else {
      $noServersContainer.addClass("hidden");
      $serversContainer.removeClass("hidden");
    }
  }

  function AddServer(_id, icon, label, address, port, secretKey, schema) {
    const $newServer = $(`<div class="server-container" data-id="${_id ?? -1}">
                <div class="server-icon">
                  <img src="${icon ?? defaultServerIconPath}" alt="" />
                </div>

                <div class="server-info">
                  <div class="server-online online"></div>
                  <div class="server-name">${label ?? "No label"}</div>
                </div>

                <div class="server-additional-infos">
                  <div class="server-additional-info server-schema">
                    <span class="label">Schema:</span>
                    <span class="value">${schema ?? "No schema"}</span>
                  </div>

                  <div class="server-additional-info server-address">
                    <span class="label">Address:</span>
                    <span class="value">${address ?? "No address"}</span>
                  </div>

                  <div class="server-additional-info server-port">
                    <span class="label">Port:</span>
                    <span class="value">${port ?? "No port"}</span>
                  </div>
                </div>
              </div>`);

    Servers.push({
      id: _id,
      icon: icon,
      label: label,
      address: address,
      port: port,
      secretKey: secretKey,
      schema: schema,
    });

    $serversContainer.append($newServer);
    UpdateNoServers();
  }

  async function UpdateServers() {
    $serversContainer.empty();
    const allServers = await GetAllServers();

    for (const serverData of allServers) {
      AddServer(serverData?.id, serverData?.icon, serverData?.label, serverData?.address, serverData?.port, serverData?.secret_key, serverData?.schema);
    }

    UpdateNoServers();
  }

  // Checking for encryption key to be ready
  const ServerInitializationInterval = setInterval(async function () {
    if (serversInitialized) {
      clearInterval(ServerInitializationInterval);
      return;
    }

    if (!Encrypt.KeyReady) {
      return;
    }

    await UpdateServers();

    serversInitialized = true;
    clearInterval(ServerInitializationInterval);
  }, 100);

  // When server icon was changed in "Add server" container
  $addServerIcon.on("change", async function (event) {
    const files = $addServerIcon.prop("files");

    if (files.length === 0) {
      return;
    }

    const uploadedImage = files[0];

    if (!uploadedImage.type.startsWith("image/")) {
      return;
    }

    const uploadedImageObject = new Image(uploadedImage);
    const reader = new FileReader();

    reader.onload = async function (event) {
      // Converting image to webp buffer
      const uploadedImageSource = event.target.result;
      const uploadedImageDimesions = await GetImageDimensions(uploadedImageSource);

      // Checking for maximum dimensions
      if (uploadedImageDimesions.width > 1024 || uploadedImageDimesions.height > 1024) {
        new Notification("The image is too big! Maximum: 1024x1024.", Notification.Type.ERROR, 7000).Show();
        return;
      }

      // Converting and applying image to icon preview
      try {
        const webpBase64 = await Base64ToServerIcon(uploadedImageSource);
        $addServerIconPreview.attr("src", webpBase64);
      } catch {
        new Notification("Image conversion error occured!", Notification.Type.ERROR, 7000).Show();
        return;
      }
    };

    reader.readAsDataURL(uploadedImage);
  });

  // When "Add server" button was clicked
  $addServerButton.on("click", function (event) {
    if (!Encrypt.KeyReady) {
      new Notification("User's encryption key is not ready yet!", Notification.Type.WARNING, 7000).Show();
      return;
    }

    ResetAddServerContainer();
    ShowAddServerWindow();
  });

  // When "Test connection" button was clicked in "Add server" container
  $addServerTestConnection.on("click", async function () {
    const address = $addServerFieldAddress.val();
    const port = $addServerFieldPort.val();
    const secretKey = $addServerFieldSecretKey.val();
    const schema = $addServerFieldSchema.find("option:selected").attr("value");

    const testResult = await TestServerConnection(address, port, secretKey, schema);

    if (testResult.status == false) {
      UpdateAddServerMessage(testResult.status, testResult.message);
      return;
    }
  });

  // When server icon was clicked in "Add server" container
  $addServerIcon.on("click", async function () {});

  // When user's trying to add new server
  $addServerApplyButton.on("click", async function (event) {
    if (!Encrypt.KeyReady) {
      new Notification("User's encryption key is not ready yet!", Notification.Type.WARNING, 7000).Show();
      return;
    }

    const icon = $addServerIconPreview.attr("src");
    const label = $addServerFieldLabel.val();
    const address = $addServerFieldAddress.val();
    const port = $addServerFieldPort.val();
    const secretKey = $addServerFieldSecretKey.val();
    const schema = $addServerFieldSchema.find("option:selected").attr("value");

    if (!icon) {
      UpdateAddServerMessage(false, "Server icon is not specified");
      $addServerFieldIconSelector.addClass("error");
      return;
    } else {
      $addServerFieldIconSelector.removeClass("error");
    }

    if (!label) {
      UpdateAddServerMessage(false, "Server label is not specified");
      $addServerFieldLabel.addClass("error");
      return;
    } else {
      $addServerFieldLabel.removeClass("error");
    }

    if (!address) {
      UpdateAddServerMessage(false, "Server address is not specified");
      $addServerFieldAddress.addClass("error");
      return;
    } else {
      $addServerFieldAddress.removeClass("error");
    }

    if (!port) {
      UpdateAddServerMessage(false, "Server port is not specified");
      $addServerFieldPort.addClass("error");
      return;
    } else {
      $addServerFieldPort.removeClass("error");
    }

    if (!secretKey) {
      UpdateAddServerMessage(false, "Server secret key is not specified");
      $addServerFieldSecretKey.addClass("error");
      return;
    } else {
      $addServerFieldSecretKey.removeClass("error");
    }

    if (!schema) {
      UpdateAddServerMessage(false, "Server schema is not specified");
      $addServerFieldSchema.addClass("error");
      return;
    } else {
      $addServerFieldSchema.removeClass("error");
    }

    // Saving server inside the database
    const saveServerResult = await SaveServer(icon, label, address, port, secretKey, schema);

    if (saveServerResult.status == false) {
      UpdateAddServerMessage(saveServerResult.status, saveServerResult.message);
      return;
    }

    // Adding server inside "Servers" chapter
    const serverData = saveServerResult?.data ?? {};
    AddServer(serverData?.id, serverData?.icon, serverData?.label, serverData?.address, serverData?.port, serverData?.secret_key, serverData?.schema);

    HideAddServerWindow();
  });
});
