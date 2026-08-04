const { app, BrowserWindow } = require("electron");

try {
  require("electron-reloader")(module, {
    watchRenderer: true,
  });
} catch (_) {}

require("@electron/remote/main").initialize();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    autoHideMenuBar: true,
  });

  require("@electron/remote/main").enable(win.webContents);

  win.loadFile("src/index.html");
  win.webContents.openDevTools()
};

app.whenReady().then(() => {
  createWindow();
});
