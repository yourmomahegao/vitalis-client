var Servers = [];

var ServersConfig = {
  DefaultServerIconPath: "./../src/icons/server-default.svg",
};

class Server {
  constructor($serversContainer, $serverContainer, id, icon, label, address, port, secretKey, schema) {
    this.$ServersContainer = $serversContainer;
    this.$ServerContainer = $serverContainer;
    this.Id = id;
    this.Icon = icon;
    this.Label = label;
    this.Address = address;
    this.Port = port;
    this.SecretKey = secretKey;
    this.Schema = schema;

    this.Selected = false;
    this.Status = false;
    this.AccessToken = null;
    this.AccessTokenValidUntil = null;

    this.UpdateDelay = 15000;
    this.UpdateInterval = null;

    this.$ServerOpenActions = this.$ServerContainer.find(".server-open-actions");
    this.$ServerChapter = $('.chapter-container[data-chapter-name="servers"]');
    this.$ServerMenu = this.$ServerChapter.find(".server-menu");

    this.$ServerOpenActions.on("click", { self: this }, this.#Handler__OpenActions);
    this.$ServerMenu.on("click", '.server-menu-button[data-menu-action="delete-server"]', { self: this }, this.#Handler__DeleteServerClick);
    this.$ServerMenu.on("click", '.server-menu-button[data-menu-action="refresh-server"]', { self: this }, this.#Handler__RefreshServerClick);
    this.$ServerMenu.on("click", '.server-menu-button[data-menu-action="open-server"]', { self: this }, this.#Handler__OpenServerClick);
  }

  Select() {
    for (const server of Servers) {
      server.Selected = false;

      if (server === this) {
        server.Selected = true;
      }
    }

    localStorage.setItem("VITALIS_SELECTED_SERVER_ID", this.Id);
  }

  MoveToDashboard() {
    $('.sidebar-container .sidebar-buttons-container .chapter-button[data-chapter-name="dashboard"]').trigger("click");
  }

  GetTokenFromDatabase() {
    const serverTokenQuery = SQLite.Database.prepare(`SELECT * FROM vt_servers_tokens WHERE server_id = ?`);

    let serverTokenData = serverTokenQuery.all(this.Id);
    serverTokenData = serverTokenData[0] ?? null;

    if (serverTokenData) {
      serverTokenData.access_token = Encrypt.decryptData(Encrypt.SavedKey, serverTokenData.access_token_encoded);
    }

    return serverTokenData ?? null;
  }

  CheckExpirationDatetime(expirationDatetimeString) {
    if (!expirationDatetimeString) {
      return true;
    }

    const currentDatetime = new Date();
    const expirationDatetime = new Date(expirationDatetimeString);

    if (isNaN(expirationDatetime.getTime())) {
      return true;
    }

    return currentDatetime > expirationDatetime;
  }

  SaveTokenToDatabase() {
    if (!this.Id || !this.AccessToken || !this.AccessTokenValidUntil) {
      return;
    }

    const serverUpsertTokenQuery = SQLite.Database.prepare(`INSERT INTO vt_servers_tokens
                                                              (server_id, access_token_encoded, valid_until)
                                                            VALUES
                                                              (?, ?, ?)
                                                            ON CONFLICT(server_id) DO UPDATE SET
                                                              access_token_encoded = excluded.access_token_encoded,
                                                              valid_until = excluded.valid_until`);
    ``;

    serverUpsertTokenQuery.run(this.Id, Encrypt.encryptData(Encrypt.SavedKey, this.AccessToken), this.AccessTokenValidUntil);
  }

  async ValidateAccessToken() {
    if (!this.Status) {
      return;
    }

    // Token already in memory and still valid — nothing to do
    if (this.AccessToken && this.AccessTokenValidUntil && !this.CheckExpirationDatetime(this.AccessTokenValidUntil)) {
      return;
    }

    // Token exists in database and still valid — reuse it
    const savedAccessToken = this.GetTokenFromDatabase();

    if (savedAccessToken && !this.CheckExpirationDatetime(savedAccessToken.valid_until)) {
      this.AccessToken = savedAccessToken.access_token;
      this.AccessTokenValidUntil = savedAccessToken.valid_until;
      return;
    }

    // Renewing access token
    const betterAjaxToken = new BetterAjax(`${this.Schema}${this.Address}:${this.Port}/auth/token/`, { secret_key: this.SecretKey }, "POST");

    const [ajaxStatus, response] = await betterAjaxToken.Run();

    if (!ajaxStatus) {
      return;
    }

    if (response && response?.status === true) {
      this.AccessToken = response?.data?.access_token ?? null;
      this.AccessTokenValidUntil = response?.data?.valid_until ?? null;
      await this.SaveTokenToDatabase();
    }
  }

  async GetSystemMetric(name, parameters) {
    await this.ValidateAccessToken();

    if (!this.AccessToken) {
      return null;
    }

    const metricAjax = new BetterAjax(`${this.Schema}${this.Address}:${this.Port}/info/system/${name}/`, parameters, "POST", { Authorization: `Bearer ${this.AccessToken}` });

    const [ajaxStatus, response] = await metricAjax.Run();

    if (!ajaxStatus) {
      return null;
    }

    if (response && response?.status === true) {
      return response?.data ?? null;
    }

    return null;
  }

  async OpenInDashboard() {
    this.Select();
    this.MoveToDashboard();
    await dashboard.Update();
  }

  async GetStatus() {
    const path = `/worker/status/`;
    const url = `${this.Schema}${this.Address}:${this.Port}${path}`;

    let response = null;
    try {
      response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(1000),
      });
    } catch {}

    if (response == null) {
      return false;
    }

    let data = null;
    try {
      data = await response.json();
    } catch {}

    if (data == null) {
      return false;
    }

    if (data.status != true) {
      return false;
    }

    return true;
  }

  async UpdateStatus() {
    this.Status = await this.GetStatus();

    if (!this.Status) {
      this.$ServerContainer.find(".server-info .server-online").removeClass("online");
      return;
    }

    this.$ServerContainer.find(".server-info .server-online").addClass("online");
  }

  async Update() {
    await this.UpdateStatus();
    await this.ValidateAccessToken();
  }

  async Preload() {
    const self = this;

    await this.Update();

    if (!this.UpdateInterval) {
      this.UpdateInterval = setInterval(function () {
        if (self.$ServerChapter.hasClass("hidden")) {
          return;
        }

        self.Update();
      }, this.UpdateDelay);
    }
  }

  DeleteElement() {
    this.$ServerContainer.remove();
  }

  DeleteObject() {
    const serverIndex = Servers.indexOf(this);
    if (serverIndex > -1) {
      Servers.splice(serverIndex, 1);
    }
  }

  async Delete() {
    const serverTokenDeleteQuery = SQLite.Database.prepare(
      `DELETE FROM vt_servers_tokens
       WHERE server_id=?`,
    );

    const serverDeleteQuery = SQLite.Database.prepare(
      `DELETE FROM vt_servers
       WHERE id=?`,
    );

    serverTokenDeleteQuery.run(this.Id);
    serverDeleteQuery.run(this.Id);

    this.DeleteElement();
    this.DeleteObject();
  }

  IsMenuOpened() {
    return !this.$ServerMenu.hasClass("hidden");
  }

  GetMenuDimensions() {
    const itemEl = this.$ServerContainer?.[0];
    const menuParentEl = this.$ServerMenu?.[0]?.offsetParent;

    if (!itemEl || !menuParentEl) return {};

    const itemRect = itemEl.getBoundingClientRect();
    const parentRect = menuParentEl.getBoundingClientRect();

    const dimensions = {
      top: itemRect.top - parentRect.top + menuParentEl.scrollTop,
      left: itemRect.left - parentRect.left + menuParentEl.scrollLeft,
      width: this.$ServerContainer?.outerWidth(),
      height: this.$ServerContainer?.outerHeight(),
    };

    return dimensions;
  }

  ApplyMenuDimenstions(dimensions) {
    const serversContainerRect = this.$ServersContainer[0].getBoundingClientRect();
    const serversContainerTop = serversContainerRect.top;
    const serversContainerLeft = serversContainerRect.left;
    const serversContainerWidth = this.$ServersContainer.width();
    const serversContainerHeight = this.$ServersContainer.height();
    const serverMenuWidth = this.$ServerMenu.width();

    this.$ServerMenu.css("top", dimensions.top);

    if (dimensions.left + dimensions.width + 12 > serversContainerWidth - serversContainerLeft) {
      this.$ServerMenu.css("left", dimensions.left + dimensions.width - serverMenuWidth - 84);
    } else {
      this.$ServerMenu.css("left", dimensions.left + dimensions.width + 12);
    }
  }

  UpdateMenuPosition() {
    const dimensions = this.GetMenuDimensions();
    this.ApplyMenuDimenstions(dimensions);
  }

  UpdateMenuUsedBy() {
    this.$ServerMenu.attr("data-used-by", this.Id);
  }

  GetMenuUsedBy() {
    const lastUsedBy = this.$ServerMenu.attr("data-used-by");
    return lastUsedBy ? parseInt(lastUsedBy) || -1 : -1;
  }

  CloseMenu() {
    this.$ServersContainer.off(`scroll.server-${this.Id}`);
    this.$ServerMenu.addClass("hidden");
  }

  OpenMenu() {
    const self = this;

    this.$ServerMenu.removeClass("hidden");
    this.UpdateMenuPosition();
    this.UpdateMenuUsedBy();

    this.$ServersContainer.on(`scroll.server-${this.Id}`, function () {
      self.UpdateMenuPosition();
    });
  }

  #Handler__OpenActions(event) {
    const self = event.data.self;

    const menuUsedBy = self.GetMenuUsedBy();

    if (menuUsedBy != self.Id) {
      self.CloseMenu();
      self.OpenMenu();
      return;
    }

    self.IsMenuOpened() ? self.CloseMenu() : self.OpenMenu();
  }

  async #Handler__DeleteServerClick(event) {
    const self = event.data.self;
    const menuUsedBy = self.GetMenuUsedBy();

    if (self.Id != menuUsedBy) {
      return;
    }

    self.CloseMenu();
    await self.Delete();
  }

  async #Handler__RefreshServerClick(event) {
    const self = event.data.self;

    const menuUsedBy = self.GetMenuUsedBy();

    if (self.Id != menuUsedBy) {
      return;
    }

    self.CloseMenu();
    await self.Update();
  }

  async #Handler__OpenServerClick(event) {
    const self = event.data.self;

    const menuUsedBy = self.GetMenuUsedBy();

    if (self.Id != menuUsedBy) {
      return;
    }

    self.CloseMenu();
    await self.OpenInDashboard();
  }
}
class ServersManager {
  constructor() {
    this.$ServerChapter = $('.chapter-container[data-chapter-name="servers"]');
    this.$ServersContainer = this.$ServerChapter.find(".servers-container");
    this.$NoServersContainer = this.$ServerChapter.find(".no-servers-container");

    this.$ImportServersButton = this.$ServerChapter.find(".chapter-action.import-servers-button");
    this.$ExportServersButton = this.$ServerChapter.find(".chapter-action.export-servers-button");

    // When "Load servers" button was clicked
    this.$ImportServersButton.on("click", { self: this }, this.#Handler__ImportServersClick);

    // When "Export servers" button was clicked
    this.$ExportServersButton.on("click", { self: this }, this.#Handler__ExportServersClick);
  }

  async Base64ToServerIcon(base64Data, quality = 80) {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const cleanBuffer = Buffer.from(cleanBase64, "base64");

    const image = await sharp(cleanBuffer);
    const cleanOutputBuffer = await image.resize(128, 128, { fit: "inside" }).webp({ quality }).toBuffer();
    const outputBuffer = `data:image/webp;base64,${cleanOutputBuffer.toString("base64")}`;
    return outputBuffer.toString("base64");
  }

  async GetImageDimensions(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = source;
    });
  }

  async SaveServer(icon, label, address, port, secretKey, schema) {
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

  async GetAllServers() {
    const serversGetAllQuery = SQLite.Database.prepare(`SELECT *
                                                        FROM vt_servers
                                                        ORDER BY id DESC;`);

    let serversData = [];

    try {
      serversData = serversGetAllQuery.all();

      for (const serverIndex in serversData) {
        const serverData = serversData[serverIndex];

        const addressEncoded = serverData?.address_encoded;
        const portEncoded = serverData?.port_encoded;
        const secretKeyEncoded = serverData?.secret_key_encoded;

        serversData[serverIndex].address = Encrypt.decryptData(Encrypt.SavedKey, addressEncoded);
        serversData[serverIndex].port = Encrypt.decryptData(Encrypt.SavedKey, portEncoded);
        serversData[serverIndex].secretKey = Encrypt.decryptData(Encrypt.SavedKey, secretKeyEncoded);
      }
    } catch {}

    return serversData;
  }

  UpdateNoServers() {
    const serversAmount = this.$ServersContainer.find(".server-container").length;
    if (serversAmount == 0) {
      this.$NoServersContainer.removeClass("hidden");
      this.$ServersContainer.addClass("hidden");
    } else {
      this.$NoServersContainer.addClass("hidden");
      this.$ServersContainer.removeClass("hidden");
    }
  }

  async TestServerConnection(address, port, secretKey, schema) {
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

  async AddServer(_id, icon, label, address, port, secretKey, schema) {
    const $newServer = $(`<div class="server-container" data-id="${_id ?? -1}">
                <div class="server-icon">
                  <img src="${icon ?? ServersConfig.DefaultServerIconPath}" alt="" />
                </div>

                <div class="server-info">
                  <div class="server-online"></div>
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

                <button class="server-open-actions">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-icon lucide-ellipsis"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </button>
              </div>`);

    const newServer = new Server(this.$ServersContainer, $newServer, _id, icon, label, address, port, secretKey, schema);
    await newServer.Preload();
    Servers.push(newServer);

    this.$ServersContainer.append($newServer);
    this.UpdateNoServers();
  }

  async UpdateServers() {
    this.$ServersContainer.empty();
    const allServers = await this.GetAllServers();

    for (const serverData of allServers) {
      await this.AddServer(serverData?.id, serverData?.icon, serverData?.label, serverData?.address, serverData?.port, serverData?.secretKey, serverData?.schema);
    }

    this.UpdateNoServers();
  }

  async ExportServersToFile() {
    const allServers = await this.GetAllServers();

    const exportData = allServers.map((server) => ({
      icon: server.icon,
      label: server.label,
      address: server.address,
      port: server.port,
      secretKey: server.secretKey,
      schema: server.schema,
    }));

    const saveDialogResult = await dialog.showSaveDialog({
      title: "Export servers configuration",
      defaultPath: "vitalis-servers.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (saveDialogResult.canceled || !saveDialogResult.filePath) {
      return;
    }

    try {
      await fsa.writeFile(saveDialogResult.filePath, JSON.stringify(exportData, null, 2), "utf-8");
      new Notification("Servers configuration was exported successfully", Notification.Type.SUCCESS, 7000).Show();
    } catch {
      new Notification("Failed to write servers configuration file", Notification.Type.ERROR, 7000).Show();
    }
  }

  async ImportServersFromFile() {
    const openDialogResult = await dialog.showOpenDialog({
      title: "Load servers configuration",
      filters: [{ name: "JSON", extensions: ["json"] }],
      properties: ["openFile"],
    });

    if (openDialogResult.canceled || !openDialogResult.filePaths?.length) {
      return;
    }

    let importedServers;
    try {
      const fileContents = await fsa.readFile(openDialogResult.filePaths[0], "utf-8");
      importedServers = JSON.parse(fileContents);
    } catch {
      new Notification("Failed to read servers configuration file", Notification.Type.ERROR, 7000).Show();
      return;
    }

    if (!Array.isArray(importedServers)) {
      new Notification("Servers configuration file has an invalid format", Notification.Type.ERROR, 7000).Show();
      return;
    }

    let importedCount = 0;

    for (const server of importedServers) {
      if (!server?.label || !server?.address || !server?.port || !server?.secretKey || !server?.schema) {
        continue;
      }

      const saveServerResult = await this.SaveServer(server.icon, server.label, server.address, server.port, server.secretKey, server.schema);

      if (saveServerResult.status == false) {
        continue;
      }

      const serverData = saveServerResult?.data ?? {};
      await this.AddServer(serverData?.id, serverData?.icon, serverData?.label, serverData?.address, serverData?.port, serverData?.secretKey, serverData?.schema);
      importedCount++;
    }

    if (importedCount === 0) {
      new Notification("No valid servers were found in the configuration file", Notification.Type.WARNING, 7000).Show();
      return;
    }

    new Notification(`Imported ${importedCount} server(s) successfully`, Notification.Type.SUCCESS, 7000).Show();
  }

  async #Handler__ImportServersClick(event) {
    const self = event.data.self;

    if (!Encrypt.KeyReady) {
      new Notification("User's encryption key is not ready yet!", Notification.Type.WARNING, 7000).Show();
      return;
    }

    await self.ImportServersFromFile();
  }

  async #Handler__ExportServersClick(event) {
    const self = event.data.self;

    if (!Encrypt.KeyReady) {
      new Notification("User's encryption key is not ready yet!", Notification.Type.WARNING, 7000).Show();
      return;
    }

    await self.ExportServersToFile();
  }
}

class ServerAddManager {
  constructor() {
    this.$AddServerButton = $(".chapter-container .chapter-sub-container .chapter-actions .chapter-action.add-server-button");
    this.$AddServerCustomWindow = $(".add-server-custom-window");
    this.$AddServerContainer = $(".add-server-container");
    this.$AddServerActions = this.$AddServerContainer.find(".add-server-actions");
    this.$AddServerMessage = this.$AddServerContainer.find(".add-server-message");
    this.$AddServerApplyButton = this.$AddServerActions.find("#add-server-apply");
    this.$AddServerTestConnection = this.$AddServerActions.find("#add-server-test-connection");

    this.$AddServerFields = $(".add-server-fields");
    this.$AddServerFieldIconSelector = this.$AddServerFields.find(".icon-selector");
    this.$AddServerIconPreview = this.$AddServerFieldIconSelector.find("#icon-preview");
    this.$AddServerIcon = this.$AddServerFieldIconSelector.find("#icon");
    this.$AddServerFieldLabel = this.$AddServerFields.find("#label");
    this.$AddServerFieldAddress = this.$AddServerFields.find("#address");
    this.$AddServerFieldPort = this.$AddServerFields.find("#port");
    this.$AddServerFieldSecretKey = this.$AddServerFields.find("#secret-key");
    this.$AddServerFieldSchema = this.$AddServerFields.find("#schema");

    // When server icon was changed in "Add server" container
    this.$AddServerIcon.on("change", { self: this }, this.#Handler__AddServerIconChange);

    // When "Add server" button was clicked
    this.$AddServerButton.on("click", { self: this }, this.#Handler__AddServerButtonClick);

    // When "Test connection" button was clicked in "Add server" container
    this.$AddServerTestConnection.on("click", { self: this }, this.#Handler__AddServerTestConnectionClick);

    // When server icon was clicked in "Add server" container
    this.$AddServerIcon.on("click", { self: this }, this.#Handler__AddServerIconClick);

    // When user's trying to add new server
    this.$AddServerApplyButton.on("click", { self: this }, this.#Handler__AddServerApplyButtonClick);
  }

  ShowAddServerWindow() {
    this.$AddServerCustomWindow.removeClass("hidden");
  }

  HideAddServerWindow() {
    this.$AddServerCustomWindow.addClass("hidden");
  }

  ResetAddServerContainer() {
    this.$AddServerFieldLabel.val("");
    this.$AddServerFieldAddress.val("");
    this.$AddServerFieldPort.val("");
    this.$AddServerFieldSecretKey.val("");
    this.$AddServerFieldSchema.find("option:first-child").prop("selected", true);
    this.$AddServerIconPreview.attr("src", ServersConfig.DefaultServerIconPath);
    this.ResetAddServerMessage();
  }

  ResetAddServerMessage() {
    this.$AddServerMessage.text("");
    this.$AddServerMessage.attr("data-test-status", true);
    this.$AddServerMessage.addClass("hidden");
  }

  UpdateAddServerMessage(status, message) {
    this.$AddServerMessage.text(message);
    this.$AddServerMessage.attr("data-test-status", status);
    this.$AddServerMessage.removeClass("hidden");
  }

  async #Handler__AddServerIconChange(event) {
    const self = event.data.self;

    const files = self.$AddServerIcon.prop("files");

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
      const uploadedImageDimesions = await self.GetImageDimensions(uploadedImageSource);

      // Checking for maximum dimensions
      if (uploadedImageDimesions.width > 1024 || uploadedImageDimesions.height > 1024) {
        new Notification("The image is too big! Maximum: 1024x1024.", Notification.Type.ERROR, 7000).Show();
        return;
      }

      // Converting and applying image to icon preview
      try {
        const webpBase64 = await self.Base64ToServerIcon(uploadedImageSource);
        $addServerIconPreview.attr("src", webpBase64);
      } catch {
        new Notification("Image conversion error occured!", Notification.Type.ERROR, 7000).Show();
        return;
      }
    };

    reader.readAsDataURL(uploadedImage);
  }

  #Handler__AddServerButtonClick(event) {
    const self = event.data.self;

    if (!Encrypt.KeyReady) {
      new Notification("User's encryption key is not ready yet!", Notification.Type.WARNING, 7000).Show();
      return;
    }

    self.ResetAddServerContainer();
    self.ShowAddServerWindow();
  }

  async #Handler__AddServerTestConnectionClick(event) {
    const self = event.data.self;

    const address = self.$AddServerFieldAddress.val();
    const port = self.$AddServerFieldPort.val();
    const secretKey = self.$AddServerFieldSecretKey.val();
    const schema = self.$AddServerFieldSchema.find("option:selected").attr("value");

    const testResult = await serversManager.TestServerConnection(address, port, secretKey, schema);

    if (testResult.status == false) {
      self.UpdateAddServerMessage(testResult.status, testResult.message);
      return;
    }

    self.UpdateAddServerMessage(true, "Server is valid");
  }

  async #Handler__AddServerIconClick(event) {
    const self = event.data.self;
  }

  async #Handler__AddServerApplyButtonClick(event) {
    const self = event.data.self;

    if (!Encrypt.KeyReady) {
      new Notification("User's encryption key is not ready yet!", Notification.Type.WARNING, 7000).Show();
      return;
    }

    const icon = self.$AddServerIconPreview.attr("src");
    const label = self.$AddServerFieldLabel.val();
    const address = self.$AddServerFieldAddress.val();
    const port = self.$AddServerFieldPort.val();
    const secretKey = self.$AddServerFieldSecretKey.val();
    const schema = self.$AddServerFieldSchema.find("option:selected").attr("value");

    if (!icon) {
      self.UpdateAddServerMessage(false, "Server icon is not specified");
      self.$AddServerFieldIconSelector.addClass("error");
      return;
    } else {
      self.$AddServerFieldIconSelector.removeClass("error");
    }

    if (!label) {
      self.UpdateAddServerMessage(false, "Server label is not specified");
      self.$AddServerFieldLabel.addClass("error");
      return;
    } else {
      self.$AddServerFieldLabel.removeClass("error");
    }

    if (!address) {
      self.UpdateAddServerMessage(false, "Server address is not specified");
      self.$AddServerFieldAddress.addClass("error");
      return;
    } else {
      self.$AddServerFieldAddress.removeClass("error");
    }

    if (!port) {
      self.UpdateAddServerMessage(false, "Server port is not specified");
      self.$AddServerFieldPort.addClass("error");
      return;
    } else {
      self.$AddServerFieldPort.removeClass("error");
    }

    if (!secretKey) {
      self.UpdateAddServerMessage(false, "Server secret key is not specified");
      self.$AddServerFieldSecretKey.addClass("error");
      return;
    } else {
      self.$AddServerFieldSecretKey.removeClass("error");
    }

    if (!schema) {
      self.UpdateAddServerMessage(false, "Server schema is not specified");
      self.$AddServerFieldSchema.addClass("error");
      return;
    } else {
      self.$AddServerFieldSchema.removeClass("error");
    }

    // Saving server inside the database
    const saveServerResult = await serversManager.SaveServer(icon, label, address, port, secretKey, schema);

    if (saveServerResult.status == false) {
      self.UpdateAddServerMessage(saveServerResult.status, saveServerResult.message);
      return;
    }

    // Adding server inside "Servers" chapter
    const serverData = saveServerResult?.data ?? {};
    serversManager.AddServer(serverData?.id, serverData?.icon, serverData?.label, serverData?.address, serverData?.port, serverData?.secret_key, serverData?.schema);

    self.HideAddServerWindow();
  }
}
