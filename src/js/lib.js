const path = require("path");
const fs = require('node:fs');
const fsa = fs.promises;
const $ = require("jquery");
const { ipcRenderer } = require('electron')
const Database = require("better-sqlite3");
const { app } = require("@electron/remote");
const crypto = require("crypto");