const path = require("path");
const $ = require("jquery");
const { ipcRenderer } = require('electron')
const Database = require("better-sqlite3");
const { app } = require("@electron/remote");
const crypto = require("crypto");