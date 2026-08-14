$(function () {
  const $body = $("body");
  setTimeout(() => {
    $body[0].removeAttribute("no-transitions");
  }, 100);
});

var serversManager = null;
var serverAddManager = null;
var dashboard = null;
$(function () {
  serversManager = new ServersManager();
  serverAddManager = new ServerAddManager();
  dashboard = new Dashboard();

  let serversInitialized = false;

  // Checking for encryption key to be ready
  const ServerInitializationInterval = setInterval(async function () {
    if (serversInitialized) {
      clearInterval(ServerInitializationInterval);
      return;
    }

    if (!Encrypt.KeyReady) {
      return;
    }

    clearInterval(ServerInitializationInterval);

    await serversManager.UpdateServers();
    await dashboard.Preload();

    serversInitialized = true;
  }, 100);
});
