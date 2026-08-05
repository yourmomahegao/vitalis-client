const { app, BrowserWindow } = require("electron");
const { ipcMain } = require("electron");

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
    autoHideMenuBar: true,
    transparent: true,
    titleBarStyle: "hidden",
    frame: false,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    autoHideMenuBar: true,
  });

  require("@electron/remote/main").enable(win.webContents);

  win.loadFile("src/index.html");

  win.on("maximize", () => {
    win.webContents.send("window-maximized");
  });

  win.on("unmaximize", () => {
    win.webContents.send("window-unmaximized");
  });

  win.on("minimize", () => {
    win.webContents.send("window-minimized");
  });

  // Minimize window
  ipcMain.on("minimize-window", () => {
    win.minimize();
  });

  // Maximize/Restore window
  ipcMain.on("maximize-window", () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  // Close window
  ipcMain.on("close-window", () => {
    win.close();
  });

  win.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();
});
